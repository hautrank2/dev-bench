import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { groupFormSchema, type UseGroupFormProps } from "./type";

export const useGroupForm = (props: UseGroupFormProps) => {
  const form = useForm({
    resolver: zodResolver(groupFormSchema),
    defaultValues: {
      name: props.defaultValues?.name ?? "",
      description: props.defaultValues?.description ?? "",
    },
  });
  const submit = form.handleSubmit(async (input) => {
    try {
      await props.onSubmit({ ...input, id: props.defaultValues?.id });
      props.onOpenChange(false);
    } catch (error) {
      form.setError("root", {
        message: error instanceof Error ? error.message : String(error),
      });
    }
  });
  return { form, submit };
};
