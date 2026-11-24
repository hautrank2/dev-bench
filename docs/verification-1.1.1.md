# Bản vá 1.1.1 — hai thanh cuộn

Ngày 23/11/2026, Windows 11 x64.

Settings làm document tràn ngoài cửa sổ; `scrollIntoView` khi chọn section
còn kéo khung ngoài, làm mất header và để khoảng trống dưới nội dung.
Khung app hiện giới hạn theo viewport, clip phần tràn và vùng nội dung
cuộn có containing block riêng. Settings dùng chiều cao vùng chứa.

Đã kiểm tra trên executable đóng gói:

- Cửa sổ 1265×805, 1265×480 và 760×520; chọn cả bốn section và cuộn cuối.
- 15 phép kiểm tra qua: document không cao hơn viewport, scrollTop bằng 0,
  header ở y=0 cao 50px, nội dung đầy chiều cao còn lại, footer tới được.
- Không overflow ngang. Chỉ vùng nội dung cuộn; sidebar cuộn riêng khi thấp.
- Report: `.test-artifacts/scroll-YE3GbH/report.json`.
- Desktop smoke đầy đủ qua, gồm theme light/dark, dialog, sidebar, repo,
  process/port, Git và import/export:
  `.test-artifacts/electron tiếng Việt apKdlG/report.json`.
- `pnpm test`: 20 test / 7 file qua; typecheck, build, format check qua.
- `pnpm dist:win` tạo `release/Dev-Bench-Setup-1.1.1.exe` (122.045.152 byte).

SHA256: `7a637f5c26438edaeffad831b51f3bc64a78d6a1d78ececf9aadf8c98e2e076b`.

Bản vá không thay schema hoặc dữ liệu cấu hình. Chưa cài/gỡ lại bản 1.1.1;
smoke chạy executable trong win-unpacked. Giới hạn Google thật/macOS ở
[báo cáo 1.1](verification-1.1.0.md) vẫn áp dụng.
