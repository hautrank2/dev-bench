import { useMemo } from "react";
import { toast } from "sonner";

import type { BatchResult } from "@shared/contracts";
import type { Action } from "~/app/_projects/type";
import { useLocale } from "~/providers/locale/context";
import { useNotify } from "~/providers/messages/useNotify";

const LABELS: Record<Action, string> = {
  run: "Run",
  stop: "Stop",
  web: "Open Web",
  remote: "Open repository",
  terminal: "Open Terminal",
  copyPath: "Copy Path",
  pull: "Pull",
  push: "Push",
};

const reason = (error: unknown) =>
  error instanceof Error ? error.message : String(error);

/** How repository and project actions report, wherever they were started. */
export const useActionNotify = () => {
  const { t } = useLocale();
  const notify = useNotify();
  return useMemo(
    () => ({
      done: (name: string, kind: Action, output?: unknown) => {
        if (kind === "run") toast.success(t("{0}: Started", { 0: name }));
        if (kind === "stop") toast.success(t("{0}: Stopped", { 0: name }));
        if (kind === "copyPath")
          toast.success(t("{0}: Path copied", { 0: name }));
        if (kind === "pull" || kind === "push")
          notify.success(
            t("{0}: {1} completed", { 0: name, 1: LABELS[kind] }),
            String(output ?? ""),
          );
        // Opening a page or a terminal is its own feedback.
      },
      failed: (name: string, kind: Action, error: unknown) =>
        notify.error(
          t("{0}: {1} failed", { 0: name, 1: t(LABELS[kind]) }),
          t(reason(error)),
        ),
      /** Run All, Run project and Stop project: one message for every result. */
      batch: (name: string, results: BatchResult[], success: string) => {
        const failed = results.filter((result) => result.outcome === "Failed");
        const detail = [
          ...failed,
          ...results.filter((result) => result.outcome !== "Failed"),
        ]
          .map(
            (result) =>
              `${result.name}: ${t(result.outcome)} — ${t(result.message)}`,
          )
          .join("\n");
        if (failed.length)
          notify.error(
            t("{0}: {1} repositories failed", { 0: name, 1: failed.length }),
            detail,
          );
        else notify.success(success, detail);
      },
      error: (title: string, error: unknown) =>
        notify.error(t(title), t(reason(error))),
    }),
    [t, notify],
  );
};
