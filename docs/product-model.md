# Mô hình tính năng DevBench 1.1

```text
Google account
└── Các snapshot của bộ cấu hình theo máy
    └── Project set: Work laptop / Personal Mac / …
        ├── OpsDesk (project)
        │   ├── server (repository/service)
        │   ├── client (repository/service)
        │   ├── mobile (repository/service)
        │   └── broker (repository/service)
        └── Project khác
```

Repository có thêm `workingDirectory` tùy chọn (tối đa 4096 ký tự) cho Run/Run All:
để trống dùng folder repo, tương đối tính từ repo, tuyệt đối dùng trực tiếp.
Git/Copy Path/Open Terminal giữ folder repo. Đường dẫn được lưu trong cấu hình,
JSON/cloud backup; dữ liệu cũ thiếu field vẫn dùng thư mục repo.

Project là nhóm có tên và mô tả. Repo/service mới có folder, command, URL,
Include in Run All, Git và process riêng. Service không dùng Git vẫn được
thêm bình thường, ví dụ broker có command `docker compose up`.

Một project có thể chứa nhiều repo độc lập hoặc nhiều subfolder của monorepo.
Tên repo nên mô tả vai trò: server, client, mobile, broker.

## Điều hướng đã triển khai

| Mục                  | Hành vi                                                                                                   |
| -------------------- | --------------------------------------------------------------------------------------------------------- |
| Dashboard            | Tổng project/repo/process, nhóm startup, project cards và hoạt động repo                                  |
| Projects             | Card/Table, tìm kiếm, thêm/sửa tên và mô tả project                                                       |
| Project detail       | Repo/service con, thêm/sửa repo, Run project, Stop project                                                |
| Sidebar project tree | Expand/collapse Projects và từng project để thấy repo con                                                 |
| Ports                | Cổng từ Web URL localhost + TCP listener thật; gán theo cây PID, lọc project/repo, tùy chọn xem unmanaged |
| Stats                | Số liệu tức thời theo project: repo, Running, Failed, Git checkout, startup selection                     |
| Utilities            | Kiểm tra Node.js/pnpm/Git trên PATH, phiên bản hoặc thông tin lỗi                                         |
| Hosts                | Đọc hosts file hệ điều hành, không sửa                                                                    |
| Config Files         | Liệt kê config phổ biến của repo, mở bằng editor mặc định; loại trừ `.env` thật                           |
| Settings             | App theme, theme output, bộ cấu hình, Google account và backup/import/export                              |

Không tạo mục MCP/Aliases rỗng. Chưa có MCP server hoặc quản lý shell aliases
trong bản này. Stats không tạo lịch sử hoạt động giả.

Trang Processes trùng Projects đã bỏ; URL cũ chuyển về /projects. Các bảng
có header sticky nền đặc và max-height min(65vh, 640px), cuộn bên trong;
bảng repo lồng dùng min(40vh, 320px) với header riêng.

Sidebar thu gọn thành dải icon và nhớ lựa chọn trên thiết bị. Khi thu gọn,
Projects mở danh sách project; mở rộng sidebar để dùng cây repo. Mobile luôn
dùng drawer đầy đủ. Một nút Light/Dark/System hiển thị theme đang chọn và mở
dropdown có dấu chọn; không còn mục Themes/mode riêng.

Layout có hai cột: sidebar toàn chiều cao chứa logo; cột nội dung gồm header
và body. Nút thu gọn/mở rộng nằm trong header. Brand vẫn hiện dưới dạng icon
khi sidebar thu gọn; body và danh sách navigation cuộn độc lập khi cần.

Theme hiện tại lấy cảm hứng VS Code theo ảnh tham chiếu: Dark dùng nền nội dung
#282c34, sidebar/header #21252b và viền dịu #343943; Light dùng canvas #f7f8fb,
card trắng và chrome xám trung tính. Card có shadow nhẹ, góc bo cơ bản 8px (lớn 12px,
rất lớn 16px); primary teal đậm #0f766e ở cả light/dark.
Icon Lucide, shadcn/Radix/Tailwind vẫn được giữ. Label cố định
trên control, không floating label. Segoe UI với Be Vietnam Pro dự phòng tiếng
Việt, JetBrains Mono cho log. Card thống kê dùng bốn tông hồng/tím/mint/kem,
icon tối, số liệu lớn và tỷ lệ thực; vẫn giữ primary #0f766e.
Form Thêm/Sửa project chỉ có tên và mô tả; bỏ trường ảnh nền card.
Cấu hình và backup cũ vẫn đọc được, trường ảnh cũ được bỏ qua.
Sidebar active dùng nền primary, chữ/icon màu trắng và icon
solid. Sidebar có shadow nhẹ; chữ/icon nút primary màu trắng trong cả hai mode.
Button theo ảnh MUI, giữ màu primary, không uppercase: contained có elevation,
outlined viền primary, text có hover nhẹ; giữ bo góc 8px. Dùng primary cho hành
động chính, outline cho hành động phụ, text cho Hủy/Sửa/điều hướng nhẹ.
Textfield dùng nền dịu, viền mảnh và shadow nhẹ theo ảnh thứ hai; giữ bo góc
8px, đồng bộ Light/Dark.
Bấm repo trong sidebar mở trang riêng với hai tab Log (mặc định) và Terminal
cùng các thao tác của đúng repo đó, không có Run/Stop toàn project. Theo dõi
log chỉ cuộn vùng output. Trang project và repository không có ô chọn bộ cấu hình.
Tab Terminal là shell tương tác thật (PowerShell trên Windows, login shell trên
macOS) tại folder repo. Mỗi repo một shell, giữ nguyên khi đổi tab hoặc trang;
đóng khi đổi folder hoặc thoát app. Đã gõ lệnh trong terminal thì thoát app sẽ
hỏi lại. Terminal dùng palette đã chọn trong Settings.
Repo có remote Git hiện nút Mở GitHub, Mở GitLab hoặc Mở trang repository tùy
host; link dựng lại từ host và đường dẫn nên không mang theo token trong remote.
Settings cho chọn font hệ thống, Be Vietnam Pro hoặc JetBrains Mono;
áp dụng ngay, lưu trên máy và trong export/import JSON. Backup chưa có font giữ
lựa chọn hiện tại khi restore. Log vẫn dùng monospace.
Terminal có 4 palette: Tối (Midnight, mặc định và đứng đầu), Trắng, Dracula, Rose;
giữ lựa chọn hợp lệ đã lưu. Theme Trắng dùng nền #ffffff kể cả khi app Dark.

## Sắp xếp project và repository

Trên cây project ở sidebar: kéo thả để đổi thứ tự project, đổi thứ tự repo hoặc
thả repo vào project khác; chuột phải có Chuyển lên / Chuyển xuống / Chuyển
sang project. Thứ tự được lưu trong cấu hình, áp dụng cho mọi danh sách và đi
cùng export/backup. Repo đang chạy vẫn đổi được thứ tự trong project nhưng
không chuyển sang project khác.

## Thông báo

Mọi thao tác báo bằng toast; trang project không còn hộp kết quả hay đoạn lỗi
chen giữa nội dung. Lỗi và kết quả có chi tiết được giữ trong danh sách mở từ
nút chuông trên header, dùng chung toàn app. Thông báo trùng gộp thành một mục
kèm số lần; tối đa 200 mục, nội dung dài bị cắt bớt phần đầu. Không ghi ra đĩa
nên đóng app là mất. Hộp thoại, form, tab Logs/Terminal vẫn hiện lỗi tại chỗ.

## Tự điền khi chọn thư mục

Đổi thư mục repo hoặc working directory thì form đề xuất Run command và Web URL:
`package.json` (script dev/start, package manager theo lock file, port theo cờ
trong script, config Vite, `PORT` trong `.env` hoặc mặc định của framework),
project .NET (`dotnet run`, `launchSettings.json`) hoặc Docker Compose. Chỉ đọc
tệp, không chạy lệnh; từ `.env` chỉ lấy số port. Giá trị bạn đã gõ được giữ
nguyên; mở form sửa mà không đổi đường dẫn thì không thay đổi gì.

## Run và Git

- Run/Stop ở repo chỉ tác động process do app khởi chạy cho repo đó.
- Với Docker Compose, app quản lý CLI process, không quản lý lifecycle của
  container trong Docker daemon. Dùng lệnh Docker thích hợp để dừng container
  nếu nó vẫn chạy sau khi CLI bị dừng.
- Run project chạy toàn bộ repo trong project, kể cả repo không chọn startup.
- Run All toàn workspace chỉ chạy repo có Include in Run All; repo đang hoạt
  động được bỏ qua. Batch luôn trả kết quả từng repo.
- Git Commit/Pull/Push chỉ thao tác trên repo cụ thể. Nếu nhiều repo trỏ cùng
  checkout, dùng cùng khóa Git; không tự commit/push toàn project.
- Folder/command/project assignment không sửa qua UI khi repo đang chạy.
- Chuyển/import bộ cấu hình yêu cầu dừng các process đang chạy trước.

## Ports

- Available: không thấy TCP listener ở cổng local được cấu hình.
- Listening: listener nằm trong cây PID của repo do dashboard chạy.
- Conflict: cổng cấu hình đang bị process khác giữ; có thể là server bạn tự
  chạy từ terminal, không nhất thiết là lỗi của project.
- Detected: phát hiện thêm cổng thực tế của repo ngoài Web URL đã lưu.
- Có thể xem listener hệ thống/unmanaged, nhưng không có nút giết process
  bên ngoài app. TCP Listening không đồng nghĩa HTTP đã sẵn sàng.
- Windows dùng CIM/Get-NetTCPConnection; macOS dùng ps/lsof. Poll 10 giây,
  có Refresh và cache ngắn; quyền OS không đủ sẽ hiển thị lỗi.

## Bộ cấu hình và sao lưu

Local workspace v3 lưu device ID/name, active set, danh sách project và repo.
Backup/export schema v2 giữ cấu trúc project → repo, paths, commands và theme.

- Đọc được file cấu hình v1, workspace v2, backup v1; repo ID được giữ khi
  migrate, nhóm cũ được chuyển thành project một repo. Bản JSON gốc được lưu
  ở `projects.json.legacy.bak` trước lần migrate.
- Snapshot cloud bất biến, gắn account và tên máy nguồn. Mỗi lần Back up là
  bản mới; không tự đồng bộ/ghi đè giữa các máy. Danh sách hiển thị tối đa 500
  snapshot gần nhất của account.
- Import/restore luôn tạo set mới, cấp lại ID và giữ quan hệ project/repo.
  Không tự chạy command. Folder chưa tồn tại được liệt kê để sửa sau import.
- Source code đồng bộ qua Git. Backup không gồm source files, runtime/log,
  session token hay Git credentials. Command strings được giữ nguyên nên
  cần tự kiểm tra nếu bạn từng đặt secret trực tiếp trong command.
- Local config vẫn dùng được khi offline hoặc chưa đăng nhập.

## Tài khoản

Ngôn ngữ giao diện được chọn riêng trên từng máy trong Settings → Language:
English mặc định hoặc Tiếng Việt. Lựa chọn áp dụng ngay cho giao diện và
hộp thoại của app, lưu qua lần mở lại, không thuộc snapshot cloud. Giữ nguyên
project, port, Dashboard, tên riêng, tên bộ cấu hình/project/repository,
command, đường dẫn và log/diagnostic từ công cụ bên ngoài.

Continue with Google dùng browser mặc định. Backend xác minh Google identity,
tạo account theo `sub`, có session riêng cho từng thiết bị. Sign out chỉ thu
hồi phiên đó; không đăng xuất máy khác. Token server chỉ lưu hash; desktop
mã hóa bằng safeStorage của OS và ràng buộc với API origin.

MongoDB và Google client secret ở backend. App chỉ lưu API URL và session
của người dùng. Setup tại [cloud-setup.md](cloud-setup.md).
