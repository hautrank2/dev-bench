import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useForm } from "react-hook-form";

import { projectsApi } from "~/api/api-list/projects";

import { projectFormSchema, type UseProjectFormProps } from "./type";

export const useProjectForm = (props: UseProjectFormProps) => {
  const form = useForm({
    resolver: zodResolver(projectFormSchema),
    defaultValues: props.defaultValues,
  });
  useEffect(() => {
    if (props.focusField) form.setFocus(props.focusField);
  }, [props.focusField, form]);
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
  return {
    form,
    pickFolder,
    submit,
    isSubmitting: form.formState.isSubmitting,
  };
};
