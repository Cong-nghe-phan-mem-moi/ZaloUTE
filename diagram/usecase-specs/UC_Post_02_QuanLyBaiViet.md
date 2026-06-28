# UC_Post_02 - Quản lý bài viết

| Thuộc tính | Nội dung |
|---|---|
| User Case ID | UC_Post_02 |
| Name | Quản lý bài viết |
| Goal | Cho phép tác giả chỉnh sửa hoặc xóa bài viết đã tạo. |
| Actors | Người dùng |
| Pre-conditions | Người dùng đã đăng nhập; bài viết tồn tại; người dùng có quyền chỉnh sửa/xóa bài viết. |
| Post-conditions | Bài viết được cập nhật nội dung/media hoặc bị xóa theo thao tác. |
| Main Flow | 1. Người dùng mở bài viết do mình tạo.<br>2. Người dùng chọn chỉnh sửa bài viết.<br>3. Người dùng thay đổi nội dung, giữ lại media cũ, xóa media cũ hoặc thêm media mới.<br>4. Hệ thống kiểm tra người dùng có quyền chỉnh sửa bài viết không.<br>5. Hệ thống kiểm tra dữ liệu và file media mới nếu có.<br>6. Hệ thống lưu thay đổi và hiển thị bài viết đã cập nhật.<br>7. Nếu người dùng chọn xóa bài viết, hệ thống yêu cầu xác nhận và kiểm tra quyền xóa.<br>8. Hệ thống xóa bài viết khỏi phạm vi hiển thị sau khi xác nhận. |
| Alternative Flows | AF1: Người dùng chỉ sửa nội dung, không thay đổi media.<br>AF2: Người dùng hủy thao tác chỉnh sửa hoặc xóa, bài viết giữ nguyên. |
| Exception | Bài viết không tồn tại, người dùng không có quyền thao tác, file media không hợp lệ hoặc hệ thống không thể lưu thay đổi. |
| Open Issues | Cần làm rõ xóa bài là xóa mềm hay xóa vĩnh viễn trong thiết kế dữ liệu. |
