const PostRepository = require('../repo/post.repository');
const Comment = require('../models/comment.model');
const NotificationService = require('./notification.service');
const User = require('../models/user.model');

const buildPostResponse = async (post, userId = null) => {
  const postObj = post.toObject ? post.toObject() : post;

  if (userId) {
    postObj.isLiked = (post.likes || []).some(
      (like) => like._id.toString() === userId,
    );
  } else {
    postObj.isLiked = false;
  }

  postObj.commentCount = await Comment.countDocuments({ post: postObj._id });
  return postObj;
};

const buildPostsResponse = async (posts, userId = null) =>
  await Promise.all(posts.map((post) => buildPostResponse(post, userId)));

class PostService {
  // 4.1 Táº¡o bÃ i viáº¿t
  static async createPost(userId, content, media = []) {
    const trimmedContent = content?.trim() || '';
    // Validate content
    if (trimmedContent.length === 0 && (!media || media.length === 0)) {
      throw new Error('Operation failed');
    }

    if (trimmedContent.length > 5000) {
      throw new Error('Operation failed');
    }

    const postData = {
      author: userId,
      content: trimmedContent,
      media: media || [],
      likes: [],
      commentCount: 0,
    };

    const post = await PostRepository.createPost(postData);
    return await PostRepository.findPostById(post._id);
  }

  // 4.2 Chá»‰nh sá»­a bÃ i viáº¿t
  static async updatePost(postId, userId, content, media = []) {
    const trimmedContent = content?.trim() || '';
    // Find post
    const post = await PostRepository.findPostById(postId);
    if (!post) {
      throw new Error('Operation failed');
    }

    // Check authorization
    if (post.author._id.toString() !== userId) {
      throw new Error('Operation failed');
    }

    // Validate content
    if (content !== undefined) {
      if (trimmedContent.length < 0) {
        throw new Error('Operation failed');
      }
      if (trimmedContent.length > 5000) {
        throw new Error('Operation failed');
      }
    }

    if (trimmedContent.length === 0 && (!media || media.length === 0)) {
      throw new Error('Post must include content or media');
    }

    const updateData = {};
    updateData.content = trimmedContent;
    // Always update media array (empty or with items)
    if (media.length > 0 || media.length === 0) {
      updateData.media = media;
    }

    return await PostRepository.updatePost(postId, updateData);
  }

  // 4.3 XÃ³a bÃ i viáº¿t
  static async deletePost(postId, userId) {
    // Find post
    const post = await PostRepository.findPostById(postId);
    if (!post) {
      throw new Error('Operation failed');
    }

    // Check authorization
    if (post.author._id.toString() !== userId) {
      throw new Error('Operation failed');
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

    const postsWithLikeStatus = await buildPostsResponse(posts, userId);

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
      throw new Error('Operation failed');
    }

    const likeIndex = post.likes.findIndex((like) => like._id.toString() === userId);

    let updatedPost;
    if (likeIndex > -1) {
      // Unlike
      updatedPost = await PostRepository.removeLike(postId, userId);
    } else {
      // Like
      updatedPost = await PostRepository.addLike(postId, userId);
      await NotificationService.createNotification({
        receiver: post.author?._id || post.author,
        sender: userId,
        type: 'post_like',
        content: 'liked your post',
        relatedId: postId,
        relatedType: 'Post',
      });
    }

    return {
      postId,
      isLiked: likeIndex === -1,
      likeCount: updatedPost.likes.length,
    };
  }

  // 4.5 Xem danh sÃ¡ch like
  static async getPostLikes(postId, page = 1, limit = 10) {
    // Validate pagination
    if (page < 1) page = 1;
    if (limit < 1 || limit > 50) limit = 10;

    const skip = (page - 1) * limit;

    const post = await PostRepository.findPostById(postId);
    if (!post) {
      throw new Error('Operation failed');
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

  // 4.6 Xem danh sÃ¡ch bÃ¬nh luáº­n
  static async getPostComments(postId, page = 1, limit = 10) {
    // Validate pagination
    if (page < 1) page = 1;
    if (limit < 1 || limit > 50) limit = 10;

    const skip = (page - 1) * limit;

    const post = await PostRepository.findPostById(postId);
    if (!post) {
      throw new Error('Operation failed');
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
      throw new Error('Operation failed');
    }

    return await buildPostResponse(post, userId);
  }

  // Get posts by author
  static async getPostsByAuthor(authorId, page = 1, limit = 10, currentUserId = null) {
    // Validate pagination
    if (page < 1) page = 1;
    if (limit < 1 || limit > 50) limit = 10;

    const skip = (page - 1) * limit;

    const posts = await PostRepository.getPostsByAuthor(authorId, skip, limit);
    const total = await PostRepository.getPostsByAuthorCount(authorId);

    const postsWithLikeStatus = await buildPostsResponse(posts, currentUserId);

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
      throw new Error('Operation failed');
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

    const postsWithLikeStatus = await buildPostsResponse(posts, userId);

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



