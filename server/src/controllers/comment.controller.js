const CommentService = require("../services/comment.service");

class CommentController {
  static async createComment(req, res) {
    try {
      const { postId } = req.params;
      const { content, replyTo } = req.body;
      const userId = req.user.userId;

      const comment = await CommentService.createComment(
        postId,
        userId,
        content,
        replyTo,
      );

      return res.status(201).json({
        success: true,
        message: "Operation failed",
        data: comment,
      });
    } catch (error) {
      console.error("Error creating comment:", error);
      return res.status(400).json({
        success: false,
        message: error.message || "Operation failed",
      });
    }
  }
  static async updateComment(req, res) {
    try {
      const { commentId } = req.params;
      const { content } = req.body;
      const userId = req.user.userId;

      const comment = await CommentService.updateComment(
        commentId,
        userId,
        content,
      );

      return res.status(200).json({
        success: true,
        message: "Operation failed",
        data: comment,
      });
    } catch (error) {
      console.error("Error updating comment:", error);

      if (error.message.includes("Operation failed")) {
        return res.status(404).json({
          success: false,
          message: error.message,
        });
      }

      if (error.message.includes("Operation failed")) {
        return res.status(403).json({
          success: false,
          message: error.message,
        });
      }

      return res.status(400).json({
        success: false,
        message: error.message || "Operation failed",
      });
    }
  }
  static async deleteComment(req, res) {
    try {
      const { commentId } = req.params;
      const userId = req.user.userId;

      await CommentService.deleteComment(commentId, userId);

      return res.status(200).json({
        success: true,
        message: "Operation failed",
      });
    } catch (error) {
      console.error("Error deleting comment:", error);

      if (error.message.includes("Operation failed")) {
        return res.status(404).json({
          success: false,
          message: error.message,
        });
      }

      if (error.message.includes("Operation failed")) {
        return res.status(403).json({
          success: false,
          message: error.message,
        });
      }

      return res.status(400).json({
        success: false,
        message: error.message || "Operation failed",
      });
    }
  }
  static async toggleLikeComment(req, res) {
    try {
      const { commentId } = req.params;
      const userId = req.user.userId;

      const result = await CommentService.toggleLikeComment(commentId, userId);

      return res.status(200).json({
        success: true,
        message: result.isLiked ? "Liked" : "Unliked",
        data: result,
      });
    } catch (error) {
      console.error("Error toggling comment like:", error);

      if (error.message.includes("Operation failed")) {
        return res.status(404).json({
          success: false,
          message: error.message,
        });
      }

      return res.status(400).json({
        success: false,
        message: error.message || "Operation failed",
      });
    }
  }
  static async getPostComments(req, res) {
    try {
      const { postId } = req.params;
      const { page = 1, limit = 20 } = req.query;
      const userId = req.user.userId;

      const result = await CommentService.getPostComments(
        postId,
        parseInt(page),
        parseInt(limit),
        userId,
      );

      return res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      console.error("Error fetching comments:", error);
      return res.status(400).json({
        success: false,
        message: error.message || "Operation failed",
      });
    }
  }
  static async getCommentReplies(req, res) {
    try {
      const { commentId } = req.params;
      const { page = 1, limit = 10 } = req.query;
      const userId = req.user.userId;

      const result = await CommentService.getCommentReplies(
        commentId,
        parseInt(page),
        parseInt(limit),
        userId,
      );

      return res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      console.error("Error fetching replies:", error);
      return res.status(400).json({
        success: false,
        message: error.message || "Operation failed",
      });
    }
  }
}

module.exports = CommentController;



