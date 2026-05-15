const UserRepository = require('../repo/user.repository');
const AuthRepository = require('../repo/auth.repository');

const buildProfileResponse = (user) => ({
  userId: user._id,
  fullName: user.fullName,
  email: user.account?.email,
  phone: user.phone,
  avatar: user.avatar,
  bio: user.bio,
  dateOfBirth: user.dateOfBirth,
  gender: user.gender,
  address: user.address,
  isOnline: user.isOnline,
  lastActive: user.lastActive,
  friendsCount: user.friends?.length || 0,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
});



async function editProfile(userId, updateData) {
  try {
    // Check if user exists
    const user = await UserRepository.getUserById(userId);
    if (!user) {
      throw {
        statusCode: 404,
        code: 'USER_NOT_FOUND',
        message: 'User not found',
      };
    }

    if (updateData.email) {
      if (!user.account) {
        throw {
          statusCode: 400,
          code: 'ACCOUNT_NOT_FOUND',
          message: 'Account not found',
        };
      }

      const normalizedEmail = updateData.email.trim().toLowerCase();
      const existingAccount = await AuthRepository.findAccountByEmail(normalizedEmail);
      if (
        existingAccount &&
        existingAccount._id.toString() !== user.account._id.toString()
      ) {
        throw {
          statusCode: 400,
          code: 'EMAIL_ALREADY_IN_USE',
          message: 'Email is already in use by another user',
        };
      }

      if (normalizedEmail !== user.account.email) {
        await AuthRepository.updateAccountEmail(user.account._id, normalizedEmail);
      }

      delete updateData.email;
    }

    if (Object.keys(updateData).length > 0) {
      await UserRepository.updateProfile(userId, updateData);
    }

    const updatedUser = await UserRepository.getUserById(userId);
    if (!updatedUser) {
      throw {
        statusCode: 500,
        code: 'UPDATE_FAILED',
        message: 'Failed to update user profile',
      };
    }

    return {
      success: true,
      message: 'Profile updated successfully',
      data: buildProfileResponse(updatedUser),
    };
  } catch (error) {
    throw error;
  }
}

async function getUserProfile(userId) {
  try {
    const user = await UserRepository.getUserById(userId);
    if (!user) {
      throw {
        statusCode: 404,
        code: 'USER_NOT_FOUND',
        message: 'User not found',
      };
    }

    return {
      success: true,
      data: buildProfileResponse(user),
    };
  } catch (error) {
    console.error('getUserProfile error:', error);
    throw error;
  }
}

async function getUserProfileByRole(userId, role) {
  try {
    const user = await UserRepository.getProfileByRole(userId, role);
    if (!user) {
      throw {
        statusCode: 403,
        code: 'FORBIDDEN',
        message: 'You do not have permission to access this resource',
      };
    }

    return {
      success: true,
      data: buildProfileResponse(user),
    };
  } catch (error) {
    throw error;
  }
}

module.exports = {
  editProfile,
  getUserProfile,
  getUserProfileByRole,
};
