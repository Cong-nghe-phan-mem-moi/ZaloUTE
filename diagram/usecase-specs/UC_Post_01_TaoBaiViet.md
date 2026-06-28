# UC_Post_01 - Tạo bài viết

| Thuộc tính | Nội dung |
|---|---|
| User Case ID | UC_Post_01 |
| Name | Tạo bài viết |
| Goal | Cho phép người dùng tạo bài viết với nội dung văn bản, media và tùy chọn đăng vào nhóm. |
| Actors | Người dùng |
| Pre-conditions | Người dùng đã đăng nhập; nếu có media thì file đính kèm hợp lệ. |
| Post-conditions | Bài viết được tạo. Nếu đăng vào nhóm cần duyệt, bài có thể ở trạng thái `pending`. |
| Main Flow | 1. Người dùng mở khung tạo bài viết.<br>2. Người dùng nhập nội dung bài viết.<br>3. Người dùng có thể đính kèm hình ảnh hoặc video.<br>4. Người dùng có thể chọn đăng bài lên trang cá nhân hoặc trong một nhóm.<br>5. Hệ thống kiểm tra nội dung, file media và quyền đăng bài.<br>6. Hệ thống lưu bài viết và media đi kèm.<br>7. Nếu bài viết thuộc nhóm cần duyệt, hệ thống đưa bài vào trạng thái chờ duyệt; nếu không, bài viết được hiển thị sau khi tạo. |
| Alternative Flows | AF1: Người dùng tạo bài viết không có media, mảng media rỗng.<br>AF2: Người dùng đăng bài vào nhóm bằng cách truyền `groupId`. |
| Exception | Lỗi upload, nội dung/nhóm không hợp lệ, không có quyền đăng nhóm hoặc lỗi tạo bài, hệ thống trả lỗi 400. |
| Open Issues | Cần thống nhất trong báo cáo bài viết nhóm do quản trị viên nhóm hay quản trị viên hệ thống duyệt. |
