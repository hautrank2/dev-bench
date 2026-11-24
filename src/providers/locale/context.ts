import { createContext, useContext } from "react";

import { translate } from "@shared/i18n";

import type { LocaleContextValue } from "./type";

export const LocaleContext = createContext<LocaleContextValue>({
  language: "en",
  setLanguage: () => undefined,
  t: (message, params) => translate("en", message, params),
  dateLocale: "en-US",
});
export const useLocale = () => useContext(LocaleContext);
