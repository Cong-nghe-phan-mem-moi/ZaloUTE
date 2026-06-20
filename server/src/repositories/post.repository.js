const Post = require('../models/post.model');

const populatePostQuery = (query) =>
  query
    .populate('author', '_id fullName avatar email')
    .populate('likes', 'fullName avatar email')
    .populate('reactions.user', 'fullName avatar email')
    .populate('group', 'name avatar')
    .populate('approvedBy', 'fullName avatar')
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

  static async getPostsByAuthors(authorIds, skip, limit) {
    return await populatePostQuery(Post.find({
      author: { $in: authorIds },
      group: null,
      approvalStatus: 'approved',
    }))
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
  }

  static async getPostsByAuthorsCount(authorIds) {
    return await Post.countDocuments({
      author: { $in: authorIds },
      group: null,
      approvalStatus: 'approved',
    });
  }

  static async getPostsByAuthor(authorId, skip, limit) {
    return await populatePostQuery(Post.find({
      author: authorId,
      group: null,
      approvalStatus: 'approved',
    }))
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
  }

  static async getPostsByAuthorCount(authorId) {
    return await Post.countDocuments({
      author: authorId,
      group: null,
      approvalStatus: 'approved',
    });
  }

  static async getPostsByGroup(groupId, skip, limit) {
    return await populatePostQuery(Post.find({
      group: groupId,
      approvalStatus: 'approved',
    }))
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
  }

  static async getPostsByGroupCount(groupId) {
    return await Post.countDocuments({
      group: groupId,
      approvalStatus: 'approved',
    });
  }

  static async getPendingPostsByGroup(groupId, skip, limit) {
    return await populatePostQuery(Post.find({
      group: groupId,
      approvalStatus: 'pending',
    }))
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
  }

  static async getPendingPostsByGroupCount(groupId) {
    return await Post.countDocuments({
      group: groupId,
      approvalStatus: 'pending',
    });
  }

  static async updatePostApproval(postId, approvalData) {
    return await populatePostQuery(Post.findByIdAndUpdate(
      postId,
      { $set: approvalData },
      { new: true },
    ));
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
}

async function searchPosts({keyword, limit = 10}){
  return await Post.find({
    $text: { $search: keyword },
    group: null,
    approvalStatus: 'approved',
  })
  .populate('author', '_id fullName avatar')
  .limit(limit)
  .lean()
}

async function countSearchPosts({ keyword }) {
    return await Post.countDocuments({
        $text: { $search: keyword },
        group: null,
        approvalStatus: 'approved',
    });
}


PostRepository.searchPosts = searchPosts;
PostRepository.countSearchPosts = countSearchPosts;

module.exports = PostRepository;
