# UC_Group_01 - Tạo và xem nhóm cộng đồng

| Thuộc tính | Nội dung |
|---|---|
| User Case ID | UC_Group_01 |
| Name | Tạo và xem nhóm cộng đồng |
| Goal | Cho phép người dùng tạo nhóm cộng đồng, xem danh sách nhóm của mình, lời mời nhóm và chi tiết nhóm. |
| Actors | Người dùng |
| Pre-conditions | Người dùng đã đăng nhập; dữ liệu nhóm hợp lệ; nếu upload avatar thì file hợp lệ. |
| Post-conditions | Nhóm mới được tạo hoặc dữ liệu nhóm được trả về. |
| Main Flow | 1. Người dùng mở trang nhóm cộng đồng.<br>2. Người dùng chọn tạo nhóm mới.<br>3. Người dùng nhập tên nhóm, mô tả, ảnh đại diện và thiết lập nhóm riêng tư/công khai.<br>4. Người dùng có thể mời một số người dùng tham gia nhóm ngay khi tạo.<br>5. Hệ thống kiểm tra thông tin nhóm và lưu nhóm mới.<br>6. Hệ thống hiển thị nhóm trong danh sách nhóm của người dùng.<br>7. Người dùng có thể xem danh sách nhóm của mình, danh sách lời mời nhóm và chi tiết từng nhóm. |
| Alternative Flows | AF1: Nếu không chọn ảnh đại diện, hệ thống tạo nhóm với ảnh mặc định hoặc không có ảnh.<br>AF2: Nếu không mời thành viên ban đầu, nhóm vẫn được tạo. |
| Exception | Dữ liệu nhóm không hợp lệ, lỗi upload avatar, nhóm không tồn tại khi xem chi tiết hoặc lỗi service. |
| Open Issues | Cần mô tả rõ nhóm riêng tư/công khai ảnh hưởng thế nào đến quyền xem và yêu cầu tham gia. |
