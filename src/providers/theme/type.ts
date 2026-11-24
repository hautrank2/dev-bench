import type { PropsWithChildren } from "react";
import type { Appearance } from "@shared/workspace";

export type Theme = Appearance["theme"];
export type ThemeProviderProps = PropsWithChildren;
export type UseThemeProviderProps = ThemeProviderProps;
export type ThemeContextValue = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  terminalTheme: Appearance["terminalTheme"];
  setTerminalTheme: (theme: Appearance["terminalTheme"]) => void;
  resolvedTheme: "light" | "dark";
};
