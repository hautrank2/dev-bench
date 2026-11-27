// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { GitFile, GitSync, ProjectView } from "../shared/contracts";
import { CommitDialog } from "../src/app/_projects/_components/commit-dialog";

const api = vi.hoisted(() => ({
  git: vi.fn(),
  stage: vi.fn(),
  commit: vi.fn(),
  push: vi.fn(),
}));
vi.mock("~/api/api-list/projects", () => ({ projectsApi: api }));
const toast = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn() }));
vi.mock("sonner", () => ({ toast }));

const file = (path: string, staged = false): GitFile => ({
  path,
  index: staged ? "M" : " ",
  worktree: staged ? " " : "M",
  staged,
  unstaged: !staged,
});

const synced = { upstream: "origin/main", ahead: 2, behind: 0 };
const mount = (
  files: GitFile[],
  sync: GitSync | null = synced,
  onOpenChange: (open: boolean) => void = () => undefined,
) => {
  api.git.mockResolvedValue({
    root: "/repo",
    branch: "main",
    token: "token",
    files,
    sync,
  });
  api.stage.mockResolvedValue(undefined);
  render(
    <QueryClientProvider client={new QueryClient()}>
      <CommitDialog
        open
        onOpenChange={onOpenChange}
        project={{ id: "1", name: "client" } as ProjectView}
      />
    </QueryClientProvider>,
  );
};

// Radix measures checkboxes inside a form; jsdom has no ResizeObserver.
vi.stubGlobal(
  "ResizeObserver",
  class {
    observe() {}
    unobserve() {}
    disconnect() {}
  },
);

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("commit dialog", () => {
  it("selects every unstaged file at once and stages them", async () => {
    mount([file("a.txt"), file("b.txt"), file("done.txt", true)]);
    const all = await screen.findByRole("checkbox", { name: "Select all" });
    const stage = screen.getByRole("button", { name: "Stage selected" });
    const first = screen.getByRole("checkbox", { name: "Stage a.txt" });
    expect(stage).toBeDisabled();

    fireEvent.click(first);
    expect(all).toHaveAttribute("aria-checked", "mixed");
    // A partial selection completes to all, the next click clears it.
    fireEvent.click(all);
    expect(screen.getByText("Selected: 2")).toBeInTheDocument();
    fireEvent.click(all);
    expect(screen.getByText("Selected: 0")).toBeInTheDocument();
    expect(first).not.toBeChecked();

    fireEvent.click(all);
    fireEvent.click(stage);
    await waitFor(() =>
      expect(api.stage).toHaveBeenCalledWith({
        id: "1",
        paths: ["a.txt", "b.txt"],
      }),
    );
  });

  const review = async () => {
    fireEvent.change(await screen.findByLabelText("Commit message"), {
      target: { value: "message" },
    });
    fireEvent.click(
      screen.getByRole("button", { name: "Review staged files" }),
    );
    return screen.findByRole("button", { name: "Commit and Push" });
  };

  it("commits and then pushes after the staged list is reviewed", async () => {
    const close = vi.fn();
    api.commit.mockResolvedValue("committed");
    api.push.mockRejectedValue(new Error("rejected"));
    mount([file("done.txt", true)], synced, close);
    expect(await screen.findByText("2 commits not pushed")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Commit and Push" }),
    ).not.toBeInTheDocument();

    fireEvent.click(await review());
    // The commit stays when the push fails; both outcomes are reported.
    await waitFor(() => expect(close).toHaveBeenCalledWith(false));
    expect(api.commit).toHaveBeenCalledWith({
      id: "1",
      message: "message",
      token: "token",
    });
    expect(api.push).toHaveBeenCalledWith("1");
    expect(toast.success.mock.calls[0]?.[0]).toBe("client: Commit created");
    expect(toast.error.mock.calls[0]?.[0]).toBe("client: Push failed");
  });

  it("does not offer a push without an upstream", async () => {
    mount([file("done.txt", true)], null);
    expect(await screen.findByText("No upstream")).toBeInTheDocument();
    expect(await review()).toBeDisabled();
    expect(
      screen.getByRole("button", { name: "Confirm Commit" }),
    ).toBeEnabled();
  });

  it("has nothing to select without unstaged files", async () => {
    mount([file("done.txt", true)]);
    expect(
      await screen.findByRole("checkbox", { name: "Select all" }),
    ).toBeDisabled();
  });
});
