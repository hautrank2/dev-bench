import { build } from "esbuild";
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
  define: electronEnvDefines("production"),
});
