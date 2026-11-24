import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  createHashHistory,
  createRootRoute,
  createRoute,
  createRouter,
  Outlet,
  RouterProvider,
} from "@tanstack/react-router";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { LocalizedToaster } from "~/components/localized-toaster";

import { ThemeProvider } from "~/providers/theme";
import { LocaleProvider } from "~/providers/locale";
import { Dashboard } from "~/routes/dashboard";
import { Settings } from "~/routes/settings";
import { AppLayout } from "~/components/layouts/app-layout";
import { Inspect } from "~/routes/inspect";
import { useParams } from "@tanstack/react-router";

import "./index.css";

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false, refetchOnWindowFocus: true } },
});
const rootRoute = createRootRoute({
  component: () => (
    <AppLayout>
      <Outlet />
    </AppLayout>
  ),
});
const dashboardRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: Dashboard,
});
const router = createRouter({
  routeTree: rootRoute.addChildren([
    dashboardRoute,
    createRoute({
      getParentRoute: () => rootRoute,
      path: "/projects",
      component: () => <Dashboard view="projects" />,
    }),
    createRoute({
      getParentRoute: () => rootRoute,
      path: "/projects/$projectId",
      component: () => {
        const params = useParams({ strict: false });
        return (
          <Dashboard
            view="projects"
            projectId={
              "projectId" in params && typeof params.projectId === "string"
                ? params.projectId
                : undefined
            }
          />
        );
      },
    }),
    createRoute({
      getParentRoute: () => rootRoute,
      path: "/processes",
      component: () => <Dashboard view="processes" />,
    }),
    ...(["ports", "stats", "utilities", "hosts", "config-files"] as const).map(
      (kind) =>
        createRoute({
          getParentRoute: () => rootRoute,
          path: `/${kind}`,
          component: () => <Inspect kind={kind} />,
        }),
    ),
    createRoute({
      getParentRoute: () => rootRoute,
      path: "/settings",
      component: Settings,
    }),
  ]),
  history: createHashHistory(),
});
const element = document.getElementById("root");
if (!element) throw new Error("Application root is missing");
createRoot(element).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <LocaleProvider>
        <ThemeProvider>
          <RouterProvider router={router} />
          <LocalizedToaster />
        </ThemeProvider>
      </LocaleProvider>
    </QueryClientProvider>
  </StrictMode>,
);
