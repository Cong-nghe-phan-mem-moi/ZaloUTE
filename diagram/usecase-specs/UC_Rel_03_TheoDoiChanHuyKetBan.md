# UC_Rel_03 - Theo dõi, chặn và hủy kết bạn

| Thuộc tính | Nội dung |
|---|---|
| User Case ID | UC_Rel_03 |
| Name | Theo dõi, chặn và hủy kết bạn |
| Goal | Cho phép người dùng theo dõi/bỏ theo dõi, chặn/bỏ chặn người dùng khác và hủy kết bạn. |
| Actors | Người dùng |
| Pre-conditions | Người dùng đã đăng nhập; người dùng mục tiêu tồn tại. |
| Post-conditions | Trạng thái quan hệ giữa hai người dùng được cập nhật trong hồ sơ người dùng. |
| Main Flow | 1. Người dùng mở hồ sơ của người dùng khác.<br>2. Người dùng chọn theo dõi để nhận cập nhật từ người đó.<br>3. Nếu người dùng đã theo dõi, chọn lại thao tác sẽ bỏ theo dõi.<br>4. Người dùng có thể chọn chặn người dùng khác khi không muốn tiếp tục tương tác.<br>5. Hệ thống cập nhật danh sách người bị chặn và hạn chế các tương tác liên quan.<br>6. Người dùng có thể xem danh sách người đã chặn và chọn bỏ chặn.<br>7. Nếu hai người là bạn bè, người dùng có thể chọn hủy kết bạn.<br>8. Hệ thống kiểm tra quan hệ bạn bè và xóa quan hệ bạn bè hai chiều. |
| Alternative Flows | AF1: Nếu người dùng đã theo dõi, thao tác theo dõi sẽ chuyển thành bỏ theo dõi.<br>AF2: Nếu hai bên không phải bạn bè, hệ thống không cho thực hiện hủy kết bạn. |
| Exception | Không được thao tác với chính mình, thiếu id mục tiêu, người dùng không tồn tại, không phải bạn bè khi hủy kết bạn hoặc lỗi server. |
| Open Issues | Cần làm rõ việc chặn có tự động xóa bạn bè/follow trong mọi trường hợp hay chỉ hạn chế tương tác. |
