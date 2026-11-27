import "@xterm/xterm/css/xterm.css";

import { RotateCw } from "lucide-react";

import { Button } from "~/components/ui/button";
import { cn } from "~/lib/utils";
import { useLocale } from "~/providers/locale/context";

import { useTerminalPanel } from "./hook";
import type { TerminalPanelProps } from "./type";

export const TerminalPanel = (props: TerminalPanelProps) => {
  const { t } = useLocale();
  const state = useTerminalPanel(props);
  return (
    <section
      aria-label={t("Terminal for {0}", { 0: props.project.name })}
      className="repository-terminal flex h-[440px] min-h-0 flex-col overflow-hidden rounded-lg border bg-card"
    >
      <div className="repository-terminal-toolbar flex items-center justify-between gap-3 border-b px-4 py-2">
        <p
          className="min-w-0 truncate font-mono text-xs text-muted-foreground"
          title={props.project.folder}
        >
          {props.project.folder}
        </p>
        <Button size="sm" variant="outline" onClick={state.restart}>
          <RotateCw />
          {t("Restart terminal")}
        </Button>
      </div>
      {state.error && (
        <p
          role="alert"
          className="whitespace-pre-wrap border-b px-4 py-2 text-xs text-destructive"
        >
          {t(state.error)}
        </p>
      )}
      {state.exitCode !== null && (
        <p
          role="status"
          className="border-b px-4 py-2 text-xs text-muted-foreground"
        >
          {t("Shell exited with code {0}.", { 0: state.exitCode })}
        </p>
      )}
      <div
        data-terminal-theme={state.terminalTheme}
        className={cn(
          "repository-terminal-screen min-h-0 flex-1 p-3",
          "bg-terminal-background font-mono text-terminal-foreground",
        )}
      >
        <div ref={state.screen} className="h-full w-full overflow-hidden" />
      </div>
    </section>
  );
};
