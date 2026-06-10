const PostRepository = require('../repo/post.repository');
const Comment = require('../models/comment.model');
const User = require('../models/user.model');

class PostService {
  // 4.1 Tạo bài viết
  static async createPost(userId, content, media = []) {
    // Validate content
    if (!content || content.trim().length === 0) {
      throw new Error('Nội dung bài viết không được để trống');
    }

    if (content.trim().length > 5000) {
      throw new Error('Nội dung bài viết không được vượt quá 5000 ký tự');
    }

    const postData = {
      author: userId,
      content: content.trim(),
      media: media || [],
      likes: [],
      commentCount: 0,
    };

    const post = await PostRepository.createPost(postData);
    return await PostRepository.findPostById(post._id);
  }

  // 4.2 Chỉnh sửa bài viết
  static async updatePost(postId, userId, content, media = []) {
    // Find post
    const post = await PostRepository.findPostById(postId);
    if (!post) {
      throw new Error('Bài viết không tồn tại');
    }

    // Check authorization
    if (post.author._id.toString() !== userId) {
      throw new Error('Bạn không có quyền chỉnh sửa bài viết này');
    }

    // Validate content
    if (content) {
      if (content.trim().length === 0) {
        throw new Error('Nội dung bài viết không được để trống');
      }
      if (content.trim().length > 5000) {
        throw new Error('Nội dung bài viết không được vượt quá 5000 ký tự');
      }
    }

    const updateData = {};
    if (content) updateData.content = content.trim();
    // Always update media array (empty or with items)
    if (media.length > 0 || media.length === 0) {
      updateData.media = media;
    }

    return await PostRepository.updatePost(postId, updateData);
  }

  // 4.3 Xóa bài viết
  static async deletePost(postId, userId) {
    // Find post
    const post = await PostRepository.findPostById(postId);
    if (!post) {
      throw new Error('Bài viết không tồn tại');
    }

    // Check authorization
    if (post.author._id.toString() !== userId) {
      throw new Error('Bạn không có quyền xóa bài viết này');
    }

    // Delete associated comments
    await Comment.deleteMany({ post: postId });

    // Delete post
    return await PostRepository.deletePost(postId);
  }

  // 4.4 Xem news feed
  static async getNewsFeed(page = 1, limit = 10, userId = null) {
    // Validate pagination
    if (page < 1) page = 1;
    if (limit < 1 || limit > 50) limit = 10;

    const skip = (page - 1) * limit;

    if (!userId) {
      return {
        posts: [],
        pagination: {
          page,
          limit,
          total: 0,
          totalPages: 0,
        },
      };
    }

    const user = await User.findById(userId).select('friends');
    const friendIds = user?.friends || [];

    if (friendIds.length === 0) {
      return {
        posts: [],
        pagination: {
          page,
          limit,
          total: 0,
          totalPages: 0,
        },
      };
    }

    const posts = await PostRepository.getPostsByAuthors(friendIds, skip, limit);
    const total = await PostRepository.getPostsByAuthorsCount(friendIds);

    // Add isLiked flag for current user
    const postsWithLikeStatus = posts.map((post) => {
      const postObj = post.toObject();
      if (userId) {
        postObj.isLiked = post.likes.some(
          (like) => like._id.toString() === userId,
        );
      } else {
        postObj.isLiked = false;
      }
      return postObj;
    });

    return {
      posts: postsWithLikeStatus,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // Like/Unlike post
  static async toggleLike(postId, userId) {
    const post = await PostRepository.findPostById(postId);
    if (!post) {
      throw new Error('Bài viết không tồn tại');
    }

    const likeIndex = post.likes.findIndex((like) => like._id.toString() === userId);

    let updatedPost;
    if (likeIndex > -1) {
      // Unlike
      updatedPost = await PostRepository.removeLike(postId, userId);
    } else {
      // Like
      updatedPost = await PostRepository.addLike(postId, userId);
    }

    return {
      postId,
      isLiked: likeIndex === -1,
      likeCount: updatedPost.likes.length,
    };
  }

  // 4.5 Xem danh sách like
  static async getPostLikes(postId, page = 1, limit = 10) {
    // Validate pagination
    if (page < 1) page = 1;
    if (limit < 1 || limit > 50) limit = 10;

    const skip = (page - 1) * limit;

    const post = await PostRepository.findPostById(postId);
    if (!post) {
      throw new Error('Bài viết không tồn tại');
    }

    const likes = await PostRepository.getPostLikes(postId, skip, limit);
    const total = await PostRepository.getPostLikeCount(postId);

    return {
      likes: likes.likes,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // 4.6 Xem danh sách bình luận
  static async getPostComments(postId, page = 1, limit = 10) {
    // Validate pagination
    if (page < 1) page = 1;
    if (limit < 1 || limit > 50) limit = 10;

    const skip = (page - 1) * limit;

    const post = await PostRepository.findPostById(postId);
    if (!post) {
      throw new Error('Bài viết không tồn tại');
    }

    const comments = await Comment.find({ post: postId })
      .populate('author', 'fullName avatar email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Comment.countDocuments({ post: postId });

    return {
      comments,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // Get single post
  static async getPost(postId, userId = null) {
    const post = await PostRepository.findPostById(postId);
    if (!post) {
      throw new Error('Bài viết không tồn tại');
    }

    const postObj = post.toObject();
    if (userId) {
      postObj.isLiked = post.likes.some((like) => like._id.toString() === userId);
    } else {
      postObj.isLiked = false;
    }

    return postObj;
  }

  // Get posts by author
  static async getPostsByAuthor(authorId, page = 1, limit = 10, currentUserId = null) {
    // Validate pagination
    if (page < 1) page = 1;
    if (limit < 1 || limit > 50) limit = 10;

    const skip = (page - 1) * limit;

    const posts = await PostRepository.getPostsByAuthor(authorId, skip, limit);
    const total = await PostRepository.getPostsByAuthorCount(authorId);

    // Add isLiked flag for current user
    const postsWithLikeStatus = posts.map((post) => {
      const postObj = post.toObject();
      if (currentUserId) {
        postObj.isLiked = post.likes.some(
          (like) => like._id.toString() === currentUserId,
        );
      } else {
        postObj.isLiked = false;
      }
      return postObj;
    });

    return {
      posts: postsWithLikeStatus,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // Search posts
  static async searchPosts(keyword, page = 1, limit = 10, userId = null) {
    // Validate pagination
    if (page < 1) page = 1;
    if (limit < 1 || limit > 50) limit = 10;

    if (!keyword || keyword.trim().length === 0) {
      throw new Error('Từ khóa tìm kiếm không được để trống');
    }

    const skip = (page - 1) * limit;
    const searchRegex = new RegExp(keyword.trim(), 'i');

    const Post = require('../models/post.model');
    const posts = await Post.find({ content: searchRegex })
      .populate('author', 'fullName avatar email')
      .populate('likes', 'fullName avatar email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Post.countDocuments({ content: searchRegex });

    // Add isLiked flag for current user
    const postsWithLikeStatus = posts.map((post) => {
      const postObj = post.toObject();
      if (userId) {
        postObj.isLiked = post.likes.some(
          (like) => like._id.toString() === userId,
        );
      } else {
        postObj.isLiked = false;
      }
      return postObj;
    });

    return {
      posts: postsWithLikeStatus,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}

module.exports = PostService;
