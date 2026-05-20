const Comment = require("../models/comment.model");

class CommentRepository {
  // Tạo bình luận
  static async createComment(commentData) {
    return await Comment.create(commentData);
  }

  // Tìm bình luận theo ID
  static async findCommentById(commentId) {
    return await Comment.findById(commentId)
      .populate("author", "fullName avatar email")
      .populate("post", "_id")
      .populate({
        path: "replyTo",
        populate: {
          path: "author",
          select: "fullName avatar email",
        },
      });
  }

  // Cập nhật bình luận
  static async updateComment(commentId, updateData) {
    return await Comment.findByIdAndUpdate(commentId, updateData, {
      new: true,
    })
      .populate("author", "fullName avatar email")
      .populate("post", "_id")
      .populate({
        path: "replyTo",
        populate: {
          path: "author",
          select: "fullName avatar email",
        },
      });
  }

  // Xóa bình luận
  static async deleteComment(commentId) {
    // Xóa các reply của bình luận này
    await Comment.deleteMany({ replyTo: commentId });
    // Xóa bình luận
    return await Comment.findByIdAndDelete(commentId);
  }

  // Thêm like
  static async addLike(commentId, userId) {
    return await Comment.findByIdAndUpdate(
      commentId,
      { $addToSet: { likes: userId } },
      { new: true },
    )
      .populate("author", "fullName avatar email")
      .populate("post", "_id");
  }

  // Xóa like
  static async removeLike(commentId, userId) {
    return await Comment.findByIdAndUpdate(
      commentId,
      { $pull: { likes: userId } },
      { new: true },
    )
      .populate("author", "fullName avatar email")
      .populate("post", "_id");
  }

  // Lấy bình luận của bài viết
  static async getCommentsByPost(postId, skip = 0, limit = 20) {
    return await Comment.find({ post: postId, replyTo: null })
      .populate("author", "fullName avatar email")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
  }

  // Đếm bình luận của bài viết
  static async getCommentCountByPost(postId) {
    return await Comment.countDocuments({ post: postId, replyTo: null });
  }

  // Lấy reply của một bình luận
  static async getRepliesByComment(commentId, skip = 0, limit = 10) {
    return await Comment.find({ replyTo: commentId })
      .populate("author", "fullName avatar email")
      .sort({ createdAt: 1 })
      .skip(skip)
      .limit(limit);
  }

  // Đếm reply của một bình luận
  static async getReplyCountByComment(commentId) {
    return await Comment.countDocuments({ replyTo: commentId });
  }
}

module.exports = CommentRepository;
