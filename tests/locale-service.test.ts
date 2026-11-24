import { mkdir, mkdtemp, readFile } from "node:fs/promises";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { LocaleService } from "../electron/services/locale";

describe("native dialog language", () => {
  it("defaults to English, persists Vietnamese and serializes rapid preference changes", async () => {
    const parent = path.resolve(".test-artifacts");
    await mkdir(parent, { recursive: true });
    const directory = await mkdtemp(path.join(parent, "language-"));
    const first = new LocaleService(directory);
    await first.load();
    expect(first.t("Cancel")).toBe("Cancel");
    await Promise.all([
      first.setLanguage("vi"),
      first.setLanguage("en"),
      first.setLanguage("vi"),
    ]);
    expect(
      JSON.parse(await readFile(path.join(directory, "language.json"), "utf8")),
    ).toBe("vi");
    const restored = new LocaleService(directory);
    await restored.load();
    expect(restored.t("Stop All and Quit")).toBe("Dừng tất cả và thoát");
    await restored.setLanguage("en");
    expect(restored.t("Cancel")).toBe("Cancel");
  });
});
