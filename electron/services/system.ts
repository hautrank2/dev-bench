import { spawn } from "node:child_process";

import { assertFolder } from "./config";
import { execute } from "./command";

export const hydrateLoginPath = async () => {
  if (process.platform !== "darwin") return;
  const shell = process.env.SHELL?.startsWith("/")
    ? process.env.SHELL
    : "/bin/zsh";
  const output = await execute(shell, [
    "-l",
    "-c",
    "printf '\\0DEV_BENCH_PATH\\0%s\\0' \"$PATH\"",
  ]).catch(() => "");
  const loginPath = output.split("\0DEV_BENCH_PATH\0")[1]?.split("\0")[0];
  process.env.PATH = [
    ...new Set((loginPath ?? process.env.PATH ?? "").split(":")),
  ]
    .concat(["/opt/homebrew/bin", "/usr/local/bin", "/usr/bin", "/bin"])
    .join(":");
};

const launch = (executable: string, args: string[], cwd: string) =>
  new Promise<void>((resolve, reject) => {
    const child = spawn(executable, args, {
      cwd,
      detached: true,
      stdio: "ignore",
      windowsHide: false,
    });
    child.once("error", reject);
    child.once("spawn", () => {
      child.unref();
      resolve();
    });
  });

export const openTerminal = async (folder: string) => {
  await assertFolder(folder);
  if (process.platform === "darwin") {
    const script = `on run argv
      tell application "Terminal"
        activate
        do script "cd -- " & quoted form of (item 1 of argv)
      end tell
    end run`;
    await execute("/usr/bin/osascript", ["-e", script, folder], folder);
    return;
  }
  if (process.platform !== "win32")
    throw new Error("Open Terminal is supported on Windows and macOS.");
  try {
    await launch("wt.exe", ["-d", folder], folder);
  } catch {
    // Encoded PowerShell avoids interpolating Unicode, quotes or metacharacters.
    const literal = folder.replaceAll("'", "''");
    const command = `Set-Location -LiteralPath '${literal}'`;
    await launch(
      "powershell.exe",
      [
        "-NoExit",
        "-EncodedCommand",
        Buffer.from(command, "utf16le").toString("base64"),
      ],
      folder,
    );
  }
};
