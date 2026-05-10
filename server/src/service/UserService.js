const UserRepository = require('../repo/UserRepository');

class UserService {
  async editProfile(userId, updateData) {
    try {
      // Check if user exists
      const user = await UserRepository.findById(userId);
      if (!user) {
        throw {
          statusCode: 404,
          code: 'USER_NOT_FOUND',
          message: 'User not found',
        };
      }

      // Check if email is already in use by another user
      if (updateData.email) {
        const emailExists = await UserRepository.emailExists(updateData.email, userId);
        if (emailExists) {
          throw {
            statusCode: 400,
            code: 'EMAIL_ALREADY_IN_USE',
            message: 'Email is already in use by another user',
          };
        }
      }

      // Update the user profile
      const updatedUser = await UserRepository.updateProfile(userId, updateData);

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
        data: {
          userId: updatedUser._id,
          fullName: updatedUser.fullName,
          email: updatedUser.email,
          phone: updatedUser.phone,
          avatar: updatedUser.avatar,
          bio: updatedUser.bio,
          dateOfBirth: updatedUser.dateOfBirth,
          gender: updatedUser.gender,
          address: updatedUser.address,
        },
      };
    } catch (error) {
      throw error;
    }
  }

  async getUserProfile(userId) {
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
        data: {
          userId: user._id,
          fullName: user.fullName,
          email: user.email,
          phone: user.phone,
          avatar: user.avatar,
          bio: user.bio,
          dateOfBirth: user.dateOfBirth,
          gender: user.gender,
          address: user.address,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        },
      };
    } catch (error) {
      console.error('getUserProfile error:', error);
      throw error;
    }
  }

  async getUserProfileByRole(userId, role) {
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
        data: {
          userId: user._id,
          fullName: user.fullName,
          email: user.email,
          phone: user.phone,
          avatar: user.avatar,
          bio: user.bio,
          dateOfBirth: user.dateOfBirth,
          gender: user.gender,
          address: user.address,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        },
      };
    } catch (error) {
      throw error;
    }
  }
}

module.exports = new UserService();
