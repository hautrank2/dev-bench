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

import { ProjectFormDialog } from "../src/routes/dashboard/_components/project-form";

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
    fireEvent.click(screen.getByRole("button", { name: "Add Repository" }));
    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
  });
});
