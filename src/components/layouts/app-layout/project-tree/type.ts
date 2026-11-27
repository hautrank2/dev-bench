import type { LucideIcon } from "lucide-react";
import type { ReactElement } from "react";

import type { ProjectView } from "@shared/contracts";
import type { ProjectGroup } from "@shared/workspace";

export type ProjectTreeProps = {
  groups: ProjectGroup[];
  repositories: ProjectView[];
  pathname: string;
  expanded: string[];
  onToggle: (groupId: string) => void;
  onExpand: (groupId: string) => void;
  onEditProject: (groupId: string) => void;
  onEditRepository: (repositoryId: string, focusField?: FocusField) => void;
  onAddRepository: (groupId: string) => void;
  onCommit: (repositoryId: string) => void;
};
export type FocusField = "command" | "url";
export type RepositoryAction =
  "run" | "stop" | "web" | "remote" | "terminal" | "copyPath" | "pull" | "push";
export type UseProjectTreeProps = Pick<
  ProjectTreeProps,
  "groups" | "repositories" | "pathname" | "onExpand"
>;
export type TreeItem =
  | { kind: "project"; id: string }
  | { kind: "repository"; id: string; groupId: string };
/** A gap between two rows; `beforeId: null` is the end of that list. */
export type DropSlot =
  | { kind: "project"; beforeId: string | null }
  | { kind: "repository"; groupId: string; beforeId: string | null };
/** Where a drop would land: in a gap, or inside a project. */
export type DropMark = DropSlot | { kind: "inside"; groupId: string };
export type MenuAction = {
  /** Needed only when labels can repeat, such as project names. */
  key?: string;
  label: string;
  Icon?: LucideIcon;
  disabled?: boolean;
  destructive?: boolean;
  onSelect?: () => void;
};
export type MenuSubmenu = {
  label: string;
  Icon: LucideIcon;
  disabled?: boolean;
  items: MenuAction[];
};
export type MenuEntry = MenuAction | MenuSubmenu | "separator";
export type TreeItemMenuProps = {
  entries: MenuEntry[];
  children: ReactElement;
};
export type UseTreeMenuProps = Pick<
  ProjectTreeProps,
  | "groups"
  | "onEditProject"
  | "onEditRepository"
  | "onAddRepository"
  | "onCommit"
> & {
  step: (item: TreeItem, offset: -1 | 1) => (() => void) | undefined;
  moveRepository: (
    id: string,
    groupId: string,
    beforeId: string | null,
  ) => Promise<void>;
};
