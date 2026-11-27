import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { describe, expect, it } from "vitest";

import { detectFolder } from "../electron/services/detect";
import { fixture } from "./helpers";

const project = async (files: Record<string, string>) => {
  const folder = await fixture("detect");
  for (const [name, content] of Object.entries(files)) {
    await mkdir(path.dirname(path.join(folder, name)), { recursive: true });
    await writeFile(path.join(folder, name), content);
  }
  return folder;
};
const manifest = (scripts: Record<string, string>, extra = {}) =>
  JSON.stringify({ scripts, ...extra });

describe("repository detection", () => {
  it("picks the dev script, package manager and framework port", async () => {
    const folder = await project({
      "package.json": manifest({ build: "vite build", dev: "vite" }),
      "pnpm-lock.yaml": "",
    });
    expect(await detectFolder({ folder })).toEqual({
      command: "pnpm run dev",
      url: "http://localhost:5173",
      source: "package.json",
    });
  });

  it.each([
    ["script flag", { dev: "next dev -p 3005" }, {}, 3005],
    ["long flag", { dev: "vite --port=4000" }, {}, 4000],
    [
      "vite config",
      { dev: "vite" },
      { "vite.config.ts": "export default { server: { port: 8081 } };" },
      8081,
    ],
    [
      "env file",
      { dev: "nest start --watch" },
      { ".env": "SECRET=hidden\nPORT=3003\n" },
      3003,
    ],
    ["framework default", { start: "ng serve" }, {}, 4200],
  ])("reads the port from the %s", async (_label, scripts, files, port) => {
    const folder = await project({
      "package.json": manifest(scripts),
      ...files,
    });
    expect((await detectFolder({ folder })).url).toBe(
      `http://localhost:${port}`,
    );
  });

  it("uses the working directory and a lock file above it", async () => {
    const folder = await project({
      "yarn.lock": "",
      "apps/web/package.json": manifest({ start: "node server.js" }),
    });
    expect(
      await detectFolder({ folder, workingDirectory: "apps/web" }),
    ).toEqual({ command: "yarn start", source: "package.json" });
  });

  it("recognises .NET and Docker Compose folders", async () => {
    const dotnet = await project({
      "Api.csproj": "<Project />",
      "Properties/launchSettings.json": `﻿{"profiles":{"http":{"applicationUrl":"https://localhost:7001;http://0.0.0.0:5001"}}}`,
    });
    expect(await detectFolder({ folder: dotnet })).toEqual({
      command: "dotnet run",
      url: "http://localhost:5001",
      source: "Api.csproj",
    });
    const compose = await project({ "docker-compose.yml": "services: {}" });
    expect(await detectFolder({ folder: compose })).toEqual({
      command: "docker compose up",
      source: "docker-compose.yml",
    });
  });

  it("suggests nothing for missing, relative or unreadable input", async () => {
    const broken = await project({ "package.json": "not json" });
    expect(await detectFolder({ folder: broken })).toEqual({});
    expect(await detectFolder({ folder: "relative/path" })).toEqual({});
    expect(
      await detectFolder({ folder: path.join(broken, "missing") }),
    ).toEqual({});
  });
});
