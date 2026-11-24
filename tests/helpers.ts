import { randomUUID } from "node:crypto";
import { mkdir, mkdtemp, writeFile } from "node:fs/promises";
import path from "node:path";

import type { Project } from "../shared/contracts";
import { execute } from "../electron/services/command";

export const fixture = async (name: string) => {
  const root = path.resolve(".test-artifacts");
  await mkdir(root, { recursive: true });
  return mkdtemp(path.join(root, `${name} tiếng Việt `));
};
export const projectAt = (
  folder: string,
  values: Partial<Project> = {},
): Project => ({
  id: randomUUID(),
  name: path.basename(folder),
  folder,
  command: "",
  url: "",
  includeInRunAll: true,
  ...values,
});
export const gitCommand = (folder: string, ...args: string[]) =>
  execute("git", args, folder);
export const initRepo = async (folder: string) => {
  await gitCommand(folder, "init", "-b", "main");
  await gitCommand(folder, "config", "user.email", "test@devbench.local");
  await gitCommand(folder, "config", "user.name", "DevBench Test");
  await gitCommand(folder, "config", "commit.gpgsign", "false");
  await gitCommand(folder, "config", "core.autocrlf", "false");
  await writeFile(path.join(folder, "initial.txt"), "initial\n");
  await gitCommand(folder, "add", "initial.txt");
  await gitCommand(folder, "commit", "-m", "Initial fixture");
};
export const until = async (
  condition: () => boolean | Promise<boolean>,
  timeout = 10000,
) => {
  const deadline = Date.now() + timeout;
  while (Date.now() < deadline) {
    if (await condition()) return;
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
  throw new Error("Timed out waiting for condition");
};
