import type { GitSummary } from "@shared/contracts";
import { cn } from "~/lib/utils";
import { useLocale } from "~/providers/locale/context";

type GitChangesProps = { git: GitSummary; compact?: boolean };

export const GitChanges = ({ git, compact = false }: GitChangesProps) => {
  const { t } = useLocale();
  const count = git.root ? (git.changedFiles ?? 0) : 0;
  const label =
    count > 0
      ? t(count === 1 ? "1 changed file" : "{0} changed files", { 0: count })
      : "Unavailable";
  return (
    <span
      className={cn(
        "whitespace-nowrap text-xs",
        count > 0
          ? "rounded-full bg-warning/10 px-2 py-0.5 text-warning-ink"
          : "text-muted-foreground",
      )}
      title={git.reason ? t(git.reason) : label}
    >
      {compact && count > 0 ? count : label}
    </span>
  );
};
