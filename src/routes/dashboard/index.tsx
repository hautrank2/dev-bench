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
  LayoutGrid,
  List,
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
  X,
} from "lucide-react";

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

import { CommitDialog } from "./_components/commit-dialog";
import { GroupFormDialog } from "./_components/group-form";
import { LogsPanel } from "./_components/logs-panel";
import { ProjectFormDialog } from "./_components/project-form";
import { useDashboard } from "./hook";
import type { DashboardProps } from "./type";

export const Dashboard = (props: DashboardProps) => {
  const state = useDashboard(props);
  const view = props.view ?? "dashboard";
  const running = state.projects.filter(
    (repo) => repo.runtime.status === "Running",
  ).length;
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
  const actions = (repo: ProjectView) => (
    <div className="projects-repository-actions flex items-center justify-end gap-1.5">
      <Button
        size="sm"
        variant={active(repo) ? "outline" : "default"}
        disabled={
          ["Starting", "Stopping"].includes(repo.runtime.status) ||
          state.pending.some(
            (key) => key === `${repo.id}:run` || key === `${repo.id}:stop`,
          )
        }
        onClick={() => void state.action(repo, active(repo) ? "stop" : "run")}
      >
        {active(repo) ? (
          <Square className="size-3.5" />
        ) : (
          <Play className="size-3.5" />
        )}
        {active(repo) ? "Stop" : "Run"}
      </Button>
      <Button
        size="sm"
        variant="outline"
        onClick={() => void state.action(repo, "web")}
      >
        <ExternalLink />
        Open Web
      </Button>
      <Button
        size="icon-sm"
        variant="ghost"
        aria-label={`Logs for ${repo.name}`}
        onClick={() => state.setLogProject(repo)}
      >
        <ScrollText />
      </Button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            size="icon-sm"
            variant="ghost"
            aria-label={`Actions for ${repo.name}`}
          >
            <MoreHorizontal />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-52">
          <DropdownMenuItem onSelect={() => state.setEditor({ project: repo })}>
            <Settings2 />
            Edit Repository
          </DropdownMenuItem>
          <DropdownMenuItem
            onSelect={() => void state.action(repo, "copyPath")}
          >
            <Copy />
            Copy Path
          </DropdownMenuItem>
          <DropdownMenuItem
            onSelect={() => void state.action(repo, "terminal")}
          >
            <Terminal />
            Open Terminal
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
  const title = props.projectId
    ? (state.activeGroup?.name ?? "Project")
    : view === "dashboard"
      ? "Dashboard"
      : view === "processes"
        ? "Processes"
        : "Projects";
  const repositories =
    view === "dashboard"
      ? state.visibleRepositories.slice(0, 8)
      : state.visibleRepositories;
  return (
    <main className="projects-root mx-auto max-w-[1500px] space-y-6 p-5 sm:p-8">
      <section className="projects-heading flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-2">
          {props.projectId && (
            <Link
              to="/projects"
              className="mb-2 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="size-3.5" />
              All projects
            </Link>
          )}
          <p className="text-xs font-medium uppercase tracking-widest text-primary">
            {state.workspace.data?.deviceName ?? "Your workspace"}
          </p>
          <h1 className="text-3xl">{title}</h1>
          <p className="text-muted-foreground">
            {props.projectId
              ? state.activeGroup?.description ||
                "Repositories and services working together."
              : view === "dashboard"
                ? "Your projects, processes and next steps in one place."
                : view === "processes"
                  ? "Processes launched by Dev Bench, grouped by their repository."
                  : "One project. All of its repositories and services."}
          </p>
        </div>
        <div className="projects-toolbar flex flex-wrap gap-2">
          {props.projectId ? (
            <>
              <Button
                variant="outline"
                disabled={!state.activeGroup}
                onClick={() =>
                  state.activeGroup && state.editGroup(state.activeGroup)
                }
              >
                <Settings2 />
                Edit Project
              </Button>
              <Button
                variant="outline"
                onClick={() => state.setEditor({ groupId: props.projectId })}
              >
                <Plus />
                Add Repository
              </Button>
              <Button
                variant="outline"
                disabled={
                  state.batchBusy ||
                  !groupRepositories(props.projectId).some(active)
                }
                onClick={() => void state.runGroup(props.projectId ?? "", true)}
              >
                <Square />
                Stop project
              </Button>
              <Button
                loading={state.batchBusy}
                disabled={!groupRepositories(props.projectId).length}
                onClick={() => void state.runGroup(props.projectId ?? "")}
              >
                <Play />
                Run project
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={state.addGroup}>
                <Plus />
                Add Project
              </Button>
              <Button
                loading={state.batchBusy}
                disabled={!state.projects.some((repo) => repo.includeInRunAll)}
                onClick={() => void state.runAll()}
              >
                <Play />
                Run All
              </Button>
            </>
          )}
        </div>
      </section>
      <div className="projects-set-switcher flex flex-wrap items-center gap-3">
        <Select
          value={state.workspace.data?.activeSetId}
          onValueChange={(id) => void state.selectSet(id)}
        >
          <SelectTrigger className="w-64" aria-label="Active project set">
            <SelectValue placeholder="Project set" />
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
          {state.groups.length} projects · {state.projects.length} repositories
        </span>
      </div>
      {view === "dashboard" && (
        <section
          className="dashboard-stats grid grid-cols-2 gap-3 xl:grid-cols-4"
          aria-label="Workspace statistics"
        >
          {[
            { label: "Projects", value: state.groups.length },
            { label: "Repositories & services", value: state.projects.length },
            { label: "Running processes", value: running },
            {
              label: "In startup group",
              value: state.projects.filter((repo) => repo.includeInRunAll)
                .length,
            },
          ].map(({ label, value }, index) => (
            <div
              key={label}
              className={cn(
                "panel-surface rounded-xl border p-5",
                index === 0 &&
                  "featured-surface border-transparent text-featured-foreground",
              )}
            >
              <p
                className={cn(
                  "text-xs",
                  index === 0
                    ? "text-featured-foreground/80"
                    : "text-muted-foreground",
                )}
              >
                {label}
              </p>
              <p className="mt-3 text-3xl font-semibold tabular-nums">
                {value}
              </p>
            </div>
          ))}
        </section>
      )}
      {state.query.isPending && (
        <p role="status" className="p-10 text-center text-muted-foreground">
          Loading workspace…
        </p>
      )}
      {(state.query.error || state.workspace.error) && (
        <p role="alert" className="whitespace-pre-wrap text-destructive">
          {state.query.error?.message ?? state.workspace.error?.message}
        </p>
      )}
      {state.result && (
        <section
          className={cn(
            "projects-action-result rounded-xl border bg-card p-4",
            state.result.failed && "border-destructive/40",
          )}
          role={state.result.failed ? "alert" : "status"}
        >
          <div className="flex items-center justify-between gap-3">
            <h4>{state.result.title}</h4>
            <Button
              size="icon-sm"
              variant="ghost"
              aria-label="Dismiss action result"
              onClick={() => state.setResult(null)}
            >
              <X />
            </Button>
          </div>
          <pre className="mt-2 max-h-52 overflow-auto whitespace-pre-wrap break-all text-xs">
            {state.result.output}
          </pre>
        </section>
      )}
      {state.batch && (
        <section
          className="projects-batch-results rounded-xl border bg-card p-4"
          aria-label="Batch results"
        >
          <div className="mb-2 flex items-center justify-between">
            <h4>Run results</h4>
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="Dismiss Run All results"
              onClick={() => state.setBatch(null)}
            >
              <X />
            </Button>
          </div>
          {state.batch.map((result) => (
            <div
              key={result.id}
              className="grid gap-2 border-t py-2 sm:grid-cols-[1fr_90px_2fr]"
            >
              <span>{result.name}</span>
              <span
                className={
                  result.outcome === "Failed"
                    ? "text-destructive"
                    : "text-muted-foreground"
                }
              >
                {result.outcome}
              </span>
              <p className="whitespace-pre-wrap break-words text-xs text-muted-foreground">
                {result.message}
              </p>
            </div>
          ))}
        </section>
      )}
      {!props.projectId && view !== "processes" && (
        <section className="projects-overview space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg">
              {view === "dashboard" ? "Your projects" : "All projects"}
            </h2>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
                <Input
                  value={state.search}
                  onChange={(event) => state.setSearch(event.target.value)}
                  className="w-48 pl-9"
                  placeholder="Search projects…"
                  aria-label="Search projects"
                />
              </div>
              <Button
                size="icon"
                variant={state.viewMode === "cards" ? "secondary" : "ghost"}
                aria-label="Card view"
                aria-pressed={state.viewMode === "cards"}
                onClick={() => state.setViewMode("cards")}
              >
                <LayoutGrid />
              </Button>
              <Button
                size="icon"
                variant={state.viewMode === "table" ? "secondary" : "ghost"}
                aria-label="Table view"
                aria-pressed={state.viewMode === "table"}
                onClick={() => state.setViewMode("table")}
              >
                <List />
              </Button>
            </div>
          </div>
          {!state.groups.length && !state.query.isPending && (
            <div className="projects-empty flex flex-col items-center gap-3 rounded-xl border bg-card p-12 text-center">
              <FolderGit2 className="size-10 text-primary" />
              <h3>Bring your repositories together</h3>
              <p className="max-w-md text-muted-foreground">
                Create a project like OpsDesk, then add its client, server,
                mobile app and broker.
              </p>
              <Button onClick={state.addGroup}>
                <Plus />
                Add Project
              </Button>
            </div>
          )}
          {state.groups.length > 0 && groups.length === 0 && (
            <p className="p-8 text-center text-muted-foreground">
              No matching projects.
            </p>
          )}
          {state.viewMode === "cards" ? (
            <div className="projects-card-grid grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {groups.map((group) => {
                const repos = groupRepositories(group.id);
                const activeCount = repos.filter(active).length;
                return (
                  <article
                    key={group.id}
                    data-group-id={group.id}
                    className="projects-card panel-surface flex flex-col rounded-xl border p-5"
                  >
                    <div className="flex items-center gap-3">
                      <div className="grid size-10 place-items-center rounded-lg bg-primary/10 text-primary">
                        <FolderGit2 className="size-5" />
                      </div>
                      <div className="min-w-0">
                        <Link
                          to={`/projects/${group.id}`}
                          className="block truncate font-semibold"
                        >
                          {group.name}
                        </Link>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {repos.length} repositories · {activeCount} active
                        </p>
                      </div>
                      <Button
                        size="icon-sm"
                        variant="ghost"
                        className="ml-auto"
                        aria-label={`Edit project ${group.name}`}
                        onClick={() => state.editGroup(group)}
                      >
                        <Settings2 />
                      </Button>
                    </div>
                    <p className="my-4 min-h-10 text-sm text-muted-foreground">
                      {group.description ||
                        "A workspace for related repositories and services."}
                    </p>
                    <div className="mb-5 flex flex-wrap gap-1.5">
                      {repos.slice(0, 4).map((repo) => (
                        <span
                          key={repo.id}
                          className={cn(
                            "rounded-md border px-2 py-1 text-xs",
                            active(repo)
                              ? "border-success/20 bg-success/5 text-success"
                              : "text-muted-foreground",
                          )}
                        >
                          {repo.name}
                        </span>
                      ))}
                      {repos.length > 4 && (
                        <span className="p-1 text-xs text-muted-foreground">
                          +{repos.length - 4}
                        </span>
                      )}
                    </div>
                    <div className="mt-auto flex flex-wrap justify-between gap-2 border-t pt-4">
                      <Button variant="ghost" size="sm" asChild>
                        <Link to={`/projects/${group.id}`}>Open project</Link>
                      </Button>
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={!activeCount || state.batchBusy}
                          onClick={() => void state.runGroup(group.id, true)}
                        >
                          <Square />
                          Stop
                        </Button>
                        <Button
                          size="sm"
                          disabled={!repos.length || state.batchBusy}
                          onClick={() => void state.runGroup(group.id)}
                        >
                          <Play />
                          Run
                        </Button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            groups.length > 0 && (
              <div
                className="projects-table overflow-x-auto rounded-xl border bg-card"
                tabIndex={0}
              >
                <table className="w-full text-left">
                  <thead className="border-b bg-muted/40 text-xs text-muted-foreground">
                    <tr>
                      <th className="p-4">Project</th>
                      <th className="p-4">Repositories</th>
                      <th className="p-4">Active</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {groups.map((group) => {
                      const repos = groupRepositories(group.id);
                      return (
                        <tr
                          key={group.id}
                          data-group-id={group.id}
                          className="border-b last:border-0"
                        >
                          <td className="p-4">
                            <Link
                              to={`/projects/${group.id}`}
                              className="font-medium hover:text-primary"
                            >
                              {group.name}
                            </Link>
                            <p className="mt-1 text-xs text-muted-foreground">
                              {group.description}
                            </p>
                          </td>
                          <td className="p-4">{repos.length}</td>
                          <td className="p-4">{repos.filter(active).length}</td>
                          <td className="p-4">
                            <div className="flex justify-end gap-2">
                              <Button size="sm" variant="outline" asChild>
                                <Link to={`/projects/${group.id}`}>
                                  Open project
                                </Link>
                              </Button>
                              <Button
                                size="sm"
                                disabled={!repos.length || state.batchBusy}
                                onClick={() => void state.runGroup(group.id)}
                              >
                                <Play />
                                Run
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )
          )}
        </section>
      )}
      {(props.projectId || view === "processes" || view === "dashboard") && (
        <section
          className="projects-repositories space-y-4"
          aria-label="Repositories"
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg">
              {view === "processes"
                ? "Process list"
                : props.projectId
                  ? "Repositories & services"
                  : "Repository activity"}
            </h2>
            <div className="flex items-center gap-2">
              {view !== "dashboard" && (
                <Input
                  value={state.search}
                  onChange={(event) => state.setSearch(event.target.value)}
                  placeholder="Search repositories…"
                  aria-label="Search repositories"
                  className="w-56"
                />
              )}
              <Button
                variant="ghost"
                size="icon"
                aria-label="Refresh repositories"
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
                Project not found in this set.
              </p>
            )}
          {repositories.length === 0 && !state.query.isPending && (
            <div className="rounded-xl border bg-card px-6 py-12 text-center">
              <Activity className="mx-auto mb-3 size-7 text-muted-foreground" />
              <p className="text-muted-foreground">
                {view === "processes"
                  ? "No active or failed processes."
                  : "No repositories here yet."}
              </p>
              {props.projectId && (
                <Button
                  className="mt-4"
                  variant="outline"
                  onClick={() => state.setEditor({ groupId: props.projectId })}
                >
                  <Plus />
                  Add Repository
                </Button>
              )}
            </div>
          )}
          <div className="projects-repository-list divide-y overflow-hidden rounded-xl border bg-card">
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
                        {repo.runtime.status}
                      </span>
                      {view !== "projects" && (
                        <Link
                          to={`/projects/${repo.groupId}`}
                          className="text-xs text-muted-foreground hover:text-primary"
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
                        {repo.git.branch ?? "No Git"}
                      </span>
                      <code>{repo.command || "No run command"}</code>
                      {repo.runtime.pid && <span>PID {repo.runtime.pid}</span>}
                    </p>
                  </div>
                  {actions(repo)}
                </div>
                {repo.git.root && (
                  <p
                    className="truncate font-mono text-xs text-muted-foreground"
                    title={repo.git.root}
                  >
                    Git repo: {repo.git.root}
                  </p>
                )}
                {!repo.git.root && (
                  <p className="break-words text-xs text-muted-foreground">
                    Git unavailable: {repo.git.reason}
                  </p>
                )}
                {repo.git.operation && (
                  <p role="status" className="text-xs text-primary">
                    Git: {repo.git.operation} in progress…
                  </p>
                )}
                {(repo.runtime.error || repo.git.error) && (
                  <p className="whitespace-pre-wrap break-words rounded-lg bg-destructive/5 p-3 text-xs text-destructive">
                    {repo.runtime.error}
                    {repo.runtime.error && repo.git.error ? "\n" : ""}
                    {repo.git.error}
                  </p>
                )}
              </article>
            ))}
          </div>
        </section>
      )}
      <p className="projects-footnote text-xs text-muted-foreground">
        Running means the process is alive. Check Ports and Logs for service
        details.
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
