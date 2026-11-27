import { mkdir } from "node:fs/promises";
import path from "node:path";
import { afterAll, describe, expect, it } from "vitest";

import { TerminalManager } from "../electron/services/terminals";
import type { ShellEvent } from "../shared/terminal";
import { fixture, projectAt, until } from "./helpers";

const size = { cols: 100, rows: 30 };
const events: ShellEvent[] = [];
const terminals = new TerminalManager((event) => events.push(event));

const output = (session: number) =>
  events
    .flatMap((event) =>
      event.type === "data" && event.session === session ? [event.data] : [],
    )
    .join("");
const alive = (pid: number) => {
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
};

afterAll(() => terminals.closeAll());

describe("repository terminals", () => {
  it("runs typed commands in the repository folder and keeps the shell", async () => {
    const folder = await fixture("terminal");
    const project = projectAt(folder);
    const first = await terminals.open(project, size);
    expect(first.reused).toBe(false);
    expect(terminals.usedCount()).toBe(0);
    // The marker is computed, so matching it proves the command actually ran.
    terminals.write(
      project.id,
      first.session,
      `node -e "console.log('pid=' + process.pid + ' dir=' + require('path').basename(process.cwd()) + ' sum=' + (40 + 2))"\r`,
    );
    await until(() => output(first.session).includes("sum=42"), 20000);
    expect(output(first.session)).toContain("dir=terminal");
    expect(terminals.usedCount()).toBe(1);

    const again = await terminals.open(project, size);
    expect(again.session).toBe(first.session);
    expect(again.reused).toBe(true);
    expect(again.output).toContain("sum=42");
    await terminals.close(project.id);
    expect(terminals.usedCount()).toBe(0);
  });

  it("stops running commands on close and restarts when the folder moves", async () => {
    const folder = await fixture("terminal-move");
    const project = projectAt(folder);
    const first = await terminals.open(project, size);
    terminals.write(
      project.id,
      first.session,
      `node -e "console.log('child=' + process.pid); setInterval(() => {}, 1000)"\r`,
    );
    await until(() => /child=\d+\D/.test(output(first.session)), 20000);
    const pid = Number(/child=(\d+)/.exec(output(first.session))?.[1]);
    expect(alive(pid)).toBe(true);

    const moved = path.join(folder, "moved");
    await mkdir(moved);
    const second = await terminals.open({ ...project, folder: moved }, size);
    expect(second.session).not.toBe(first.session);
    await until(() => !alive(pid), 15000);
    // Input addressed to the replaced shell is dropped.
    terminals.write(project.id, first.session, "exit\r");
    await terminals.close(project.id);
  });

  it("reports the exit code and offers a fresh shell on restart", async () => {
    const project = projectAt(await fixture("terminal-exit"));
    const first = await terminals.open(project, size);
    terminals.write(project.id, first.session, "exit 3\r");
    await until(
      () =>
        events.some(
          (event) => event.type === "exit" && event.session === first.session,
        ),
      20000,
    );
    expect((await terminals.open(project, size)).exitCode).toBe(3);
    expect(terminals.usedCount()).toBe(0);
    const next = await terminals.open(project, { ...size, restart: true });
    expect(next.session).not.toBe(first.session);
    expect(next.exitCode).toBeNull();
  });

  it("rejects a repository folder that no longer exists", async () => {
    const project = projectAt(
      path.join(await fixture("terminal-missing"), "gone"),
    );
    await expect(terminals.open(project, size)).rejects.toThrow("unavailable");
  });
});
