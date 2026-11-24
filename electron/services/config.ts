import { randomUUID } from "node:crypto";
import { mkdir, readFile, rename, stat, writeFile } from "node:fs/promises";
import { hostname } from "node:os";
import path from "node:path";

import {
  projectInputSchema,
  type Project,
  type SaveProject,
} from "../../shared/contracts";
import {
  backupSchema,
  migrateWorkspace,
  saveGroupSchema,
  setNameSchema,
  workspaceSchema,
  type Appearance,
  type Backup,
  type Workspace,
  type WorkspaceInfo,
  type SaveGroup,
} from "../../shared/workspace";

export const errorMessage = (error: unknown) =>
  error instanceof Error ? error.message : String(error);

export const assertFolder = async (folder: string) => {
  try {
    if (!(await stat(folder)).isDirectory()) throw new Error("Not a directory");
  } catch (error) {
    throw new Error(
      `Project folder is unavailable: ${folder}\n${errorMessage(error)}`,
    );
  }
};

export class ConfigStore {
  private config: Workspace;
  private queue: Promise<unknown> = Promise.resolve();
  private loadError?: Error;

  constructor(readonly file: string) {
    const setId = randomUUID();
    this.config = {
      version: 3,
      deviceId: randomUUID(),
      deviceName: hostname().slice(0, 100) || "This device",
      activeSetId: setId,
      sets: [
        { id: setId, name: "My projects", projects: [], repositories: [] },
      ],
    };
  }

  async load() {
    try {
      const raw: unknown = JSON.parse(await readFile(this.file, "utf8"));
      const legacy = !workspaceSchema.safeParse(raw).success;
      this.config = migrateWorkspace(raw, this.config);
      if (legacy) {
        await writeFile(
          `${this.file}.legacy.bak`,
          JSON.stringify(raw, null, 2),
          {
            encoding: "utf8",
            flag: "wx",
          },
        ).catch((error: unknown) => {
          if (!(
            error &&
            typeof error === "object" &&
            "code" in error &&
            error.code === "EEXIST"
          ))
            throw error;
        });
        await this.transaction(() => undefined);
      }
    } catch (error) {
      if (
        error &&
        typeof error === "object" &&
        "code" in error &&
        error.code === "ENOENT"
      ) {
        await this.transaction(() => undefined);
        return;
      }
      this.loadError = new Error(
        `Cannot read configuration: ${this.file}\n${errorMessage(error)}\n` +
          "Restore the JSON file or move it aside and restart. It has not been overwritten.",
      );
      throw this.loadError;
    }
  }

  list(): Project[] {
    if (this.loadError) throw this.loadError;
    return structuredClone(this.active().repositories);
  }

  private active() {
    const set = this.config.sets.find(
      (set) => set.id === this.config.activeSetId,
    );
    if (!set) throw new Error("Active project set is missing");
    return set;
  }

  info(): WorkspaceInfo {
    this.list();
    return {
      deviceId: this.config.deviceId,
      deviceName: this.config.deviceName,
      activeSetId: this.config.activeSetId,
      groups: structuredClone(this.active().projects),
      sets: this.config.sets.map((set) => ({
        id: set.id,
        name: set.name,
        projectCount: set.projects.length,
        repositoryCount: set.repositories.length,
      })),
    };
  }

  snapshot(appearance: Appearance): Backup {
    this.list();
    const platform = process.platform;
    return backupSchema.parse({
      kind: "dev-bench-project-set",
      schemaVersion: 2,
      exportedAt: new Date().toISOString(),
      sourceDevice: this.config.deviceName,
      platform: ["win32", "darwin", "linux"].includes(platform)
        ? platform
        : "other",
      set: this.active(),
      appearance,
    });
  }

  private transaction<T>(
    change: (next: Workspace) => T | Promise<T>,
  ): Promise<T> {
    const task = this.queue
      .catch(() => undefined)
      .then(async () => {
        this.list();
        const next = structuredClone(this.config);
        const result = await change(next);
        workspaceSchema.parse(next);
        await mkdir(path.dirname(this.file), { recursive: true });
        const temporary = `${this.file}.${randomUUID()}.tmp`;
        await writeFile(temporary, JSON.stringify(next, null, 2), "utf8");
        await rename(temporary, this.file);
        this.config = next;
        return result;
      });
    this.queue = task;
    return task;
  }

  async createSet(name: string) {
    await this.transaction((next) => {
      const set = {
        id: randomUUID(),
        name: setNameSchema.parse(name),
        projects: [],
        repositories: [],
      };
      next.sets.push(set);
      next.activeSetId = set.id;
    });
    return this.info();
  }

  async selectSet(id: string) {
    await this.transaction((next) => {
      if (!next.sets.some((set) => set.id === id))
        throw new Error("Project set not found");
      next.activeSetId = id;
    });
    return this.info();
  }

  async renameSet(name: string) {
    await this.transaction((next) => {
      const active = next.sets.find((set) => set.id === next.activeSetId);
      if (active) active.name = setNameSchema.parse(name);
    });
    return this.info();
  }

  async importSet(raw: unknown) {
    const snapshot = backupSchema.parse(raw);
    await this.transaction((next) => {
      const set = {
        id: randomUUID(),
        name: `${snapshot.set.name.slice(0, 80)} (imported)`,
        projects: snapshot.set.projects.map((project) => ({
          ...project,
          id: randomUUID(),
        })),
        repositories: [] as Project[],
      };
      const groupIds = new Map(
        snapshot.set.projects.map((project, index) => [
          project.id,
          set.projects[index]?.id,
        ]),
      );
      set.repositories = snapshot.set.repositories.map((repo) => ({
        ...repo,
        id: randomUUID(),
        groupId: groupIds.get(repo.groupId ?? ""),
      }));
      next.sets.push(set);
      next.activeSetId = set.id;
    });
    return this.info();
  }

  get(id: string): Project {
    const project = this.list().find((item) => item.id === id);
    if (!project)
      throw new Error("Project no longer exists. Refresh the dashboard.");
    return project;
  }

  getGroup(id: string) {
    const group = this.info().groups.find((item) => item.id === id);
    if (!group) throw new Error("Project not found");
    return group;
  }

  saveGroup(input: SaveGroup) {
    const values = saveGroupSchema.parse(input);
    return this.transaction((next) => {
      const set = next.sets.find((item) => item.id === next.activeSetId);
      if (!set) throw new Error("Project set not found");
      const group = {
        id: values.id ?? randomUUID(),
        name: values.name,
        description: values.description,
      };
      const index = set.projects.findIndex((item) => item.id === group.id);
      if (values.id && index < 0) throw new Error("Project not found");
      if (index < 0) set.projects.push(group);
      else set.projects[index] = group;
      return group;
    });
  }

  save({ id, input }: SaveProject): Promise<Project> {
    return this.transaction(async (next) => {
      const values = projectInputSchema.parse(input);
      await assertFolder(values.folder);
      if (id) this.get(id);
      const active = next.sets.find((set) => set.id === next.activeSetId);
      if (!active) throw new Error("Active project set is missing");
      let groupId = values.groupId ?? (id ? this.get(id).groupId : undefined);
      if (!groupId) {
        groupId = randomUUID();
        active.projects.push({
          id: groupId,
          name: values.name,
          description: "",
        });
      }
      if (!active.projects.some((group) => group.id === groupId))
        throw new Error("Select a valid project for this repository");
      const project: Project = {
        ...values,
        groupId,
        folder: path.resolve(values.folder),
        id: id ?? randomUUID(),
      };
      const projects = active.repositories.filter(
        (item) => item.id !== project.id,
      );
      const index = active.repositories.findIndex(
        (item) => item.id === project.id,
      );
      projects.splice(index < 0 ? projects.length : index, 0, project);
      active.repositories = projects;
      return structuredClone(project);
    });
  }
}
