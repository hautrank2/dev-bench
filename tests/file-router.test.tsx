// @vitest-environment jsdom
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { RouterProvider } from "@tanstack/react-router";
import { afterEach, describe, expect, it } from "vitest";

import {
  createFileRouter,
  type LayoutModule,
  type PageModule,
} from "../src/lib/file-router";

const page = (label: string): PageModule => ({
  default: ({ params }) => (
    <p>{`${label}:${Object.entries(params)
      .map(([k, v]) => `${k}=${v}`)
      .join(",")}`}</p>
  ),
});
const layout = (label: string): LayoutModule => ({
  default: ({ children }) => (
    <section>
      <h1>{label}</h1>
      {children}
    </section>
  ),
});

const mount = (hash: string) => {
  window.location.hash = hash;
  const router = createFileRouter(
    {
      "/src/app/page.tsx": page("home"),
      "/src/app/projects/[projectId]/page.tsx": page("project"),
      "/src/app/(group)/about/page.tsx": page("about"),
      "/src/app/_private/page.tsx": page("private"),
    },
    {
      "/src/app/layout.tsx": layout("root"),
      "/src/app/projects/layout.tsx": layout("projects"),
    },
  );
  render(<RouterProvider router={router} />);
};

afterEach(cleanup);

describe("file router", () => {
  it("renders the index page inside the root layout", async () => {
    mount("#/");
    expect(await screen.findByText("home:")).toBeTruthy();
    expect(screen.getByText("root")).toBeTruthy();
  });

  it("maps [param] segments and nests layouts", async () => {
    mount("#/projects/abc");
    expect(await screen.findByText("project:projectId=abc")).toBeTruthy();
    expect(screen.getByText("root")).toBeTruthy();
    expect(screen.getByText("projects")).toBeTruthy();
  });

  it("omits (group) folders from the URL and ignores _private folders", async () => {
    mount("#/about");
    expect(await screen.findByText("about:")).toBeTruthy();
    window.location.hash = "#/_private";
    await waitFor(() => expect(screen.queryByText("private:")).toBeNull());
  });
});
