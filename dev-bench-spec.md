# Đặc tả Windows Dev Dashboard

Xây dựng một desktop app cho Windows 11 để quản lý các project đang phát triển trên máy. Luồng hằng ngày là mở app, xem các project và bấm **Run All** để khởi động nhóm project đã chọn. Khi cần cập nhật code hoặc commit, người dùng thao tác ngay trên từng project.

Dùng **Electron + React + TypeScript + Tailwind CSS + shadcn/ui**, quản lý package bằng pnpm. App chạy local và lưu cấu hình bằng JSON. Giao diện dùng các nhãn tiếng Anh trong tài liệu này.

## Dashboard

Hiển thị mỗi project trên một hàng với tên, đường dẫn thư mục, Git branch hiện tại nếu có và trạng thái tiến trình. Đặt **Add Project** và **Run All** trên thanh công cụ. Đặt **Run** hoặc **Stop** cùng **Open Web** ở vị trí dễ bấm trên mỗi hàng. Các hành động còn lại có thể đặt trong menu của project để hàng vẫn dễ đọc.

Trạng thái tiến trình gồm `Stopped`, `Starting`, `Running`, `Stopping` và `Failed`. Hiển thị trạng thái thao tác Git độc lập với trạng thái tiến trình. Bấm **Logs** để xem stdout, stderr và lỗi khởi chạy của project.

## Các nút và hành vi

| Nút | Hành vi |
| --- | --- |
| **Add Project** | Mở form có tên project, thư mục local, lệnh chạy, URL và tùy chọn đưa vào **Run All**. Dùng folder picker của Windows và cho sửa các trường này qua **Edit Project**. |
| **Copy Path** | Sao chép đường dẫn đầy đủ của thư mục project vào clipboard và hiện thông báo đã sao chép. |
| **Open Terminal** | Mở một cửa sổ hoặc tab terminal tại thư mục project. Ưu tiên Windows Terminal khi có sẵn, dùng PowerShell làm phương án dự phòng. |
| **Run** | Chạy đúng lệnh đã cấu hình với working directory tùy chọn; để trống dùng thư mục project. Ví dụ `pnpm run dev`. Khi chưa có lệnh, mở form cấu hình tại trường **Run command**. |
| **Stop** | Dừng cây tiến trình do dashboard khởi chạy cho project và cập nhật trạng thái khi việc dừng hoàn tất. Hiển thị lỗi nếu còn tiến trình chưa dừng được. |
| **Tab Terminal** | Trên trang repository, mở shell tương tác tại thư mục project ngay trong app. |
| **Open GitHub / GitLab / repository** | Mở trang web của remote Git bằng browser mặc định; chỉ hiện khi remote có địa chỉ web. |
| **Open Web** | Mở URL đã cấu hình bằng browser mặc định. Khi chưa có URL, mở form cấu hình tại trường **Web URL**. Người dùng cũng có thể mở URL của project đã chạy từ terminal bên ngoài. |
| **Pull Code** | Chạy `git pull --ff-only` trên branch hiện tại. Báo rõ khi thiếu upstream, branch bị diverge, Git từ chối vì thay đổi local, hoặc có lỗi kết nối hay xác thực. |
| **Git Commit** | Mở modal hiển thị branch, danh sách file đã stage và ô **Commit message**. Sau khi xác nhận, chạy `git commit -m <message>` nếu có file đã stage và message có nội dung. Cho stage các file được chọn ngay trong modal. Hiển thị toàn bộ danh sách staged cuối cùng trước khi commit, kể cả file được stage từ terminal. |
| **Push** | Xác định remote và branch upstream của branch hiện tại rồi push HEAD tới đúng đích đó, không dùng force. Khi thiếu upstream, hiển thị lỗi và hướng dẫn thiết lập trong terminal. Giữ thao tác **Push** độc lập với **Git Commit**. |
| **Run All** | Chạy các project được chọn qua **Include in Run All**. Bỏ qua project đã chạy, báo riêng project thiếu lệnh hoặc khởi chạy lỗi và tiếp tục các project còn lại. Khi batch kết thúc, báo bằng toast và lưu kết quả từng repository trong danh sách thông báo trên header. |

## Cấu hình project

| Trường | Quy tắc |
| --- | --- |
| **Name** | Bắt buộc. Đề xuất tên thư mục khi người dùng chọn folder. |
| **Project folder** | Bắt buộc. Thư mục local đang tồn tại. Hỗ trợ đường dẫn Windows có dấu tiếng Việt và khoảng trắng. |
| **Working directory (optional)** | Đường dẫn tương đối từ thư mục repo hoặc tuyệt đối, tối đa 4096 ký tự. Để trống dùng thư mục repo. Thư mục phải tồn tại; áp dụng cho Run/Run All, không đổi thư mục thao tác Git. |
| **Run command** | Có thể lưu trống, cần thiết lập trước khi chạy. Gợi ý `pnpm run dev` và cho phép chỉnh theo từng project. |
| **Web URL** | Có thể lưu trống, cần thiết lập trước khi mở web. Chấp nhận URL hợp lệ dùng `http://` hoặc `https://`, kể cả localhost. |
| **Include in Run All** | Tùy chọn theo project và được lưu sau khi đóng app. |

Lưu mỗi project với một ID ổn định. Cho phép thêm thư mục subproject trong monorepo khi nó có lệnh chạy riêng. Hiển thị repo và branch mà thao tác Git thực sự tác động tới. Project không dùng Git vẫn có thể dùng các nút khác, với các nút Git bị vô hiệu hóa và có giải thích.

Ví dụ hai project có port riêng là OpsDesk Web tại `http://localhost:3000` và OpsDesk API tại `http://localhost:3003`. URL chỉ phục vụ **Open Web**. Lệnh và cấu hình môi trường của project quyết định cổng thực tế.

## Yêu cầu triển khai

- **Cấu trúc Electron.** Renderer hiển thị giao diện. Main process quản lý file, tiến trình, terminal và Git. Preload expose các IPC theo từng hành động, bật context isolation và tắt Node integration trong renderer. Main process tra cấu hình theo project ID trước khi thao tác.
- **Chạy lệnh trên Windows.** Hỗ trợ `pnpm` cài trên máy và gọi được qua shell Windows, kể cả khi executable trên PATH là shim `pnpm.cmd`. Giữ working directory tách khỏi chuỗi lệnh. Với Git, truyền arguments riêng để commit message và tên file có dấu hoặc ký tự đặc biệt được giữ nguyên.
- **Quản lý tiến trình.** Khóa **Run** khi đang khởi động hoặc đang chạy, kể cả khi người dùng bấm **Run All** cùng lúc. Khi **Stop**, dừng cả process con của pnpm và dev server thuộc lần chạy đó. Theo dõi sự kiện exit để dọn trạng thái khi project tự thoát. `Running` phản ánh tiến trình đang chạy. Tách tín hiệu này khỏi việc website có sẵn sàng trả HTTP hay chưa.
- **Thoát app.** Nếu còn project do dashboard khởi chạy, khi thoát cho người dùng chọn **Stop All and Quit** hoặc **Cancel**. Khi mở lại app, chỉ phục hồi cấu hình và kiểm tra trạng thái thực tế, tránh hiển thị trạng thái `Running` lưu từ phiên cũ.
- **Quản lý Git.** Dùng Git và cơ chế xác thực đã thiết lập trên máy. Chỉ cho một thao tác Git thay đổi trạng thái chạy tại một thời điểm trên cùng checkout, kể cả khi hai project trỏ vào cùng checkout. Cập nhật branch và trạng thái Git sau mỗi thao tác. Khi commit hoặc stage lỗi, giữ message trong modal và cập nhật danh sách staged thực tế. Giữ nguyên hành vi của Git hooks và hiển thị lỗi từ Git.
- **Hiển thị lỗi.** Nêu rõ project, hành động lỗi và thông tin đủ để xử lý. Kiểm tra các trường hợp thiếu Git hoặc pnpm trên PATH, thư mục đã bị di chuyển, lệnh trả exit code khác 0, trùng port và lỗi Git authentication. Một project lỗi vẫn cho phép thao tác với project khác.

## Tiêu chí nghiệm thu trên Windows

1. Thêm hai project có đường dẫn chứa dấu cách, lưu command và URL, đóng mở app rồi kiểm tra cấu hình còn nguyên.
2. **Copy Path** sao chép chính xác. **Open Terminal** mở đúng thư mục. **Open Web** dùng URL đã lưu và mở được qua browser mặc định.
3. Chạy hai project qua **Run All**, xem log riêng từng project, rồi bấm lại và kiểm tra mỗi project vẫn chỉ có một lần chạy. Thử một lệnh sai và xác nhận project còn lại vẫn khởi chạy.
4. **Stop** dừng được dev server và giải phóng port mà project đang dùng. Project khác tiếp tục chạy. Có thể chạy lại ngay trên cùng port.
5. Thử **Pull Code**, **Git Commit** và **Push** bằng repo thử nghiệm với remote riêng. Kiểm tra pull fast-forward, pull bị từ chối khi branch diverge, commit message tiếng Việt có dấu ngoặc kép, chỉ commit các file đã stage và lỗi khi push lên branch chưa có upstream.
6. Đóng gói tạo được bộ cài Windows `.exe`. Kiểm tra app đã cài có thể gọi Git, chạy pnpm, mở terminal và lưu lại cấu hình trên Windows.

## Bàn giao

Bàn giao source code, README hướng dẫn cài Git, Node.js và pnpm để chạy các project mẫu, cách chạy dashboard ở chế độ dev, cách build bộ cài Windows và danh sách các bước đã kiểm tra trên máy Windows. Nếu môi trường dev không có Windows, ghi cụ thể các bước cần xác nhận trên Windows trước khi phát hành.
