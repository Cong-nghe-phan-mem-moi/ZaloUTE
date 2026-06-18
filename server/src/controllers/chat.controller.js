const ChatService = require("../services/chat.service");

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

async function createGroup(req, res) {
  try {
    const userId = req.user.userId;
    const { name, participantIds } = req.body;

    const result = await ChatService.createGroup(userId, name, participantIds);
    return res.status(201).json(result);
  } catch (error) {
    console.error("Create Group Error:", error);
    return res.status(error.statusCode || 500).json({
      success: false,
      code: error.code || "INTERNAL_SERVER_ERROR",
      message: error.message || "Internal server error",
    });
  }
}

async function removeMember(req, res) {
  try {
    const userId = req.user.userId;
    const { conversationId } = req.params;
    const { memberId } = req.body;

    if (!memberId) {
      return res.status(400).json({
        success: false,
        code: "MISSING_MEMBER_ID",
        message: "memberId is required",
      });
    }

    const result = await ChatService.removeGroupMember(userId, conversationId, memberId);
    return res.status(200).json(result);
  } catch (error) {
    console.error("Remove Member Error:", error);
    return res.status(error.statusCode || 500).json({
      success: false,
      code: error.code || "INTERNAL_SERVER_ERROR",
      message: error.message || "Internal server error",
    });
  }
}

async function leaveGroup(req, res) {
  try {
    const userId = req.user.userId;
    const { conversationId } = req.params;

    const result = await ChatService.leaveGroup(userId, conversationId);
    return res.status(200).json(result);
  } catch (error) {
    console.error("Leave Group Error:", error);
    return res.status(error.statusCode || 500).json({
      success: false,
      code: error.code || "INTERNAL_SERVER_ERROR",
      message: error.message || "Internal server error",
    });
  }
}

async function addMembers(req, res) {
  try {
    const userId = req.user.userId;
    const { conversationId } = req.params;
    const { participantIds } = req.body;

    const result = await ChatService.addGroupMembers(userId, conversationId, participantIds);
    return res.status(200).json(result);
  } catch (error) {
    console.error("Add Members Error:", error);
    return res.status(error.statusCode || 500).json({
      success: false,
      code: error.code || "INTERNAL_SERVER_ERROR",
      message: error.message || "Internal server error",
    });
  }
}

async function muteConversation(req, res) {
  try {
    const userId = req.user.userId;
    const { conversationId } = req.params;
    const { duration } = req.body;
    const result = await ChatService.muteConversation(userId, conversationId, duration);
    return res.status(200).json(result);
  } catch (error) {
    console.error("Mute Conversation Error:", error);
    return res.status(error.statusCode || 500).json({
      success: false,
      code: error.code || "INTERNAL_SERVER_ERROR",
      message: error.message || "Internal server error",
    });
  }
}

async function unmuteConversation(req, res) {
  try {
    const userId = req.user.userId;
    const { conversationId } = req.params;
    const result = await ChatService.unmuteConversation(userId, conversationId);
    return res.status(200).json(result);
  } catch (error) {
    console.error("Unmute Conversation Error:", error);
    return res.status(error.statusCode || 500).json({
      success: false,
      code: error.code || "INTERNAL_SERVER_ERROR",
      message: error.message || "Internal server error",
    });
  }
}

async function blockConversation(req, res) {
  try {
    const userId = req.user.userId;
    const { conversationId } = req.params;
    const result = await ChatService.blockConversation(userId, conversationId);
    return res.status(200).json(result);
  } catch (error) {
    console.error("Block Conversation Error:", error);
    return res.status(error.statusCode || 500).json({
      success: false,
      code: error.code || "INTERNAL_SERVER_ERROR",
      message: error.message || "Internal server error",
    });
  }
}

async function unblockConversation(req, res) {
  try {
    const userId = req.user.userId;
    const { conversationId } = req.params;
    const result = await ChatService.unblockConversation(userId, conversationId);
    return res.status(200).json(result);
  } catch (error) {
    console.error("Unblock Conversation Error:", error);
    return res.status(error.statusCode || 500).json({
      success: false,
      code: error.code || "INTERNAL_SERVER_ERROR",
      message: error.message || "Internal server error",
    });
  }
}

async function deleteConversation(req, res) {
  try {
    const userId = req.user.userId;
    const { conversationId } = req.params;
    const result = await ChatService.deleteConversation(userId, conversationId);
    return res.status(200).json(result);
  } catch (error) {
    console.error("Delete Conversation Error:", error);
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
  createGroup,
  removeMember,
  leaveGroup,
  addMembers,
  muteConversation,
  unmuteConversation,
  blockConversation,
  unblockConversation,
  deleteConversation,
};
