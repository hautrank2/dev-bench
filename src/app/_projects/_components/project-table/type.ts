import type { ReactNode } from "react";

import type { ProjectView } from "@shared/contracts";
import type { ProjectGroup } from "@shared/workspace";

export type ProjectTableProps = {
  groups: ProjectGroup[];
  repositoriesOf: (groupId: string) => ProjectView[];
  isActive: (repo: ProjectView) => boolean;
  busy: boolean;
  onEdit: (group: ProjectGroup) => void;
  onAddRepository: (groupId: string) => void;
  onRun: (id: string, stop?: boolean) => Promise<void>;
  renderActions: (repo: ProjectView, iconOnly?: boolean) => ReactNode;
};
