const Conversation = require("../models/conversation.model");
const Message = require("../models/message.model");

const populateSharedPost = {
  path: "sharedPost",
  populate: [
    { path: "author", select: "_id fullName avatar" },
    { path: "likes", select: "fullName avatar email" },
    { path: "reactions.user", select: "fullName avatar email" },
    {
      path: "sharedFrom",
      populate: { path: "author", select: "_id fullName avatar" },
    },
  ],
};

const populateSharedStory = {
  path: "sharedStory",
  populate: {
    path: "author",
    select: "_id fullName avatar",
  },
};

const populateMessageQuery = (query) =>
  query
    .populate("senderId", "fullName avatar")
    .populate("mentions", "fullName avatar")
    .populate("reactions.user", "fullName avatar")
    .populate(populateSharedPost)
    .populate(populateSharedStory)
    .populate({
      path: "replyTo",
      populate: {
        path: "senderId",
        select: "fullName avatar",
      },
    });

/**
 */
async function getConversationsByUserId(userId) {
  return await Conversation.find({ participants: userId })
    .populate("participants", "fullName avatar isOnline lastActive")
    .populate({
      path: "lastMessage",
      populate: [
        {
          path: "senderId",
          select: "fullName avatar",
        },
        populateSharedPost,
        populateSharedStory,
      ],
    })
    .sort({ updatedAt: -1 });
}

/**
 * @param {string} user1Id 
 * @param {string} user2Id 
 */
async function findDirectConversation(user1Id, user2Id) {
  return await Conversation.findOne({
    isGroup: false,
    participants: { $all: [user1Id, user2Id], $size: 2 },
  });
}

/**
 */
async function createConversation(data) {
  const conversation = new Conversation(data);
  return await conversation.save();
}

/**
 * @param {string} conversationId 
 * @returns {Promise<Object|null>}
 */
async function getConversationById(conversationId) {
  return await Conversation.findById(conversationId)
    .populate("participants", "fullName avatar isOnline lastActive")
    .populate("admin", "fullName avatar");
}

/**
 * @param {Object} messageData 
 */
async function saveMessage(messageData) {
  const message = new Message(messageData);
  const savedMessage = await message.save();
  return await populateMessageQuery(Message.findById(savedMessage._id));
}

/**
 * @param {string} conversationId 
 * @param {number} skip 
 * @param {number} limit 
 */
async function getMessagesByConversationId(conversationId, skip = 0, limit = 50) {
  return await populateMessageQuery(Message.find({ conversationId }))
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);
}

async function getMessageById(messageId) {
  return await populateMessageQuery(Message.findById(messageId));
}

/**
 * @param {string} conversationId 
 * @param {string} messageId 
 * @returns {Promise<Object|null>}
 */
async function updateConversationLastMessage(conversationId, messageId) {
  return await Conversation.findByIdAndUpdate(
    conversationId,
    { lastMessage: messageId },
    { new: true, timestamps: true }
  );
}

/**
 * @param {string} conversationId 
 * @param {string} userId 
 */
async function markMessagesAsRead(conversationId, userId) {
  return await Message.updateMany(
    {
      conversationId,
      senderId: { $ne: userId },
      readBy: { $ne: userId }
    },
    {
      $addToSet: { readBy: userId }
    }
  );
}

/**
 * @param {string} conversationId 
 * @param {string} userId 
 * @returns {Promise<Object|null>}
 */
async function removeParticipant(conversationId, userId) {
  return await Conversation.findByIdAndUpdate(
    conversationId,
    { $pull: { participants: userId } },
    { new: true }
  )
    .populate("participants", "fullName avatar isOnline lastActive")
    .populate("admin", "fullName avatar");
}

/**
 * @param {string} conversationId 
 * @param {string} adminId 
 * @returns {Promise<Object|null>}
 */
async function updateConversationAdmin(conversationId, adminId) {
  return await Conversation.findByIdAndUpdate(
    conversationId,
    { admin: adminId },
    { new: true }
  )
    .populate("participants", "fullName avatar isOnline lastActive")
    .populate("admin", "fullName avatar");
}

/**
 * @param {string} conversationId 
 * @param {Array<string>} userIds 
 * @returns {Promise<Object|null>}
 */
async function addParticipants(conversationId, userIds) {
  return await Conversation.findByIdAndUpdate(
    conversationId,
    { $addToSet: { participants: { $each: userIds } } },
    { new: true }
  )
    .populate("participants", "fullName avatar isOnline lastActive")
    .populate("admin", "fullName avatar");
}

module.exports = {
  getConversationsByUserId,
  findDirectConversation,
  createConversation,
  getConversationById,
  saveMessage,
  getMessagesByConversationId,
  updateConversationLastMessage,
  markMessagesAsRead,
  getMessageById,
  removeParticipant,
  updateConversationAdmin,
  addParticipants,
};
