# UC_Post_03 - Xem và tìm kiếm bài viết

| Thuộc tính | Nội dung |
|---|---|
| User Case ID | UC_Post_03 |
| Name | Xem và tìm kiếm bài viết |
| Goal | Cho phép người dùng xem news feed, bài viết gợi ý, chi tiết bài viết, bài viết theo tác giả và tìm kiếm bài viết. |
| Actors | Người dùng |
| Pre-conditions | Người dùng đã đăng nhập. |
| Post-conditions | Hệ thống trả danh sách bài viết hoặc chi tiết bài viết phù hợp với request. |
| Main Flow | 1. Người dùng mở trang chủ để xem news feed.<br>2. Hệ thống tải danh sách bài viết phù hợp với người dùng.<br>3. Người dùng cuộn hoặc chuyển trang để xem thêm bài viết.<br>4. Người dùng có thể chọn sắp xếp hoặc xem bài viết mới nhất nếu giao diện hỗ trợ.<br>5. Người dùng nhập từ khóa để tìm kiếm bài viết.<br>6. Người dùng có thể mở trang cá nhân của một tác giả để xem bài viết theo tác giả.<br>7. Người dùng chọn một bài viết để xem chi tiết nội dung, media và tương tác. |
| Alternative Flows | AF1: Nếu không có bài viết phù hợp, hệ thống hiển thị danh sách rỗng hoặc thông báo phù hợp.<br>AF2: Nếu người dùng xem bài viết gợi ý, hệ thống hiển thị một số bài nổi bật/phù hợp. |
| Exception | Bài viết không tồn tại, từ khóa không hợp lệ, lỗi truy vấn hoặc người dùng không có quyền xem, hệ thống thông báo lỗi phù hợp. |
| Open Issues | Thuật toán news feed/gợi ý không thể hiện hết ở controller; nếu báo cáo cần chi tiết nên mô tả thêm từ service. |
