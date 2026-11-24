# Theme Clarity — 24/11/2026

## Thay đổi

- Tham chiếu trực tiếp [Clarity Design](https://clarity.design/) bằng browser.
- Header navy, sidebar trung tính, card phẳng, viền rõ, góc bo nhỏ; bỏ card
  gradient. Navigation active có vạch primary, focus vẫn hiển thị rõ.
- Giữ primary `#f23551` ở light/dark, Lucide và pattern shadcn/Radix/Tailwind.
  Không thêm dependency Angular/Clarity hoặc thư viện UI khác.
- Đồng bộ dashboard, project card/table, inspect, Settings, dialog và controls.
- Font Segoe UI, fallback Be Vietnam Pro offline; log vẫn JetBrains Mono.
- Label dùng FieldLabel cố định phía trên control; không floating label.
- Giữ nguyên dữ liệu, IPC, form validation, theme persistence và navigation.

## Đã kiểm tra

- `pnpm typecheck`: qua.
- `pnpm test`: 17/17 test, 6/6 suite qua.
- `pnpm build`: qua; đã chạy lại sau thay đổi cuối cùng.
- `node scripts/smoke-electron.mjs`: qua 16 nhóm kiểm tra Electron thật,
  gồm forms, card/table, Run/Stop, Ports, Settings, theme/system mode,
  sidebar/keyboard/mobile, persistence, Git dialog và JSON import/export.
- Visual QA Electron bằng userData riêng: light/dark, Settings, dialog,
  lỗi validation, sidebar collapse, viewport 760px không tràn document.
- Đo bounding box label trước focus, sau focus và khi đã nhập tiếng Việt:
  tọa độ y không thay đổi; label luôn nằm trên input.
- Xác nhận computed primary đúng `#f23551` ở cả hai mode và header light
  là navy `rgb(13, 28, 41)`. Đã xem ảnh dashboard/form/settings/mobile thật.
- Smoke cập nhật để tải/kiểm tra font fallback offline dù Segoe UI đã đủ glyph;
  selector Run All chọn tên chính xác để tránh trùng Dismiss Run All results.
- `git diff --check`: qua.

Artifacts visual QA: `.test-artifacts/clarity-ui-s6NCbM/`.
Artifacts smoke đầy đủ: `.test-artifacts/electron tiếng Việt bgVd0h/`.
Tất cả project/Git/process/userData trong kiểm tra đều là fixture riêng.

## Giới hạn

- Vite vẫn cảnh báo chunk >500 kB và annotation từ Zod; build thành công.
- Git/process/Electron smoke chạy ngoài sandbox vì quyền Windows; không có
  thay đổi về permission của ứng dụng phát hành.
- Chưa build installer hoặc kiểm tra macOS trong đợt chỉnh theme này.
