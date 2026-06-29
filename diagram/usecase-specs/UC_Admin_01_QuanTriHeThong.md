# UC_Admin_01 - Quản trị hệ thống

| Thuộc tính | Nội dung |
|---|---|
| User Case ID | UC_Admin_01 |
| Name | Quản trị hệ thống |
| Goal | Cho phép quản trị viên xem thống kê, quản lý người dùng, bài viết, bình luận, báo cáo, nhật ký hành động và sticker. |
| Actors | Quản trị viên hệ thống |
| Pre-conditions | Quản trị viên đã đăng nhập và có quyền quản trị hệ thống. |
| Post-conditions | Dữ liệu quản trị được hiển thị hoặc đối tượng quản trị được cập nhật, ẩn, xóa, xử lý theo thao tác. |
| Main Flow | 1. Quản trị viên mở trang quản trị hệ thống.<br>2. Hệ thống kiểm tra tài khoản có quyền quản trị hay không.<br>3. Quản trị viên xem thống kê tổng quan của hệ thống.<br>4. Quản trị viên xem danh sách người dùng, xem chi tiết người dùng, cập nhật trạng thái hoặc xóa người dùng khi cần.<br>5. Quản trị viên xem và xử lý bài viết: ẩn bài viết vi phạm hoặc xóa bài viết.<br>6. Quản trị viên xem và xóa bình luận vi phạm.<br>7. Quản trị viên xem danh sách báo cáo từ người dùng và xử lý từng báo cáo.<br>8. Quản trị viên xem nhật ký hành động quản trị.<br>9. Quản trị viên quản lý sticker bằng cách thêm, sửa hoặc xóa sticker. |
| Alternative Flows | AF1: Quản trị viên chỉ xem dữ liệu, không thực hiện cập nhật/xóa.<br>AF2: Khi ẩn nội dung, quản trị viên có thể nhập lý do xử lý. |
| Exception | Người dùng không có quyền quản trị, đối tượng cần quản lý không tồn tại hoặc hệ thống không thể thực hiện thao tác. |
| Open Issues | Cần làm rõ quyền quản trị viên có bao gồm xóa vĩnh viễn dữ liệu hay chỉ ẩn/xóa mềm. |
