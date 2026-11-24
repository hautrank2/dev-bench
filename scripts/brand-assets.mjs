import { copyFile, mkdir } from "node:fs/promises";

export const copyBrandAssets = async () => {
  const destination = new URL("../dist-electron/assets/", import.meta.url);
  await mkdir(destination, { recursive: true });
  await Promise.all(
    ["icon.ico", "icon.png"].map((file) =>
      copyFile(
        new URL(`../build/${file}`, import.meta.url),
        new URL(file, destination),
      ),
    ),
  );
};
