import { z } from "zod";

const sizeShape = {
  cols: z.number().int().min(2).max(500),
  rows: z.number().int().min(1).max(300),
};
// The renderer only names a saved repository. Main chooses the shell and folder.
export const shellOpenSchema = z.object({
  id: z.uuid(),
  restart: z.boolean().optional(),
  ...sizeShape,
});
export const shellWriteSchema = z.object({
  id: z.uuid(),
  session: z.number().int().positive(),
  data: z.string().min(1).max(1_000_000),
});
export const shellResizeSchema = z.object({
  id: z.uuid(),
  session: z.number().int().positive(),
  ...sizeShape,
});

export type ShellOpenRequest = z.infer<typeof shellOpenSchema>;
export type ShellWriteRequest = z.infer<typeof shellWriteSchema>;
export type ShellResizeRequest = z.infer<typeof shellResizeSchema>;
export type ShellSnapshot = {
  session: number;
  /** Sequence number of the last chunk included in `output`. */
  sequence: number;
  output: string;
  exitCode: number | null;
  reused: boolean;
};
export type ShellEvent =
  | {
      type: "data";
      id: string;
      session: number;
      sequence: number;
      data: string;
    }
  | { type: "exit"; id: string; session: number; exitCode: number };
