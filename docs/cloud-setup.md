# Cấu hình Google và MongoDB

Bạn đã có Google OAuth Client/MongoDB và sẽ điền trực tiếp trên máy.
Không gửi URI/password/client secret vào chat hoặc đóng gói vào desktop.

## 1. Điền env backend

Tạo `server/.env` từ `server/.env.example`, rồi sửa bằng editor của bạn:

```dotenv
HOST=127.0.0.1
PORT=4318
PUBLIC_API_ORIGIN=http://localhost:4318
MONGODB_URI=mongodb+srv://...your-connection-string...
MONGODB_DB=dev_bench
GOOGLE_CLIENT_ID=your-web-application-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
```

`.env` bị Git ignore. Chỉ `.env.example` được đưa vào source.

Google OAuth Client phải là **Web application**, vì callback đi qua backend.
Đăng ký Authorized redirect URI chính xác:

```text
http://localhost:4318/auth/google/callback
```

Khi deploy, thay bằng `https://your-api.example.com/auth/google/callback` và
đặt PUBLIC_API_ORIGIN cùng origin. Nếu consent screen ở Testing, thêm Gmail
của bạn vào Test users. Chỉ yêu cầu `openid email profile`.

Đây là OpenID Connect qua browser hệ thống, có state, nonce và PKCE ở cả
luồng Google lẫn bước nhận session desktop. Không dùng embedded Google login.
Tham khảo [Google OpenID Connect](https://developers.google.com/identity/openid-connect/openid-connect).

## 2. Chạy backend

Từ root project, dùng Node.js 24 và pnpm 10.4.1:

```powershell
pnpm install --frozen-lockfile
pnpm server:dev
```

Hoặc build và chạy bản production:

```powershell
pnpm build:server
pnpm server:start
```

Kiểm tra `http://localhost:4318/health`. Server tạo các collection/index:
`users`, `sessions`, `desktop_logins`, `project_backups`.

Google `sub` là unique key của account. Session token và desktop challenge
được hash; session hết hạn sau 30 ngày. MongoDB TTL dọn phiên/request hết hạn,
đồng thời mọi truy vấn xác thực đều kiểm tra expiresAt ngay, không đợi TTL.
Mọi truy vấn backup gắn userId từ session, không nhận ownerId từ client.

MongoDB user của backend cần quyền readWrite trên DB đã chọn và quyền tạo
index; hạn chế network allowlist về nơi chạy backend. Backend cần HTTPS khi
dùng ngoài localhost. Frontend Electron không kết nối trực tiếp vào MongoDB.

## 3. Dùng nhiều máy

Để Windows và Mac cùng truy cập, chạy backend tại một endpoint HTTPS mà cả
hai máy truy cập được. Có thể đặt sau reverse proxy TLS; HOST=127.0.0.1 khi
proxy cùng máy, hoặc bind theo hạ tầng bạn dùng. MongoDB Atlas URI chỉ nằm
ở server. Chưa có dịch vụ nào được tự động deploy/publish trong lượt này.

Trên từng máy:

1. Mở Settings → Account & backup.
2. Điền cùng Backup server URL, ví dụ `https://backup.example.com`, Save server.
   Đây là **origin** của backend, không thêm `/api` hoặc `/backups`.
3. Continue with Google, tự hoàn tất đăng nhập trong browser, quay lại app.
4. Tạo các Project sets tương ứng máy/công việc.
5. Nhấn Back up current set khi muốn lưu snapshot.

Sau reset máy: cài lại app → cấu hình API URL → đăng nhập Google → Preview
restore → xem project/repo/path → Import as new set. Chọn thêm restore theme
nếu muốn. Sửa các folder không còn tồn tại qua Edit Repository.

Local Export JSON / Import JSON hoạt động không cần tài khoản hay backend.
Export tối đa 2 MB; tối đa 1.000 repo trong một set. Cấu hình API URL và token
đăng nhập không được đưa vào export.

## Kiểm thử

```powershell
pnpm test
pnpm test:cloud-e2e
```

Test khởi động MongoDB tạm và dùng Google identity provider giả **chỉ trong
harness test**. Không có bypass/mock login trong production server.
Cloud smoke đi qua UI → IPC → HTTP → MongoDB, kiểm tra token mã hóa trên OS,
restore và cách ly tài khoản. Google login với client thật cần bạn xác nhận
sau khi điền env; test tự động không đăng nhập tài khoản Google của bạn.
