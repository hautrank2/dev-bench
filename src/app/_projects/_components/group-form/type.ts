import {
  groupInputSchema,
  type ProjectGroup,
  type SaveGroup,
} from "@shared/workspace";

export const groupFormSchema = groupInputSchema;
export type GroupFormProps = {
  isEdit: boolean;
  defaultValues: ProjectGroup | null;
  onSubmit: (input: SaveGroup) => Promise<void>;
  onOpenChange: (open: boolean) => void;
};
export type GroupFormDialogProps = GroupFormProps & { open: boolean };
export type UseGroupFormProps = GroupFormProps;
