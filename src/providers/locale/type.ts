import type { PropsWithChildren } from "react";

import type { Language, TranslationParams } from "@shared/i18n";

export type LocaleProviderProps = PropsWithChildren;
export type LocaleContextValue = {
  language: Language;
  setLanguage: (language: Language) => void;
  t: (message: string, params?: TranslationParams) => string;
  dateLocale: "en-US" | "vi-VN";
};
