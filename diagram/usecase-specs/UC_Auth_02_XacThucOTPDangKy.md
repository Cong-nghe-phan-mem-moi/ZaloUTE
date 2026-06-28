# UC_Auth_02 - Xác thực OTP đăng ký

| Thuộc tính | Nội dung |
|---|---|
| User Case ID | UC_Auth_02 |
| Name | Xác thực OTP đăng ký |
| Goal | Xác thực tài khoản mới đăng ký bằng mã OTP được gửi qua email. |
| Actors | Khách, Hệ thống |
| Pre-conditions | Khách đã đăng ký tài khoản và đã nhận mã OTP qua email. |
| Post-conditions | Tài khoản được kích hoạt và có thể đăng nhập vào hệ thống. |
| Main Flow | 1. Khách mở màn hình xác thực OTP sau khi đăng ký.<br>2. Khách nhập email và mã OTP đã nhận.<br>3. Hệ thống kiểm tra tài khoản có tồn tại và đang chờ xác thực không.<br>4. Hệ thống kiểm tra mã OTP còn hiệu lực và khớp với mã đã gửi.<br>5. Hệ thống kích hoạt tài khoản.<br>6. Hệ thống thông báo xác thực thành công. |
| Alternative Flows | AF1: Nếu tài khoản đã được xác thực trước đó, hệ thống thông báo tài khoản đã kích hoạt.<br>AF2: Nếu khách nhập sai OTP, hệ thống cho phép nhập lại khi chưa vượt quá số lần cho phép. |
| Exception | OTP sai, OTP hết hạn, vượt quá số lần thử hoặc tài khoản không hợp lệ, hệ thống thông báo lỗi và không kích hoạt tài khoản. |
| Open Issues | Cần ghi rõ số lần nhập sai OTP tối đa trong báo cáo. |
