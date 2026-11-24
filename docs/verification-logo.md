# Logo terminal và icon Windows — 24/11/2026

## Thay đổi

- Logo vector riêng với cửa sổ terminal navy, prompt trắng và khung/cursor rose
  primary #f23551. Logo thay icon Terminal mặc định ở sidebar; các icon UI khác
  vẫn dùng Lucide. Wordmark giữ tên DevBench, rõ ở header navy.
- Sidebar expanded/collapsed và mobile dùng cùng SVG; favicon dùng cùng nguồn.
- PNG 512px và ICO 9 kích thước 16–256px được tạo từ SVG bằng browser headless.
- `BrowserWindow.icon` dùng ICO trên Windows, PNG trên nền tảng khác.
- Build/dev copy icon vào `dist-electron/assets`; Windows package có icon cho
  executable, installer và uninstaller. Không thay đổi appId hoặc userData.

## Đã kiểm tra

- `pnpm test`: 17/17 test, 6/6 suite qua.
- Typecheck và production build qua; Vite emit SVG cùng renderer.
- Windows unpacked package qua, resource editing bật, chỉ bỏ code signing.
- Bộ cài NSIS `release/DevBench-Setup-1.1.3.exe` tạo thành công từ unpacked app;
  installer/uninstaller đều nhận icon mới. Chưa chạy wizard cài đặt.
- Visual QA trên cả build dev và `release/win-unpacked/DevBench.exe`:
  logo SVG tải đúng, hiển thị 36px, sidebar mở/thu gọn/mobile đều qua.
- Win32 `WM_GETICON` lấy icon native 32×32 từ cửa sổ của cả hai bản; icon có
  đúng màu rose và hình terminal. Đã trích và xem ảnh icon native.
- Windows `Icon.ExtractAssociatedIcon` trích icon từ executable, xác nhận hình
  terminal mới đã được nhúng vào EXE, không chỉ đổi logo trong renderer.
- Header ICO có 9 frame, đã xem PNG lớn và icon native 32px, không rỗng/mờ mất prompt.
- `git diff --check`: qua.

Ảnh dev: `.test-artifacts/logo-qa-UuKuoI/`.
Ảnh packaged: `.test-artifacts/logo-qa-eBxINB/`.
Icon trích EXE: `.test-artifacts/executable-icon.png`.

## Giới hạn

- Chưa thao tác cài đặt trên máy người dùng hoặc kiểm tra shortcut đã ghim/cache
  icon cũ của Windows. App đang mở cần khởi động lại; bản cài cũ cần cập nhật.
- Chưa tạo icon ICNS hoặc kiểm tra Dock macOS trong đợt này.
- Vite vẫn có các cảnh báo chunk lớn và annotation từ Zod, build thành công.
