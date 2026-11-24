import { z } from "zod";

import { configSchema, projectSchema } from "./contracts";

export const themeSchema = z.enum(["system", "light", "dark"]);
export const terminalThemeSchema = z.enum(["app", "midnight", "paper", "rose"]);
export const appearanceSchema = z.object({
  theme: themeSchema.default("system"),
  terminalTheme: terminalThemeSchema.default("app"),
});
export const setNameSchema = z
  .string()
  .trim()
  .min(1, "Name is required")
  .max(100);
export const groupInputSchema = z.object({
  name: setNameSchema,
  description: z.string().trim().max(500).default(""),
});
export const groupSchema = groupInputSchema.extend({ id: z.uuid() });
export const saveGroupSchema = groupInputSchema.extend({
  id: z.uuid().optional(),
});
export const projectSetSchema = z
  .object({
    id: z.uuid(),
    name: setNameSchema,
    projects: z.array(groupSchema).max(1000),
    repositories: z.array(projectSchema).max(1000),
  })
  .superRefine((value, ctx) => {
    const groups = new Set(value.projects.map((group) => group.id));
    if (
      groups.size !== value.projects.length ||
      value.repositories.some(
        (repo) => !repo.groupId || !groups.has(repo.groupId),
      )
    ) {
      ctx.addIssue({
        code: "custom",
        message: "A repository must belong to a project",
      });
    }
  });
const legacySetSchema = z.object({
  id: z.uuid(),
  name: setNameSchema,
  projects: z.array(projectSchema),
});
export const upgradeLegacySet = (set: z.infer<typeof legacySetSchema>) => {
  const projects = new Map<string, z.infer<typeof groupSchema>>();
  const repositories = set.projects.map((repo) => {
    const groupId = repo.groupId ?? repo.id;
    if (!projects.has(groupId))
      projects.set(groupId, { id: groupId, name: repo.name, description: "" });
    return { ...repo, groupId };
  });
  return {
    id: set.id,
    name: set.name,
    projects: [...projects.values()],
    repositories,
  };
};
export const workspaceSchema = z
  .object({
    version: z.literal(3),
    deviceId: z.uuid(),
    deviceName: setNameSchema,
    activeSetId: z.uuid(),
    sets: z.array(projectSetSchema).min(1).max(100),
  })
  .superRefine((value, ctx) => {
    const setIds = value.sets.map((set) => set.id);
    const repoIds = value.sets.flatMap((set) =>
      set.repositories.map((repo) => repo.id),
    );
    const groupIds = value.sets.flatMap((set) =>
      set.projects.map((group) => group.id),
    );
    if (
      !setIds.includes(value.activeSetId) ||
      new Set(setIds).size !== setIds.length ||
      new Set(repoIds).size !== repoIds.length ||
      new Set(groupIds).size !== groupIds.length
    ) {
      ctx.addIssue({ code: "custom", message: "Invalid workspace IDs" });
    }
  });
export const migrateWorkspace = (
  raw: unknown,
  fallback: Workspace,
): Workspace => {
  const v1 = configSchema.safeParse(raw);
  if (v1.success) {
    const first = fallback.sets[0];
    if (!first) throw new Error("Default project set is missing");
    return {
      ...fallback,
      sets: [
        upgradeLegacySet({
          id: first.id,
          name: first.name,
          projects: v1.data.projects,
        }),
      ],
    };
  }
  const v2 = z
    .object({
      version: z.literal(2),
      deviceId: z.uuid(),
      deviceName: setNameSchema,
      activeSetId: z.uuid(),
      sets: z.array(legacySetSchema),
    })
    .safeParse(raw);
  if (v2.success)
    return workspaceSchema.parse({
      ...v2.data,
      version: 3,
      sets: v2.data.sets.map(upgradeLegacySet),
    });
  return workspaceSchema.parse(raw);
};
const backupFields = {
  kind: z.literal("dev-bench-project-set"),
  exportedAt: z.iso.datetime(),
  sourceDevice: setNameSchema,
  platform: z.enum(["win32", "darwin", "linux", "other"]),
  appearance: appearanceSchema,
};
const legacyBackupSchema = z.object({
  ...backupFields,
  schemaVersion: z.literal(1),
  set: legacySetSchema,
});
const currentBackupSchema = z
  .object({
    ...backupFields,
    schemaVersion: z.literal(2),
    set: projectSetSchema,
  })
  .superRefine((value, ctx) => {
    if (
      new Set(value.set.repositories.map((repo) => repo.id)).size !==
      value.set.repositories.length
    ) {
      ctx.addIssue({
        code: "custom",
        message: "Duplicate repository IDs in backup",
      });
    }
    if (
      new TextEncoder().encode(JSON.stringify(value)).byteLength >
      2 * 1024 * 1024
    ) {
      ctx.addIssue({
        code: "custom",
        message: "Configuration exceeds the 2 MB backup limit",
      });
    }
  });
export const backupSchema = z.preprocess((raw) => {
  const old = legacyBackupSchema.safeParse(raw);
  return old.success
    ? { ...old.data, schemaVersion: 2, set: upgradeLegacySet(old.data.set) }
    : raw;
}, currentBackupSchema);
export const cloudUrlSchema = z
  .string()
  .url()
  .refine((value) => {
    const url = new URL(value);
    return (
      !url.username &&
      !url.password &&
      url.pathname === "/" &&
      (url.protocol === "https:" ||
        (url.protocol === "http:" &&
          ["127.0.0.1", "localhost"].includes(url.hostname)))
    );
  }, "Use an HTTPS API origin, or localhost for development");
export const cloudSettingsSchema = z.object({ apiUrl: cloudUrlSchema });
export const accountSchema = z.object({
  id: z.string(),
  email: z.email(),
  name: z.string(),
});
export const backupInfoSchema = z.object({
  id: z.uuid(),
  name: z.string(),
  sourceDevice: z.string(),
  platform: z.string(),
  projectCount: z.number().int().nonnegative(),
  repositoryCount: z.number().int().nonnegative().default(0),
  createdAt: z.string(),
});
export type Appearance = z.infer<typeof appearanceSchema>;
export type ProjectGroup = z.infer<typeof groupSchema>;
export type SaveGroup = z.infer<typeof saveGroupSchema>;
export type ProjectSet = z.infer<typeof projectSetSchema>;
export type Workspace = z.infer<typeof workspaceSchema>;
export type Backup = z.infer<typeof backupSchema>;
export type Account = z.infer<typeof accountSchema>;
export type BackupInfo = z.infer<typeof backupInfoSchema>;
export type WorkspaceInfo = {
  deviceId: string;
  deviceName: string;
  activeSetId: string;
  groups: ProjectGroup[];
  sets: Array<{
    id: string;
    name: string;
    projectCount: number;
    repositoryCount: number;
  }>;
};
export type CloudStatus = {
  apiUrl: string;
  account: Account | null;
  signingIn: boolean;
};
export type ImportPreview = { snapshot: Backup; missingFolders: string[] };
