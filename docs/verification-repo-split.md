# Tách repo và chuyển backend .NET — 2026-11-24

## Kết quả

- Desktop giữ repo/Git history tại `D:\web\vibe\dev-bench\dev-bench-client`.
- API có Git repo riêng tại `D:\web\vibe\dev-bench\dev-bench-server`, branch `main`,
  chưa commit, gắn remote hoặc push GitHub.
- Backend ASP.NET Core .NET 10 + MongoDB thay Fastify. Desktop không import
  source API và không cần .NET để build; API không cần Node.js/source desktop.
- Đã gỡ Node backend, server scripts, dependency và test backend khỏi desktop.
  Lockfile đã loại 105 dependency snapshots không còn được dùng.
- Repo API có validation C#, Google provider, MongoDB store, HTTP contract,
  test executable, Dockerfile, Compose, CI và README cấu hình/chạy/publish.

## Đã kiểm tra

- `pnpm typecheck`: thành công.
- `pnpm test`: 17/17 test thành công, gồm Git và process thật trên Windows.
- `pnpm build`: thành công (renderer + Electron main/preload).
- `pnpm install --lockfile-only --frozen-lockfile --offline --ignore-scripts`:
  thành công sau khi loại dependency backend.
- `dotnet build DevBench.Api.slnx -c Release --no-restore`: thành công,
  0 warning, 0 error; `dotnet publish` API Release cũng đã thành công.
- API integration qua HTTP/Kestrel thật: 11 nhóm kiểm tra với memory test store;
  12 nhóm với MongoDB 8.0.17 thật và database tạm.
- MongoDB kiểm tra thêm BSON của Node backend cũ (user có `_id` và `id`,
  session hash/ngày BSON, snapshot schema v1), giữ account ID và đăng nhập lại.
- Electron cloud smoke kết nối harness .NET riêng qua localhost: đăng nhập,
  session mã hóa/lưu qua restart, backup, preview/restore tạo set mới,
  logout xóa credentials và account khác không nhìn thấy backup.

Test Google identity chỉ giả lập trong test executable; production luôn dùng
Google provider xác minh ID token thật. Memory store không nằm trong API publish.

## Điều kiện môi trường và giới hạn

- Sandbox Windows chặn socket loopback, Git hook/MSYS và taskkill. Test tích hợp
  cần chạy ngoài sandbox; lần chạy đầy đủ ngoài sandbox đã qua.
- Test Git tạo thư mục trong repo; dùng `GIT_CEILING_DIRECTORIES` bằng đường dẫn
  `.test-artifacts` để fixture non-repo không nhận nhầm Git repo cha.
- pnpm được cài sẵn là 10.12.1; khi môi trường chặn tải pnpm 10.4.1, dùng
  `pnpm --config.manage-package-manager-versions=false ...` để chạy bản đã cài.
- Restore .NET dùng NuGet cache có sẵn; audit mạng bị tắt riêng cho lệnh restore
  tại môi trường kiểm tra này. Project/CI vẫn giữ audit mặc định.
- Vite có cảnh báo bundle >500 kB và annotation từ Zod; build vẫn thành công.
- Docker daemon chưa chạy, nên chưa build/chạy container tại máy này. CI đã
  có bước build image và integration MongoDB, chưa chạy trên GitHub.
- Chưa cấu hình Google OAuth credentials thật, chưa nghiệm thu login Google
  thực tế, triển khai hosting, tạo installer hoặc kiểm thử macOS trong đợt này.
- Các verification 1.1.x là lịch sử trước đợt chuyển đổi, không phải chứng cứ
  kiểm thử backend .NET.

## Bố cục thư mục sau điều chỉnh

- Thư mục cha `dev-bench/` chứa `dev-bench-client/` và `dev-bench-server/`.
- Mỗi thư mục con giữ `.git` riêng; Git history, remote và các thay đổi chưa commit
  của client được giữ nguyên. Repo API cũ cạnh thư mục cha đã chuyển vào server.
- Client đã qua 16 test ở 5 suite; test project-form còn lại đã qua sau khi
  phục hồi canonical package của pnpm. Typecheck/build tại đường dẫn mới đã qua.
- Server restore/build Release và 11 nhóm HTTP integration memory store tại
  đường dẫn mới đã qua, 0 warning/0 error khi build.
- Một file `node_modules/.pnpm/electron@45.4.1/node_modules/electron/dist/resources/default_app.asar`
  còn ở thư mục cha do app Dev Bench đang mở giữ file. Bản sao trong client mới
  đã đầy đủ; cần đóng app cũ rồi dọn file nguồn và các thư mục rỗng còn lại.
