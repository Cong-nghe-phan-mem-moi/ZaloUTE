# UC_Profile_02 - Xem hồ sơ người dùng khác

| Thuộc tính | Nội dung |
|---|---|
| User Case ID | UC_Profile_02 |
| Name | Xem hồ sơ người dùng khác |
| Goal | Cho phép người dùng xem hồ sơ của một người dùng khác và trạng thái quan hệ với người đó. |
| Actors | Người dùng, Người dùng khác |
| Pre-conditions | Người dùng đã đăng nhập; id hồ sơ cần xem tồn tại và không phải chính người đang đăng nhập. |
| Post-conditions | Hệ thống hiển thị hồ sơ người dùng khác kèm trạng thái quan hệ như bạn bè, đã gửi lời mời, đã nhận lời mời hoặc chưa có quan hệ. |
| Main Flow | 1. Người dùng chọn xem hồ sơ của một người dùng khác.<br>2. Hệ thống kiểm tra người dùng không xem chính hồ sơ của mình qua chức năng này.<br>3. Hệ thống kiểm tra hồ sơ cần xem có tồn tại và có thể truy cập không.<br>4. Hệ thống tải thông tin hồ sơ phù hợp với quyền riêng tư.<br>5. Hệ thống xác định quan hệ giữa hai người dùng: bạn bè, đã gửi lời mời, đã nhận lời mời hoặc chưa có quan hệ.<br>6. Hệ thống hiển thị hồ sơ và các hành động phù hợp như kết bạn, theo dõi hoặc chặn. |
| Alternative Flows | AF1: Nếu hai người đã là bạn bè, hệ thống hiển thị trạng thái bạn bè.<br>AF2: Nếu đang có lời mời kết bạn, hệ thống hiển thị trạng thái lời mời tương ứng. |
| Exception | Người dùng cố xem chính mình bằng chức năng xem hồ sơ người khác, hồ sơ không tồn tại, bị chặn hoặc không đủ quyền xem, hệ thống thông báo lỗi tương ứng. |
| Open Issues | Cần mô tả rõ dữ liệu hồ sơ nào được ẩn theo thiết lập quyền riêng tư. |
