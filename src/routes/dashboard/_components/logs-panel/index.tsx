import { ScrollText } from "lucide-react";

import { Checkbox } from "~/components/ui/checkbox";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "~/components/ui/sheet";
import { cn } from "~/lib/utils";

import { useLogsPanel } from "./hook";
import type { LogsPanelProps } from "./type";

export const LogsPanel = (props: LogsPanelProps) => {
  const state = useLogsPanel(props);
  return (
    <Sheet open={props.open} onOpenChange={props.onOpenChange}>
      <SheetContent className="w-full gap-0 sm:max-w-3xl">
        <SheetHeader className="border-b p-6">
          <SheetTitle className="flex items-center gap-2">
            <ScrollText className="size-5" />
            {props.project.name} · Logs
          </SheetTitle>
          <SheetDescription>
            stdout, stderr and lifecycle events · Last 1,500 chunks
          </SheetDescription>
        </SheetHeader>
        <label className="flex items-center gap-2 border-b px-6 py-3">
          <Checkbox
            checked={state.follow}
            onCheckedChange={(value) => state.setFollow(value === true)}
          />
          Follow output
        </label>
        <div
          data-terminal-theme={state.terminalTheme}
          tabIndex={0}
          aria-label="Project process output"
          className={cn(
            "dashboard-log-output min-h-0 flex-1 overflow-auto",
            "bg-terminal-background text-terminal-foreground p-6 font-mono text-xs leading-6",
          )}
        >
          {state.query.isPending && <p role="status">Loading logs…</p>}
          {state.query.error && (
            <p role="alert" className="text-destructive">
              {state.query.error.message}
            </p>
          )}
          {state.query.data?.length === 0 && (
            <p className="text-terminal-muted">
              No output yet. Run this project to see its logs here.
            </p>
          )}
          {state.query.data?.map((entry) => (
            <div key={entry.sequence} className="mb-2">
              <span className="text-terminal-muted">
                {new Date(entry.time).toLocaleTimeString()} [{entry.stream}]
              </span>
              <pre
                className={cn(
                  "m-0 whitespace-pre-wrap break-all",
                  entry.stream === "stderr" && "text-terminal-error",
                  entry.stream === "system" && "text-terminal-muted",
                )}
              >
                {entry.text.replace(/\x1b\[[0-9;]*[A-Za-z]/g, "")}
              </pre>
            </div>
          ))}
          <div ref={state.end} />
        </div>
      </SheetContent>
    </Sheet>
  );
};
