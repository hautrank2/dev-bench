# Nguồn và điều chỉnh rule

- CLAUDE.md lấy khung từ D:/me/ops-desk/ops-desk-client/CLAUDE.md, viết lại
  phần riêng cho Electron, pnpm, IPC và kiểm thử Windows.
- Hai convention tại đây sao chép từ ops-desk-client/docs/rules.
- .claude/rules lấy từ front-end-origin; điều chỉnh global, component,
  dialog, popover, image và select. Giữ form, typography, theme, UI locator.
- .claude/skills/dialog-form lấy từ OpsDesk, áp dụng theo adaptation local.
- Bỏ yêu cầu Next.js, cổng 3004, JWT, HTTP API và domain OpsDesk.
- Component split theo bản OpsDesk: chỉ tách khi có logic thật, mọi
  type/schema trong type.ts thay cho ví dụ cũ đặt props ở index.
- Nêu plan trước khi code; tiếp tục công việc đã giao, không chờ duyệt riêng.
- Chỉ bộ rule trong Dev Bench được chỉnh; repo tham chiếu không bị sửa.
