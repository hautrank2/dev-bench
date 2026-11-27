import { chmod } from "node:fs/promises";

// node-pty ships its macOS helper without the executable bit, and spawning a
// shell fails without it. Other platforms need nothing.
export const allowPtyHelper = async () => {
  if (process.platform !== "darwin") return;
  await Promise.all(
    ["darwin-arm64", "darwin-x64"].map((target) =>
      chmod(
        new URL(
          `../node_modules/node-pty/prebuilds/${target}/spawn-helper`,
          import.meta.url,
        ),
        0o755,
      ).catch(() => undefined),
    ),
  );
};
