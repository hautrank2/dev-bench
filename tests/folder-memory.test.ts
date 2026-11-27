import { mkdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { describe, expect, it } from "vitest";

import { FolderMemory } from "../electron/services/folder-memory";
import { fixture } from "./helpers";

describe("last browsed folder", () => {
  it("survives a restart and forgets folders that are gone", async () => {
    const root = await fixture("folder-memory");
    const file = path.join(root, "settings", "last-folder.json");
    expect(await new FolderMemory(file).recall()).toBeUndefined();
    const chosen = path.join(root, "dự án");
    await mkdir(chosen);
    await new FolderMemory(file).remember(chosen);
    expect(await new FolderMemory(file).recall()).toBe(chosen);
    await rm(chosen, { recursive: true });
    expect(await new FolderMemory(file).recall()).toBeUndefined();
    await writeFile(file, "broken JSON");
    expect(await new FolderMemory(file).recall()).toBeUndefined();
  });

  it("ignores a preference file it cannot write", async () => {
    const root = await fixture("folder-memory-blocked");
    const blocker = path.join(root, "file");
    await writeFile(blocker, "");
    await expect(
      new FolderMemory(path.join(blocker, "last.json")).remember(root),
    ).resolves.toBeUndefined();
  });
});
