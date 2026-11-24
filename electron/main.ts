import {
  app,
  BrowserWindow,
  clipboard,
  dialog,
  ipcMain,
  shell,
  type IpcMainInvokeEvent,
} from "electron";
import { cpSync, existsSync } from "node:fs";
import path from "node:path";
import { readFile, stat, writeFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";
import { z } from "zod";

import {
  commitSchema,
  idSchema,
  saveSchema,
  stageSchema,
  type Result,
} from "../shared/contracts";
import { ConfigStore, assertFolder, errorMessage } from "./services/config";
import { CloudService } from "./services/cloud";
import { LocaleService } from "./services/locale";
import {
  appearanceSchema,
  backupSchema,
  cloudUrlSchema,
  setNameSchema,
  saveGroupSchema,
  type Backup,
  type ImportPreview,
} from "../shared/workspace";
import { GitService } from "./services/git";
import { ProcessManager } from "./services/processes";
import { hydrateLoginPath, openTerminal } from "./services/system";
import {
  findConfigFiles,
  inspectSystem,
  mapPorts,
  readHosts,
  readNetwork,
} from "./services/inspector";

let window: BrowserWindow | null = null;
let quitting = false;
let closing = false;
let changedTimer: ReturnType<typeof setTimeout> | undefined;
const changed = () => {
  if (changedTimer) return;
  changedTimer = setTimeout(() => {
    changedTimer = undefined;
    if (window && !window.isDestroyed())
      window.webContents.send("dashboard:changed");
  }, 100);
};
const processes = new ProcessManager(changed);
const git = new GitService(changed);
let store: ConfigStore;
let cloud: CloudService;
let locale: LocaleService;
const nativeT = (message: string) => locale?.t(message) ?? message;
let pendingImport: ImportPreview | null = null;
let workspaceChanging = false;
app.setName("DevBench");
const devUrl =
  !app.isPackaged && process.env.DEV_BENCH_DEV_URL === "http://127.0.0.1:5173"
    ? process.env.DEV_BENCH_DEV_URL
    : undefined;
const rendererFile = path.join(__dirname, "../dist/index.html");

const trusted = (event: IpcMainInvokeEvent) => {
  if (
    !window ||
    event.sender !== window.webContents ||
    event.senderFrame !== window.webContents.mainFrame
  )
    return false;
  const url = event.senderFrame?.url ?? "";
  return devUrl
    ? url.startsWith(`${devUrl}/`)
    : url.split("#")[0] === pathToFileURL(rendererFile).href;
};

const handle = <S extends z.ZodType, T>(
  channel: string,
  schema: S,
  action: (payload: z.infer<S>) => Promise<T> | T,
) => {
  ipcMain.handle(
    channel,
    async (event, payload: unknown): Promise<Result<T>> => {
      try {
        if (!trusted(event)) throw new Error("Untrusted IPC sender");
        if (
          closing &&
          [
            "process:run",
            "process:run-all",
            "groups:run",
            "projects:save",
            "workspace:select",
            "workspace:create",
            "workspace:import",
          ].includes(channel)
        ) {
          throw new Error(
            "The app is preparing to close. Cancel closing before starting new work.",
          );
        }
        if (
          workspaceChanging &&
          [
            "process:run",
            "process:run-all",
            "groups:run",
            "projects:save",
            "groups:save",
          ].includes(channel)
        ) {
          throw new Error("Project set is changing. Try again shortly.");
        }
        const data = await action(schema.parse(payload));
        return { ok: true, data };
      } catch (error) {
        return { ok: false, error: errorMessage(error) };
      }
    },
  );
};

const registerActions = () => {
  handle("settings:language", z.enum(["en", "vi"]), (language) =>
    locale.setLanguage(language),
  );
  const repositoryViews = async () =>
    Promise.all(
      store.list().map(async (repo) => ({
        ...repo,
        runtime: processes.runtime(repo.id),
        git: await git.summary(repo),
      })),
    );
  handle("inspect:ports", z.undefined(), async () =>
    mapPorts(await readNetwork(), await repositoryViews(), store.info().groups),
  );
  handle("inspect:system", z.undefined(), inspectSystem);
  handle("inspect:hosts", z.undefined(), readHosts);
  handle("inspect:config-files", z.undefined(), async () =>
    findConfigFiles(await repositoryViews()),
  );
  handle(
    "inspect:open-config",
    z.object({ repositoryId: idSchema, fileName: z.string() }),
    async (input) => {
      const files = await findConfigFiles(
        (await repositoryViews()).filter(
          (repo) => repo.id === input.repositoryId,
        ),
      );
      const file = files.find((item) => item.fileName === input.fileName);
      if (!file) throw new Error("Configuration file is not available.");
      const error = await shell.openPath(file.path);
      if (error) throw new Error(error);
    },
  );
  const changeWorkspace = async (action: () => Promise<unknown>) => {
    if (workspaceChanging)
      throw new Error("A project set change is already in progress.");
    if (processes.activeIds().length)
      throw new Error(
        "Stop your running projects before changing project sets.",
      );
    workspaceChanging = true;
    try {
      await action();
      changed();
      return store.info();
    } finally {
      workspaceChanging = false;
    }
  };
  const preview = async (snapshot: Backup): Promise<ImportPreview> => {
    const checks = await Promise.all(
      snapshot.set.repositories.map(async (project) => {
        try {
          await assertFolder(project.folder);
          return null;
        } catch {
          return project.folder;
        }
      }),
    );
    pendingImport = {
      snapshot,
      missingFolders: checks.filter(
        (folder): folder is string => folder !== null,
      ),
    };
    return pendingImport;
  };
  handle("workspace:info", z.undefined(), () => store.info());
  handle("groups:save", saveGroupSchema, async (input) => {
    const group = await store.saveGroup(input);
    changed();
    return group;
  });
  handle("groups:run", idSchema, (id) => {
    store.getGroup(id);
    return processes.runAll(
      store
        .list()
        .filter((repo) => repo.groupId === id)
        .map((repo) => ({ ...repo, includeInRunAll: true })),
    );
  });
  handle("groups:stop", idSchema, async (id) => {
    store.getGroup(id);
    return Promise.all(
      store
        .list()
        .filter((repo) => repo.groupId === id)
        .map(async (repo) => {
          try {
            await processes.stop(repo);
            return {
              id: repo.id,
              name: repo.name,
              outcome: "Stopped" as const,
              message: "Process stopped",
            };
          } catch (error) {
            return {
              id: repo.id,
              name: repo.name,
              outcome: "Failed" as const,
              message: errorMessage(error),
            };
          }
        }),
    );
  });
  handle("workspace:create", setNameSchema, (name) =>
    changeWorkspace(() => store.createSet(name)),
  );
  handle("workspace:select", idSchema, (id) =>
    changeWorkspace(() => store.selectSet(id)),
  );
  handle("workspace:rename", setNameSchema, async (name) => {
    const info = await store.renameSet(name);
    changed();
    return info;
  });
  handle("workspace:export", appearanceSchema, async (appearance) => {
    const snapshot = store.snapshot(appearance);
    const result = await dialog.showSaveDialog({
      title: nativeT("Export project set"),
      defaultPath: "dev-bench-project-set.json",
      filters: [{ name: nativeT("JSON configuration"), extensions: ["json"] }],
    });
    if (result.canceled || !result.filePath) return null;
    await writeFile(result.filePath, JSON.stringify(snapshot, null, 2), "utf8");
    return result.filePath;
  });
  handle("workspace:preview-import", z.undefined(), async () => {
    const result = await dialog.showOpenDialog({
      title: nativeT("Import project set"),
      properties: ["openFile"],
      filters: [{ name: nativeT("JSON configuration"), extensions: ["json"] }],
    });
    if (result.canceled || !result.filePaths[0]) return null;
    if ((await stat(result.filePaths[0])).size > 2 * 1024 * 1024)
      throw new Error("Configuration file must be smaller than 2 MB.");
    const snapshot = backupSchema.parse(
      JSON.parse(await readFile(result.filePaths[0], "utf8")),
    );
    return preview(snapshot);
  });
  handle("workspace:import", z.undefined(), () =>
    changeWorkspace(async () => {
      if (!pendingImport)
        throw new Error("Choose a configuration to import first.");
      await store.importSet(pendingImport.snapshot);
      pendingImport = null;
    }),
  );
  handle("cloud:status", z.undefined(), () => cloud.status());
  handle("cloud:configure", cloudUrlSchema, (url) => cloud.configure(url));
  handle("cloud:sign-in", z.undefined(), () => cloud.signIn(store.info()));
  handle("cloud:cancel-sign-in", z.undefined(), () => cloud.cancelSignIn());
  handle("cloud:sign-out", z.undefined(), () => cloud.signOut());
  handle("cloud:backups", z.undefined(), () => cloud.listBackups());
  handle("cloud:backup", appearanceSchema, (appearance) =>
    cloud.backup(store.snapshot(appearance)),
  );
  handle("cloud:preview-restore", idSchema, async (id) =>
    preview(await cloud.restore(id)),
  );
  handle("projects:list", z.undefined(), async () =>
    Promise.all(
      store.list().map(async (project) => ({
        ...project,
        runtime: processes.runtime(project.id),
        git: await git.summary(project),
      })),
    ),
  );
  handle("projects:save", saveSchema, async (payload) => {
    if (payload.id && processes.activeIds().includes(payload.id)) {
      const previous = store.get(payload.id);
      if (
        previous.folder !== path.resolve(payload.input.folder) ||
        previous.command !== payload.input.command
      ) {
        throw new Error(
          "Stop this project before changing its folder or run command.",
        );
      }
    }
    const project = await store.save(payload);
    changed();
    return project;
  });
  handle("system:pick-folder", z.undefined(), async () => {
    const result = await dialog.showOpenDialog({
      properties: ["openDirectory"],
    });
    return result.canceled ? null : (result.filePaths[0] ?? null);
  });
  handle("process:run", idSchema, (id) => processes.run(store.get(id)));
  handle("process:stop", idSchema, (id) => processes.stop(store.get(id)));
  handle("process:run-all", z.undefined(), () =>
    processes.runAll(store.list()),
  );
  handle("process:logs", idSchema, (id) => {
    store.get(id);
    return processes.logs(id);
  });
  handle("system:copy-path", idSchema, (id) =>
    clipboard.writeText(store.get(id).folder),
  );
  handle("system:terminal", idSchema, (id) =>
    openTerminal(store.get(id).folder),
  );
  handle("system:web", idSchema, async (id) => {
    const project = store.get(id);
    if (!project.url)
      throw new Error(`${project.name}: Set Web URL in Edit Project.`);
    await shell.openExternal(project.url);
  });
  handle("git:status", idSchema, (id) => git.snapshot(store.get(id)));
  handle("git:stage", stageSchema, (value) =>
    git.stage(store.get(value.id), value.paths),
  );
  handle("git:commit", commitSchema, (value) =>
    git.commit(store.get(value.id), value),
  );
  handle("git:pull", idSchema, (id) => git.pull(store.get(id)));
  handle("git:push", idSchema, (id) => git.push(store.get(id)));
};

const requestQuit = async () => {
  if (closing) return;
  closing = true;
  try {
    const ids = processes.activeIds();
    if (ids.length) {
      const { response } = await dialog.showMessageBox({
        type: "question",
        title: nativeT("Projects are still running"),
        message: nativeT("Stop all dashboard processes and quit?"),
        detail: nativeT(
          "Processes started outside DevBench will keep running.",
        ),
        buttons: [nativeT("Stop All and Quit"), nativeT("Cancel")],
        defaultId: 1,
        cancelId: 1,
      });
      if (response !== 0) return;
      // A pending Run owns Starting until it resolves; wait before stopping it.
      const deadline = Date.now() + 10000;
      while (
        ids.some((id) => processes.runtime(id).status === "Starting") &&
        Date.now() < deadline
      ) {
        await new Promise((resolve) => setTimeout(resolve, 50));
      }
      const results = await Promise.allSettled(
        ids.map((id) => processes.stop(store.get(id))),
      );
      const errors = results.filter((result) => result.status === "rejected");
      if (errors.length || processes.activeIds().length) {
        dialog.showErrorBox(
          nativeT("Could not stop all projects"),
          errors
            .map((result) =>
              result.status === "rejected" ? errorMessage(result.reason) : "",
            )
            .join("\n"),
        );
        return;
      }
    }
    quitting = true;
    cloud?.cancelSignIn();
    app.quit();
  } finally {
    closing = false;
  }
};

// Isolate automated app runs from the user's normal saved projects.
if (process.env.DEV_BENCH_TEST_USER_DATA) {
  app.setPath("userData", process.env.DEV_BENCH_TEST_USER_DATA);
} else {
  const directory = path.join(app.getPath("appData"), "DevBench");
  const legacyDirectory = path.join(app.getPath("appData"), "Dev Bench");
  // Preserve projects, cloud sessions and UI preferences from the old name.
  if (!existsSync(directory) && existsSync(legacyDirectory)) {
    cpSync(legacyDirectory, directory, {
      recursive: true,
      errorOnExist: true,
      force: false,
    });
  }
  app.setPath("userData", directory);
}
if (!app.requestSingleInstanceLock()) app.quit();
else {
  app.on("second-instance", () => {
    window?.restore();
    window?.focus();
  });
  app
    .whenReady()
    .then(async () => {
      await hydrateLoginPath();
      app.setAppUserModelId("com.devbench.desktop");
      locale = new LocaleService(app.getPath("userData"));
      await locale.load();
      store = new ConfigStore(
        path.join(app.getPath("userData"), "projects.json"),
      );
      await store
        .load()
        .catch((error: unknown) =>
          dialog.showErrorBox(
            nativeT("Configuration error"),
            nativeT(errorMessage(error)),
          ),
        );
      cloud = new CloudService(app.getPath("userData"), changed);
      await cloud
        .load()
        .catch((error: unknown) =>
          dialog.showErrorBox(
            nativeT("Cloud configuration error"),
            nativeT(errorMessage(error)),
          ),
        );
      registerActions();
      window = new BrowserWindow({
        width: 1280,
        height: 840,
        minWidth: 720,
        minHeight: 480,
        title: "DevBench",
        icon: path.join(
          __dirname,
          "assets",
          process.platform === "win32" ? "icon.ico" : "icon.png",
        ),
        autoHideMenuBar: true,
        webPreferences: {
          preload: path.join(__dirname, "preload.cjs"),
          contextIsolation: true,
          nodeIntegration: false,
          sandbox: true,
        },
      });
      window.webContents.setWindowOpenHandler(() => ({ action: "deny" }));
      window.webContents.on("will-navigate", (event) => event.preventDefault());
      window.webContents.session.setPermissionRequestHandler(
        (_contents, _permission, callback) => callback(false),
      );
      window.on("close", (event) => {
        if (!quitting) {
          event.preventDefault();
          void requestQuit();
        }
      });
      if (devUrl) await window.loadURL(devUrl);
      else await window.loadFile(rendererFile);
    })
    .catch((error: unknown) => {
      dialog.showErrorBox(
        nativeT("DevBench failed to start"),
        nativeT(errorMessage(error)),
      );
      app.quit();
    });
  app.on("before-quit", (event) => {
    if (!quitting && window && !window.isDestroyed()) {
      event.preventDefault();
      void requestQuit();
    }
  });
  app.on("window-all-closed", () => app.quit());
}
