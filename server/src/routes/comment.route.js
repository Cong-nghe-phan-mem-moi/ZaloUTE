const express = require("express");
const router = express.Router();
const CommentController = require("../controllers/comment.controller");
const { authMiddleware } = require("../middleware/authMiddleware");

// All comment routes require authentication
router.use(authMiddleware);

// Thêm bình luận
router.post("/:postId", CommentController.createComment);

// Lấy bình luận của bài viết
router.get("/:postId", CommentController.getPostComments);

// Chỉnh sửa bình luận
router.put("/:commentId", CommentController.updateComment);

// Xóa bình luận
router.delete("/:commentId", CommentController.deleteComment);

// Like/Unlike bình luận
router.post("/:commentId/like", CommentController.toggleLikeComment);

// Lấy reply của một bình luận
router.get("/:commentId/replies", CommentController.getCommentReplies);

module.exports = router;
