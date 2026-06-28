# UC_Rel_01 - Tìm kiếm người dùng

| Thuộc tính | Nội dung |
|---|---|
| User Case ID | UC_Rel_01 |
| Name | Tìm kiếm người dùng |
| Goal | Cho phép người dùng tìm kiếm người dùng khác hoặc tìm kiếm toàn cục theo từ khóa. |
| Actors | Người dùng |
| Pre-conditions | Người dùng đã đăng nhập. |
| Post-conditions | Hệ thống trả danh sách kết quả tìm kiếm phù hợp với từ khóa và bộ lọc. |
| Main Flow | 1. Người dùng nhập từ khóa vào ô tìm kiếm.<br>2. Người dùng có thể chọn phạm vi hoặc bộ lọc tìm kiếm nếu giao diện hỗ trợ.<br>3. Hệ thống kiểm tra từ khóa có rỗng hay không.<br>4. Hệ thống tìm kiếm người dùng và các nội dung liên quan theo từ khóa.<br>5. Hệ thống hiển thị danh sách kết quả phù hợp.<br>6. Người dùng chọn một kết quả để xem chi tiết hoặc thực hiện hành động tiếp theo. |
| Alternative Flows | AF1: Nếu không có kết quả phù hợp, hệ thống hiển thị danh sách rỗng hoặc thông báo không tìm thấy.<br>AF2: Nếu người dùng thay đổi bộ lọc, hệ thống tải lại kết quả theo bộ lọc mới. |
| Exception | Từ khóa rỗng, tham số không hợp lệ hoặc lỗi truy vấn, hệ thống trả lỗi `GLOBAL_SEARCH_ERROR` hoặc lỗi tương ứng. |
| Open Issues | Cần ghi rõ các loại tìm kiếm được hỗ trợ chính thức trong báo cáo. |
