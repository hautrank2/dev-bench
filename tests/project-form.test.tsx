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

import { ProjectFormDialog } from "../src/app/_projects/_components/project-form";

const api = vi.hoisted(() => ({
  pickFolder: vi.fn(async () => null),
  detectFolder: vi.fn(async ({ folder }: { folder: string }) =>
    folder.endsWith("web")
      ? {
          command: "pnpm run dev",
          url: "http://localhost:5173",
          source: "package.json",
        }
      : {},
  ),
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
afterEach(cleanup);
const defaults = {
  name: "",
  folder: "",
  command: "",
  url: "",
  includeInRunAll: true,
};
describe("Project form validation", () => {
  it("prefills the Web URL for a new repository and clears it", async () => {
    render(
      <QueryClientProvider client={new QueryClient()}>
        <ProjectFormDialog
          open
          isEdit={false}
          defaultValues={defaults}
          onSubmit={vi.fn()}
          onOpenChange={() => undefined}
        />
      </QueryClientProvider>,
    );
    const input = screen.getByLabelText("Web URL", { exact: true });
    expect(input).toHaveValue("http://localhost:3000");
    fireEvent.click(screen.getByRole("button", { name: "Clear Web URL" }));
    await waitFor(() => expect(input).toHaveValue(""));
    expect(input).toHaveFocus();
    expect(
      screen.queryByRole("button", { name: "Clear Web URL" }),
    ).not.toBeInTheDocument();
  });

  it("keeps a blank Web URL when editing a repository", () => {
    render(
      <QueryClientProvider client={new QueryClient()}>
        <ProjectFormDialog
          open
          isEdit
          defaultValues={defaults}
          onSubmit={vi.fn()}
          onOpenChange={() => undefined}
        />
      </QueryClientProvider>,
    );
    expect(screen.getByLabelText("Web URL", { exact: true })).toHaveValue("");
  });

  it("fills command and Web URL when the folder changes", async () => {
    render(
      <QueryClientProvider client={new QueryClient()}>
        <ProjectFormDialog
          open
          isEdit={false}
          defaultValues={defaults}
          onSubmit={vi.fn()}
          onOpenChange={() => undefined}
        />
      </QueryClientProvider>,
    );
    const folder = screen.getByLabelText("Project folder", { exact: true });
    const command = screen.getByLabelText("Run command");
    const url = screen.getByLabelText("Web URL", { exact: true });
    fireEvent.change(folder, { target: { value: "D:\\work\\web" } });
    await waitFor(() => expect(command).toHaveValue("pnpm run dev"));
    expect(url).toHaveValue("http://localhost:5173");
    expect(screen.getAllByText("Filled from package.json.")).toHaveLength(2);

    // Suggestions from the previous folder do not linger.
    fireEvent.change(folder, { target: { value: "D:\\work\\empty" } });
    await waitFor(() => expect(command).toHaveValue(""));
    expect(url).toHaveValue("http://localhost:3000");

    // Typed values are never overwritten.
    fireEvent.change(command, { target: { value: "make serve" } });
    fireEvent.change(folder, { target: { value: "D:\\work\\web" } });
    await waitFor(() => expect(url).toHaveValue("http://localhost:5173"));
    expect(command).toHaveValue("make serve");
  });

  it("leaves saved values alone until the folder changes", async () => {
    api.detectFolder.mockClear();
    render(
      <QueryClientProvider client={new QueryClient()}>
        <ProjectFormDialog
          open
          isEdit
          defaultValues={{
            ...defaults,
            folder: "D:\\work\\web",
            command: "make serve",
          }}
          onSubmit={vi.fn()}
          onOpenChange={() => undefined}
        />
      </QueryClientProvider>,
    );
    await new Promise((resolve) => setTimeout(resolve, 600));
    expect(api.detectFolder).not.toHaveBeenCalled();
    expect(screen.getByLabelText("Run command")).toHaveValue("make serve");
  });

  it("blocks invalid required fields and unsafe URLs", async () => {
    const onSubmit = vi.fn();
    render(
      <QueryClientProvider client={new QueryClient()}>
        <ProjectFormDialog
          open
          isEdit={false}
          defaultValues={defaults}
          onSubmit={onSubmit}
          onOpenChange={() => undefined}
        />
      </QueryClientProvider>,
    );
    expect(screen.getByLabelText("Working directory (optional)")).toHaveValue(
      "",
    );
    fireEvent.click(screen.getByRole("button", { name: "Add Repository" }));
    expect(await screen.findByText("Name is required")).toBeInTheDocument();
    expect(screen.getByText("Project folder is required")).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
    fireEvent.change(screen.getByLabelText("Name", { exact: true }), {
      target: { value: "App" },
    });
    fireEvent.change(screen.getByLabelText("Project folder", { exact: true }), {
      target: { value: "D:\\Projects\\App" },
    });
    fireEvent.change(screen.getByLabelText("Web URL", { exact: true }), {
      target: { value: "file:///etc/passwd" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Add Repository" }));
    expect(
      await screen.findByText("Enter an http:// or https:// URL"),
    ).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
    fireEvent.change(screen.getByLabelText("Web URL", { exact: true }), {
      target: { value: "" },
    });
    fireEvent.change(screen.getByLabelText("Working directory (optional)"), {
      target: { value: "apps/web" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Add Repository" }));
    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        folder: "D:\\Projects\\App",
        workingDirectory: "apps/web",
      }),
    );
  });
});
