# UC_Auth_01 - Đăng ký tài khoản

| Thuộc tính | Nội dung |
|---|---|
| User Case ID | UC_Auth_01 |
| Name | Đăng ký tài khoản |
| Goal | Cho phép khách tạo tài khoản mới bằng họ tên, email và mật khẩu; sau đó nhận mã OTP để xác thực tài khoản. |
| Actors | Khách, Hệ thống |
| Pre-conditions | Khách chưa đăng nhập. Email đăng ký chưa tồn tại trong hệ thống. |
| Post-conditions | Tài khoản mới được tạo ở trạng thái chờ xác thực và mã OTP được gửi đến email đăng ký. |
| Main Flow | 1. Khách mở màn hình đăng ký.<br>2. Khách nhập họ tên, email và mật khẩu.<br>3. Hệ thống kiểm tra thông tin đăng ký có hợp lệ không.<br>4. Hệ thống kiểm tra email đã được sử dụng hay chưa.<br>5. Hệ thống tạo hồ sơ người dùng và tài khoản mới ở trạng thái chờ xác thực.<br>6. Hệ thống tạo mã OTP mới và gửi đến email của khách.<br>7. Hệ thống thông báo đăng ký thành công và yêu cầu khách xác thực OTP. |
| Alternative Flows | AF1: Nếu email đã tồn tại, hệ thống thông báo email đã được sử dụng và yêu cầu nhập email khác.<br>AF2: Nếu khách hủy thao tác, hệ thống không tạo tài khoản. |
| Exception | Thông tin không hợp lệ, gửi OTP thất bại hoặc hệ thống gặp lỗi, quá trình đăng ký không hoàn tất và hệ thống thông báo lỗi. |
| Open Issues | Cần thống nhất thời gian hiệu lực OTP và số lần được gửi lại OTP trong tài liệu yêu cầu. |
