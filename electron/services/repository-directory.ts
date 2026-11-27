import path from "node:path";

import type { ProjectInput } from "../../shared/contracts";

export const runDirectory = (
  repository: Pick<ProjectInput, "folder" | "workingDirectory">,
) =>
  path.resolve(repository.folder, repository.workingDirectory?.trim() || ".");
