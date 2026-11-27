import { useQueryClient } from "@tanstack/react-query";
import {
  ArrowDown,
  ArrowUp,
  Copy,
  ExternalLink,
  FolderInput,
  GitBranch,
  GitCommitHorizontal,
  GitPullRequestArrow,
  Play,
  Plus,
  Settings2,
  Square,
  Terminal,
  Upload,
} from "lucide-react";

import type { ProjectView } from "@shared/contracts";
import type { ProjectGroup } from "@shared/workspace";
import { projectsApi } from "~/api/api-list/projects";
import { useActionNotify } from "~/hooks/useActionNotify";
import { useLocale } from "~/providers/locale/context";
import { REMOTE_LINKS } from "~/utils/remote";
import { isRepositoryActive } from "~/utils/repository";

import type {
  MenuEntry,
  RepositoryAction,
  TreeItem,
  UseTreeMenuProps,
} from "./type";

/** Right-click entries for the tree; actions match the Projects page. */
export const useTreeMenu = (props: UseTreeMenuProps) => {
  const { t } = useLocale();
  const report = useActionNotify();
  const client = useQueryClient();
  const refresh = () => client.invalidateQueries({ queryKey: ["projects"] });

  const act = async (repo: ProjectView, kind: RepositoryAction) => {
    try {
      report.done(repo.name, kind, await projectsApi[kind](repo.id));
    } catch (error) {
      report.failed(repo.name, kind, error);
    } finally {
      await refresh();
    }
  };

  const actOnProject = async (group: ProjectGroup, stop: boolean) => {
    try {
      report.batch(
        group.name,
        await (stop
          ? projectsApi.stopGroup(group.id)
          : projectsApi.runGroup(group.id)),
        t(stop ? "{0}: Project stopped" : "{0}: Project started", {
          0: group.name,
        }),
      );
    } catch (error) {
      report.error("Project action failed", error);
    } finally {
      await refresh();
    }
  };

  const moveEntries = (item: TreeItem): MenuEntry[] => {
    const up = props.step(item, -1);
    const down = props.step(item, 1);
    return [
      { label: t("Move Up"), Icon: ArrowUp, disabled: !up, onSelect: up },
      {
        label: t("Move Down"),
        Icon: ArrowDown,
        disabled: !down,
        onSelect: down,
      },
    ];
  };

  const projectEntries = (
    group: ProjectGroup,
    repositories: ProjectView[],
  ): MenuEntry[] => [
    {
      label: t("Run project"),
      Icon: Play,
      disabled: !repositories.length,
      onSelect: () => void actOnProject(group, false),
    },
    {
      label: t("Stop project"),
      Icon: Square,
      destructive: true,
      disabled: !repositories.some(isRepositoryActive),
      onSelect: () => void actOnProject(group, true),
    },
    {
      label: t("Add Repository"),
      Icon: Plus,
      onSelect: () => props.onAddRepository(group.id),
    },
    "separator",
    {
      label: t("Edit Project"),
      Icon: Settings2,
      onSelect: () => props.onEditProject(group.id),
    },
    ...moveEntries({ kind: "project", id: group.id }),
  ];

  const repositoryEntries = (
    repo: ProjectView,
    groupId: string,
  ): MenuEntry[] => {
    const active = isRepositoryActive(repo);
    const remote = repo.git.web && REMOTE_LINKS[repo.git.web.provider];
    const gitBlocked = !repo.git.root || !!repo.git.operation;
    const destinations = props.groups.filter((group) => group.id !== groupId);
    return [
      active
        ? {
            label: t("Stop"),
            Icon: Square,
            destructive: true,
            disabled: ["Starting", "Stopping"].includes(repo.runtime.status),
            onSelect: () => void act(repo, "stop"),
          }
        : {
            label: t("Run"),
            Icon: Play,
            // Without a command or URL, ask for it instead of failing.
            onSelect: () =>
              repo.command
                ? void act(repo, "run")
                : props.onEditRepository(repo.id, "command"),
          },
      {
        label: t("Open Web"),
        Icon: ExternalLink,
        onSelect: () =>
          repo.url
            ? void act(repo, "web")
            : props.onEditRepository(repo.id, "url"),
      },
      ...(remote
        ? [
            {
              label: t(remote.label),
              Icon: remote.Icon,
              onSelect: () => void act(repo, "remote"),
            },
          ]
        : []),
      "separator",
      {
        label: t("Open Terminal"),
        Icon: Terminal,
        onSelect: () => void act(repo, "terminal"),
      },
      {
        label: t("Copy Path"),
        Icon: Copy,
        onSelect: () => void act(repo, "copyPath"),
      },
      {
        label: "Git",
        Icon: GitBranch,
        disabled: gitBlocked,
        items: [
          {
            label: "Pull Code",
            Icon: GitPullRequestArrow,
            onSelect: () => void act(repo, "pull"),
          },
          {
            label: "Git Commit",
            Icon: GitCommitHorizontal,
            onSelect: () => props.onCommit(repo.id),
          },
          {
            label: "Push",
            Icon: Upload,
            onSelect: () => void act(repo, "push"),
          },
        ],
      },
      "separator",
      {
        label: t("Edit Repository"),
        Icon: Settings2,
        onSelect: () => props.onEditRepository(repo.id),
      },
      ...moveEntries({ kind: "repository", id: repo.id, groupId }),
      {
        label: t("Move to Project"),
        Icon: FolderInput,
        disabled: active || !destinations.length,
        items: destinations.map((group) => ({
          key: group.id,
          label: group.name,
          onSelect: () => void props.moveRepository(repo.id, group.id, null),
        })),
      },
    ];
  };

  return { projectEntries, repositoryEntries };
};
