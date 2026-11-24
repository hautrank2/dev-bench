# Kết quả kiểm tra trên Windows

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
Theme hiện tại: [Clarity](verification-clarity.md).
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
