// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider } from "@tanstack/react-router";
import {
  cleanup,
  createEvent,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { AppLayout } from "../src/components/layouts/app-layout";
import { createFileRouter } from "../src/lib/file-router";
import { LocaleProvider } from "../src/providers/locale";
import { MessagesProvider } from "../src/providers/messages";
import { ThemeProvider } from "../src/providers/theme";

const groupId = vi.hoisted(() => "11111111-1111-4111-8111-111111111111");
const otherId = vi.hoisted(() => "22222222-2222-4222-8222-222222222222");
const api = vi.hoisted(() => ({
  list: vi.fn(async () => [
    {
      id: "r1",
      groupId,
      name: "client",
      folder: "/work/client",
      command: "pnpm dev",
      url: "",
      includeInRunAll: true,
      runtime: { status: "Running", pid: 42 },
      git: { branch: "main", root: "/work/client" },
    },
    {
      id: "r2",
      groupId,
      name: "server",
      folder: "/work/server",
      command: "",
      url: "",
      includeInRunAll: true,
      runtime: { status: "Stopped" },
      git: {},
    },
  ]),
  workspace: vi.fn(async () => ({
    deviceName: "test",
    activeSetId: "s1",
    sets: [{ id: "s1", name: "Default" }],
    groups: [
      { id: groupId, name: "Alpha", description: "" },
      { id: otherId, name: "Beta", description: "" },
    ],
  })),
  cloudStatus: vi.fn(async () => ({})),
  subscribe: vi.fn(() => () => undefined),
  save: vi.fn(async () => undefined),
  saveGroup: vi.fn(async () => ({ id: groupId })),
  run: vi.fn(async () => undefined),
  stop: vi.fn(async () => undefined),
  web: vi.fn(async () => undefined),
  copyPath: vi.fn(async () => undefined),
  runGroup: vi.fn(async () => []),
  stopGroup: vi.fn(async () => []),
  moveGroup: vi.fn(async () => undefined),
  moveRepository: vi.fn(async () => undefined),
  detectFolder: vi.fn(async () => ({})),
}));
vi.mock("../src/api/api-list/projects", () => ({ projectsApi: api }));
vi.stubGlobal(
  "ResizeObserver",
  class {
    observe() {}
    unobserve() {}
    disconnect() {}
  },
);
vi.stubGlobal("matchMedia", () => ({
  matches: false,
  addEventListener: () => undefined,
  removeEventListener: () => undefined,
}));

const mount = () => {
  window.location.hash = "#/projects";
  const router = createFileRouter(
    {
      "/src/app/projects/page.tsx": {
        default: () => <AppLayout>content</AppLayout>,
      },
    },
    {},
  );
  render(
    <QueryClientProvider
      client={
        new QueryClient({ defaultOptions: { queries: { retry: false } } })
      }
    >
      <LocaleProvider>
        <ThemeProvider>
          <MessagesProvider>
            <RouterProvider router={router} />
          </MessagesProvider>
        </ThemeProvider>
      </LocaleProvider>
    </QueryClientProvider>,
  );
};

afterEach(cleanup);

describe("sidebar edit menu", () => {
  it("edits a project from its right-click menu", async () => {
    mount();
    fireEvent.contextMenu(await screen.findByRole("link", { name: "Alpha" }));
    fireEvent.click(
      await screen.findByRole("menuitem", { name: "Edit Project" }),
    );
    fireEvent.change(await screen.findByLabelText("Project name"), {
      target: { value: "Alpha 2" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save Project" }));
    await waitFor(() =>
      expect(api.saveGroup).toHaveBeenCalledWith({
        id: groupId,
        name: "Alpha 2",
        description: "",
      }),
    );
    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
    );
  });

  it("edits a repository and locks run settings while it is running", async () => {
    mount();
    fireEvent.click(
      await screen.findByRole("button", { name: "Expand Alpha" }),
    );
    fireEvent.contextMenu(await screen.findByRole("link", { name: "client" }));
    fireEvent.click(
      await screen.findByRole("menuitem", { name: "Edit Repository" }),
    );
    expect(await screen.findByLabelText("Run command")).toBeDisabled();
    fireEvent.change(screen.getByLabelText("Name", { exact: true }), {
      target: { value: "web" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save Repository" }));
    await waitFor(() =>
      expect(api.save).toHaveBeenCalledWith({
        id: "r1",
        input: expect.objectContaining({ name: "web", url: "" }),
      }),
    );
  });
});

const openMenu = async (name: string) =>
  fireEvent.contextMenu(await screen.findByRole("link", { name }));
const expandAlpha = async () =>
  fireEvent.click(await screen.findByRole("button", { name: "Expand Alpha" }));
const row = async (name: string) => {
  const link = await screen.findByRole("link", { name });
  const element = link.closest("[draggable='true']");
  if (!element) throw new Error(`No draggable row for ${name}`);
  return element;
};
/** Drags one tree row onto another; a negative offset lands above it. */
const dragTo = async (from: string, to: string, offset: number) => {
  const dataTransfer = { clearData: vi.fn(), setData: vi.fn() };
  const source = await row(from);
  fireEvent.dragStart(source, { dataTransfer });
  const target = await row(to);
  const fire = (create: typeof createEvent.dragOver) => {
    const event = create(target, { dataTransfer });
    Object.defineProperty(event, "clientY", { value: offset });
    fireEvent(target, event);
  };
  fire(createEvent.dragOver);
  const lit = {
    dividers: document.querySelectorAll(".layout-tree-divider[data-active]")
      .length,
    inside: target.getAttribute("data-drop"),
  };
  fire(createEvent.drop);
  return lit;
};

describe("sidebar ordering", () => {
  afterEach(() => vi.clearAllMocks());
  it("moves a project from its menu", async () => {
    mount();
    await openMenu("Alpha");
    expect(
      await screen.findByRole("menuitem", { name: "Move Up" }),
    ).toHaveAttribute("data-disabled");
    fireEvent.click(screen.getByRole("menuitem", { name: "Move Down" }));
    await waitFor(() =>
      expect(api.moveGroup).toHaveBeenCalledWith({
        id: groupId,
        beforeId: null,
      }),
    );
  });

  it("moves a stopped repository to another project but not a running one", async () => {
    mount();
    await expandAlpha();
    await openMenu("client");
    expect(
      await screen.findByRole("menuitem", { name: "Move to Project" }),
    ).toHaveAttribute("data-disabled");
    fireEvent.keyDown(screen.getByRole("menu"), { key: "Escape" });
    await waitFor(() =>
      expect(screen.queryByRole("menu")).not.toBeInTheDocument(),
    );
    await openMenu("server");
    fireEvent.click(
      await screen.findByRole("menuitem", { name: "Move to Project" }),
    );
    fireEvent.click(await screen.findByRole("menuitem", { name: "Beta" }));
    await waitFor(() =>
      expect(api.moveRepository).toHaveBeenCalledWith({
        id: "r2",
        groupId: otherId,
        beforeId: null,
      }),
    );
  });

  it("reorders and moves by drag and drop", async () => {
    mount();
    // Dropping a project right where it already is lights nothing.
    expect(await dragTo("Beta", "Alpha", 0)).toEqual({
      dividers: 0,
      inside: null,
    });
    expect(api.moveGroup).not.toHaveBeenCalled();
    expect(await dragTo("Beta", "Alpha", -1)).toEqual({
      dividers: 1,
      inside: null,
    });
    await waitFor(() =>
      expect(api.moveGroup).toHaveBeenLastCalledWith({
        id: otherId,
        beforeId: groupId,
      }),
    );
    await expandAlpha();
    await dragTo("server", "client", -1);
    await waitFor(() =>
      expect(api.moveRepository).toHaveBeenLastCalledWith({
        id: "r2",
        groupId,
        beforeId: "r1",
      }),
    );
    expect(await dragTo("server", "Beta", 0)).toEqual({
      dividers: 0,
      inside: "inside",
    });
    await waitFor(() =>
      expect(api.moveRepository).toHaveBeenLastCalledWith({
        id: "r2",
        groupId: otherId,
        beforeId: null,
      }),
    );
  });
});

describe("sidebar actions", () => {
  afterEach(() => vi.clearAllMocks());
  const choose = async (name: string) =>
    fireEvent.click(await screen.findByRole("menuitem", { name }));
  const dismiss = async () => {
    fireEvent.keyDown(screen.getByRole("menu"), { key: "Escape" });
    await waitFor(() =>
      expect(screen.queryByRole("menu")).not.toBeInTheDocument(),
    );
  };

  it("runs and stops a whole project", async () => {
    mount();
    await expandAlpha();
    await screen.findByRole("link", { name: "client" });
    await openMenu("Alpha");
    const stop = await screen.findByRole("menuitem", { name: "Stop project" });
    expect(stop).toHaveAttribute("data-variant", "destructive");
    fireEvent.click(stop);
    await waitFor(() => expect(api.stopGroup).toHaveBeenCalledWith(groupId));
    await openMenu("Alpha");
    await choose("Run project");
    await waitFor(() => expect(api.runGroup).toHaveBeenCalledWith(groupId));
    // Nothing to run or stop in an empty project.
    await openMenu("Beta");
    for (const name of ["Run project", "Stop project"])
      expect(await screen.findByRole("menuitem", { name })).toHaveAttribute(
        "data-disabled",
      );
  });

  it("offers Stop for a running repository and acts on it", async () => {
    mount();
    await expandAlpha();
    await openMenu("client");
    expect(
      screen.queryByRole("menuitem", { name: "Run" }),
    ).not.toBeInTheDocument();
    await choose("Stop");
    await waitFor(() => expect(api.stop).toHaveBeenCalledWith("r1"));
    await openMenu("client");
    await choose("Copy Path");
    await waitFor(() => expect(api.copyPath).toHaveBeenCalledWith("r1"));
    // No Git checkout in the fixture of "server".
    await openMenu("server");
    expect(
      await screen.findByRole("menuitem", { name: "Git" }),
    ).toHaveAttribute("data-disabled");
    await dismiss();
  });

  it("asks for a missing command or URL instead of failing", async () => {
    mount();
    await expandAlpha();
    await openMenu("server");
    await choose("Run");
    expect(await screen.findByLabelText("Run command")).toHaveFocus();
    expect(api.run).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
    );
    await openMenu("server");
    await choose("Open Web");
    expect(await screen.findByLabelText("Web URL")).toHaveFocus();
    expect(api.web).not.toHaveBeenCalled();
  });

  it("adds a repository to the chosen project", async () => {
    mount();
    await openMenu("Beta");
    await choose("Add Repository");
    fireEvent.change(await screen.findByLabelText("Name", { exact: true }), {
      target: { value: "worker" },
    });
    fireEvent.change(screen.getByLabelText("Project folder"), {
      target: { value: "/work/worker" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Add Repository" }));
    await waitFor(() =>
      expect(api.save).toHaveBeenCalledWith({
        id: undefined,
        input: expect.objectContaining({ name: "worker", groupId: otherId }),
      }),
    );
  });
});

describe("header messages", () => {
  it("keeps a failed action where it can be opened later", async () => {
    api.stop.mockRejectedValueOnce(new Error("The process did not stop."));
    mount();
    await expandAlpha();
    await openMenu("client");
    fireEvent.click(await screen.findByRole("menuitem", { name: "Stop" }));
    fireEvent.click(
      await screen.findByRole("button", { name: "Messages, 1 unread" }),
    );
    fireEvent.click(
      screen.getByRole("button", { name: /^Error: client: Stop failed/ }),
    );
    expect(
      screen.getByText("The process did not stop.", { selector: "pre" }),
    ).toBeInTheDocument();
  });

  it("reports a workspace load failure once", async () => {
    api.list.mockRejectedValueOnce(new Error("Config file is damaged."));
    mount();
    fireEvent.click(
      await screen.findByRole("button", { name: "Messages, 1 unread" }),
    );
    fireEvent.click(
      screen.getByRole("button", {
        name: /^Error: Could not load the workspace/,
      }),
    );
    expect(screen.getByText("Config file is damaged.")).toBeInTheDocument();
    expect(screen.getByText("1 saved messages")).toBeInTheDocument();
  });
});
