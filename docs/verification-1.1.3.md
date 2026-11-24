# Theme dashboard và primary NestJS 1.1.3

Ngày 24/11/2026, Windows 11 x64.

- Theme theo ảnh dashboard mới nhất: nền xám nhạt, sidebar/card trắng đặc,
  bo góc mềm, viền mảnh và shadow nhẹ. Loại bỏ nền cyan/peach và blur card.
- Primary NestJS #f23551 trong cả Light/Dark. Dark dùng slate trung tính;
  card thống kê đầu tiên dùng rose đậm thay cho green trong ảnh tham chiếu.
- Giữ logo trong sidebar, nút collapse ở header, dropdown theme và palette
  terminal độc lập. Không đổi model dữ liệu hoặc backend.

## Kiểm tra

- `pnpm build`: typecheck và build qua. Prettier check qua.
- `pnpm test`: 20 bài / 7 file qua.
- Source desktop smoke qua: kiểm tra primary #f23551 trong cả hai mode,
  card Light có background rgb(255, 255, 255), backdrop-filter none; font Việt,
  System, dropdown dùng phím, sidebar collapse/persistence, mobile drawer,
  run/stop, port, Git và import/export đều hoạt động.
  Report: `.test-artifacts/electron tiếng Việt Bv6scp/report.json`.
- Desktop smoke trên executable đóng gói cũng qua toàn bộ các luồng trên.
  Report: `.test-artifacts/electron tiếng Việt KrsXdu/report.json`.
  Preview: `.test-artifacts/electron tiếng Việt KrsXdu/projects-light-layout.png`.
- Đã xem screenshot Light Projects và Dark Dashboard.
- Hồi quy hai scroll: 15 phép kiểm tra qua ở 1265×805, 1265×480, 760×520;
  header không dịch chuyển, document không tràn, cuộn được đến cuối Settings.
  Report: `.test-artifacts/scroll-ZdXwTW/report.json`.
- `pnpm dist:win`: tạo `release/Dev-Bench-Setup-1.1.3.exe`, 122.045.633 byte.
  SHA256: `6ab60b8494e4802f1eb0568a47738f00d152d5e0281bd3a4d743b43609b84739`.

Chưa cài/gỡ lại NSIS 1.1.3. Giới hạn kiểm thử Google thật/macOS ở
[báo cáo 1.1](verification-1.1.0.md) vẫn áp dụng.
