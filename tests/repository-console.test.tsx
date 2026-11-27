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

import type { ProjectView } from "../shared/contracts";
import type { ShellEvent } from "../shared/terminal";
import { RepositoryConsole } from "../src/app/_projects/_components/repository-console";
import { LocaleProvider } from "../src/providers/locale";
import { ThemeProvider } from "../src/providers/theme";

const xterm = vi.hoisted(() => ({
  written: [] as string[],
  type: (_data: string) => {},
  options: {} as Record<string, unknown>,
}));
vi.mock("@xterm/xterm", () => ({
  Terminal: class {
    cols = 80;
    rows = 24;
    options = {};
    constructor(options: Record<string, unknown>) {
      xterm.options = options;
    }
    loadAddon() {}
    open() {}
    focus() {}
    dispose() {}
    attachCustomKeyEventHandler() {}
    hasSelection() {
      return false;
    }
    clearSelection() {}
    write(data: string, done?: () => void) {
      xterm.written.push(data);
      done?.();
    }
    onData(listener: (data: string) => void) {
      xterm.type = listener;
      return { dispose() {} };
    }
    onResize() {
      return { dispose() {} };
    }
  },
}));
vi.mock("@xterm/addon-fit", () => ({
  FitAddon: class {
    fit() {}
  },
}));

const shell = vi.hoisted(() => ({
  listener: (_event: ShellEvent) => {},
  unsubscribe: vi.fn(),
  open: vi.fn(async () => ({
    session: 7,
    sequence: 1,
    output: "ready> ",
    exitCode: null,
    reused: false,
  })),
  write: vi.fn(async () => undefined),
  resize: vi.fn(async () => undefined),
}));
vi.mock("../src/api/api-list/terminal", () => ({
  terminalApi: {
    ...shell,
    subscribe: (listener: (event: ShellEvent) => void) => {
      shell.listener = listener;
      return shell.unsubscribe;
    },
  },
}));
vi.mock("../src/api/api-list/projects", () => ({
  projectsApi: { logs: vi.fn(async () => []) },
}));
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

const project: ProjectView = {
  id: "r1",
  name: "client",
  folder: "/work/client",
  command: "pnpm dev",
  url: "",
  includeInRunAll: true,
  runtime: { status: "Stopped" },
  git: {},
};

afterEach(cleanup);

describe("repository console", () => {
  it("starts on Logs and opens a shell only from the Terminal tab", async () => {
    render(
      <QueryClientProvider client={new QueryClient()}>
        <LocaleProvider>
          <ThemeProvider>
            <RepositoryConsole project={project} />
          </ThemeProvider>
        </LocaleProvider>
      </QueryClientProvider>,
    );
    expect(screen.getByRole("tab", { name: "Logs" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    expect(shell.open).not.toHaveBeenCalled();

    fireEvent.mouseDown(screen.getByRole("tab", { name: "Terminal" }), {
      button: 0,
    });
    await waitFor(() =>
      expect(shell.open).toHaveBeenCalledWith({
        id: "r1",
        cols: 80,
        rows: 24,
        restart: false,
      }),
    );
    await waitFor(() => expect(xterm.written).toContain("ready> "));
    // Default cursor is a blinking line.
    expect(xterm.options).toMatchObject({
      cursorStyle: "bar",
      cursorBlink: true,
    });

    xterm.type("ls\r");
    expect(shell.write).toHaveBeenCalledWith({
      id: "r1",
      session: 7,
      data: "ls\r",
    });

    const data = { type: "data", id: "r1", session: 7 } as const;
    // Already part of the snapshot, then new, then from another shell.
    shell.listener({ ...data, sequence: 1, data: "duplicate" });
    shell.listener({ ...data, sequence: 2, data: "fresh" });
    shell.listener({ ...data, session: 6, sequence: 9, data: "stale" });
    expect(xterm.written).toContain("fresh");
    expect(xterm.written).not.toContain("duplicate");
    expect(xterm.written).not.toContain("stale");

    shell.listener({ type: "exit", id: "r1", session: 7, exitCode: 2 });
    expect(await screen.findByRole("status")).toHaveTextContent(
      "Shell exited with code 2.",
    );
    fireEvent.click(screen.getByRole("button", { name: "Restart terminal" }));
    await waitFor(() =>
      expect(shell.open).toHaveBeenLastCalledWith(
        expect.objectContaining({ restart: true }),
      ),
    );
    expect(shell.unsubscribe).toHaveBeenCalled();
  });
});
