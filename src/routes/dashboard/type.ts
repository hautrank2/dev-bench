import type { BatchResult, ProjectInput, ProjectView } from "@shared/contracts";

export type DashboardProps = {
  view?: "dashboard" | "projects" | "processes";
  projectId?: string;
};
export type UseDashboardProps = DashboardProps;
export type EditorState = {
  groupId?: string;
  project?: ProjectView;
  focusField?: "command" | "url";
};
export type Action =
  "run" | "stop" | "web" | "terminal" | "copyPath" | "pull" | "push";
export type OperationResult = {
  title: string;
  output: string;
  failed: boolean;
};
export type DashboardBatchResult = BatchResult;
export type DashboardProjectInput = ProjectInput;
