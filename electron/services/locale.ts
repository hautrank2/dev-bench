import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";

import {
  isLanguage,
  translate,
  type Language,
  type TranslationParams,
} from "../../shared/i18n";

export class LocaleService {
  private language: Language = "en";
  private writes: Promise<void> = Promise.resolve();
  constructor(private directory: string) {}
  async load() {
    try {
      const stored: unknown = JSON.parse(
        await readFile(path.join(this.directory, "language.json"), "utf8"),
      );
      if (isLanguage(stored)) this.language = stored;
    } catch {
      /* New or unreadable preferences fall back to English. */
    }
  }
  setLanguage(language: Language) {
    this.language = language;
    const save = this.writes
      .catch(() => undefined)
      .then(async () => {
        await mkdir(this.directory, { recursive: true });
        const file = path.join(this.directory, "language.json");
        await writeFile(`${file}.tmp`, JSON.stringify(language));
        await rename(`${file}.tmp`, file);
      });
    this.writes = save;
    return save;
  }
  t(message: string, params?: TranslationParams) {
    return translate(this.language, message, params);
  }
}
