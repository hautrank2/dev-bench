/**
 * File-based routing in the style of the Next.js App Router, built on top of
 * TanStack Router (hash history, because the renderer is loaded from file://).
 *
 * Conventions inside `src/app`:
 * - `page.tsx`    default export = page component, receives `{ params }`.
 * - `layout.tsx`  default export = layout receiving `{ children }`; wraps every
 *                 page below its folder (layouts nest).
 * - `[id]`        dynamic segment   -> `$id`
 * - `[...slug]`   catch-all segment -> splat
 * - `(group)`     route group, not part of the URL
 * - `_folder`     private folder, never routable (colocated code)
 */
import {
  type AnyRoute,
  createHashHistory,
  createRootRoute,
  createRoute,
  createRouter,
  Outlet,
  useParams,
} from "@tanstack/react-router";
import type { ComponentType, ReactNode } from "react";

export type PageProps = { params: Record<string, string> };
export type LayoutProps = { children: ReactNode };
export type PageModule = { default: ComponentType<PageProps> };
export type LayoutModule = { default: ComponentType<LayoutProps> };

type DirNode = {
  children: Map<string, DirNode>;
  id: string;
  /** undefined for pathless route groups */
  path?: string;
  page?: ComponentType<PageProps>;
  layout?: ComponentType<LayoutProps>;
};

const toPath = (name: string): string | undefined => {
  if (/^\(.+\)$/.test(name)) return undefined;
  if (/^\[\.\.\..+\]$/.test(name)) return "$";
  const dynamic = /^\[(.+)\]$/.exec(name);
  return dynamic ? `$${dynamic[1]}` : name;
};

const createNode = (id: string, path?: string): DirNode => ({
  children: new Map(),
  id,
  path,
});

/** Turns glob results (keyed by absolute file path) into a directory tree. */
export const buildAppTree = (
  pages: Record<string, PageModule>,
  layouts: Record<string, LayoutModule>,
  root = "/src/app/",
): DirNode => {
  const tree = createNode("");
  const place = (file: string, apply: (node: DirNode) => void) => {
    if (!file.startsWith(root)) return;
    const names = file.slice(root.length).split("/").slice(0, -1);
    if (names.some((name) => name.startsWith("_"))) return;
    let node = tree;
    let dir = "";
    for (const name of names) {
      dir += `/${name}`;
      const next = node.children.get(name) ?? createNode(dir, toPath(name));
      node.children.set(name, next);
      node = next;
    }
    apply(node);
  };
  for (const [file, mod] of Object.entries(pages))
    place(file, (node) => (node.page = mod.default));
  for (const [file, mod] of Object.entries(layouts))
    place(file, (node) => (node.layout = mod.default));
  return tree;
};

const PageHost = ({ page: Page }: { page: ComponentType<PageProps> }) => {
  const params = useParams({ strict: false }) as Record<string, string>;
  return <Page params={params} />;
};

export const createFileRouter = (
  pages: Record<string, PageModule>,
  layouts: Record<string, LayoutModule>,
) => {
  const tree = buildAppTree(pages, layouts);
  const RootLayout = tree.layout;
  const rootRoute = createRootRoute({
    component: () =>
      RootLayout ? (
        <RootLayout>
          <Outlet />
        </RootLayout>
      ) : (
        <Outlet />
      ),
  });

  const build = (node: DirNode, parent: AnyRoute): AnyRoute[] => {
    const routes: AnyRoute[] = [];
    if (node.page) {
      const Page = node.page;
      routes.push(
        createRoute({
          getParentRoute: () => parent,
          path: "/",
          component: () => <PageHost page={Page} />,
        }),
      );
    }
    for (const child of node.children.values()) {
      const Layout = child.layout;
      const route = createRoute({
        getParentRoute: () => parent,
        ...(child.path === undefined ? { id: child.id } : { path: child.path }),
        component: Layout
          ? () => (
              <Layout>
                <Outlet />
              </Layout>
            )
          : Outlet,
      } as never);
      routes.push(route.addChildren(build(child, route)));
    }
    return routes;
  };

  return createRouter({
    routeTree: rootRoute.addChildren(build(tree, rootRoute)),
    history: createHashHistory(),
  });
};
