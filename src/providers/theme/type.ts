import type { PropsWithChildren } from "react";
import type { Appearance, FontFamily, TerminalCursor } from "@shared/workspace";

export type Theme = Appearance["theme"];
export type ThemeProviderProps = PropsWithChildren;
export type UseThemeProviderProps = ThemeProviderProps;
export type ThemeContextValue = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  terminalTheme: Appearance["terminalTheme"];
  setTerminalTheme: (theme: Appearance["terminalTheme"]) => void;
  terminalCursor: TerminalCursor;
  setTerminalCursor: (cursor: TerminalCursor) => void;
  terminalCursorBlink: boolean;
  setTerminalCursorBlink: (blink: boolean) => void;
  fontFamily: FontFamily;
  setFontFamily: (font: FontFamily) => void;
  resolvedTheme: "light" | "dark";
};
