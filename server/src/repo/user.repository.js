const User = require("../models/user.model");
const Account = require("../models/account.model");

async function createUser(userData) {
  try {
    return await User.create(userData);
  } catch (error) {
    throw error;
  }
}

async function deleteUserById(userId) {
  try {
    return await User.deleteOne({ _id: userId });
  } catch (error) {
    throw error;
  }
}

async function linkAccountToUser(userId, accountId) {
  try {
    return await User.findByIdAndUpdate(
      userId,
      { account: accountId },
      { returnDocument: "after" },
    );
  } catch (error) {
    throw error;
  }
}

async function findById(userId) {
  try {
    return await User.findById(userId);
  } catch (error) {
    throw error;
  }
}

async function updateProfile(userId, updateData) {
  try {
    // Remove sensitive fields that shouldn't be updated through edit profile
    delete updateData.account;
    delete updateData.email;

    const updatedUser = await User.findByIdAndUpdate(userId, updateData, {
      returnDocument: "after",
      runValidators: true,
    });

    return updatedUser;
  } catch (error) {
    throw error;
  }
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
  try {
    const user = await User.findById(userId).populate("account");

    if (!user) {
      return null;
    }

    // Check if user has the required role from account
    if (!user.account || user.account.role !== role) {
      return null;
    }

    return user;
  } catch (error) {
    throw error;
  }
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
