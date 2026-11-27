// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Language } from "../shared/i18n";
import { languageStorageKey } from "../shared/i18n";
import { LocaleProvider } from "../src/providers/locale";
import { useLocale } from "../src/providers/locale/context";
import { ProjectFormDialog } from "../src/app/_projects/_components/project-form";

const sync = vi.hoisted(() => vi.fn(async () => undefined));
vi.mock("../src/api/api-list/projects", () => ({
  projectsApi: { setLanguage: sync },
}));
vi.stubGlobal(
  "ResizeObserver",
  class {
    observe() {}
    unobserve() {}
    disconnect() {}
  },
);
let changeLanguage: (language: Language) => void;
const Form = () => {
  const { setLanguage } = useLocale();
  changeLanguage = setLanguage;
  return (
    <ProjectFormDialog
      open
      isEdit={false}
      defaultValues={{
        name: "",
        folder: "",
        command: "",
        url: "",
        includeInRunAll: true,
      }}
      onSubmit={async () => undefined}
      onOpenChange={() => undefined}
    />
  );
};
beforeEach(() => {
  localStorage.clear();
  sync.mockClear();
});
afterEach(cleanup);

describe("language preference and live forms", () => {
  it("starts in English and changes labels/errors without resetting entered data", async () => {
    render(
      <LocaleProvider>
        <Form />
      </LocaleProvider>,
    );
    expect(
      screen.getByRole("button", { name: "Add Repository" }),
    ).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Name", { exact: true }), {
      target: { value: "Settings / Client" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Add Repository" }));
    expect(
      await screen.findByText("Project folder is required"),
    ).toBeInTheDocument();
    act(() => changeLanguage("vi"));
    expect(
      screen.getByRole("button", { name: "Thêm repository" }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Tên", { exact: true })).toHaveValue(
      "Settings / Client",
    );
    expect(
      screen.getByText("Vui lòng chọn thư mục project"),
    ).toBeInTheDocument();
    expect(document.documentElement.lang).toBe("vi");
    expect(localStorage.getItem(languageStorageKey)).toBe("vi");
    await waitFor(() => expect(sync).toHaveBeenLastCalledWith("vi"));
    act(() => changeLanguage("en"));
    expect(screen.getByText("Project folder is required")).toBeInTheDocument();
    expect(screen.getByLabelText("Name", { exact: true })).toHaveValue(
      "Settings / Client",
    );
  });
  it("restores Vietnamese, and uses English for an invalid saved preference", () => {
    localStorage.setItem(languageStorageKey, "vi");
    const view = render(
      <LocaleProvider>
        <Form />
      </LocaleProvider>,
    );
    expect(
      screen.getByRole("button", { name: "Thêm repository" }),
    ).toBeInTheDocument();
    view.unmount();
    localStorage.setItem(languageStorageKey, "invalid");
    render(
      <LocaleProvider>
        <Form />
      </LocaleProvider>,
    );
    expect(
      screen.getByRole("button", { name: "Add Repository" }),
    ).toBeInTheDocument();
  });
});
