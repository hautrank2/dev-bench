import type {
  CommitRequest,
  DesktopApi,
  Result,
  SaveProject,
  StageRequest,
} from "@shared/contracts";
import type { DetectFolderRequest } from "@shared/detect";
import type {
  Appearance,
  MoveGroup,
  MoveRepository,
  SaveGroup,
} from "@shared/workspace";

export const bridge = (): DesktopApi => {
  const api = (window as unknown as { desktop?: DesktopApi }).desktop;
  if (!api)
    throw new Error(
      "Desktop connection unavailable. Launch DevBench using pnpm dev or the installed application.",
    );
  return api;
};
export const unwrap = async <T>(promise: Promise<Result<T>>) => {
  const result = await promise;
  if (!result.ok) throw new Error(result.error);
  return result.data;
};
export const projectsApi = {
  setLanguage: (language: import("@shared/i18n").Language) =>
    unwrap(bridge().setLanguage(language)),
  saveGroup: (input: SaveGroup) => unwrap(bridge().saveGroup(input)),
  moveGroup: (input: MoveGroup) => unwrap(bridge().moveGroup(input)),
  moveRepository: (input: MoveRepository) =>
    unwrap(bridge().moveRepository(input)),
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
  list: async () => {
    const repositories = await unwrap(bridge().list());
    return Promise.all(
      repositories.map(async (repo) => {
        if (!repo.git.root || repo.git.changedFiles !== undefined) return repo;
        // A running Electron main process may predate the summary count.
        // Its existing Git snapshot API can still supply the live file list.
        try {
          const snapshot = await unwrap(bridge().gitStatus(repo.id));
          return {
            ...repo,
            git: { ...repo.git, changedFiles: snapshot.files.length },
          };
        } catch (error) {
          return {
            ...repo,
            git: {
              ...repo.git,
              reason: error instanceof Error ? error.message : String(error),
            },
          };
        }
      }),
    );
  },
  save: (value: SaveProject) => unwrap(bridge().saveProject(value)),
  pickFolder: () => unwrap(bridge().pickFolder()),
  detectFolder: (request: DetectFolderRequest) =>
    unwrap(bridge().detectFolder(request)),
  run: (id: string) => unwrap(bridge().run(id)),
  stop: (id: string) => unwrap(bridge().stop(id)),
  runAll: () => unwrap(bridge().runAll()),
  logs: (id: string) => unwrap(bridge().logs(id)),
  copyPath: (id: string) => unwrap(bridge().copyPath(id)),
  terminal: (id: string) => unwrap(bridge().openTerminal(id)),
  web: (id: string) => unwrap(bridge().openWeb(id)),
  remote: (id: string) => unwrap(bridge().openRemote(id)),
  git: (id: string) => unwrap(bridge().gitStatus(id)),
  stage: (value: StageRequest) => unwrap(bridge().stage(value)),
  commit: (value: CommitRequest) => unwrap(bridge().commit(value)),
  pull: (id: string) => unwrap(bridge().pull(id)),
  push: (id: string) => unwrap(bridge().push(id)),
  subscribe: (listener: () => void) => bridge().onChanged(listener),
};
