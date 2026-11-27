import { spawn, type IPty } from "node-pty";

import type { Project } from "../../shared/contracts";
import type { ShellEvent, ShellSnapshot } from "../../shared/terminal";
import { assertFolder } from "./config";

type Session = {
  id: number;
  folder: string;
  pty: IPty;
  output: string;
  sequence: number;
  exitCode: number | null;
  /** Set once the user presses Enter, so an untouched shell never blocks Quit. */
  used: boolean;
  exited: Promise<void>;
};
type Size = { cols: number; rows: number };

const OUTPUT_LIMIT = 200_000;

const shellCommand = () => {
  if (process.platform === "win32")
    return { file: "powershell.exe", args: ["-NoLogo"] };
  const file = process.env.SHELL?.startsWith("/")
    ? process.env.SHELL
    : "/bin/zsh";
  return { file, args: ["-l"] };
};

const shellEnvironment = () => {
  const env: NodeJS.ProcessEnv = {
    ...process.env,
    TERM: "xterm-256color",
    COLORTERM: "truecolor",
  };
  // App-only switches must not leak into the tools the user starts.
  delete env.ELECTRON_RUN_AS_NODE;
  delete env.DEV_BENCH_DEV_URL;
  delete env.DEV_BENCH_TEST_USER_DATA;
  delete env.DEV_BENCH_API_ORIGIN;
  return env;
};

/** One interactive shell per repository, kept alive while the app runs. */
export class TerminalManager {
  private sessions = new Map<string, Session>();
  private queues = new Map<string, Promise<unknown>>();
  private count = 0;
  constructor(private emit: (event: ShellEvent) => void = () => undefined) {}

  // Open and close for one repository must not interleave, or a shell leaks.
  private serial<T>(id: string, task: () => Promise<T>): Promise<T> {
    const next = (this.queues.get(id) ?? Promise.resolve())
      .catch(() => undefined)
      .then(task);
    this.queues.set(id, next);
    return next;
  }

  open(
    project: Project,
    options: Size & { restart?: boolean },
  ): Promise<ShellSnapshot> {
    return this.serial(project.id, async () => {
      const existing = this.sessions.get(project.id);
      if (existing) {
        if (!options.restart && existing.folder === project.folder) {
          this.fit(existing, options);
          return this.snapshot(existing, true);
        }
        await this.end(project.id);
      }
      await assertFolder(project.folder);
      return this.snapshot(this.start(project, options), false);
    });
  }

  write(id: string, session: number, data: string) {
    const current = this.live(id, session);
    if (!current) return;
    if (data.includes("\r")) current.used = true;
    current.pty.write(data);
  }

  resize(id: string, session: number, size: Size) {
    const current = this.live(id, session);
    if (current) this.fit(current, size);
  }

  close(id: string) {
    return this.serial(id, () => this.end(id));
  }

  /** Closes the shell of a repository whose folder was changed. */
  async closeIfMoved(project: Project) {
    const session = this.sessions.get(project.id);
    if (session && session.folder !== project.folder)
      await this.close(project.id);
  }

  async closeAll() {
    await Promise.all([...this.queues.keys()].map((id) => this.close(id)));
  }

  usedCount() {
    return [...this.sessions.values()].filter(
      (session) => session.used && session.exitCode === null,
    ).length;
  }

  private live(id: string, session: number) {
    const current = this.sessions.get(id);
    return current?.id === session && current.exitCode === null
      ? current
      : undefined;
  }

  private fit(session: Session, { cols, rows }: Size) {
    if (session.exitCode !== null) return;
    try {
      session.pty.resize(cols, rows);
    } catch {
      // The shell can exit between the check and the resize.
    }
  }

  private snapshot(session: Session, reused: boolean): ShellSnapshot {
    return {
      session: session.id,
      sequence: session.sequence,
      output: session.output,
      exitCode: session.exitCode,
      reused,
    };
  }

  private start(project: Project, { cols, rows }: Size) {
    const { file, args } = shellCommand();
    const pty = spawn(file, args, {
      name: "xterm-256color",
      cols,
      rows,
      cwd: project.folder,
      env: shellEnvironment(),
    });
    let finish: () => void = () => undefined;
    const session: Session = {
      id: ++this.count,
      folder: project.folder,
      pty,
      output: "",
      sequence: 0,
      exitCode: null,
      used: false,
      exited: new Promise<void>((resolve) => {
        finish = resolve;
      }),
    };
    this.sessions.set(project.id, session);
    const current = () => this.sessions.get(project.id) === session;
    pty.onData((data) => {
      session.sequence += 1;
      session.output = (session.output + data).slice(-OUTPUT_LIMIT);
      if (current())
        this.emit({
          type: "data",
          id: project.id,
          session: session.id,
          sequence: session.sequence,
          data,
        });
    });
    pty.onExit(({ exitCode }) => {
      session.exitCode = exitCode ?? 0;
      finish();
      if (current())
        this.emit({
          type: "exit",
          id: project.id,
          session: session.id,
          exitCode: session.exitCode,
        });
    });
    return session;
  }

  private async end(id: string) {
    const session = this.sessions.get(id);
    if (!session) return;
    this.sessions.delete(id);
    if (session.exitCode !== null) return;
    try {
      session.pty.kill();
    } catch {
      // Already gone.
    }
    await Promise.race([
      session.exited,
      new Promise((resolve) => setTimeout(resolve, 3000)),
    ]);
  }
}
