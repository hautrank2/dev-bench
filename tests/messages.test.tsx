// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { MessageCenter } from "../src/components/layouts/app-layout/message-center";
import { useActionNotify } from "../src/hooks/useActionNotify";
import { MessagesProvider } from "../src/providers/messages";
import { DETAIL_LIMIT, MESSAGE_LIMIT } from "../src/providers/messages/hook";
import { useMessages } from "../src/providers/messages/context";

const toast = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn() }));
vi.mock("sonner", () => ({ toast }));

const Actions = () => {
  const report = useActionNotify();
  const { messages, add } = useMessages();
  return (
    <>
      <button
        onClick={() =>
          report.failed("client", "pull", new Error("line 1\nline 2\nline 3"))
        }
      >
        fail
      </button>
      <button
        onClick={() => {
          report.done("client", "run");
          report.done("client", "copyPath");
          report.done("client", "web");
        }}
      >
        confirm
      </button>
      <button
        onClick={() =>
          report.batch(
            "Alpha",
            [
              { id: "1", name: "web", outcome: "Started", message: "ok" },
              { id: "2", name: "api", outcome: "Failed", message: "boom" },
            ],
            "Alpha: Project started",
          )
        }
      >
        batch
      </button>
      <button
        onClick={() => {
          for (let index = 0; index < MESSAGE_LIMIT + 5; index += 1)
            add({
              level: "error",
              title: `many ${index}`,
              detail: "x".repeat(DETAIL_LIMIT + 10),
            });
        }}
      >
        flood
      </button>
      <output>
        {messages.length}:{messages[0]?.detail?.length ?? 0}
      </output>
    </>
  );
};

const mount = () =>
  render(
    <MessagesProvider>
      <Actions />
      <MessageCenter />
    </MessagesProvider>,
  );
const press = (name: string) =>
  fireEvent.click(screen.getByRole("button", { name }));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("messages", () => {
  it("toasts a short text and keeps the whole one to open and delete", () => {
    mount();
    press("fail");
    press("fail");
    press("batch");
    expect(toast.error).toHaveBeenCalledWith("client: Pull failed", {
      description: "line 1\nline 2",
    });

    // The repeated failure is one entry, so two are unread.
    press("Messages, 2 unread");
    expect(screen.getByText("2 saved messages")).toBeInTheDocument();
    expect(screen.getByText(/×2/)).toBeInTheDocument();
    expect(screen.queryByText(/line 3/)).not.toBeInTheDocument();

    fireEvent.click(
      screen.getByRole("button", { name: /^Error: client: Pull failed/ }),
    );
    expect(screen.getByText(/line 3/)).toBeInTheDocument();

    // Failed repositories come first in a batch result.
    fireEvent.click(
      screen.getByRole("button", { name: /^Error:.*1 repositories failed/ }),
    );
    expect(screen.getByText(/web: Started/).textContent).toMatch(
      /^api: Failed — boom\nweb: Started — ok$/,
    );

    press("Delete message: client: Pull failed");
    expect(screen.getByText("1 saved messages")).toBeInTheDocument();
    press("Clear all");
    expect(screen.getByText("No messages yet.")).toBeInTheDocument();
  });

  it("does not save plain confirmations", () => {
    mount();
    press("confirm");
    expect(toast.success.mock.calls.map((call) => call[0])).toEqual([
      "client: Started",
      "client: Path copied",
    ]);
    press("Messages");
    expect(screen.getByText("No messages yet.")).toBeInTheDocument();
  });

  it("limits how much it keeps in memory", () => {
    mount();
    press("flood");
    expect(screen.getByRole("status")).toHaveTextContent(
      `${MESSAGE_LIMIT}:${DETAIL_LIMIT + 1}`,
    );
  });
});
