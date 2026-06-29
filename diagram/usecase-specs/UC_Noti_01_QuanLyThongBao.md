# UC_Noti_01 - Quản lý thông báo

| Thuộc tính | Nội dung |
|---|---|
| User Case ID | UC_Noti_01 |
| Name | Quản lý thông báo |
| Goal | Cho phép người dùng xem, đánh dấu đã xem/đã đọc, đánh dấu tất cả đã đọc và xóa thông báo. |
| Actors | Người dùng, Hệ thống |
| Pre-conditions | Người dùng đã đăng nhập; thông báo được tạo bởi các sự kiện như lời mời kết bạn, chấp nhận kết bạn hoặc các hành động liên quan khác. |
| Post-conditions | Danh sách thông báo được trả về; trạng thái seen/read hoặc trạng thái xóa được cập nhật. |
| Main Flow | 1. Khi có sự kiện liên quan đến người dùng, hệ thống tạo thông báo.<br>2. Người dùng mở danh sách thông báo.<br>3. Hệ thống hiển thị các thông báo của người dùng theo thứ tự phù hợp.<br>4. Người dùng chọn một thông báo để xem nội dung liên quan.<br>5. Hệ thống đánh dấu thông báo là đã xem hoặc đã đọc.<br>6. Người dùng có thể đánh dấu tất cả thông báo là đã đọc.<br>7. Người dùng có thể xóa thông báo không còn cần thiết.<br>8. Hệ thống chỉ cho phép người dùng thao tác với thông báo thuộc về mình. |
| Alternative Flows | AF1: Nếu không có thông báo, hệ thống hiển thị danh sách rỗng.<br>AF2: Nếu người dùng chỉ mở danh sách thông báo, hệ thống có thể chỉ đánh dấu đã xem mà chưa đánh dấu đã đọc. |
| Exception | Lỗi tải thông báo, thông báo không tồn tại, không có quyền thao tác hoặc lỗi cập nhật trạng thái. |
| Open Issues | Cần liệt kê đầy đủ các sự kiện tạo thông báo nếu báo cáo yêu cầu chi tiết nghiệp vụ. |
