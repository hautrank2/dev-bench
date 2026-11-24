# Giao diện và layout 1.1.2

Ngày 23/11/2026, Windows 11 x64.

- Layout hai cột: sidebar cao toàn cửa sổ chứa logo; cột nội dung chứa header
  50px và body cuộn. Nút Collapse/Expand sidebar nằm trong header.
- Sidebar thu gọn 240px → 76px, giữ icon logo, tên truy cập được và hover title.
  Nhớ trạng thái sau khởi động lại; mobile luôn có drawer đầy đủ.
- Thay hai mục mode/Themes bằng một dropdown hiển thị Light/Dark/System hiện
  tại. Radio item có dấu chọn, thao tác bằng chuột hoặc phím; Settings tiles
  đồng bộ. System vẫn theo hệ điều hành.
- Theme theo ảnh Finarrow mới nhất: cyan/peach gradient, bề mặt trong mờ,
  primary teal; dark dùng nền teal đậm. Font Việt và terminal palette giữ riêng.

## Kiểm tra thực tế

- Typecheck, build và Prettier check qua.
- `pnpm test`: 20 bài / 7 file qua.
- Source smoke và executable trong win-unpacked qua toàn bộ luồng desktop:
  tạo project/repo, run/stop, port, Git, theme, import/export và persistence.
- Đo sidebar bắt đầu y=0, cao bằng viewport, logo thuộc sidebar; header thuộc
  cột content và chứa nút collapse, không còn logo trong header.
- Dropdown chọn Light/Dark/System, thay đổi media query, focus/ArrowDown/Enter
  và lựa chọn thu gọn sau mở lại app đều qua. Mobile drawer điều hướng được.
- Report packaged: `.test-artifacts/electron tiếng Việt hnuaMu/report.json`.
- Preview: `.test-artifacts/electron tiếng Việt hnuaMu/projects-light-layout.png`.
- Hồi quy lỗi hai scroll: 15 phép kiểm tra qua trên packaged, ba kích thước
  1265×805, 1265×480, 760×520; bốn section Settings, cuộn đến footer, document
  không tràn và header không di chuyển.
  Report: `.test-artifacts/scroll-rpU0N7/report.json`.
- Test harness tắt animation/transition để chụp và đo layout ổn định, không
  thay theme hoặc bridge bằng mock. Native picker/quit response vẫn stub
  trong smoke như bản trước.

## Bộ cài

`pnpm dist:win` qua. `release/Dev-Bench-Setup-1.1.2.exe`: 122.045.902 byte.
SHA256: `9da87bcd4a0b87af7fe777b9edbf3db1d78cc0939572d16daa6c3a5dc206f25b`.

Không thay schema/config/backend. Chưa chạy lại cài/gỡ NSIS bản 1.1.2;
smoke dùng executable đóng gói. Giới hạn kiểm thử Google thật/macOS ở
[báo cáo 1.1](verification-1.1.0.md) vẫn áp dụng.
