import { z } from "zod";
import type {
  Appearance,
  BackupInfo,
  CloudStatus,
  ImportPreview,
  WorkspaceInfo,
  SaveGroup,
  ProjectGroup,
  MoveGroup,
  MoveRepository,
} from "./workspace";
import type {
  ConfigFileInfo,
  HostsInfo,
  PortRecord,
  SystemInfo,
} from "./system";
import type { DetectFolderRequest, FolderSuggestion } from "./detect";
import type {
  ShellEvent,
  ShellOpenRequest,
  ShellResizeRequest,
  ShellSnapshot,
  ShellWriteRequest,
} from "./terminal";

export const projectInputSchema = z.object({
  groupId: z.uuid().optional(),
  name: z.string().trim().min(1, "Name is required").max(120),
  folder: z.string().trim().min(1, "Project folder is required"),
  workingDirectory: z.string().trim().max(4096).optional(),
  command: z.string().trim().max(8000),
  url: z
    .string()
    .trim()
    .refine((value) => {
      if (!value) return true;
      try {
        return ["http:", "https:"].includes(new URL(value).protocol);
      } catch {
        return false;
      }
    }, "Enter an http:// or https:// URL"),
  includeInRunAll: z.boolean(),
});

export const projectSchema = projectInputSchema.extend({ id: z.uuid() });
export const configSchema = z
  .object({
    version: z.literal(1),
    projects: z.array(projectSchema),
  })
  .superRefine((value, ctx) => {
    if (
      new Set(value.projects.map((item) => item.id)).size !==
      value.projects.length
    ) {
      ctx.addIssue({ code: "custom", message: "Duplicate project IDs" });
    }
  });
export const idSchema = z.uuid();
export const saveSchema = z.object({
  id: idSchema.optional(),
  input: projectInputSchema,
});
export const stageSchema = z.object({
  id: idSchema,
  paths: z.array(z.string().min(1)).min(1),
});
export const commitSchema = z.object({
  id: idSchema,
  message: z.string().trim().min(1, "Commit message is required"),
  token: z.string().min(1),
});

export type ProjectInput = z.infer<typeof projectInputSchema>;
export type Project = z.infer<typeof projectSchema>;
export type Repository = Project;
export type Config = z.infer<typeof configSchema>;
export type SaveProject = z.infer<typeof saveSchema>;
export type StageRequest = z.infer<typeof stageSchema>;
export type CommitRequest = z.infer<typeof commitSchema>;
export type ProcessStatus =
  "Stopped" | "Starting" | "Running" | "Stopping" | "Failed";
export type Runtime = {
  status: ProcessStatus;
  pid?: number;
  startedAt?: string;
  error?: string;
};
export type LogEntry = {
  sequence: number;
  time: string;
  stream: "stdout" | "stderr" | "system";
  text: string;
};
export type GitRemoteWeb = {
  url: string;
  provider: "github" | "gitlab" | "other";
};
/** Commits compared with the upstream as of the last fetch, pull or push. */
export type GitSync = { upstream: string; ahead: number; behind: number };
export type GitSummary = {
  /** null: the branch has no upstream. */
  sync?: GitSync | null;
  root?: string;
  branch?: string;
  /** Changed tracked and untracked files, counting each path once. */
  changedFiles?: number;
  reason?: string;
  operation?: string;
  error?: string;
  /** Web page of the Git remote, without any credentials from its URL. */
  web?: GitRemoteWeb;
};
export type GitFile = {
  path: string;
  originalPath?: string;
  index: string;
  worktree: string;
  staged: boolean;
  unstaged: boolean;
};
export type GitSnapshot = {
  root: string;
  branch: string;
  files: GitFile[];
  token: string;
  sync?: GitSync | null;
};
export type ProjectView = Project & {
  runtime: Runtime;
  git: GitSummary;
};
export type BatchResult = {
  id: string;
  name: string;
  outcome: "Started" | "Stopped" | "Skipped" | "Failed";
  message: string;
};
export type Result<T> = { ok: true; data: T } | { ok: false; error: string };

export type DesktopApi = {
  setLanguage: (language: import("./i18n").Language) => Promise<Result<void>>;
  saveGroup: (input: SaveGroup) => Promise<Result<ProjectGroup>>;
  moveGroup: (input: MoveGroup) => Promise<Result<void>>;
  moveRepository: (input: MoveRepository) => Promise<Result<void>>;
  runGroup: (id: string) => Promise<Result<BatchResult[]>>;
  stopGroup: (id: string) => Promise<Result<BatchResult[]>>;
  ports: () => Promise<Result<PortRecord[]>>;
  systemInfo: () => Promise<Result<SystemInfo>>;
  hosts: () => Promise<Result<HostsInfo>>;
  configFiles: () => Promise<Result<ConfigFileInfo[]>>;
  openConfigFile: (input: {
    repositoryId: string;
    fileName: string;
  }) => Promise<Result<void>>;
  workspace: () => Promise<Result<WorkspaceInfo>>;
  createSet: (name: string) => Promise<Result<WorkspaceInfo>>;
  selectSet: (id: string) => Promise<Result<WorkspaceInfo>>;
  renameSet: (name: string) => Promise<Result<WorkspaceInfo>>;
  exportSet: (appearance: Appearance) => Promise<Result<string | null>>;
  previewImport: () => Promise<Result<ImportPreview | null>>;
  confirmImport: () => Promise<Result<WorkspaceInfo>>;
  cloudStatus: () => Promise<Result<CloudStatus>>;
  configureCloud: (apiUrl: string) => Promise<Result<CloudStatus>>;
  signIn: () => Promise<Result<CloudStatus>>;
  cancelSignIn: () => Promise<Result<void>>;
  signOut: () => Promise<Result<void>>;
  cloudBackups: () => Promise<Result<BackupInfo[]>>;
  backupSet: (appearance: Appearance) => Promise<Result<BackupInfo>>;
  previewRestore: (id: string) => Promise<Result<ImportPreview>>;
  list: () => Promise<Result<ProjectView[]>>;
  saveProject: (value: SaveProject) => Promise<Result<Project>>;
  pickFolder: () => Promise<Result<string | null>>;
  detectFolder: (
    request: DetectFolderRequest,
  ) => Promise<Result<FolderSuggestion>>;
  run: (id: string) => Promise<Result<Runtime>>;
  stop: (id: string) => Promise<Result<Runtime>>;
  runAll: () => Promise<Result<BatchResult[]>>;
  logs: (id: string) => Promise<Result<LogEntry[]>>;
  copyPath: (id: string) => Promise<Result<void>>;
  openTerminal: (id: string) => Promise<Result<void>>;
  openWeb: (id: string) => Promise<Result<void>>;
  openRemote: (id: string) => Promise<Result<void>>;
  shellOpen: (request: ShellOpenRequest) => Promise<Result<ShellSnapshot>>;
  shellWrite: (request: ShellWriteRequest) => Promise<Result<void>>;
  shellResize: (request: ShellResizeRequest) => Promise<Result<void>>;
  onShellEvent: (callback: (event: ShellEvent) => void) => () => void;
  gitStatus: (id: string) => Promise<Result<GitSnapshot>>;
  stage: (request: StageRequest) => Promise<Result<GitSnapshot>>;
  commit: (request: CommitRequest) => Promise<Result<string>>;
  pull: (id: string) => Promise<Result<string>>;
  push: (id: string) => Promise<Result<string>>;
  onChanged: (callback: () => void) => () => void;
};
