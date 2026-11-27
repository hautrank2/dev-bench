import { useEffect, useState } from "react";
import {
  defaultTerminalCursor,
  defaultTerminalTheme,
  fontFamilySchema,
  terminalCursorSchema,
  terminalThemeSchema,
} from "@shared/workspace";

import type { Theme, UseThemeProviderProps } from "./type";

const storageKey = "DEV_BENCH_THEME";
export const useThemeProvider = (_props: UseThemeProviderProps) => {
  const [theme, setTheme] = useState<Theme>(() => {
    const stored = localStorage.getItem(storageKey);
    return stored === "blueDark"
      ? "dark"
      : stored === "light" || stored === "dark"
        ? stored
        : "system";
  });
  const [terminalTheme, setTerminalTheme] = useState(() => {
    const stored = terminalThemeSchema.safeParse(
      localStorage.getItem("DEV_BENCH_TERMINAL_THEME"),
    );
    return stored.success ? stored.data : defaultTerminalTheme;
  });
  const [terminalCursor, setTerminalCursor] = useState(() => {
    const stored = terminalCursorSchema.safeParse(
      localStorage.getItem("DEV_BENCH_TERMINAL_CURSOR"),
    );
    return stored.success ? stored.data : defaultTerminalCursor;
  });
  const [terminalCursorBlink, setTerminalCursorBlink] = useState(
    () => localStorage.getItem("DEV_BENCH_TERMINAL_CURSOR_BLINK") !== "false",
  );
  const [resolvedTheme, setResolvedTheme] = useState<"light" | "dark">("light");
  const [fontFamily, setFontFamily] = useState(() => {
    const stored = fontFamilySchema.safeParse(
      localStorage.getItem("DEV_BENCH_FONT_FAMILY"),
    );
    return stored.success ? stored.data : "system";
  });
  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const update = () => {
      document.documentElement.classList.remove("light", "dark", "blueDark");
      document.documentElement.classList.add(
        theme === "system" ? (media.matches ? "dark" : "light") : theme,
      );
      setResolvedTheme(
        theme === "system" ? (media.matches ? "dark" : "light") : theme,
      );
    };
    update();
    localStorage.setItem(storageKey, theme);
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, [theme]);
  useEffect(() => {
    localStorage.setItem("DEV_BENCH_TERMINAL_THEME", terminalTheme);
  }, [terminalTheme]);
  useEffect(() => {
    localStorage.setItem("DEV_BENCH_TERMINAL_CURSOR", terminalCursor);
    localStorage.setItem(
      "DEV_BENCH_TERMINAL_CURSOR_BLINK",
      String(terminalCursorBlink),
    );
  }, [terminalCursor, terminalCursorBlink]);
  useEffect(() => {
    document.documentElement.dataset.fontFamily = fontFamily;
    localStorage.setItem("DEV_BENCH_FONT_FAMILY", fontFamily);
  }, [fontFamily]);
  return {
    theme,
    setTheme,
    terminalTheme,
    setTerminalTheme,
    terminalCursor,
    setTerminalCursor,
    terminalCursorBlink,
    setTerminalCursorBlink,
    fontFamily,
    setFontFamily,
    resolvedTheme,
  };
};
