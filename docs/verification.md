# Kết quả kiểm tra trên Windows

## Hộp thoại Git Commit hai cột, Select all — 27/11/2026

- Unstaged và Staged nằm hai cột (cửa sổ hẹp thì xếp dọc), mỗi danh sách cao
  tối đa `min(30vh, 320px)` và cuộn riêng. Thêm ô **Select all** ba trạng
  thái và số tệp đã chọn. Stage chia `git add` theo đợt để không vượt giới hạn
  dòng lệnh Windows.
- Thêm trạng thái push (chưa push, chậm hơn upstream, Pushed, No upstream) ở
  thẻ repository, bảng Projects và hộp thoại Commit; tính từ ref cục bộ, không
  tự fetch. Bước xác nhận có thêm nút **Commit and Push**, bị tắt khi branch
  không có upstream; push lỗi thì commit vẫn giữ và báo lỗi riêng.
- `pnpm typecheck`, `pnpm build` qua; test 85/86, lỗi còn lại là test cũ
  `disables Git cleanly for a non-repo`.
- Bản build với repo Git tạm và bare remote, 600 tệp unstaged, 6 tệp staged:
  hai cột, danh sách bị giới hạn chiều cao, Select all, stage đủ 600 tệp,
  Commit and Push tới remote tạm, trạng thái đổi sang Pushed; cửa sổ 1280×860,
  900×560 và 740×620, Light/Dark, không có page error. Chưa thử push tới remote
  thật, chưa chạy lại `scripts/smoke-electron.mjs`, chưa tạo installer.

## Reload Git changes trên phiên app đang chạy — 26/11/2026

- Thêm nút Reload Git changes cạnh ô tìm kiếm trong All projects; nút làm mới
  dữ liệu repo và tạm khóa khi đang tải. Cập nhật số đếm ngay trong bảng.
- Khi main process đang chạy chưa có trường `changedFiles`, renderer đọc số
  tệp từ API Git snapshot sẵn có. Summary mới có số đếm không gọi snapshot
  bổ sung; lỗi từng repo giữ hàng và có chẩn đoán trong tooltip.
- Kiểm tra trực tiếp cửa sổ Project đang dùng: trước sửa cả hai repo hiện
  Unavailable; sau sửa hiện 157 cho dev-bench-client và 9 cho dev-bench-server,
  không cần đóng app. Không stage/commit/push các repo này.
- `pnpm build` (gồm typecheck), 76/76 test và `git diff --check` qua. Chrome
  headless xác minh nút Reload lấy dữ liệu mới và cập nhật bảng, polling 5 giây,
  Light/Dark, không có page error hoặc tràn viewport. Chưa tạo lại installer.

## Trạng thái thay đổi Git trong bảng repository — 26/11/2026

- Bỏ cột Run command trong bảng repo. Cột Thay đổi Git chỉ hiện số tệp thay
  đổi; không có thay đổi hoặc Git không khả dụng thì hiện `Unavailable`.
  Trang chi tiết giữ nhãn số tệp chưa commit. Đếm mỗi tệp một lần, gồm
  staged/unstaged/untracked, bỏ qua ignored. Không tự stage, commit hay push.
- Summary đọc working tree; cập nhật qua polling 5 giây và cơ chế làm mới sau
  thao tác Git hiện có.
- `pnpm build` (gồm typecheck) và 73/73 test qua. Bộ test chạy ngoài sandbox
  với Git ceiling tại `.test-artifacts` để Git hooks/taskkill hoạt động và
  fixture không nhận nhầm repo cha. Có cảnh báo jsdom/xterm sẵn có.
- Chrome headless trên bản build với IPC giả lập: xác minh số tệp thay đổi,
  `Unavailable`, không có cột Run command, menu Commit/Push, polling cập nhật
  trạng thái, không có page error hoặc tràn viewport.
- Đã xem ảnh cả Light/Dark: `.test-artifacts/git-changes-light.png` và
  `.test-artifacts/git-changes-dark.png`. Chưa tạo lại hoặc kiểm tra installer.
- Xác minh bổ sung bằng Electron mới với profile tạm, IPC và Git thật:
  bảng hiển thị 156 tệp cho `dev-bench`, 9 tệp cho `dev-bench-server` tại thời
  điểm kiểm tra. Không stage/commit/push hoặc sửa profile đang dùng. Phiên dev
  khởi động trước thay đổi ở main process thiếu trường số đếm vì Vite chỉ cập
  nhật renderer. Đã xử lý bằng API snapshot tương thích, xem mục Reload ở trên.

## Opacity scrollbar 40% — 26/11/2026

- Theo yêu cầu mới, giảm thumb native/fallback/xterm từ 70% xuống 40%.
  Xterm dùng alpha hex 66; không đổi primary chung hoặc kích thước 6px.
- Typecheck, Prettier và `git diff --check` qua.

## Làm dịu màu scrollbar — 26/11/2026

- Giữ chiều rộng/cao 6px, giảm thumb xuống primary ở opacity 70% cho thanh
  cuộn native, fallback và xterm (cả thường/hover/active).
- Không đổi token primary chung hoặc màu button/sidebar. Typecheck và
  `git diff --check` qua.

## Thanh cuộn mảnh, màu primary — 26/11/2026

- Scrollbar native Electron rộng/cao 6px, thumb bo tròn dùng primary hiện
  tại, track/corner trong suốt, bỏ nút mũi tên. Trình duyệt khác dùng thin.
- Xterm dùng slider 6px và theme primary cho trạng thái thường/hover/active.
- Đã kiểm tra Electron: scrollbar width=height=6px, thumb rgb(15,118,110)
  khớp primary #0f766e. Ảnh: `.test-artifacts/scrollbar-primary.png`.
- Build/typecheck và 71/71 test qua (test chạy ngoài sandbox, Git ceiling
  tại fixture); có các cảnh báo node-pty/jsdom sẵn có. Chưa tạo lại installer.

## Bỏ Processes — 26/11/2026

- Bỏ mục Processes khỏi sidebar desktop/mobile. URL /processes cũ chỉ chuyển
  về /projects; không còn trang danh sách process riêng trùng Projects.
- Giữ Run/Stop và các dịch vụ quản lý process. Đã kiểm tra trên Electron:
  sidebar không có Processes và URL cũ chuyển về Projects.

## Sticky header và max-height bảng — 26/11/2026

- Projects, Ports, Stats dùng .table-scroll: overflow auto, tối đa
  min(65vh, 640px), header sticky nền đặc. Bảng repo lồng có header các cột
  và vùng cuộn riêng tối đa min(40vh, 320px); vẫn cuộn ngang khi cần.
- Electron với 30 project: nội dung cao 3198px, vùng cuộn 519px; cuộn 250px
  thì header giữ nguyên tọa độ y=305.59375. Đã xem ảnh kết quả tại
  `.test-artifacts/sticky-tables-nLcvFy/projects-sticky.png`.
- Build/typecheck qua. 14/14 test giao diện/router liên quan và 71/71 toàn
  bộ test qua khi chạy ngoài sandbox với Git ceiling tại fixture. Lần chạy
  trong sandbox có lỗi quyền MSYS/taskkill; lần chạy ngoài sandbox vẫn có
  cảnh báo node-pty AttachConsole và jsdom scrollTo nhưng test đều pass.
- Chưa tạo lại installer; không chạy lại smoke Electron cũ vốn còn giả định
  Dashboard/Card-Table từ phiên bản trước.

## Bỏ Card Image khỏi Project — 26/11/2026

- Form Thêm/Sửa Project chỉ còn tên và mô tả. Đã bỏ upload/preview ảnh,
  schema/lưu ảnh, helper xử lý ảnh, style và bản dịch liên quan.
- Test tương thích xác nhận cấu hình và backup cũ có `coverImage` vẫn đọc/
  restore được; dữ liệu project được giữ, trường ảnh được bỏ qua khi lưu/export.
- `pnpm build` (gồm `pnpm typecheck`): qua. `pnpm test`: 32/32 qua khi chạy
  ngoài sandbox, đặt Git ceiling tại `.test-artifacts`. Lần chạy trong sandbox
  có 4 lỗi quyền Git shell/taskkill; chạy ngoài sandbox đã xác nhận tất cả qua.
- Prettier các file code đã sửa, `node --check scripts/smoke-electron.mjs`
  và `git diff --check`: qua. Vẫn có cảnh báo jsdom/Select và Rollup/chunk size.
- Đã cập nhật smoke script bỏ thao tác upload ảnh; chưa chạy Electron smoke
  hoặc nghiệm thu Light/Dark qua giao diện, chưa tạo lại installer.

## URL backend mặc định từ .env — 26/11/2026

- Thêm `.env` local được Git bỏ qua và `.env.example` chỉ có public API origin.
  Dev/build chỉ nhúng `DEV_BENCH_API_ORIGIN` vào Electron main; server đã lưu
  trong Settings được ưu tiên và không bị ghi đè bởi default của bản build mới.
- `pnpm typecheck` và `pnpm build`: qua. Ba test mới trong
  `tests/cloud-settings.test.ts`: qua (default, server đã lưu, cấu hình thủ công).
- Kiểm tra loader với file tạm: `.env`, mode development/production, shell env
  ưu tiên, nhúng origin bằng esbuild và từ chối HTTP public/path/query/credentials: qua.
- `pnpm test`: 31 qua, 1 lỗi ở test Git `disables Git cleanly for a non-repo`
  (`summary.reason` là undefined). File test Git và service Git không được sửa
  trong task này. Có warning jsdom scrollTo và Rollup/chunk size khi test/build.
- Chưa nghiệm thu qua Electron UI hoặc bản installer, chưa thử Google OAuth thật.

## Card màu và chiều sâu — 25/11/2026

- Primary giữ nguyên #f23551 ở Light/Dark. Canvas Light #f7f8fb, card trắng;
  Dark nâng card lên #2c313b. Card có viền nhẹ, shadow mềm và dùng radius 16px
  trong thang bo góc sẵn có; control vẫn 8px.
- Dashboard/Stats dùng rose/lilac/mint/sand, icon tối, số lớn và thanh tỷ lệ
  từ số liệu thật. Grid 4 cột desktop, 2 cột vừa, 1 cột nhỏ.
- Card project chưa có ảnh dùng artwork gradient/orbit bằng CSS; có ảnh dùng
  ảnh phủ card, overlay tối, CTA mở project trắng, nút Run giữ primary.
- Đã xem ảnh Light/Dark và hai trạng thái ảnh/artwork.

## Ảnh nền project tùy chọn — 25/11/2026

- Form Thêm/Sửa project có chọn/xóa/preview ảnh; dùng quy tắc dialog-form
  local, phần field cuộn độc lập với header/footer.
- PNG/JPEG/WebP tối đa 8 MB, chuẩn hóa trong renderer thành WebP tối đa
  1200×900, dữ liệu giới hạn 750.000 ký tự và validate qua shared schema.
  Lưu trên máy và theo export/import JSON; config/backup cũ vẫn đọc được.
- Server hiện chuẩn hóa project chỉ giữ id/name/description, chưa giữ cover;
  không sửa repo server hoặc tuyên bố ảnh đi theo cloud backup.
- Unit test lưu/đọc lại, restore JSON, xóa ảnh, từ chối URL ngoài và quá cỡ.
  Smoke Electron chọn file sai/đúng, preview, save, xóa để trở về artwork,
  chọn lại, restart và export JSON có cover; primary cả hai mode không đổi.
- `pnpm build` (gồm typecheck), 25/25 test (ngoài sandbox với Git ceiling tại
  `.test-artifacts`), smoke Electron, Prettier, `git diff --check` qua.
- Report/ảnh: `.test-artifacts/electron tiếng Việt UA7sqk/`. Ảnh núi trong
  smoke là fixture vẽ bằng canvas, không phải ảnh mặc định được đưa vào app.
  Chưa tạo lại installer. Clipboard readback trong smoke cần xác nhận OS riêng.

## Button theo ảnh MUI — 25/11/2026

- Giữ primary #f23551, chữ trắng và bo góc control 8px của app; không tự
  uppercase. Contained có elevation, outline viền primary/nền trong suốt,
  text có hover tint nhẹ; hover/disabled/focus/loading tiếp tục hoạt động.
- Dùng rõ variant primary cho Run/Lưu/submit, outline cho thao tác phụ,
  text cho Hủy/Sửa/mở project/refresh nhẹ. Giữ secondary và variant trạng thái;
  default/ghost vẫn tương thích như trước. Không thêm dependency MUI.

## Textfield theo ảnh thứ hai — 25/11/2026

- Input, textarea, select: Light nền #fafbfc, viền #dfe3e8, shadow nhẹ;
  Dark nền #242830, viền #3e4550, shadow trung tính tương ứng.
  Giữ bo góc 8px; focus primary, error và disabled riêng.
- Đã xem form Light/Dark và kiểm tra computed radius, nền, shadow, variant,
  text-transform. Ảnh: `.test-artifacts/buttons-fields-Li2yAO/`.
- Typecheck/build, 24/24 test (ngoài sandbox với Git ceiling tại fixture),
  smoke Electron, Prettier và `git diff --check` qua.
  Report smoke cuối: `.test-artifacts/electron tiếng Việt Rrwof8/`.
  Chưa tạo lại installer cho thay đổi này.

## Shadow item sidebar active — 25/11/2026

- Thêm shadow mềm pha primary cho `.layout-navigation .bg-sidebar-accent`,
  token riêng Light/Dark. Áp dụng chung cho item active ở sidebar/tree/drawer.
- Typecheck/build, Prettier và `git diff --check` qua. Bộ test lần đầu đạt
  23/24: test config gặp Windows EPERM khi rename; chạy lại riêng config
  đạt 3/3. Không sửa logic cấu hình trong thay đổi CSS này.
- Đã xem ảnh Electron Light/Dark và kiểm tra computed box-shadow.
  Ảnh: `.test-artifacts/active-sidebar-shadow-N63L26/`.
  Chưa tạo lại installer.

## Shadow sidebar — 25/11/2026

- Sidebar desktop và drawer mobile dùng shadow riêng theo Light/Dark.
  Smoke xác nhận computed shadow và đã xem ảnh Light/Dark.

## Terminal tối mặc định — 25/11/2026

- Thứ tự 4 palette: Tối (midnight), Trắng (paper), Theo ứng dụng, Rose.
  Khi chưa có preference hợp lệ, mặc định midnight; giữ lựa chọn đã lưu.
- Smoke xác nhận default midnight và nền tối #10141e; đã xem ảnh terminal.

## Repo từ sidebar — 25/11/2026

- Click repo mở `/projects/$projectId/repositories/$repositoryId`: thông tin,
  Run/Stop, Open Web, menu Edit/Copy Path/Terminal/Git và log trực tiếp của repo.
  Trang này không có Run/Stop toàn project. Reload tự mở lại nhánh project.
- Log dùng chung component với drawer hiện có; theo dõi output chỉ cuộn vùng
  log, không kéo cả trang. Repo không còn tồn tại không hiện log/nút Run cũ.
- Smoke chạy/dừng hai repo fixture độc lập, xác nhận PID repo còn lại giữ
  nguyên, không lẫn log, reload URL, route thiếu repo và mở từ drawer mobile.
  Đã xem ảnh desktop và cửa sổ 760×520, không tràn ngang.

## Chữ nút primary — 25/11/2026

- `primary-foreground` trắng ở cả Light/Dark, gồm text/icon trong nút primary.
  Nút destructive dùng đúng foreground riêng; sidebar active giữ quy tắc cũ.
- Typecheck/build, 24/24 test (ngoài sandbox, Git ceiling tại `.test-artifacts`),
  smoke Electron, Prettier và `git diff --check` qua.
- Report/ảnh cuối: `.test-artifacts/electron tiếng Việt MCrVZG/`.
  Smoke được bổ sung chờ viewport/transition sau reload để kiểm tra ổn định.
  Chưa tạo lại installer cho các thay đổi này.

## Viền và bo góc — 25/11/2026

- Viền Light #e5e5e5, Dark #343943; border input giảm độ tương phản xuống
  #c5c5c5 / #4b5260. Viền header/sidebar theo token chung.
- Radius cơ bản 8px, lớn 12px, rất lớn 16px. Primary và sidebar active giữ
  bảng màu hiện có.

## Terminal trắng mặc định — 25/11/2026

- Giữ đúng 4 palette: Trắng (paper), Theo ứng dụng, Midnight, Rose.
  Trắng dùng #ffffff cả khi app Dark; mặc định khi preference thiếu/không hợp
  lệ. Lựa chọn hợp lệ đã lưu tiếp tục được dùng, kể cả khi restore backup.
- `pnpm build` (gồm typecheck), 24/24 test ngoài sandbox với Git ceiling tại
  `.test-artifacts`, Prettier và `git diff --check` qua.
- Smoke Electron qua: mặc định paper, đúng 4 lựa chọn, nền trắng trong Dark,
  radius computed 8px; các kiểm tra font/sidebar/persistence/export/import qua.
- Đã xem ảnh terminal trắng trong Dark, Dashboard Dark và Settings Light.
  Report/ảnh: `.test-artifacts/electron tiếng Việt KGqiD4/`.
  Chưa tạo lại installer cho thay đổi này.

## Sidebar active — 25/11/2026

- Item active dùng nền primary #f23551, chữ/icon lấy màu background theo
  Light/Dark; icon active có glyph solid riêng, inactive giữ outline.
- Smoke Electron xác nhận màu nền/chữ/fill và glyph solid của Dashboard,
  Projects, Processes, Ports, Stats, Utilities, Hosts, Config Files, Settings.
  Đã xem ảnh Dark đầy đủ và Light thu gọn; drawer mobile vẫn hoạt động.

## Chọn font giao diện — 25/11/2026

- Settings → Appearance → Interface font: System default, Be Vietnam Pro,
  JetBrains Mono. Đổi ngay toàn giao diện, giữ sau restart; log vẫn monospace.
- Font Latin/Vietnamese 400/500/600/700 đóng gói offline; nội dung mới có bản
  dịch tiếng Việt. Đã xem ảnh giao diện chọn font.
- Smoke kiểm tra cả ba lựa chọn, computed font, preview, font của log, restart
  và export/import JSON có khôi phục font. Backup thiếu font giữ lựa chọn
  hiện tại; server hiện chưa giữ trường font, không sửa repo server.
- `pnpm build` (gồm typecheck) qua. Bộ test 24/24 qua ngoài sandbox với
  `GIT_CEILING_DIRECTORIES` trỏ tới `.test-artifacts`; sau điều chỉnh tương
  thích backup cũ, chạy lại 4/4 test workspace và smoke Electron đều qua.
- Prettier và `git diff --check` qua. Report/ảnh bản cuối trong
  `.test-artifacts/electron tiếng Việt clDxSO/`; chưa tạo lại installer.

## Theme VS Code — 25/11/2026

- Client `dev-bench`: Dark dùng nền nội dung/card #282c34, sidebar/header
  #21252b, viền #3b4048 theo ảnh tham chiếu. Light dùng nền trắng và chrome
  xám trung tính. Giữ primary NestJS #f23551, dropdown Light/Dark/System,
  sidebar thu gọn và các palette terminal độc lập.
- `pnpm build` qua, bao gồm `pnpm typecheck`, renderer Vite và Electron bundle.
- Smoke Electron qua trên production renderer; đã xem ảnh Dashboard Dark và
  Settings Light. Kiểm tra mode theo hệ thống, lưu theme qua restart, dropdown,
  bàn phím, sidebar thu gọn và cửa sổ 760×520 đều qua.
- Report và ảnh trong `.test-artifacts/electron tiếng Việt iaQpps/`.
- `pnpm test`: 24/24 qua ngoài sandbox với `GIT_CEILING_DIRECTORIES` trỏ tới
  `.test-artifacts`. Biến này chỉ áp dụng cho phiên test để fixture non-repo
  không nhận repo client từ thư mục cha; chạy không có biến này đạt 23/24.
- Prettier trên các file source/rule đã sửa và `git diff --check` đều qua.
- Lần chạy trong sandbox bị chặn Git hooks/MSYS, taskkill và rename; đã chạy
  lại ngoài sandbox để phân biệt với lỗi sản phẩm.
- Chưa tạo installer hoặc kiểm tra lại bản cài đặt cho thay đổi này.

## English / Tiếng Việt — 24/11/2026

English mặc định; đổi trong Settings → Language, lưu lựa chọn trên máy.
24/24 test, typecheck/build, smoke Electron English và hai ngôn ngữ đều qua.
Chi tiết và giới hạn: [verification-i18n.md](verification-i18n.md).

## Placeholder form — 24/11/2026

- Rà soát mọi placeholder trong routes; form project/repository/project set
  dùng hướng dẫn chung. Mô tả form và empty state không còn tên project riêng.
- Thêm rule không dùng tên project/repository/công ty hoặc dữ liệu riêng của
  người dùng làm ví dụ; không thay dữ liệu đã lưu.
- Typecheck, 17/17 test và production build qua; `git diff --check` qua.
- Chưa tạo lại installer cho thay đổi nội dung này.

Bản mới nhất: [logo terminal và icon Windows](verification-logo.md).
Theme trước đó: [Clarity](verification-clarity.md).
Kết quả theme trước đó: [dashboard 1.1.3](verification-1.1.3.md).
Phần dưới là kết quả bản 1.0; tính năng 1.1 ở
[verification-1.1.0.md](verification-1.1.0.md).

Ngày: 23/11/2026, múi giờ Asia/Bangkok.
Môi trường: Windows 11 x64, OS build 10.0.26200; Node.js 24.20.0,
pnpm 10.4.1, Git for Windows 2.47.1. Runtime đóng gói: Electron 45.4.1.

## Rule và phạm vi thay đổi

- Đã đọc spec trong thư mục dev-bench, 11 rule của front-end-origin,
  CLAUDE.md cùng hai convention và dialog-form skill của ops-desk-client.
- Viết CLAUDE.md riêng cho Dev Bench, copy/adapt rule trước khi triển khai.
  Chi tiết tại `docs/rules/README.md`.
- Không sửa source, rule hoặc cấu hình của hai repo tham chiếu.
- Các thao tác Git thử nghiệm chỉ dùng repo/bare remote tạm trong
  `.test-artifacts`; không commit/pull/push repo thực của người dùng.

## Kiểm tra tự động

| Lệnh / bộ kiểm tra                                        | Kết quả                                                   |
| --------------------------------------------------------- | --------------------------------------------------------- |
| `pnpm typecheck`                                          | Qua TypeScript strict và noUnused                         |
| `pnpm test`                                               | 12 test, 4 file; cấu hình, Git, process và form           |
| `pnpm build`                                              | Qua renderer Vite và main/preload esbuild                 |
| `pnpm dist:win`                                           | Tạo NSIS x64 installer `.exe` và bản unpacked             |
| `node scripts/smoke-electron.mjs`                         | Qua trên production renderer với Electron thật            |
| Smoke với `release/win-unpacked/Dev Bench.exe`            | Qua trên app đóng gói                                     |
| Cài NSIS vào `.test-artifacts/installed-1.0.0`            | Installer exit code 0                                     |
| Smoke với `.test-artifacts/installed-1.0.0/Dev Bench.exe` | Qua cả phiên đầu và khởi động lại; command `pnpm run dev` |
| Gỡ bản test bằng uninstaller                              | Exit code 0; đã bỏ app thử nghiệm                         |

Test artifacts có report JSON và ảnh light/dark/màn hình 760×520.
Thư mục được ghi trong output của smoke script và không được đóng gói.

Bản bàn giao cuối: installer 126.384.211 byte; SHA256:
`d5fc746dfb01ed1d0c9a6a89d1995121af9bb61e541833dea159f7639e60c798`.
Checksum còn được lưu tại `release/SHA256SUMS.txt`.
Report smoke của bản đã cài cuối:
`.test-artifacts/electron tiếng Việt PMagEo/report.json`.
Đã xác nhận executable của bản test không còn và không còn đăng ký
Dev Bench trong HKCU Uninstall sau khi gỡ.

## Đối chiếu tiêu chí nghiệm thu

### 1. Thêm project và lưu cấu hình

Đã thêm hai project qua form và IPC thật, folder có dấu tiếng Việt và dấu
cách. Kiểm tra name, command, URL, UUID và Include in Run All sau khi đóng
và mở lại app. Cả hai trở về Stopped; không phục hồi Running từ JSON.

Test ConfigStore còn kiểm tra ghi đồng thời, JSON không hợp lệ không bị ghi
đè, folder không tồn tại và URL sai scheme. Native folder picker được stub
kết quả chọn trong smoke; tương tác cửa sổ chọn folder Windows chưa tự động
kiểm tra trực tiếp.

### 2. Copy Path, Open Terminal, Open Web

Copy Path đã ghi chính xác đường dẫn có dấu và dấu cách vào clipboard
Windows; kiểm tra bằng Electron clipboard API trên cả app đóng gói/đã cài.

Đã kiểm tra Web URL trống mở form cấu hình; đang chạy vẫn sửa được URL,
folder/command bị khóa. Open Web dùng shell.openExternal với URL đã lưu;
Open Terminal ưu tiên wt.exe và fallback PowerShell.

Việc browser mặc định thực sự mở trang và terminal thực sự hiện đúng cwd
còn cần kiểm tra thủ công. Các test hiện tại không giả lập rằng đã quan sát
hai cửa sổ hệ điều hành này.

### 3. Run All và log

Đã khởi động đồng thời hai HTTP server qua pnpm từ app đã cài. Bấm Run All
lần nữa giữ nguyên PID. Test service còn chạy Run và Run All đồng thời,
thêm command không tồn tại, xác nhận project khác vẫn chạy.

Đã xem stdout tiếng Việt và stderr theo từng project. Kiểm tra command
pnpm, shim `.cmd`, command exit code 7, thiếu command, folder bị di chuyển
và port conflict có `EADDRINUSE`. Runtime và trạng thái Git tách riêng.

### 4. Stop và giải phóng port

Test process thật tạo cây shell → Node parent → HTTP server; Stop dừng cây,
port được giải phóng và có thể chạy lại ngay. Project thứ hai giữ Running
và port không bị ảnh hưởng. Smoke installed app cũng chạy cây pnpm/dev-server
và dùng Stop All and Quit.

Quit Cancel giữ app; Stop All and Quit đợi dừng rồi thoát. Test thay thế
giá trị trả về của native confirmation dialog; không thao tác trực tiếp vào
cửa sổ xác nhận Windows. Lần chạy trong sandbox bị Windows chặn taskkill và
Git sh; suite chạy lại ngoài sandbox và đã qua.

### 5. Pull, stage, commit và push

Dùng checkout và bare remote local riêng đã kiểm tra:

- Pull fast-forward thành công, pull diverged bị từ chối.
- Push thiếu upstream báo lỗi; push HEAD đúng upstream khi tên branch local
  khác tên branch remote (`main` → `shared-target`). Không force.
- Stage file được chọn, giữ file khác chưa stage, rename có dấu.
- File được stage từ terminal xuất hiện trong staged list thực tế.
- Token thay đổi staged list làm commit bị từ chối và phải xem lại.
- Message tiếng Việt có dấu ngoặc kép và dấu `&` được giữ nguyên.
- Hook từ chối commit hiển thị stderr; staged files còn nguyên.
- UI giữ Commit message khi hook lỗi, tải lại staged list và commit lại được.
- Hai subproject cùng checkout không chạy đồng thời thao tác Git thay đổi
  trạng thái; hook chậm được dùng để kiểm tra khóa.
- Project ngoài Git có giải thích và các thao tác Git bị disable.

Chưa dùng remote cần credentials thật để kiểm tra network/authentication.
Không sửa credential manager hoặc cấu hình Git toàn cục để thử lỗi.

### 6. Bộ cài Windows

Đã tạo `release/Dev-Bench-Setup-1.0.0.exe`, cài per-user vào thư mục test
trong workspace bằng NSIS silent mode (exit 0), chạy smoke trên chính app
đã cài: bridge, clipboard, pnpm, Git, lưu cấu hình và mở lại đều qua.
Đã gỡ bản test bằng uninstaller (exit 0). Bộ cài và bản unpacked được giữ lại.

Installer hiện chưa ký số. Luồng cài đặt tương tác với nút Next/Browse,
Windows Terminal/browser mặc định và Git authentication thật còn cần kiểm
tra thủ công trước khi phân phối.

## Checklist thủ công còn lại

1. Chạy installer bằng giao diện, chọn thư mục cài mong muốn và mở app.
2. Dùng Browse để chọn folder có dấu/khoảng trắng trong dialog Windows thật.
3. Copy Path rồi paste vào trình soạn thảo; mở Terminal, kiểm tra prompt cwd;
   kiểm tra cả máy có Windows Terminal và máy dùng fallback PowerShell.
4. Chạy project, bấm Open Web và xác nhận browser mặc định mở đúng URL.
   Thử cả server khởi động từ terminal ngoài dashboard.
5. Dùng remote thử nghiệm có credentials riêng để kiểm tra pull/push thành
   công, sai authentication, mất mạng và pull bị thay đổi local chặn.
6. Thao tác native quit dialog bằng chuột/keyboard với cả Cancel và Stop All
   and Quit; kiểm tra máy có phần mềm bảo vệ chặn taskkill/hook nếu áp dụng.
7. Ký installer bằng certificate của đơn vị phát hành khi cần phân phối.

Build có cảnh báo dependency Zod về pure annotation và bundle renderer lớn
hơn 500 kB; build thành công. Không có kết quả lint được tuyên bố vì project
không định nghĩa lệnh lint.

## Terminal trong app và Open GitHub (2026-11-26, Windows)

Đã chạy trên bản build và bản `pnpm pack:win` (`release/win-unpacked`) với dữ
liệu và Git repo tạm: PowerShell mở tại folder repo (đường dẫn có dấu), chạy
lệnh, Ctrl+C ngắt lệnh, Ctrl+V paste, Ctrl+C copy phần bôi đen, Ctrl+R/Ctrl+W
không reload/đóng app, giữ output khi đổi tab/trang/reload, resize, palette
Midnight và Paper, Restart, exit code, hỏi trước khi thoát và dừng shell.
Nút mở trang remote Git (GitHub, GitLab) được kiểm tra bằng cách chặn
`shell.openExternal` (không mở browser).

`pnpm typecheck` và `pnpm build` qua; test 48/49. Test
`disables Git cleanly for a non-repo` lỗi vì `.test-artifacts` nằm trong Git
repository của chính project.

Còn lại: chạy installer NSIS đã cài, macOS (shell, quyền `spawn-helper`,
đóng gói), dark mode của tab Terminal và nhập liệu tiếng Việt bằng bộ gõ.

## Link remote, sắp xếp sidebar và tự điền form (2026-11-26, Windows)

Chạy trên bản build với dữ liệu và thư mục tạm: nút Mở GitHub/GitLab mở đúng
URL (chặn `shell.openExternal`); kéo thả đổi thứ tự project, repo và chuyển repo
sang project khác; menu chuột phải chuyển project/vị trí; repo đang chạy đổi
được thứ tự nhưng không đổi project; thứ tự giữ sau khi mở lại app; form tự điền
Run command và Web URL từ `package.json`. Chưa thử kéo thả bằng cảm ứng và trên
sidebar mobile.

## Palette terminal, icon con trỏ và nhớ thư mục Browse (2026-11-26, Windows)

Trên bản build với dữ liệu tạm: bốn palette Dark, White, Dracula, Rose; lựa
chọn cũ “Theo ứng dụng” về Dark; terminal dùng nền và màu ANSI Dracula; ba kiểu
con trỏ có icon riêng; Browse mở tại thư mục chọn lần trước, giữ sau khi mở lại
app (dialog hệ điều hành được giả lập). Quy đổi Dracula ⇄ `app` cho backup cloud
chỉ kiểm tra bằng unit test, chưa thử với backend thật. Dialog Windows thật cần
kiểm tra thủ công.

## Menu chuột phải và nút Stop (2026-11-26, Windows)

Trên bản build với repo và remote tạm: Run/Stop repo và project, Open Web, Copy
Path, Pull, mở hộp thoại Git Commit, Add Repository, form tự mở khi thiếu URL;
mục và nút Stop dùng màu destructive. Push và Open Terminal từ menu chưa thử
trên app thật.

## Thông báo trên header (2026-11-27, Windows)

`pnpm typecheck` và `pnpm build` qua; `pnpm test` 80/81 (lỗi còn lại vẫn là
`disables Git cleanly for a non-repo`). Trên bản build với repo tạm không có
upstream: Run project, Stop và Pull lỗi hiện toast; trang project không còn hộp
kết quả; chuông đếm mục chưa đọc; mở chi tiết, xoá một mục, xoá tất cả; đóng mở
lại app thì danh sách trống; xem panel ở Light và Dark. Run All, lỗi tải
workspace, Commit và lỗi Settings chưa thử trên app thật (Run All, Commit và
Settings cũng chưa có test riêng cho đường thông báo).
