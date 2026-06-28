# UC_Rel_02 - Quản lý lời mời kết bạn

| Thuộc tính | Nội dung |
|---|---|
| User Case ID | UC_Rel_02 |
| Name | Quản lý lời mời kết bạn |
| Goal | Cho phép người dùng gửi, xem, chấp nhận, từ chối hoặc hủy lời mời kết bạn. |
| Actors | Người dùng |
| Pre-conditions | Người dùng đã đăng nhập; người nhận hoặc người gửi lời mời tồn tại; hai bên không chặn nhau. |
| Post-conditions | Lời mời kết bạn được tạo, xóa hoặc chuyển sang accepted; danh sách bạn bè và follow/follower được cập nhật khi chấp nhận. |
| Main Flow | 1. Người dùng tìm và mở hồ sơ người muốn kết bạn.<br>2. Người dùng chọn gửi lời mời kết bạn.<br>3. Hệ thống kiểm tra không cho gửi lời mời cho chính mình, kiểm tra hai bên có chặn nhau không và người nhận có cho phép nhận lời mời không.<br>4. Hệ thống kiểm tra hai người chưa là bạn bè và chưa có lời mời đang chờ xử lý.<br>5. Hệ thống tạo lời mời kết bạn và gửi thông báo cho người nhận.<br>6. Người nhận mở danh sách lời mời kết bạn đến.<br>7. Người nhận chấp nhận lời mời.<br>8. Hệ thống cập nhật hai người thành bạn bè, đồng thời cập nhật quan hệ theo dõi phù hợp và gửi thông báo cho người gửi. |
| Alternative Flows | AF1: Người nhận từ chối lời mời, hệ thống xóa lời mời đang chờ xử lý.<br>AF2: Người gửi hủy lời mời đã gửi, hệ thống xóa lời mời nếu người gửi có quyền hủy.<br>AF3: Nếu hai người đã là bạn bè hoặc đã có lời mời đang chờ, hệ thống không tạo lời mời mới. |
| Exception | Thiếu id, gửi cho chính mình, người dùng không tồn tại, bị chặn, người nhận tắt nhận lời mời, request không tồn tại hoặc người thao tác không có quyền xử lý request. |
| Open Issues | Cần thống nhất cách giao diện hiển thị các trạng thái quan hệ: đã gửi lời mời, đã nhận lời mời, bạn bè hoặc chưa kết nối. |
