import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import type { GitSnapshot } from "@shared/contracts";
import { projectsApi } from "~/api/api-list/projects";
import { useLocale } from "~/providers/locale/context";

import { commitFormSchema, type UseCommitDialogProps } from "./type";

export const useCommitDialog = (props: UseCommitDialogProps) => {
  const { t } = useLocale();

  const client = useQueryClient();
  const form = useForm({
    resolver: zodResolver(commitFormSchema),
    defaultValues: { message: "" },
  });
  const [selected, setSelected] = useState<string[]>([]);
  const [review, setReview] = useState<GitSnapshot | null>(null);
  const [busy, setBusy] = useState(false);
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
  const toggle = (path: string) => {
    setReview(null);
    setSelected((current) =>
      current.includes(path)
        ? current.filter((item) => item !== path)
        : [...current, path],
    );
  };
  const stage = async () => {
    setBusy(true);
    setError("");
    setReview(null);
    try {
      await projectsApi.stage({ id: props.project.id, paths: selected });
      setSelected([]);
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : String(failure));
    } finally {
      await refresh();
      setBusy(false);
    }
  };
  const submit = form.handleSubmit(async ({ message }) => {
    setBusy(true);
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
        toast.success(t("{0}: Commit created", { 0: props.project.name }), {
          description: output,
        });
        props.onOpenChange(false);
      }
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : String(failure));
      setReview(null);
    } finally {
      await refresh();
      setBusy(false);
    }
  });
  const snapshot = review ?? query.data;
  return {
    form,
    query,
    snapshot,
    review,
    busy,
    error,
    selected,
    toggle,
    stage,
    submit,
    cancelReview: () => setReview(null),
  };
};
