import { build } from "esbuild";

await build({
  entryPoints: ["server/main.ts"],
  bundle: true,
  platform: "node",
  format: "esm",
  packages: "external",
  outfile: "dist-server/main.mjs",
  target: "node22",
});
