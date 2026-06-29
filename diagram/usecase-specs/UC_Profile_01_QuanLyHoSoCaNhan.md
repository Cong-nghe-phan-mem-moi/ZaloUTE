# UC_Profile_01 - Quản lý hồ sơ cá nhân

| Thuộc tính | Nội dung |
|---|---|
| User Case ID | UC_Profile_01 |
| Name | Quản lý hồ sơ cá nhân |
| Goal | Cho phép người dùng xem và chỉnh sửa thông tin hồ sơ cá nhân, avatar và ảnh bìa. |
| Actors | Người dùng |
| Pre-conditions | Người dùng đã đăng nhập. |
| Post-conditions | Hồ sơ cá nhân được hiển thị hoặc cập nhật trong cơ sở dữ liệu. |
| Main Flow | 1. Người dùng mở trang hồ sơ cá nhân.<br>2. Hệ thống tải và hiển thị thông tin hồ sơ của người dùng.<br>3. Người dùng chọn chỉnh sửa hồ sơ.<br>4. Người dùng cập nhật các thông tin như họ tên, số điện thoại, giới thiệu, ngày sinh, giới tính, địa chỉ hoặc liên kết mạng xã hội.<br>5. Hệ thống kiểm tra dữ liệu cập nhật.<br>6. Hệ thống lưu thay đổi và hiển thị hồ sơ mới.<br>7. Nếu người dùng cập nhật ảnh đại diện hoặc ảnh bìa, hệ thống kiểm tra file ảnh và lưu ảnh mới vào hồ sơ. |
| Alternative Flows | AF1: Người dùng chỉ xem hồ sơ, không chỉnh sửa.<br>AF2: Người dùng chỉ cập nhật ảnh đại diện hoặc ảnh bìa. |
| Exception | Không có dữ liệu cập nhật, file ảnh không hợp lệ, hồ sơ không tồn tại hoặc dữ liệu không đúng định dạng. |
| Open Issues | Cần thống nhất các trường hồ sơ bắt buộc và giới hạn kích thước ảnh. |
