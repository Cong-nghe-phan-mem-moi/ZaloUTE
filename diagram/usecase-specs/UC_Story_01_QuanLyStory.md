# UC_Story_01 - Quản lý story

| Thuộc tính | Nội dung |
|---|---|
| User Case ID | UC_Story_01 |
| Name | Quản lý story |
| Goal | Cho phép người dùng tạo, xem, đánh dấu đã xem, thả cảm xúc, phản hồi, xem người đã xem và xóa story. |
| Actors | Người dùng |
| Pre-conditions | Người dùng đã đăng nhập; nếu tạo story có media thì file đính kèm hợp lệ. |
| Post-conditions | Story được tạo/cập nhật/xóa; trạng thái xem, reaction hoặc reply được ghi nhận. |
| Main Flow | 1. Người dùng mở khu vực story.<br>2. Hệ thống hiển thị danh sách story còn hoạt động.<br>3. Người dùng tạo story mới bằng nội dung và media nếu có.<br>4. Hệ thống kiểm tra dữ liệu, lưu story và hiển thị story mới.<br>5. Người dùng chọn một story để xem chi tiết.<br>6. Hệ thống đánh dấu story là đã xem đối với người dùng hiện tại.<br>7. Người dùng có thể thả cảm xúc hoặc gửi phản hồi cho story.<br>8. Tác giả story có thể xem danh sách người đã xem.<br>9. Tác giả có thể xóa story của mình. |
| Alternative Flows | AF1: Người dùng chỉ xem danh sách story và không tương tác.<br>AF2: Người dùng xem story nhưng không thả cảm xúc hoặc phản hồi. |
| Exception | Story không tồn tại, story hết hạn/không hoạt động, không có quyền xem/xóa, lỗi upload hoặc nội dung phản hồi không hợp lệ. |
| Open Issues | Cần ghi rõ thời gian story còn hoạt động trong tài liệu yêu cầu. |
