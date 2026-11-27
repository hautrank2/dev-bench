import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider } from "@tanstack/react-router";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { LocalizedToaster } from "~/components/localized-toaster";

import {
  createFileRouter,
  type LayoutModule,
  type PageModule,
} from "~/lib/file-router";
import { ThemeProvider } from "~/providers/theme";
import { LocaleProvider } from "~/providers/locale";
import { MessagesProvider } from "~/providers/messages";

import "./index.css";

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false, refetchOnWindowFocus: true } },
});
const router = createFileRouter(
  import.meta.glob<PageModule>("/src/app/**/page.tsx", { eager: true }),
  import.meta.glob<LayoutModule>("/src/app/**/layout.tsx", { eager: true }),
);
const element = document.getElementById("root");
if (!element) throw new Error("Application root is missing");
createRoot(element).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <LocaleProvider>
        <ThemeProvider>
          <MessagesProvider>
            <RouterProvider router={router} />
          </MessagesProvider>
          <LocalizedToaster />
        </ThemeProvider>
      </LocaleProvider>
    </QueryClientProvider>
  </StrictMode>,
);
