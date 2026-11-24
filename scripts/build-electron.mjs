import { build } from "esbuild";
import { copyBrandAssets } from "./brand-assets.mjs";

await copyBrandAssets();
await build({
  entryPoints: ["electron/main.ts", "electron/preload.ts"],
  bundle: true,
  platform: "node",
  format: "cjs",
  outdir: "dist-electron",
  outExtension: { ".js": ".cjs" },
  external: ["electron"],
  target: "node22",
  sourcemap: true,
});
