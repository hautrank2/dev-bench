import { ArrowDown, ArrowUp, Check, CloudOff } from "lucide-react";

import type { GitSync } from "@shared/contracts";
import { cn } from "~/lib/utils";
import { useLocale } from "~/providers/locale/context";

type GitSyncStatusProps = { sync?: GitSync | null; compact?: boolean };

export const GitSyncStatus = ({
  sync,
  compact = false,
}: GitSyncStatusProps) => {
  const { t } = useLocale();
  // Unknown (no repository, or a main process older than this renderer).
  if (sync === undefined) return null;

  const count = (value: number, one: string, many: string) =>
    t(value === 1 ? one : many, { 0: value });
  const badges = !sync
    ? [
        {
          icon: CloudOff,
          label: t("No upstream"),
          short: t("No upstream"),
          tone: "bg-muted text-muted-foreground",
        },
      ]
    : [
        sync.ahead > 0 && {
          icon: ArrowUp,
          label: count(
            sync.ahead,
            "1 commit not pushed",
            "{0} commits not pushed",
          ),
          short: String(sync.ahead),
          tone: "bg-warning/10 text-warning-ink",
        },
        sync.behind > 0 && {
          icon: ArrowDown,
          label: count(sync.behind, "1 commit behind", "{0} commits behind"),
          short: String(sync.behind),
          tone: "bg-info/10 text-info",
        },
        !sync.ahead &&
          !sync.behind && {
            icon: Check,
            label: t("Pushed"),
            short: t("Pushed"),
            tone: "bg-success/10 text-success",
          },
      ].filter((badge) => !!badge);
  const hint = sync
    ? t("Compared with {0} at the last fetch.", { 0: sync.upstream })
    : t("This branch does not track a remote branch.");

  return (
    <span className="projects-git-sync inline-flex flex-wrap items-center gap-2">
      {badges.map(({ icon: Icon, label, short, tone }) => (
        <span
          key={label}
          title={`${label} · ${hint}`}
          className={cn(
            "inline-flex items-center gap-1 whitespace-nowrap",
            "rounded-full px-2 py-0.5 text-xs",
            tone,
          )}
        >
          <Icon aria-hidden="true" className="size-3" />
          {compact && short !== label ? (
            <>
              <span aria-hidden="true">{short}</span>
              <span className="sr-only">{label}</span>
            </>
          ) : (
            label
          )}
        </span>
      ))}
    </span>
  );
};
