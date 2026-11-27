import { mkdir, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { describe, expect, it } from "vitest";

import {
  GitService,
  remoteWeb,
  parseStatus,
  pathBatches,
} from "../electron/services/git";
import { fixture, gitCommand, initRepo, projectAt, until } from "./helpers";

describe("Git against isolated real checkouts", () => {
  it("parses NUL-delimited renames and special filenames", () => {
    expect(
      parseStatus('R  tên mới.txt\0tên cũ.txt\0?? quote "x".txt\0'),
    ).toMatchObject([
      { path: "tên mới.txt", originalPath: "tên cũ.txt", staged: true },
      { path: 'quote "x".txt', unstaged: true, staged: false },
    ]);
  });

  it("builds a web page from remotes without keeping credentials", async () => {
    for (const remote of [
      "https://github.com/owner/app.git",
      "https://user:secret@github.com/owner/app",
      "git@github.com:owner/app.git",
      "ssh://git@ssh.github.com:443/owner/app.git",
    ])
      expect(remoteWeb(remote)).toEqual({
        provider: "github",
        url: "https://github.com/owner/app",
      });
    for (const remote of [
      "https://oauth2:secret@gitlab.example.com/team/group/app.git",
      "git@gitlab.example.com:team/group/app.git",
      "ssh://git@gitlab.example.com:2222/team/group/app.git",
    ])
      expect(remoteWeb(remote)).toEqual({
        provider: "gitlab",
        url: "https://gitlab.example.com/team/group/app",
      });
    expect(remoteWeb("http://192.168.1.20:3000/team/app.git")).toEqual({
      provider: "other",
      url: "http://192.168.1.20:3000/team/app",
    });
    for (const remote of [
      "https://github.com/owner",
      "https://github.com/../app",
      "file:///github.com/owner/app",
      "git@github-work:owner/app.git",
      "git@ssh.dev.azure.com:v3/org/project/app",
      "C:/repos/app.git",
      "../repos/app.git",
    ])
      expect(remoteWeb(remote)).toBeUndefined();

    const folder = await fixture("github");
    await initRepo(folder);
    const service = new GitService();
    expect((await service.summary(projectAt(folder))).web).toBeUndefined();
    await gitCommand(
      folder,
      "remote",
      "add",
      "fork",
      "git@github.com:someone/fork.git",
    );
    expect((await service.summary(projectAt(folder))).web?.url).toBe(
      "https://github.com/someone/fork",
    );
    await gitCommand(
      folder,
      "remote",
      "add",
      "origin",
      "https://github.com/owner/app.git",
    );
    expect((await service.summary(projectAt(folder))).web?.url).toBe(
      "https://github.com/owner/app",
    );
  });

  it("commits selected files, respects external staging, review tokens and hooks", async () => {
    const folder = await fixture("commit");
    await initRepo(folder);
    await mkdir(path.join(folder, "packages", "web"), { recursive: true });
    const project = projectAt(path.join(folder, "packages", "web"));
    const service = new GitService();
    const filename = "tiếng Việt & file.txt";
    await writeFile(path.join(folder, filename), "selected\n");
    await writeFile(path.join(folder, "leave.txt"), "do not stage\n");
    const snapshot = await service.stage(project, [filename]);
    expect(snapshot.root.replaceAll("\\", "/")).toBe(
      folder.replaceAll("\\", "/"),
    );
    expect(
      snapshot.files.find((file) => file.path === "leave.txt")?.staged,
    ).toBe(false);
    await writeFile(path.join(folder, "external.txt"), "external\n");
    await gitCommand(folder, "add", "external.txt");
    await expect(
      service.commit(project, {
        id: project.id,
        message: 'Sửa "cấu hình" & kiểm thử',
        token: snapshot.token,
      }),
    ).rejects.toThrow("changed outside");
    const final = await service.snapshot(project);
    expect(final.files.filter((file) => file.staged)).toHaveLength(2);
    await service.commit(project, {
      id: project.id,
      message: 'Sửa "cấu hình" & kiểm thử',
      token: final.token,
    });
    expect((await gitCommand(folder, "log", "-1", "--format=%s")).trim()).toBe(
      'Sửa "cấu hình" & kiểm thử',
    );
    expect(
      await gitCommand(folder, "show", "--format=", "--name-only", "HEAD"),
    ).not.toContain("leave.txt");
    await rename(path.join(folder, filename), path.join(folder, "đổi tên.txt"));
    await service.stage(project, [filename, "đổi tên.txt"]);
    const renamed = await service.snapshot(project);
    expect(renamed.files.some((file) => file.originalPath === filename)).toBe(
      true,
    );
    await writeFile(
      path.join(folder, ".git", "hooks", "pre-commit"),
      "#!/bin/sh\necho hook-refusal >&2\nexit 1\n",
    );
    await expect(
      service.commit(project, {
        id: project.id,
        message: "Keep me",
        token: renamed.token,
      }),
    ).rejects.toThrow("hook-refusal");
    expect(
      (await service.snapshot(project)).files.some((file) => file.staged),
    ).toBe(true);
  });

  it("stages more files than one command line can hold", async () => {
    expect(pathBatches(["aaaa", "bbbb", "cccc"], 14)).toEqual([
      ["aaaa", "bbbb"],
      ["cccc"],
    ]);

    const folder = await fixture("git-many");
    await initRepo(folder);
    // About 40,000 characters of paths, over the Windows limit.
    const files = Array.from(
      { length: 600 },
      (_, index) => `${"long-name-".repeat(6)}${index}.txt`,
    );
    await Promise.all(
      files.map((name) => writeFile(path.join(folder, name), "x\n")),
    );
    const snapshot = await new GitService().stage(projectAt(folder), files);
    expect(snapshot.files.filter((file) => file.staged)).toHaveLength(600);
  });

  it("summarizes staged, unstaged and untracked files once per path, excluding ignored files", async () => {
    const folder = await fixture("git-changes");
    await initRepo(folder);
    const service = new GitService();
    const project = projectAt(folder);
    expect(await service.summary(project)).toMatchObject({ changedFiles: 0 });

    await writeFile(path.join(folder, "initial.txt"), "staged\n");
    await gitCommand(folder, "add", "initial.txt");
    await writeFile(path.join(folder, "initial.txt"), "also unstaged\n");
    await mkdir(path.join(folder, "new files"));
    await writeFile(path.join(folder, "new files", "tệp mới.txt"), "new\n");
    await writeFile(path.join(folder, "new files", "second.txt"), "new\n");
    await writeFile(
      path.join(folder, ".git", "info", "exclude"),
      "ignored.txt\n",
    );
    await writeFile(path.join(folder, "ignored.txt"), "ignored\n");
    expect(await service.summary(project)).toMatchObject({ changedFiles: 3 });
    // Reading the summary must preserve the existing staging area.
    expect(
      (await service.snapshot(project)).files.filter((file) => file.staged),
    ).toHaveLength(1);
  });

  it("summarizes changes on unborn and detached branches", async () => {
    const folder = await fixture("git-unborn");
    await gitCommand(folder, "init", "-b", "main");
    await writeFile(path.join(folder, "new.txt"), "new\n");
    const service = new GitService();
    const project = projectAt(folder);
    const unborn = await service.summary(project);
    expect(unborn).toMatchObject({ branch: "main", changedFiles: 1 });

    await initRepo(folder);
    await gitCommand(folder, "checkout", "--detach", "HEAD");
    const detached = await service.summary(project);
    expect(detached.branch).toContain("Detached HEAD");
    expect(detached.changedFiles).toBe(1);
  });

  it("pulls fast-forward, pushes HEAD to the exact upstream ref, rejects missing upstream and divergence", async () => {
    const root = await fixture("remote");
    const remote = path.join(root, "remote.git");
    const local = path.join(root, "local");
    const peer = path.join(root, "peer");
    await mkdir(local);
    await gitCommand(root, "init", "--bare", remote);
    await initRepo(local);
    await gitCommand(local, "remote", "add", "origin", remote);
    const service = new GitService();
    const project = projectAt(local);
    await expect(service.push(project)).rejects.toThrow("No upstream");
    expect((await service.summary(project)).sync).toBeNull();
    await gitCommand(local, "push", "-u", "origin", "main:shared-target");
    expect((await service.snapshot(project)).sync).toEqual({
      upstream: "origin/shared-target",
      ahead: 0,
      behind: 0,
    });
    await gitCommand(root, "clone", "-b", "shared-target", remote, peer);
    await gitCommand(peer, "config", "user.name", "Peer");
    await gitCommand(peer, "config", "user.email", "peer@devbench.local");
    await gitCommand(peer, "config", "commit.gpgsign", "false");
    await writeFile(path.join(peer, "peer.txt"), "peer\n");
    await gitCommand(peer, "add", "peer.txt");
    await gitCommand(peer, "commit", "-m", "Peer update");
    await gitCommand(peer, "push");
    await service.pull(project);
    expect((await gitCommand(local, "log", "-1", "--format=%s")).trim()).toBe(
      "Peer update",
    );
    await writeFile(path.join(local, "local.txt"), "local\n");
    await gitCommand(local, "add", "local.txt");
    await gitCommand(local, "commit", "-m", "Local update");
    expect((await service.summary(project)).sync).toMatchObject({
      ahead: 1,
      behind: 0,
    });
    await service.push(project);
    expect((await service.summary(project)).sync).toMatchObject({ ahead: 0 });
    expect(
      (
        await gitCommand(
          root,
          "--git-dir",
          remote,
          "rev-parse",
          "refs/heads/shared-target",
        )
      ).trim(),
    ).toBe((await gitCommand(local, "rev-parse", "HEAD")).trim());
    await writeFile(path.join(local, "diverge-local.txt"), "left\n");
    await gitCommand(local, "add", ".");
    await gitCommand(local, "commit", "-m", "Left");
    await writeFile(path.join(peer, "diverge-peer.txt"), "right\n");
    await gitCommand(peer, "pull", "--ff-only");
    await gitCommand(peer, "add", ".");
    await gitCommand(peer, "commit", "-m", "Right");
    await gitCommand(peer, "push");
    await expect(service.pull(project)).rejects.toThrow("diverged");
    // The refused pull still fetched, so both sides are known now.
    expect((await service.summary(project)).sync).toMatchObject({
      ahead: 1,
      behind: 1,
    });
  });

  it("serializes writes for two subprojects in the same checkout", async () => {
    const folder = await fixture("git-lock");
    await initRepo(folder);
    await mkdir(path.join(folder, "sub"));
    await writeFile(path.join(folder, "x.txt"), "new\n");
    await gitCommand(folder, "add", "x.txt");
    await writeFile(
      path.join(folder, ".git", "hooks", "pre-commit"),
      "#!/bin/sh\nsleep 2\n",
    );
    const first = projectAt(folder);
    const second = projectAt(path.join(folder, "sub"));
    const service = new GitService();
    const snapshot = await service.snapshot(first);
    const commit = service.commit(first, {
      id: first.id,
      message: "Slow hook",
      token: snapshot.token,
    });
    await until(async () => !!(await service.summary(second)).operation);
    await expect(service.stage(second, ["x.txt"])).rejects.toThrow(
      "already running",
    );
    await commit;
    expect((await service.summary(second)).operation).toBeUndefined();
  });

  it("disables Git cleanly for a non-repo", async () => {
    const folder = await fixture("no-git");
    expect(
      (await new GitService().summary(projectAt(folder))).reason,
    ).toContain("not in a Git repository");
  });
});
