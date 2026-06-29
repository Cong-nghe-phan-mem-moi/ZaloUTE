# UC_Chat_01 - Quản lý hội thoại cá nhân

| Thuộc tính | Nội dung |
|---|---|
| User Case ID | UC_Chat_01 |
| Name | Quản lý hội thoại cá nhân |
| Goal | Cho phép người dùng lấy/tạo hội thoại cá nhân, xem tin nhắn, gửi ảnh, đánh dấu đã xem, xem badge chưa đọc và xóa hội thoại. |
| Actors | Người dùng |
| Pre-conditions | Người dùng đã đăng nhập; người nhận/hội thoại tồn tại khi thao tác. |
| Post-conditions | Hội thoại được tạo hoặc hiển thị; tin nhắn/media được lưu; trạng thái đã xem hoặc trạng thái hội thoại được cập nhật. |
| Main Flow | 1. Người dùng mở màn hình tin nhắn.<br>2. Hệ thống hiển thị danh sách hội thoại của người dùng.<br>3. Người dùng chọn một người để bắt đầu hội thoại cá nhân.<br>4. Nếu hội thoại đã tồn tại, hệ thống mở hội thoại cũ; nếu chưa tồn tại, hệ thống tạo hội thoại mới.<br>5. Người dùng xem danh sách tin nhắn trong hội thoại.<br>6. Người dùng gửi hình ảnh trong hội thoại.<br>7. Hệ thống lưu hình ảnh và hiển thị trong luồng tin nhắn.<br>8. Hệ thống cập nhật số hội thoại chưa đọc và trạng thái đã xem.<br>9. Người dùng có thể tắt thông báo, chặn, bỏ chặn hoặc xóa hội thoại. |
| Alternative Flows | AF1: Người dùng chỉ xem hội thoại mà không gửi nội dung mới.<br>AF2: Nếu hội thoại đã tồn tại, hệ thống không tạo hội thoại trùng. |
| Exception | Người nhận không tồn tại, hội thoại không tồn tại, người dùng không thuộc hội thoại, file ảnh không hợp lệ hoặc không thể tải ảnh. |
| Open Issues | Cần làm rõ chức năng gửi tin nhắn văn bản được xử lý qua cơ chế nào nếu muốn mô tả chi tiết trong báo cáo. |
