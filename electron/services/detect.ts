import { readdir, readFile, stat } from "node:fs/promises";
import path from "node:path";

import type {
  DetectFolderRequest,
  FolderSuggestion,
} from "../../shared/detect";
import { runDirectory } from "./repository-directory";

const SIZE_LIMIT = 256 * 1024;
const RUN_SCRIPTS = ["dev", "start:dev", "develop", "start", "serve"];
const LOCK_FILES = [
  ["pnpm-lock.yaml", "pnpm"],
  ["yarn.lock", "yarn"],
  ["bun.lock", "bun"],
  ["bun.lockb", "bun"],
  ["package-lock.json", "npm"],
] as const;
// Matched against the run script, with the port each tool uses by default.
const FRAMEWORKS: [RegExp, number][] = [
  [/\bnext\s+(dev|start)\b/, 3000],
  [/\bnuxi?\s+(dev|start|preview)\b/, 3000],
  [/\breact-scripts\s+start\b/, 3000],
  [/\bnest\s+start\b/, 3000],
  [/\bng\s+serve\b/, 4200],
  [/\bastro\s+(dev|start)\b/, 4321],
  [/\bvue-cli-service\s+serve\b/, 8080],
  [/\bwebpack(-dev-server|\s+serve)\b/, 8080],
  [/\bgatsby\s+develop\b/, 8000],
  [/\bparcel\b/, 1234],
];
const VITE = /\bvite(?!\s+build)\b|\bremix\s+vite:dev\b/;

const read = async (file: string) => {
  try {
    const info = await stat(file);
    if (!info.isFile() || info.size > SIZE_LIMIT) return undefined;
    return (await readFile(file, "utf8")).replace(/^﻿/, "");
  } catch {
    return undefined;
  }
};
const exists = (file: string) =>
  stat(file).then(
    () => true,
    () => false,
  );
const record = (value: unknown): Record<string, unknown> =>
  value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
const localUrl = (port: number | undefined) =>
  port && port > 0 && port < 65536 ? `http://localhost:${port}` : undefined;
const portIn = (text: string | undefined, pattern: RegExp) => {
  const value = text ? pattern.exec(text)?.[1] : undefined;
  return value ? Number(value) : undefined;
};

// The lock file may sit above a monorepo package, but never above its checkout.
const packageManager = async (directory: string, declared: unknown) => {
  const named =
    typeof declared === "string"
      ? /^(pnpm|yarn|bun|npm)@/.exec(declared)?.[1]
      : undefined;
  if (named) return named;
  let current = directory;
  for (let depth = 0; depth < 5; depth++) {
    for (const [file, manager] of LOCK_FILES)
      if (await exists(path.join(current, file))) return manager;
    const parent = path.dirname(current);
    if (parent === current || (await exists(path.join(current, ".git")))) break;
    current = parent;
  }
  return "npm";
};

// Only the PORT number leaves this function; no other value is kept.
const environmentPort = async (directory: string) => {
  for (const file of [
    ".env.development.local",
    ".env.local",
    ".env.development",
    ".env",
    ".env.example",
  ]) {
    const port = portIn(
      await read(path.join(directory, file)),
      /^[ \t]*(?:export[ \t]+)?PORT[ \t]*=[ \t]*["']?(\d{2,5})\b/m,
    );
    if (port) return port;
  }
  return undefined;
};

const viteConfigPort = async (directory: string) => {
  for (const extension of ["ts", "js", "mjs", "mts"]) {
    const port = portIn(
      await read(path.join(directory, `vite.config.${extension}`)),
      /\bserver\s*:\s*\{[^}]*?\bport\s*:\s*(\d{2,5})\b/,
    );
    if (port) return port;
  }
  return undefined;
};

const fromPackage = async (
  directory: string,
): Promise<FolderSuggestion | undefined> => {
  const text = await read(path.join(directory, "package.json"));
  if (!text) return undefined;
  let manifest: Record<string, unknown>;
  try {
    manifest = record(JSON.parse(text));
  } catch {
    return undefined;
  }
  const scripts = record(manifest.scripts);
  const name = RUN_SCRIPTS.find((key) => typeof scripts[key] === "string");
  if (!name) return undefined;
  const script = String(scripts[name]);
  const manager = await packageManager(directory, manifest.packageManager);
  const command =
    manager === "yarn" ? `yarn ${name}` : `${manager} run ${name}`;
  const flag = portIn(
    script,
    /(?:--port[= ]|(?:^|\s)-p\s+(?=\d{4})|\bPORT=)(\d{2,5})\b/,
  );
  let port = flag;
  if (!port && VITE.test(script))
    port = (await viteConfigPort(directory)) ?? 5173;
  if (!port) {
    const standard = FRAMEWORKS.find(([pattern]) => pattern.test(script))?.[1];
    port = (await environmentPort(directory)) ?? standard;
  }
  return { command, url: localUrl(port), source: "package.json" };
};

const fromDotnet = async (
  directory: string,
): Promise<FolderSuggestion | undefined> => {
  const files = await readdir(directory).catch(() => []);
  const project = files.find((file) => /\.(cs|fs)proj$/i.test(file));
  if (!project) return undefined;
  const settings = await read(
    path.join(directory, "Properties", "launchSettings.json"),
  );
  const addresses = [
    ...(settings ?? "").matchAll(/"applicationUrl"\s*:\s*"([^"]+)"/g),
  ].flatMap((match) => match[1]?.split(";") ?? []);
  const address =
    addresses.find((item) => item.startsWith("http://")) ?? addresses[0];
  const match = /^(https?):\/\/[^/:]+:(\d{2,5})/.exec(address ?? "");
  return {
    command: "dotnet run",
    url: match ? `${match[1]}://localhost:${match[2]}` : undefined,
    source: project,
  };
};

const fromCompose = async (
  directory: string,
): Promise<FolderSuggestion | undefined> => {
  for (const file of [
    "compose.yaml",
    "compose.yml",
    "docker-compose.yml",
    "docker-compose.yaml",
  ])
    if (await exists(path.join(directory, file)))
      return { command: "docker compose up", source: file };
  return undefined;
};

/** Guesses how to run a folder by reading its files; nothing is executed. */
export const detectFolder = async (
  request: DetectFolderRequest,
): Promise<FolderSuggestion> => {
  if (!path.isAbsolute(request.folder)) return {};
  const directory = runDirectory(request);
  return (
    (await fromPackage(directory)) ??
    (await fromDotnet(directory)) ??
    (await fromCompose(directory)) ??
    {}
  );
};
