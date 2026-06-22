const Comment = require("../models/comment.model");

class CommentRepository {
  static async createComment(commentData) {
    return await Comment.create(commentData);
  }
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
  static async deleteComment(commentId) {
    const idsToDelete = [commentId];
    let parentIds = [commentId];

    while (parentIds.length > 0) {
      const replies = await Comment.find({
        replyTo: { $in: parentIds },
      }).select("_id");
      parentIds = replies.map((reply) => reply._id);
      idsToDelete.push(...parentIds);
    }

    return await Comment.deleteMany({ _id: { $in: idsToDelete } });
  }
  static async addLike(commentId, userId) {
    return await Comment.findByIdAndUpdate(
      commentId,
      { $addToSet: { likes: userId } },
      { new: true },
    )
      .populate("author", "fullName avatar email")
      .populate("post", "_id");
  }
  static async removeLike(commentId, userId) {
    return await Comment.findByIdAndUpdate(
      commentId,
      { $pull: { likes: userId } },
      { new: true },
    )
      .populate("author", "fullName avatar email")
      .populate("post", "_id");
  }
  static async getCommentsByPost(postId, skip = 0, limit = 20) {
    return await Comment.find({ post: postId, replyTo: null })
      .populate("author", "fullName avatar email")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
  }
  static async getCommentCountByPost(postId) {
    return await Comment.countDocuments({ post: postId });
  }
  static async getRepliesByComment(commentId, skip = 0, limit = 10) {
    return await Comment.find({ replyTo: commentId })
      .populate("author", "fullName avatar email")
      .sort({ createdAt: 1 })
      .skip(skip)
      .limit(limit);
  }
  static async getReplyCountByComment(commentId) {
    return await Comment.countDocuments({ replyTo: commentId });
  }
}

module.exports = CommentRepository;
