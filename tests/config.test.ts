import { readFile, writeFile } from "node:fs/promises";
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
});
