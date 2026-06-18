const CommentRepository = require("../repositories/comment.repository");
const Post = require("../models/post.model");
const NotificationService = require("./notification.service");

class CommentService {
  // Thêm bình luận
  static async createComment(postId, userId, content, replyTo = null) {
    if (!content || content.trim().length === 0) {
      throw new Error("Operation failed");
    }

    if (content.trim().length > 1000) {
      throw new Error("Operation failed");
    }

    const commentData = {
      post: postId,
      author: userId,
      content: content.trim(),
      replyTo: replyTo || null,
      likes: [],
    };

    const comment = await CommentRepository.createComment(commentData);

    await Post.findByIdAndUpdate(postId, { $inc: { commentCount: 1 } });

    if (!replyTo) {
      const post = await Post.findById(postId);

      await NotificationService.createNotification({
        receiver: post?.author,
        sender: userId,
        type: "post_comment",
        content: "commented on your post",
        preview: content.trim(),
        relatedId: comment._id,
        relatedType: "Comment",
        data: {
          postId,
          commentId: comment._id,
        },
      });
    } else {
      const parentComment = await CommentRepository.findCommentById(replyTo);

      await NotificationService.createNotification({
        receiver: parentComment?.author?._id || parentComment?.author,
        sender: userId,
        type: "comment_reply",
        content: "replied to your comment",
        preview: content.trim(),
        relatedId: comment._id,
        relatedType: "Comment",
        data: {
          postId,
          commentId: comment._id,
          parentCommentId: parentComment?._id || replyTo,
        },
      });
    }

    return await CommentRepository.findCommentById(comment._id);
  }

  // Chỉnh sửa bình luận
  static async updateComment(commentId, userId, content) {
    const comment = await CommentRepository.findCommentById(commentId);
    if (!comment) {
      throw new Error("Operation failed");
    }

    if (comment.author._id.toString() !== userId) {
      throw new Error("Operation failed");
    }

    if (!content || content.trim().length === 0) {
      throw new Error("Operation failed");
    }

    if (content.trim().length > 1000) {
      throw new Error("Operation failed");
    }

    return await CommentRepository.updateComment(commentId, {
      content: content.trim(),
    });
  }

  // Xóa bình luận
  static async deleteComment(commentId, userId) {
    const comment = await CommentRepository.findCommentById(commentId);
    if (!comment) {
      throw new Error("Operation failed");
    }

    if (comment.author._id.toString() !== userId) {
      throw new Error("Operation failed");
    }

    const result = await CommentRepository.deleteComment(commentId);
    await Post.findByIdAndUpdate(comment.post, {
      $inc: { commentCount: -Math.max(1, result.deletedCount || 1) },
    });

    return result;
  }

  // Like bình luận
  static async toggleLikeComment(commentId, userId) {
    const comment = await CommentRepository.findCommentById(commentId);
    if (!comment) {
      throw new Error("Operation failed");
    }

    const likeIndex = comment.likes.findIndex(
      (like) => like._id.toString() === userId,
    );

    let updatedComment;
    if (likeIndex > -1) {
      // Unlike
      updatedComment = await CommentRepository.removeLike(commentId, userId);
    } else {
      // Like
      updatedComment = await CommentRepository.addLike(commentId, userId);
      await NotificationService.createNotification({
        receiver: comment.author?._id || comment.author,
        sender: userId,
        type: "comment_like",
        content: "liked your comment",
        relatedId: commentId,
        relatedType: "Comment",
        data: {
          postId: comment.post,
          commentId,
          parentCommentId: comment.replyTo || null,
        },
      });
    }

    return {
      commentId,
      isLiked: likeIndex === -1,
      likeCount: updatedComment.likes.length,
    };
  }

  // Lấy các bình luận của một bài viết
  static async getPostComments(postId, page = 1, limit = 20) {
    if (page < 1) page = 1;
    if (limit < 1 || limit > 100) limit = 20;

    const skip = (page - 1) * limit;

    const comments = await CommentRepository.getCommentsByPost(
      postId,
      skip,
      limit,
    );
    const total = await CommentRepository.getCommentCountByPost(postId);
    const commentsWithReplyCount = await Promise.all(
      comments.map(async (comment) => {
        const commentObj = comment.toObject();
        commentObj.replyCount = await CommentRepository.getReplyCountByComment(
          comment._id,
        );
        return commentObj;
      }),
    );

    return {
      comments: commentsWithReplyCount,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // Lấy các reply của một bình luận
  static async getCommentReplies(commentId, page = 1, limit = 10) {
    if (page < 1) page = 1;
    if (limit < 1 || limit > 50) limit = 10;

    const skip = (page - 1) * limit;

    const replies = await CommentRepository.getRepliesByComment(
      commentId,
      skip,
      limit,
    );
    const total = await CommentRepository.getReplyCountByComment(commentId);
    const repliesWithReplyCount = await Promise.all(
      replies.map(async (reply) => {
        const replyObj = reply.toObject();
        replyObj.replyCount = await CommentRepository.getReplyCountByComment(
          reply._id,
        );
        return replyObj;
      }),
    );

    return {
      replies: repliesWithReplyCount,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}

module.exports = CommentService;



