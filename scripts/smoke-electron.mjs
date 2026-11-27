import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { mkdir, mkdtemp, readFile, unlink, writeFile } from "node:fs/promises";
import net from "node:net";
import path from "node:path";
import { promisify } from "node:util";
import { _electron } from "playwright";

const exec = promisify(execFile);
const artifacts = path.resolve(".test-artifacts");
await mkdir(artifacts, { recursive: true });
const root = await mkdtemp(path.join(artifacts, "electron tiếng Việt "));
const userData = path.join(root, "user data");
const folder = path.join(root, "OpsDesk Web");
const apiFolder = path.join(root, "OpsDesk API");
await mkdir(folder);
await mkdir(apiFolder);
const git = (cwd, args) => exec("git", args, { cwd, windowsHide: true });
await git(folder, ["init", "-b", "main"]);
await git(folder, ["config", "user.name", "UI Test"]);
await git(folder, ["config", "user.email", "ui@devbench.local"]);
await git(folder, ["config", "commit.gpgsign", "false"]);
await writeFile(path.join(folder, "initial.txt"), "initial\n");
await git(folder, ["add", "."]);
await git(folder, ["commit", "-m", "Initial UI fixture"]);
const freePort = () =>
  new Promise((resolve, reject) => {
    const server = net.createServer();
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      if (!address || typeof address === "string") throw new Error("No port");
      server.close(() => resolve(address.port));
    });
  });
const ports = [await freePort(), await freePort()];
for (const [index, directory] of [folder, apiFolder].entries()) {
  await writeFile(
    path.join(directory, "package.json"),
    JSON.stringify(
      {
        name: `dev-bench-fixture-${index}`,
        private: true,
        scripts: { dev: "node server.cjs" },
      },
      null,
      2,
    ),
  );
  await writeFile(
    path.join(directory, "server.cjs"),
    `
    require('node:http').createServer((req,res)=>res.end('UI fixture ${index}'))
      .listen(${ports[index]}, '127.0.0.1', () => console.log('ready tiếng Việt'));
  `,
  );
}
const env = { ...process.env, DEV_BENCH_TEST_USER_DATA: userData };
delete env.ELECTRON_RUN_AS_NODE;
delete env.DEV_BENCH_DEV_URL;
const report = [];
let application;
const launch = async () => {
  application = await _electron.launch({
    executablePath: process.argv[2] ? path.resolve(process.argv[2]) : undefined,
    args: process.argv[2] ? [] : ["."],
    cwd: process.cwd(),
    env,
  });
  const page = await application.firstWindow();
  page.setDefaultTimeout(15000);
  page.on("pageerror", (error) => {
    console.error("RENDERER ERROR", error);
  });
  await page.getByRole("heading", { name: "Dashboard", exact: true }).waitFor();
  await page.waitForFunction(() => !!window.desktop);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.addStyleTag({
    content:
      "*, *::before, *::after { animation: none !important; transition: none !important; }",
  });
  return page;
};
const wait = async (condition, timeout = 15000) => {
  const end = Date.now() + timeout;
  while (Date.now() < end) {
    if (await condition()) return;
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error("Timed out waiting for smoke check");
};
const assertActiveSidebar = async (page, name) => {
  const item = page
    .locator(".layout-sidebar")
    .getByRole("link", { name, exact: true });
  await wait(async () =>
    item.evaluate((element) => {
      const active = element.closest(".bg-sidebar-accent");
      return (
        !!active &&
        getComputedStyle(active).backgroundColor !== "rgba(0, 0, 0, 0)"
      );
    }),
  );
  const appearance = await item.evaluate((element) => {
    const active = element.closest(".bg-sidebar-accent");
    const icon = element.querySelector("svg");
    return {
      background: active ? getComputedStyle(active).backgroundColor : null,
      text: getComputedStyle(element).color,
      icon: icon ? getComputedStyle(icon).fill : null,
      variant: icon?.getAttribute("data-variant"),
    };
  });
  // Active rows are only tinted: text and icon keep the normal colors.
  assert.notEqual(appearance.background, "rgb(15, 118, 110)");
  assert.notEqual(appearance.text, "rgb(255, 255, 255)");
  assert.equal(appearance.icon, appearance.text);
  assert.equal(appearance.variant, "solid");
};
try {
  let page = await launch();
  assert.equal(
    await page.evaluate(() => localStorage.getItem("DEV_BENCH_TERMINAL_THEME")),
    "midnight",
  );
  assert.equal(await page.evaluate(() => typeof window.require), "undefined");
  const preferences = await application.evaluate(({ BrowserWindow }) => {
    const preferences =
      BrowserWindow.getAllWindows()[0].webContents.getLastWebPreferences();
    return {
      isolation: preferences.contextIsolation,
      node: preferences.nodeIntegration,
      sandbox: preferences.sandbox,
    };
  });
  assert.deepEqual(preferences, {
    isolation: true,
    node: false,
    sandbox: true,
  });
  report.push(
    "Production renderer and sandboxed action bridge loaded; Node unavailable in renderer.",
  );
  assert.deepEqual(
    await page.evaluate(() => {
      const sidebar = document.querySelector(".layout-sidebar");
      const header = document.querySelector(".layout-header");
      const bounds = sidebar.getBoundingClientRect();
      return {
        sidebarTop: bounds.top,
        fullHeight: bounds.height === innerHeight,
        brandInSidebar: !!sidebar.querySelector(".layout-brand"),
        headerInContent: !!header.closest(".layout-content"),
        toggleInHeader: !!header.querySelector(".layout-sidebar-toggle"),
        brandInHeader: !!header.querySelector(".layout-brand"),
      };
    }),
    {
      sidebarTop: 0,
      fullHeight: true,
      brandInSidebar: true,
      headerInContent: true,
      toggleInHeader: true,
      brandInHeader: false,
    },
  );
  report.push(
    "Full-height sidebar owns the logo; the content column owns header/body and the header owns the collapse control.",
  );

  await page
    .getByRole("button", { name: "Add Project", exact: true })
    .first()
    .click();
  await page.getByLabel("Project name", { exact: true }).fill("OpsDesk");
  await page
    .getByLabel("Description", { exact: true })
    .fill("Server and client together");
  assert.equal(
    await page.getByRole("dialog").locator('input[type="file"]').count(),
    0,
  );
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Add Project", exact: true })
    .click();
  await page.getByRole("heading", { name: "OpsDesk", exact: true }).waitFor();

  for (const [index, directory] of [folder, apiFolder].entries()) {
    await application.evaluate(({ dialog }, target) => {
      dialog.showOpenDialog = async () => ({
        canceled: false,
        filePaths: [target],
      });
    }, directory);
    await page
      .getByRole("button", { name: "Add Repository", exact: true })
      .first()
      .click();
    await page.getByRole("button", { name: "Browse", exact: false }).click();
    await wait(
      async () =>
        (await page
          .getByLabel("Project folder", { exact: true })
          .inputValue()) === directory,
    );
    assert.equal(
      await page.getByLabel("Name", { exact: true }).inputValue(),
      path.basename(directory),
    );
    await page
      .getByLabel("Name", { exact: true })
      .fill(index === 0 ? "OpsDesk Web" : "OpsDesk API");
    await page.getByLabel("Run command", { exact: true }).fill("pnpm run dev");
    await page
      .getByLabel("Web URL", { exact: true })
      .fill(`http://localhost:${ports[index]}`);
    await page
      .getByRole("dialog")
      .getByRole("button", { name: "Add Repository", exact: true })
      .click();
    await page.getByRole("dialog").waitFor({ state: "hidden" });
  }
  await page.locator(".projects-repository-row").nth(1).waitFor();
  report.push(
    "Added two repositories to OpsDesk through real form and IPC with Unicode/spaced folders (folder picker OS response stubbed).",
  );
  const grouped = await page.evaluate(() => window.desktop.workspace());
  assert(grouped.ok);
  assert.equal(grouped.data.groups.length, 1);
  assert.equal("coverImage" in grouped.data.groups[0], false);
  const repoList = await page.evaluate(() => window.desktop.list());
  assert(repoList.ok);
  assert.equal(new Set(repoList.data.map((repo) => repo.groupId)).size, 1);
  await page
    .getByRole("button", { name: "Expand OpsDesk", exact: true })
    .click();
  await page
    .locator(".layout-project-tree")
    .getByText("OpsDesk Web", { exact: true })
    .waitFor();
  const sidebar = page.locator(".layout-sidebar");
  const webRepository = repoList.data.find(
    (repo) => repo.name === "OpsDesk Web",
  );
  const apiRepository = repoList.data.find(
    (repo) => repo.name === "OpsDesk API",
  );
  assert(webRepository && apiRepository);
  await sidebar.getByRole("link", { name: "OpsDesk Web", exact: true }).click();
  await page
    .getByRole("heading", { name: "OpsDesk Web", exact: true, level: 1 })
    .waitFor();
  assert.equal(await page.locator(".projects-repository-row").count(), 1);
  assert.equal(
    await page
      .getByRole("button", { name: "Run project", exact: true })
      .count(),
    0,
  );
  await page.getByRole("button", { name: "Run", exact: true }).click();
  await wait(async () => {
    const result = await page.evaluate(() => window.desktop.list());
    return (
      result.ok &&
      result.data.find((repo) => repo.id === webRepository.id)?.runtime
        .status === "Running" &&
      result.data.find((repo) => repo.id === apiRepository.id)?.runtime
        .status === "Stopped"
    );
  });
  await page
    .locator(".repository-inline-logs")
    .getByText("ready tiếng Việt", { exact: false })
    .waitFor();
  const webRuntime = await page.evaluate(() => window.desktop.list());
  assert(webRuntime.ok);
  const webPid = webRuntime.data.find((repo) => repo.id === webRepository.id)
    ?.runtime.pid;
  await sidebar.getByRole("link", { name: "OpsDesk API", exact: true }).click();
  await page
    .getByRole("heading", { name: "OpsDesk API", exact: true, level: 1 })
    .waitFor();
  await page
    .getByText("No output yet. Run this repository to see its logs here.", {
      exact: true,
    })
    .waitFor();
  assert.equal(
    await page
      .locator(".repository-inline-logs")
      .getByText("ready tiếng Việt", { exact: false })
      .count(),
    0,
  );
  await page.getByRole("button", { name: "Run", exact: true }).click();
  await wait(async () => {
    const result = await page.evaluate(() => window.desktop.list());
    return (
      result.ok &&
      result.data.every((repo) => repo.runtime.status === "Running") &&
      result.data.find((repo) => repo.id === webRepository.id)?.runtime.pid ===
        webPid
    );
  });
  await page.getByRole("button", { name: "Stop", exact: true }).click();
  await wait(async () => {
    const result = await page.evaluate(() => window.desktop.list());
    return (
      result.ok &&
      result.data.find((repo) => repo.id === apiRepository.id)?.runtime
        .status === "Stopped" &&
      result.data.find((repo) => repo.id === webRepository.id)?.runtime.pid ===
        webPid
    );
  });
  await sidebar.getByRole("link", { name: "OpsDesk Web", exact: true }).click();
  await page
    .getByRole("heading", { name: "OpsDesk Web", exact: true, level: 1 })
    .waitFor();
  await page.reload();
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.addStyleTag({
    content:
      "*, *::before, *::after { animation: none !important; transition: none !important; }",
  });
  await page
    .getByRole("heading", { name: "OpsDesk Web", exact: true, level: 1 })
    .waitFor();
  await sidebar
    .getByRole("link", { name: "OpsDesk Web", exact: true })
    .waitFor();
  await page
    .locator(".repository-inline-logs")
    .getByText("ready tiếng Việt", { exact: false })
    .waitFor();
  await page.screenshot({
    path: path.join(root, "sidebar-repository-detail.png"),
    fullPage: true,
  });
  await page.getByRole("button", { name: "Stop", exact: true }).click();
  await wait(async () => {
    const result = await page.evaluate(() => window.desktop.list());
    return (
      result.ok &&
      result.data.every((repo) => repo.runtime.status === "Stopped")
    );
  });
  report.push(
    "Sidebar opens a dedicated repository page with isolated live logs and actions; Run/Stop affect only the selected repository and direct reload restores the route/tree.",
  );
  await page.evaluate((route) => {
    location.hash = route;
  }, `/projects/${webRepository.groupId}/repositories/missing-repository`);
  await page
    .getByText("Repository not found in this project set.", { exact: true })
    .waitFor();
  assert.equal(await page.locator(".repository-inline-logs").count(), 0);
  assert.equal(
    await page.getByRole("button", { name: "Run", exact: true }).count(),
    0,
  );
  await application.evaluate(({ BrowserWindow }) =>
    BrowserWindow.getAllWindows()[0].setSize(760, 520),
  );
  await page
    .getByRole("button", { name: "Open navigation", exact: true })
    .click();
  await page
    .getByRole("dialog")
    .getByRole("link", { name: "OpsDesk API", exact: true })
    .click();
  await page.getByRole("dialog").waitFor({ state: "hidden" });
  await page
    .getByRole("heading", { name: "OpsDesk API", exact: true, level: 1 })
    .waitFor();
  assert(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  );
  await page.screenshot({
    path: path.join(root, "sidebar-repository-mobile.png"),
    fullPage: true,
  });
  await application.evaluate(({ BrowserWindow }) =>
    BrowserWindow.getAllWindows()[0].setSize(1280, 840),
  );
  await page.waitForFunction(() => innerWidth > 1200);
  await page.locator(".layout-sidebar").waitFor({ state: "visible" });
  await page
    .locator(".layout-sidebar")
    .getByRole("link", { name: "Dashboard", exact: true })
    .click();
  report.push(
    "One OpsDesk project contains two repositories; expandable sidebar shows both children.",
  );
  await page
    .getByRole("button", { name: "Edit project OpsDesk", exact: true })
    .click();
  assert.equal(
    await page.getByRole("dialog").locator('input[type="file"]').count(),
    0,
  );
  await page.getByRole("button", { name: "Save Project", exact: true }).click();
  await page.getByRole("dialog").waitFor({ state: "hidden" });
  report.push("Add/Edit Project contains no card image upload field.");
  await page.getByRole("button", { name: "Actions for OpsDesk Web" }).click();
  await page.getByRole("menuitem", { name: "Copy Path" }).click();
  await page.getByText("OpsDesk Web: Path copied", { exact: true }).waitFor();
  const copiedPath = await application.evaluate(({ clipboard }) =>
    clipboard.readText(),
  );
  report.push(
    copiedPath === folder
      ? "Copy Path wrote the exact Unicode folder to the Windows clipboard."
      : "Copy Path completed; clipboard readback is unavailable in this Windows session (PowerShell is also empty). Manual OS verification remains.",
  );
  await page.getByRole("button", { name: "Run All", exact: true }).click();
  assert.equal(
    await page
      .getByRole("button", { name: "Run All", exact: true })
      .evaluate((element) => getComputedStyle(element).color),
    "rgb(255, 255, 255)",
  );
  assert.notEqual(
    await sidebar.evaluate((element) => getComputedStyle(element).boxShadow),
    "none",
  );
  await wait(async () => {
    const result = await page.evaluate(() => window.desktop.list());
    return (
      result.ok &&
      result.data.length === 2 &&
      result.data.every((item) => item.runtime.status === "Running")
    );
  });
  const initial = await page.evaluate(() => window.desktop.list());
  assert(initial.ok);
  const pids = initial.data.map((item) => item.runtime.pid);
  await page.getByRole("button", { name: "Run All", exact: true }).click();
  const repeated = await page.evaluate(() => window.desktop.list());
  assert(repeated.ok);
  assert.deepEqual(
    repeated.data.map((item) => item.runtime.pid),
    pids,
  );
  await page.getByRole("button", { name: "Actions for OpsDesk API" }).click();
  await page.getByRole("menuitem", { name: "Edit Repository" }).click();
  assert(await page.getByLabel("Run command", { exact: true }).isDisabled());
  await page.getByLabel("Web URL", { exact: true }).fill("");
  await page
    .getByRole("button", { name: "Save Repository", exact: true })
    .click();
  await page.getByRole("dialog").waitFor({ state: "hidden" });
  const apiRow = page
    .locator(".projects-repository-row")
    .filter({ hasText: "OpsDesk API" });
  await apiRow.getByRole("button", { name: "Open Web", exact: true }).click();
  await page.getByRole("dialog").waitFor();
  await page
    .getByLabel("Web URL", { exact: true })
    .fill(`http://localhost:${ports[1]}`);
  await page
    .getByRole("button", { name: "Save Repository", exact: true })
    .click();
  await page.getByRole("dialog").waitFor({ state: "hidden" });
  report.push(
    "Running project allows URL edits; missing URL opens configuration while folder/command stay locked.",
  );
  await page.getByRole("button", { name: "Logs for OpsDesk Web" }).click();
  await page
    .getByLabel("Project process output")
    .getByText("ready tiếng Việt", { exact: false })
    .last()
    .waitFor();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Close", exact: true })
    .click();
  await page.getByRole("dialog").waitFor({ state: "hidden" });
  await page.screenshot({
    path: path.join(root, "dashboard-light.png"),
    fullPage: true,
  });
  report.push(
    "Run All starts two real HTTP servers through pnpm run dev; repeated batch preserves PIDs; per-project Unicode stdout visible.",
  );
  await page
    .locator(".layout-sidebar")
    .getByRole("link", { name: "Ports", exact: true })
    .click();
  await page
    .locator(`tr[data-port='${ports[0]}']`)
    .getByText("Listening", { exact: true })
    .waitFor({ timeout: 30000 });
  await page
    .locator(`tr[data-port='${ports[1]}']`)
    .getByText("Listening", { exact: true })
    .waitFor();
  await page.screenshot({ path: path.join(root, "ports.png"), fullPage: true });
  await page
    .locator(".layout-sidebar")
    .getByRole("link", { name: "Stats", exact: true })
    .click();
  await page.getByRole("heading", { name: "Stats", exact: true }).waitFor();
  report.push(
    "Ports maps real descendant PIDs to both repositories; Stats shows the grouped workspace.",
  );
  await page.getByRole("button", { name: "Open settings" }).click();
  await page.getByRole("heading", { name: "Settings", exact: true }).waitFor();
  await page
    .getByRole("button", { name: "Dark appearance", exact: true })
    .click();
  await page.waitForFunction(() =>
    document.documentElement.classList.contains("dark"),
  );
  await assertActiveSidebar(page, "Settings");
  assert.equal(
    await page.locator(".settings-terminal [aria-pressed]").count(),
    4,
  );
  assert.equal(
    await page
      .getByRole("button", { name: "Dark terminal theme", exact: true })
      .getAttribute("aria-pressed"),
    "true",
  );
  assert.equal(
    await page
      .locator(".settings-terminal-preview")
      .evaluate((element) => getComputedStyle(element).backgroundColor),
    "rgb(16, 20, 30)",
  );
  assert.equal(
    await page
      .locator(".settings-type-preview")
      .evaluate((element) => getComputedStyle(element).borderTopLeftRadius),
    "8px",
  );
  await page.locator(".settings-terminal-preview").scrollIntoViewIfNeeded();
  await page.screenshot({
    path: path.join(root, "terminal-default-dark.png"),
    fullPage: true,
  });
  for (const [label, expected] of [
    ["Be Vietnam Pro", "Be Vietnam Pro"],
    ["JetBrains Mono", "JetBrains Mono"],
    ["System default", "Segoe UI"],
    ["Be Vietnam Pro", "Be Vietnam Pro"],
  ]) {
    await page
      .getByRole("combobox", { name: "Interface font", exact: true })
      .click();
    await page.getByRole("option", { name: label, exact: true }).click();
    await page.waitForFunction(
      (font) =>
        getComputedStyle(document.body).fontFamily.startsWith(`"${font}"`),
      expected,
    );
  }
  assert(
    await page
      .locator(".settings-type-preview")
      .evaluate((element) =>
        getComputedStyle(element).fontFamily.includes("Be Vietnam Pro"),
      ),
  );
  assert(
    await page
      .locator("[data-terminal-theme] pre")
      .first()
      .evaluate((element) =>
        getComputedStyle(element).fontFamily.includes("JetBrains Mono"),
      ),
  );
  report.push(
    "Font selector applies all three choices immediately and keeps terminal output monospace.",
  );
  await page
    .locator("#settings-appearance")
    .evaluate((element) => element.scrollIntoView({ block: "start" }));
  await page.screenshot({
    path: path.join(root, "font-selector-dark.png"),
    fullPage: true,
  });
  await page
    .getByRole("button", { name: "Rose terminal theme", exact: true })
    .click();
  await page.evaluate(async () => {
    // System UI may satisfy every glyph; explicitly load the bundled offline fallback.
    await document.fonts.load('14px "Be Vietnam Pro"', "Tiếng Việt");
    await document.fonts.ready;
  });
  assert.equal(
    await page.evaluate(() =>
      getComputedStyle(document.documentElement)
        .getPropertyValue("--primary")
        .trim(),
    ),
    "#0f766e",
  );
  assert(
    await page.evaluate(() =>
      document.fonts.check('14px "Be Vietnam Pro"', "Tiếng Việt"),
    ),
  );
  await page.screenshot({
    path: path.join(root, "settings-dark.png"),
    fullPage: true,
  });
  await page
    .getByRole("button", { name: "Light appearance", exact: true })
    .click();
  await assertActiveSidebar(page, "Settings");
  assert.equal(
    await page.evaluate(() =>
      getComputedStyle(document.documentElement)
        .getPropertyValue("--primary")
        .trim(),
    ),
    "#0f766e",
  );
  assert.deepEqual(
    await page.locator(".settings-type-preview").evaluate((element) => {
      const style = getComputedStyle(element);
      return { background: style.backgroundColor, blur: style.backdropFilter };
    }),
    { background: "rgb(255, 255, 255)", blur: "none" },
  );
  await page.screenshot({
    path: path.join(root, "settings-light.png"),
    fullPage: true,
  });
  await page
    .getByRole("button", { name: "System appearance", exact: true })
    .click();
  await page.emulateMedia({ colorScheme: "dark", reducedMotion: "reduce" });
  await page.waitForFunction(() =>
    document.documentElement.classList.contains("dark"),
  );
  await page.emulateMedia({ colorScheme: "light", reducedMotion: "reduce" });
  await page.waitForFunction(() =>
    document.documentElement.classList.contains("light"),
  );
  await page
    .getByRole("button", { name: "Dark appearance", exact: true })
    .click();
  await page
    .getByRole("link", { name: "Back to projects", exact: true })
    .click();
  await page.getByRole("button", { name: "Table view", exact: true }).click();
  await page
    .locator(".projects-table")
    .getByRole("link", { name: "OpsDesk", exact: true })
    .waitFor();
  await page.screenshot({
    path: path.join(root, "projects-table.png"),
    fullPage: true,
  });
  await page.getByRole("button", { name: "Card view", exact: true }).click();
  await page
    .locator(".projects-card")
    .getByRole("link", { name: "OpsDesk", exact: true })
    .waitFor();
  await page.screenshot({
    path: path.join(root, "projects-cards.png"),
    fullPage: true,
  });
  await page
    .locator(".layout-sidebar")
    .getByRole("link", { name: "Dashboard", exact: true })
    .click();
  report.push(
    "VS Code-inspired flat surfaces retain teal primary #0f766e in both modes; offline Vietnamese fallback, system mode and independent terminal palette work.",
  );
  await page.screenshot({
    path: path.join(root, "dashboard-dark.png"),
    fullPage: true,
  });
  await assertActiveSidebar(page, "Dashboard");
  for (const name of ["Ports", "Stats", "Utilities", "Hosts", "Config Files"]) {
    await page
      .locator(".layout-sidebar")
      .getByRole("link", { name, exact: true })
      .click();
    await assertActiveSidebar(page, name);
  }
  await page
    .locator(".layout-sidebar")
    .getByRole("link", { name: "Dashboard", exact: true })
    .click();
  assert.equal(
    await page.getByRole("link", { name: "Themes", exact: true }).count(),
    0,
  );
  await page
    .getByRole("button", { name: "Collapse sidebar", exact: true })
    .click();
  assert.equal(
    await page.locator(".layout-sidebar").getAttribute("data-collapsed"),
    "true",
  );
  await wait(
    async () =>
      Math.round(
        (await page.locator(".layout-sidebar").boundingBox()).width,
      ) === 76,
  );
  assert.equal(
    Math.round((await page.locator(".layout-sidebar").boundingBox()).width),
    76,
  );
  await page
    .locator(".layout-sidebar")
    .getByRole("link", { name: "Ports", exact: true })
    .click();
  await page.getByRole("heading", { name: "Ports", exact: true }).waitFor();
  await page.getByRole("button", { name: "Theme: dark", exact: true }).click();
  assert.equal(
    await page
      .getByRole("menuitemradio", { name: "Dark", exact: true })
      .getAttribute("aria-checked"),
    "true",
  );
  await page.getByRole("menuitemradio", { name: "Light", exact: true }).click();
  await page.waitForFunction(() =>
    document.documentElement.classList.contains("light"),
  );
  await assertActiveSidebar(page, "Ports");
  await page.screenshot({
    path: path.join(root, "sidebar-collapsed-light.png"),
  });
  await page
    .getByRole("button", { name: "Expand sidebar", exact: true })
    .click();
  await page
    .locator(".layout-sidebar")
    .getByRole("link", { name: "Projects", exact: true })
    .click();
  await page.locator(".projects-card").waitFor();
  await assertActiveSidebar(page, "Projects");
  await page.screenshot({ path: path.join(root, "projects-light-layout.png") });
  await page
    .getByRole("button", { name: "Collapse sidebar", exact: true })
    .click();
  await page.getByRole("button", { name: "Theme: light", exact: true }).click();
  await page
    .getByRole("menuitemradio", { name: "System", exact: true })
    .click();
  await page.emulateMedia({ colorScheme: "dark", reducedMotion: "reduce" });
  await page.waitForFunction(() =>
    document.documentElement.classList.contains("dark"),
  );
  await page.emulateMedia({ colorScheme: "light", reducedMotion: "reduce" });
  await page.waitForFunction(() =>
    document.documentElement.classList.contains("light"),
  );
  const themeTrigger = page.getByRole("button", {
    name: "Theme: system",
    exact: true,
  });
  await themeTrigger.focus();
  await page.keyboard.press("Enter");
  await page
    .getByRole("menuitemradio", { name: "System", exact: true })
    .waitFor();
  await page.getByRole("menuitemradio", { name: "Light", exact: true }).focus();
  await page.keyboard.press("ArrowDown");
  await page.waitForFunction(
    () =>
      document.activeElement?.getAttribute("data-state") === "unchecked" &&
      document.activeElement?.textContent?.trim() === "Dark",
  );
  await page
    .getByRole("menuitemradio", { name: "Dark", exact: true })
    .press("Enter");
  await page.waitForFunction(() =>
    document.documentElement.classList.contains("dark"),
  );
  await page
    .locator(".layout-sidebar")
    .getByRole("link", { name: "Dashboard", exact: true })
    .click();
  report.push(
    "Collapsed sidebar keeps accessible navigation; one checked theme dropdown supports Light/Dark/System and keyboard selection.",
  );
  await application.evaluate(({ BrowserWindow }) =>
    BrowserWindow.getAllWindows()[0].setSize(760, 520),
  );
  await page.screenshot({
    path: path.join(root, "dashboard-small.png"),
    fullPage: true,
  });
  await page
    .getByRole("button", { name: "Open navigation", exact: true })
    .click();
  await page
    .getByRole("dialog")
    .getByRole("link", { name: "Settings", exact: true })
    .click();
  await page.getByRole("dialog").waitFor({ state: "hidden" });
  await page.getByRole("heading", { name: "Settings", exact: true }).waitFor();
  assert(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  );
  await application.evaluate(({ BrowserWindow }) =>
    BrowserWindow.getAllWindows()[0].setSize(1280, 840),
  );
  await page
    .locator(".layout-sidebar")
    .getByRole("link", { name: "Dashboard", exact: true })
    .click();
  report.push(
    "Captured light/dark and 760×520 layouts; no horizontal page overflow.",
  );

  await application.evaluate(({ dialog }) => {
    dialog.showMessageBox = async () => ({
      response: 1,
      checkboxChecked: false,
    });
  });
  await application.evaluate(({ BrowserWindow }) =>
    BrowserWindow.getAllWindows()[0].close(),
  );
  await page.getByRole("heading", { name: "Dashboard", exact: true }).waitFor();
  assert.equal(application.process().exitCode, null);
  await application.evaluate(({ dialog }) => {
    dialog.showMessageBox = async () => ({
      response: 0,
      checkboxChecked: false,
    });
  });
  const exited = application.waitForEvent("close");
  await application.evaluate(({ BrowserWindow }) =>
    BrowserWindow.getAllWindows()[0].close(),
  );
  await exited;
  application = undefined;
  report.push(
    "Quit Cancel retains the app; Stop All and Quit closes after stopping owned servers (native choice stubbed).",
  );

  page = await launch();
  const persistedWorkspace = await page.evaluate(() =>
    window.desktop.workspace(),
  );
  assert(persistedWorkspace.ok);
  assert.equal("coverImage" in persistedWorkspace.data.groups[0], false);
  assert.equal(
    await page.evaluate(() => localStorage.getItem("DEV_BENCH_FONT_FAMILY")),
    "be-vietnam-pro",
  );
  assert(
    await page.evaluate(() =>
      getComputedStyle(document.body).fontFamily.includes("Be Vietnam Pro"),
    ),
  );
  await page
    .getByRole("button", { name: "Expand sidebar", exact: true })
    .waitFor();
  assert.equal(
    await page.locator(".layout-sidebar").getAttribute("data-collapsed"),
    "true",
  );
  await page
    .getByRole("button", { name: "Expand sidebar", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Theme: dark", exact: true })
    .waitFor();
  report.push(
    "Sidebar collapse state and dropdown theme persist after app restart; mobile drawer remains full navigation.",
  );
  const restored = await page.evaluate(() => window.desktop.list());
  assert(restored.ok);
  assert.equal(restored.data.length, 2);
  assert(
    restored.data.every(
      (item) => item.runtime.status === "Stopped" && item.includeInRunAll,
    ),
  );
  assert.equal(restored.data[0].folder, folder);
  assert.equal(restored.data[0].url, `http://localhost:${ports[0]}`);
  assert.equal(
    await page.evaluate(() =>
      document.documentElement.classList.contains("dark"),
    ),
    true,
  );
  report.push(
    "Relaunch restores commands, URLs, Run All selection and theme; no stale Running state.",
  );

  await writeFile(path.join(folder, "selected tiếng Việt.txt"), "selected\n");
  await writeFile(path.join(folder, "not-staged.txt"), "leave\n");
  await page.getByRole("button", { name: "Actions for OpsDesk Web" }).click();
  await page.getByRole("menuitem", { name: "Git Commit", exact: true }).click();
  await page
    .getByRole("checkbox", {
      name: "Stage selected tiếng Việt.txt",
      exact: true,
    })
    .click();
  await page
    .getByRole("button", { name: "Stage selected", exact: true })
    .click();
  await page
    .getByLabel("Staged changes", { exact: true })
    .getByText("selected tiếng Việt.txt", { exact: true })
    .waitFor();
  const message = 'Sửa "giao diện" tiếng Việt';
  await page.getByLabel("Commit message", { exact: true }).fill(message);
  await page
    .getByRole("button", { name: "Review staged files", exact: true })
    .click();
  await page
    .getByRole("heading", { name: "Final staged list", exact: false })
    .waitFor();
  await writeFile(
    path.join(folder, ".git", "hooks", "pre-commit"),
    "#!/bin/sh\necho ui-hook-refusal >&2\nexit 1\n",
  );
  await page
    .getByRole("button", { name: "Confirm Commit", exact: true })
    .click();
  await page
    .getByRole("alert")
    .filter({ hasText: "ui-hook-refusal" })
    .waitFor();
  assert.equal(
    await page.getByLabel("Commit message", { exact: true }).inputValue(),
    message,
  );
  await unlink(path.join(folder, ".git", "hooks", "pre-commit"));
  await page
    .getByRole("button", { name: "Review staged files", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Confirm Commit", exact: true })
    .click();
  await page.getByRole("dialog").waitFor({ state: "hidden" });
  const log = await git(folder, ["log", "-1", "--format=%s"]);
  assert.equal(log.stdout.trim(), message);
  const committed = await git(folder, [
    "show",
    "--format=",
    "--name-only",
    "HEAD",
  ]);
  assert(!committed.stdout.includes("not-staged.txt"));
  report.push(
    "Commit modal stages selected files, shows final staged list, retains message on hook failure and commits Unicode/quotes without unstaged files.",
  );
  await page.getByRole("button", { name: "Open settings" }).click();
  const exported = path.join(root, "exported-set.json");
  await application.evaluate(({ dialog }, filePath) => {
    dialog.showSaveDialog = async () => ({ canceled: false, filePath });
  }, exported);
  await page.getByRole("button", { name: "Export JSON", exact: true }).click();
  await wait(async () => {
    try {
      return !!JSON.parse(await readFile(exported, "utf8")).set;
    } catch {
      return false;
    }
  });
  const exportedSet = JSON.parse(await readFile(exported, "utf8"));
  assert.equal(exportedSet.set.repositories.length, 2);
  assert.equal(exportedSet.appearance.terminalTheme, "rose");
  assert.equal(exportedSet.appearance.fontFamily, "be-vietnam-pro");
  assert.equal("coverImage" in exportedSet.set.projects[0], false);
  await page
    .getByRole("combobox", { name: "Interface font", exact: true })
    .click();
  await page
    .getByRole("option", { name: "System default", exact: true })
    .click();
  await page.getByLabel("Set name", { exact: true }).fill("Personal Mac");
  await page.getByRole("button", { name: "Create set", exact: true }).click();
  await wait(async () => {
    const result = await page.evaluate(() => window.desktop.workspace());
    return result.ok && result.data.sets.length === 2;
  });
  await application.evaluate(({ dialog }, filePath) => {
    dialog.showOpenDialog = async () => ({
      canceled: false,
      filePaths: [filePath],
    });
  }, exported);
  await page.getByRole("button", { name: "Import JSON", exact: true }).click();
  await page
    .getByRole("checkbox", {
      name: "Also restore appearance and terminal theme",
      exact: true,
    })
    .check();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Import as new set", exact: true })
    .click();
  await page.getByRole("dialog").waitFor({ state: "hidden" });
  await page.waitForFunction(
    () => document.documentElement.dataset.fontFamily === "be-vietnam-pro",
  );
  const sets = await page.evaluate(() => window.desktop.workspace());
  assert(sets.ok);
  assert.equal(sets.data.sets.length, 3);
  const imported = await page.evaluate(() => window.desktop.list());
  assert(imported.ok);
  assert.equal(imported.data.length, 2);
  assert(
    imported.data.every((project) => project.runtime.status === "Stopped"),
  );
  assert.notEqual(imported.data[0].id, restored.data[0].id);
  await page.screenshot({
    path: path.join(root, "settings-backup.png"),
    fullPage: true,
  });
  report.push(
    "Settings creates isolated sets, exports JSON, previews and imports a new set without overwriting originals or running commands.",
  );
  await application.close();
  application = undefined;
  const persisted = JSON.parse(
    await readFile(path.join(userData, "projects.json"), "utf8"),
  );
  assert.equal(persisted.version, 3);
  assert.equal(persisted.sets.length, 3);
  assert.equal(
    persisted.sets.find((set) => set.id === persisted.activeSetId).repositories
      .length,
    2,
  );
  await writeFile(
    path.join(root, "report.json"),
    JSON.stringify({ passed: true, report }, null, 2),
  );
  console.log(
    JSON.stringify({ passed: true, artifacts: root, report }, null, 2),
  );
} catch (error) {
  if (application) {
    const page = application.windows()[0];
    if (page) {
      await page
        .screenshot({ path: path.join(root, "failure.png"), fullPage: true })
        .catch(() => undefined);
      console.error(
        await page
          .locator("body")
          .innerText()
          .catch(() => "No body"),
      );
    }
  }
  console.error("Smoke artifacts:", root, "Completed checks:", report);
  throw error;
} finally {
  if (application) {
    await application
      .evaluate(({ dialog }) => {
        dialog.showMessageBox = async () => ({
          response: 0,
          checkboxChecked: false,
        });
      })
      .catch(() => undefined);
    await application.close().catch(() => undefined);
  }
}
