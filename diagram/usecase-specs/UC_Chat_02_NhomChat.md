# UC_Chat_02 - Quản lý nhóm chat

| Thuộc tính | Nội dung |
|---|---|
| User Case ID | UC_Chat_02 |
| Name | Quản lý nhóm chat |
| Goal | Cho phép người dùng tạo nhóm chat, thêm/xóa thành viên, rời nhóm và quản lý trạng thái hội thoại nhóm. |
| Actors | Người dùng |
| Pre-conditions | Người dùng đã đăng nhập; danh sách thành viên hợp lệ; hội thoại nhóm tồn tại khi thêm/xóa/rời nhóm. |
| Post-conditions | Hội thoại nhóm, danh sách thành viên hoặc trạng thái người dùng trong hội thoại được cập nhật. |
| Main Flow | 1. Người dùng chọn tạo nhóm chat mới.<br>2. Người dùng nhập tên nhóm và chọn các thành viên tham gia.<br>3. Hệ thống tạo hội thoại nhóm và hiển thị nhóm trong danh sách hội thoại.<br>4. Người dùng có quyền phù hợp có thể thêm thành viên mới vào nhóm.<br>5. Người dùng có quyền phù hợp có thể xóa thành viên khỏi nhóm.<br>6. Thành viên có thể rời khỏi nhóm chat.<br>7. Người dùng có thể tắt/bật thông báo, chặn/bỏ chặn hoặc xóa hội thoại nhóm khỏi danh sách của mình. |
| Alternative Flows | AF1: Người dùng hủy tạo nhóm trước khi xác nhận, hệ thống không tạo nhóm chat.<br>AF2: Thành viên có thể tự rời nhóm thay vì bị người khác xóa khỏi nhóm. |
| Exception | Thiếu tên nhóm/thành viên, hội thoại không tồn tại, không có quyền quản lý nhóm, thành viên không tồn tại hoặc lỗi service. |
| Open Issues | Cần làm rõ ai có quyền thêm hoặc xóa thành viên trong nhóm chat. |
