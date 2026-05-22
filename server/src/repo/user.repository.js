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
    { returnDocument: "after" } // Mongoose v6+ dùng new: true hoặc returnDocument
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
    const user = await User.findById(userId).populate("account");
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

async function findUsers(condition, skip, limit) {
  return await User.find(condition)
    .skip(skip)
    .limit(limit)
    .select("id fullName avatar friends")
}

async function countUsers(condition) {
  return await User.countDocuments(condition);
}

async function getOtherUserById(userId) {
  return await User.findById(userId).select("-account");
}


async function addFriend(userId, friendId) {
  return await User.updateOne(
    { _id: userId},
    { $addToSet: { friends: friendId } }
  )
}

async function setUserOffline(userId, updateData) {
  return await User.findByIdAndUpdate(userId, updateData, {
    returnDocument: "after",
    runValidators: true,
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
  findUsers,
  countUsers,
  getOtherUserById,
  addFriend,
  setUserOffline
};
