import type { ProjectView } from "@shared/contracts";

/** A live process locks the folder, run command and owning project. */
export const isRepositoryActive = (repo: ProjectView) =>
  !!repo.runtime.pid ||
  ["Starting", "Running", "Stopping"].includes(repo.runtime.status);
