const FriendRequestRepo = require('../repo/friendRequest.repository');
const UserRepository = require('../repo/user.repository');

const hasFriend = (user, friendId) =>
  user.friends?.some((id) => id.toString() === friendId.toString());

async function sendFriendRequest(senderId, receiverId) {
  if (!receiverId) {
    throw { statusCode: 400, code: 'RECEIVER_ID_REQUIRED', message: "Thiếu người nhận lời mời kết bạn" };
  }

  if (senderId === receiverId) {
    throw { statusCode: 400, message: "Không thể tự gửi lời mời cho chính mình" };
  }

  const receiverExists = await UserRepository.getUserById(receiverId);
  if (!receiverExists) {
    throw { statusCode: 404, message: "Không tìm thấy người dùng này" };
  } else {
    if (hasFriend(receiverExists, senderId)) {
      throw { statusCode: 400, message: "Hai người đã là bạn bè" };
    }
  }

  const existingReq = await FriendRequestRepo.checkExistingRequest(senderId, receiverId);
  if (existingReq) {
    throw { statusCode: 400, message: "Lời mời kết bạn đang chờ xử lý" };
  }
 
  const newRequest = await FriendRequestRepo.createRequest(senderId, receiverId);
  
  return {
    success: true,
    message: "Gửi lời mời kết bạn thành công",
    data: newRequest
  };
}

async function acceptFriendRequest(senderId, receiverId) {
  if (!senderId) {
    throw {
      statusCode: 400,
      code: 'SENDER_ID_REQUIRED',
      message: "Thiếu người gửi lời mời kết bạn"
    };
  }

  if (senderId === receiverId) {
    throw { 
      statusCode: 400,
      code: 'INVALID_ACTION',
      message: "Không thể tự chấp nhận lời mời của chính mình" 
    };
  }

  const senderExists = await UserRepository.getUserById(senderId);
  if (!senderExists) {
    throw { 
      statusCode: 404,
      code: 'SENDER_NOT_FOUND',
      message: "Không tìm thấy người gửi lời mời kết bạn" 
    };
  } else {
    if (hasFriend(senderExists, receiverId)) {
      throw { 
        statusCode: 400,
        code: 'ALREADY_FRIENDS', 
        message: "Hai người đã là bạn bè" 
      };
    }
  }

  const request = await FriendRequestRepo.findPendingRequestBetweenUsers(senderId, receiverId);
  if (!request) {
    throw { 
      statusCode: 404, 
      code: 'REQUEST_NOT_FOUND',
      message: "Không tìm thấy lời mời kết bạn đang chờ xử lý giữa hai người" 
    };
  }

  if (request.receiver.toString() !== receiverId.toString()) {
    throw {
      statusCode: 403,
      code: 'FORBIDDEN',
      message: "Bạn không có quyền chấp nhận lời mời kết bạn này"
    };
  }

  await Promise.all([
    FriendRequestRepo.updateRequestStatus(request._id, 'accepted'),
    UserRepository.addFriend(senderId, receiverId),
    UserRepository.addFriend(receiverId, senderId)
  ]);

  
  return {
    success: true,
    message: "Chấp nhận lời mời kết bạn thành công",
  };
}

async function checkFriendRequest(userId, myId) {
  let userWithRelation = "none";

  const request = await FriendRequestRepo.findPendingRequestBetweenUsers(userId, myId);

  if (request) {
    if (request.sender.toString() === myId.toString()) {
      userWithRelation = 'sent_request';
    } else {
      userWithRelation = 'received_request';
    }
  }

  return userWithRelation;
}

module.exports = {
  sendFriendRequest,
  checkFriendRequest,
  acceptFriendRequest
};
