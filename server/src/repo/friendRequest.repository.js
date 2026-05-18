const FriendRequest = require('../models/friendRequest.model');

async function checkExistingRequest(userA, userB) {
  return await FriendRequest.findOne({
    $or: [
      { sender: userA, receiver: userB, status: 'pending' },
      { sender: userB, receiver: userA, status: 'pending' }
    ]
  });
}

async function createRequest(senderId, receiverId) {
  return await FriendRequest.create({
    sender: senderId,
    receiver: receiverId,
    status: 'pending'
  });
}

async function findPendingRequestBetweenUsers(userA, userB) {
  return await FriendRequest.findOne({
    $or: [
      { sender: userA, receiver: userB, status: 'pending' },
      { sender: userB, receiver: userA, status: 'pending' }
    ]
  });
}


module.exports = {
  checkExistingRequest,
  createRequest,
  findPendingRequestBetweenUsers,
};