import { createContext, useContext } from "react";

import type { ThemeContextValue } from "./type";

export const ThemeContext = createContext<ThemeContextValue | null>(null);
export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error("ThemeProvider is missing");
  return context;
};
