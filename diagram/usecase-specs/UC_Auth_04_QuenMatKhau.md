# UC_Auth_04 - Quên mật khẩu và đặt lại mật khẩu

| Thuộc tính | Nội dung |
|---|---|
| User Case ID | UC_Auth_04 |
| Name | Quên mật khẩu và đặt lại mật khẩu |
| Goal | Cho phép người dùng yêu cầu OTP, xác minh OTP và đặt lại mật khẩu mới. |
| Actors | Khách, Hệ thống |
| Pre-conditions | Tài khoản tồn tại và đang hoạt động. |
| Post-conditions | Mật khẩu mới được cập nhật; người dùng có thể đăng nhập bằng mật khẩu mới. |
| Main Flow | 1. Khách chọn chức năng quên mật khẩu.<br>2. Khách nhập email của tài khoản cần khôi phục.<br>3. Hệ thống kiểm tra tài khoản có tồn tại và đang hoạt động không.<br>4. Hệ thống gửi mã OTP đặt lại mật khẩu đến email.<br>5. Khách nhập mã OTP để xác minh.<br>6. Hệ thống kiểm tra OTP hợp lệ và còn hiệu lực.<br>7. Khách nhập mật khẩu mới.<br>8. Hệ thống kiểm tra phiên đặt lại mật khẩu còn hợp lệ.<br>9. Hệ thống cập nhật mật khẩu mới và thông báo thành công. |
| Alternative Flows | AF1: Khách yêu cầu gửi lại OTP nếu chưa nhận được mã.<br>AF2: Khách hủy thao tác, hệ thống không thay đổi mật khẩu. |
| Exception | Tài khoản không tồn tại, tài khoản không hoạt động, OTP sai/hết hạn, phiên đặt lại mật khẩu hết hạn hoặc mật khẩu mới không hợp lệ. |
| Open Issues | Cần thống nhất thời gian hiệu lực của bước đặt lại mật khẩu trong báo cáo. |
