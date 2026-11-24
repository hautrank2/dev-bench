import { mkdir, readFile, writeFile } from "node:fs/promises";
import { chromium } from "playwright";

// Keep one vector source. Render at each Windows icon size for sharp small glyphs.
let browser;
for (const channel of [undefined, "msedge", "chrome"]) {
  try {
    browser = await chromium.launch({
      headless: true,
      ...(channel ? { channel } : {}),
    });
    break;
  } catch {
    // Prefer Playwright Chromium; use an installed browser on Windows if available.
  }
}
if (!browser)
  throw new Error(
    "Install a browser first: pnpm exec playwright install chromium",
  );

try {
  const svg = await readFile(
    new URL("../src/assets/dev-bench.svg", import.meta.url),
    "utf8",
  );
  const page = await browser.newPage({
    viewport: { width: 512, height: 512 },
    deviceScaleFactor: 1,
  });
  await page.setContent(
    `<html><body style="margin:0;background:transparent;overflow:hidden"><img style="display:block;width:100vw;height:100vh" src="data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}"></body></html>`,
  );
  await page.locator("img").evaluate((image) => image.decode());
  const output = new URL("../build/", import.meta.url);
  await mkdir(output, { recursive: true });
  const png = await page.screenshot({ omitBackground: true });
  if (png.length < 2000) throw new Error("Logo rendering appears empty");
  await writeFile(new URL("icon.png", output), png);

  const sizes = [16, 20, 24, 32, 40, 48, 64, 128, 256];
  const frames = [];
  for (const size of sizes) {
    await page.setViewportSize({ width: size, height: size });
    frames.push(await page.screenshot({ omitBackground: true }));
  }
  const directory = Buffer.alloc(6 + sizes.length * 16);
  directory.writeUInt16LE(1, 2);
  directory.writeUInt16LE(sizes.length, 4);
  let offset = directory.length;
  for (let index = 0; index < sizes.length; index++) {
    const entry = 6 + index * 16;
    directory[entry] = sizes[index] === 256 ? 0 : sizes[index];
    directory[entry + 1] = directory[entry];
    directory.writeUInt16LE(1, entry + 4);
    directory.writeUInt16LE(32, entry + 6);
    directory.writeUInt32LE(frames[index].length, entry + 8);
    directory.writeUInt32LE(offset, entry + 12);
    offset += frames[index].length;
  }
  await writeFile(
    new URL("icon.ico", output),
    Buffer.concat([directory, ...frames]),
  );
  console.log(
    `Generated build/icon.png and build/icon.ico (${sizes.join(", ")}px)`,
  );
} finally {
  await browser.close();
}
