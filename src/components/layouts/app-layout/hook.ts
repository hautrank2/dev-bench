import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import type { ProjectInput } from "@shared/contracts";
import { themeSchema, type SaveGroup } from "@shared/workspace";
import { projectsApi } from "~/api/api-list/projects";
import { useActionNotify } from "~/hooks/useActionNotify";
import { useLocale } from "~/providers/locale/context";
import { useTheme } from "~/providers/theme/context";
import { isRepositoryActive } from "~/utils/repository";

import type { FocusField } from "./project-tree/type";
import type { RepositoryEditor, UseAppLayoutProps } from "./type";

export const useAppLayout = (_props: UseAppLayoutProps) => {
  const { t } = useLocale();
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
  const report = useActionNotify();
  // Report a load failure once, not on every five second reload.
  const loadError = workspace.error?.message ?? repositories.error?.message;
  const loaded = workspace.isSuccess && repositories.isSuccess;
  const reported = useRef<string>(undefined);
  useEffect(() => {
    if (loaded) reported.current = undefined;
    if (!loadError || reported.current === loadError) return;
    reported.current = loadError;
    report.error("Could not load the workspace", loadError);
  }, [loadError, loaded, report]);
  const [projectsOpen, setProjectsOpen] = useState(true);
  const [expanded, setExpanded] = useState<string[]>([]);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
  const [repositoryEditor, setRepositoryEditor] =
    useState<RepositoryEditor | null>(null);
  const [committingId, setCommittingId] = useState<string | null>(null);
  // Looked up by ID so the dialog sees the live runtime status.
  const editingGroup = workspace.data?.groups.find(
    (group) => group.id === editingGroupId,
  );
  const editingRepository = repositories.data?.find(
    (repo) => repo.id === repositoryEditor?.id,
  );
  const committingRepository = repositories.data?.find(
    (repo) => repo.id === committingId,
  );
  const editingRepositoryActive =
    !!editingRepository && isRepositoryActive(editingRepository);
  // The mobile sheet is modal, so it has to close before a dialog opens.
  const editGroup = (id: string) => {
    setMobileOpen(false);
    setEditingGroupId(id);
  };
  const editRepository = (id: string, focusField?: FocusField) => {
    setMobileOpen(false);
    setRepositoryEditor({ id, focusField });
  };
  const addRepository = (groupId: string) => {
    setMobileOpen(false);
    setRepositoryEditor({ groupId });
  };
  const commitRepository = (id: string) => {
    setMobileOpen(false);
    setCommittingId(id);
  };
  const saveGroup = async (input: SaveGroup) => {
    await projectsApi.saveGroup(input);
    await client.invalidateQueries({ queryKey: ["workspace"] });
  };
  const saveRepository = async (input: ProjectInput) => {
    const id = repositoryEditor?.id;
    const groupId = input.groupId ?? repositoryEditor?.groupId;
    await projectsApi.save({ id, input: { ...input, groupId } });
    toast.success(t(id ? "Repository updated" : "Repository added"));
    if (!id && groupId)
      setExpanded((current) =>
        current.includes(groupId) ? current : [...current, groupId],
      );
    await client.invalidateQueries({ queryKey: ["projects"] });
  };
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
  useEffect(() => {
    const groupId = pathname.split("/")[2];
    if (pathname.includes("/repositories/") && groupId) {
      setProjectsOpen(true);
      setExpanded((current) =>
        current.includes(groupId) ? current : [...current, groupId],
      );
    }
  }, [pathname]);
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
    expandProject: (id: string) =>
      setExpanded((current) =>
        current.includes(id) ? current : [...current, id],
      ),
    toggleProject: (id: string) =>
      setExpanded((current) =>
        current.includes(id)
          ? current.filter((item) => item !== id)
          : [...current, id],
      ),
    mobileOpen,
    setMobileOpen,
    editingGroup,
    editingRepository,
    editingRepositoryActive,
    editGroup,
    editRepository,
    addRepository,
    commitRepository,
    repositoryEditor,
    committingRepository,
    closeGroupEditor: () => setEditingGroupId(null),
    closeRepositoryEditor: () => setRepositoryEditor(null),
    closeCommit: () => setCommittingId(null),
    saveGroup,
    saveRepository,
    openSettings: () => {
      void navigate({ to: "/settings" });
    },
    selectTheme: (value: string) => {
      const parsed = themeSchema.safeParse(value);
      if (parsed.success) theme.setTheme(parsed.data);
    },
  };
};
