import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { useState, type DragEvent } from "react";

import type { ProjectView } from "@shared/contracts";
import { moveBefore } from "@shared/order";
import type { WorkspaceInfo } from "@shared/workspace";
import { projectsApi } from "~/api/api-list/projects";
import { useActionNotify } from "~/hooks/useActionNotify";

import type { DropMark, DropSlot, TreeItem, UseProjectTreeProps } from "./type";

// A private type, so text fields never accept a dragged sidebar item.
const DRAG_TYPE = "application/x-devbench-tree";

const markKey = (mark: DropMark) =>
  mark.kind === "inside"
    ? `inside:${mark.groupId}`
    : mark.kind === "project"
      ? `project:${mark.beforeId}`
      : `repository:${mark.groupId}:${mark.beforeId}`;

export const useProjectTree = (props: UseProjectTreeProps) => {
  const report = useActionNotify();
  const client = useQueryClient();
  const navigate = useNavigate();
  const [dragged, setDragged] = useState<TreeItem | null>(null);
  const [mark, setMark] = useState<DropMark | null>(null);
  const repositoriesOf = (groupId: string) =>
    props.repositories.filter((repo) => repo.groupId === groupId);

  // Shows the new order at once, then reloads what main actually saved.
  const commit = async <T>(
    key: "workspace" | "projects",
    preview: (current: T) => T,
    save: () => Promise<unknown>,
  ) => {
    try {
      await client.cancelQueries({ queryKey: [key] });
      client.setQueryData<T>([key], (current) =>
        current === undefined ? current : preview(current),
      );
      await save();
      return true;
    } catch (error) {
      report.error("Could not move the item", error);
      return false;
    } finally {
      await client.invalidateQueries({ queryKey: [key] });
    }
  };

  const moveProject = (id: string, beforeId: string | null) =>
    commit<WorkspaceInfo>(
      "workspace",
      (current) => {
        const group = current.groups.find((item) => item.id === id);
        return group
          ? { ...current, groups: moveBefore(current.groups, group, beforeId) }
          : current;
      },
      () => projectsApi.moveGroup({ id, beforeId }),
    );

  const moveRepository = async (
    id: string,
    groupId: string,
    beforeId: string | null,
  ) => {
    const source = props.repositories.find((repo) => repo.id === id);
    if (!source) return;
    const moved = await commit<ProjectView[]>(
      "projects",
      (current) => {
        const repo = current.find((item) => item.id === id);
        // Main rejects moving a running repository, so do not preview it.
        if (!repo || (repo.groupId !== groupId && repo.runtime.pid))
          return current;
        return moveBefore(current, { ...repo, groupId }, beforeId);
      },
      () => projectsApi.moveRepository({ id, groupId, beforeId }),
    );
    if (!moved || source.groupId === groupId) return;
    props.onExpand(groupId);
    // The open repository page lives under its project in the URL.
    if (props.pathname.endsWith(`/repositories/${id}`))
      await navigate({ to: `/projects/${groupId}/repositories/${id}` });
  };

  /** Moves an item one step among its siblings, or undefined at either end. */
  const step = (item: TreeItem, offset: -1 | 1) => {
    const list =
      item.kind === "project" ? props.groups : repositoriesOf(item.groupId);
    const index = list.findIndex((current) => current.id === item.id);
    if (index < 0 || !list[index + offset]) return undefined;
    const beforeId =
      offset < 0 ? list[index - 1]?.id : (list[index + 2]?.id ?? null);
    if (beforeId === undefined) return undefined;
    return () => {
      void (item.kind === "project"
        ? moveProject(item.id, beforeId)
        : moveRepository(item.id, item.groupId, beforeId));
    };
  };

  /** A gap next to the dragged row would leave the order unchanged. */
  const accepts = (slot: DropSlot) => {
    if (!dragged || dragged.kind !== slot.kind) return false;
    if (
      slot.kind === "repository" &&
      dragged.kind === "repository" &&
      slot.groupId !== dragged.groupId
    )
      return true;
    const list =
      slot.kind === "project" ? props.groups : repositoriesOf(slot.groupId);
    const index = list.findIndex((current) => current.id === dragged.id);
    return (
      slot.beforeId !== dragged.id &&
      slot.beforeId !== (list[index + 1]?.id ?? null)
    );
  };

  // The upper half of a row targets the gap above it, the lower half below.
  const targetFor = (event: DragEvent, item: TreeItem): DropMark | null => {
    if (!dragged) return null;
    if (dragged.kind === "repository" && item.kind === "project")
      return { kind: "inside", groupId: item.id };
    const list =
      item.kind === "project" ? props.groups : repositoriesOf(item.groupId);
    const index = list.findIndex((current) => current.id === item.id);
    const box = event.currentTarget.getBoundingClientRect();
    const beforeId =
      event.clientY < box.top + box.height / 2
        ? item.id
        : (list[index + 1]?.id ?? null);
    const slot: DropSlot =
      item.kind === "project"
        ? { kind: "project", beforeId }
        : { kind: "repository", groupId: item.groupId, beforeId };
    return accepts(slot) ? slot : null;
  };

  const reset = () => {
    setDragged(null);
    setMark(null);
  };

  const dragOver = (event: DragEvent, target: DropMark | null) => {
    if (!target) {
      setMark(null);
      return;
    }
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
    if (!mark || markKey(mark) !== markKey(target)) setMark(target);
  };

  const drop = (event: DragEvent, target: DropMark | null) => {
    if (!dragged || !target) return;
    event.preventDefault();
    if (target.kind === "project")
      void moveProject(dragged.id, target.beforeId);
    else
      void moveRepository(
        dragged.id,
        target.groupId,
        target.kind === "inside" ? null : target.beforeId,
      );
    reset();
  };

  /** Drag-and-drop handlers for one row of the tree. */
  const dragProps = (item: TreeItem) => ({
    draggable: true,
    "data-dragging": dragged?.id === item.id || undefined,
    "data-drop":
      item.kind === "project" &&
      mark?.kind === "inside" &&
      mark.groupId === item.id
        ? "inside"
        : undefined,
    onDragStart: (event: DragEvent) => {
      event.stopPropagation();
      event.dataTransfer.clearData();
      event.dataTransfer.setData(DRAG_TYPE, item.id);
      event.dataTransfer.effectAllowed = "move";
      setDragged(item);
    },
    onDragOver: (event: DragEvent) => dragOver(event, targetFor(event, item)),
    onDrop: (event: DragEvent) => drop(event, targetFor(event, item)),
    onDragEnd: reset,
  });

  /** Handlers for a divider, so the gap itself is a drop target too. */
  const dividerProps = (slot: DropSlot) => ({
    "data-active": (mark && markKey(mark) === markKey(slot)) || undefined,
    onDragOver: (event: DragEvent) =>
      dragOver(event, accepts(slot) ? slot : null),
    onDrop: (event: DragEvent) => drop(event, accepts(slot) ? slot : null),
  });

  const leaveTree = (event: DragEvent) => {
    const next = event.relatedTarget;
    if (!(next instanceof Node) || !event.currentTarget.contains(next))
      setMark(null);
  };

  return {
    repositoriesOf,
    moveRepository,
    step,
    dragProps,
    dividerProps,
    leaveTree,
  };
};
