const Post = require('../models/post.model');

class PostRepository {
  static async createPost(postData) {
    const post = new Post(postData);
    return await post.save();
  }

  static async findPostById(postId) {
    return await Post.findById(postId)
      .populate('author', '_id fullName avatar email')
      .populate('likes', 'fullName avatar email');
  }

  static async updatePost(postId, updateData) {
    return await Post.findByIdAndUpdate(postId, updateData, { new: true })
      .populate('author', '_id fullName avatar email')
      .populate('likes', 'fullName avatar email');
  }

  static async deletePost(postId) {
    return await Post.findByIdAndDelete(postId);
  }

  static async getAllPosts(skip, limit) {
    return await Post.find()
      .populate('author', '_id fullName avatar email')
      .populate('likes', 'fullName avatar email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
  }

  static async getPostCount() {
    return await Post.countDocuments();
  }

  static async getPostsByAuthors(authorIds, skip, limit) {
    return await Post.find({ author: { $in: authorIds } })
      .populate('author', '_id fullName avatar email')
      .populate('likes', 'fullName avatar email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
  }

  static async getPostsByAuthorsCount(authorIds) {
    return await Post.countDocuments({ author: { $in: authorIds } });
  }

  static async getPostsByAuthor(authorId, skip, limit) {
    return await Post.find({ author: authorId })
      .populate('author', '_id fullName avatar email')
      .populate('likes', 'fullName avatar email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
  }

  static async getPostsByAuthorCount(authorId) {
    return await Post.countDocuments({ author: authorId });
  }

  static async addLike(postId, userId) {
    return await Post.findByIdAndUpdate(
      postId,
      { $addToSet: { likes: userId } },
      { new: true }
    ).populate('likes', 'fullName avatar email');
  }

  static async removeLike(postId, userId) {
    return await Post.findByIdAndUpdate(
      postId,
      { $pull: { likes: userId } },
      { new: true }
    ).populate('likes', 'fullName avatar email');
  }

  static async incrementCommentCount(postId) {
    return await Post.findByIdAndUpdate(
      postId,
      { $inc: { commentCount: 1 } },
      { new: true }
    );
  }

  static async decrementCommentCount(postId) {
    return await Post.findByIdAndUpdate(
      postId,
      { $inc: { commentCount: -1 } },
      { new: true }
    );
  }

  static async getPostLikes(postId, skip, limit) {
    const post = await Post.findById(postId)
      .select('likes')
      .populate({
        path: 'likes',
        select: 'fullName avatar email',
        options: { skip, limit },
      });
    return post;
  }

  static async getPostLikeCount(postId) {
    const post = await Post.findById(postId).select('likes');
    return post ? post.likes.length : 0;
  }
}

module.exports = PostRepository;
