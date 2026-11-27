import { z } from "zod";

export const detectFolderSchema = z.object({
  folder: z.string().trim().min(1).max(4096),
  workingDirectory: z.string().trim().max(4096).optional(),
});

export type DetectFolderRequest = z.infer<typeof detectFolderSchema>;
/** Values guessed from a repository's own files; every part is optional. */
export type FolderSuggestion = {
  command?: string;
  url?: string;
  /** File the suggestion came from. */
  source?: string;
};
