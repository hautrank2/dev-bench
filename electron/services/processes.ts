import { spawn, type ChildProcess } from "node:child_process";

import type {
  BatchResult,
  LogEntry,
  Project,
  Runtime,
} from "../../shared/contracts";
import { assertFolder, errorMessage } from "./config";
import { execute } from "./command";

type Session = {
  runtime: Runtime;
  child?: ChildProcess;
  logs: LogEntry[];
  sequence: number;
  stopTask?: Promise<Runtime>;
};

export class ProcessManager {
  private sessions = new Map<string, Session>();
  constructor(private changed: () => void = () => undefined) {}

  private session(id: string) {
    let session = this.sessions.get(id);
    if (!session) {
      session = { runtime: { status: "Stopped" }, logs: [], sequence: 0 };
      this.sessions.set(id, session);
    }
    return session;
  }

  runtime(id: string): Runtime {
    return { ...this.session(id).runtime };
  }
  logs(id: string): LogEntry[] {
    return [...this.session(id).logs];
  }

  private log(session: Session, stream: LogEntry["stream"], text: string) {
    // A single oversized stdout chunk must not bypass the bounded buffer.
    session.logs.push({
      sequence: ++session.sequence,
      time: new Date().toISOString(),
      stream,
      text: text.slice(-32000),
    });
    if (session.logs.length > 1500)
      session.logs.splice(0, session.logs.length - 1500);
  }

  async run(project: Project): Promise<Runtime> {
    const session = this.session(project.id);
    if (
      session.child ||
      ["Starting", "Running", "Stopping"].includes(session.runtime.status)
    ) {
      return this.runtime(project.id);
    }
    session.runtime = { status: "Starting" };
    this.changed();
    try {
      if (!project.command)
        throw new Error("Set Run command in Edit Project before running.");
      await assertFolder(project.folder);
      this.log(
        session,
        "system",
        `\n> ${project.command}\nWorking directory: ${project.folder}\n`,
      );
      const windows = process.platform === "win32";
      const child = spawn(project.command, [], {
        shell: windows
          ? (process.env.ComSpec ?? "cmd.exe")
          : (process.env.SHELL ?? "/bin/sh"),
        cwd: project.folder,
        windowsHide: true,
        detached: !windows,
        stdio: ["ignore", "pipe", "pipe"],
        env: { ...process.env, FORCE_COLOR: "0" },
      });
      session.child = child;
      child.stdout.setEncoding("utf8");
      child.stderr.setEncoding("utf8");
      child.stdout.on("data", (data: string) =>
        this.log(session, "stdout", data),
      );
      child.stderr.on("data", (data: string) =>
        this.log(session, "stderr", data),
      );
      child.on("error", (error) => {
        session.runtime = { status: "Failed", error: error.message };
        session.child = undefined;
        this.log(session, "system", error.message);
        this.changed();
      });
      child.on("close", (code, signal) => {
        session.child = undefined;
        this.log(session, "system", `\nProcess exited (${code ?? signal}).\n`);
        if (session.runtime.status !== "Stopping") {
          session.runtime =
            code === 0
              ? { status: "Stopped" }
              : {
                  status: "Failed",
                  error: `Command exited with ${code ?? signal}. See Logs.`,
                };
        }
        this.changed();
      });
      await new Promise<void>((resolve, reject) => {
        child.once("spawn", resolve);
        child.once("error", reject);
      });
      session.runtime = {
        status: "Running",
        pid: child.pid,
        startedAt: new Date().toISOString(),
      };
      this.changed();
      // Capture immediate command-not-found / port-conflict failures for Run All.
      await new Promise((resolve) => setTimeout(resolve, 400));
      if (session.runtime.status === "Failed")
        throw new Error(session.runtime.error);
      return this.runtime(project.id);
    } catch (error) {
      const message = `${project.name}: Run failed\n${errorMessage(error)}`;
      session.runtime = { status: "Failed", error: message };
      this.log(session, "system", message);
      this.changed();
      throw new Error(message);
    }
  }

  stop(project: Project): Promise<Runtime> {
    const session = this.session(project.id);
    if (session.stopTask) return session.stopTask;
    // Run owns Starting until it has either spawned or failed.
    if (session.runtime.status === "Starting") {
      return Promise.reject(
        new Error(`${project.name}: still starting. Try Stop again shortly.`),
      );
    }
    if (!session.child?.pid) return Promise.resolve(this.runtime(project.id));
    const pid = session.child.pid;
    session.runtime = { ...session.runtime, status: "Stopping" };
    this.changed();
    const task = (async () => {
      try {
        if (process.platform === "win32") {
          await execute("taskkill.exe", ["/PID", String(pid), "/T", "/F"]);
        } else {
          process.kill(-pid, "SIGTERM");
        }
        const deadline = Date.now() + 10000;
        while (session.child && Date.now() < deadline) {
          if (process.platform !== "win32" && Date.now() > deadline - 8000) {
            try {
              process.kill(-pid, "SIGKILL");
            } catch (error) {
              if (!(
                error &&
                typeof error === "object" &&
                "code" in error &&
                error.code === "ESRCH"
              ))
                throw error;
            }
          }
          await new Promise((resolve) => setTimeout(resolve, 50));
        }
        if (session.child)
          throw new Error("Process tree did not exit within 10 seconds.");
        session.runtime = { status: "Stopped" };
        this.log(session, "system", "Process tree stopped.\n");
        return this.runtime(project.id);
      } catch (error) {
        const message = `${project.name}: Stop failed\n${errorMessage(error)}`;
        session.runtime = {
          ...session.runtime,
          status: "Failed",
          error: message,
        };
        this.log(session, "system", message);
        throw new Error(message);
      } finally {
        session.stopTask = undefined;
        this.changed();
      }
    })();
    session.stopTask = task;
    return task;
  }

  activeIds() {
    return [...this.sessions]
      .filter(([, value]) => value.child || value.runtime.status === "Starting")
      .map(([id]) => id);
  }

  async runAll(projects: Project[]): Promise<BatchResult[]> {
    return Promise.all(
      projects
        .filter((item) => item.includeInRunAll)
        .map(async (project) => {
          if (
            this.session(project.id).child ||
            ["Starting", "Running", "Stopping"].includes(
              this.runtime(project.id).status,
            )
          ) {
            return {
              id: project.id,
              name: project.name,
              outcome: "Skipped" as const,
              message: "Already active",
            };
          }
          try {
            const runtime = await this.run(project);
            return {
              id: project.id,
              name: project.name,
              outcome: "Started" as const,
              message:
                runtime.status === "Stopped"
                  ? "Command completed"
                  : "Process started",
            };
          } catch (error) {
            return {
              id: project.id,
              name: project.name,
              outcome: "Failed" as const,
              message: errorMessage(error),
            };
          }
        }),
    );
  }
}
