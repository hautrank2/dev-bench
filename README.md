# DevBench 1.1

Desktop dashboard quản lý project có nhiều repo/service, chạy/dừng dev server,
Git và log, kiểm tra port, sao lưu bộ cấu hình theo máy bằng Google + MongoDB.

```text
Account → Project set theo máy → Project → Repositories / services
                               OpsDesk → server, client, mobile, broker
```

Mỗi repo có folder, command, URL, Git checkout và process riêng. Project là
nhóm các repo, không đồng nghĩa với một thư mục Git duy nhất.
Chi tiết: [mô hình tính năng](docs/product-model.md).

## Chạy local

Cần Node.js 24, pnpm 10.4.1 và Git trên PATH. Trên Windows cài
[Git for Windows](https://git-scm.com/downloads/win),
[Node.js](https://nodejs.org/en/download), rồi `npm install -g pnpm@10.4.1`.
Mỗi repo tự cài dependencies của nó; dashboard không tự install.

```powershell
pnpm install --frozen-lockfile
pnpm dev
```

Dev mở Electron với Vite ở `127.0.0.1:5173`. Renderer có HMR; thay đổi
`electron/` hoặc `shared/` thì khởi động lại dev. Không dùng browser thông
thường thay Electron, vì OS actions và tài khoản đi qua preload/main.

## Sử dụng

App mặc định **English**. Đổi tại **Settings → Language → Tiếng Việt**;
giao diện đổi ngay và ghi nhớ lựa chọn khi mở lại. Các từ `project`, `port`,
`Dashboard`, tên riêng và dữ liệu bạn nhập được giữ nguyên.

1. **Add Project**: đặt tên/mô tả, ví dụ OpsDesk.
2. Mở project, **Add Repository** cho server, client, mobile, broker…
3. Browse folder, đặt command (`pnpm run dev`), Web URL và startup selection.
4. Run từng repo hoặc **Run project** để chạy tất cả repo con.
5. **Run All** ở Dashboard/Projects chỉ chạy repo đã chọn Include in Run All;
   bỏ qua repo đang hoạt động, báo riêng lỗi từng repo.

Project list hỗ trợ **Card / Table**, ghi nhớ mode. Sidebar mở rộng Projects
và từng project để xem repo con. Processes quản lý process của app; Ports
đối chiếu Web URL local với TCP listener thật và PID; Stats là snapshot
hiện tại; Utilities kiểm tra Node/pnpm/Git; Hosts chỉ đọc; Config Files mở
config phổ biến bằng editor mặc định, không liệt kê `.env` thật.

**Run / Stop** chỉ quản lý cây process dashboard đã khởi chạy. Windows dùng
taskkill `/T /F`; macOS dùng process group SIGTERM rồi SIGKILL khi cần.
Process ngoài app không bị dừng. Đóng app có Stop All and Quit / Cancel.
Running xác nhận process sống, không khẳng định HTTP readiness.

Command và Web URL có thể để trống. Khi cần dùng, app mở Edit Repository tại
trường tương ứng. URL không thiết lập port cho server: repo/script/env của
bạn quyết định port thực tế. Cùng một OpsDesk có thể dùng:

| Repository | Command             | Web URL                 |
| ---------- | ------------------- | ----------------------- |
| server     | `pnpm run dev`      | `http://localhost:3003` |
| client     | `pnpm run dev`      | `http://localhost:3000` |
| mobile     | command của repo    | có thể trống            |
| broker     | `docker compose up` | có thể trống            |

Logs có stdout/stderr/lifecycle, 1.500 chunks gần nhất, mỗi chunk tối đa
32.000 ký tự. Có Follow output và theme độc lập cho in-app output.

## Git

Menu repo có Copy Path, Open Terminal, Pull Code, Git Commit và Push.
App hiển thị root/branch thực tế, hỗ trợ subproject monorepo; checkout dùng
chung được khóa để không chạy hai Git mutation đồng thời.

- Pull Code: `git pull --ff-only`, không tự stash/merge/rebase.
- Git Commit: chọn file → Stage selected → nhập message → Review staged
  files → xem toàn bộ Final staged list → Confirm Commit.
- File đã stage từ terminal cũng được hiển thị; file chưa stage không bị
  commit. Staged list đổi bên ngoài thì phải review lại.
- Stage/commit/hook lỗi giữ message và tải staged list thực tế.
- Push độc lập với commit, push HEAD đúng upstream remote/ref, không force.
- Thiếu upstream thì dùng terminal thiết lập
  `git push --set-upstream <remote> <branch>` theo repo của bạn.
- Dùng credentials/hooks trên máy, không lưu Git password/token trong app.

## Theme và Settings

Logo DevBench dùng biểu tượng terminal riêng, đồng bộ sidebar, favicon và icon
Windows. SVG gốc tại `src/assets/dev-bench.svg`, PNG/ICO tại `build/`; chạy
`pnpm icons` để tạo lại sau khi sửa SVG. Xem [brand assets](build/README.md).

Phong cách lấy cảm hứng từ [Clarity](https://clarity.design/): header navy,
sidebar trung tính, card phẳng, viền rõ và góc bo nhỏ. Giữ primary NestJS
`#f23551` ở Light/Dark, icon Lucide và pattern shadcn/Radix/Tailwind.
Label luôn nằm phía trên input/select/textarea, không floating label.
Font giao diện Segoe UI với **Be Vietnam Pro** dự phòng; log dùng
**JetBrains Mono**. Font dự phòng Latin/Vietnamese đóng gói để dùng offline.
License font trong `docs/licenses/`.

- Sidebar có một nút ghi theme hiện tại, mở dropdown Light / Dark / System;
  không còn hai mục Themes và mode riêng. Settings vẫn có appearance tiles.
- Sidebar thu gọn thành dải icon bằng nút Collapse/Expand sidebar, nhớ trạng
  thái sau mở lại app. Rê chuột lên icon để xem tên; mobile dùng drawer đầy đủ.
- Logo nằm trong sidebar cao toàn cửa sổ. Header và body thuộc cột nội dung;
  nút Collapse/Expand sidebar nằm ở đầu header.
- App: System / Light / Dark; preference blueDark cũ chuyển thành Dark.
- In-app terminal/log: Follow app / Midnight / Paper / Rose.
- External terminal giữ theme riêng của ứng dụng terminal đó.
- Settings quản lý project sets, export/import, account và cloud backup.

## Google account và cloud backup

Backend nằm trong repo riêng **dev-bench-server**, dùng ASP.NET Core .NET 10 +
MongoDB. Repo này chỉ chứa desktop Electron + React; không cần .NET để build
desktop và không tự khởi động backend. Backend không phụ thuộc source desktop.

Xem [hướng dẫn kết nối](docs/cloud-setup.md). Trong Settings → Account & backup,
nhập origin của backend rồi Continue with Google. Tài khoản được tạo tự động
ở lần đăng nhập Google đầu tiên. MongoDB URI/client secret chỉ ở backend.

Mỗi account có nhiều snapshot cấu hình theo máy. Back up current set tạo bản
mới; restore luôn import thành set mới. Source code vẫn qua Git. Local Export
JSON / Import JSON và quản lý project không cần tài khoản hoặc backend.

## Lưu trữ và migration

`%APPDATA%\DevBench\projects.json` trên Windows, Electron userData tương ứng
trên macOS. Khi mở lần đầu sau đổi tên, app sao chép dữ liệu từ thư mục
`Dev Bench` cũ sang `DevBench` nếu thư mục mới chưa tồn tại; giữ nguyên bản cũ.
Workspace schema v3 chứa sets, project groups và repositories.
Đọc v1/v2 tự migrate, giữ ID repo, lưu bản gốc `projects.json.legacy.bak`.
Các entry cũ chuyển thành project một repo. Backup schema v2 vẫn import v1.

JSON ghi tuần tự qua temp + rename; JSON hỏng không bị âm thầm ghi đè. Process
state không lưu. Google session mã hóa bằng OS safeStorage, gắn API origin;
không xuất cùng config. Nếu reset máy/keychain, đăng nhập Google lại.

## Kiểm thử và đóng gói

```powershell
pnpm typecheck
pnpm test
pnpm test:e2e
pnpm test:cloud-e2e
pnpm dist:win
```

- Vitest/RTL và integration desktop dùng repo/process tạm trong `.test-artifacts/`.
- Test backend/MongoDB chạy độc lập tại repo `dev-bench-server`.
- Desktop smoke dùng production renderer/Electron thật, xác nhận project
  nhiều repo, sidebar, Card/Table, Ports, theme, Git và JSON restore.
- Cloud smoke kết nối harness .NET ở repo API; xem `docs/cloud-setup.md`.
  Google identity được giả lập chỉ trong test, không có bypass trong production.
- Native folder/save/quit dialog được stub lựa chọn trong test. Clipboard,
  terminal/browser OS và Google credentials thật có bước nghiệm thu thủ công.
- Windows installer: `release/DevBench-Setup-1.1.0.exe`.
- Unpacked: `release/win-unpacked/DevBench.exe`.
- Kiểm tra unpacked bằng
  `node scripts/smoke-electron.mjs "release/win-unpacked/DevBench.exe"`.
- Bộ cài chưa ký số. Source backend không được đưa vào desktop package.

### macOS

Có adapter Terminal.app, login PATH, process group và `pnpm dist:mac`
(DMG/ZIP Apple Silicon + Intel). Workflow `.github/workflows/macos.yml` dùng
macOS runner. Chưa chạy trên Mac thật hoặc phát hành DMG trong môi trường
Windows này; cần nghiệm thu terminal/PATH/stop tree, build và signing trên Mac.
Hướng dẫn theo [electron-builder](https://www.electron.build/v26/docs/features/multi-platform-build/).

Kết quả tách backend .NET: [verification-repo-split.md](docs/verification-repo-split.md).

Kết quả theme Clarity hiện tại: [verification-clarity.md](docs/verification-clarity.md).
Kết quả giao diện bản 1.1.3 trước đó: [verification-1.1.3.md](docs/verification-1.1.3.md).

## Xử lý lỗi nhanh

| Lỗi                              | Cách xử lý                                             |
| -------------------------------- | ------------------------------------------------------ |
| Thiếu Git/pnpm                   | Utilities kiểm tra PATH; cài tool, mở terminal/app mới |
| Folder không tồn tại sau restore | Edit Repository, Browse lại folder                     |
| Failed / command exit code       | Xem Logs, kiểm tra command/dependencies của repo       |
| EADDRINUSE / Port Conflict       | Xem Ports/PID; tự xử lý process ngoài app nếu cần      |
| Pull diverged / local changes    | Xử lý history/thay đổi trong terminal                  |
| Google redirect_uri_mismatch     | Kiểm tra OAuth Web client và callback URI đúng origin  |
| Session expired                  | Đăng nhập Google lại; máy khác không bị đăng xuất      |
| Backup API không kết nối được    | Kiểm tra backend/HTTPS/network; local vẫn dùng được    |

Quy tắc được điều chỉnh từ OpsDesk Client và front-end-origin tại
`CLAUDE.md`, `.claude/rules` và `docs/rules`. Không sửa hai repo tham chiếu.
