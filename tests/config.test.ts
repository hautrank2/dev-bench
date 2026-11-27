import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { describe, expect, it } from "vitest";

import { ConfigStore } from "../electron/services/config";
import { projectInputSchema } from "../shared/contracts";
import { fixture, projectAt } from "./helpers";

describe("JSON configuration", () => {
  it("preserves Unicode, spaces, stable IDs and simultaneous edits on reopen", async () => {
    const folder = await fixture("config");
    const file = path.join(folder, "settings", "projects.json");
    const store = new ConfigStore(file);
    await store.load();
    const first = await store.save({
      input: projectAt(folder, {
        name: "Dự án A",
        command: "pnpm run dev",
        url: "http://localhost:3000",
      }),
    });
    const second = await store.save({
      input: projectAt(folder, {
        name: "Dự án B",
        url: "http://localhost:3003",
      }),
    });
    await Promise.all([
      store.save({ id: first.id, input: { ...first, includeInRunAll: false } }),
      store.save({
        id: second.id,
        input: { ...second, command: "pnpm run start" },
      }),
    ]);
    const reopened = new ConfigStore(file);
    await reopened.load();
    expect(reopened.get(first.id)).toMatchObject({
      name: "Dự án A",
      folder,
      includeInRunAll: false,
    });
    expect(reopened.get(second.id).command).toBe("pnpm run start");
    expect(await readFile(file, "utf8")).not.toMatch(/Running|runtime|pid/);
  });

  it("reorders projects and repositories and moves one between projects", async () => {
    const folder = await fixture("config-order");
    const file = path.join(folder, "projects.json");
    const store = new ConfigStore(file);
    await store.load();
    const alpha = await store.saveGroup({ name: "Alpha", description: "" });
    const beta = await store.saveGroup({ name: "Beta", description: "" });
    const add = (name: string, groupId: string) =>
      store.save({ input: projectAt(folder, { name, groupId }) });
    const a1 = await add("a1", alpha.id);
    const a2 = await add("a2", alpha.id);
    const b1 = await add("b1", beta.id);
    const names = (groupId: string) =>
      store
        .list()
        .filter((repo) => repo.groupId === groupId)
        .map((repo) => repo.name);

    await store.moveGroup({ id: beta.id, beforeId: alpha.id });
    await store.moveRepository({
      id: a2.id,
      groupId: alpha.id,
      beforeId: a1.id,
    });
    expect(names(alpha.id)).toEqual(["a2", "a1"]);
    await store.moveRepository({
      id: a1.id,
      groupId: beta.id,
      beforeId: b1.id,
    });
    expect(names(beta.id)).toEqual(["a1", "b1"]);
    await store.moveRepository({
      id: a2.id,
      groupId: beta.id,
      beforeId: null,
    });
    expect(names(beta.id)).toEqual(["a1", "b1", "a2"]);
    expect(names(alpha.id)).toEqual([]);

    // A neighbor from another project, or an unknown project, changes nothing.
    await expect(
      store.moveRepository({ id: a1.id, groupId: alpha.id, beforeId: b1.id }),
    ).rejects.toThrow("list changed");
    await expect(
      store.moveRepository({ id: a1.id, groupId: a2.id, beforeId: null }),
    ).rejects.toThrow("valid project");
    const reopened = new ConfigStore(file);
    await reopened.load();
    expect(reopened.info().groups.map((group) => group.name)).toEqual([
      "Beta",
      "Alpha",
    ]);
    expect(reopened.list().map((repo) => repo.name)).toEqual([
      "a1",
      "b1",
      "a2",
    ]);
  });

  it("does not overwrite invalid JSON", async () => {
    const folder = await fixture("invalid");
    const file = path.join(folder, "projects.json");
    await writeFile(file, "broken JSON");
    const store = new ConfigStore(file);
    await expect(store.load()).rejects.toThrow("has not been overwritten");
    await expect(store.save({ input: projectAt(folder) })).rejects.toThrow();
    expect(await readFile(file, "utf8")).toBe("broken JSON");
  });

  it("validates required values, optional command/URL, schemes and moved folders", async () => {
    const folder = await fixture("validation");
    const input = projectAt(folder);
    expect(projectInputSchema.safeParse(input).success).toBe(true);
    expect(projectInputSchema.safeParse({ ...input, name: " " }).success).toBe(
      false,
    );
    expect(
      projectInputSchema.safeParse({ ...input, url: "javascript:alert(1)" })
        .success,
    ).toBe(false);
    expect(
      projectInputSchema.safeParse({
        ...input,
        url: "https://localhost:3003/path",
      }).success,
    ).toBe(true);
    const store = new ConfigStore(path.join(folder, "projects.json"));
    await store.load();
    await expect(
      store.save({ input: { ...input, folder: path.join(folder, "missing") } }),
    ).rejects.toThrow("unavailable");
  });

  it("preserves the optional working directory through save, reopen and JSON backup restore", async () => {
    const folder = await fixture("config-working-directory");
    const workingDirectory = path.join("apps", "dịch vụ");
    await mkdir(path.join(folder, workingDirectory), { recursive: true });
    const file = path.join(folder, "projects.json");
    const store = new ConfigStore(file);
    await store.load();
    const project = await store.save({
      input: projectAt(folder, { workingDirectory }),
    });
    const reopened = new ConfigStore(file);
    await reopened.load();
    expect(reopened.get(project.id).workingDirectory).toBe(workingDirectory);
    expect(reopened.get(project.id).folder).toBe(folder);
    const snapshot = reopened.snapshot({
      theme: "light",
      terminalTheme: "midnight",
    });
    expect(snapshot.set.repositories[0]?.workingDirectory).toBe(
      workingDirectory,
    );
    await reopened.importSet(JSON.parse(JSON.stringify(snapshot)));
    const restored = reopened.list()[0];
    expect(restored?.workingDirectory).toBe(workingDirectory);
    if (!restored) throw new Error("Restored repository is missing");
    await reopened.save({
      id: restored.id,
      input: { ...restored, workingDirectory: "" },
    });
    expect(reopened.get(restored.id).workingDirectory).toBe("");
    await expect(
      reopened.save({
        input: projectAt(folder, { workingDirectory: "missing" }),
      }),
    ).rejects.toThrow("unavailable");
    expect(
      projectInputSchema.safeParse({
        ...projectAt(folder),
        workingDirectory: "x".repeat(4097),
      }).success,
    ).toBe(false);
  });
});
