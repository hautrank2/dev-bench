import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";

import type { ProjectInput, ProjectView } from "@shared/contracts";
import type { ProjectGroup, SaveGroup } from "@shared/workspace";
import { projectsApi } from "~/api/api-list/projects";
import { useActionNotify } from "~/hooks/useActionNotify";
import { useLocale } from "~/providers/locale/context";

import type { Action, EditorState, UseProjectsProps } from "./type";

export const useProjects = (props: UseProjectsProps) => {
  const { t } = useLocale();
  const report = useActionNotify();

  const client = useQueryClient();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [editor, setEditor] = useState<EditorState | null>(null);
  const [groupEditor, setGroupEditor] = useState<ProjectGroup | null>(null);
  const [groupDialogOpen, setGroupDialogOpen] = useState(false);
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
  const [batchBusy, setBatchBusy] = useState(false);
  const [pending, setPending] = useState<string[]>([]);
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
      report.done(project.name, kind, await projectsApi[kind](project.id));
    } catch (error) {
      report.failed(project.name, kind, error);
    } finally {
      setPending((items) => items.filter((item) => item !== key));
      await query.refetch();
    }
  };
  const runAll = async () => {
    if (batchBusy) return;
    setBatchBusy(true);
    try {
      report.batch(
        "Run All",
        await projectsApi.runAll(),
        t("Run All completed"),
      );
    } catch (error) {
      report.error("Run All failed", error);
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
    const name =
      workspace.data?.groups.find((group) => group.id === id)?.name ??
      t("Project");
    setBatchBusy(true);
    try {
      report.batch(
        name,
        await (stop ? projectsApi.stopGroup(id) : projectsApi.runGroup(id)),
        t(stop ? "{0}: Project stopped" : "{0}: Project started", { 0: name }),
      );
    } catch (error) {
      report.error("Project action failed", error);
    } finally {
      setBatchBusy(false);
      await query.refetch();
    }
  };
  const selectSet = async (id: string) => {
    try {
      await projectsApi.selectSet(id);
      await client.invalidateQueries({ queryKey: ["projects"] });
      await workspace.refetch();
    } catch (error) {
      report.error("Could not change the project set", error);
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
  const activeRepository = projects.find(
    (repo) =>
      repo.id === props.repositoryId && repo.groupId === props.projectId,
  );
  const visibleRepositories = (props.repositoryId ? projects : filtered).filter(
    (repo) =>
      (!props.projectId || repo.groupId === props.projectId) &&
      (!props.repositoryId || repo.id === props.repositoryId) &&
      (props.view !== "processes" ||
        ["Starting", "Running", "Stopping", "Failed"].includes(
          repo.runtime.status,
        )),
  );
  const isActive = (repo: ProjectView) =>
    !!repo.runtime.pid ||
    ["Starting", "Running", "Stopping"].includes(repo.runtime.status);
  const groupRepositories = (id: string) =>
    projects.filter((repo) => repo.groupId === id);
  const filteredGroups = groups.filter((group) =>
    `${group.name} ${group.description} ${groupRepositories(group.id)
      .map((repo) => repo.name)
      .join(" ")}`
      .toLowerCase()
      .includes(search.toLowerCase()),
  );
  return {
    isActive,
    groupRepositories,
    filteredGroups,
    query,
    projects,
    filtered,
    visibleRepositories,
    groups,
    activeGroup,
    activeRepository,
    groupEditor,
    groupDialogOpen,
    setGroupDialogOpen,
    saveGroup,
    runGroup,
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
    batchBusy,
    pending,
    action,
    runAll,
    save,
  };
};
