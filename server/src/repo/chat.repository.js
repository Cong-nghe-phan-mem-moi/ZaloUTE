const Conversation = require("../models/conversation.model");
const Message = require("../models/message.model");

/**
 * Lấy tất cả các cuộc trò chuyện của một người dùng
 * @param {string} userId - ID người dùng
 * @returns {Promise<Array>} Danh sách các cuộc trò chuyện
 */
async function getConversationsByUserId(userId) {
  return await Conversation.find({ participants: userId })
    .populate("participants", "fullName avatar isOnline lastActive")
    .populate({
      path: "lastMessage",
      populate: {
        path: "senderId",
        select: "fullName avatar",
      },
    })
    .sort({ updatedAt: -1 });
}

/**
 * Tìm cuộc trò chuyện 1-1 giữa hai người dùng
 * @param {string} user1Id 
 * @param {string} user2Id 
 * @returns {Promise<Object|null>} Cuộc trò chuyện tìm được hoặc null
 */
async function findDirectConversation(user1Id, user2Id) {
  return await Conversation.findOne({
    isGroup: false,
    participants: { $all: [user1Id, user2Id], $size: 2 },
  });
}

/**
 * Tạo một cuộc trò chuyện mới
 * @param {Object} data - Dữ liệu cuộc trò chuyện
 * @returns {Promise<Object>} Cuộc trò chuyện đã được tạo
 */
async function createConversation(data) {
  const conversation = new Conversation(data);
  return await conversation.save();
}

/**
 * Lấy thông tin chi tiết cuộc trò chuyện bằng ID
 * @param {string} conversationId 
 * @returns {Promise<Object|null>}
 */
async function getConversationById(conversationId) {
  return await Conversation.findById(conversationId)
    .populate("participants", "fullName avatar isOnline lastActive")
    .populate("admin", "fullName avatar");
}

/**
 * Lưu tin nhắn mới vào cơ sở dữ liệu
 * @param {Object} messageData 
 * @returns {Promise<Object>} Tin nhắn đã lưu
 */
async function saveMessage(messageData) {
  const message = new Message(messageData);
  const savedMessage = await message.save();
  return await Message.findById(savedMessage._id)
    .populate("senderId", "fullName avatar")
    .populate({
      path: "replyTo",
      populate: {
        path: "senderId",
        select: "fullName avatar",
      },
    });
}

/**
 * Lấy lịch sử tin nhắn của một cuộc trò chuyện (phân trang)
 * @param {string} conversationId 
 * @param {number} skip 
 * @param {number} limit 
 * @returns {Promise<Array>} Lịch sử tin nhắn
 */
async function getMessagesByConversationId(conversationId, skip = 0, limit = 50) {
  return await Message.find({ conversationId })
    .populate("senderId", "fullName avatar")
    .populate({
      path: "replyTo",
      populate: {
        path: "senderId",
        select: "fullName avatar",
      },
    })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);
}

/**
 * Cập nhật tin nhắn mới nhất và thời gian cập nhật của cuộc trò chuyện
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
 * Đánh dấu tất cả tin nhắn trong hội thoại là đã đọc bởi một người dùng
 * @param {string} conversationId 
 * @param {string} userId 
 * @returns {Promise<Object>} Kết quả cập nhật
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
 * Loại bỏ một thành viên khỏi cuộc hội thoại nhóm
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
 * Cập nhật trưởng nhóm mới
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
 * Thêm các thành viên vào cuộc hội thoại nhóm
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
  removeParticipant,
  updateConversationAdmin,
  addParticipants,
};
