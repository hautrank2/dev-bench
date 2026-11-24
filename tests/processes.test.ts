import { createServer } from "node:net";
import { writeFile } from "node:fs/promises";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";

import { ProcessManager } from "../electron/services/processes";
import type { Project } from "../shared/contracts";
import { fixture, projectAt, until } from "./helpers";

const portAvailable = (port: number): Promise<boolean> =>
  new Promise((resolve) => {
    const server = createServer();
    server.once("error", () => resolve(false));
    server.listen(port, "127.0.0.1", () => server.close(() => resolve(true)));
  });
const freePort = (): Promise<number> =>
  new Promise((resolve, reject) => {
    const server = createServer();
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      if (!address || typeof address === "string") {
        server.close();
        reject(new Error("No port"));
        return;
      }
      server.close(() => resolve(address.port));
    });
  });

describe("Windows process lifecycle", () => {
  const manager = new ProcessManager();
  const projects: Project[] = [];
  afterEach(async () => {
    await Promise.all(
      projects.map((project) => manager.stop(project).catch(() => undefined)),
    );
  });

  const serverProject = async (name: string) => {
    const folder = await fixture(name);
    const port = await freePort();
    await writeFile(
      path.join(folder, "server.cjs"),
      `
      const http = require('node:http');
      const server = http.createServer((req, res) => res.end('ok'));
      server.listen(${port}, '127.0.0.1', () => console.log('sẵn sàng ${name}'));
      console.error('stderr diagnostic');
    `,
    );
    await writeFile(
      path.join(folder, "parent.cjs"),
      `
      require('node:child_process').spawn(process.execPath, ['server.cjs'], {stdio:'inherit'});
      setInterval(() => {}, 1000);
    `,
    );
    const project = projectAt(folder, {
      command: `"${process.execPath}" parent.cjs`,
    });
    projects.push(project);
    return { project, port };
  };

  it("locks concurrent Run/Run All, isolates failures, kills descendants and frees ports", async () => {
    const first = await serverProject("first");
    const second = await serverProject("second");
    const bad = projectAt(first.project.folder, {
      command: "dev_bench_nonexistent_command_123",
    });
    projects.push(bad);
    const [run, batch] = await Promise.all([
      manager.run(first.project),
      manager.runAll([first.project, second.project, bad]),
    ]);
    expect(run.status).toBe("Running");
    expect(batch.map((item) => item.outcome)).toEqual([
      "Skipped",
      "Started",
      "Failed",
    ]);
    expect(
      manager
        .logs(first.project.id)
        .filter((log) => log.text.includes("Working directory")),
    ).toHaveLength(1);
    await until(
      async () =>
        !(await portAvailable(first.port)) &&
        !(await portAvailable(second.port)),
    );
    expect(
      manager
        .logs(first.project.id)
        .some((log) => log.text.includes("sẵn sàng")),
    ).toBe(true);
    expect(
      manager.logs(first.project.id).some((log) => log.stream === "stderr"),
    ).toBe(true);
    await manager.stop(first.project);
    await until(() => portAvailable(first.port));
    expect(await portAvailable(second.port)).toBe(false);
    expect(manager.runtime(second.project.id).status).toBe("Running");
    await manager.run(first.project);
    await until(async () => !(await portAvailable(first.port)));
    await manager.stop(first.project);
    expect(await portAvailable(first.port)).toBe(true);
  });

  it("handles missing command, moved folder, pnpm shell invocation and natural exit", async () => {
    const folder = await fixture("short-command");
    if (process.platform === "win32") {
      await writeFile(
        path.join(folder, "pnpm-shim.cmd"),
        "@echo off\r\npnpm --version\r\n",
      );
      const shim = projectAt(folder, {
        command: `"${path.join(folder, "pnpm-shim.cmd")}"`,
      });
      projects.push(shim);
      await manager.run(shim);
      await until(() => manager.runtime(shim.id).status === "Stopped");
      expect(
        manager.logs(shim.id).some((entry) => /\d+\.\d+\.\d+/.test(entry.text)),
      ).toBe(true);
    }
    const empty = projectAt(folder);
    await expect(manager.run(empty)).rejects.toThrow("Set Run command");
    const missing = projectAt(path.join(folder, "moved"), {
      command: "pnpm --version",
    });
    await expect(manager.run(missing)).rejects.toThrow("unavailable");
    const pnpm = projectAt(folder, { command: "pnpm --version" });
    projects.push(pnpm);
    await manager.run(pnpm);
    await until(() => manager.runtime(pnpm.id).status === "Stopped");
    expect(
      manager.logs(pnpm.id).some((entry) => /\d+\.\d+\.\d+/.test(entry.text)),
    ).toBe(true);
    const failed = projectAt(folder, {
      command: `"${process.execPath}" -e "process.exit(7)"`,
    });
    projects.push(failed);
    await expect(manager.run(failed)).rejects.toThrow();
    expect(manager.runtime(failed.id).status).toBe("Failed");
  });

  it("reports port conflicts while keeping the first server running", async () => {
    const { project, port } = await serverProject("port-conflict");
    await manager.run(project);
    await until(async () => !(await portAvailable(port)));
    const duplicate = projectAt(project.folder, {
      command: `"${process.execPath}" server.cjs`,
    });
    projects.push(duplicate);
    await expect(manager.run(duplicate)).rejects.toThrow();
    expect(
      manager
        .logs(duplicate.id)
        .some((entry) => entry.text.includes("EADDRINUSE")),
    ).toBe(true);
    expect(manager.runtime(project.id).status).toBe("Running");
  });
});
