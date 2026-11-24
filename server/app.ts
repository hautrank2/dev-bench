import rateLimit from "@fastify/rate-limit";
import Fastify from "fastify";
import { createHash, randomBytes, randomUUID } from "node:crypto";
import type { Db } from "mongodb";
import { z } from "zod";

import { loginCompleteSchema, loginStartSchema } from "../shared/cloud-api";
import { backupSchema, type BackupInfo } from "../shared/workspace";
import { collections, type BackupRecord } from "./database";
import type { GoogleProvider } from "./google";

export const sha256 = (value: string) =>
  createHash("sha256").update(value).digest("base64url");
const secret = () => randomBytes(32).toString("base64url");
const info = (record: BackupRecord): BackupInfo => {
  const snapshot = backupSchema.parse(record.snapshot);
  return {
    id: record._id,
    name: record.snapshot.set.name,
    sourceDevice: record.snapshot.sourceDevice,
    platform: record.snapshot.platform,
    projectCount: snapshot.set.projects.length,
    repositoryCount: snapshot.set.repositories.length,
    createdAt: record.createdAt.toISOString(),
  };
};

export const createServer = async (db: Db, google: GoogleProvider) => {
  const app = Fastify({ bodyLimit: 2 * 1024 * 1024, logger: false });
  const tables = collections(db);
  await app.register(rateLimit, { max: 100, timeWindow: "1 minute" });
  app.addHook("onSend", async (_request, reply) => {
    reply.header("cache-control", "no-store");
    reply.header("x-content-type-options", "nosniff");
    reply.header("referrer-policy", "no-referrer");
    reply.header(
      "content-security-policy",
      "default-src 'none'; frame-ancestors 'none'",
    );
  });
  app.setErrorHandler((error, _request, reply) => {
    if (error instanceof z.ZodError)
      return reply.code(400).send({
        error: "Invalid request",
        details: error.issues.map((issue) => issue.message),
      });
    const status =
      typeof error === "object" &&
      error &&
      "statusCode" in error &&
      typeof error.statusCode === "number"
        ? error.statusCode
        : 500;
    return reply.code(status).send({
      error:
        status === 429
          ? "Too many requests. Try again shortly."
          : "Request failed. Try again or contact your server administrator.",
    });
  });

  const sessionFor = async (authorization?: string) => {
    const token = authorization?.startsWith("Bearer ")
      ? authorization.slice(7)
      : "";
    if (!token || token.length > 256) return null;
    return tables.sessions.findOne({
      tokenHash: sha256(token),
      expiresAt: { $gt: new Date() },
    });
  };

  app.get("/health", async () => ({ status: "ok" }));
  app.post(
    "/auth/desktop/start",
    { config: { rateLimit: { max: 10, timeWindow: "1 minute" } } },
    async (request) => {
      const input = loginStartSchema.parse(request.body);
      const login = {
        _id: randomUUID(),
        state: secret(),
        nonce: secret(),
        googleVerifier: secret(),
        ...input,
        expiresAt: new Date(Date.now() + 5 * 60000),
      };
      await tables.logins.insertOne(login);
      return {
        loginId: login._id,
        authorizationUrl: google.authorizationUrl(
          login.state,
          login.nonce,
          sha256(login.googleVerifier),
        ),
      };
    },
  );

  app.get("/auth/google/callback", async (request, reply) => {
    const query = z
      .object({
        state: z.string().min(1),
        code: z.string().optional(),
        error: z.string().optional(),
      })
      .parse(request.query);
    // Consume browser state once, including failed/cancelled attempts.
    const login = await tables.logins.findOneAndUpdate(
      { state: query.state, expiresAt: { $gt: new Date() } },
      { $unset: { state: "" } },
      { returnDocument: "before" },
    );
    if (!login)
      return reply
        .code(400)
        .type("text/plain")
        .send(
          "This sign-in link is invalid or expired. Return to Dev Bench and try again.",
        );
    if (query.error || !query.code) {
      await tables.logins.deleteOne({ _id: login._id });
      return reply
        .code(400)
        .type("text/plain")
        .send("Sign-in cancelled. Return to Dev Bench.");
    }
    try {
      const identity = await google.exchange(
        query.code,
        login.googleVerifier,
        login.nonce,
      );
      const user = await tables.users.findOneAndUpdate(
        { googleSub: identity.sub },
        {
          $set: { email: identity.email, name: identity.name },
          $setOnInsert: {
            _id: randomUUID(),
            id: randomUUID(),
            googleSub: identity.sub,
          },
        },
        { upsert: true, returnDocument: "after" },
      );
      if (!user) throw new Error("Account creation failed");
      await tables.logins.updateOne(
        { _id: login._id },
        { $set: { userId: user._id } },
      );
      return reply
        .type("text/plain")
        .send(
          "You are signed in. You can close this tab and return to Dev Bench.",
        );
    } catch {
      await tables.logins.deleteOne({ _id: login._id });
      return reply
        .code(400)
        .type("text/plain")
        .send(
          "Google sign-in could not be verified. Return to Dev Bench and try again.",
        );
    }
  });

  app.post("/auth/desktop/complete", async (request, reply) => {
    const input = loginCompleteSchema.parse(request.body);
    const filter = {
      _id: input.loginId,
      challenge: sha256(input.verifier),
      expiresAt: { $gt: new Date() },
    };
    const login = await tables.logins.findOne(filter);
    if (!login)
      return reply
        .code(400)
        .send({ error: "Sign-in expired or cancelled. Try again." });
    if (!login.userId) return reply.code(202).send({ pending: true });
    const consumed = await tables.logins.findOneAndDelete({
      ...filter,
      userId: login.userId,
    });
    if (!consumed)
      return reply.code(400).send({ error: "Sign-in was already completed." });
    const user = await tables.users.findOne({ _id: login.userId });
    if (!user) return reply.code(401).send({ error: "Account not found" });
    const token = secret();
    await tables.sessions.insertOne({
      _id: randomUUID(),
      userId: user._id,
      deviceId: login.deviceId,
      deviceName: login.deviceName,
      tokenHash: sha256(token),
      expiresAt: new Date(Date.now() + 30 * 86400000),
    });
    return {
      token,
      account: { id: user._id, email: user.email, name: user.name },
    };
  });

  app.get("/me", async (request, reply) => {
    const session = await sessionFor(request.headers.authorization);
    if (!session)
      return reply.code(401).send({ error: "Session expired. Sign in again." });
    const user = await tables.users.findOne({ _id: session.userId });
    if (!user) return reply.code(401).send({ error: "Account not found" });
    return { id: user._id, email: user.email, name: user.name };
  });
  app.post("/auth/logout", async (request, reply) => {
    const session = await sessionFor(request.headers.authorization);
    if (session) await tables.sessions.deleteOne({ _id: session._id });
    return reply.code(204).send();
  });
  app.get("/backups", async (request, reply) => {
    const session = await sessionFor(request.headers.authorization);
    if (!session)
      return reply.code(401).send({ error: "Sign in to view your backups" });
    const records = await tables.backups
      .find({ userId: session.userId })
      .sort({ createdAt: -1 })
      .limit(500)
      .toArray();
    return records.map(info);
  });
  app.post("/backups", async (request, reply) => {
    const session = await sessionFor(request.headers.authorization);
    if (!session)
      return reply.code(401).send({ error: "Sign in to back up this set" });
    const snapshot = backupSchema.parse(request.body);
    const record: BackupRecord = {
      _id: randomUUID(),
      userId: session.userId,
      createdAt: new Date(),
      snapshot,
    };
    await tables.backups.insertOne(record);
    return reply.code(201).send(info(record));
  });
  app.get("/backups/:id", async (request, reply) => {
    const session = await sessionFor(request.headers.authorization);
    if (!session)
      return reply.code(401).send({ error: "Sign in to restore a backup" });
    const { id } = z.object({ id: z.uuid() }).parse(request.params);
    const record = await tables.backups.findOne({
      _id: id,
      userId: session.userId,
    });
    if (!record) return reply.code(404).send({ error: "Backup not found" });
    return backupSchema.parse(record.snapshot);
  });
  return app;
};
