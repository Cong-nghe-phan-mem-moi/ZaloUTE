const express = require("express");
const router = express.Router();
const CommentController = require("../controllers/comment.controller");
const { authMiddleware } = require("../middlewares/authMiddleware");

// All comment routes require authentication
router.use(authMiddleware);
router.post("/:postId", CommentController.createComment);
router.get("/:postId", CommentController.getPostComments);
router.put("/:commentId", CommentController.updateComment);
router.delete("/:commentId", CommentController.deleteComment);
router.post("/:commentId/like", CommentController.toggleLikeComment);
router.get("/:commentId/replies", CommentController.getCommentReplies);

module.exports = router;
