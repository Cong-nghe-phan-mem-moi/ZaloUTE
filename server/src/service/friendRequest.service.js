const FriendRequestRepo = require('../repo/friendRequest.repository');
const UserRepository = require('../repo/user.repository');

async function sendFriendRequest(senderId, receiverId) {
  if (senderId === receiverId) {
    throw { statusCode: 400, message: "Không thể tự gửi lời mời cho chính mình" };
  }

  const receiverExists = await UserRepository.getUserById(receiverId);
  if (!receiverExists) {
    throw { statusCode: 404, message: "Không tìm thấy người dùng này" };
  } else {
    if (receiverExists.friends.includes(senderId)) {
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
};