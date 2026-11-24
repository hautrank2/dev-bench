import { contextBridge, ipcRenderer } from "electron";

import type { DesktopApi } from "../shared/contracts";

const api: DesktopApi = {
  setLanguage: (language) => ipcRenderer.invoke("settings:language", language),
  saveGroup: (input) => ipcRenderer.invoke("groups:save", input),
  runGroup: (id) => ipcRenderer.invoke("groups:run", id),
  stopGroup: (id) => ipcRenderer.invoke("groups:stop", id),
  ports: () => ipcRenderer.invoke("inspect:ports"),
  systemInfo: () => ipcRenderer.invoke("inspect:system"),
  hosts: () => ipcRenderer.invoke("inspect:hosts"),
  configFiles: () => ipcRenderer.invoke("inspect:config-files"),
  openConfigFile: (input) => ipcRenderer.invoke("inspect:open-config", input),
  workspace: () => ipcRenderer.invoke("workspace:info"),
  createSet: (name) => ipcRenderer.invoke("workspace:create", name),
  selectSet: (id) => ipcRenderer.invoke("workspace:select", id),
  renameSet: (name) => ipcRenderer.invoke("workspace:rename", name),
  exportSet: (appearance) => ipcRenderer.invoke("workspace:export", appearance),
  previewImport: () => ipcRenderer.invoke("workspace:preview-import"),
  confirmImport: () => ipcRenderer.invoke("workspace:import"),
  cloudStatus: () => ipcRenderer.invoke("cloud:status"),
  configureCloud: (url) => ipcRenderer.invoke("cloud:configure", url),
  signIn: () => ipcRenderer.invoke("cloud:sign-in"),
  cancelSignIn: () => ipcRenderer.invoke("cloud:cancel-sign-in"),
  signOut: () => ipcRenderer.invoke("cloud:sign-out"),
  cloudBackups: () => ipcRenderer.invoke("cloud:backups"),
  backupSet: (appearance) => ipcRenderer.invoke("cloud:backup", appearance),
  previewRestore: (id) => ipcRenderer.invoke("cloud:preview-restore", id),
  list: () => ipcRenderer.invoke("projects:list"),
  saveProject: (value) => ipcRenderer.invoke("projects:save", value),
  pickFolder: () => ipcRenderer.invoke("system:pick-folder"),
  run: (id) => ipcRenderer.invoke("process:run", id),
  stop: (id) => ipcRenderer.invoke("process:stop", id),
  runAll: () => ipcRenderer.invoke("process:run-all"),
  logs: (id) => ipcRenderer.invoke("process:logs", id),
  copyPath: (id) => ipcRenderer.invoke("system:copy-path", id),
  openTerminal: (id) => ipcRenderer.invoke("system:terminal", id),
  openWeb: (id) => ipcRenderer.invoke("system:web", id),
  gitStatus: (id) => ipcRenderer.invoke("git:status", id),
  stage: (request) => ipcRenderer.invoke("git:stage", request),
  commit: (request) => ipcRenderer.invoke("git:commit", request),
  pull: (id) => ipcRenderer.invoke("git:pull", id),
  push: (id) => ipcRenderer.invoke("git:push", id),
  onChanged: (callback) => {
    const listener = () => callback();
    ipcRenderer.on("dashboard:changed", listener);
    return () => ipcRenderer.removeListener("dashboard:changed", listener);
  },
};
contextBridge.exposeInMainWorld("desktop", Object.freeze(api));
