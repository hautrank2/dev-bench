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

Đặt URL backend mặc định trong `.env` ở gốc repo:

```dotenv
DEV_BENCH_API_ORIGIN=https://your-api.example.com
```

File mẫu: `.env.example`. Khởi động lại dev/build sau khi sửa; URL đã Save server
trong Settings vẫn được ưu tiên. Chỉ đặt URL công khai, không đặt secret backend.
Xem [hướng dẫn .env](docs/cloud-setup.md#đặt-url-backend-qua-env).

## Sử dụng

App mặc định **English**. Đổi tại **Settings → Language → Tiếng Việt**;
giao diện đổi ngay và ghi nhớ lựa chọn khi mở lại. Các từ `project`, `port`,
`Dashboard`, tên riêng và dữ liệu bạn nhập được giữ nguyên.

1. **Add Project**: đặt tên/mô tả, ví dụ OpsDesk.
2. Mở project, **Add Repository** cho server, client, mobile, broker…
3. Browse folder, đặt command (`pnpm run dev`), Web URL và startup selection.
   Nếu lệnh chạy ở thư mục khác root repo, nhập **Working directory (optional)**:
   `apps/web` (tương đối từ repo) hoặc đường dẫn tuyệt đối. Để trống dùng thư mục
   repo. Run/Run All dùng thư mục này; Git/Copy Path/Open Terminal vẫn dùng repo.
   Thư mục chạy phải tồn tại, được lưu khi export/import JSON và cloud backup;
   dừng repository trước khi thay đổi thư mục chạy.
4. Run từng repo hoặc **Run project** để chạy tất cả repo con.
5. **Run All** ở Dashboard/Projects chỉ chạy repo đã chọn Include in Run All;
   bỏ qua repo đang hoạt động, báo riêng lỗi từng repo.

Project list hỗ trợ **Card / Table**, ghi nhớ mode. Sidebar mở rộng Projects
và từng project để xem repo con. Run/Stop thực hiện ngay trong Projects; Ports
đối chiếu Web URL local với TCP listener thật và PID; Stats là snapshot
hiện tại; Utilities kiểm tra Node/pnpm/Git; Hosts chỉ đọc; Config Files mở
config phổ biến bằng editor mặc định, không liệt kê `.env` thật.

Trang Processes đã bỏ; URL cũ chuyển về Projects. Bảng Projects, Ports và
Stats có header cố định khi cuộn, cao tối đa min(65vh, 640px). Bảng repo bên
trong có vùng cuộn riêng tối đa min(40vh, 320px).

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

## Terminal trong app

Trang repository có tab **Log** và **Terminal**. Terminal là shell tương tác
thật tại thư mục repo (PowerShell trên Windows, `$SHELL` trên macOS), dùng
xterm.js và node-pty. Shell được giữ khi đổi tab hoặc trang, lưu 200.000 ký tự
output gần nhất; **Khởi động lại terminal** đóng shell cũ cùng lệnh đang chạy.
Copy bằng `Ctrl+C` khi đang bôi đen, paste bằng `Ctrl+V`. Menu **Open Terminal**
vẫn mở terminal bên ngoài.

## Sắp xếp trên sidebar

Kéo thả project hoặc repository để đổi thứ tự; thả repo lên tên project khác để
chuyển sang đó. Chuột phải có **Chuyển lên**, **Chuyển xuống** và **Chuyển sang
project** cho thao tác bằng bàn phím. Dừng repo trước khi chuyển project.

Menu chuột phải của repository có Run/Stop, Open Web, mở trang remote, Open
Terminal, Copy Path và nhóm **Git** (Pull Code, Git Commit, Push). Menu của
project có Run/Stop project và Add Repository. Nút và mục Stop dùng màu đỏ.

## Thông báo

Kết quả thao tác và lỗi hiện bằng toast ở góc dưới. Lỗi và kết quả có nội dung
(Pull, Push, Commit, chạy cả project) được lưu lại ở nút chuông trên header: bấm
từng mục để xem chi tiết, xoá từng mục hoặc **Xóa tất cả**. Danh sách chỉ nằm
trong bộ nhớ (tối đa 200 mục) và mất khi đóng app.

## Tự điền Run command và Web URL

Nút **Browse** mở tại thư mục bạn chọn lần trước (nhớ riêng trên máy, giữ sau
khi mở lại app; thư mục đã xoá thì mở ở mặc định của hệ điều hành).

Chọn hoặc gõ đường dẫn thư mục, form đọc `package.json`, project .NET hoặc file
Compose để điền **Run command** và **Web URL**. Chỉ điền vào ô trống, ô còn giá
trị mặc định hoặc ô đã được tự điền trước đó; hãy kiểm tra lại port trước khi lưu.

## Git

Menu repo có Copy Path, Open Terminal, Pull Code, Git Commit và Push.
Repo có remote Git hiện thêm nút **Mở GitHub**, **Mở GitLab** hoặc **Mở trang
repository** (ưu tiên `origin`; hỗ trợ HTTPS và SSH, không hỗ trợ SSH alias).
App hiển thị root/branch thực tế, hỗ trợ subproject monorepo; checkout dùng
chung được khóa để không chạy hai Git mutation đồng thời.

- Pull Code: `git pull --ff-only`, không tự stash/merge/rebase.
- Git Commit: chọn file (hoặc **Select all**) → Stage selected → nhập message →
  Review staged files → xem toàn bộ Final staged list → Confirm Commit.
  Unstaged và Staged nằm thành hai cột, mỗi cột có chiều cao tối đa và cuộn
  riêng; chọn rất nhiều file được `git add` theo nhiều đợt.
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

Phong cách lấy cảm hứng từ VS Code theo ảnh tham chiếu: Dark dùng nền nội dung
`#282c34`, sidebar/header `#21252b`, viền dịu `#343943`; Light dùng canvas
`#f7f8fb`, card trắng và chrome xám trung tính. Card có chiều sâu nhẹ;
bo góc cơ bản 8px
(cỡ lớn 12px, rất lớn 16px). Giữ primary teal đậm
`#0f766e` ở Light/Dark, icon Lucide và pattern shadcn/Radix/Tailwind.
Label luôn nằm phía trên input/select/textarea, không floating label.
Font giao diện Segoe UI với **Be Vietnam Pro** dự phòng; log dùng
**JetBrains Mono**. Font dự phòng Latin/Vietnamese đóng gói để dùng offline.
License font và thư viện terminal trong `docs/licenses/`.

Settings → Appearance → Interface font: chọn Mặc định hệ thống, Be Vietnam Pro
hoặc JetBrains Mono. Áp dụng ngay, nhớ sau khi mở lại app và đi kèm export/import
JSON; log vẫn dùng monospace. Các font đóng gói hoạt động offline. Backup cũ
hoặc cloud chưa có trường font sẽ giữ lựa chọn hiện tại trên máy khi restore.

- Sidebar có một nút ghi theme hiện tại, mở dropdown Light / Dark / System;
  không còn hai mục Themes và mode riêng. Settings vẫn có appearance tiles.
- Item sidebar active dùng nền primary, chữ/icon màu background của theme và
  icon solid; áp dụng cả sidebar đầy đủ, thu gọn và drawer mobile.
- Sidebar có shadow nhẹ. Bấm repository trong cây project để mở trang riêng
  với tab Log / Terminal, Run/Stop, Open Web và menu thao tác đúng repository đó.
  Tải lại URL repo tự mở nhánh project; log chỉ tự cuộn bên trong vùng output.
- Chữ và icon trên nút primary dùng màu trắng ở cả Light/Dark.
- Button theo ảnh MUI: contained có shadow, outlined viền primary, text có
  nền hover nhẹ; giữ primary hiện tại, không tự viết hoa nhãn, giữ bo góc 8px.
  Phân cấp primary cho hành động chính, outline cho hành động phụ và text
  cho Hủy/Sửa/điều hướng nhẹ; giữ secondary và các variant trạng thái.
- Input, textarea và select dùng nền dịu, viền xám mảnh và shadow nhẹ theo
  ảnh textfield; giữ bo góc 8px, có focus primary và trạng thái lỗi riêng.
- Card thống kê dùng tông hồng, tím nhạt, mint và kem; số liệu lớn và thanh
  tỷ lệ lấy từ dữ liệu thật. Card project không có trường ảnh tùy chỉnh.
- Form Thêm/Sửa project gồm tên và mô tả, không có trường ảnh nền card.
- Sidebar thu gọn thành dải icon bằng nút Collapse/Expand sidebar, nhớ trạng
  thái sau mở lại app. Rê chuột lên icon để xem tên; mobile dùng drawer đầy đủ.
- Logo nằm trong sidebar cao toàn cửa sổ. Header và body thuộc cột nội dung;
  nút Collapse/Expand sidebar nằm ở đầu header.
- App: System / Light / Dark; preference blueDark cũ chuyển thành Dark.
- In-app terminal/log có 4 theme: Tối / Trắng / Dracula / Rose.
  Tối (Midnight) đứng đầu và là mặc định khi chưa có lựa chọn hợp lệ;
  lựa chọn đã lưu vẫn được giữ. Lựa chọn cũ “Theo ứng dụng” chuyển về Tối.
  Backup cloud gửi Dracula dưới tên `app` vì API chưa có giá trị mới.
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

Kết quả theme VS Code hiện tại: [verification.md](docs/verification.md).
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
