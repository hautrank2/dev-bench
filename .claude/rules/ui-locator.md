---
description: Mỗi vùng giao diện có class định vị (tiền tố = tên trang, hoặc tên component nếu không thuộc trang) để người dùng chỉ đúng component cần sửa khi xem DevTools.
paths:
  - "src/**/*.tsx"
  - "src/**/*.css"
---

# Class định vị giao diện

Mục đích: khi xem giao diện qua DevTools, người dùng đọc được class và nói
"sửa `ss-prompt-tags`" — Claude tìm đúng file từ class đó.

## Đặt tên

Kebab-case, dạng `<tiền tố>-<vùng>`:

| Component nằm ở                              | Tiền tố                                                                                      | Ví dụ                                                                 |
| -------------------------------------------- | -------------------------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| `src/app/**` (page.tsx, `_components/`) | **tên trang** = segment cuối có nghĩa của route; bỏ layout `_app`, nhóm `(x)`, tham số `$id` | `liveview-list`, `liveview-content-playback`, `object-counting-chart` |
| `src/components/layouts/`                    | `layout-`                                                                                    | `layout-header`, `layout-sidebar`, `layout-setting`                   |
| `src/components/<nhóm>/` khác                | **tên component**                                                                            | `camera-form-info`, `filter-form-toolbar`, `stream-stats-panel`       |

- Trang đã có tiền tố viết tắt thì giữ, không đổi hàng loạt:
  **Smart Search dùng `ss-`** (`ss-prompt-root`, `ss-result-list`).
- Component trong `_components/` dùng tiền tố của **trang chứa nó**, không dùng
  tên component (`ss-image-history`, không phải `image-history`).
- Component dùng chung nhận `className` từ trang thì class trang đặt ở chỗ gọi:
  `<PageHeader className="liveview-header" />` → DOM có cả `layout-page-header`
  lẫn `liveview-header`.
- Không dùng tiền tố cho `src/components/ui/` (shadcn, vendored) — đã có
  `data-slot`.

## Đặt ở đâu

- Gắn vào phần tử gốc của mỗi vùng có ý nghĩa: trang, section, card, toolbar,
  bảng / danh sách, form, panel, hàng tag, thanh thống kê, điều hướng. Không
  gắn cho từng `div` bọc bố cục vô nghĩa.
- Class định vị đứng **đầu** `className`, sau đó là Tailwind:
  `className={cn("ss-prompt-tags flex items-center gap-1", className)}`.
- Class định vị **không có CSS** tương ứng — chỉ để nhận diện; styling vẫn bằng
  Tailwind. (Các class hiệu ứng có sẵn trong `src/themes/*.css` như
  `ss-glass`, `ss-aurora`, `ss-prompt-frame` là class style, không phải class
  định vị — đừng lấy chúng làm mẫu.)
- Phần tử lặp lại thêm `data-*` theo ID dữ liệu (`data-camera-id`,
  `data-segment-id`, `data-event-id`, `data-history-id`), không dùng nhãn đã
  dịch làm khoá.

## Khi sửa

- Giữ nguyên class định vị đã có; đổi tên chỉ khi component chuyển trang /
  folder. Không dựa vào chuỗi utility hay `nth-child` để nhận diện vị trí.
- Khi người dùng nêu một class hoặc tên vùng, `grep` class đó trong `src/`
  trước khi hỏi thêm vị trí. Người dùng chỉ đưa chuỗi utility (vd
  `flex items-center gap-1`) thì xác định vùng theo ngữ cảnh rồi gắn class
  định vị cho nó để lần sau gọi đúng tên.
- Thêm class cho vùng mình đang tạo / sửa; không đi gắn hàng loạt cho file
  không liên quan khi không được yêu cầu.

## Khả năng truy cập & cuộn

- Control có tên truy cập được (`aria-label` nếu chỉ có icon); vùng nội dung
  có heading / label. Không đổi semantic HTML chỉ để thêm selector.
- Nội dung dài trong panel phải cuộn được bằng chuột, touch và bàn phím; giữ
  điều hướng trước / sau đồng bộ với vị trí cuộn. Kiểm tra cả màn hình nhỏ và
  thấp.
