import type {
  CommitRequest,
  DesktopApi,
  Result,
  SaveProject,
  StageRequest,
} from "@shared/contracts";
import type { Appearance, SaveGroup } from "@shared/workspace";

const bridge = (): DesktopApi => {
  const api = (window as unknown as { desktop?: DesktopApi }).desktop;
  if (!api)
    throw new Error(
      "Desktop connection unavailable. Launch Dev Bench using pnpm dev or the installed application.",
    );
  return api;
};
export const unwrap = async <T>(promise: Promise<Result<T>>) => {
  const result = await promise;
  if (!result.ok) throw new Error(result.error);
  return result.data;
};
export const projectsApi = {
  saveGroup: (input: SaveGroup) => unwrap(bridge().saveGroup(input)),
  runGroup: (id: string) => unwrap(bridge().runGroup(id)),
  stopGroup: (id: string) => unwrap(bridge().stopGroup(id)),
  ports: () => unwrap(bridge().ports()),
  systemInfo: () => unwrap(bridge().systemInfo()),
  hosts: () => unwrap(bridge().hosts()),
  configFiles: () => unwrap(bridge().configFiles()),
  openConfigFile: (input: { repositoryId: string; fileName: string }) =>
    unwrap(bridge().openConfigFile(input)),
  workspace: () => unwrap(bridge().workspace()),
  createSet: (name: string) => unwrap(bridge().createSet(name)),
  selectSet: (id: string) => unwrap(bridge().selectSet(id)),
  renameSet: (name: string) => unwrap(bridge().renameSet(name)),
  exportSet: (appearance: Appearance) => unwrap(bridge().exportSet(appearance)),
  previewImport: () => unwrap(bridge().previewImport()),
  confirmImport: () => unwrap(bridge().confirmImport()),
  cloudStatus: () => unwrap(bridge().cloudStatus()),
  configureCloud: (url: string) => unwrap(bridge().configureCloud(url)),
  signIn: () => unwrap(bridge().signIn()),
  cancelSignIn: () => unwrap(bridge().cancelSignIn()),
  signOut: () => unwrap(bridge().signOut()),
  cloudBackups: () => unwrap(bridge().cloudBackups()),
  backupSet: (appearance: Appearance) => unwrap(bridge().backupSet(appearance)),
  previewRestore: (id: string) => unwrap(bridge().previewRestore(id)),
  list: () => unwrap(bridge().list()),
  save: (value: SaveProject) => unwrap(bridge().saveProject(value)),
  pickFolder: () => unwrap(bridge().pickFolder()),
  run: (id: string) => unwrap(bridge().run(id)),
  stop: (id: string) => unwrap(bridge().stop(id)),
  runAll: () => unwrap(bridge().runAll()),
  logs: (id: string) => unwrap(bridge().logs(id)),
  copyPath: (id: string) => unwrap(bridge().copyPath(id)),
  terminal: (id: string) => unwrap(bridge().openTerminal(id)),
  web: (id: string) => unwrap(bridge().openWeb(id)),
  git: (id: string) => unwrap(bridge().gitStatus(id)),
  stage: (value: StageRequest) => unwrap(bridge().stage(value)),
  commit: (value: CommitRequest) => unwrap(bridge().commit(value)),
  pull: (id: string) => unwrap(bridge().pull(id)),
  push: (id: string) => unwrap(bridge().push(id)),
  subscribe: (listener: () => void) => bridge().onChanged(listener),
};
