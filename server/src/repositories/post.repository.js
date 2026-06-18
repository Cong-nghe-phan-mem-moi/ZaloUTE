const Post = require('../models/post.model');

const populatePostQuery = (query) =>
  query
    .populate('author', '_id fullName avatar email')
    .populate('likes', 'fullName avatar email')
    .populate('reactions.user', 'fullName avatar email')
    .populate({
      path: 'sharedFrom',
      populate: [
        { path: 'author', select: '_id fullName avatar email' },
        { path: 'likes', select: 'fullName avatar email' },
        { path: 'reactions.user', select: 'fullName avatar email' },
      ],
    });
 
class PostRepository {
  static async createPost(postData) {
    const post = new Post(postData);
    return await post.save();
  }

  static async findPostById(postId) {
    return await populatePostQuery(Post.findById(postId));
  }

  static async updatePost(postId, updateData) {
    return await populatePostQuery(Post.findByIdAndUpdate(postId, updateData, { new: true }));
  }

  static async deletePost(postId) {
    return await Post.findByIdAndDelete(postId);
  }

  static async getAllPosts(skip, limit) {
    return await populatePostQuery(Post.find())
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
  }

  static async getPostCount() {
    return await Post.countDocuments();
  }

  static async getPostsByAuthors(authorIds, skip, limit, extraFilter = {}, sort = { createdAt: -1 }) {
    return await populatePostQuery(Post.find({ author: { $in: authorIds }, ...extraFilter }))
      .sort(sort)
      .skip(skip)
      .limit(limit);
  }

  static async getPostsByAuthorsCount(authorIds, extraFilter = {}) {
    return await Post.countDocuments({ author: { $in: authorIds }, ...extraFilter });
  }

  static async getPostsByAuthor(authorId, skip, limit, extraFilter = {}) {
    return await populatePostQuery(Post.find({ author: authorId, ...extraFilter }))
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
  }

  static async getPostsByAuthorCount(authorId, extraFilter = {}) {
    return await Post.countDocuments({ author: authorId, ...extraFilter });
  }

  static async addLike(postId, userId) {
    return await Post.findByIdAndUpdate(
      postId,
      {
        $addToSet: { likes: userId },
        $pull: { reactions: { user: userId } },
      },
      { new: true }
    )
      .populate('likes', 'fullName avatar email')
      .populate('reactions.user', 'fullName avatar email');
  }

  static async removeLike(postId, userId) {
    return await Post.findByIdAndUpdate(
      postId,
      {
        $pull: {
          likes: userId,
          reactions: { user: userId },
        },
      },
      { new: true }
    )
      .populate('likes', 'fullName avatar email')
      .populate('reactions.user', 'fullName avatar email');
  }

  static async setReaction(postId, userId, reactionType) {
    const post = await Post.findById(postId);
    if (!post) return null;

    post.likes = [
      ...new Set([
        ...(post.likes || []).map((like) => like.toString()),
        userId.toString(),
      ]),
    ];
    post.reactions = (post.reactions || []).filter(
      (reaction) => reaction.user.toString() !== userId.toString(),
    );
    post.reactions.push({ user: userId, type: reactionType });
    await post.save();

    return await Post.findById(postId)
      .populate('likes', 'fullName avatar email')
      .populate('reactions.user', 'fullName avatar email');
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

  static async incrementShareCount(postId) {
    return await Post.findByIdAndUpdate(
      postId,
      { $inc: { shareCount: 1 } },
      { new: true },
    );
  }

  static async getSuggestedPosts({ filter = {}, limit = 3, candidateLimit = 80 }) {
    return await populatePostQuery(Post.find(filter))
      .sort({ createdAt: -1 })
      .limit(Math.max(limit, candidateLimit));
  }
}

async function searchPosts({keyword, limit = 10, filter = {}}){
  return await Post.find({
    $text: { $search: keyword },
    ...filter,
  })
  .populate('author', '_id fullName avatar')
  .populate({
    path: 'sharedFrom',
    populate: [
      { path: 'author', select: '_id fullName avatar email' },
      { path: 'likes', select: 'fullName avatar email' },
      { path: 'reactions.user', select: 'fullName avatar email' },
    ],
  })
  .limit(limit)
  .lean()
}

async function countSearchPosts({ keyword }) {
    return await Post.countDocuments({
        $text: { $search: keyword } 
    });
}


PostRepository.searchPosts = searchPosts;
PostRepository.countSearchPosts = countSearchPosts;

module.exports = PostRepository;
