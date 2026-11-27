import { afterEach, describe, expect, it, vi } from "vitest";

import type { GitSummary, ProjectView } from "../shared/contracts";
import { projectsApi } from "../src/api/api-list/projects";

const repository = (id: string, git: GitSummary): ProjectView => ({
  id,
  name: id,
  folder: `/work/${id}`,
  command: "",
  url: "",
  includeInRunAll: false,
  runtime: { status: "Stopped" },
  git,
});

afterEach(() => vi.unstubAllGlobals());

describe("repository Git summary compatibility", () => {
  it("reads snapshots only when a running main process omits the change count", async () => {
    const gitStatus = vi.fn(async () => ({
      ok: true,
      data: { files: [{ path: "a" }, { path: "b" }] },
    }));
    vi.stubGlobal("window", {
      desktop: {
        list: async () => ({
          ok: true,
          data: [
            repository("old-main", { root: "/work/old-main" }),
            repository("new-main", { root: "/work/new-main", changedFiles: 4 }),
            repository("clean", { root: "/work/clean", changedFiles: 0 }),
            repository("non-git", { reason: "Not a Git repository" }),
          ],
        }),
        gitStatus,
      },
    });
    const result = await projectsApi.list();
    expect(result.map((repo) => repo.git.changedFiles)).toEqual([
      2,
      4,
      0,
      undefined,
    ]);
    expect(gitStatus).toHaveBeenCalledExactlyOnceWith("old-main");
  });

  it("keeps repositories visible and reports unavailable Git reads", async () => {
    vi.stubGlobal("window", {
      desktop: {
        list: async () => ({
          ok: true,
          data: [repository("moved", { root: "/work/moved" })],
        }),
        gitStatus: async () => ({ ok: false, error: "Folder moved" }),
      },
    });
    const result = await projectsApi.list();
    expect(result).toHaveLength(1);
    expect(result[0]?.git.changedFiles).toBeUndefined();
    expect(result[0]?.git.reason).toBe("Folder moved");
  });
});
