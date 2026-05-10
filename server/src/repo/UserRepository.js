const User = require('../models/User');
const Account = require('../models/Account');

class UserRepository {
  async findById(userId) {
    try {
      return await User.findById(userId);
    } catch (error) {
      throw error;
    }
  }

  async findByEmail(email) {
    try {
      return await User.findOne({ email: email.toLowerCase() });
    } catch (error) {
      throw error;
    }
  }

  async updateProfile(userId, updateData) {
    try {
      // Remove sensitive fields that shouldn't be updated through edit profile
      delete updateData.account;

      const updatedUser = await User.findByIdAndUpdate(userId, updateData, {
        returnDocument: 'after',
        runValidators: true,
      });

      return updatedUser;
    } catch (error) {
      throw error;
    }
  }

  async emailExists(email, excludeUserId = null) {
    try {
      const query = { email: email.toLowerCase() };
      if (excludeUserId) {
        query._id = { $ne: excludeUserId };
      }
      return await User.findOne(query);
    } catch (error) {
      throw error;
    }
  }

  async getUserById(userId) {
    try {
      console.log('getUserById - userId:', userId);
      const user = await User.findById(userId).populate('account');
      console.log('getUserById - user found:', !!user, user?.fullName);
      return user;
    } catch (error) {
      console.error('getUserById error:', error);
      throw error;
    }
  }

  async getProfileByRole(userId, role) {
    try {
      const user = await User.findById(userId).populate('account');
      
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
}

module.exports = new UserRepository();
