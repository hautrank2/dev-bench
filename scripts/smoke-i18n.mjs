import assert from "node:assert/strict";
import { mkdir, mkdtemp, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { _electron } from "playwright";

const artifacts = path.resolve(".test-artifacts");
await mkdir(artifacts, { recursive: true });
const root = await mkdtemp(path.join(artifacts, "i18n-"));
const folder = path.join(root, "repository");
await mkdir(folder);
await writeFile(
  path.join(folder, "server.cjs"),
  "setInterval(() => {}, 1000);\n",
);
const env = {
  ...process.env,
  DEV_BENCH_TEST_USER_DATA: path.join(root, "user-data"),
};
delete env.ELECTRON_RUN_AS_NODE;
delete env.DEV_BENCH_DEV_URL;
let app;
let page;
let repositoryId;
const errors = [];
const launch = async () => {
  app = await _electron.launch({ args: ["."], cwd: process.cwd(), env });
  page = await app.firstWindow();
  page.setDefaultTimeout(15000);
  page.on("pageerror", (error) => errors.push(error.message));
  await page.getByRole("heading", { name: "Dashboard", exact: true }).waitFor();
  await page.emulateMedia({ reducedMotion: "reduce" });
};
const screenshot = (name) => page.screenshot({ path: path.join(root, name) });
const languageFile = path.join(env.DEV_BENCH_TEST_USER_DATA, "language.json");
try {
  await launch();
  assert.equal(await page.evaluate(() => document.documentElement.lang), "en");
  for (const name of ["Nền tảng thử nghiệm", "Settings"]) {
    const result = await page.evaluate(
      async ({ name, folder }) => {
        const group = await window.desktop.saveGroup({
          name,
          description: "API / Client",
        });
        if (!group.ok) throw new Error(group.error);
        const repo = await window.desktop.saveProject({
          input: {
            groupId: group.data.id,
            name: "Web Client",
            folder,
            command: "node server.cjs",
            url: "http://localhost:3000",
            includeInRunAll: true,
          },
        });
        if (!repo.ok) throw new Error(repo.error);
        return repo.data.id;
      },
      { name, folder },
    );
    repositoryId ??= result;
  }
  await page
    .getByRole("button", { name: "Open settings", exact: true })
    .click();
  await page.getByRole("combobox", { name: "Language", exact: true }).waitFor();
  await screenshot("settings-en.png");
  await page.getByRole("combobox", { name: "Language", exact: true }).click();
  await page.getByRole("option", { name: "Tiếng Việt", exact: true }).click();
  await page.getByRole("heading", { name: "Cài đặt", exact: true }).waitFor();
  assert.equal(await page.evaluate(() => document.documentElement.lang), "vi");
  await page.getByRole("link", { name: "project", exact: true }).waitFor();
  await page.getByRole("link", { name: "port", exact: true }).waitFor();
  await screenshot("settings-vi.png");
  await page.getByRole("link", { name: "Dashboard", exact: true }).click();
  await page
    .getByRole("button", { name: "Thêm project", exact: true })
    .waitFor();
  await page
    .locator(".projects-card")
    .getByRole("link", { name: "Settings", exact: true })
    .waitFor();
  assert.match(
    await page.locator(".projects-set-switcher").innerText(),
    /2 project · 2 repository/,
  );
  await screenshot("dashboard-vi.png");
  await page.getByRole("button", { name: "Thêm project", exact: true }).click();
  await page.getByPlaceholder("Nhập tên project", { exact: true }).waitFor();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Thêm project", exact: true })
    .click();
  await page.getByText("Vui lòng nhập tên", { exact: true }).waitFor();
  await screenshot("form-vi-error.png");
  await page
    .getByLabel("Tên project", { exact: true })
    .fill("Dữ liệu giữ nguyên");
  await page.getByRole("button", { name: "Hủy", exact: true }).click();
  await page.getByRole("button", { name: "Dạng bảng", exact: true }).click();
  await page.locator(".projects-table").waitFor();
  await screenshot("table-vi.png");
  for (const [link, heading] of [
    ["port", "port"],
    ["Thống kê", "Thống kê"],
    ["Tiện ích", "Tiện ích"],
    ["Tệp cấu hình", "Tệp cấu hình"],
  ]) {
    await page.getByRole("link", { name: link, exact: true }).click();
    await page.getByRole("heading", { name: heading, exact: true }).waitFor();
  }
  await page.getByRole("button", { name: "Mở cài đặt", exact: true }).click();
  await page
    .getByRole("button", { name: "Giao diện Tối", exact: true })
    .click();
  await page.waitForFunction(() =>
    document.documentElement.classList.contains("dark"),
  );
  assert.equal(
    await page.evaluate(() =>
      getComputedStyle(document.documentElement)
        .getPropertyValue("--primary")
        .trim(),
    ),
    "#0f766e",
  );
  await screenshot("settings-vi-dark.png");
  await app.evaluate(({ BrowserWindow }) =>
    BrowserWindow.getAllWindows()[0].setSize(760, 600),
  );
  assert.equal(
    await page.evaluate(
      () => document.documentElement.scrollWidth > innerWidth,
    ),
    false,
  );
  await screenshot("settings-vi-small.png");
  await app.evaluate(({ BrowserWindow }) =>
    BrowserWindow.getAllWindows()[0].setSize(1280, 840),
  );

  // Exercise native app-owned dialog strings with a real, isolated process.
  const started = await page.evaluate(
    (id) => window.desktop.run(id),
    repositoryId,
  );
  assert(started.ok);
  await app.evaluate(({ dialog, BrowserWindow }) => {
    globalThis.i18nQuitDialog = null;
    dialog.showMessageBox = async (options) => {
      globalThis.i18nQuitDialog = options;
      return { response: 1, checkboxChecked: false };
    };
    BrowserWindow.getAllWindows()[0].close();
  });
  let native;
  for (let attempt = 0; attempt < 50; attempt++) {
    native = await app.evaluate(() => globalThis.i18nQuitDialog);
    if (native) break;
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  assert.equal(native.title, "Vẫn có project đang chạy");
  assert.deepEqual(native.buttons, ["Dừng tất cả và thoát", "Hủy"]);
  const stopped = await page.evaluate(
    (id) => window.desktop.stop(id),
    repositoryId,
  );
  assert(stopped.ok);
  assert.equal(JSON.parse(await readFile(languageFile, "utf8")), "vi");
  await app.close();
  app = undefined;
  await launch();
  await page.getByRole("link", { name: "Cài đặt", exact: true }).waitFor();
  assert.equal(await page.evaluate(() => document.documentElement.lang), "vi");
  await page.getByRole("button", { name: "Mở cài đặt", exact: true }).click();
  await page.getByRole("combobox", { name: "Ngôn ngữ", exact: true }).click();
  await page.getByRole("option", { name: "English", exact: true }).click();
  await page.getByRole("heading", { name: "Settings", exact: true }).waitFor();
  assert.equal(await page.evaluate(() => document.documentElement.lang), "en");
  await page.getByRole("link", { name: "Dashboard", exact: true }).click();
  await page
    .getByRole("button", { name: "Add Project", exact: true })
    .waitFor();
  await page.locator(".projects-card").count();
  assert.deepEqual(errors, []);
  console.log(
    JSON.stringify(
      {
        passed: true,
        artifacts: root,
        checks: [
          "English default",
          "Vietnamese navigation/forms/placeholders/validation",
          "project, port and Dashboard preserved",
          "User project/repository names and commands unchanged",
          "Dynamic counts and tables",
          "Vietnamese dark/small viewport",
          "Native quit dialog in Vietnamese",
          "Language survives restart",
          "Switch back to English",
          "No renderer errors",
        ],
      },
      null,
      2,
    ),
  );
} catch (error) {
  await page
    ?.screenshot({ path: path.join(root, "failure.png") })
    .catch(() => undefined);
  console.error("i18n smoke artifacts:", root);
  throw error;
} finally {
  if (app) {
    await app
      .evaluate(({ dialog }) => {
        dialog.showMessageBox = async () => ({
          response: 0,
          checkboxChecked: false,
        });
      })
      .catch(() => undefined);
    await app.close().catch(() => undefined);
  }
}
