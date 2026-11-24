import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";

import { themeSchema } from "@shared/workspace";
import { projectsApi } from "~/api/api-list/projects";
import { useTheme } from "~/providers/theme/context";

import type { UseAppLayoutProps } from "./type";

export const useAppLayout = (_props: UseAppLayoutProps) => {
  const client = useQueryClient();
  const navigate = useNavigate();
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  });
  const workspace = useQuery({
    queryKey: ["workspace"],
    queryFn: projectsApi.workspace,
  });
  const repositories = useQuery({
    queryKey: ["projects"],
    queryFn: projectsApi.list,
    refetchInterval: 5000,
  });
  const cloud = useQuery({
    queryKey: ["cloud-status"],
    queryFn: projectsApi.cloudStatus,
  });
  const theme = useTheme();
  const [projectsOpen, setProjectsOpen] = useState(true);
  const [expanded, setExpanded] = useState<string[]>([]);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(
    () => localStorage.getItem("DEV_BENCH_SIDEBAR_COLLAPSED") === "true",
  );
  useEffect(() => {
    localStorage.setItem("DEV_BENCH_SIDEBAR_COLLAPSED", String(collapsed));
  }, [collapsed]);
  useEffect(() => {
    try {
      return projectsApi.subscribe(() => {
        void client.invalidateQueries({ queryKey: ["projects"] });
        void client.invalidateQueries({ queryKey: ["workspace"] });
        void client.invalidateQueries({ queryKey: ["cloud-status"] });
      });
    } catch {
      return undefined;
    }
  }, [client]);
  useEffect(() => setMobileOpen(false), [pathname]);
  return {
    workspace,
    repositories,
    cloud,
    theme,
    collapsed,
    toggleCollapsed: () => setCollapsed((current) => !current),
    pathname,
    projectsOpen,
    setProjectsOpen,
    expanded,
    toggleProject: (id: string) =>
      setExpanded((current) =>
        current.includes(id)
          ? current.filter((item) => item !== id)
          : [...current, id],
      ),
    mobileOpen,
    setMobileOpen,
    openSettings: () => {
      void navigate({ to: "/settings" });
    },
    selectTheme: (value: string) => {
      const parsed = themeSchema.safeParse(value);
      if (parsed.success) theme.setTheme(parsed.data);
    },
  };
};
