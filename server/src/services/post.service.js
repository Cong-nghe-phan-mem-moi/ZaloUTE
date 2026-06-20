const PostRepository = require('../repositories/post.repository');
const Comment = require('../models/comment.model');
const NotificationService = require('./notification.service');
const User = require('../models/user.model');
const Post = require('../models/post.model');
const Conversation = require('../models/conversation.model');
const Message = require('../models/message.model');
const GroupRepository = require('../repositories/group.repository');
const chatRepository = require('../repositories/chat.repository');
const onlineTracker = require('../utils/onlineTracker');
const {
  buildPrivacyMongoFilter,
  canViewPostWithSharedSource,
  getFriendIdSet,
  normalizePrivacyFromPayload,
} = require('../utils/privacy');

const REACTION_TYPES = ['like', 'love', 'haha', 'wow', 'sad', 'angry'];

const getReactionUserId = (reaction) => String(reaction.user?._id || reaction.user);
const getDocumentId = (value) => value?._id || value;
const getPostAuthorId = (post) => getDocumentId(post?.author);

const getShareNotificationReceivers = (post, senderId) => {
  const sender = String(senderId);
  const receivers = new Map();
  const directAuthorId = getPostAuthorId(post);
  const originalAuthorId = getPostAuthorId(post?.sharedFrom);

  [directAuthorId, originalAuthorId].forEach((receiverId) => {
    if (!receiverId || String(receiverId) === sender) {
      return;
    }

    receivers.set(String(receiverId), receiverId);
  });

  return [...receivers.values()];
};

const buildReactionState = (postObj, userId = null) => {
  const reactionSummary = REACTION_TYPES.reduce((summary, type) => {
    summary[type] = 0;
    return summary;
  }, {});
  const reactedUserIds = new Set();
  let currentUserReaction = null;

  (postObj.reactions || []).forEach((reaction) => {
    const reactionType = REACTION_TYPES.includes(reaction.type) ? reaction.type : 'like';
    const reactionUserId = getReactionUserId(reaction);

    reactedUserIds.add(reactionUserId);
    reactionSummary[reactionType] += 1;

    if (userId && reactionUserId === String(userId)) {
      currentUserReaction = reactionType;
    }
  });

  (postObj.likes || []).forEach((like) => {
    const likeUserId = String(like._id || like);
    if (reactedUserIds.has(likeUserId)) {
      return;
    }

    reactedUserIds.add(likeUserId);
    reactionSummary.like += 1;

    if (userId && likeUserId === String(userId) && !currentUserReaction) {
      currentUserReaction = 'like';
    }
  });

  return {
    reactionSummary,
    reactionCount: reactedUserIds.size,
    currentUserReaction,
    isLiked: Boolean(currentUserReaction),
  };
};

const getSetFrom = (values = []) =>
  new Set((values || []).map((value) => String(value?._id || value)).filter(Boolean));

const getFeedSort = (sortBy = 'newest') => {
  if (sortBy === 'engagement') {
    return {
      shareCount: -1,
      commentCount: -1,
      createdAt: -1,
    };
  }

  return { createdAt: -1 };
};

const calculateEngagementScore = (post) => {
  const postObj = post.toObject ? post.toObject() : post;
  const reactionCount = buildReactionState(postObj).reactionCount;
  const commentCount = postObj.commentCount || 0;
  const shareCount = postObj.shareCount || 0;
  const createdAt = postObj.createdAt ? new Date(postObj.createdAt).getTime() : Date.now();
  const ageHours = Math.max(0, (Date.now() - createdAt) / (1000 * 60 * 60));
  const decay = ageHours * 0.08;

  return Math.max(
    0,
    Number((reactionCount + commentCount * 2 + shareCount * 3 - decay).toFixed(2)),
  );
};

const buildPostResponse = async (post, userId = null, viewer = null) => {
  const postObj = post.toObject ? post.toObject() : post;
  const reactionState = buildReactionState(postObj, userId);
  const savedPostIds = getSetFrom(viewer?.savedPosts);
  const hiddenPostIds = getSetFrom(viewer?.hiddenPosts);
  const followingIds = getSetFrom(viewer?.following);
  const authorId = String(postObj.author?._id || postObj.author || '');

  postObj.reactionSummary = reactionState.reactionSummary;
  postObj.reactionCount = reactionState.reactionCount;
  postObj.currentUserReaction = reactionState.currentUserReaction;
  postObj.engagementScore = calculateEngagementScore(postObj);
  postObj.isLiked = reactionState.isLiked;
  postObj.isSaved = savedPostIds.has(String(postObj._id));
  postObj.isHidden = hiddenPostIds.has(String(postObj._id));
  postObj.isFollowingAuthor = followingIds.has(authorId);
  postObj.commentCount = await Comment.countDocuments({ post: postObj._id });

  return postObj;
};

const buildPostsResponse = async (posts, userId = null) => {
  const { user, friendIds, blockedAuthorIds } = await getViewerContext(userId);
  const hiddenPostIds = getSetFrom(user?.hiddenPosts);
  const visiblePosts = posts.filter((post) =>
    !hiddenPostIds.has(String(post._id)) &&
    !isModerationHidden(post) &&
    !hasBlockedAuthor(post, blockedAuthorIds) &&
    canViewPostWithSharedSource(post, userId, friendIds),
  );

  return await Promise.all(
    visiblePosts.map((post) => buildPostResponse(post, userId, user)),
  );
};

const getViewerContext = async (userId) => {
  if (!userId) {
    return { user: null, friendIds: [] };
  }

  const [user, usersBlockingViewer] = await Promise.all([
    User.findById(userId).select(
      'friends following followers hiddenPosts savedPosts blockedUsers',
    ),
    User.find({ blockedUsers: userId }).select('_id'),
  ]);
  const blockedAuthorIds = new Set([
    ...getSetFrom(user?.blockedUsers),
    ...getSetFrom(usersBlockingViewer),
  ]);

  return {
    user,
    friendIds: [...getFriendIdSet(user)],
    blockedAuthorIds,
  };
};

const hasBlockedAuthor = (post, blockedAuthorIds = new Set()) => {
  const authorId = String(post?.author?._id || post?.author || '');
  const sharedAuthorId = String(post?.sharedFrom?.author?._id || post?.sharedFrom?.author || '');

  return (
    (authorId && blockedAuthorIds.has(authorId)) ||
    (sharedAuthorId && blockedAuthorIds.has(sharedAuthorId))
  );
};

const isModerationHidden = (post) => Boolean(post?.moderation?.hidden);

const assertCanViewPost = async (post, userId) => {
  const { friendIds, blockedAuthorIds } = await getViewerContext(userId);

  if (
    isModerationHidden(post) ||
    hasBlockedAuthor(post, blockedAuthorIds) ||
    !canViewPostWithSharedSource(post, userId, friendIds)
  ) {
    throw new Error('Post not found');
  }
};

const includesDocumentId = (values = [], id) =>
  values.some((value) => String(getDocumentId(value)) === String(id));

const ensureGroupMember = async (groupId, userId) => {
  const group = await GroupRepository.findGroupById(groupId);
  if (!group) {
    throw new Error('Không tìm thấy nhóm');
  }

  const isMember = includesDocumentId(group.members, userId);
  if (!isMember) {
    throw new Error('Bạn phải là thành viên nhóm để đăng bài');
  }

  return {
    group,
    isAdmin: includesDocumentId(group.admins, userId),
  };
};

const ensureGroupAdmin = async (groupId, userId) => {
  const { group, isAdmin } = await ensureGroupMember(groupId, userId);
  if (!isAdmin) {
    throw new Error('Chỉ admin nhóm mới được duyệt bài');
  }

  return group;
};

class PostService {
  static async createPost(userId, content, media = [], options = {}) {
    const trimmedContent = content?.trim() || '';
    // Validate content
    if (trimmedContent.length === 0 && (!media || media.length === 0)) {
      throw new Error('Operation failed');
    }

    if (trimmedContent.length > 5000) {
      throw new Error('Operation failed');
    }

    const groupId = options.groupId || null;
    let approvalStatus = 'approved';
    let approvedBy = userId;
    let approvedAt = new Date();

    if (groupId) {
      const { isAdmin } = await ensureGroupMember(groupId, userId);
      approvalStatus = isAdmin ? 'approved' : 'pending';
      approvedBy = isAdmin ? userId : null;
      approvedAt = isAdmin ? new Date() : null;
    }

    const postData = {
      author: userId,
      group: groupId,
      approvalStatus,
      approvedBy,
      approvedAt,
      content: trimmedContent,
      media: media || [],
      likes: [],
      reactions: [],
      commentCount: 0,
      privacy: normalizePrivacyFromPayload(payload),
    };

    const post = await PostRepository.createPost(postData);
    return await PostRepository.findPostById(post._id);
  }

  static async sharePost(postId, userId, caption = '', target = 'timeline', conversationId = null, payload = {}) {
    const originalPost = await PostRepository.findPostById(postId);
    if (!originalPost) {
      throw new Error('Operation failed');
    }
    await assertCanViewPost(originalPost, userId);

    const trimmedCaption = caption?.trim() || '';
    if (trimmedCaption.length > 1000) {
      throw new Error('Caption must be at most 1000 characters');
    }

    if (!['timeline', 'message'].includes(target)) {
      throw new Error('Invalid share target');
    }

    if (target === 'message') {
      if (!conversationId) {
        throw new Error('Conversation is required');
      }

      const conversation = await Conversation.findOne({
        _id: conversationId,
        participants: userId,
      });

      if (!conversation) {
        throw new Error('Conversation not found');
      }

      if (conversation.blockedBy && conversation.blockedBy.length > 0) {
        throw new Error('The conversation is blocked');
      }

      const message = await chatRepository.saveMessage({
        conversationId,
        senderId: userId,
        messageType: 'post_share',
        content: trimmedCaption || 'Shared a post',
        sharedPost: postId,
        readBy: [userId],
      });

      await chatRepository.updateConversationLastMessage(conversationId, message._id);
      await PostRepository.incrementShareCount(postId);

      const updatedConversations = await chatRepository.getConversationsByUserId(userId);
      const updatedConversation =
        updatedConversations.find((item) => item._id.toString() === conversationId.toString()) ||
        conversation;

      conversation.participants.forEach((participant) => {
        const participantId = (participant._id || participant).toString();
        onlineTracker.sendChatToUser(participantId, {
          type: 'message',
          data: message,
        });
        onlineTracker.sendChatToUser(participantId, {
          type: 'conversation_update',
          data: updatedConversation,
        });
      });

      return {
        target: 'message',
        postId,
        shareCount: (originalPost.shareCount || 0) + 1,
        message,
      };
    }

    const sharedPost = await PostRepository.createPost({
      author: userId,
      content: trimmedCaption,
      media: [],
      likes: [],
      reactions: [],
      commentCount: 0,
      shareCount: 0,
      sharedFrom: postId,
      shareCaption: trimmedCaption,
      privacy: normalizePrivacyFromPayload(payload),
    });

    await PostRepository.incrementShareCount(postId);
    const populatedSharedPost = await PostRepository.findPostById(sharedPost._id);

    const notificationReceivers = getShareNotificationReceivers(originalPost, userId);

    await Promise.all(
      notificationReceivers.map((receiver) =>
        NotificationService.createNotification({
          receiver,
          sender: userId,
          type: 'post_share',
          content: 'shared your post to their profile',
          preview:
            trimmedCaption ||
            originalPost.content ||
            originalPost.sharedFrom?.content,
          relatedId: sharedPost._id,
          relatedType: 'Post',
          data: {
            postId: sharedPost._id,
            originalPostId: postId,
            target: 'timeline',
          },
        }),
      ),
    );

    return {
      target: 'timeline',
      postId,
      shareCount: (originalPost.shareCount || 0) + 1,
      sharedPost: await buildPostResponse(populatedSharedPost, userId),
    };
  }

  static async updatePost(postId, userId, content, media = [], payload = {}) {
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
    updateData.privacy = normalizePrivacyFromPayload(payload);

    return await PostRepository.updatePost(postId, updateData);
  }

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
  static async getNewsFeed(page = 1, limit = 10, userId = null, sortBy = 'newest') {
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

    const { user, friendIds, blockedAuthorIds } = await getViewerContext(userId);
    const followingIds = [...getSetFrom(user?.following)];
    const hiddenPostIds = [...getSetFrom(user?.hiddenPosts)];
    const authorIds = [...new Set([String(userId), ...friendIds, ...followingIds])];
    const visibleAuthorIds = authorIds.filter(
      (authorId) => !blockedAuthorIds.has(String(authorId)),
    );
    const privacyFilter = buildPrivacyMongoFilter(userId, friendIds);
    const feedFilter = {
      ...privacyFilter,
      _id: { $nin: hiddenPostIds },
      "moderation.hidden": { $ne: true },
    };
    const posts = await PostRepository.getPostsByAuthors(
      visibleAuthorIds,
      skip,
      limit,
      feedFilter,
      getFeedSort(sortBy),
    );
    const total = await PostRepository.getPostsByAuthorsCount(authorIds, feedFilter);

    const postsWithLikeStatus = await buildPostsResponse(posts, userId);
    const suggestedPosts =
      page === 1
        ? await this.getSuggestedPosts(userId, 3, { excludedAuthorIds: authorIds })
        : [];

    return {
      posts: postsWithLikeStatus,
      suggestedPosts,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  static async getSuggestedPosts(userId, limit = 3, options = {}) {
    if (!userId) return [];

    const { user, friendIds, blockedAuthorIds } = await getViewerContext(userId);
    const hiddenPostIds = [...getSetFrom(user?.hiddenPosts)];
    const excludedAuthorIds = options.excludedAuthorIds || [
      String(userId),
      ...friendIds,
      ...getSetFrom(user?.following),
    ];
    const excludedAuthorSet = new Set([
      ...excludedAuthorIds.map(String),
      ...blockedAuthorIds,
    ]);
    const privacyFilter = buildPrivacyMongoFilter(userId, friendIds);

    const candidates = await PostRepository.getSuggestedPosts({
      filter: {
        ...privacyFilter,
        author: { $nin: [...excludedAuthorSet] },
        _id: { $nin: hiddenPostIds },
        "moderation.hidden": { $ne: true },
      },
      limit,
      candidateLimit: 80,
    });

    const rankedPosts = candidates
      .filter((post) =>
        !isModerationHidden(post) &&
        !hasBlockedAuthor(post, blockedAuthorIds) &&
        canViewPostWithSharedSource(post, userId, friendIds),
      )
      .sort((a, b) => {
        const scoreDiff = calculateEngagementScore(b) - calculateEngagementScore(a);
        if (scoreDiff !== 0) return scoreDiff;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      })
      .slice(0, limit);

    return await buildPostsResponse(rankedPosts, userId);
  }

  static async hidePost(postId, userId) {
    const post = await PostRepository.findPostById(postId);
    if (!post) {
      throw new Error('Operation failed');
    }
    await assertCanViewPost(post, userId);

    await User.updateOne({ _id: userId }, { $addToSet: { hiddenPosts: postId } });
    return { postId, hidden: true };
  }

  static async toggleSavePost(postId, userId) {
    const post = await PostRepository.findPostById(postId);
    if (!post) {
      throw new Error('Operation failed');
    }
    await assertCanViewPost(post, userId);

    const user = await User.findById(userId).select('savedPosts');
    const isSaved = getSetFrom(user?.savedPosts).has(String(postId));

    await User.updateOne(
      { _id: userId },
      isSaved
        ? { $pull: { savedPosts: postId } }
        : { $addToSet: { savedPosts: postId } },
    );

    return { postId, isSaved: !isSaved };
  }

  // Like/Unlike post
  static async toggleLike(postId, userId, reactionType = 'like') {
    const post = await PostRepository.findPostById(postId);
    if (!post) {
      throw new Error('Operation failed');
    }
    await assertCanViewPost(post, userId);

    if (!REACTION_TYPES.includes(reactionType)) {
      throw new Error('Invalid reaction type');
    }

    const reactionState = buildReactionState(post, userId);
    const shouldRemoveReaction = reactionState.currentUserReaction === reactionType;

    let updatedPost;
    if (shouldRemoveReaction) {
      updatedPost = await PostRepository.removeLike(postId, userId);
    } else {
      updatedPost = await PostRepository.setReaction(postId, userId, reactionType);

      if (!reactionState.currentUserReaction) {
        await NotificationService.createNotification({
          receiver: post.author?._id || post.author,
          sender: userId,
          type: 'post_like',
          content: 'reacted to your post',
          relatedId: postId,
          relatedType: 'Post',
          data: {
            postId,
          },
        });
      }
    }

    const updatedReactionState = buildReactionState(updatedPost, userId);

    return {
      postId,
      isLiked: updatedReactionState.isLiked,
      likeCount: updatedReactionState.reactionCount,
      reactionCount: updatedReactionState.reactionCount,
      reactionSummary: updatedReactionState.reactionSummary,
      currentUserReaction: updatedReactionState.currentUserReaction,
    };
  }

  // 4.5 Xem danh sách like
  static async getPostLikes(postId, page = 1, limit = 10, userId = null) {
    // Validate pagination
    if (page < 1) page = 1;
    if (limit < 1 || limit > 50) limit = 10;

    const skip = (page - 1) * limit;

    const post = await PostRepository.findPostById(postId);
    if (!post) {
      throw new Error('Operation failed');
    }
    await assertCanViewPost(post, userId);

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
  static async getPostComments(postId, page = 1, limit = 10, userId = null) {
    // Validate pagination
    if (page < 1) page = 1;
    if (limit < 1 || limit > 50) limit = 10;

    const skip = (page - 1) * limit;

    const post = await PostRepository.findPostById(postId);
    if (!post) {
      throw new Error('Operation failed');
    }
    await assertCanViewPost(post, userId);

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
    await assertCanViewPost(post, userId);

    return await buildPostResponse(post, userId);
  }

  // Get posts by author
  static async getPostsByAuthor(authorId, page = 1, limit = 10, currentUserId = null) {
    // Validate pagination
    if (page < 1) page = 1;
    if (limit < 1 || limit > 50) limit = 10;

    const skip = (page - 1) * limit;

    const { friendIds, blockedAuthorIds } = await getViewerContext(currentUserId);
    if (blockedAuthorIds.has(String(authorId))) {
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
    const privacyFilter = buildPrivacyMongoFilter(currentUserId, friendIds);
    const visibleFilter = {
      ...privacyFilter,
      "moderation.hidden": { $ne: true },
    };
    const posts = await PostRepository.getPostsByAuthor(authorId, skip, limit, visibleFilter);
    const total = await PostRepository.getPostsByAuthorCount(authorId, visibleFilter);

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

  static async getGroupPosts(groupId, userId, page = 1, limit = 10) {
    if (page < 1) page = 1;
    if (limit < 1 || limit > 50) limit = 10;

    await ensureGroupMember(groupId, userId);

    const skip = (page - 1) * limit;
    const posts = await PostRepository.getPostsByGroup(groupId, skip, limit);
    const total = await PostRepository.getPostsByGroupCount(groupId);

    return {
      posts: await buildPostsResponse(posts, userId),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  static async getPendingGroupPosts(groupId, userId, page = 1, limit = 10) {
    if (page < 1) page = 1;
    if (limit < 1 || limit > 50) limit = 10;

    await ensureGroupAdmin(groupId, userId);

    const skip = (page - 1) * limit;
    const posts = await PostRepository.getPendingPostsByGroup(groupId, skip, limit);
    const total = await PostRepository.getPendingPostsByGroupCount(groupId);

    return {
      posts: await buildPostsResponse(posts, userId),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  static async approveGroupPost(postId, userId) {
    const post = await PostRepository.findPostById(postId);
    if (!post) {
      throw new Error('Không tìm thấy bài viết');
    }

    if (!post.group) {
      throw new Error('Đây không phải bài viết trong nhóm');
    }

    await ensureGroupAdmin(getDocumentId(post.group), userId);

    return await PostRepository.updatePostApproval(postId, {
      approvalStatus: 'approved',
      approvedBy: userId,
      approvedAt: new Date(),
    });
  }

  static async rejectGroupPost(postId, userId) {
    const post = await PostRepository.findPostById(postId);
    if (!post) {
      throw new Error('Không tìm thấy bài viết');
    }

    if (!post.group) {
      throw new Error('Đây không phải bài viết trong nhóm');
    }

    await ensureGroupAdmin(getDocumentId(post.group), userId);

    return await PostRepository.updatePostApproval(postId, {
      approvalStatus: 'rejected',
      approvedBy: userId,
      approvedAt: new Date(),
    });
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
    
    // Lấy context người dùng (bạn bè, danh sách bị block)
    const { friendIds, blockedAuthorIds } = await getViewerContext(userId);
    
    // Build filter privacy dựa trên mối quan hệ
    const privacyFilter = buildPrivacyMongoFilter(userId, friendIds);
    
    // TỔNG HỢP TẤT CẢ FILTER
    const searchFilter = {
      content: searchRegex,
      ...privacyFilter,
      author: { $nin: [...blockedAuthorIds] },
      "moderation.hidden": { $ne: true },
      approvalStatus: 'approved', 
      group: null
    };

    const posts = await Post.find(searchFilter)
      .populate('author', 'fullName avatar email')
      .populate('likes', 'fullName avatar email')
      .populate('reactions.user', 'fullName avatar email')
      .populate({
        path: 'sharedFrom',
        populate: [
          { path: 'author', select: '_id fullName avatar email' },
          { path: 'likes', select: 'fullName avatar email' },
          { path: 'reactions.user', select: 'fullName avatar email' },
        ],
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Post.countDocuments(searchFilter);

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



