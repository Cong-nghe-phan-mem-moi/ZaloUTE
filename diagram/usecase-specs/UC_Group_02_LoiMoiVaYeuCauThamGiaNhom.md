# UC_Group_02 - Quản lý lời mời và yêu cầu tham gia nhóm

| Thuộc tính | Nội dung |
|---|---|
| User Case ID | UC_Group_02 |
| Name | Quản lý lời mời và yêu cầu tham gia nhóm |
| Goal | Cho phép quản trị viên nhóm mời/hủy lời mời và duyệt yêu cầu tham gia; người dùng chấp nhận/từ chối lời mời hoặc gửi yêu cầu tham gia. |
| Actors | Người dùng, Quản trị viên nhóm |
| Pre-conditions | Người dùng đã đăng nhập; nhóm tồn tại; các thao tác mời, hủy lời mời và duyệt yêu cầu yêu cầu quyền quản trị viên nhóm. |
| Post-conditions | Trạng thái lời mời, yêu cầu tham gia hoặc danh sách thành viên nhóm được cập nhật. |
| Main Flow | 1. Quản trị viên nhóm mở trang quản lý thành viên hoặc lời mời.<br>2. Quản trị viên chọn người dùng cần mời vào nhóm.<br>3. Hệ thống kiểm tra quyền quản trị viên và tạo lời mời tham gia nhóm.<br>4. Người được mời xem danh sách lời mời nhóm.<br>5. Người được mời chấp nhận lời mời để trở thành thành viên nhóm.<br>6. Người dùng khác có thể gửi yêu cầu tham gia nhóm.<br>7. Quản trị viên xem danh sách yêu cầu tham gia.<br>8. Quản trị viên duyệt yêu cầu và hệ thống thêm người dùng vào nhóm. |
| Alternative Flows | AF1: Quản trị viên hủy lời mời đã gửi trước khi người dùng phản hồi.<br>AF2: Người được mời từ chối lời mời, hệ thống không thêm người đó vào nhóm.<br>AF3: Quản trị viên từ chối yêu cầu tham gia, hệ thống không thêm người yêu cầu vào nhóm. |
| Exception | Người thao tác không có quyền quản trị nhóm, nhóm không tồn tại, người dùng không tồn tại, đã là thành viên, lời mời/yêu cầu không tồn tại hoặc hệ thống không thể xử lý. |
| Open Issues | Cần thống nhất cách hiển thị trạng thái lời mời và yêu cầu tham gia trên giao diện. |
