# English / Tiếng Việt — 24/11/2026

## Phạm vi

- English mặc định, không phụ thuộc ngôn ngữ hệ điều hành. Settings → Language
  chuyển ngay sang Tiếng Việt và lưu trên máy qua restart.
- Catalog tại `shared/locales/vi.ts`; React locale context cho renderer và
  LocaleService cho hộp thoại Electron. Không thêm thư viện hay API backend.
- Dịch navigation, form/placeholder/validation, trạng thái, toast, accessibility
  labels, số lượng và ngày giờ. Hộp thoại import/export/thoát dùng cùng lựa chọn.
- Giữ project, port, Dashboard, tên riêng và dữ liệu người dùng; không dịch enum
  lưu trữ, command, path, stdout/stderr hoặc diagnostic bên ngoài. Thông báo chưa
  có trong catalog giữ nguyên để không mất thông tin kỹ thuật.
- Renderer lưu `DEV_BENCH_LANGUAGE` trong localStorage; Electron lưu
  `language.json` trong userData. Lựa chọn ngôn ngữ không thuộc snapshot cloud.

## Kiểm tra thực tế

| Kiểm tra                          | Kết quả                                  |
| --------------------------------- | ---------------------------------------- |
| `pnpm test`                       | 24/24 test, 9 suite qua                  |
| `pnpm build`                      | TypeScript và production build qua       |
| `node scripts/smoke-i18n.mjs`     | Qua trên Electron Windows                |
| `node scripts/smoke-electron.mjs` | 16 nhóm kiểm tra English qua             |
| Catalog audit                     | Không thiếu key từ các lời gọi dịch tĩnh |
| `git diff --check`                | Qua                                      |

Test locale kiểm tra fallback English, glossary, interpolation giữ nguyên giá
trị người dùng, form đang nhập không mất dữ liệu khi đổi ngôn ngữ, lưu/khôi phục
lựa chọn và ghi file native tuần tự.

Smoke hai ngôn ngữ kiểm tra mặc định English, đổi Vietnamese/English, sidebar,
form và lỗi bắt buộc, placeholders, số lượng động, tên project tên “Settings”
không bị dịch, table, port/Stats/Utilities/Config Files, native quit dialog,
restart, dark mode và viewport 760 px không tràn ngang. Không có renderer error.
Native lựa chọn thoát được stub để kiểm tra nội dung và giữ test tự động.

Đã xem ảnh Settings, Dashboard, form lỗi và Settings viewport nhỏ bằng mắt.
Artifacts: `.test-artifacts/i18n-P73OSK`; English smoke có report qua tại
`.test-artifacts/electron tiếng Việt kNFh9c/report.json`.

## Giới hạn

- Chưa tạo lại installer cho tính năng này; kết quả áp dụng source/production build.
- Chưa kiểm tra macOS hay hộp thoại do hệ điều hành/Google tự cung cấp.
- Build còn cảnh báo bundle trên 500 kB và annotation của dependency Zod.
