const FriendRequestService = require("../services/friendRequest.service");

async function handleSendFriendRequest(req, res) {
  try {
    const senderId = req.user.userId;
    const receiverId = req.body.receiverId;

    // console.log(req.user);

    const result = await FriendRequestService.sendFriendRequest(
      senderId,
      receiverId,
    );

    return res.status(201).json(result);
  } catch (error) {
    console.error("Error in handleSendFriendRequest:", error);
    return res.status(error.statusCode || 500).json({
      success: false,
      code: error.code || "INTERNAL_SERVER_ERROR",
      message: error.message || "Internal server error",
    });
  }
}

async function handleAcceptFriendRequest(req, res) {
  try {
    const receiverId = req.user.userId;
    const senderId = req.body.senderId;

    // console.log('handleAcceptFriendRequest - senderId:', senderId, 'receiverId:', receiverId);

    const result = await FriendRequestService.acceptFriendRequest(
      senderId,
      receiverId,
    );

    return res.status(200).json(result);
  } catch (error) {
    console.error("Error in handleAcceptFriendRequest:", error);
    return res.status(error.statusCode || 500).json({
      success: false,
      code: error.code || "INTERNAL_SERVER_ERROR",
      message: error.message || "Internal server error",
    });
  }
}

async function handleRejectFriendRequest(req, res) {
  try {
    const receiverId = req.user.userId;
    const senderId = req.body.senderId;

    const result = await FriendRequestService.rejectFriendRequest(
      senderId,
      receiverId,
    );

    return res.status(200).json(result);
  } catch (error) {
    console.error("Error in handleRejectFriendRequest:", error);
    return res.status(error.statusCode || 500).json({
      success: false,
      code: error.code || "INTERNAL_SERVER_ERROR",
      message: error.message || "Internal server error",
    });
  }
}

async function handleCancelFriendRequest(req, res) {
  try {
    const senderId = req.user.userId;
    const receiverId = req.body.receiverId;

    const result = await FriendRequestService.cancelFriendRequest(
      senderId,
      receiverId,
    );

    return res.status(200).json(result);
  } catch (error) {
    console.error("Error in handleCancelFriendRequest:", error);
    return res.status(error.statusCode || 500).json({
      success: false,
      code: error.code || "INTERNAL_SERVER_ERROR",
      message: error.message || "Internal server error",
    });
  }
}

async function handleUnfriend(req, res) {
  try {
    const userId = req.user.userId;
    const friendId = req.body.friendId;

    const result = await FriendRequestService.unfriend(userId, friendId);

    return res.status(200).json(result);
  } catch (error) {
    console.error("Error in handleUnfriend:", error);
    return res.status(error.statusCode || 500).json({
      success: false,
      code: error.code || "INTERNAL_SERVER_ERROR",
      message: error.message || "Internal server error",
    });
  }
}

async function handleGetIncomingFriendRequests(req, res) {
  try {
    const userId = req.user.userId;
    const result = await FriendRequestService.getIncomingFriendRequests(userId);

    return res.status(200).json(result);
  } catch (error) {
    console.error("Error in handleGetIncomingFriendRequests:", error);
    return res.status(error.statusCode || 500).json({
      success: false,
      code: error.code || "INTERNAL_SERVER_ERROR",
      message: error.message || "Internal server error",
    });
  }
}

async function handleGetOutgoingFriendRequests(req, res) {
  try {
    const userId = req.user.userId;
    const result = await FriendRequestService.getOutgoingFriendRequests(userId);

    return res.status(200).json(result);
  } catch (error) {
    console.error("Error in handleGetOutgoingFriendRequests:", error);
    return res.status(error.statusCode || 500).json({
      success: false,
      code: error.code || "INTERNAL_SERVER_ERROR",
      message: error.message || "Internal server error",
    });
  }
}

module.exports = {
  handleSendFriendRequest,
  handleAcceptFriendRequest,
  handleRejectFriendRequest,
  handleCancelFriendRequest,
  handleUnfriend,
  handleGetIncomingFriendRequests,
  handleGetOutgoingFriendRequests,
};
