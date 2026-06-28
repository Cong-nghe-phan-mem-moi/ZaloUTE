# UC_Post_04 - Tương tác bài viết

| Thuộc tính | Nội dung |
|---|---|
| User Case ID | UC_Post_04 |
| Name | Tương tác bài viết |
| Goal | Cho phép người dùng thích/bỏ thích, xem danh sách người thích, bình luận, chia sẻ, lưu hoặc ẩn bài viết. |
| Actors | Người dùng |
| Pre-conditions | Người dùng đã đăng nhập; bài viết tồn tại và người dùng có quyền xem/tương tác. |
| Post-conditions | Trạng thái tương tác của bài viết, bình luận hoặc chia sẻ được cập nhật. |
| Main Flow | 1. Người dùng mở một bài viết.<br>2. Người dùng chọn thích bài viết; nếu đã thích, thao tác này sẽ bỏ thích.<br>3. Người dùng có thể xem danh sách những người đã thích bài viết.<br>4. Người dùng nhập bình luận cho bài viết hoặc trả lời một bình luận có sẵn.<br>5. Hệ thống hiển thị danh sách bình luận và phản hồi.<br>6. Người dùng có thể sửa hoặc xóa bình luận của mình nếu có quyền.<br>7. Người dùng có thể thích hoặc bỏ thích bình luận.<br>8. Người dùng chia sẻ bài viết lên dòng thời gian hoặc gửi vào hội thoại.<br>9. Người dùng có thể lưu bài viết để xem lại hoặc ẩn bài viết khỏi feed của mình. |
| Alternative Flows | AF1: Nếu người dùng đã thích/lưu, thao tác lặp lại sẽ bỏ thích/bỏ lưu.<br>AF2: Khi chia sẻ, người dùng có thể thêm lời nhắn hoặc chọn nơi chia sẻ. |
| Exception | Bài viết/bình luận không tồn tại, không có quyền sửa/xóa, nội dung bình luận không hợp lệ hoặc lỗi service. |
| Open Issues | Cần làm rõ hệ thống có hỗ trợ nhiều loại cảm xúc ngoài “thích” hay không. |
