import type { ProjectView } from "@shared/contracts";

export type LogsPanelProps = {
  project: ProjectView;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};
export type UseLogsPanelProps = LogsPanelProps;
