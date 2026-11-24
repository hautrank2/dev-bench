# Nâng cấp tài khoản, project sets và theme

## Bổ sung mô hình theo yêu cầu mới

- Account -> bộ cấu hình theo máy -> project -> repo/service.
- OpsDesk là project; server/client/mobile/broker là các repo/service có
  folder/command/URL/Git/process riêng. Run project chạy nhóm repo; Git chỉ
  thao tác trên repo cụ thể, không tự commit/push toàn project.
- Workspace v3/backup v2 giữ nhóm project và các repo. Migrate file cũ thành
  project một repo, bảo toàn ID repo và cấu hình. Import vẫn tạo set mới.
- Sidebar Dashboard / Projects mở rộng / Processes / Ports / Stats /
  Utilities / Hosts read-only / Config Files / Settings.
- Projects có Card/Table lưu lựa chọn; project detail hiển thị các repo.
- Ports đối chiếu cổng local cấu hình với TCP listeners thật và cây PID do
  app sở hữu, phân biệt Listening / Available / Conflict. Không giết process
  ngoài app. Stats từ dữ liệu hiện có; không dựng lịch sử giả.
- Chỉ hiển thị tính năng đã triển khai; không tạo trang MCP/Aliases rỗng.

1. Điều chỉnh CLAUDE.md/rule trước code. Theo hai ảnh Nest: primary #f23551,
   nền trung tính, Be Vietnam Pro tiếng Việt, System/Light/Dark, Settings
   page và theme riêng cho vùng terminal/log.
2. Workspace JSON v2: device ID/name, nhiều project sets, active set;
   migrate v1. Chuyển set khi không còn process của dashboard đang chạy.
3. Export JSON qua Save dialog; import thành set mới, không ghi đè/khởi chạy.
   Giữ path cũ kể cả khi chưa tồn tại để người dùng sửa sau reset máy.
4. Backend riêng `dev-bench-server`: ASP.NET Core .NET 10 + MongoDB
   (thay Fastify khi tách repo); Google OpenID Connect qua browser hệ thống. Account
   theo Google sub; session từng thiết bị, hash ở server, mã hóa ở desktop.
5. Cloud là snapshot bất biến theo account/device/set, backup thủ công;
   restore xác nhận import set mới. Không đồng bộ source/process hoặc chạy xa.
6. Bổ sung adapter macOS, process group/PATH, scripts và macOS CI; ghi rõ
   giới hạn nếu không có máy Mac để nghiệm thu.
7. Test migration/set isolation/import, OAuth state/PKCE/nonce, owner
   isolation, MongoDB và GUI Settings/themes; build bộ cài.

OAuth client và MongoDB URI được cấu hình ở backend qua env. Chuẩn bị
.env.example/hướng dẫn; không yêu cầu gửi secret trong chat. Không giả lập
đăng nhập thành công trong app production. Triển khai theo yêu cầu, không
chờ duyệt plan riêng.
