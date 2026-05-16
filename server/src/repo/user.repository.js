const User = require("../models/user.model");

async function createUser(userData) {
  return await User.create(userData);
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

// Hàm này GIỮ LẠI try...catch vì catch có xử lý logic (console.error)
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

module.exports = {
  createUser,
  deleteUserById,
  linkAccountToUser,
  findById,
  updateProfile,
  getUserById,
  getProfileByRole,
};