import { FitAddon } from "@xterm/addon-fit";
import { Terminal, type ITheme } from "@xterm/xterm";
import { useEffect, useRef, useState } from "react";

import type { ShellEvent } from "@shared/terminal";
import { terminalApi } from "~/api/api-list/terminal";
import { useTheme } from "~/providers/theme/context";

import type { UseTerminalPanelProps } from "./type";

// Prompt themes draw icons from Nerd Fonts; use one when it is installed.
const SYMBOL_FONTS = [
  "Symbols Nerd Font Mono",
  "CaskaydiaCove NF",
  "CaskaydiaCove Nerd Font",
  "JetBrainsMono Nerd Font",
  "FiraCode Nerd Font",
  "MesloLGM Nerd Font",
  "MesloLGS NF",
]
  .map((name) => `"${name}"`)
  .join(", ");

const ANSI_COLORS = [
  "black",
  "red",
  "green",
  "yellow",
  "blue",
  "magenta",
  "cyan",
  "white",
] as const;

// Colors come from the palette chosen in Settings, resolved by the browser.
const readTheme = (frame: Element): ITheme => {
  const style = getComputedStyle(frame);
  const scrollbarColor = style
    .getPropertyValue("--primary")
    .trim()
    .replace(/^#[\da-f]{6}$/i, (primary) => `${primary}66`);
  // A palette without its own ANSI colors keeps the xterm defaults.
  const token = (name: string) =>
    style.getPropertyValue(`--terminal-${name}`).trim() || undefined;
  const theme: ITheme = {
    background: style.backgroundColor,
    foreground: style.color,
    cursor: style.color,
    cursorAccent: style.backgroundColor,
    selectionBackground: token("selection"),
    scrollbarSliderBackground: scrollbarColor,
    scrollbarSliderHoverBackground: scrollbarColor,
    scrollbarSliderActiveBackground: scrollbarColor,
  };
  for (const color of ANSI_COLORS) {
    const bright = `bright${color[0]?.toUpperCase()}${color.slice(1)}`;
    theme[color] = token(`ansi-${color}`);
    theme[bright as `bright${Capitalize<typeof color>}`] = token(
      `ansi-bright-${color}`,
    );
  }
  return theme;
};

export const useTerminalPanel = ({ project }: UseTerminalPanelProps) => {
  const { terminalTheme, terminalCursor, terminalCursorBlink } = useTheme();
  const instance = useRef<Terminal | null>(null);
  // Read through a ref so a preference change never restarts the shell.
  const cursor = useRef({ terminalCursor, terminalCursorBlink });
  cursor.current = { terminalCursor, terminalCursorBlink };
  const screen = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [exitCode, setExitCode] = useState<number | null>(null);
  const [launch, setLaunch] = useState({ count: 0, restart: false });
  const id = project.id;
  const folder = project.folder;

  useEffect(() => {
    const host = screen.current;
    if (!host) return;
    const frame = host.closest("[data-terminal-theme]") ?? host;
    const cleanups: (() => void)[] = [];
    let disposed = false;
    setError(null);
    setExitCode(null);
    const fail = (reason: unknown) => {
      if (!disposed)
        setError(reason instanceof Error ? reason.message : String(reason));
    };

    const start = async () => {
      const textFont = getComputedStyle(frame).fontFamily;
      const fontFamily = `${textFont}, ${SYMBOL_FONTS}`;
      // xterm measures one character on open, so the font has to be ready.
      await document.fonts?.load(`13px ${textFont}`).catch(() => undefined);
      if (disposed) return;
      const terminal = new Terminal({
        cursorBlink: cursor.current.terminalCursorBlink,
        cursorStyle: cursor.current.terminalCursor,
        fontFamily,
        fontSize: 13,
        // Keeps ANSI colors readable on the light palettes too.
        minimumContrastRatio: 4.5,
        scrollback: 5000,
        theme: readTheme(frame),
      });
      instance.current = terminal;
      cleanups.push(() => {
        instance.current = null;
        terminal.dispose();
      });
      const fit = new FitAddon();
      terminal.loadAddon(fit);
      terminal.open(host);
      const refit = () => {
        if (host.clientWidth && host.clientHeight) fit.fit();
      };
      refit();

      const theme = new MutationObserver(() => {
        terminal.options.theme = readTheme(frame);
      });
      for (const target of [document.documentElement, frame])
        theme.observe(target, { attributes: true });
      cleanups.push(() => theme.disconnect());

      // Returning false leaves Ctrl+V, and Ctrl+C on a selection, to the
      // browser's paste and copy instead of sending them to the shell.
      terminal.attachCustomKeyEventHandler((event) => {
        if (!event.ctrlKey || event.altKey || event.metaKey) return true;
        const key = event.key.toLowerCase();
        if (key === "v") return false;
        if (key !== "c" || !terminal.hasSelection()) return true;
        if (event.type === "keydown")
          setTimeout(() => terminal.clearSelection(), 0);
        return false;
      });

      let session: number | undefined;
      let sequence = 0;
      let replaying = false;
      let exited = false;
      const queued: ShellEvent[] = [];
      const apply = (event: ShellEvent) => {
        if (event.session !== session) return;
        if (event.type === "exit") {
          exited = true;
          setExitCode(event.exitCode);
        } else if (event.sequence > sequence) {
          sequence = event.sequence;
          terminal.write(event.data);
        }
      };
      // Subscribed before opening so no early output is lost.
      cleanups.push(
        terminalApi.subscribe((event) => {
          if (event.id !== id) return;
          if (session === undefined) queued.push(event);
          else apply(event);
        }),
      );
      const input = terminal.onData((data) => {
        // Replayed output may contain queries; their answers are stale.
        if (session === undefined || replaying || exited) return;
        terminalApi.write({ id, session, data }).catch(fail);
      });
      const resized = terminal.onResize(({ cols, rows }) => {
        if (session !== undefined)
          terminalApi.resize({ id, session, cols, rows }).catch(fail);
      });
      cleanups.push(
        () => input.dispose(),
        () => resized.dispose(),
      );

      const { cols, rows } = terminal;
      const snapshot = await terminalApi.open({
        id,
        cols,
        rows,
        restart: launch.restart,
      });
      if (disposed) return;
      session = snapshot.session;
      sequence = snapshot.sequence;
      exited = snapshot.exitCode !== null;
      setExitCode(snapshot.exitCode);
      if (snapshot.output) {
        replaying = snapshot.reused;
        terminal.write(snapshot.output, () => {
          replaying = false;
        });
      }
      queued.splice(0).forEach(apply);
      // The panel may have changed size while the shell was starting.
      if (terminal.cols !== cols || terminal.rows !== rows)
        await terminalApi.resize({
          id,
          session,
          cols: terminal.cols,
          rows: terminal.rows,
        });
      const size = new ResizeObserver(refit);
      size.observe(host);
      cleanups.push(() => size.disconnect());
      terminal.focus();
    };
    start().catch(fail);

    return () => {
      disposed = true;
      cleanups.reverse().forEach((cleanup) => cleanup());
    };
  }, [id, folder, launch]);

  useEffect(() => {
    const terminal = instance.current;
    if (!terminal) return;
    terminal.options.cursorStyle = terminalCursor;
    terminal.options.cursorBlink = terminalCursorBlink;
  }, [terminalCursor, terminalCursorBlink]);

  return {
    screen,
    error,
    exitCode,
    terminalTheme,
    restart: () =>
      setLaunch((current) => ({ count: current.count + 1, restart: true })),
  };
};
