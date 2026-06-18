const User = require('../models/user.model');
const { Story, STORY_REACTIONS } = require('../models/story.model');
const NotificationService = require('./notification.service');
const chatRepository = require('../repositories/chat.repository');
const onlineTracker = require('../utils/onlineTracker');

const STORY_LIFETIME_MS = 24 * 60 * 60 * 1000;

const normalizeUserId = (value) => String(value?._id || value);

const getUniqueViewers = (viewers = [], authorId = null) => {
  const seenUserIds = new Set();
  const normalizedAuthorId = authorId ? String(authorId) : null;

  return viewers.filter((viewer) => {
    const viewerId = normalizeUserId(viewer.user);

    if (!viewerId || viewerId === normalizedAuthorId || seenUserIds.has(viewerId)) {
      return false;
    }

    seenUserIds.add(viewerId);
    return true;
  });
};

const buildStoryResponse = (story, currentUserId = null) => {
  const storyObj = story.toObject ? story.toObject() : story;
  const currentUser = currentUserId ? String(currentUserId) : null;
  const authorId = normalizeUserId(storyObj.author);
  const isOwner = currentUser && authorId === currentUser;
  const rawViewers = storyObj.viewers || [];
  const uniqueViewers = getUniqueViewers(storyObj.viewers, authorId);
  const currentReaction = (storyObj.reactions || []).find(
    (reaction) => normalizeUserId(reaction.user) === currentUser,
  );

  storyObj.viewers = uniqueViewers;
  storyObj.viewerCount = uniqueViewers.length;
  storyObj.reactionCount = storyObj.reactions?.length || 0;
  storyObj.replyCount = storyObj.replies?.length || 0;
  storyObj.currentUserReaction = currentReaction?.type || null;
  storyObj.hasViewed = rawViewers.some(
    (viewer) => normalizeUserId(viewer.user) === currentUser,
  );

  if (!isOwner) {
    delete storyObj.viewers;
    delete storyObj.replies;
  }

  return storyObj;
};

class StoryService {
  static async createStory(userId, payload, media = null) {
    const text = payload.text?.trim() || '';
    const background = payload.background || '#1877f2';

    if (!text && !media) {
      throw new Error('Story must include text, image, or video');
    }

    const type = media?.type || 'text';
    const story = await Story.create({
      author: userId,
      type,
      text,
      background,
      media,
      viewers: [],
      reactions: [],
      replies: [],
      expiresAt: new Date(Date.now() + STORY_LIFETIME_MS),
    });

    return await Story.findById(story._id).populate('author', 'fullName avatar email');
  }

  static async getActiveStories(userId) {
    const user = await User.findById(userId).select('friends');
    const authorIds = [userId, ...(user?.friends || [])];

    const stories = await Story.find({
      author: { $in: authorIds },
      expiresAt: { $gt: new Date() },
    })
      .populate('author', 'fullName avatar email')
      .populate('viewers.user', 'fullName avatar email')
      .populate('reactions.user', 'fullName avatar email')
      .populate('replies.user', 'fullName avatar email')
      .sort({ createdAt: -1 });

    return stories.map((story) => buildStoryResponse(story, userId));
  }

  static async getStory(storyId, userId) {
    const story = await Story.findOne({
      _id: storyId,
      expiresAt: { $gt: new Date() },
    })
      .populate('author', 'fullName avatar email')
      .populate('viewers.user', 'fullName avatar email')
      .populate('reactions.user', 'fullName avatar email')
      .populate('replies.user', 'fullName avatar email');

    if (!story) {
      throw new Error('Story not found');
    }

    return buildStoryResponse(story, userId);
  }

  static async markViewed(storyId, userId) {
    const story = await Story.findOne({
      _id: storyId,
      expiresAt: { $gt: new Date() },
    });

    if (!story) {
      throw new Error('Story not found');
    }

    await Story.updateOne(
      {
        _id: storyId,
        expiresAt: { $gt: new Date() },
        'viewers.user': { $ne: userId },
      },
      {
        $push: {
          viewers: {
            user: userId,
            viewedAt: new Date(),
          },
        },
      },
    );

    return await this.getStory(storyId, userId);
  }

  static async reactToStory(storyId, userId, reactionType = 'like') {
    if (!STORY_REACTIONS.includes(reactionType)) {
      throw new Error('Invalid reaction type');
    }

    const story = await Story.findOne({
      _id: storyId,
      expiresAt: { $gt: new Date() },
    });

    if (!story) {
      throw new Error('Story not found');
    }

    const existingReaction = story.reactions.find(
      (reaction) => normalizeUserId(reaction.user) === String(userId),
    );
    const shouldNotify =
      normalizeUserId(story.author) !== String(userId) &&
      existingReaction?.type !== reactionType;

    if (existingReaction?.type === reactionType) {
      story.reactions = story.reactions.filter(
        (reaction) => normalizeUserId(reaction.user) !== String(userId),
      );
    } else if (existingReaction) {
      existingReaction.type = reactionType;
      existingReaction.createdAt = new Date();
    } else {
      story.reactions.push({ user: userId, type: reactionType });
    }

    await story.save();

    if (shouldNotify) {
      await NotificationService.createNotification({
        receiver: story.author,
        sender: userId,
        type: 'story_reaction',
        content: `reacted ${reactionType} to your story`,
        preview: story.text,
        relatedId: story._id,
        relatedType: 'Story',
        data: {
          storyId: story._id,
          reactionType,
        },
      });
    }

    return await this.getStory(storyId, userId);
  }

  static async replyToStory(storyId, userId, content) {
    const trimmedContent = content?.trim() || '';
    if (!trimmedContent) {
      throw new Error('Reply cannot be empty');
    }

    const story = await Story.findOne({
      _id: storyId,
      expiresAt: { $gt: new Date() },
    });

    if (!story) {
      throw new Error('Story not found');
    }

    const authorId = normalizeUserId(story.author);
    if (authorId === String(userId)) {
      throw new Error('You cannot reply to your own story');
    }

    let conversation = await chatRepository.findDirectConversation(userId, authorId);
    if (!conversation) {
      conversation = await chatRepository.createConversation({
        isGroup: false,
        participants: [userId, authorId],
      });
    }

    const message = await chatRepository.saveMessage({
      conversationId: conversation._id,
      senderId: userId,
      messageType: 'story_reply',
      content: trimmedContent,
      sharedStory: story._id,
      readBy: [userId],
    });

    await chatRepository.updateConversationLastMessage(conversation._id, message._id);

    const updatedConversations = await chatRepository.getConversationsByUserId(userId);
    const updatedConversation =
      updatedConversations.find(
        (item) => item._id.toString() === conversation._id.toString(),
      ) || conversation;

    const participants = conversation.participants || [userId, authorId];
    participants.forEach((participant) => {
      const participantId = normalizeUserId(participant);
      onlineTracker.sendChatToUser(participantId, {
        type: 'message',
        data: message,
      });
      onlineTracker.sendChatToUser(participantId, {
        type: 'conversation_update',
        data: updatedConversation,
      });
    });

    await NotificationService.createNotification({
      receiver: authorId,
      sender: userId,
      type: 'new_message',
      content: `${message.senderId.fullName} replied to your story`,
      preview: trimmedContent,
      relatedId: conversation._id,
      relatedType: null,
      data: {
        conversationId: conversation._id,
        messageId: message._id,
        storyId: story._id,
      },
    });

    return {
      story: await this.getStory(storyId, userId),
      conversation: updatedConversation,
      message,
    };
  }

  static async getViewers(storyId, userId) {
    const story = await Story.findOne({
      _id: storyId,
      author: userId,
      expiresAt: { $gt: new Date() },
    }).populate('viewers.user', 'fullName avatar email');

    if (!story) {
      throw new Error('Story not found');
    }

    return getUniqueViewers(story.viewers, userId);
  }
}

module.exports = StoryService;
