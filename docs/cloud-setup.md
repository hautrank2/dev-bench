# Kết nối backend DevBench API

Backend đã tách sang repo **dev-bench-server**, dùng ASP.NET Core .NET 10 + MongoDB.
Repo desktop không còn server Node/Fastify hoặc secret backend. Hai repo build,
phát hành độc lập và giao tiếp bằng HTTP contract hiện có.

## Dùng desktop

### Đặt URL backend qua .env

Tạo `.env` tại gốc repo desktop (cùng cấp `package.json`), hoặc copy `.env.example`.
Chỉ điền origin công khai của backend:

```dotenv
DEV_BENCH_API_ORIGIN=https://devbench-acdndvcbhrhgbkeq.westus3-01.azurewebsites.net
```

Local có thể dùng `http://localhost:4318`. Không thêm `/api`, query hoặc fragment.
Để trống nếu muốn cấu hình server thủ công trong Settings. Không điền Google
Client Secret hoặc MongoDB URI vào FE.

`pnpm dev` và `pnpm build` đọc biến này và nhúng riêng origin vào Electron main;
request HTTP vẫn đi qua main/IPC. Sau khi sửa `.env`, khởi động lại `pnpm dev`
hoặc build/đóng gói lại. File `.env` được Git bỏ qua và không được đóng gói.
URL đã lưu qua **Save server** trong Settings được ưu tiên hơn default từ `.env`;
thay `.env` không tự ghi đè lựa chọn server của người dùng.

Loader hỗ trợ `.env.local` và `.env.[mode]` theo Vite; biến môi trường shell/CI
có độ ưu tiên cao nhất. Chỉ `DEV_BENCH_API_ORIGIN` được chuyển vào main bundle.

### Đăng nhập và backup

1. Mở Settings → Account & backup.
2. Điền **Backup server URL** là origin API rồi Save server. Local ví dụ
   `http://localhost:4318`; production dùng HTTPS. Không thêm `/api`.
3. Continue with Google, hoàn tất trong browser rồi quay lại app.
4. Back up current set để lưu snapshot; Preview restore → Import as new set
   để khôi phục thành set mới, không ghi đè cấu hình hiện tại.

Đăng nhập lần đầu tự tạo account. Session riêng theo máy, hạn 30 ngày, token
mã hóa bằng OS safeStorage và gắn API origin. Logout không ảnh hưởng máy khác.
Project/Git/process/export/import local vẫn hoạt động khi không có backend.

## Chạy backend cho người phát triển

Xem README repo `dev-bench-server` để cấu hình MongoDB, Google OAuth, chạy .NET
hoặc Docker Compose. Lệnh chạy tại repo API:

```powershell
dotnet run --project src/DevBench.Api --urls http://localhost:4318
```

Google OAuth client loại Web application, callback:
`<PUBLIC_API_ORIGIN>/auth/google/callback`. MongoDB URI và Google client secret
chỉ ở backend. Desktop chỉ lưu API URL và session của người dùng.
Backend .NET có thể dùng lại DB/origin của bản Node trước đó.

## Cloud smoke giữa hai repo

Terminal tại repo API, khởi động harness test mới:

```powershell
dotnet run --project tests/DevBench.Api.Tests -- --serve
```

Terminal tại repo desktop:

```powershell
$env:DEV_BENCH_TEST_API_ORIGIN = "http://127.0.0.1:14318"
pnpm test:cloud-e2e
```

Harness giả Google identity, dùng HTTP API .NET thật, không yêu cầu secret và
không nằm trong production API. Backend integration có chế độ MongoDB thật
riêng; xem repo API. Google OAuth thật cần kiểm tra thủ công với credentials.
Verification 1.1.x cũ ghi kết quả bản Node; kết quả chuyển đổi nằm trong
`docs/verification-repo-split.md`.
