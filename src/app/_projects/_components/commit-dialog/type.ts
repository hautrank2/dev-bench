import { z } from "zod";

import type { GitFile, ProjectView } from "@shared/contracts";

export const commitFormSchema = z.object({
  message: z.string().trim().min(1, "Commit message is required"),
});
export type CommitDialogProps = {
  project: ProjectView;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};
export type CommitFormProps = CommitDialogProps;
export type UseCommitDialogProps = CommitFormProps;
export type CommitFilePathProps = { file: GitFile };
