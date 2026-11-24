# Nghiệm thu Dev Bench 1.1

Ngày 23/11/2026, Windows 11 x64 (10.0.26200), Node.js 24.20.0,
pnpm 10.4.1, Git 2.47.1, Electron 45.4.1.

## Model, migration và dữ liệu

- Project gồm nhiều repo/service; một OpsDesk đã có server/client trong test.
- Workspace v1/v2 chuyển sang v3, giữ repo ID và device ID đã có, lưu JSON
  cũ ở `.legacy.bak`. Backup v1 vẫn import được thành schema v2.
- Import/restore tạo set và ID mới, giữ quan hệ project/repo, không ghi đè
  set gốc và không chạy command. Folder chưa tồn tại vẫn nhập để sửa sau.
- Hai repo khác nhau cùng project giữ folder/command/URL/process/Git riêng.

## Kiểm tra tự động

| Check                               | Kết quả                                                                                   |
| ----------------------------------- | ----------------------------------------------------------------------------------------- |
| `pnpm typecheck`                    | Qua strict TypeScript và noUnused                                                         |
| `pnpm test`                         | 20 bài, 7 file: config, hierarchy/migration, ports, Git, process, MongoDB/account và form |
| `pnpm build`                        | Renderer, main và preload qua                                                             |
| `pnpm build:server`                 | API backend build qua                                                                     |
| `pnpm dist:win`                     | Tạo NSIS x64 `Dev-Bench-Setup-1.1.0.exe`                                                  |
| Desktop smoke source + unpacked exe | Qua project/repo, sidebar, Card/Table, ports, process, Git, theme và JSON import/export   |
| Cloud smoke source + unpacked exe   | Qua UI → IPC → HTTP → MongoDB, mã hóa token OS, restore và owner isolation                |
| NSIS cài vào thư mục test riêng     | Exit 0; bản đã cài chạy qua cả desktop smoke và cloud smoke                               |
| Gỡ bản test đã cài                  | Exit 0; executable và đăng ký uninstall đã được xóa                                       |

Report source desktop: `.test-artifacts/electron tiếng Việt M8gRll/report.json`.
Report unpacked: `.test-artifacts/electron tiếng Việt KeaM84/report.json`.
Cloud screenshot: `.test-artifacts/cloud UI tiếng Việt SOvkz9/cloud-signed-in.png`.

Report bản đã cài: `.test-artifacts/electron tiếng Việt GOoERk/report.json`.
Cloud bản đã cài: `.test-artifacts/cloud UI tiếng Việt eGknCM/cloud-signed-in.png`.

Cloud test dùng MongoDB thật tạm thời; Google identity boundary được stub
trong test harness. Không có bypass Google login trong production API/app.
Đã kiểm tra state/PKCE sai và replay bị từ chối, session hash/expiry/logout,
nhiều phiên cùng account, account khác không xem/restore backup của nhau.

## Giao diện

- Đã tạo OpsDesk project và hai repo qua form thật (folder picker chọn sẵn
  đường dẫn fixture bằng native dialog stub).
- Sidebar mở rộng project thấy hai repo; Dashboard/Projects/Processes/Ports/
  Stats và Settings đều điều hướng được.
- Card/Table hoạt động; mode lưu localStorage.
- Hai server thật chạy qua pnpm, TCP listeners của child Node được gán về
  đúng repo nhờ cây PID từ Windows CIM.
- Primary tính từ CSS là #f23551; font Be Vietnam Pro/Vietnamese được load.
- System đổi theo media query; Light/Dark và terminal Rose độc lập, giữ sau
  khi mở lại app. Chụp ảnh light/dark và màn hình 760×520, không overflow ngang.
- Copy Path readback đã qua ở các lần cuối. Một số lần trước clipboard phiên
  Windows trả rỗng cả Electron và PowerShell; không sửa quyền clipboard hệ
  thống và không dùng mock clipboard để ghi nhận thành công.

## Git và process

- Run/Run All đồng thời không tạo instance trùng; command sai không chặn
  repo khác; pnpm .cmd shim, tự exit và EADDRINUSE có test.
- Stop cây shell → parent → server giải phóng port, chạy lại được, không dừng
  repo khác. Quit Cancel/Stop All được kiểm tra với stub lựa chọn dialog.
- Git dùng repo/bare remote local riêng: ff-only, diverged, thiếu upstream,
  upstream có tên khác, stage chọn lọc, rename/Unicode, final staged token,
  hook lỗi, message giữ nguyên và khóa chung checkout.

## Đóng gói

Installer hiện tại 122.045.045 byte, SHA256:
`0fa2b00f02af09157269afd536c74668e312e299586be30180b7883782c6955c`.

Đã kiểm tra app.asar có main/preload/renderer, font và font license; không
có thư mục server hoặc `.env` backend. Desktop không cần node_modules lúc
chạy vì main/preload và renderer đã bundle.

## Cần xác nhận trong môi trường của bạn

1. Điền `server/.env`, chạy backend và đăng nhập Google thật với OAuth client
   của bạn; callback URI/type Web application/consent Test users phải khớp.
2. Nếu dùng nhiều máy, deploy backend HTTPS và kiểm tra MongoDB network access.
3. Thử folder/save/quit dialog Windows thật; terminal, browser mặc định và
   authentication Git với remote riêng. Test tự động không đăng nhập Google
   hay đổi credentials của bạn.
4. Chạy macOS workflow hoặc build/test trên Mac: Terminal.app, PATH, stop
   process group, DMG/ZIP Apple Silicon/Intel. Chưa có máy Mac để chạy các
   bước này trong phiên Windows; chưa bàn giao DMG đã kiểm thử.
5. Ký installer khi phân phối chính thức. MCP/Aliases chưa triển khai, không
   đặt mục điều hướng rỗng cho các chức năng này.

Build có cảnh báo dependency Zod pure annotation và renderer chunk >500 KB;
build thành công. Không tuyên bố lint passing vì không có script lint.
