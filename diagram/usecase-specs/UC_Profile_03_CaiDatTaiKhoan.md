# UC_Profile_03 - Cập nhật cài đặt tài khoản

| Thuộc tính | Nội dung |
|---|---|
| User Case ID | UC_Profile_03 |
| Name | Cập nhật cài đặt tài khoản |
| Goal | Cho phép người dùng quản lý thông tin liên hệ, mật khẩu, thông báo, quyền riêng tư, phiên đăng nhập và vô hiệu hóa tài khoản. |
| Actors | Người dùng |
| Pre-conditions | Người dùng đã đăng nhập. |
| Post-conditions | Cài đặt tài khoản được cập nhật; phiên đăng nhập có thể bị thu hồi; tài khoản có thể bị vô hiệu hóa theo yêu cầu. |
| Main Flow | 1. Người dùng mở trang cài đặt tài khoản.<br>2. Hệ thống hiển thị thông tin liên hệ, thiết lập thông báo, quyền riêng tư và các phiên đăng nhập.<br>3. Người dùng chọn mục cần thay đổi.<br>4. Nếu đổi mật khẩu hoặc thông tin liên hệ quan trọng, hệ thống yêu cầu xác nhận bằng mật khẩu hiện tại khi cần.<br>5. Người dùng cập nhật thông tin liên hệ, mật khẩu, thông báo hoặc quyền riêng tư.<br>6. Hệ thống kiểm tra dữ liệu và lưu thay đổi.<br>7. Người dùng có thể thu hồi một phiên đăng nhập hoặc các phiên đăng nhập khác.<br>8. Người dùng có thể yêu cầu vô hiệu hóa tài khoản sau khi xác nhận mật khẩu. |
| Alternative Flows | AF1: Người dùng chỉ xem cài đặt mà không thay đổi.<br>AF2: Người dùng chỉ quản lý phiên đăng nhập mà không thay đổi thông tin tài khoản. |
| Exception | Mật khẩu hiện tại sai, dữ liệu liên hệ trùng/không hợp lệ, session không tồn tại, tài khoản không tồn tại hoặc lỗi cập nhật. |
| Open Issues | Cần làm rõ vô hiệu hóa tài khoản là khóa tạm thời, xóa mềm hay chuyển sang trạng thái không hoạt động. |
