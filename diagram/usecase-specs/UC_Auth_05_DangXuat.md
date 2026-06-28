# UC_Auth_05 - Đăng xuất

| Thuộc tính | Nội dung |
|---|---|
| User Case ID | UC_Auth_05 |
| Name | Đăng xuất |
| Goal | Kết thúc phiên đăng nhập hiện tại của người dùng. |
| Actors | Người dùng |
| Pre-conditions | Người dùng đang đăng nhập và phiên đăng nhập còn hợp lệ. |
| Post-conditions | Phiên đăng nhập hiện tại kết thúc; người dùng quay về trạng thái chưa đăng nhập. |
| Main Flow | 1. Người dùng chọn chức năng đăng xuất.<br>2. Hệ thống kiểm tra phiên đăng nhập hiện tại.<br>3. Hệ thống kết thúc phiên đăng nhập của người dùng.<br>4. Hệ thống thông báo đăng xuất thành công.<br>5. Giao diện chuyển người dùng về màn hình đăng nhập. |
| Alternative Flows | AF1: Nếu phiên đã hết hạn trước đó, hệ thống vẫn yêu cầu người dùng đăng nhập lại. |
| Exception | Phiên đăng nhập không hợp lệ hoặc đã bị thu hồi, hệ thống chuyển người dùng về màn hình đăng nhập. |
| Open Issues | Cần thống nhất giao diện có tự động đưa người dùng về màn hình đăng nhập khi thao tác đăng xuất gặp lỗi hay không. |
