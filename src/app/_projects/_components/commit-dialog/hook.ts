import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useForm } from "react-hook-form";

import type { GitSnapshot } from "@shared/contracts";
import { projectsApi } from "~/api/api-list/projects";
import { useActionNotify } from "~/hooks/useActionNotify";
import { useLocale } from "~/providers/locale/context";
import { useMessages } from "~/providers/messages/context";
import { useNotify } from "~/providers/messages/useNotify";

import { commitFormSchema, type UseCommitDialogProps } from "./type";

export const useCommitDialog = (props: UseCommitDialogProps) => {
  const { t } = useLocale();
  const notify = useNotify();
  const report = useActionNotify();
  const { add } = useMessages();

  const client = useQueryClient();
  const form = useForm({
    resolver: zodResolver(commitFormSchema),
    defaultValues: { message: "" },
  });
  const [picked, setSelected] = useState<string[]>([]);
  const [review, setReview] = useState<GitSnapshot | null>(null);
  const [busy, setBusy] = useState(false);
  const [pushing, setPushing] = useState(false);
  const [error, setError] = useState("");
  const query = useQuery({
    queryKey: ["git", props.project.id],
    queryFn: () => projectsApi.git(props.project.id),
    enabled: props.open,
    refetchInterval: review ? false : 3000,
  });
  const refresh = async () => {
    await query.refetch();
    await client.invalidateQueries({ queryKey: ["projects"] });
  };
  const snapshot = review ?? query.data;
  const staged = snapshot?.files.filter((file) => file.staged) ?? [];
  const unstaged = snapshot?.files.filter((file) => file.unstaged) ?? [];
  // A picked file can be staged or reverted outside the dialog between refreshes.
  const selected = unstaged
    .map((file) => file.path)
    .filter((path) => picked.includes(path));
  const allSelected: boolean | "indeterminate" = !selected.length
    ? false
    : selected.length === unstaged.length || "indeterminate";
  const toggle = (path: string) => {
    setReview(null);
    setSelected((current) =>
      current.includes(path)
        ? current.filter((item) => item !== path)
        : [...current, path],
    );
  };
  // A partial selection completes to all; only a full one clears.
  const toggleAll = () => {
    setReview(null);
    setSelected(allSelected === true ? [] : unstaged.map((file) => file.path));
  };
  // The dialog shows the failure itself; the message list keeps it afterwards.
  const fail = (step: string, failure: unknown) => {
    const message =
      failure instanceof Error ? failure.message : String(failure);
    setError(message);
    add({
      level: "error",
      title: t("{0}: {1} failed", { 0: props.project.name, 1: step }),
      detail: t(message),
    });
  };
  const stage = async () => {
    setBusy(true);
    setError("");
    setReview(null);
    try {
      await projectsApi.stage({ id: props.project.id, paths: selected });
      setSelected([]);
    } catch (failure) {
      fail("Git Stage", failure);
    } finally {
      await refresh();
      setBusy(false);
    }
  };
  // The commit already exists here, so a failure is only about the push.
  const pushCommit = async () => {
    try {
      const output = await projectsApi.push(props.project.id);
      report.done(props.project.name, "push", output);
    } catch (failure) {
      report.failed(props.project.name, "push", failure);
    }
  };
  const send = (push: boolean) =>
    form.handleSubmit(async ({ message }) => {
      setBusy(true);
      setPushing(push);
      setError("");
      try {
        if (!review) {
          const snapshot = await projectsApi.git(props.project.id);
          if (!snapshot.files.some((file) => file.staged))
            throw new Error(t("No staged files to commit."));
          setReview(snapshot);
        } else {
          const output = await projectsApi.commit({
            id: props.project.id,
            message,
            token: review.token,
          });
          notify.success(
            t("{0}: Commit created", { 0: props.project.name }),
            output,
          );
          if (push) await pushCommit();
          props.onOpenChange(false);
        }
      } catch (failure) {
        fail("Git Commit", failure);
        setReview(null);
      } finally {
        await refresh();
        setBusy(false);
        setPushing(false);
      }
    });
  return {
    form,
    query,
    snapshot,
    staged,
    unstaged,
    review,
    busy,
    error,
    selected,
    allSelected,
    toggle,
    toggleAll,
    stage,
    pushing,
    submit: send(false),
    commitAndPush: send(true),
    cancelReview: () => setReview(null),
  };
};
