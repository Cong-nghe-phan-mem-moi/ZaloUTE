# UC_Group_03 - Quản trị nhóm cộng đồng

| Thuộc tính | Nội dung |
|---|---|
| User Case ID | UC_Group_03 |
| Name | Quản trị nhóm cộng đồng |
| Goal | Cho phép quản trị viên nhóm chỉnh sửa thông tin nhóm, gán quyền admin, loại thành viên và duyệt/từ chối bài viết trong nhóm. |
| Actors | Quản trị viên nhóm |
| Pre-conditions | Quản trị viên đã đăng nhập; nhóm tồn tại; người thao tác có quyền quản trị nhóm. |
| Post-conditions | Thông tin nhóm, vai trò thành viên, danh sách thành viên hoặc trạng thái bài viết nhóm được cập nhật. |
| Main Flow | 1. Quản trị viên mở trang quản trị nhóm.<br>2. Quản trị viên chỉnh sửa tên nhóm, mô tả, ảnh đại diện hoặc thiết lập riêng tư/công khai.<br>3. Hệ thống kiểm tra quyền và lưu thông tin nhóm mới.<br>4. Quản trị viên gán quyền quản trị viên cho thành viên khác khi cần.<br>5. Quản trị viên loại thành viên khỏi nhóm khi cần.<br>6. Quản trị viên xem danh sách bài viết trong nhóm.<br>7. Với bài viết cần duyệt, quản trị viên chọn duyệt hoặc từ chối.<br>8. Hệ thống cập nhật trạng thái bài viết và thông tin nhóm/thành viên tương ứng. |
| Alternative Flows | AF1: Quản trị viên cập nhật thông tin nhóm nhưng không thay đổi ảnh đại diện.<br>AF2: Quản trị viên chỉ xem danh sách bài chờ duyệt mà không xử lý. |
| Exception | Không có quyền admin nhóm, nhóm/thành viên/bài viết không tồn tại, dữ liệu cập nhật không hợp lệ hoặc lỗi service. |
| Open Issues | Cần làm rõ quyền của chủ nhóm so với quản trị viên nhóm nếu hệ thống có phân biệt. |
