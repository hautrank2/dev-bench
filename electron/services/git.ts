import { createHash } from "node:crypto";
import { realpath } from "node:fs/promises";

import type {
  CommitRequest,
  GitFile,
  GitRemoteWeb,
  GitSnapshot,
  GitSummary,
  GitSync,
  Project,
} from "../../shared/contracts";
import { execute } from "./command";
import { assertFolder, errorMessage } from "./config";

const git = (folder: string, args: string[]) =>
  execute("git", ["--no-optional-locks", ...args], folder);

export const parseStatus = (output: string): GitFile[] => {
  const entries = output.split("\0");
  const files: GitFile[] = [];
  for (let index = 0; index < entries.length; index++) {
    const entry = entries[index];
    if (!entry || entry.length < 4) continue;
    const stagedCode = entry[0] ?? " ";
    const worktree = entry[1] ?? " ";
    const renamed = [stagedCode, worktree].some(
      (code) => code === "R" || code === "C",
    );
    files.push({
      path: entry.slice(3),
      originalPath: renamed ? entries[++index] : undefined,
      index: stagedCode,
      worktree,
      staged: stagedCode !== " " && stagedCode !== "?" && stagedCode !== "!",
      unstaged: worktree !== " " && worktree !== "!",
    });
  }
  return files;
};

// SSH-only host names whose web pages live on another host.
const WEB_HOSTS: Record<string, string> = {
  "ssh.github.com": "github.com",
  "altssh.gitlab.com": "gitlab.com",
};
const NO_WEB_PAGE = ["ssh.dev.azure.com", "vs-ssh.visualstudio.com"];

/** Web page of a Git remote written in HTTPS, SSH or scp-like form. */
export const remoteWeb = (remote: string): GitRemoteWeb | undefined => {
  const value = remote.trim();
  const scp = value.includes("://")
    ? null
    : /^(?:[^@/\\:]+@)?([^@/\\:]+):(.+)$/.exec(value);
  let protocol = "https:";
  let port = "";
  let host = scp?.[1] ?? "";
  let repository = scp?.[2] ?? "";
  if (!scp) {
    try {
      const url = new URL(value);
      if (!["https:", "http:", "ssh:", "git:"].includes(url.protocol))
        return undefined;
      // An SSH port says nothing about where the web server listens.
      if (url.protocol === "https:" || url.protocol === "http:") {
        protocol = url.protocol;
        port = url.port && `:${url.port}`;
      }
      host = url.hostname;
      repository = url.pathname;
    } catch {
      return undefined;
    }
  }
  const name = host.toLowerCase();
  const hostname = WEB_HOSTS[name] ?? name;
  // A domain or IPv4 address: SSH aliases and drive letters are neither.
  if (
    !/^(?:(?:[a-z0-9-]+\.)+[a-z]{2,}|(?:\d{1,3}\.){3}\d{1,3})$/.test(
      hostname,
    ) ||
    NO_WEB_PAGE.includes(hostname)
  )
    return undefined;
  const parts = repository
    .replace(/^\/+|\/+$/g, "")
    .replace(/\.git$/i, "")
    .split("/");
  const provider =
    hostname === "github.com"
      ? "github"
      : /(?:^|\.)gitlab\./.test(hostname)
        ? "gitlab"
        : "other";
  if (
    parts.length < 2 ||
    (provider === "github" && parts.length > 2) ||
    !parts.every((part) => /^[\w.~%-]+$/.test(part) && !/^\.+$/.test(part))
  )
    return undefined;
  // Rebuilt from host and path only, so tokens and queries are dropped.
  return {
    provider,
    url: `${protocol}//${hostname}${port}/${parts.join("/")}`,
  };
};

// Windows caps a command line at 32,767 characters, so a large selection is
// added in several calls. The margin covers the executable, flags and quoting.
const MAX_PATHS_LENGTH = 24_000;

export const pathBatches = (paths: string[], limit = MAX_PATHS_LENGTH) => {
  const batches: string[][] = [];
  let batch: string[] = [];
  let length = 0;
  for (const file of paths) {
    const size = file.length + 3;
    if (batch.length && length + size > limit) {
      batches.push(batch);
      batch = [];
      length = 0;
    }
    batch.push(file);
    length += size;
  }
  if (batch.length) batches.push(batch);
  return batches;
};

const explainGitError = (error: unknown) => {
  const text = errorMessage(error);
  if (
    /no tracking information|no upstream|upstream branch.*not stored/i.test(
      text,
    )
  ) {
    return `No upstream configured. Open Terminal and run git push --set-upstream <remote> <branch>.\n${text}`;
  }
  if (/not possible to fast-forward|divergent branches|diverged/i.test(text)) {
    return `Branches have diverged. Resolve the history in Open Terminal; only fast-forward pull is allowed.\n${text}`;
  }
  if (/would be overwritten|local changes|unmerged|conflict/i.test(text)) {
    return `Git refused because of local changes or conflicts. Review them in Open Terminal.\n${text}`;
  }
  if (
    /authentication|permission denied|could not read username|repository not found/i.test(
      text,
    )
  ) {
    return `Git authentication or access failed. Check your Git credentials and remote in Open Terminal.\n${text}`;
  }
  if (/could not resolve|unable to access|failed to connect/i.test(text)) {
    return `Cannot reach the Git remote. Check the network and remote URL.\n${text}`;
  }
  return text;
};

export class GitService {
  private locks = new Map<string, string>();
  private errors = new Map<string, string>();
  constructor(private changed: () => void = () => undefined) {}

  private async location(project: Project) {
    await assertFolder(project.folder);
    const root = (
      await git(project.folder, ["rev-parse", "--show-toplevel"])
    ).trim();
    const directory = (
      await git(project.folder, ["rev-parse", "--absolute-git-dir"])
    ).trim();
    const canonical = await realpath(directory);
    const key =
      process.platform === "win32" ? canonical.toLowerCase() : canonical;
    let branch: string;
    try {
      branch = (
        await git(root, ["symbolic-ref", "--quiet", "--short", "HEAD"])
      ).trim();
    } catch {
      branch = `Detached HEAD (${(await git(root, ["rev-parse", "--short", "HEAD"])).trim()})`;
    }
    return { root, key, branch };
  }

  // Prefers origin, then any other remote that has a web page.
  private async web(root: string) {
    const output = await git(root, ["remote", "-v"]).catch(() => "");
    const remotes = output.split(/\r?\n/).flatMap((line) => {
      const match = /^(\S+)\t(.+) \(fetch\)/.exec(line);
      const web = match?.[2] ? remoteWeb(match[2]) : undefined;
      return match && web ? [{ name: match[1], web }] : [];
    });
    return (remotes.find((item) => item.name === "origin") ?? remotes[0])?.web;
  }

  // Local refs only: DevBench never contacts the remote to read a status.
  private async sync(root: string): Promise<GitSync | null> {
    try {
      const [upstream, counts] = await Promise.all([
        git(root, [
          "rev-parse",
          "--abbrev-ref",
          "--symbolic-full-name",
          "@{upstream}",
        ]),
        git(root, [
          "rev-list",
          "--left-right",
          "--count",
          "@{upstream}...HEAD",
        ]),
      ]);
      const [behind = 0, ahead = 0] = counts.trim().split(/\s+/).map(Number);
      return { upstream: upstream.trim(), ahead, behind };
    } catch {
      return null;
    }
  }

  async summary(project: Project): Promise<GitSummary> {
    try {
      const { root, branch, key } = await this.location(project);
      const [web, status, sync] = await Promise.all([
        this.web(root),
        git(root, ["status", "--porcelain=v1", "-z", "--untracked-files=all"]),
        this.sync(root),
      ]);
      return {
        root,
        branch,
        sync,
        changedFiles: parseStatus(status).length,
        web,
        operation: this.locks.get(key),
        error: this.errors.get(key),
      };
    } catch (error) {
      const text = errorMessage(error);
      return {
        reason: /not a git repository/i.test(text)
          ? "This project is not in a Git repository."
          : text,
      };
    }
  }

  private async snapshotAt(root: string, branch: string): Promise<GitSnapshot> {
    const [status, diff, head, sync] = await Promise.all([
      git(root, ["status", "--porcelain=v1", "-z", "--untracked-files=all"]),
      git(root, [
        "diff",
        "--cached",
        "--binary",
        "--no-ext-diff",
        "--no-textconv",
      ]),
      git(root, ["rev-parse", "--verify", "HEAD"]).catch(() => "unborn"),
      this.sync(root),
    ]);
    const files = parseStatus(status);
    const token = createHash("sha256")
      .update(head)
      .update(diff)
      .update(JSON.stringify(files.filter((file) => file.staged)))
      .digest("hex");
    return { root, branch, files, token, sync };
  }

  async snapshot(project: Project) {
    const { root, branch } = await this.location(project);
    return this.snapshotAt(root, branch);
  }

  private async write<T>(
    project: Project,
    operation: string,
    action: (root: string, branch: string) => Promise<T>,
  ): Promise<T> {
    const { root, key, branch } = await this.location(project);
    if (this.locks.has(key)) {
      throw new Error(
        `${project.name}: ${this.locks.get(key)} is already running on this checkout.`,
      );
    }
    this.locks.set(key, operation);
    this.errors.delete(key);
    this.changed();
    try {
      return await action(root, branch);
    } catch (error) {
      const message = `${project.name}: ${operation} failed\n${explainGitError(error)}`;
      this.errors.set(key, message);
      throw new Error(message);
    } finally {
      this.locks.delete(key);
      this.changed();
    }
  }

  stage(project: Project, paths: string[]) {
    return this.write(project, "Stage", async (root, branch) => {
      const snapshot = await this.snapshotAt(root, branch);
      const allowed = new Set(
        snapshot.files
          .filter((file) => file.unstaged)
          .flatMap((file) => [
            file.path,
            ...(file.originalPath ? [file.originalPath] : []),
          ]),
      );
      if (paths.some((file) => !allowed.has(file))) {
        throw new Error(
          "Selected files changed. Refresh the file list and select them again.",
        );
      }
      for (const batch of pathBatches(paths))
        await git(root, ["--literal-pathspecs", "add", "--", ...batch]);
      return this.snapshotAt(root, branch);
    });
  }

  commit(project: Project, request: CommitRequest) {
    return this.write(project, "Git Commit", async (root, branch) => {
      const snapshot = await this.snapshotAt(root, branch);
      if (snapshot.token !== request.token) {
        throw new Error(
          "Staged files changed outside this dialog. Review the refreshed staged list and confirm again.",
        );
      }
      if (!snapshot.files.some((file) => file.staged))
        throw new Error("No staged files to commit.");
      if (!request.message.trim())
        throw new Error("Commit message is required.");
      return git(root, ["commit", "-m", request.message]);
    });
  }

  pull(project: Project) {
    return this.write(project, "Pull Code", async (root) => {
      await git(root, [
        "rev-parse",
        "--abbrev-ref",
        "--symbolic-full-name",
        "@{upstream}",
      ]).catch(() => {
        throw new Error("No upstream configured for the current branch.");
      });
      return git(root, ["pull", "--ff-only"]);
    });
  }

  push(project: Project) {
    return this.write(project, "Push", async (root) => {
      const branch = (await git(root, ["symbolic-ref", "--quiet", "HEAD"]))
        .trim()
        .replace(/\r?\n/g, "");
      const upstream = (
        await git(root, [
          "for-each-ref",
          "--format=%(upstream:remotename)%00%(upstream:remoteref)",
          branch,
        ])
      ).trim();
      const [remote, ref] = upstream.split("\0");
      if (!remote || !ref?.startsWith("refs/heads/")) {
        throw new Error("No upstream configured for the current branch.");
      }
      return git(root, ["push", "--", remote, `HEAD:${ref}`]);
    });
  }
}
