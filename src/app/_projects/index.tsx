import { Link } from "@tanstack/react-router";
import {
  Activity,
  ArrowLeft,
  Copy,
  ExternalLink,
  FolderGit2,
  GitBranch,
  GitCommitHorizontal,
  GitPullRequestArrow,
  MoreHorizontal,
  Play,
  Plus,
  RefreshCw,
  ScrollText,
  Search,
  Settings2,
  Square,
  Terminal,
  Upload,
} from "lucide-react";
import type { ReactNode } from "react";

import type { ProjectView } from "@shared/contracts";
import { Button } from "~/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { Input } from "~/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { cn } from "~/lib/utils";
import { useLocale } from "~/providers/locale/context";
import { REMOTE_LINKS } from "~/utils/remote";

import { CommitDialog } from "./_components/commit-dialog";
import { GitChanges } from "./_components/git-changes";
import { GitSyncStatus } from "./_components/git-sync";
import { GroupFormDialog } from "./_components/group-form";
import { IconTooltip } from "./_components/icon-tooltip";
import { LogsPanel } from "./_components/logs-panel";
import { ProjectFormDialog } from "./_components/project-form";
import { ProjectTable } from "./_components/project-table";
import { RepositoryConsole } from "./_components/repository-console";
import { useProjects } from "./hook";
import type { ProjectsProps } from "./type";

export const Projects = (props: ProjectsProps) => {
  const { t } = useLocale();

  const state = useProjects(props);
  const view = props.view ?? "projects";
  const active = (repo: ProjectView) =>
    !!repo.runtime.pid ||
    ["Starting", "Running", "Stopping"].includes(repo.runtime.status);
  const groupRepositories = (id: string) =>
    state.projects.filter((repo) => repo.groupId === id);
  const groups = state.groups.filter((group) =>
    `${group.name} ${group.description} ${groupRepositories(group.id)
      .map((repo) => repo.name)
      .join(" ")}`
      .toLowerCase()
      .includes(state.search.toLowerCase()),
  );
  // The table is dense, so it shows icons only and moves labels into tooltips.
  const withTooltip = (iconOnly: boolean, label: string, button: ReactNode) =>
    iconOnly ? <IconTooltip label={label}>{button}</IconTooltip> : button;
  const actions = (repo: ProjectView, iconOnly = false) => {
    const runLabel = active(repo) ? t("Stop") : t("Run");
    const remote = repo.git.web && REMOTE_LINKS[repo.git.web.provider];
    return (
      <div className="projects-repository-actions flex items-center justify-end gap-1.5">
        {withTooltip(
          iconOnly,
          runLabel,
          <Button
            size={iconOnly ? "icon-sm" : "sm"}
            variant={active(repo) ? "destructive" : "primary"}
            aria-label={iconOnly ? runLabel : undefined}
            disabled={
              ["Starting", "Stopping"].includes(repo.runtime.status) ||
              state.pending.some(
                (key) => key === `${repo.id}:run` || key === `${repo.id}:stop`,
              )
            }
            onClick={() =>
              void state.action(repo, active(repo) ? "stop" : "run")
            }
          >
            {active(repo) ? (
              <Square className="size-3.5" />
            ) : (
              <Play className="size-3.5" />
            )}
            {!iconOnly && runLabel}
          </Button>,
        )}
        {withTooltip(
          iconOnly,
          t("Open Web"),
          <Button
            size={iconOnly ? "icon-sm" : "sm"}
            variant="outline"
            aria-label={iconOnly ? t("Open Web") : undefined}
            onClick={() => void state.action(repo, "web")}
          >
            <ExternalLink />
            {!iconOnly && t("Open Web")}
          </Button>,
        )}
        {remote &&
          withTooltip(
            iconOnly,
            t(remote.label),
            <Button
              size={iconOnly ? "icon-sm" : "sm"}
              variant="outline"
              aria-label={iconOnly ? t(remote.label) : undefined}
              onClick={() => void state.action(repo, "remote")}
            >
              <remote.Icon />
              {!iconOnly && t(remote.label)}
            </Button>,
          )}
        {!props.repositoryId &&
          withTooltip(
            iconOnly,
            t("Logs for {0}", { 0: repo.name }),
            <Button
              size="icon-sm"
              variant="ghost"
              aria-label={t("Logs for {0}", { 0: repo.name })}
              onClick={() => state.setLogProject(repo)}
            >
              <ScrollText />
            </Button>,
          )}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              size="icon-sm"
              variant="ghost"
              aria-label={t("Actions for {0}", { 0: repo.name })}
            >
              <MoreHorizontal />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            <DropdownMenuItem
              onSelect={() => state.setEditor({ project: repo })}
            >
              <Settings2 />
              {t("Edit Repository")}
            </DropdownMenuItem>
            <DropdownMenuItem
              onSelect={() => void state.action(repo, "copyPath")}
            >
              <Copy />
              {t("Copy Path")}
            </DropdownMenuItem>
            <DropdownMenuItem
              onSelect={() => void state.action(repo, "terminal")}
            >
              <Terminal />
              {t("Open Terminal")}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              disabled={!repo.git.root || !!repo.git.operation}
              onSelect={() => void state.action(repo, "pull")}
            >
              <GitPullRequestArrow />
              Pull Code
            </DropdownMenuItem>
            <DropdownMenuItem
              disabled={!repo.git.root || !!repo.git.operation}
              onSelect={() => state.setCommitProject(repo)}
            >
              <GitCommitHorizontal />
              Git Commit
            </DropdownMenuItem>
            <DropdownMenuItem
              disabled={!repo.git.root || !!repo.git.operation}
              onSelect={() => void state.action(repo, "push")}
            >
              <Upload />
              Push
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    );
  };
  const title = props.repositoryId
    ? (state.activeRepository?.name ?? t("Repository"))
    : props.projectId
      ? (state.activeGroup?.name ?? t("Project"))
      : view === "processes"
        ? t("Processes")
        : t("Projects");
  const repositories = state.visibleRepositories;
  return (
    <main className="projects-root mx-auto max-w-[1500px] space-y-6 p-5 sm:p-8">
      <section className="projects-heading flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-2">
          {props.projectId && (
            <Link
              to={
                props.repositoryId
                  ? `/projects/${props.projectId}`
                  : "/projects"
              }
              className="mb-2 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="size-3.5" />
              {props.repositoryId
                ? (state.activeGroup?.name ?? t("Project"))
                : t("All projects")}
            </Link>
          )}
          <p className="text-xs font-medium uppercase tracking-widest text-primary-ink">
            {state.workspace.data?.deviceName ?? t("Your workspace")}
          </p>
          <h1>{title}</h1>
          <p className="text-muted-foreground">
            {props.repositoryId
              ? t("Logs and actions for this repository.")
              : props.projectId
                ? state.activeGroup?.description ||
                  t("Repositories and services working together.")
                : view === "processes"
                  ? t(
                      "Processes launched by DevBench, grouped by their repository.",
                    )
                  : t("One project. All of its repositories and services.")}
          </p>
        </div>
        <div className="projects-toolbar flex flex-wrap gap-2">
          {props.repositoryId ? (
            state.activeRepository && actions(state.activeRepository)
          ) : props.projectId ? (
            <>
              <Button
                variant="text"
                disabled={!state.activeGroup}
                onClick={() =>
                  state.activeGroup && state.editGroup(state.activeGroup)
                }
              >
                <Settings2 />
                {t("Edit Project")}
              </Button>
              <Button
                variant="outline"
                onClick={() => state.setEditor({ groupId: props.projectId })}
              >
                <Plus />
                {t("Add Repository")}
              </Button>
              <Button
                variant="destructive"
                disabled={
                  state.batchBusy ||
                  !groupRepositories(props.projectId).some(active)
                }
                onClick={() => void state.runGroup(props.projectId ?? "", true)}
              >
                <Square />
                {t("Stop project")}
              </Button>
              <Button
                variant="primary"
                loading={state.batchBusy}
                disabled={!groupRepositories(props.projectId).length}
                onClick={() => void state.runGroup(props.projectId ?? "")}
              >
                <Play />
                {t("Run project")}
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={state.addGroup}>
                <Plus />
                {t("Add Project")}
              </Button>
              <Button
                variant="primary"
                loading={state.batchBusy}
                disabled={!state.projects.some((repo) => repo.includeInRunAll)}
                onClick={() => void state.runAll()}
              >
                <Play />
                {t("Run All")}
              </Button>
            </>
          )}
        </div>
      </section>
      {!props.projectId && (
        <div className="projects-set-switcher flex flex-wrap items-center gap-3">
          <Select
            value={state.workspace.data?.activeSetId}
            onValueChange={(id) => void state.selectSet(id)}
          >
            <SelectTrigger
              className="w-64"
              aria-label={t("Active project set")}
            >
              <SelectValue placeholder={t("Project set")} />
            </SelectTrigger>
            <SelectContent>
              {state.workspace.data?.sets.map((set) => (
                <SelectItem key={set.id} value={set.id}>
                  {set.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <span className="text-xs text-muted-foreground">
            {t("{0} projects · {1} repositories", {
              0: state.groups.length,
              1: state.projects.length,
            })}
          </span>
        </div>
      )}
      {state.query.isPending && (
        <p role="status" className="p-10 text-center text-muted-foreground">
          {t("Loading workspace…")}
        </p>
      )}
      {!props.projectId && view !== "processes" && (
        <section className="projects-overview space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg">{t("All projects")}</h2>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
                <Input
                  value={state.search}
                  onChange={(event) => state.setSearch(event.target.value)}
                  className="w-48 pl-9"
                  placeholder={t("Search projects…")}
                  aria-label={t("Search projects")}
                />
              </div>
              <Button
                variant="outline"
                size="sm"
                disabled={state.query.isFetching}
                onClick={() => void state.query.refetch()}
              >
                <RefreshCw
                  className={cn(state.query.isFetching && "animate-spin")}
                />
                {t("Reload Git changes")}
              </Button>
            </div>
          </div>
          {!state.groups.length &&
            !state.query.isPending &&
            !state.query.error &&
            !state.workspace.error && (
              <div className="projects-empty flex flex-col items-center gap-3 rounded-md border bg-card p-12 text-center">
                <FolderGit2 className="size-10 text-primary-ink" />
                <h3>{t("Bring your repositories together")}</h3>
                <p className="max-w-md text-muted-foreground">
                  {t(
                    "Create a project, then add its repositories and services.",
                  )}
                </p>
                <Button variant="primary" onClick={state.addGroup}>
                  <Plus />
                  {t("Add Project")}
                </Button>
              </div>
            )}
          {state.groups.length > 0 && groups.length === 0 && (
            <p className="p-8 text-center text-muted-foreground">
              {t("No matching projects.")}
            </p>
          )}
          {groups.length > 0 && (
            <ProjectTable
              groups={groups}
              repositoriesOf={groupRepositories}
              isActive={active}
              busy={state.batchBusy}
              onEdit={state.editGroup}
              onRun={state.runGroup}
              onAddRepository={(groupId) => state.setEditor({ groupId })}
              renderActions={actions}
            />
          )}
        </section>
      )}
      {(props.projectId || view === "processes") && (
        <section
          className="projects-repositories space-y-4"
          aria-label={t("Repositories")}
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg">
              {view === "processes"
                ? "Process list"
                : props.repositoryId
                  ? t("Repository details")
                  : props.projectId
                    ? t("Repositories & services")
                    : t("Repositories")}
            </h2>
            <div className="flex items-center gap-2">
              {!props.repositoryId && (
                <Input
                  value={state.search}
                  onChange={(event) => state.setSearch(event.target.value)}
                  placeholder={t("Search repositories…")}
                  aria-label={t("Search repositories")}
                  className="w-56"
                />
              )}
              <Button
                variant="ghost"
                size="icon"
                aria-label={t("Refresh repositories")}
                onClick={() => void state.query.refetch()}
              >
                <RefreshCw
                  className={cn(
                    "size-4",
                    state.query.isFetching && "animate-spin",
                  )}
                />
              </Button>
            </div>
          </div>
          {props.projectId &&
            !state.activeGroup &&
            !state.workspace.isPending && (
              <p role="alert" className="text-destructive">
                {t("Project not found in this set.")}
              </p>
            )}
          {repositories.length === 0 && !state.query.isPending && (
            <div className="rounded-md border bg-card px-6 py-12 text-center">
              <Activity className="mx-auto mb-3 size-7 text-muted-foreground" />
              <p className="text-muted-foreground">
                {props.repositoryId
                  ? t("Repository not found in this project set.")
                  : view === "processes"
                    ? t("No active or failed processes.")
                    : t("No repositories here yet.")}
              </p>
              {props.projectId && !props.repositoryId && (
                <Button
                  className="mt-4"
                  variant="outline"
                  onClick={() => state.setEditor({ groupId: props.projectId })}
                >
                  <Plus />
                  {t("Add Repository")}
                </Button>
              )}
            </div>
          )}
          <div className="projects-repository-list divide-y overflow-hidden rounded-md border bg-card">
            {repositories.map((repo) => (
              <article
                key={repo.id}
                data-repository-id={repo.id}
                className="projects-repository-row space-y-3 p-5"
              >
                <div className="flex flex-wrap items-center gap-4">
                  <div className="min-w-0 flex-1 basis-52">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-base">{repo.name}</h3>
                      <span
                        className={cn(
                          "rounded-full px-2 py-0.5 text-xs",
                          repo.runtime.status === "Running"
                            ? "bg-success/10 text-success"
                            : repo.runtime.status === "Failed"
                              ? "bg-destructive/10 text-destructive"
                              : "bg-muted text-muted-foreground",
                        )}
                      >
                        {t(repo.runtime.status)}
                      </span>
                      {view !== "projects" && (
                        <Link
                          to={`/projects/${repo.groupId}`}
                          className="text-xs text-muted-foreground hover:text-primary-ink"
                        >
                          {
                            state.groups.find(
                              (group) => group.id === repo.groupId,
                            )?.name
                          }
                        </Link>
                      )}
                    </div>
                    <p
                      className="mt-1 truncate font-mono text-xs text-muted-foreground"
                      title={repo.folder}
                    >
                      {repo.folder}
                    </p>
                    <p className="mt-2 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                      <span className="inline-flex items-center gap-1">
                        <GitBranch className="size-3.5" />
                        {repo.git.branch ?? t("No Git")}
                      </span>
                      <code>{repo.command || t("No run command")}</code>
                      {repo.runtime.pid && <span>PID {repo.runtime.pid}</span>}
                    </p>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <GitChanges git={repo.git} />
                      <GitSyncStatus sync={repo.git.sync} />
                    </div>
                  </div>
                  {!props.repositoryId && actions(repo)}
                </div>
                {repo.git.root && (
                  <p
                    className="truncate font-mono text-xs text-muted-foreground"
                    title={repo.git.root}
                  >
                    {t("Git repo: ")}
                    {repo.git.root}
                  </p>
                )}
                {!repo.git.root && (
                  <p className="break-words text-xs text-muted-foreground">
                    {t("Git unavailable: ")}
                    {t(repo.git.reason ?? "")}
                  </p>
                )}
                {repo.git.operation && (
                  <p role="status" className="text-xs text-primary-ink">
                    Git: {repo.git.operation} {t(" in progress…")}
                  </p>
                )}
                {(repo.runtime.error || repo.git.error) && (
                  <p className="whitespace-pre-wrap break-words rounded-md bg-destructive/5 p-3 text-xs text-destructive">
                    {t(repo.runtime.error ?? "")}
                    {repo.runtime.error && repo.git.error ? "\n" : ""}
                    {t(repo.git.error ?? "")}
                  </p>
                )}
              </article>
            ))}
          </div>
        </section>
      )}
      {props.repositoryId && state.activeRepository && (
        <RepositoryConsole
          key={state.activeRepository.id}
          project={state.activeRepository}
        />
      )}
      <p className="projects-footnote text-xs text-muted-foreground">
        {t(
          "Running means the process is alive. Check Ports and Logs for service details.",
        )}
      </p>
      <GroupFormDialog
        key={
          state.groupDialogOpen ? (state.groupEditor?.id ?? "new") : "closed"
        }
        open={state.groupDialogOpen}
        isEdit={!!state.groupEditor}
        defaultValues={state.groupEditor}
        onSubmit={state.saveGroup}
        onOpenChange={state.setGroupDialogOpen}
      />
      {state.editor && (
        <ProjectFormDialog
          open
          isEdit={!!state.editor.project}
          groups={state.groups}
          defaultValues={
            state.editor.project ?? {
              groupId: state.editor.groupId,
              name: "",
              folder: "",
              command: "",
              url: "",
              includeInRunAll: true,
            }
          }
          focusField={state.editor.focusField}
          onSubmit={state.save}
          executionLocked={
            !!state.editor.project && active(state.editor.project)
          }
          onOpenChange={(open) => {
            if (!open) state.setEditor(null);
          }}
        />
      )}
      {state.commitProject && (
        <CommitDialog
          project={state.commitProject}
          open
          onOpenChange={(open) => {
            if (!open) state.setCommitProject(null);
          }}
        />
      )}
      {state.logProject && (
        <LogsPanel
          project={state.logProject}
          open
          onOpenChange={(open) => {
            if (!open) state.setLogProject(null);
          }}
        />
      )}
    </main>
  );
};
