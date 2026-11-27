import { Link } from "@tanstack/react-router";
import { ChevronDown, ChevronRight } from "lucide-react";
import { Fragment } from "react";

import { Button } from "~/components/ui/button";
import { cn } from "~/lib/utils";
import { useLocale } from "~/providers/locale/context";

import { useProjectTree } from "./hook";
import { TreeItemMenu } from "./item-menu";
import type { DropSlot, ProjectTreeProps } from "./type";
import { useTreeMenu } from "./useTreeMenu";

export const ProjectTree = (props: ProjectTreeProps) => {
  const { t } = useLocale();
  const state = useProjectTree(props);
  const menu = useTreeMenu({
    ...props,
    step: state.step,
    moveRepository: state.moveRepository,
  });
  // Separates two rows and lights up when a dragged row would land there.
  const divider = (slot: DropSlot) => (
    <div
      {...state.dividerProps(slot)}
      aria-hidden="true"
      className="layout-tree-divider h-0.5 rounded-full data-[active]:bg-muted-foreground/40"
    />
  );
  return (
    <div
      onDragLeave={state.leaveTree}
      className="layout-project-tree ml-4 border-l pl-2"
    >
      {props.groups.map((group) => {
        const item = { kind: "project", id: group.id } as const;
        return (
          <Fragment key={group.id}>
            {divider({ kind: "project", beforeId: group.id })}
            <div data-project-id={group.id}>
              <TreeItemMenu
                entries={menu.projectEntries(
                  group,
                  state.repositoriesOf(group.id),
                )}
              >
                <div
                  {...state.dragProps(item)}
                  className={cn(
                    "layout-project-row flex min-w-0 items-center gap-1 rounded-md",
                    "hover:bg-primary/10 data-[dragging]:opacity-50",
                    "data-[drop=inside]:bg-primary/10",
                  )}
                >
                  <Button
                    size="icon-xs"
                    variant="ghost"
                    aria-label={t("Expand {0}", { 0: group.name })}
                    aria-expanded={props.expanded.includes(group.id)}
                    onClick={() => props.onToggle(group.id)}
                  >
                    {props.expanded.includes(group.id) ? (
                      <ChevronDown />
                    ) : (
                      <ChevronRight />
                    )}
                  </Button>
                  <Link
                    to={`/projects/${group.id}`}
                    draggable={false}
                    className={cn(
                      "min-w-0 flex-1 truncate rounded-md px-2 py-1.5 text-xs",
                      props.pathname.endsWith(group.id)
                        ? "bg-sidebar-accent text-muted-foreground"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {group.name}
                  </Link>
                </div>
              </TreeItemMenu>
              {props.expanded.includes(group.id) && (
                <div className="ml-6 border-l pl-3">
                  {state.repositoriesOf(group.id).map((repo) => {
                    const row = {
                      kind: "repository",
                      id: repo.id,
                      groupId: group.id,
                    } as const;
                    const current = props.pathname.endsWith(
                      `/repositories/${repo.id}`,
                    );
                    return (
                      <Fragment key={repo.id}>
                        {divider({
                          kind: "repository",
                          groupId: group.id,
                          beforeId: repo.id,
                        })}
                        <TreeItemMenu
                          entries={menu.repositoryEntries(repo, group.id)}
                        >
                          <Link
                            {...state.dragProps(row)}
                            to={`/projects/${group.id}/repositories/${repo.id}`}
                            data-repository-id={repo.id}
                            aria-current={current ? "page" : undefined}
                            className={cn(
                              "layout-repository-link flex min-w-0 items-center gap-2 rounded-md px-2 py-1.5 text-xs",
                              current
                                ? "bg-sidebar-accent text-muted-foreground"
                                : "text-muted-foreground hover:bg-primary/10 hover:text-foreground",
                              "data-[dragging]:opacity-50",
                            )}
                          >
                            <span
                              className={cn(
                                "size-1.5 shrink-0 rounded-full",
                                repo.runtime.status === "Running"
                                  ? "bg-success"
                                  : "bg-muted-foreground/40",
                              )}
                            />
                            <span className="truncate">{repo.name}</span>
                          </Link>
                        </TreeItemMenu>
                      </Fragment>
                    );
                  })}
                  {divider({
                    kind: "repository",
                    groupId: group.id,
                    beforeId: null,
                  })}
                </div>
              )}
            </div>
          </Fragment>
        );
      })}
      {props.groups.length > 0 && divider({ kind: "project", beforeId: null })}
      {props.groups.length === 0 && (
        <p className="px-3 py-2 text-xs text-muted-foreground">
          {t("No projects yet")}
        </p>
      )}
    </div>
  );
};
