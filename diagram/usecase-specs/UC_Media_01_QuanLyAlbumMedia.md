# UC_Media_01 - Quản lý album và media

| Thuộc tính | Nội dung |
|---|---|
| User Case ID | UC_Media_01 |
| Name | Quản lý album và media |
| Goal | Cho phép người dùng xem media/album, tạo/cập nhật/xóa album và tải media khi có quyền. |
| Actors | Người dùng |
| Pre-conditions | Người dùng đã đăng nhập; media hoặc album tồn tại; người dùng có quyền truy cập. |
| Post-conditions | Danh sách media/album được trả về hoặc album được cập nhật; file media được tải xuống nếu hợp lệ. |
| Main Flow | 1. Người dùng mở trang media hoặc album của mình hoặc của người dùng khác.<br>2. Hệ thống kiểm tra quyền xem theo chủ sở hữu và thiết lập riêng tư.<br>3. Hệ thống hiển thị danh sách hình ảnh, video hoặc album phù hợp.<br>4. Người dùng tạo album mới bằng cách nhập thông tin album.<br>5. Người dùng cập nhật thông tin album hoặc xóa album nếu có quyền.<br>6. Người dùng chọn một media để tải xuống.<br>7. Hệ thống kiểm tra quyền tải và cung cấp file media cho người dùng. |
| Alternative Flows | AF1: Người dùng chỉ xem media của người khác nếu được phép theo quyền riêng tư.<br>AF2: Nếu media được lưu ở nguồn bên ngoài, hệ thống chuyển người dùng đến nguồn media phù hợp. |
| Exception | Album/media không tồn tại, người dùng không có quyền truy cập/tải xuống hoặc file media không thể tải. |
| Open Issues | Cần mô tả rõ album có quyền riêng tư riêng hay kế thừa từ bài viết/media. |
