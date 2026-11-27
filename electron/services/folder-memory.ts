import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";

import { assertFolder } from "./config";

/** Remembers the last folder chosen with Browse, only on this machine. */
export class FolderMemory {
  constructor(private file: string) {}

  /** Undefined when nothing was chosen yet or the folder is gone. */
  async recall() {
    try {
      const stored: unknown = JSON.parse(await readFile(this.file, "utf8"));
      if (typeof stored !== "string") return undefined;
      await assertFolder(stored);
      return stored;
    } catch {
      return undefined;
    }
  }

  // Losing this preference must never make choosing a folder fail.
  async remember(folder: string) {
    try {
      await mkdir(path.dirname(this.file), { recursive: true });
      await writeFile(`${this.file}.tmp`, JSON.stringify(folder), "utf8");
      await rename(`${this.file}.tmp`, this.file);
    } catch {
      // The next dialog simply opens at the system default.
    }
  }
}
