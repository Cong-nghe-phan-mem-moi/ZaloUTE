# UC_Auth_03 - Đăng nhập

| Thuộc tính | Nội dung |
|---|---|
| User Case ID | UC_Auth_03 |
| Name | Đăng nhập |
| Goal | Cho phép người dùng đăng nhập vào hệ thống bằng tài khoản đã xác thực. |
| Actors | Khách, Người dùng, Quản trị viên hệ thống |
| Pre-conditions | Tài khoản tồn tại, đã được xác thực và không bị khóa tại thời điểm đăng nhập. |
| Post-conditions | Người dùng đăng nhập thành công và được chuyển đến giao diện phù hợp với vai trò của mình. |
| Main Flow | 1. Khách mở màn hình đăng nhập.<br>2. Khách nhập email và mật khẩu.<br>3. Hệ thống kiểm tra email và mật khẩu không được để trống.<br>4. Hệ thống kiểm tra tài khoản có tồn tại và đang hoạt động không.<br>5. Hệ thống kiểm tra mật khẩu có đúng không.<br>6. Hệ thống ghi nhận phiên đăng nhập mới.<br>7. Nếu là quản trị viên, hệ thống chuyển đến trang quản trị; nếu là người dùng thường, hệ thống chuyển đến trang cá nhân/trang chính. |
| Alternative Flows | AF1: Nếu tài khoản từng bị tạm khóa nhưng thời hạn khóa đã hết, hệ thống khôi phục trạng thái hoạt động trước khi cho đăng nhập. |
| Exception | Thiếu email hoặc mật khẩu, tài khoản không tồn tại, chưa xác thực, đang bị khóa, không hoạt động hoặc mật khẩu không đúng. |
| Open Issues | Hệ thống hiện sử dụng email để đăng nhập; nếu muốn đăng nhập bằng số điện thoại cần bổ sung yêu cầu riêng. |
