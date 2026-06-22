const PostService = require('../services/post.service');
const path = require('path');

class PostController {
  // 4.1 Tạo bài viết
  static async createPost(req, res) {
    try {
      const { content, groupId } = req.body;
      const userId = req.user.userId;

      console.log('CreatePost - req.body:', req.body);
      console.log('CreatePost - content:', content);
      console.log('CreatePost - userId:', userId);
      console.log('CreatePost - req.files:', req.files?.length);

      // Process uploaded files
      const media = [];
      if (req.files && req.files.length > 0) {
        req.files.forEach((file) => {
          const fileUrl = `/uploads/${file.filename}`;
          const fileType = file.mimetype.startsWith('image/') ? 'image' : 'video';
          media.push({
            type: fileType,
            url: fileUrl,
            filename: file.filename,
            mimetype: file.mimetype,
          });
        });
      }

      const post = await PostService.createPost(userId, content, media, {
        ...req.body,
        groupId: groupId || null,
      });

      return res.status(201).json({
        success: true,
        message: post.approvalStatus === 'pending'
          ? 'Bài viết đã gửi và đang chờ admin duyệt'
          : 'Đã tạo bài viết',
        data: post,
      });
    } catch (error) {
      console.error('Error creating post:', error);
      return res.status(400).json({
        success: false,
        message: error.message || 'Operation failed',
      });
    }
  }

  static async sharePost(req, res) {
    try {
      const { postId } = req.params;
      const { caption = '', target = 'timeline', conversationId = null } = req.body;
      const userId = req.user.userId;

      const result = await PostService.sharePost(
        postId,
        userId,
        caption,
        target,
        conversationId,
        req.body,
      );

      return res.status(201).json({
        success: true,
        message: target === 'message' ? 'Post shared to message' : 'Post shared',
        data: result,
      });
    } catch (error) {
      console.error('Error sharing post:', error);

      return res.status(400).json({
        success: false,
        message: error.message || 'Operation failed',
      });
    }
  }

  // 4.2 Chỉnh sửa bài viết
  static async updatePost(req, res) {
    try {
      const { postId } = req.params;
      const { content, existingMedia } = req.body;
      const userId = req.user.userId;

      // Process uploaded files
      const media = [];
      
      // Add existing media if provided
      if (existingMedia) {
        try {
          const parsed = JSON.parse(existingMedia);
          media.push(...parsed);
        } catch (e) {
          console.error('Error parsing existingMedia:', e);
        }
      }
      
      // Add newly uploaded files
      if (req.files && req.files.length > 0) {
        req.files.forEach((file) => {
          const fileUrl = `/uploads/${file.filename}`;
          const fileType = file.mimetype.startsWith('image/') ? 'image' : 'video';
          media.push({
            type: fileType,
            url: fileUrl,
            filename: file.filename,
            mimetype: file.mimetype,
          });
        });
      }

      const post = await PostService.updatePost(postId, userId, content, media, req.body);

      return res.status(200).json({
        success: true,
        message: 'Operation failed',
        data: post,
      });
    } catch (error) {
      console.error('Error updating post:', error);

      if (error.message.includes('Operation failed')) {
        return res.status(404).json({
          success: false,
          message: error.message,
        });
      }

      if (error.message.includes('Operation failed')) {
        return res.status(403).json({
          success: false,
          message: error.message,
        });
      }

      return res.status(400).json({
        success: false,
        message: error.message || 'Operation failed',
      });
    }
  }

  // 4.3 Xóa bài viết
  static async deletePost(req, res) {
    try {
      const { postId } = req.params;
      const userId = req.user.userId;

      await PostService.deletePost(postId, userId);

      return res.status(200).json({
        success: true,
        message: 'Operation failed',
      });
    } catch (error) {
      console.error('Error deleting post:', error);

      if (error.message.includes('Operation failed')) {
        return res.status(404).json({
          success: false,
          message: error.message,
        });
      }

      if (error.message.includes('Operation failed')) {
        return res.status(403).json({
          success: false,
          message: error.message,
        });
      }

      return res.status(400).json({
        success: false,
        message: error.message || 'Operation failed',
      });
    }
  }

  // 4.4 Xem news feed
  static async getNewsFeed(req, res) {
    try {
      const { page = 1, limit = 10, sortBy = 'newest' } = req.query;
      const userId = req.user.userId;

      const result = await PostService.getNewsFeed(
        parseInt(page),
        parseInt(limit),
        userId,
        sortBy,
      );

      return res.status(200).json({
        success: true,
        message: 'Operation failed',
        data: result,
      });
    } catch (error) {
      console.error('Error fetching news feed:', error);
      return res.status(500).json({
        success: false,
        message: 'Operation failed',
        error: error.message,
      });
    }
  }

  static async getSuggestedPosts(req, res) {
    try {
      const { limit = 3 } = req.query;
      const userId = req.user.userId;
      const posts = await PostService.getSuggestedPosts(userId, parseInt(limit));

      return res.status(200).json({
        success: true,
        data: posts,
      });
    } catch (error) {
      console.error('Error fetching suggested posts:', error);
      return res.status(400).json({
        success: false,
        message: error.message || 'Operation failed',
      });
    }
  }

  static async hidePost(req, res) {
    try {
      const result = await PostService.hidePost(req.params.postId, req.user.userId);

      return res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      console.error('Error hiding post:', error);
      return res.status(400).json({
        success: false,
        message: error.message || 'Operation failed',
      });
    }
  }

  static async toggleSavePost(req, res) {
    try {
      const result = await PostService.toggleSavePost(req.params.postId, req.user.userId);

      return res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      console.error('Error saving post:', error);
      return res.status(400).json({
        success: false,
        message: error.message || 'Operation failed',
      });
    }
  }

  // Like/Unlike post
  static async toggleLike(req, res) {
    try {
      const { postId } = req.params;
      const { reactionType = 'like' } = req.body;
      const userId = req.user.userId;

      const result = await PostService.toggleLike(postId, userId, reactionType);

      return res.status(200).json({
        success: true,
        message: result.isLiked ? 'Reacted' : 'Reaction removed',
        data: result,
      });
    } catch (error) {
      console.error('Error toggling like:', error);

      if (error.message.includes('Operation failed')) {
        return res.status(404).json({
          success: false,
          message: error.message,
        });
      }

      return res.status(400).json({
        success: false,
        message: error.message || 'Operation failed',
      });
    }
  }

  // 4.5 Xem danh sách like
  static async getPostLikes(req, res) {
    try {
      const { postId } = req.params;
      const { page = 1, limit = 10 } = req.query;
      const userId = req.user.userId;

      const result = await PostService.getPostLikes(
        postId,
        parseInt(page),
        parseInt(limit),
        userId,
      );

      return res.status(200).json({
        success: true,
        message: 'Operation failed',
        data: result,
      });
    } catch (error) {
      console.error('Error fetching likes:', error);

      if (error.message.includes('Operation failed')) {
        return res.status(404).json({
          success: false,
          message: error.message,
        });
      }

      return res.status(400).json({
        success: false,
        message: error.message || 'Operation failed',
      });
    }
  }

  // 4.6 Xem danh sách bình luận
  static async getPostComments(req, res) {
    try {
      const { postId } = req.params;
      const { page = 1, limit = 10 } = req.query;
      const userId = req.user.userId;

      const result = await PostService.getPostComments(
        postId,
        parseInt(page),
        parseInt(limit),
        userId,
      );

      return res.status(200).json({
        success: true,
        message: 'Operation failed',
        data: result,
      });
    } catch (error) {
      console.error('Error fetching comments:', error);

      if (error.message.includes('Operation failed')) {
        return res.status(404).json({
          success: false,
          message: error.message,
        });
      }

      return res.status(400).json({
        success: false,
        message: error.message || 'Operation failed',
      });
    }
  }

  // Get single post
  static async getPost(req, res) {
    try {
      const { postId } = req.params;
      const userId = req.user?.userId;

      const post = await PostService.getPost(postId, userId);

      return res.status(200).json({
        success: true,
        message: 'Operation failed',
        data: post,
      });
    } catch (error) {
      console.error('Error fetching post:', error);

      if (error.message.includes('Operation failed')) {
        return res.status(404).json({
          success: false,
          message: error.message,
        });
      }

      return res.status(400).json({
        success: false,
        message: error.message || 'Operation failed',
      });
    }
  }

  // Get posts by author
  static async getPostsByAuthor(req, res) {
    try {
      const { authorId } = req.params;
      const { page = 1, limit = 10 } = req.query;
      const userId = req.user?.userId;

      const result = await PostService.getPostsByAuthor(
        authorId,
        parseInt(page),
        parseInt(limit),
        userId,
      );

      return res.status(200).json({
        success: true,
        message: 'Operation failed',
        data: result,
      });
    } catch (error) {
      console.error('Error fetching author posts:', error);
      return res.status(400).json({
        success: false,
        message: error.message || 'Operation failed',
      });
    }
  }

  static async getGroupPosts(req, res) {
    try {
      const { groupId } = req.params;
      const { page = 1, limit = 10 } = req.query;
      const userId = req.user.userId;

      const result = await PostService.getGroupPosts(
        groupId,
        userId,
        parseInt(page),
        parseInt(limit),
      );

      return res.status(200).json({
        success: true,
        message: 'Đã tải bài viết trong nhóm',
        data: result,
      });
    } catch (error) {
      console.error('Lỗi khi tải bài viết trong nhóm:', error);
      return res.status(400).json({
        success: false,
        message: error.message || 'Không thể tải bài viết trong nhóm',
      });
    }
  }

  static async getPendingGroupPosts(req, res) {
    try {
      const { groupId } = req.params;
      const { page = 1, limit = 10 } = req.query;
      const userId = req.user.userId;

      const result = await PostService.getPendingGroupPosts(
        groupId,
        userId,
        parseInt(page),
        parseInt(limit),
      );

      return res.status(200).json({
        success: true,
        message: 'Đã tải bài viết chờ duyệt',
        data: result,
      });
    } catch (error) {
      console.error('Lỗi khi tải bài viết chờ duyệt:', error);
      return res.status(400).json({
        success: false,
        message: error.message || 'Không thể tải bài viết chờ duyệt',
      });
    }
  }

  static async approveGroupPost(req, res) {
    try {
      const { postId } = req.params;
      const userId = req.user.userId;
      const post = await PostService.approveGroupPost(postId, userId);

      return res.status(200).json({
        success: true,
        message: 'Đã duyệt bài viết',
        data: post,
      });
    } catch (error) {
      console.error('Lỗi khi duyệt bài viết nhóm:', error);
      return res.status(400).json({
        success: false,
        message: error.message || 'Không thể duyệt bài viết',
      });
    }
  }

  static async rejectGroupPost(req, res) {
    try {
      const { postId } = req.params;
      const userId = req.user.userId;
      const post = await PostService.rejectGroupPost(postId, userId);

      return res.status(200).json({
        success: true,
        message: 'Đã từ chối bài viết',
        data: post,
      });
    } catch (error) {
      console.error('Lỗi khi từ chối bài viết nhóm:', error);
      return res.status(400).json({
        success: false,
        message: error.message || 'Không thể từ chối bài viết',
      });
    }
  }

  // Search posts
  static async searchPosts(req, res) {
    try {
      const { keyword, page = 1, limit = 10 } = req.query;
      const userId = req.user?.userId;

      const result = await PostService.searchPosts(
        keyword,
        parseInt(page),
        parseInt(limit),
        userId,
      );

      return res.status(200).json({
        success: true,
        message: 'Operation failed',
        data: result,
      });
    } catch (error) {
      console.error('Error searching posts:', error);
      return res.status(400).json({
        success: false,
        message: error.message || 'Operation failed',
      });
    }
  }
}

module.exports = PostController;



