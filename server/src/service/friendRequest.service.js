const FriendRequestRepo = require("../repo/friendRequest.repository");
const UserRepository = require("../repo/user.repository");

const hasFriend = (user, friendId) =>
  user.friends?.some(
    (id) => (id?._id || id).toString() === friendId.toString(),
  );

const getUserId = (userOrId) => {
  if (!userOrId) return null;

  if (typeof userOrId === "object") {
    return userOrId._id || userOrId.id || null;
  }

  return userOrId;
};

async function getFriendRelation(userOrId, myId) {
  const userId = getUserId(userOrId);

  if (!userId || !myId) {
    return "none";
  }

  const user =
    typeof userOrId === "object" && userOrId?.friends
      ? userOrId
      : await UserRepository.getUserById(userId);

  if (!user) {
    return "none";
  }

  if (hasFriend(user, myId)) {
    return "friend";
  }

  const request = await FriendRequestRepo.findPendingRequestBetweenUsers(
    userId,
    myId,
  );

  if (!request) {
    return "none";
  }

  return request.sender.toString() === myId.toString()
    ? "sent_request"
    : "received_request";
}

async function sendFriendRequest(senderId, receiverId) {
  if (!receiverId) {
    throw {
      statusCode: 400,
      code: "RECEIVER_ID_REQUIRED",
      message: "Thiếu người nhận lời mời kết bạn",
    };
  }

  if (senderId === receiverId) {
    throw {
      statusCode: 400,
      message: "Không thể tự gửi lời mời cho chính mình",
    };
  }

  const receiverExists = await UserRepository.getUserById(receiverId);
  if (!receiverExists) {
    throw { statusCode: 404, message: "Không tìm thấy người dùng này" };
  } else {
    if (hasFriend(receiverExists, senderId)) {
      throw { statusCode: 400, message: "Hai người đã là bạn bè" };
    }
  }

  const existingAcceptedFriendship =
    await FriendRequestRepo.findAcceptedRequestFromSenderToReceiver(
      senderId,
      receiverId,
    );
  if (existingAcceptedFriendship) {
    throw {
      statusCode: 400,
      code: "ALREADY_FRIENDS",
      message: "Hai người đã là bạn bè",
    };
  }

  const existingReq = await FriendRequestRepo.checkExistingRequest(
    senderId,
    receiverId,
  );
  if (existingReq) {
    throw { statusCode: 400, message: "Lời mời kết bạn đang chờ xử lý" };
  }

  const newRequest = await FriendRequestRepo.createRequest(
    senderId,
    receiverId,
  );

  return {
    success: true,
    message: "Gửi lời mời kết bạn thành công",
    data: newRequest,
  };
}

async function acceptFriendRequest(senderId, receiverId) {
  if (!senderId) {
    throw {
      statusCode: 400,
      code: "SENDER_ID_REQUIRED",
      message: "Thiếu người gửi lời mời kết bạn",
    };
  }

  if (senderId === receiverId) {
    throw {
      statusCode: 400,
      code: "INVALID_ACTION",
      message: "Không thể tự chấp nhận lời mời của chính mình",
    };
  }

  const senderExists = await UserRepository.getUserById(senderId);
  if (!senderExists) {
    throw {
      statusCode: 404,
      code: "SENDER_NOT_FOUND",
      message: "Không tìm thấy người gửi lời mời kết bạn",
    };
  } else {
    if (hasFriend(senderExists, receiverId)) {
      throw {
        statusCode: 400,
        code: "ALREADY_FRIENDS",
        message: "Hai người đã là bạn bè",
      };
    }
  }

  const request = await FriendRequestRepo.findPendingRequestBetweenUsers(
    senderId,
    receiverId,
  );
  if (!request) {
    throw {
      statusCode: 404,
      code: "REQUEST_NOT_FOUND",
      message: "Không tìm thấy lời mời kết bạn đang chờ xử lý giữa hai người",
    };
  }

  if (request.receiver.toString() !== receiverId.toString()) {
    throw {
      statusCode: 403,
      code: "FORBIDDEN",
      message: "Bạn không có quyền chấp nhận lời mời kết bạn này",
    };
  }

  await Promise.all([
    FriendRequestRepo.updateRequestStatus(request._id, "accepted"),
    UserRepository.addFriend(senderId, receiverId),
    UserRepository.addFriend(receiverId, senderId),
  ]);

  return {
    success: true,
    message: "Chấp nhận lời mời kết bạn thành công",
  };
}

async function rejectFriendRequest(senderId, receiverId) {
  if (!senderId) {
    throw {
      statusCode: 400,
      code: "SENDER_ID_REQUIRED",
      message: "Thiếu người gửi lời mời kết bạn",
    };
  }

  if (senderId === receiverId) {
    throw {
      statusCode: 400,
      code: "INVALID_ACTION",
      message: "Không thể tự từ chối lời mời của chính mình",
    };
  }

  const request = await FriendRequestRepo.findPendingRequestBetweenUsers(
    senderId,
    receiverId,
  );

  if (!request) {
    throw {
      statusCode: 404,
      code: "REQUEST_NOT_FOUND",
      message: "Không tìm thấy lời mời kết bạn đang chờ xử lý giữa hai người",
    };
  }

  if (request.receiver.toString() !== receiverId.toString()) {
    throw {
      statusCode: 403,
      code: "FORBIDDEN",
      message: "Bạn không có quyền từ chối lời mời kết bạn này",
    };
  }

  await FriendRequestRepo.deleteRequestBetweenUsers(senderId, receiverId);

  return {
    success: true,
    message: "Từ chối lời mời kết bạn thành công",
  };
}

async function cancelFriendRequest(senderId, receiverId) {
  if (!receiverId) {
    throw {
      statusCode: 400,
      code: "RECEIVER_ID_REQUIRED",
      message: "Thiếu người nhận lời mời kết bạn",
    };
  }

  if (senderId === receiverId) {
    throw {
      statusCode: 400,
      code: "INVALID_ACTION",
      message: "Không thể hủy lời mời của chính mình",
    };
  }

  const request = await FriendRequestRepo.findPendingRequestBetweenUsers(
    senderId,
    receiverId,
  );

  if (!request) {
    throw {
      statusCode: 404,
      code: "REQUEST_NOT_FOUND",
      message: "Không tìm thấy lời mời kết bạn đang chờ xử lý giữa hai người",
    };
  }

  if (request.sender.toString() !== senderId.toString()) {
    throw {
      statusCode: 403,
      code: "FORBIDDEN",
      message: "Bạn không có quyền hủy lời mời kết bạn này",
    };
  }

  await FriendRequestRepo.deleteRequestBetweenUsers(senderId, receiverId);

  return {
    success: true,
    message: "Hủy lời mời kết bạn thành công",
  };
}

async function unfriend(userId, friendId) {
  if (!friendId) {
    throw {
      statusCode: 400,
      code: "FRIEND_ID_REQUIRED",
      message: "Thiếu người dùng cần hủy kết bạn",
    };
  }

  if (userId === friendId) {
    throw {
      statusCode: 400,
      code: "INVALID_ACTION",
      message: "Không thể hủy kết bạn với chính mình",
    };
  }

  const user = await UserRepository.getUserById(userId);
  const friend = await UserRepository.getUserById(friendId);

  if (!user || !friend) {
    throw {
      statusCode: 404,
      code: "USER_NOT_FOUND",
      message: "Không tìm thấy người dùng",
    };
  }

  if (!hasFriend(user, friendId) || !hasFriend(friend, userId)) {
    throw {
      statusCode: 400,
      code: "NOT_FRIENDS",
      message: "Hai người chưa phải là bạn bè",
    };
  }

  await Promise.all([
    UserRepository.removeFriend(userId, friendId),
    UserRepository.removeFriend(friendId, userId),
    FriendRequestRepo.deleteRequestBetweenUsers(userId, friendId),
  ]);

  return {
    success: true,
    message: "Hủy kết bạn thành công",
  };
}

async function getIncomingFriendRequests(userId) {
  const requests = await FriendRequestRepo.getPendingRequestsByReceiver(userId);

  return {
    success: true,
    data: requests.map((request) => ({
      id: request._id,
      sender: request.sender,
      receiver: request.receiver,
      status: request.status,
      createdAt: request.createdAt,
      updatedAt: request.updatedAt,
    })),
  };
}

async function getOutgoingFriendRequests(userId) {
  const requests = await FriendRequestRepo.getPendingRequestsBySender(userId);

  return {
    success: true,
    data: requests.map((request) => ({
      id: request._id,
      sender: request.sender,
      receiver: request.receiver,
      status: request.status,
      createdAt: request.createdAt,
      updatedAt: request.updatedAt,
    })),
  };
}

async function checkFriendRequest(userId, myId) {
  return await getFriendRelation(userId, myId);
}

module.exports = {
  sendFriendRequest,
  cancelFriendRequest,
  rejectFriendRequest,
  unfriend,
  getIncomingFriendRequests,
  getOutgoingFriendRequests,
  checkFriendRequest,
  acceptFriendRequest,
  getFriendRelation,
};
