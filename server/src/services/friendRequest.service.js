const FriendRequestRepo = require("../repositories/friendRequest.repository");
const UserRepository = require("../repositories/user.repository");
const NotificationService = require("./notification.service");

const isBlockedBetweenUsers = async (userAId, userBId) => {
  const [userA, userB] = await Promise.all([
    UserRepository.getUserById(userAId),
    UserRepository.getUserById(userBId),
  ]);

  if (!userA || !userB) {
    return false;
  }

  const userABlocked = (userA.blockedUsers || []).some(
    (user) => String(user?._id || user) === String(userBId),
  );
  const userBBlocked = (userB.blockedUsers || []).some(
    (user) => String(user?._id || user) === String(userAId),
  );

  return userABlocked || userBBlocked;
};

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
      message: "Friend request receiver is required",
    };
  }

  if (senderId === receiverId) {
    throw {
      statusCode: 400,
      message: "You cannot send a friend request to yourself",
    };
  }

  if (await isBlockedBetweenUsers(senderId, receiverId)) {
    throw {
      statusCode: 403,
      code: "FRIEND_REQUEST_BLOCKED",
      message: "You cannot send a friend request to this user",
    };
  }

  const receiverExists = await UserRepository.getUserById(receiverId);
  if (!receiverExists) {
    throw { statusCode: 404, message: "User not found" };
  } else {
    if (receiverExists.privacySettings?.allowFriendRequests === false) {
      throw {
        statusCode: 403,
        code: "FRIEND_REQUESTS_DISABLED",
        message: "This user is not accepting friend requests",
      };
    }

    if (hasFriend(receiverExists, senderId)) {
      throw { statusCode: 400, message: "You are already friends" };
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
      message: "You are already friends",
    };
  }

  const existingReq = await FriendRequestRepo.checkExistingRequest(
    senderId,
    receiverId,
  );
  if (existingReq) {
    throw { statusCode: 400, message: "Friend request is already pending" };
  }

  const newRequest = await FriendRequestRepo.createRequest(
    senderId,
    receiverId,
  );

  await NotificationService.createNotification({
    receiver: receiverId,
    sender: senderId,
    type: "friend_request",
    content: "sent you a friend request",
    relatedId: newRequest._id,
    relatedType: "FriendRequest",
    data: {
      profileId: senderId,
      friendRequestId: newRequest._id,
    },
  });

  return {
    success: true,
    message: "Friend request sent successfully",
    data: newRequest,
  };
}

async function acceptFriendRequest(senderId, receiverId) {
  if (!senderId) {
    throw {
      statusCode: 400,
      code: "SENDER_ID_REQUIRED",
      message: "Friend request sender is required",
    };
  }

  if (senderId === receiverId) {
    throw {
      statusCode: 400,
      code: "INVALID_ACTION",
      message: "You cannot accept your own friend request",
    };
  }

  if (await isBlockedBetweenUsers(senderId, receiverId)) {
    throw {
      statusCode: 403,
      code: "FRIEND_REQUEST_BLOCKED",
      message: "You cannot accept this friend request",
    };
  }

  const senderExists = await UserRepository.getUserById(senderId);
  if (!senderExists) {
    throw {
      statusCode: 404,
      code: "SENDER_NOT_FOUND",
      message: "Friend request sender not found",
    };
  } else {
    if (hasFriend(senderExists, receiverId)) {
      throw {
        statusCode: 400,
        code: "ALREADY_FRIENDS",
        message: "You are already friends",
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
      message: "No pending friend request found",
    };
  }

  if (request.receiver.toString() !== receiverId.toString()) {
    throw {
      statusCode: 403,
      code: "FORBIDDEN",
      message: "You are not allowed to accept this friend request",
    };
  }

  const requesterId = request.sender.toString();
  const accepterId = request.receiver.toString();

  console.log("Accepting friend request:", {
    requestId: request._id.toString(),
    requesterId,
    accepterId,
    currentUserId: receiverId?.toString?.() || receiverId,
  });

  await Promise.all([
    FriendRequestRepo.updateRequestStatus(request._id, "accepted"),
    UserRepository.addFriend(requesterId, accepterId),
    UserRepository.addFriend(accepterId, requesterId),
    UserRepository.updateProfile(requesterId, {
      $addToSet: { following: accepterId },
    }),
    UserRepository.updateProfile(accepterId, {
      $addToSet: { followers: requesterId },
    }),
    UserRepository.updateProfile(accepterId, {
      $addToSet: { following: requesterId },
    }),
    UserRepository.updateProfile(requesterId, {
      $addToSet: { followers: accepterId },
    }),
  ]);

  const notification = await NotificationService.createNotification({
    receiver: requesterId,
    sender: accepterId,
    type: "friend_accept",
    content: "accepted your friend request",
    relatedId: accepterId,
    relatedType: "User",
    data: {
      profileId: accepterId,
    },
  });

  if (!notification) {
    throw {
      statusCode: 500,
      code: "FRIEND_ACCEPT_NOTIFICATION_FAILED",
      message: "Unable to create friend accept notification",
    };
  }

  console.log("Friend accept notification created:", notification?._id);

  return {
    success: true,
    message: "Friend request accepted successfully",
  };
}

async function rejectFriendRequest(senderId, receiverId) {
  if (!senderId) {
    throw {
      statusCode: 400,
      code: "SENDER_ID_REQUIRED",
      message: "Friend request sender is required",
    };
  }

  if (senderId === receiverId) {
    throw {
      statusCode: 400,
      code: "INVALID_ACTION",
      message: "You cannot reject your own friend request",
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
      message: "No pending friend request found",
    };
  }

  if (request.receiver.toString() !== receiverId.toString()) {
    throw {
      statusCode: 403,
      code: "FORBIDDEN",
      message: "You are not allowed to reject this friend request",
    };
  }

  await FriendRequestRepo.deleteRequestBetweenUsers(senderId, receiverId);

  return {
    success: true,
    message: "Friend request rejected successfully",
  };
}

async function cancelFriendRequest(senderId, receiverId) {
  if (!receiverId) {
    throw {
      statusCode: 400,
      code: "RECEIVER_ID_REQUIRED",
      message: "Friend request receiver is required",
    };
  }

  if (senderId === receiverId) {
    throw {
      statusCode: 400,
      code: "INVALID_ACTION",
      message: "You cannot cancel your own friend request",
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
      message: "No pending friend request found",
    };
  }

  if (request.sender.toString() !== senderId.toString()) {
    throw {
      statusCode: 403,
      code: "FORBIDDEN",
      message: "You are not allowed to cancel this friend request",
    };
  }

  await FriendRequestRepo.deleteRequestBetweenUsers(senderId, receiverId);

  return {
    success: true,
    message: "Friend request cancelled successfully",
  };
}

async function unfriend(userId, friendId) {
  if (!friendId) {
    throw {
      statusCode: 400,
      code: "FRIEND_ID_REQUIRED",
      message: "User to unfriend is required",
    };
  }

  if (userId === friendId) {
    throw {
      statusCode: 400,
      code: "INVALID_ACTION",
      message: "You cannot unfriend yourself",
    };
  }

  const user = await UserRepository.getUserById(userId);
  const friend = await UserRepository.getUserById(friendId);

  if (!user || !friend) {
    throw {
      statusCode: 404,
      code: "USER_NOT_FOUND",
      message: "User not found",
    };
  }

  if (!hasFriend(user, friendId) || !hasFriend(friend, userId)) {
    throw {
      statusCode: 400,
      code: "NOT_FRIENDS",
      message: "These users are not friends",
    };
  }

  await Promise.all([
    UserRepository.removeFriend(userId, friendId),
    UserRepository.removeFriend(friendId, userId),
    FriendRequestRepo.deleteRequestBetweenUsers(userId, friendId),
  ]);

  return {
    success: true,
    message: "Unfriended successfully",
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

async function getPendingRequests(myId, userIds) {
  return await FriendRequestRepo.findPendingRequestsInUserList(myId, userIds);
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
  getPendingRequests,
};





