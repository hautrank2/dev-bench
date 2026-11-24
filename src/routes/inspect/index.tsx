import { Link } from "@tanstack/react-router";
import {
  CheckCircle2,
  ExternalLink,
  FileText,
  Globe,
  Network,
  RefreshCw,
  Search,
  Terminal,
  XCircle,
} from "lucide-react";

import { Button } from "~/components/ui/button";
import { Checkbox } from "~/components/ui/checkbox";
import { Input } from "~/components/ui/input";
import { cn } from "~/lib/utils";

import { useInspect } from "./hook";
import type { InspectProps } from "./type";

export const Inspect = (props: InspectProps) => {
  const state = useInspect(props);
  const titles = {
    ports: "Ports",
    stats: "Stats",
    utilities: "Utilities",
    hosts: "Hosts",
    "config-files": "Config Files",
  };
  const descriptions = {
    ports: "Configured endpoints and actual TCP listeners on this machine.",
    stats: "A live snapshot of the projects and repositories in this set.",
    utilities: "Check the tools your repositories need to run.",
    hosts: "Read the local hosts file without changing system configuration.",
    "config-files": "Find common configuration files in your repositories.",
  };
  const repos = state.repositories.data ?? [];
  const groups = state.workspace.data?.groups ?? [];
  const query =
    props.kind === "ports"
      ? state.ports
      : props.kind === "utilities"
        ? state.system
        : props.kind === "hosts"
          ? state.hosts
          : props.kind === "config-files"
            ? state.files
            : state.repositories;
  return (
    <main className="inspect-root mx-auto max-w-[1440px] space-y-6 p-5 sm:p-8">
      <section className="inspect-heading flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-widest text-primary">
            {state.workspace.data?.deviceName ?? "This device"}
          </p>
          <h1 className="text-3xl">{titles[props.kind]}</h1>
          <p className="text-muted-foreground">{descriptions[props.kind]}</p>
        </div>
        <Button variant="outline" onClick={state.refresh}>
          <RefreshCw
            className={cn("size-4", query.isFetching && "animate-spin")}
          />
          Refresh
        </Button>
      </section>
      {query.isPending && (
        <p role="status" className="p-8 text-center text-muted-foreground">
          Reading {titles[props.kind].toLowerCase()}…
        </p>
      )}
      {query.error && (
        <p
          role="alert"
          className="whitespace-pre-wrap rounded-xl border border-destructive/30 p-5 text-destructive"
        >
          {query.error.message}
        </p>
      )}

      {props.kind === "ports" && (
        <section className="ports-content space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
              <Input
                value={state.search}
                onChange={(event) => state.setSearch(event.target.value)}
                className="w-64 pl-9"
                placeholder="Search port or project…"
                aria-label="Search ports"
              />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={state.showSystem}
                onCheckedChange={(checked) =>
                  state.setShowSystem(checked === true)
                }
              />
              Show unmanaged listeners
            </label>
          </div>
          <div
            className="ports-table overflow-x-auto rounded-xl border bg-card"
            tabIndex={0}
          >
            <table className="w-full text-left">
              <thead className="border-b bg-muted/40 text-xs text-muted-foreground">
                <tr>
                  <th className="p-4">Port</th>
                  <th className="p-4">Project / Repository</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">PID / Process</th>
                  <th className="p-4">Source</th>
                </tr>
              </thead>
              <tbody>
                {state.filteredPorts.map((port) => (
                  <tr
                    key={port.id}
                    data-port={port.port}
                    className="border-b last:border-0"
                  >
                    <td className="p-4 font-mono font-medium">:{port.port}</td>
                    <td className="p-4">
                      <p className="font-medium">{port.projectName}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {port.repositoryName}
                      </p>
                    </td>
                    <td className="p-4">
                      <span
                        className={cn(
                          "rounded-full px-2 py-1 text-xs",
                          port.status === "Listening"
                            ? "bg-success/10 text-success"
                            : port.status === "Conflict"
                              ? "bg-warning/10 text-warning-ink"
                              : "bg-muted text-muted-foreground",
                        )}
                      >
                        {port.status}
                      </span>
                    </td>
                    <td className="p-4 text-xs">
                      {port.listeners.length ? (
                        port.listeners.map((listener) => (
                          <p
                            key={`${listener.pid}:${listener.address}`}
                            className="font-mono"
                          >
                            {listener.pid} · {listener.processName}
                            <span className="ml-2 text-muted-foreground">
                              {listener.address}
                            </span>
                          </p>
                        ))
                      ) : (
                        <span className="text-muted-foreground">
                          No listener
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-xs text-muted-foreground">
                      {port.source}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!query.isPending && !state.filteredPorts.length && (
              <div className="p-12 text-center text-muted-foreground">
                <Network className="mx-auto mb-3 size-7" />
                No matching ports. Configure a local Web URL or run a
                repository.
              </div>
            )}
          </div>
          <p className="text-xs leading-6 text-muted-foreground">
            Available: no listener was found. Listening: owned by this
            repository's process tree. Conflict: the configured port is held by
            another process. This checks TCP, not HTTP readiness. Unmanaged
            processes are never stopped here.
          </p>
        </section>
      )}

      {props.kind === "stats" && (
        <section className="stats-content space-y-6">
          <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
            {[
              { label: "Projects", value: groups.length },
              { label: "Repositories", value: repos.length },
              {
                label: "Running",
                value: repos.filter((repo) => repo.runtime.status === "Running")
                  .length,
              },
              {
                label: "Failed",
                value: repos.filter((repo) => repo.runtime.status === "Failed")
                  .length,
              },
            ].map((item) => (
              <div
                key={item.label}
                className="panel-surface rounded-xl border p-5"
              >
                <p className="text-xs text-muted-foreground">{item.label}</p>
                <p className="mt-3 text-3xl font-semibold">{item.value}</p>
              </div>
            ))}
          </div>
          <div className="overflow-x-auto rounded-xl border bg-card">
            <table className="w-full text-left">
              <thead className="border-b bg-muted/40 text-xs text-muted-foreground">
                <tr>
                  <th className="p-4">Project</th>
                  <th className="p-4">Repositories</th>
                  <th className="p-4">Running</th>
                  <th className="p-4">Git checkouts</th>
                  <th className="p-4">Startup selection</th>
                </tr>
              </thead>
              <tbody>
                {groups.map((group) => {
                  const members = repos.filter(
                    (repo) => repo.groupId === group.id,
                  );
                  return (
                    <tr key={group.id} className="border-b last:border-0">
                      <td className="p-4">
                        <Link
                          to={`/projects/${group.id}`}
                          className="font-medium hover:text-primary"
                        >
                          {group.name}
                        </Link>
                      </td>
                      <td className="p-4">{members.length}</td>
                      <td className="p-4">
                        {
                          members.filter(
                            (repo) => repo.runtime.status === "Running",
                          ).length
                        }
                      </td>
                      <td className="p-4">
                        {
                          new Set(
                            members.flatMap((repo) =>
                              repo.git.root ? [repo.git.root] : [],
                            ),
                          ).size
                        }
                      </td>
                      <td className="p-4">
                        {members.filter((repo) => repo.includeInRunAll).length}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {groups.length === 0 && (
              <p className="p-8 text-center text-muted-foreground">
                Add a project to see its statistics.
              </p>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            Counts reflect the current set and session. Historical usage is not
            recorded.
          </p>
        </section>
      )}

      {props.kind === "utilities" && (
        <section className="utilities-content space-y-5">
          {state.system.data && (
            <div className="rounded-xl border bg-card p-5">
              <h3>{state.system.data.hostname}</h3>
              <p className="mt-1 text-muted-foreground">
                {state.system.data.platform} · {state.system.data.arch}
              </p>
            </div>
          )}
          <div className="grid gap-4 md:grid-cols-3">
            {state.system.data?.tools.map((tool) => (
              <article
                key={tool.name}
                className="panel-surface space-y-4 rounded-xl border p-5"
              >
                <div className="flex items-center justify-between">
                  <h3 className="capitalize">{tool.name}</h3>
                  {tool.available ? (
                    <CheckCircle2 className="size-5 text-success" />
                  ) : (
                    <XCircle className="size-5 text-destructive" />
                  )}
                </div>
                <p className="break-all font-mono text-xs">
                  {tool.version || "Not available on PATH"}
                </p>
                {tool.error && (
                  <p className="whitespace-pre-wrap break-words text-xs text-destructive">
                    {tool.error}
                  </p>
                )}
              </article>
            ))}
          </div>
          <div className="flex flex-wrap gap-3">
            <Button variant="outline" asChild>
              <Link to="/ports">
                <Network />
                Inspect ports
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/config-files">
                <FileText />
                Browse configuration
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/settings">
                <Terminal />
                Terminal appearance
              </Link>
            </Button>
          </div>
        </section>
      )}

      {props.kind === "hosts" && state.hosts.data && (
        <section className="hosts-content space-y-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Globe className="size-4" />
            <code className="break-all">{state.hosts.data.file}</code>
            <span className="ml-auto rounded bg-muted px-2 py-1 text-xs">
              Read only
            </span>
          </div>
          <pre
            tabIndex={0}
            className="max-h-[65vh] overflow-auto whitespace-pre-wrap break-words rounded-xl border bg-card p-6 text-xs leading-7"
          >
            {state.hosts.data.content || "# Empty hosts file"}
          </pre>
        </section>
      )}

      {props.kind === "config-files" && (
        <section className="config-files-content space-y-4">
          <Input
            value={state.search}
            onChange={(event) => state.setSearch(event.target.value)}
            placeholder="Search repository or filename…"
            aria-label="Search configuration files"
            className="max-w-sm"
          />
          <div className="divide-y rounded-xl border bg-card">
            {state.filteredFiles.map((file) => (
              <article
                key={`${file.repositoryId}:${file.fileName}`}
                className="config-file-row flex flex-wrap items-center justify-between gap-4 p-5"
              >
                <div className="min-w-0">
                  <h4 className="flex items-center gap-2">
                    <FileText className="size-4 text-muted-foreground" />
                    {file.fileName}
                    <span className="text-xs font-normal text-muted-foreground">
                      {file.repositoryName}
                    </span>
                  </h4>
                  <p className="mt-1 break-all font-mono text-xs text-muted-foreground">
                    {file.path}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    void state.openFile(file.repositoryId, file.fileName)
                  }
                >
                  <ExternalLink />
                  Open
                </Button>
              </article>
            ))}
            {!state.files.isPending && state.filteredFiles.length === 0 && (
              <p className="p-12 text-center text-muted-foreground">
                No matching configuration files in this set.
              </p>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            Common project configuration files only. Secret .env files are
            excluded. Open uses your system's default editor.
          </p>
        </section>
      )}
    </main>
  );
};
