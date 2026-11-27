import { randomUUID } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { describe, expect, it } from "vitest";

import { ConfigStore } from "../electron/services/config";
import {
  backupSchema,
  fromCloudBackup,
  toCloudBackup,
} from "../shared/workspace";
import { fixture, projectAt } from "./helpers";

describe("Per-machine project sets and portable backups", () => {
  it("loads and restores older projects while discarding the removed card image field", async () => {
    const folder = await fixture("project-with-legacy-image");
    const file = path.join(folder, "projects.json");
    const store = new ConfigStore(file);
    await store.load();
    const group = await store.saveGroup({
      name: "Existing project",
      description: "Keep this description",
    });
    const coverImage = "data:image/png;base64,AAAA";
    const raw = JSON.parse(await readFile(file, "utf8"));
    raw.sets[0].projects[0].coverImage = coverImage;
    await writeFile(file, JSON.stringify(raw));

    const reopened = new ConfigStore(file);
    await reopened.load();
    expect(reopened.info().groups).toEqual([group]);
    const snapshot = reopened.snapshot({
      theme: "light",
      terminalTheme: "midnight",
    });
    expect(snapshot.set.projects).toEqual([group]);
    const oldBackup = {
      ...snapshot,
      set: { ...snapshot.set, projects: [{ ...group, coverImage }] },
    };
    await reopened.importSet(oldBackup);
    expect(reopened.info().groups[0]).toEqual({
      ...group,
      id: expect.any(String),
    });
    expect(
      JSON.parse(await readFile(file, "utf8")).sets.every(
        (set: { projects: object[] }) =>
          set.projects.every((project) => !("coverImage" in project)),
      ),
    ).toBe(true);
  });
  it("groups multiple repositories under one project and preserves relationships on restore", async () => {
    const folder = await fixture("hierarchy");
    const store = new ConfigStore(path.join(folder, "projects.json"));
    await store.load();
    const group = await store.saveGroup({
      name: "OpsDesk",
      description: "Operations",
    });
    const web = await store.save({
      input: projectAt(folder, { name: "client", groupId: group.id }),
    });
    await store.save({
      input: projectAt(folder, { name: "server", groupId: group.id }),
    });
    expect(store.info().groups).toHaveLength(1);
    expect(store.list()).toHaveLength(2);
    const snapshot = store.snapshot({
      theme: "dark",
      terminalTheme: "rose",
      fontFamily: "be-vietnam-pro",
    });
    expect(backupSchema.parse(snapshot).appearance.fontFamily).toBe(
      "be-vietnam-pro",
    );
    expect(snapshot.schemaVersion).toBe(2);
    expect(snapshot.set.projects).toHaveLength(1);
    expect(snapshot.set.repositories).toHaveLength(2);
    await store.importSet(snapshot);
    expect(store.info().groups).toHaveLength(1);
    const importedGroup = store.info().groups[0];
    expect(importedGroup?.id).not.toBe(group.id);
    expect(
      store.list().every((repo) => repo.groupId === importedGroup?.id),
    ).toBe(true);
    expect(store.list().every((repo) => repo.id !== web.id)).toBe(true);
  });

  it("migrates workspace v2 and old backup snapshots without losing repository IDs", async () => {
    const folder = await fixture("workspace-v2");
    const file = path.join(folder, "projects.json");
    const setId = randomUUID();
    const deviceId = randomUUID();
    const repo = projectAt(folder);
    const oldSet = { id: setId, name: "Work", projects: [repo] };
    await writeFile(
      file,
      JSON.stringify({
        version: 2,
        deviceId,
        deviceName: "Old device",
        activeSetId: setId,
        sets: [oldSet],
      }),
    );
    const store = new ConfigStore(file);
    await store.load();
    expect(store.info().deviceId).toBe(deviceId);
    expect(store.list()[0]?.id).toBe(repo.id);
    expect(store.list()[0]?.groupId).toBe(store.info().groups[0]?.id);
    const backup = backupSchema.parse({
      kind: "dev-bench-project-set",
      schemaVersion: 1,
      exportedAt: new Date().toISOString(),
      sourceDevice: "Old device",
      platform: "win32",
      set: oldSet,
      appearance: { theme: "light", terminalTheme: "app" },
    });
    expect(backup.set.repositories[0]?.id).toBe(repo.id);
    expect(backup.set.projects[0]?.name).toBe(repo.name);
    expect(backup.appearance.fontFamily).toBeUndefined();
    // The removed "Follow app" palette opens as Dark.
    expect(backup.appearance.terminalTheme).toBe("midnight");
  });

  it("round-trips Dracula through the cloud under the name the API accepts", async () => {
    const folder = await fixture("cloud-appearance");
    const store = new ConfigStore(path.join(folder, "projects.json"));
    await store.load();
    const snapshot = store.snapshot({
      theme: "dark",
      terminalTheme: "dracula",
    });
    const sent = toCloudBackup(snapshot);
    expect(sent.appearance.terminalTheme).toBe("app");
    expect(
      backupSchema.parse(fromCloudBackup(JSON.parse(JSON.stringify(sent))))
        .appearance.terminalTheme,
    ).toBe("dracula");
    const rose = { ...snapshot, appearance: { terminalTheme: "rose" } };
    expect(fromCloudBackup(rose)).toBe(rose);
  });
  it("migrates legacy JSON, preserves IDs and saves stable device identity", async () => {
    const folder = await fixture("migrate");
    const file = path.join(folder, "projects.json");
    const legacy = { version: 1, projects: [projectAt(folder)] };
    await writeFile(file, JSON.stringify(legacy));
    const store = new ConfigStore(file);
    await store.load();
    expect(store.list()[0]?.id).toBe(legacy.projects[0]?.id);
    expect(JSON.parse(await readFile(`${file}.legacy.bak`, "utf8"))).toEqual(
      legacy,
    );
    const info = store.info();
    const reopened = new ConfigStore(file);
    await reopened.load();
    expect(reopened.info()).toEqual(info);
    expect(JSON.parse(await readFile(file, "utf8")).version).toBe(3);
  });

  it("isolates sets and imports without overwriting, running or requiring old paths", async () => {
    const folder = await fixture("sets");
    const store = new ConfigStore(path.join(folder, "projects.json"));
    await store.load();
    const initialId = store.info().activeSetId;
    const project = await store.save({
      input: projectAt(folder, { name: "Web", command: "pnpm run dev" }),
    });
    const snapshot = store.snapshot({
      theme: "dark",
      terminalTheme: "rose",
      fontFamily: "system",
    });
    await store.createSet("Personal Mac");
    expect(store.list()).toEqual([]);
    await store.save({ input: projectAt(folder, { name: "API" }) });
    await store.selectSet(initialId);
    expect(store.list().map((item) => item.name)).toEqual(["Web"]);
    const imported = {
      ...snapshot,
      set: {
        ...snapshot.set,
        repositories: [
          { ...project, folder: path.join(folder, "after-reset-missing") },
        ],
      },
    };
    await store.importSet(imported);
    expect(store.info().sets).toHaveLength(3);
    expect(store.list()[0]?.id).not.toBe(project.id);
    expect(store.list()[0]?.folder).toContain("after-reset-missing");
    expect(
      JSON.stringify(
        store.snapshot({
          theme: "light",
          terminalTheme: "paper",
          fontFamily: "system",
        }),
      ),
    ).not.toMatch(/runtime|token|stdout/);
    await store.selectSet(initialId);
    expect(store.get(project.id).name).toBe("Web");
    await expect(store.selectSet(randomUUID())).rejects.toThrow("not found");
    await expect(
      store.importSet({ ...snapshot, kind: "other" }),
    ).rejects.toThrow();
    expect(
      backupSchema.safeParse({ ...snapshot, schemaVersion: 999 }).success,
    ).toBe(false);
  });
});
