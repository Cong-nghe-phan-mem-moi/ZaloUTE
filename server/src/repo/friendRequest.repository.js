const FriendRequest = require("../models/friendRequest.model");

async function checkExistingRequest(userA, userB) {
  return await FriendRequest.findOne({
    $or: [
      { sender: userA, receiver: userB, status: "pending" },
      { sender: userB, receiver: userA, status: "pending" },
    ],
  });
}

async function findPendingRequestBetweenUsers(userA, userB) {
  return await FriendRequest.findOne({
    $or: [
      { sender: userA, receiver: userB, status: "pending" },
      { sender: userB, receiver: userA, status: "pending" },
    ],
  });
} 

async function findRequestBetweenUsers(userA, userB) {
  return await FriendRequest.findOne({
    $or: [
      { sender: userA, receiver: userB },
      { sender: userB, receiver: userA },
    ],
  });
}

async function findAcceptedRequestFromSenderToReceiver(senderId, receiverId) {
  return await FriendRequest.findOne({
    sender: senderId,
    receiver: receiverId,
    status: "accepted",
  });
}

async function deleteRequestBetweenUsers(userA, userB) {
  return await FriendRequest.deleteMany({
    $or: [
      { sender: userA, receiver: userB },
      { sender: userB, receiver: userA },
    ],
  });
}

async function getPendingRequestsByReceiver(receiverId) {
  return await FriendRequest.find({ receiver: receiverId, status: "pending" })
    .populate("sender", "fullName avatar isOnline lastActive")
    .sort({ createdAt: -1 });
}

async function getPendingRequestsBySender(senderId) {
  return await FriendRequest.find({ sender: senderId, status: "pending" })
    .populate("receiver", "fullName avatar isOnline lastActive")
    .sort({ createdAt: -1 });
}

async function createRequest(senderId, receiverId) {
  return await FriendRequest.create({
    sender: senderId,
    receiver: receiverId,
    status: "pending",
  });
}

async function updateRequestStatus(requestId, newStatus) {
  return await FriendRequest.findByIdAndUpdate(
    requestId,
    { status: newStatus },
    { returnDocument: "after" },
  );
}


async function findPendingRequestsInUserList(myId, foundUserIds){
  return await FriendRequest.find({
    status: "pending",
    $or: [
      { sender: myId, receiver: {$in: foundUserIds }},
      { receiver: myId, sender: {$in: foundUserIds }}
    ]
  }).lean();
}

module.exports = {
  checkExistingRequest,
  createRequest,
  findPendingRequestBetweenUsers,
  findRequestBetweenUsers,
  findAcceptedRequestFromSenderToReceiver,
  deleteRequestBetweenUsers,
  getPendingRequestsByReceiver,
  getPendingRequestsBySender,
  updateRequestStatus,
  findPendingRequestsInUserList
};
