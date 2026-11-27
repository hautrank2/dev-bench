import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useRef, useState } from "react";
import { useForm, useWatch } from "react-hook-form";

import type { FolderSuggestion } from "@shared/detect";

import { projectsApi } from "~/api/api-list/projects";

import { projectFormSchema, type UseProjectFormProps } from "./type";

export const DEFAULT_WEB_URL = "http://localhost:3000";
const DETECT_DELAY = 400;

export const useProjectForm = (props: UseProjectFormProps) => {
  // Editing a repository without a URL must not add one on save, unless the
  // dialog was opened specifically to enter it.
  const prefillUrl = !props.isEdit || props.focusField === "url";
  // What an untouched Web URL holds, so detection knows it may replace it.
  const untouchedUrl =
    !props.defaultValues.url && prefillUrl ? DEFAULT_WEB_URL : "";
  const form = useForm({
    resolver: zodResolver(projectFormSchema),
    defaultValues: {
      ...props.defaultValues,
      url: props.defaultValues.url || untouchedUrl,
      workingDirectory: props.defaultValues.workingDirectory ?? "",
    },
  });
  useEffect(() => {
    if (props.focusField) form.setFocus(props.focusField);
  }, [props.focusField, form]);
  const [folder, workingDirectory, command, url] = useWatch({
    control: form.control,
    name: ["folder", "workingDirectory", "command", "url"],
  });
  const [detected, setDetected] = useState<FolderSuggestion>({});
  const filled = useRef<FolderSuggestion>({});
  const initialPath = useRef(JSON.stringify([folder, workingDirectory]));
  const pathChanged = useRef(false);

  // Replaces only blank fields, the untouched default and earlier suggestions.
  const applySuggestion = (suggestion: FolderSuggestion) => {
    for (const [name, fallback] of [
      ["command", ""],
      ["url", untouchedUrl],
    ] as const) {
      const value = form.getValues(name);
      const previous = filled.current[name];
      if (value && value !== fallback && value !== previous) continue;
      const next = suggestion[name];
      filled.current[name] = next;
      if (next) form.setValue(name, next, { shouldValidate: true });
      else if (previous && value === previous)
        form.setValue(name, fallback, { shouldValidate: true });
    }
    setDetected({ ...filled.current, source: suggestion.source });
  };

  useEffect(() => {
    // Opening the dialog must not rewrite saved values; a new path may.
    if (JSON.stringify([folder, workingDirectory]) !== initialPath.current)
      pathChanged.current = true;
    if (!pathChanged.current || !folder.trim() || props.executionLocked) return;
    let stale = false;
    const timer = setTimeout(() => {
      projectsApi
        .detectFolder({ folder, workingDirectory })
        .then((suggestion) => {
          if (!stale) applySuggestion(suggestion);
        })
        // Detection is a convenience: saving reports real folder problems.
        .catch(() => undefined);
    }, DETECT_DELAY);
    return () => {
      stale = true;
      clearTimeout(timer);
    };
  }, [folder, workingDirectory, props.executionLocked]);

  const pickFolder = async () => {
    try {
      const folder = await projectsApi.pickFolder();
      if (!folder) return;
      form.setValue("folder", folder, { shouldValidate: true });
      if (!form.getValues("name")) {
        form.setValue(
          "name",
          folder.split(/[\\/]/).filter(Boolean).at(-1) ?? "",
        );
      }
    } catch (error) {
      form.setError("folder", {
        message: error instanceof Error ? error.message : String(error),
      });
    }
  };
  const submit = form.handleSubmit(async (values) => {
    try {
      await props.onSubmit(values);
      props.onOpenChange(false);
    } catch (error) {
      form.setError("root", {
        message: error instanceof Error ? error.message : String(error),
      });
    }
  });
  const clearUrl = () => {
    form.setValue("url", "", { shouldDirty: true, shouldValidate: true });
    form.setFocus("url");
  };
  return {
    form,
    commandSource:
      command && command === detected.command ? detected.source : undefined,
    urlSource: url && url === detected.url ? detected.source : undefined,
    clearUrl,
    pickFolder,
    submit,
    isSubmitting: form.formState.isSubmitting,
  };
};
