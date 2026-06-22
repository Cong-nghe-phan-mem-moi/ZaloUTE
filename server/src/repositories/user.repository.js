const User = require("../models/user.model");

async function createUser(userData) {
  const user = new User(userData);
  return await user.save();
}

async function deleteUserById(userId) {
  return await User.deleteOne({ _id: userId });
}

async function linkAccountToUser(userId, accountId) {
  return await User.findByIdAndUpdate(
    userId,
    { account: accountId },
    { returnDocument: "after" },
  );
}

async function findById(userId) {
  return await User.findById(userId);
}

async function updateProfile(userId, updateData) {
  // Remove sensitive fields that shouldn't be updated through edit profile
  delete updateData.account;
  delete updateData.email;

  const updatedUser = await User.findByIdAndUpdate(userId, updateData, {
    returnDocument: "after",
    runValidators: true,
  });

  return updatedUser;
}

async function getUserById(userId) {
  try {
    console.log("getUserById - userId:", userId);
    const user = await User.findById(userId)
      .populate("account")
      .populate("friends", "fullName avatar isOnline lastActive")
      .populate("following", "fullName avatar isOnline lastActive")
      .populate("followers", "fullName avatar isOnline lastActive")
      .populate("blockedUsers", "fullName avatar");
    console.log("getUserById - user found:", !!user, user?.fullName);
    return user;
  } catch (error) {
    console.error("getUserById error:", error);
    throw error;
  }
}

async function getProfileByRole(userId, role) {
  const user = await User.findById(userId).populate("account");

  if (!user) {
    return null;
  }

  // Check if user has the required role from account
  if (!user.account || user.account.role !== role) {
    return null;
  }

  return user;
} 


async function countUsers(condition) {
  return await User.countDocuments(condition);
}

async function getOtherUserById(userId) {
  return await User.findById(userId)
    .select("-account")
    .populate("friends", "fullName avatar isOnline lastActive")
    .populate("following", "fullName avatar isOnline lastActive")
    .populate("followers", "fullName avatar isOnline lastActive")
    .populate("blockedUsers", "fullName avatar");
}

async function blockUser(userId, blockedUserId) {
  return await User.updateOne(
    { _id: userId },
    { $addToSet: { blockedUsers: blockedUserId }, $pull: { friends: blockedUserId } },
  );
}

async function unblockUser(userId, blockedUserId) {
  return await User.updateOne(
    { _id: userId },
    { $pull: { blockedUsers: blockedUserId } },
  );
}

async function findUsersBlocking(userId) {
  return await User.find({ blockedUsers: userId }).select("_id");
}

async function removeUsersFromFriends(userId, otherUserId) {
  return await Promise.all([
    User.updateOne({ _id: userId }, { $pull: { friends: otherUserId } }),
    User.updateOne({ _id: otherUserId }, { $pull: { friends: userId } }),
  ]);
}

async function addFriend(userId, friendId) {
  return await User.updateOne(
    { _id: userId },
    { $addToSet: { friends: friendId } },
  );
}

async function removeFriend(userId, friendId) {
  return await User.updateOne(
    { _id: userId },
    { $pull: { friends: friendId } },
  );
}

async function setUserOffline(userId, updateData) {
  return await User.findByIdAndUpdate(userId, updateData, {
    returnDocument: "after",
    runValidators: true,
  });
}

async function searchUsers({keyword, limit = 10, myId}) {
  return await User.find({
    searchName: { $regex: keyword, $options: "i"},
    _id: { $ne: myId },
  })
  .select("-account")
  .limit(limit)
  .lean();
}

async function countSearchUsers({keyword, myId}) {
  return await User.countDocuments({
    searchName: { $regex: keyword, $options: "i"},
    _id: { $ne: myId },
  });
}

module.exports = {
  createUser,
  deleteUserById,
  linkAccountToUser,
  findById,
  updateProfile,
  getUserById,
  getProfileByRole,
  countUsers,
  getOtherUserById,
  addFriend,
  removeFriend,
  setUserOffline,
  searchUsers,
  countSearchUsers,
  blockUser,
  unblockUser,
  findUsersBlocking,
  removeUsersFromFriends,
};
