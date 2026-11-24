import { useEffect, useMemo, useState } from "react";

import {
  isLanguage,
  languageStorageKey,
  translate,
  type Language,
} from "@shared/i18n";
import { projectsApi } from "~/api/api-list/projects";

import type { LocaleContextValue } from "./type";

export const useLocaleProvider = (): LocaleContextValue => {
  const [language, setLanguage] = useState<Language>(() => {
    try {
      const stored = localStorage.getItem(languageStorageKey);
      return isLanguage(stored) ? stored : "en";
    } catch {
      return "en";
    }
  });
  useEffect(() => {
    document.documentElement.lang = language;
    try {
      localStorage.setItem(languageStorageKey, language);
    } catch {
      /* Preference remains available for this session. */
    }
    void Promise.resolve()
      .then(() => projectsApi.setLanguage(language))
      .catch(() => undefined);
  }, [language]);
  return useMemo(
    () => ({
      language,
      setLanguage,
      t: (message, params) => translate(language, message, params),
      dateLocale: language === "vi" ? "vi-VN" : "en-US",
    }),
    [language],
  );
};
