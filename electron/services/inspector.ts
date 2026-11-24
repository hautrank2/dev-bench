import { readFile, realpath, stat } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { z } from "zod";

import type { ProjectView } from "../../shared/contracts";
import type {
  ConfigFileInfo,
  PortRecord,
  SystemInfo,
} from "../../shared/system";
import type { ProjectGroup } from "../../shared/workspace";
import { execute } from "./command";
import { errorMessage } from "./config";

const processSchema = z.object({
  pid: z.number(),
  ppid: z.number(),
  name: z.string(),
});
const listenerSchema = z.object({
  pid: z.number(),
  port: z.number(),
  address: z.string(),
});
export type NetworkSnapshot = {
  processes: z.infer<typeof processSchema>[];
  listeners: z.infer<typeof listenerSchema>[];
};
export const mapPorts = (
  network: NetworkSnapshot,
  repositories: ProjectView[],
  groups: ProjectGroup[],
): PortRecord[] => {
  const parents = new Map(
    network.processes.map((item) => [item.pid, item.ppid]),
  );
  const roots = new Map(
    repositories
      .filter((repo) => repo.runtime.pid)
      .map((repo) => [repo.runtime.pid, repo.id]),
  );
  const owner = (pid: number) => {
    const seen = new Set<number>();
    let current: number | undefined = pid;
    while (current && !seen.has(current)) {
      if (roots.has(current)) return roots.get(current);
      seen.add(current);
      current = parents.get(current);
    }
    return undefined;
  };
  const names = new Map(network.processes.map((item) => [item.pid, item.name]));
  const byPort = new Map<number, PortRecord["listeners"]>();
  for (const listener of network.listeners) {
    const list = byPort.get(listener.port) ?? [];
    if (
      !list.some(
        (item) =>
          item.pid === listener.pid && item.address === listener.address,
      )
    )
      list.push({
        pid: listener.pid,
        address: listener.address,
        ownerRepositoryId: owner(listener.pid),
        processName: names.get(listener.pid) ?? "Unknown",
      });
    byPort.set(listener.port, list);
  }
  const result: PortRecord[] = [];
  const mapped = new Set<string>();
  for (const repo of repositories) {
    const projectName =
      groups.find((group) => group.id === repo.groupId)?.name ?? repo.name;
    let configured: number | undefined;
    try {
      const url = new URL(repo.url);
      if (["localhost", "127.0.0.1", "[::1]"].includes(url.hostname))
        configured = Number(url.port || (url.protocol === "https:" ? 443 : 80));
    } catch {
      /* A repository may have no web endpoint. */
    }
    const owned = [...byPort]
      .filter(([, listeners]) =>
        listeners.some((listener) => listener.ownerRepositoryId === repo.id),
      )
      .map(([port]) => port);
    for (const port of new Set([
      ...(configured ? [configured] : []),
      ...owned,
    ])) {
      const listeners = byPort.get(port) ?? [];
      const own = listeners.some(
        (listener) => listener.ownerRepositoryId === repo.id,
      );
      result.push({
        id: `${repo.id}:${port}`,
        port,
        repositoryId: repo.id,
        groupId: repo.groupId,
        projectName,
        repositoryName: repo.name,
        source: configured === port ? "Configured" : "Detected",
        status: !listeners.length
          ? "Available"
          : own
            ? "Listening"
            : "Conflict",
        listeners,
      });
      for (const listener of listeners) mapped.add(`${port}:${listener.pid}`);
    }
  }
  for (const [port, listeners] of byPort) {
    if (listeners.every((listener) => mapped.has(`${port}:${listener.pid}`)))
      continue;
    result.push({
      id: `system:${port}`,
      port,
      projectName: "System",
      repositoryName: "Unmanaged",
      source: "System",
      status: "Listening",
      listeners,
    });
  }
  return result.sort((left, right) => left.port - right.port);
};

let cache: { time: number; value: NetworkSnapshot } | undefined;
export const readNetwork = async (): Promise<NetworkSnapshot> => {
  if (cache && Date.now() - cache.time < 3000) return cache.value;
  let result: NetworkSnapshot;
  if (process.platform === "win32") {
    const script =
      "$ErrorActionPreference='Stop'; $p=@(Get-CimInstance Win32_Process | ForEach-Object { @{pid=[int]$_.ProcessId;ppid=[int]$_.ParentProcessId;name=$_.Name} }); $l=@(Get-NetTCPConnection -State Listen -ErrorAction Stop | ForEach-Object { @{pid=[int]$_.OwningProcess;port=[int]$_.LocalPort;address=$_.LocalAddress} }); @{processes=$p;listeners=$l} | ConvertTo-Json -Depth 4 -Compress";
    const output = await execute("powershell.exe", [
      "-NoProfile",
      "-NonInteractive",
      "-Command",
      script,
    ]);
    result = z
      .object({
        processes: z.array(processSchema),
        listeners: z.array(listenerSchema),
      })
      .parse(JSON.parse(output));
  } else {
    const [ps, ports] = await Promise.all([
      execute("/bin/ps", ["-axo", "pid=,ppid=,comm="]),
      execute("/usr/sbin/lsof", [
        "-nP",
        "-iTCP",
        "-sTCP:LISTEN",
        "-Fpcn",
      ]).catch((error: unknown) => {
        if (errorMessage(error).includes("code 1")) return "";
        throw error;
      }),
    ]);
    const processes = ps.split(/\r?\n/).flatMap((line) => {
      const match = line.trim().match(/^(\d+)\s+(\d+)\s+(.+)$/);
      return match
        ? [
            {
              pid: Number(match[1]),
              ppid: Number(match[2]),
              name: match[3] ?? "Unknown",
            },
          ]
        : [];
    });
    const listeners: NetworkSnapshot["listeners"] = [];
    let pid = 0;
    for (const line of ports.split(/\r?\n/)) {
      if (line.startsWith("p")) pid = Number(line.slice(1));
      if (line.startsWith("n")) {
        const match = line.slice(1).match(/^(.*):(\d+)$/);
        if (match)
          listeners.push({
            pid,
            address: match[1] ?? "",
            port: Number(match[2]),
          });
      }
    }
    result = { processes, listeners };
  }
  cache = { time: Date.now(), value: result };
  return result;
};

export const inspectSystem = async (): Promise<SystemInfo> => {
  const tools = await Promise.all(
    ["node", "pnpm", "git"].map(async (name) => {
      try {
        const output =
          name === "pnpm" && process.platform === "win32"
            ? await execute(process.env.ComSpec ?? "cmd.exe", [
                "/d",
                "/s",
                "/c",
                "pnpm --version",
              ])
            : await execute(name, ["--version"]);
        return { name, available: true, version: output.trim() };
      } catch (error) {
        return {
          name,
          available: false,
          version: "",
          error: errorMessage(error),
        };
      }
    }),
  );
  return {
    hostname: os.hostname(),
    platform: process.platform,
    arch: process.arch,
    tools,
  };
};
export const readHosts = async () => {
  const file =
    process.platform === "win32"
      ? path.join(
          process.env.SystemRoot ?? "C:\\Windows",
          "System32",
          "drivers",
          "etc",
          "hosts",
        )
      : "/etc/hosts";
  return { file, content: await readFile(file, "utf8") };
};
export const configNames = [
  "package.json",
  "pnpm-workspace.yaml",
  "tsconfig.json",
  "vite.config.ts",
  "next.config.ts",
  "docker-compose.yml",
  "compose.yaml",
  ".env.example",
  "CLAUDE.md",
  "AGENTS.md",
  "README.md",
];
export const findConfigFiles = async (
  repositories: ProjectView[],
): Promise<ConfigFileInfo[]> => {
  const lists = await Promise.all(
    repositories.map(async (repo) => {
      const files = await Promise.all(
        configNames.map(async (fileName) => {
          const file = path.join(repo.folder, fileName);
          try {
            const info = await stat(file);
            const resolved = await realpath(file);
            const root = await realpath(repo.folder);
            const relative = path.relative(root, resolved);
            if (
              !info.isFile() ||
              path.isAbsolute(relative) ||
              relative.startsWith("..")
            )
              return null;
            return {
              repositoryId: repo.id,
              repositoryName: repo.name,
              fileName,
              path: resolved,
              size: info.size,
            };
          } catch {
            return null;
          }
        }),
      );
      return files.filter((file): file is ConfigFileInfo => file !== null);
    }),
  );
  return lists.flat();
};
