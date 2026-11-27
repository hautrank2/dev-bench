# Implementation Plan — DevBench

## Thư mục chạy riêng cho repository (2026-11-26)

- Thêm `workingDirectory` tùy chọn trong schema/form; trống dùng thư mục repo,
  tương đối resolve từ repo, tuyệt đối dùng trực tiếp.
- Run/Run All dùng cwd riêng và kiểm tra thư mục; khóa đổi cwd khi đang chạy.
  Git/Copy Path/Open Terminal giữ thư mục repo. Preview restore kiểm tra cả hai.
- Lưu trong cấu hình, JSON backup và chuẩn hóa cloud server; không đổi version.
- Kiểm tra chạy thực tế, lỗi đường dẫn, persistence/form, build/test desktop,
  restore/build/publish API; ghi giới hạn nghiệm thu UI và cloud thật.

## Bỏ Card Image khỏi Project (2026-11-26)

- Bỏ field ảnh trong form Thêm/Sửa Project, xử lý upload, schema và lưu ảnh.
- Dọn style/bản dịch ảnh không còn dùng; cập nhật tài liệu và smoke script.
- Giữ khả năng đọc cấu hình/backup cũ bằng cách bỏ qua trường ảnh.
- Kiểm tra tương thích dữ liệu cũ, typecheck, test và production build.

## URL backend mặc định từ .env (2026-11-26)

- Tạo `.env` local được Git bỏ qua và `.env.example` chỉ có public API origin.
- Dev/build dùng loader chung, chỉ nhúng `DEV_BENCH_API_ORIGIN` vào Electron main.
- Cloud service dùng origin mặc định khi chưa có server được lưu trong Settings.
- Kiểm tra default mới, ưu tiên server đã lưu, typecheck/test/build; không đưa
  Google secret hoặc MongoDB credentials vào desktop.

## English / Tiếng Việt (2026-11-24)

- English mặc định; thêm bộ chọn Language trong Settings, lưu lựa chọn trên máy.
- Danh mục dịch tập trung và React Context; dịch UI/aria/placeholder, trạng thái,
  toast, lỗi form và hộp thoại native. Không dịch dữ liệu hay enum nội bộ.
- Giữ project, port, Dashboard và tên riêng; không dịch command/path/Git output/log.
- Đồng bộ lựa chọn cho Electron main; kiểm tra đổi ngôn ngữ khi form đang mở,
  persistence qua restart, mặc định English, dynamic counts và tiếng Việt ở viewport nhỏ.
- Chạy typecheck/test/build, English smoke cũ và kiểm tra Electron hai ngôn ngữ.

Đã hoàn tất; 24/24 test, typecheck/build, smoke English và smoke hai ngôn ngữ
đều qua. Chi tiết tại [verification-i18n.md](docs/verification-i18n.md).

## Placeholder chung cho form (2026-11-24)

- Rà soát placeholder toàn bộ form; thay tên project/repository cụ thể bằng
  mô tả chung. Bỏ ví dụ project riêng trong mô tả form và empty state.
- Ghi quy tắc không dùng dữ liệu riêng làm ví dụ; giữ placeholder kỹ thuật chung.
- Kiểm tra lại source, typecheck/test/build; không thay dữ liệu người dùng.
- Đã hoàn tất: rà soát toàn bộ placeholder trong src/routes, không còn tên
  project riêng trong UI; 17/17 test, typecheck và production build qua.

## Logo terminal và icon Windows (2026-11-24)

- Logo vector riêng: cửa sổ terminal navy, prompt trắng, cursor và khung màu
  primary #f23551. Giữ silhouette rõ tại 16–32px, hình ảnh ấn tượng ở sidebar.
- Một SVG gốc cho sidebar và favicon; tạo PNG/ICO nhiều kích thước từ cùng SVG.
- Gắn icon vào BrowserWindow, executable/installer Windows và copy tài nguyên
  cho cả dev lẫn production. Không dùng icon Electron mặc định khi chạy app.
- Kiểm tra typecheck/test/build, icon native, sidebar expanded/collapsed/mobile;
  đóng gói Windows để kiểm tra tài nguyên icon trong executable khi môi trường cho phép.
- Đã hoàn tất: 17/17 test, build, native WM_GETICON và icon nhúng EXE qua;
  bộ cài NSIS đã tạo. Chi tiết tại `docs/verification-logo.md`.

## Theme lấy cảm hứng Clarity (2026-11-24)

- Tham chiếu clarity.design: header navy, sidebar trung tính, card phẳng,
  viền rõ, góc bo nhỏ và typography phân cấp nhẹ.
- Giữ React/shadcn/Radix/Tailwind, icon Lucide, primary #f23551 cho light/dark.
  Segoe UI với font offline hiện có làm fallback, không thêm thư viện UI.
- Label cố định phía trên control bằng FieldLabel, không floating label.
- Đồng bộ tokens, layout, dashboard/settings/tables và style primitives;
  giữ hành vi navigation, IPC, form validation và local data.
- Kiểm tra typecheck/test/build và Electron light/dark, form focus/filled/error,
  sidebar collapse và viewport nhỏ.
- Đã hoàn tất; 17/17 test và smoke Electron qua, ảnh light/dark/form được kiểm
  tra. Chi tiết tại `docs/verification-clarity.md`.

## Tách repo backend .NET (2026-11-24)

- Giữ Git history của desktop tại repo hiện tại; tạo `dev-bench-server` độc lập,
  sau khi kiểm tra sẽ đặt cạnh thư mục desktop để có thể push hai repo riêng.
- Chuyển Fastify sang ASP.NET Core .NET 10, giữ HTTP contract Google OAuth,
  PKCE/state/nonce, session theo thiết bị và MongoDB collections hiện có.
- Backend tự sở hữu validation, tests, Docker, CI và hướng dẫn cấu hình.
  Không import source TypeScript của desktop hoặc đưa secrets vào desktop.
- Xóa Node backend/dependencies/scripts/test backend khỏi repo desktop;
  giữ Google sign-in qua Electron main và mọi chức năng local.
- Kiểm tra build/test backend, typecheck/test/build desktop và ghi giới hạn.
- Đã triển khai; kết quả và giới hạn tại `docs/verification-repo-split.md`.

Trạng thái: đã triển khai, build bộ cài và kiểm thử trên Windows.
Kết quả thực tế cùng các kiểm tra OS thủ công còn lại nằm trong
`docs/verification.md` (1.0) và `docs/verification-1.1.0.md` (1.1).
CLAUDE.md và rule đã được điều chỉnh trước khi code.

Nâng cấp 1.1 đã hoàn tất theo `docs/upgrade-plan.md`: project chứa nhiều
repo, sidebar mở rộng, Card/Table, Ports, theme và Google/MongoDB backup.
Mô hình hiện tại nằm trong `docs/product-model.md`; phần dưới giữ kế hoạch
khởi tạo 1.0 để tham chiếu lịch sử.

## Sửa lỗi cuộn Settings

- Giới hạn html/body/root và app shell trong chiều cao cửa sổ.
- Giữ vùng nội dung là nơi cuộn trang; Settings dùng chiều cao vùng chứa.
- Kiểm tra chuyển section và cuộn đến cuối ở cửa sổ thường, thấp và hẹp;
  header giữ nguyên, document không cuộn và không có khoảng trống bên dưới.
- Hoàn tất bản vá 1.1.1; kết quả tại `docs/verification-1.1.1.md`.

## Giao diện Finarrow và sidebar 1.1.2

- Cập nhật rule trước code: cyan/peach, nền chuyển sắc và bề mặt trong mờ,
  dark mode dùng teal đậm; giữ font Việt và theme terminal độc lập.
- Gộp sidebar theme thành dropdown Light/Dark/System có trạng thái chọn.
- Thêm thu gọn/mở rộng sidebar, giữ lựa chọn sau mở lại app; mobile giữ drawer.
- Logo nằm trong sidebar cao toàn cửa sổ; cột nội dung gồm header và body.
  Nút thu gọn/mở rộng chuyển vào header theo yêu cầu mới nhất.
- Kiểm tra menu bằng bàn phím, điều hướng collapsed, persistence, light/dark,
  cửa sổ nhỏ và lỗi hai scroll; build bộ cài Windows mới.
- Hoàn tất; kết quả tại `docs/verification-1.1.2.md`.

## Theme dashboard và NestJS primary 1.1.3

- Cập nhật rule theo ảnh mới: nền xám nhạt, card/sidebar trắng, bo góc mềm,
  viền mảnh và shadow nhẹ; dark dùng slate trung tính.
- Primary #f23551 cho cả hai mode; giảm màu nền trang trí, card thống kê
  đầu tiên dùng rose đậm để tương ứng card nổi bật trong ảnh.
- Giữ layout sidebar/logo, dropdown theme, thu gọn và terminal palette.
- Kiểm tra light/dark, scroll và desktop smoke; tạo bộ cài Windows mới.
- Đã triển khai; kết quả tại `docs/verification-1.1.3.md`.

## Căn cứ và phạm vi

- Đặc tả: `dev-bench-spec.md` trong thư mục hiện tại.
- Đích triển khai: `D:\me\vibe\dev-bench`.
- Tham chiếu quy tắc: `D:\BecamexIDC\AI\front-end-origin\.claude\rules`.
- Đã đọc toàn bộ 11 rule, gồm cấu trúc component, form, dialog, theme,
  typography, popover, image, async select và class định vị.
- Không tìm thấy `CLAUDE.md` trong working tree hoặc danh sách file được Git
  theo dõi của `front-end-origin` tại thời điểm khảo sát.
- Không sửa source, cấu hình hoặc dữ liệu của `front-end-origin`.
- Môi trường hiện tại là Windows, có Node.js 24.20.0, pnpm 10.4.1 và Git
  2.47.1. Các phiên bản dependency sẽ được xác nhận lúc triển khai.

## 1. Khởi tạo và quy ước

- Electron + React 19 + TypeScript strict + Vite + Tailwind CSS v4,
  shadcn/ui, lucide-react; quản lý dependency bằng pnpm và lưu lockfile.
- Tái sử dụng các primitive và token phù hợp từ repo tham chiếu, đọc các
  dependency đi kèm trước khi sao chép. Không sao chép dữ liệu hay env.
- React Context cho state chia sẻ, TanStack Query cho truy vấn qua IPC,
  TanStack Router cho màn hình; React Hook Form + Zod cho form.
- Dùng `type`, arrow function, named export; không `any`, không non-null
  assertion, không MUI, không Zustand, không tạo `src/features`/`src/store`.
- Component có logic dùng `index.tsx`, `hook.ts`, `type.ts`. Form dialog
  có component Dialog và Form riêng; schema Zod ở `type.ts`.
- Nhãn giao diện bằng tiếng Anh theo spec. Tài liệu hướng dẫn bằng tiếng Việt.

## 2. Kiến trúc dự kiến

```text
electron/
  main.ts                 # lifecycle, window, xác nhận thoát
  preload.ts              # bridge theo từng hành động
  ipc/                    # handler, kiểm tra payload và nguồn gọi
  services/
    config.ts             # JSON, schema, ghi an toàn
    processes.ts          # chạy/dừng, log, Run All
    git.ts                # repo, branch, stage, commit, pull, push
    system.ts             # folder picker, clipboard, terminal, browser
shared/
  contracts.ts            # schema và type dùng chung main/preload/renderer
src/
  api/api-list/           # lớp gọi bridge có kiểu dữ liệu
  components/ui/          # primitive shadcn
  components/projects/   # form project, modal commit, panel logs
  app/_dashboard/      # dashboard, hook, type
  providers/             # Query/Context/theme
  lib/
  types/
  utils/
  index.css
  typoset.css
tests/                    # integration với process và Git thật
docs/
  verification.md
```

Bridge không expose `ipcRenderer` hoặc API shell tổng quát cho renderer.
Bật context isolation, tắt Node integration; kiểm tra input ở main và tra
project theo ID trước mọi hành động. Chỉ cho mở URL HTTP/HTTPS hợp lệ.

## 3. Cấu hình và thao tác hệ điều hành

- Project có ID ổn định, name, folder, run command, web URL và cờ Run All.
- Lưu cấu hình có version trong thư mục userData của Electron, ghi tuần tự
  qua file tạm và thay thế an toàn; báo lỗi JSON hỏng, không âm thầm ghi đè.
- Kiểm tra folder tồn tại; hỗ trợ dấu tiếng Việt, khoảng trắng và subproject
  monorepo. Chọn folder bằng Windows dialog, gợi ý name từ tên folder.
- Copy Path có toast; Open Terminal ưu tiên Windows Terminal, fallback
  PowerShell, bảo toàn đường dẫn có ký tự đặc biệt.
- Open Web dùng browser mặc định và URL đã lưu, không phụ thuộc trạng thái
  process. Thiếu command/URL thì mở form đúng trường cần bổ sung.

## 4. Quản lý tiến trình

- State machine riêng cho mỗi project: Stopped, Starting, Running, Stopping,
  Failed; không lưu runtime state vào cấu hình.
- Khóa thao tác trước khi bắt đầu bất đồng bộ để Run và Run All không tạo
  hai lần chạy đồng thời. Run All báo kết quả từng project, tiếp tục khi một
  project lỗi hoặc thiếu command; bỏ qua project đang chạy.
- Chạy command qua shell Windows, tách working directory khỏi command,
  hỗ trợ executable shim như `pnpm.cmd`.
- Thu stdout/stderr và lỗi spawn/exit; giới hạn bộ đệm log, bảo toàn Unicode,
  stream log qua preload và làm sạch listener khi đóng panel.
- Running biểu thị process còn chạy, không ngầm xác nhận HTTP readiness.
- Stop dừng cây process thuộc lần chạy đó, đợi và xác nhận kết thúc; báo lỗi
  nếu dừng thất bại, không can thiệp server được chạy từ terminal bên ngoài.
- Khi đóng app còn process: native dialog có Stop All and Quit / Cancel.
  Chỉ thoát sau khi dừng thành công, giữ app mở và báo lỗi nếu không dừng được.

## 5. Git và đồng bộ checkout

- Resolve repo root, Git directory và branch thực tế từ folder project;
  hiển thị cả repo và branch, hỗ trợ subproject, xử lý detached HEAD.
- Project không phải repo vẫn dùng các thao tác khác; disable Git cùng
  giải thích. Xử lý rõ thiếu Git, folder bị di chuyển và lỗi xác thực.
- Khóa thao tác thay đổi Git theo checkout đã chuẩn hóa, kể cả nhiều
  project cùng checkout; trạng thái Git độc lập với trạng thái process.
- Pull Code gọi `git pull --ff-only`; giữ thông tin lỗi gốc, phân biệt thiếu
  upstream, diverged branch, thay đổi local, network/authentication.
- Commit modal đọc working tree và staged thực tế, cho chọn file để stage;
  dùng output NUL-delimited để giữ đường dẫn đặc biệt/rename chính xác.
- Trước commit tải lại toàn bộ staged list, hiển thị để người dùng xác nhận;
  nếu staged list thay đổi ngoài app thì cập nhật và yêu cầu xác nhận lại.
- Commit chỉ khi có message và staged files; truyền argv riêng, giữ hooks;
  lỗi stage/commit giữ message và refetch staged list thực tế.
- Push đọc remote và ref upstream hiện tại, push HEAD đúng ref đó, không
  force; thiếu upstream thì báo lỗi và hướng dẫn thiết lập trong terminal.
- Refresh branch và Git status sau mỗi thao tác và khi app lấy lại focus.

## 6. Giao diện

- Dashboard mỗi project một hàng: tên, folder, repo/branch, process status,
  Git status; toolbar Add Project và Run All.
- Run/Stop và Open Web luôn dễ bấm; Logs và menu chứa các thao tác còn lại.
- Form Add/Edit có đủ trường và lỗi theo field; dùng Controller, FieldSet,
  FieldGroup, FieldLabel, FieldError theo rule.
- Dialog/Menu/Sheet dùng primitive shadcn; không tự dựng floating panel.
- Semantic theme tokens cho light/dark/blueDark, typography bằng semantic
  HTML; cài đặt theme trong Sheet, header cao 50px.
- Class định vị đặt đầu className cho các vùng có nghĩa; hàng project có
  `data-project-id`, control icon có accessible label.
- Có loading/error/empty state; logs và danh sách dài cuộn bằng bàn phím;
  kiểm tra màn hình hẹp/thấp và thao tác focus trong dialog.

## 7. Kiểm thử và đóng gói

- Typecheck và build renderer/main/preload.
- Vitest kiểm tra validation, lưu/đọc cấu hình và migration/version lỗi.
- Integration process trên Windows với fixture folder có dấu/khoảng trắng:
  stdout/stderr, thiếu command, lệnh lỗi, concurrent Run/Run All, tự exit,
  stop process con, port được giải phóng và chạy lại.
- Integration Git dùng repo tạm và bare remote riêng: fast-forward pull,
  diverged/local changes, thiếu upstream, stage có chọn lọc, rename,
  message tiếng Việt có ngoặc kép, commit hook lỗi, push đúng upstream,
  khóa cùng checkout. Không dùng repo làm việc thật để commit/push thử.
- React Testing Library kiểm tra form validation và commit failure giữ
  message/cập nhật staged list.
- Chạy thử Electron trên Windows, kiểm tra folder picker, clipboard,
  terminal, browser, persistence và xác nhận thoát với process đang chạy.
- Cấu hình electron-builder tạo bộ cài Windows NSIS `.exe`; thử build và
  kiểm tra app đóng gói khi môi trường cho phép.
- Ghi riêng bước đã chạy thành công và bước cần xác nhận thủ công; không
  ghi nhận đã kiểm tra cài đặt, GUI hay signing nếu chưa thực hiện.

## 8. Bàn giao

- Source và pnpm lockfile, cấu hình build, bộ cài nếu build thành công.
- README: cài Git/Node.js/pnpm, chạy dev, build installer, vị trí JSON,
  thêm hai project mẫu port 3000/3003, xử lý lỗi thường gặp.
- `docs/verification.md`: kết quả thực tế theo sáu tiêu chí nghiệm thu,
  lệnh kiểm thử và giới hạn còn lại trước khi phát hành.

## Cập nhật quy tắc triển khai

Đã tham khảo `D:/me/ops-desk/ops-desk-client/CLAUDE.md` và các convention
được import. Bộ rule local yêu cầu nêu kế hoạch trước khi sửa và tiếp tục
theo công việc được giao, không chờ một lượt duyệt riêng.

## Bố cục hai repo theo thư mục cha

- `dev-bench/` chỉ là thư mục chứa; desktop ở `dev-bench-client/`, API .NET ở `dev-bench-server/`.
- Mỗi thư mục con có `.git` riêng; giữ lịch sử và các thay đổi chưa commit.
- Đã cập nhật tên repo trong tài liệu và đường dẫn dependency sau khi di chuyển.
