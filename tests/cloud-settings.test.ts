import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { describe, expect, it, vi } from "vitest";

import { CloudService } from "../electron/services/cloud";
import { fixture } from "./helpers";

vi.mock("electron", () => ({
  safeStorage: { decryptString: vi.fn() },
  shell: { openExternal: vi.fn() },
}));

describe("cloud server defaults", () => {
  it("uses the build default on a fresh device without writing user configuration", async () => {
    const directory = await fixture("cloud-default");
    const cloud = new CloudService(
      directory,
      () => {},
      "https://api.example.com/",
    );
    await cloud.load();
    expect(cloud.status()).toMatchObject({
      apiUrl: "https://api.example.com",
      account: null,
      signingIn: false,
    });
    await expect(
      readFile(path.join(directory, "cloud.json")),
    ).rejects.toMatchObject({ code: "ENOENT" });
  });

  it("preserves the server explicitly saved in Settings", async () => {
    const directory = await fixture("cloud-saved");
    await writeFile(
      path.join(directory, "cloud.json"),
      JSON.stringify({ apiUrl: "https://saved.example.com" }),
    );
    const cloud = new CloudService(
      directory,
      () => {},
      "https://new-default.example.com",
    );
    await cloud.load();
    expect(cloud.status().apiUrl).toBe("https://saved.example.com");
  });

  it("keeps manual server configuration available when the environment value is empty", async () => {
    const cloud = new CloudService(await fixture("cloud-empty"), () => {});
    await cloud.load();
    expect(cloud.status().apiUrl).toBe("");
    await cloud.configure("http://localhost:4318");
    expect(cloud.status().apiUrl).toBe("http://localhost:4318");
  });
});
