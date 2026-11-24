import assert from "node:assert/strict";
import { mkdir, mkdtemp, readFile } from "node:fs/promises";
import path from "node:path";
import { _electron, type ElectronApplication, type Page } from "playwright";

const artifacts = path.resolve(".test-artifacts");
await mkdir(artifacts, { recursive: true });
const root = await mkdtemp(path.join(artifacts, "cloud UI tiếng Việt "));
const userData = path.join(root, "user-data");
// Start the separate .NET test executable with --serve first. This script never
// loads backend source or real Google credentials. Use a fresh test harness.
const origin = process.env.DEV_BENCH_TEST_API_ORIGIN;
if (!origin || new URL(origin).hostname !== "127.0.0.1")
  throw new Error(
    "Start dev-bench-server test harness with --serve, then set DEV_BENCH_TEST_API_ORIGIN=http://127.0.0.1:14318",
  );
const health = await fetch(`${origin}/health`);
assert(health.ok, "The .NET test harness is unavailable");
const env = { ...process.env, DEV_BENCH_TEST_USER_DATA: userData };
delete env.ELECTRON_RUN_AS_NODE;
delete env.DEV_BENCH_DEV_URL;
let app: ElectronApplication | undefined;
let page: Page | undefined;
const start = async () => {
  app = await _electron.launch({
    executablePath: process.argv[2] ? path.resolve(process.argv[2]) : undefined,
    args: process.argv[2] ? [] : ["."],
    cwd: process.cwd(),
    env,
  });
  page = await app.firstWindow();
  page.setDefaultTimeout(15000);
  await page.getByRole("heading", { name: "Dashboard", exact: true }).waitFor();
  await page.addStyleTag({
    content:
      "*, *::before, *::after {animation-duration:1ms!important;transition-duration:1ms!important}",
  });
  return page;
};
const authorize = async (code: string) => {
  if (!app) throw new Error("App not running");
  await app.evaluate(
    ({ shell }, input) => {
      shell.openExternal = async (url: string) => {
        const auth = new URL(url);
        if (auth.hostname !== "accounts.google.com")
          throw new Error("Unexpected browser URL");
        const response = await fetch(
          `${input.origin}/auth/google/callback?state=${auth.searchParams.get("state")}&code=${input.code}`,
        );
        if (!response.ok) throw new Error("Test identity was rejected");
      };
    },
    { origin, code },
  );
};
try {
  let window = await start();
  const added = await window.evaluate(async (folder) => {
    const desktop = (
      globalThis as unknown as {
        desktop: { saveProject: (input: unknown) => Promise<{ ok: boolean }> };
      }
    ).desktop;
    return desktop.saveProject({
      input: {
        name: "Cloud project",
        folder,
        command: "",
        url: "",
        includeInRunAll: true,
      },
    });
  }, root);
  assert(added.ok);
  await window.getByRole("button", { name: "Open settings" }).click();
  await window.getByLabel("Backup server URL", { exact: true }).fill(origin);
  await window
    .getByRole("button", { name: "Save server", exact: true })
    .click();
  await authorize("cloud-alice");
  await window
    .getByRole("button", { name: "Continue with Google", exact: true })
    .click();
  await window
    .locator("#settings-account")
    .getByText("cloud-alice@gmail.com", { exact: true })
    .waitFor();
  const encrypted = await readFile(path.join(userData, "cloud-session.bin"));
  assert(!encrypted.includes(Buffer.from("cloud-alice@gmail.com")));
  await window
    .getByRole("button", { name: "Back up current set", exact: true })
    .click();
  await window
    .getByRole("button", { name: "Preview restore", exact: true })
    .waitFor();
  await window.screenshot({
    path: path.join(root, "cloud-signed-in.png"),
    fullPage: true,
  });
  await app?.close();
  app = undefined;

  window = await start();
  await window.getByRole("button", { name: "Open settings" }).click();
  await window
    .locator("#settings-account")
    .getByText("cloud-alice@gmail.com", { exact: true })
    .waitFor();
  await window.getByLabel("Set name", { exact: true }).fill("After reset");
  await window.getByRole("button", { name: "Create set", exact: true }).click();
  await window
    .getByRole("button", { name: "Preview restore", exact: true })
    .click();
  await window
    .getByRole("button", { name: "Import as new set", exact: true })
    .click();
  await window.getByRole("dialog").waitFor({ state: "hidden" });
  const config = JSON.parse(
    await readFile(path.join(userData, "projects.json"), "utf8"),
  );
  assert.equal(config.sets.length, 3);
  assert.equal(
    config.sets.find((set: { id: string }) => set.id === config.activeSetId)
      .projects.length,
    1,
  );
  await window.getByRole("button", { name: "Sign out", exact: true }).click();
  await window
    .getByRole("button", { name: "Continue with Google", exact: true })
    .waitFor();
  await assert.rejects(readFile(path.join(userData, "cloud-session.bin")));
  await authorize("cloud-bob");
  await window
    .getByRole("button", { name: "Continue with Google", exact: true })
    .click();
  await window
    .locator("#settings-account")
    .getByText("cloud-bob@gmail.com", { exact: true })
    .waitFor();
  await window.getByText(/No backups yet/).waitFor();
  assert.equal(
    await window
      .getByRole("button", { name: "Preview restore", exact: true })
      .count(),
    0,
  );
  await window.getByRole("button", { name: "Sign out", exact: true }).click();
  await app?.close();
  app = undefined;
  console.log(
    JSON.stringify(
      {
        passed: true,
        artifacts: root,
        checks: [
          "Google identity stubbed only by separate .NET test harness; real HTTP API",
          "Desktop encrypted session persisted across restart",
          "Backup and preview/restore via real UI/IPC/HTTP to .NET backend",
          "Restore creates a separate local set",
          "Sign-out deletes local credentials; another account cannot see backups",
        ],
      },
      null,
      2,
    ),
  );
} catch (error) {
  await page
    ?.screenshot({ path: path.join(root, "failure.png"), fullPage: true })
    .catch(() => undefined);
  console.error("Cloud smoke artifacts:", root);
  throw error;
} finally {
  await app?.close().catch(() => undefined);
}
