import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";

import type { BatchResult, ProjectInput, ProjectView } from "@shared/contracts";
import type { ProjectGroup, SaveGroup } from "@shared/workspace";
import { projectsApi } from "~/api/api-list/projects";
import { useLocale } from "~/providers/locale/context";

import type {
  Action,
  EditorState,
  OperationResult,
  UseDashboardProps,
} from "./type";

export const useDashboard = (props: UseDashboardProps) => {
  const { t } = useLocale();

  const client = useQueryClient();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [editor, setEditor] = useState<EditorState | null>(null);
  const [groupEditor, setGroupEditor] = useState<ProjectGroup | null>(null);
  const [groupDialogOpen, setGroupDialogOpen] = useState(false);
  const [viewMode, updateViewMode] = useState<"cards" | "table">(() =>
    localStorage.getItem("DEV_BENCH_PROJECT_VIEW") === "table"
      ? "table"
      : "cards",
  );
  const [commitProject, setCommitProject] = useState<ProjectView | null>(null);
  const [logProject, setLogProject] = useState<ProjectView | null>(null);
  const workspace = useQuery({
    queryKey: ["workspace"],
    queryFn: projectsApi.workspace,
  });
  const cloud = useQuery({
    queryKey: ["cloud-status"],
    queryFn: projectsApi.cloudStatus,
  });
  const [batch, setBatch] = useState<BatchResult[] | null>(null);
  const [batchBusy, setBatchBusy] = useState(false);
  const [pending, setPending] = useState<string[]>([]);
  const [result, setResult] = useState<OperationResult | null>(null);
  const query = useQuery({
    queryKey: ["projects"],
    queryFn: projectsApi.list,
    refetchInterval: 5000,
  });
  const action = async (project: ProjectView, kind: Action) => {
    if (kind === "run" && !project.command) {
      setEditor({ project, focusField: "command" });
      return;
    }
    if (kind === "web" && !project.url) {
      setEditor({ project, focusField: "url" });
      return;
    }
    const key = `${project.id}:${kind}`;
    setPending((items) => [...items, key]);
    try {
      const output = await projectsApi[kind](project.id);
      if (kind === "copyPath")
        toast.success(t("{0}: Path copied", { 0: project.name }));
      if (kind === "pull" || kind === "push") {
        setResult({
          title: `${project.name}: ${kind === "pull" ? "Pull Code" : "Push"}`,
          output: String(output),
          failed: false,
        });
        toast.success(
          t("{0}: {1} completed", {
            0: project.name,
            1: kind === "pull" ? "Pull" : "Push",
          }),
        );
      }
    } catch (error) {
      const output = error instanceof Error ? error.message : String(error);
      setResult({
        title: `${project.name}: ${kind} failed`,
        output,
        failed: true,
      });
      toast.error(t("{0}: {1} failed", { 0: project.name, 1: kind }), {
        description: output,
      });
    } finally {
      setPending((items) => items.filter((item) => item !== key));
      await query.refetch();
    }
  };
  const runAll = async () => {
    if (batchBusy) return;
    setBatchBusy(true);
    setBatch(null);
    try {
      setBatch(await projectsApi.runAll());
    } catch (error) {
      setResult({
        title: "Run All failed",
        output: error instanceof Error ? error.message : String(error),
        failed: true,
      });
    } finally {
      setBatchBusy(false);
      await query.refetch();
    }
  };
  const save = async (input: ProjectInput) => {
    await projectsApi.save({
      id: editor?.project?.id,
      input: { ...input, groupId: input.groupId ?? editor?.groupId },
    });
    toast.success(
      editor?.project ? t("Repository updated") : t("Repository added"),
    );
    await query.refetch();
  };
  const saveGroup = async (input: SaveGroup) => {
    const group = await projectsApi.saveGroup(input);
    await workspace.refetch();
    setGroupDialogOpen(false);
    await navigate({ to: `/projects/${group.id}` });
  };
  const runGroup = async (id: string, stop = false) => {
    setBatchBusy(true);
    try {
      setBatch(
        await (stop ? projectsApi.stopGroup(id) : projectsApi.runGroup(id)),
      );
    } catch (error) {
      setResult({
        title: "Project action failed",
        output: error instanceof Error ? error.message : String(error),
        failed: true,
      });
    } finally {
      setBatchBusy(false);
      await query.refetch();
    }
  };
  const selectSet = async (id: string) => {
    try {
      await projectsApi.selectSet(id);
      setBatch(null);
      setResult(null);
      await client.invalidateQueries({ queryKey: ["projects"] });
      await workspace.refetch();
    } catch (error) {
      toast.error(t(error instanceof Error ? error.message : String(error)));
    }
  };
  const projects = query.data ?? [];
  const filtered = projects.filter((project) =>
    `${project.name} ${project.folder} ${project.git.branch ?? ""}`
      .toLowerCase()
      .includes(search.toLowerCase()),
  );
  const groups = workspace.data?.groups ?? [];
  const activeGroup = groups.find((group) => group.id === props.projectId);
  const visibleRepositories = filtered.filter(
    (repo) =>
      (!props.projectId || repo.groupId === props.projectId) &&
      (props.view !== "processes" ||
        ["Starting", "Running", "Stopping", "Failed"].includes(
          repo.runtime.status,
        )),
  );
  return {
    query,
    projects,
    filtered,
    visibleRepositories,
    groups,
    activeGroup,
    groupEditor,
    groupDialogOpen,
    setGroupDialogOpen,
    saveGroup,
    runGroup,
    viewMode,
    setViewMode: (mode: "cards" | "table") => {
      updateViewMode(mode);
      localStorage.setItem("DEV_BENCH_PROJECT_VIEW", mode);
    },
    addGroup: () => {
      setGroupEditor(null);
      setGroupDialogOpen(true);
    },
    editGroup: (group: ProjectGroup) => {
      setGroupEditor(group);
      setGroupDialogOpen(true);
    },
    search,
    setSearch,
    editor,
    setEditor,
    commitProject,
    setCommitProject,
    logProject,
    setLogProject,
    workspace,
    cloud,
    selectSet,
    openSettings: () => {
      void navigate({ to: "/settings" });
    },
    batch,
    setBatch,
    batchBusy,
    pending,
    result,
    setResult,
    action,
    runAll,
    save,
  };
};
