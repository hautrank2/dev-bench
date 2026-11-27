import type { ProjectView } from "@shared/contracts";

export type ProjectsProps = {
  view?: "projects" | "processes";
  projectId?: string;
  repositoryId?: string;
};
export type UseProjectsProps = ProjectsProps;
export type EditorState = {
  groupId?: string;
  project?: ProjectView;
  focusField?: "command" | "url";
};
export type Action =
  "run" | "stop" | "web" | "remote" | "terminal" | "copyPath" | "pull" | "push";
