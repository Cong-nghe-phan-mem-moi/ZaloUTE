# UC_Report_01 - Gửi báo cáo nội dung

| Thuộc tính | Nội dung |
|---|---|
| User Case ID | UC_Report_01 |
| Name | Gửi báo cáo nội dung |
| Goal | Cho phép người dùng báo cáo nội dung vi phạm để quản trị viên xử lý. |
| Actors | Người dùng |
| Pre-conditions | Người dùng đã đăng nhập; nội dung cần báo cáo tồn tại theo dữ liệu gửi lên. |
| Post-conditions | Báo cáo được tạo và lưu trong hệ thống. |
| Main Flow | 1. Người dùng chọn chức năng báo cáo tại nội dung cần phản ánh.<br>2. Người dùng nhập hoặc chọn lý do báo cáo.<br>3. Hệ thống kiểm tra người dùng đã đăng nhập và dữ liệu báo cáo hợp lệ.<br>4. Hệ thống ghi nhận báo cáo.<br>5. Hệ thống thông báo gửi báo cáo thành công.<br>6. Báo cáo được đưa vào danh sách để quản trị viên xử lý. |
| Alternative Flows | AF1: Người dùng hủy thao tác trước khi gửi, hệ thống không tạo report. |
| Exception | Dữ liệu báo cáo không hợp lệ, nội dung bị báo cáo không tồn tại hoặc hệ thống không thể ghi nhận báo cáo. |
| Open Issues | Cần mô tả rõ các loại đối tượng có thể bị báo cáo: bài viết, bình luận, người dùng hoặc nội dung khác. |
