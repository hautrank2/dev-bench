import { spawn } from "node:child_process";

export const execute = (
  executable: string,
  args: string[],
  cwd?: string,
): Promise<string> =>
  new Promise((resolve, reject) => {
    const child = spawn(executable, args, {
      cwd,
      windowsHide: true,
      shell: false,
      env: { ...process.env, GIT_TERMINAL_PROMPT: "0" },
      stdio: ["ignore", "pipe", "pipe"],
    });
    let stdout = "";
    let stderr = "";
    child.stdout.setEncoding("utf8");
    child.stderr.setEncoding("utf8");
    child.stdout.on("data", (data: string) => {
      stdout += data;
    });
    child.stderr.on("data", (data: string) => {
      stderr += data;
    });
    child.on("error", (error) =>
      reject(
        new Error(
          `Cannot start ${executable}. Check that it is installed and on PATH.\n${error.message}`,
        ),
      ),
    );
    child.on("close", (code) => {
      if (code === 0) resolve(stdout || stderr);
      else
        reject(
          new Error(
            `${executable} exited with code ${code}\n${stderr || stdout}`,
          ),
        );
    });
  });
