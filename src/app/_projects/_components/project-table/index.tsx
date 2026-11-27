import { Link } from "@tanstack/react-router";
import {
  FolderOpen,
  GitBranch,
  Play,
  Plus,
  Settings2,
  Square,
} from "lucide-react";
import { Fragment } from "react";

import { Button } from "~/components/ui/button";
import { cn } from "~/lib/utils";
import { useLocale } from "~/providers/locale/context";

import { GitChanges } from "../git-changes";
import { GitSyncStatus } from "../git-sync";
import { IconTooltip } from "../icon-tooltip";
import type { ProjectTableProps } from "./type";

export const ProjectTable = ({
  groups,
  repositoriesOf,
  isActive,
  busy,
  onEdit,
  onRun,
  onAddRepository,
  renderActions,
}: ProjectTableProps) => {
  const { t } = useLocale();
  return (
    <div
      className="projects-table table-scroll rounded-md border bg-card"
      tabIndex={0}
    >
      <table className="w-full text-left">
        <thead className="border-b bg-muted/40 text-xs text-muted-foreground">
          <tr>
            <th className="p-4">{t("Project")}</th>
            <th className="p-4">{t("Repositories")}</th>
            <th className="p-4">{t("Active")}</th>
            <th className="p-4 text-right">{t("Actions")}</th>
          </tr>
        </thead>
        <tbody>
          {groups.map((group) => {
            const repos = repositoriesOf(group.id);
            const activeCount = repos.filter(isActive).length;
            return (
              <Fragment key={group.id}>
                <tr
                  data-group-id={group.id}
                  className="projects-table-row border-t bg-muted/20 first:border-t-0"
                >
                  <td className="p-4">
                    <Link
                      to={`/projects/${group.id}`}
                      className="font-medium hover:text-primary-ink"
                    >
                      {group.name}
                    </Link>
                    {group.description && (
                      <p className="mt-1 text-xs text-muted-foreground">
                        {group.description}
                      </p>
                    )}
                  </td>
                  <td className="p-4">{repos.length}</td>
                  <td className="p-4">{activeCount}</td>
                  <td className="p-4">
                    <div className="flex justify-end gap-2">
                      <IconTooltip label={t("Edit Project")}>
                        <Button
                          size="icon-sm"
                          variant="ghost"
                          aria-label={t("Edit project {0}", { 0: group.name })}
                          onClick={() => onEdit(group)}
                        >
                          <Settings2 />
                        </Button>
                      </IconTooltip>
                      <IconTooltip label={t("Add Repository")}>
                        <Button
                          size="icon-sm"
                          variant="outline"
                          aria-label={t("Add Repository")}
                          onClick={() => onAddRepository(group.id)}
                        >
                          <Plus />
                        </Button>
                      </IconTooltip>
                      <IconTooltip label={t("Open project")}>
                        <Button size="icon-sm" variant="outline" asChild>
                          <Link
                            to={`/projects/${group.id}`}
                            aria-label={t("Open project")}
                          >
                            <FolderOpen />
                          </Link>
                        </Button>
                      </IconTooltip>
                      <IconTooltip label={t("Stop project")}>
                        <Button
                          size="icon-sm"
                          variant="destructive"
                          disabled={!activeCount || busy}
                          aria-label={t("Stop project {0}", { 0: group.name })}
                          onClick={() => void onRun(group.id, true)}
                        >
                          <Square />
                        </Button>
                      </IconTooltip>
                      <IconTooltip label={t("Run project")}>
                        <Button
                          size="icon-sm"
                          variant="primary"
                          disabled={!repos.length || busy}
                          aria-label={t("Run project {0}", { 0: group.name })}
                          onClick={() => void onRun(group.id)}
                        >
                          <Play />
                        </Button>
                      </IconTooltip>
                    </div>
                  </td>
                </tr>
                <tr data-group-repositories={group.id}>
                  <td colSpan={4} className="p-0">
                    {repos.length === 0 ? (
                      <p className="px-4 py-3 pl-8 text-xs text-muted-foreground">
                        {t("No repositories here yet.")}
                      </p>
                    ) : (
                      <div
                        className="table-scroll table-scroll-nested"
                        tabIndex={0}
                      >
                        <table
                          className="projects-subtable w-full text-left text-sm"
                          aria-label={t("Repositories")}
                        >
                          <thead className="text-xs text-muted-foreground">
                            <tr>
                              <th className="py-2 pl-8 pr-4">
                                {t("Repository")}
                              </th>
                              <th className="px-4 py-2">{t("Status")}</th>
                              <th className="px-4 py-2">{t("Branch")}</th>
                              <th className="px-4 py-2">{t("Git changes")}</th>
                              <th className="px-4 py-2 text-right">
                                {t("Actions")}
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {repos.map((repo) => (
                              <tr
                                key={repo.id}
                                data-repository-id={repo.id}
                                className="border-t first:border-t-0"
                              >
                                <td className="w-[30%] py-3 pl-8 pr-4">
                                  <Link
                                    to={`/projects/${group.id}/repositories/${repo.id}`}
                                    className="font-medium hover:text-primary-ink"
                                  >
                                    {repo.name}
                                  </Link>
                                  <p
                                    className="mt-0.5 max-w-xs truncate font-mono text-xs text-muted-foreground"
                                    title={repo.folder}
                                  >
                                    {repo.folder}
                                  </p>
                                </td>
                                <td className="px-4 py-3">
                                  <span
                                    className={cn(
                                      "whitespace-nowrap rounded-full px-2 py-0.5 text-xs",
                                      repo.runtime.status === "Running"
                                        ? "bg-success/10 text-success"
                                        : repo.runtime.status === "Failed"
                                          ? "bg-destructive/10 text-destructive"
                                          : "bg-muted text-muted-foreground",
                                    )}
                                  >
                                    {t(repo.runtime.status)}
                                  </span>
                                </td>
                                <td className="px-4 py-3 text-xs text-muted-foreground">
                                  <span className="inline-flex items-center gap-1 whitespace-nowrap">
                                    <GitBranch className="size-3.5" />
                                    {repo.git.branch ?? t("No Git")}
                                  </span>
                                </td>
                                <td className="px-4 py-3">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <GitChanges git={repo.git} compact />
                                    <GitSyncStatus
                                      sync={repo.git.sync}
                                      compact
                                    />
                                  </div>
                                </td>
                                <td className="px-4 py-3">
                                  {renderActions(repo, true)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </td>
                </tr>
              </Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
