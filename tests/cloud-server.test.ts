import { MongoMemoryServer } from "mongodb-memory-server";
import { MongoClient, type Db } from "mongodb";
import { randomUUID } from "node:crypto";
import path from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { createServer, sha256 } from "../server/app";
import { collections, initializeDatabase } from "../server/database";
import { projectAt } from "./helpers";
import { backupSchema } from "../shared/workspace";

describe("MongoDB Google sign-in and account-owned backups", () => {
  let mongo: MongoMemoryServer;
  let client: MongoClient;
  let db: Db;
  let server: Awaited<ReturnType<typeof createServer>>;
  beforeAll(async () => {
    mongo = await MongoMemoryServer.create({
      binary: {
        version: "8.0.17",
        downloadDir: path.resolve(".test-artifacts/mongodb-binaries"),
      },
    });
    client = await new MongoClient(mongo.getUri()).connect();
    db = client.db("test");
    await initializeDatabase(db);
    server = await createServer(db, {
      authorizationUrl: (state, nonce, challenge) =>
        `https://accounts.google.com/test?state=${state}&nonce=${nonce}&code_challenge=${challenge}`,
      exchange: async (code, verifier, nonce) => {
        if (!verifier || !nonce || code === "invalid")
          throw new Error("Identity rejected");
        return { sub: code, email: `${code}@gmail.com`, name: code };
      },
    });
  }, 180000);
  afterAll(async () => {
    await server?.close();
    await client?.close();
    await mongo?.stop();
  });

  const signIn = async (user: string) => {
    const verifier = "a".repeat(43);
    const start = await server.inject({
      method: "POST",
      url: "/auth/desktop/start",
      payload: {
        challenge: sha256(verifier),
        deviceId: randomUUID(),
        deviceName: "Work laptop",
      },
    });
    expect(start.statusCode).toBe(200);
    const { loginId, authorizationUrl } = start.json<{
      loginId: string;
      authorizationUrl: string;
    }>();
    const state = new URL(authorizationUrl).searchParams.get("state");
    expect(
      (
        await server.inject({
          method: "POST",
          url: "/auth/desktop/complete",
          payload: { loginId, verifier: "b".repeat(43) },
        })
      ).statusCode,
    ).toBe(400);
    expect(
      (
        await server.inject({
          method: "POST",
          url: "/auth/desktop/complete",
          payload: { loginId, verifier },
        })
      ).statusCode,
    ).toBe(202);
    expect(
      (
        await server.inject({
          method: "GET",
          url: `/auth/google/callback?state=${state}&code=${user}`,
        })
      ).statusCode,
    ).toBe(200);
    expect(
      (
        await server.inject({
          method: "GET",
          url: `/auth/google/callback?state=${state}&code=${user}`,
        })
      ).statusCode,
    ).toBe(400);
    const complete = await server.inject({
      method: "POST",
      url: "/auth/desktop/complete",
      payload: { loginId, verifier },
    });
    expect(complete.statusCode).toBe(200);
    expect(
      (
        await server.inject({
          method: "POST",
          url: "/auth/desktop/complete",
          payload: { loginId, verifier },
        })
      ).statusCode,
    ).toBe(400);
    return complete.json<{
      token: string;
      account: { id: string; email: string };
    }>();
  };

  it("creates accounts via verified Google identities, rejects replay and hashes device sessions", async () => {
    const first = await signIn("alice");
    const second = await signIn("alice");
    expect(first.account.id).toBe(second.account.id);
    expect(first.token).not.toBe(second.token);
    expect(await collections(db).users.countDocuments()).toBe(1);
    expect(await collections(db).sessions.countDocuments()).toBe(2);
    expect(
      await collections(db).sessions.findOne({ tokenHash: first.token }),
    ).toBeNull();
    expect(
      await collections(db).sessions.findOne({
        tokenHash: sha256(first.token),
      }),
    ).not.toBeNull();
    const headers = { authorization: `Bearer ${first.token}` };
    expect((await server.inject({ url: "/me", headers })).statusCode).toBe(200);
    expect(
      (await server.inject({ method: "POST", url: "/auth/logout", headers }))
        .statusCode,
    ).toBe(204);
    expect((await server.inject({ url: "/me", headers })).statusCode).toBe(401);
    expect(
      (
        await server.inject({
          url: "/me",
          headers: { authorization: `Bearer ${second.token}` },
        })
      ).statusCode,
    ).toBe(200);
  });

  it("keeps multiple immutable per-machine sets isolated between accounts", async () => {
    const alice = await signIn("alice");
    const bob = await signIn("bob");
    const aliceHeaders = { authorization: `Bearer ${alice.token}` };
    const bobHeaders = { authorization: `Bearer ${bob.token}` };
    const snapshot = {
      kind: "dev-bench-project-set",
      schemaVersion: 1,
      exportedAt: new Date().toISOString(),
      sourceDevice: "Windows laptop",
      platform: "win32",
      set: {
        id: randomUUID(),
        name: "Work",
        projects: [projectAt("C:\\Work App")],
      },
      appearance: { theme: "dark", terminalTheme: "rose" },
    };
    const saved = await server.inject({
      method: "POST",
      url: "/backups",
      headers: aliceHeaders,
      payload: snapshot,
    });
    expect(saved.statusCode).toBe(201);
    const id = saved.json<{ id: string }>().id;
    await server.inject({
      method: "POST",
      url: "/backups",
      headers: aliceHeaders,
      payload: {
        ...snapshot,
        sourceDevice: "Personal Mac",
        platform: "darwin",
      },
    });
    expect(
      (await server.inject({ url: "/backups", headers: aliceHeaders })).json(),
    ).toHaveLength(2);
    expect(
      (await server.inject({ url: "/backups", headers: bobHeaders })).json(),
    ).toEqual([]);
    expect(
      (await server.inject({ url: `/backups/${id}`, headers: bobHeaders }))
        .statusCode,
    ).toBe(404);
    expect(
      (
        await server.inject({ url: `/backups/${id}`, headers: aliceHeaders })
      ).json(),
    ).toEqual(backupSchema.parse(snapshot));
    expect((await server.inject({ url: "/backups" })).statusCode).toBe(401);
    expect(
      (
        await server.inject({
          method: "POST",
          url: "/backups",
          headers: aliceHeaders,
          payload: { ...snapshot, schemaVersion: 99 },
        })
      ).statusCode,
    ).toBe(400);
    await collections(db).sessions.updateOne(
      { tokenHash: sha256(alice.token) },
      { $set: { expiresAt: new Date(0) } },
    );
    expect(
      (await server.inject({ url: "/backups", headers: aliceHeaders }))
        .statusCode,
    ).toBe(401);
  });

  it("rejects missing/invalid OAuth state and failed identity verification", async () => {
    expect(
      (
        await server.inject({
          url: "/auth/google/callback?state=not-a-session&code=alice",
        })
      ).statusCode,
    ).toBe(400);
    const start = await server.inject({
      method: "POST",
      url: "/auth/desktop/start",
      payload: {
        challenge: sha256("c".repeat(43)),
        deviceId: randomUUID(),
        deviceName: "Mac",
      },
    });
    const auth = new URL(
      start.json<{ authorizationUrl: string }>().authorizationUrl,
    );
    expect(
      (
        await server.inject({
          url: `/auth/google/callback?state=${auth.searchParams.get("state")}&code=invalid`,
        })
      ).statusCode,
    ).toBe(400);
  });
});
