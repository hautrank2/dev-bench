import { projectInputSchema } from "@shared/contracts";
import type { ProjectInput } from "@shared/contracts";
import type { ProjectGroup } from "@shared/workspace";

export const projectFormSchema = projectInputSchema;
export type ProjectFormProps = {
  groups?: ProjectGroup[];
  isEdit: boolean;
  defaultValues: ProjectInput;
  focusField?: "command" | "url";
  executionLocked?: boolean;
  onSubmit: (values: ProjectInput) => Promise<void>;
  onOpenChange: (open: boolean) => void;
};
export type ProjectFormDialogProps = ProjectFormProps & { open: boolean };
export type UseProjectFormProps = ProjectFormProps;
