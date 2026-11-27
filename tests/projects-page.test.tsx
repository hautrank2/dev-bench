// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider } from "@tanstack/react-router";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { Projects } from "../src/app/_projects";
import { createFileRouter } from "../src/lib/file-router";
import { LocaleProvider } from "../src/providers/locale";

const api = vi.hoisted(() => {
  const repo = (id: string, groupId: string, name: string) => ({
    id,
    groupId,
    name,
    folder: `/work/${name}`,
    command: "pnpm dev",
    url: "",
    includeInRunAll: true,
    runtime: { status: "Stopped" },
    git: {
      branch: "main",
      root: `/work/${name}`,
      changedFiles: id === "r1" ? 3 : 0,
      web:
        id === "r2"
          ? { provider: "github", url: "https://github.com/owner/server" }
          : id === "r3"
            ? { provider: "gitlab", url: "https://gitlab.example.com/a/worker" }
            : undefined,
    },
  });
  return {
    list: vi.fn(async () => [
      repo("r1", "g1", "client"),
      repo("r2", "g1", "server"),
      repo("r3", "g2", "worker"),
    ]),
    workspace: vi.fn(async () => ({
      deviceName: "test",
      activeSetId: "s1",
      sets: [{ id: "s1", name: "Default" }],
      groups: [
        { id: "g1", name: "Alpha", description: "" },
        { id: "g2", name: "Beta", description: "" },
      ],
    })),
    cloudStatus: vi.fn(async () => ({})),
    run: vi.fn(async () => ""),
    remote: vi.fn(async () => undefined),
    runGroup: vi.fn(async () => []),
    stopGroup: vi.fn(async () => []),
  };
});
vi.mock("../src/api/api-list/projects", () => ({ projectsApi: api }));

const mount = (projectId?: string) => {
  window.location.hash = "#/projects";
  const router = createFileRouter(
    {
      "/src/app/projects/page.tsx": {
        default: () => <Projects projectId={projectId} />,
      },
    },
    {},
  );
  render(
    <QueryClientProvider client={new QueryClient()}>
      <LocaleProvider>
        <RouterProvider router={router} />
      </LocaleProvider>
    </QueryClientProvider>,
  );
};

afterEach(cleanup);

describe("projects page", () => {
  it("controls projects and every repository from one table", async () => {
    mount();
    const alpha = await screen.findByRole("link", { name: "Alpha" });
    expect(alpha).toBeInTheDocument();
    for (const name of ["client", "server", "worker"])
      expect(screen.getByRole("link", { name })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Run project Alpha" }));
    await waitFor(() => expect(api.runGroup).toHaveBeenCalledWith("g1"));

    const row = document.querySelector('[data-repository-id="r1"]');
    if (!(row instanceof HTMLElement)) throw new Error("repository row");
    expect(
      screen.getAllByRole("columnheader", { name: "Git changes" }),
    ).toHaveLength(2);
    expect(within(row).getByTitle("3 changed files")).toHaveTextContent("3");
    expect(
      screen.queryByRole("columnheader", { name: "Run command" }),
    ).not.toBeInTheDocument();
    expect(within(row).queryByText("pnpm dev")).not.toBeInTheDocument();
    const serverRow = screen
      .getByRole("link", { name: "server" })
      .closest("tr");
    if (!serverRow) throw new Error("server row");
    expect(within(serverRow).getByText("Unavailable")).toBeInTheDocument();
    expect(
      within(serverRow).queryByText(/commits? to push/),
    ).not.toBeInTheDocument();
    const workerRow = screen
      .getByRole("link", { name: "worker" })
      .closest("tr");
    if (!workerRow) throw new Error("worker row");
    expect(within(workerRow).getByText("Unavailable")).toBeInTheDocument();
    fireEvent.click(within(row).getByRole("button", { name: "Run" }));
    await waitFor(() => expect(api.run).toHaveBeenCalledWith("r1"));
    expect(
      screen.getByRole("combobox", { name: "Active project set" }),
    ).toBeInTheDocument();
    // Only repositories with a remote web page offer the link, named by host.
    expect(
      within(row).queryByRole("button", { name: "Open GitHub" }),
    ).not.toBeInTheDocument();
    for (const name of ["Open GitHub", "Open GitLab"])
      expect(screen.getAllByRole("button", { name })).toHaveLength(1);
  });

  it("hides the project set row on a project page and links to GitHub", async () => {
    mount("g1");
    const link = await screen.findByRole("button", { name: "Open GitHub" });
    expect(screen.getByText("3 changed files")).toBeInTheDocument();
    expect(
      screen.queryByRole("combobox", { name: "Active project set" }),
    ).not.toBeInTheDocument();
    fireEvent.click(link);
    await waitFor(() => expect(api.remote).toHaveBeenCalledWith("r2"));
  });

  it("reloads Git changes into the repository table", async () => {
    mount();
    await screen.findByTitle("3 changed files");
    const repositories = await api.list();
    api.list.mockResolvedValueOnce(
      repositories.map((repo) => ({
        ...repo,
        git: { ...repo.git, changedFiles: repo.id === "r1" ? 7 : 0 },
      })),
    );
    fireEvent.click(screen.getByRole("button", { name: "Reload Git changes" }));
    expect(await screen.findByTitle("7 changed files")).toHaveTextContent("7");
    expect(screen.queryByTitle("3 changed files")).not.toBeInTheDocument();
  });
});
