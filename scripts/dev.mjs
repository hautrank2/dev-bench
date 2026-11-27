import { build } from "esbuild";
import { createServer } from "vite";
import { spawn } from "node:child_process";
import electron from "electron";
import { copyBrandAssets } from "./brand-assets.mjs";
import { electronEnvDefines } from "./electron-env.mjs";
import { allowPtyHelper } from "./pty-permissions.mjs";

await copyBrandAssets();
await allowPtyHelper();
await build({
  entryPoints: ["electron/main.ts", "electron/preload.ts"],
  bundle: true,
  platform: "node",
  format: "cjs",
  outdir: "dist-electron",
  outExtension: { ".js": ".cjs" },
  external: ["electron", "node-pty"],
  target: "node22",
  sourcemap: true,
  define: electronEnvDefines("development"),
});
const server = await createServer();
await server.listen();
const env = { ...process.env, DEV_BENCH_DEV_URL: "http://127.0.0.1:5173" };
delete env.ELECTRON_RUN_AS_NODE;
const child = spawn(electron, ["."], { stdio: "inherit", env });
child.on("exit", async (code) => {
  await server.close();
  process.exit(code ?? 0);
});
process.on("SIGINT", () => child.kill());
