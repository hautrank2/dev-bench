import type { PropsWithChildren } from "react";

export type AppLayoutProps = PropsWithChildren;
export type UseAppLayoutProps = AppLayoutProps;
/** `id` edits that repository; otherwise a new one goes into `groupId`. */
export type RepositoryEditor = {
  id?: string;
  groupId?: string;
  focusField?: "command" | "url";
};
export type SidebarIconName =
  | "dashboard"
  | "projects"
  | "processes"
  | "ports"
  | "stats"
  | "utilities"
  | "hosts"
  | "config-files"
  | "settings";
export type SidebarIconProps = {
  name: SidebarIconName;
  active: boolean;
};
