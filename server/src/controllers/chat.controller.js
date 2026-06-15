const ChatService = require("../service/chat.service");

async function getConversations(req, res) {
  try {
    const userId = req.user.userId;
    const result = await ChatService.getUserConversations(userId);
    return res.status(200).json(result);
  } catch (error) {
    console.error("Get Conversations Error:", error);
    return res.status(error.statusCode || 500).json({
      success: false,
      code: error.code || "INTERNAL_SERVER_ERROR",
      message: error.message || "Internal server error",
    });
  }
}

async function getOrCreateConversation(req, res) {
  try {
    const userId = req.user.userId;
    const { targetUserId } = req.body;

    if (!targetUserId) {
      return res.status(400).json({
        success: false,
        code: "MISSING_TARGET_USER",
        message: "targetUserId is required",
      });
    }

    const result = await ChatService.getOrCreateDirectConversation(userId, targetUserId);
    return res.status(200).json(result);
  } catch (error) {
    console.error("Get/Create Conversation Error:", error);
    return res.status(error.statusCode || 500).json({
      success: false,
      code: error.code || "INTERNAL_SERVER_ERROR",
      message: error.message || "Internal server error",
    });
  }
}

async function getMessages(req, res) {
  try {
    const userId = req.user.userId;
    const { conversationId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;

    const result = await ChatService.getConversationMessages(
      conversationId,
      userId,
      page,
      limit
    );
    return res.status(200).json(result);
  } catch (error) {
    console.error("Get Messages Error:", error);
    return res.status(error.statusCode || 500).json({
      success: false,
      code: error.code || "INTERNAL_SERVER_ERROR",
      message: error.message || "Internal server error",
    });
  }
}

module.exports = {
  getConversations,
  getOrCreateConversation,
  getMessages,
};
