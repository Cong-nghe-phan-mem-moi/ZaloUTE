const User = require('../models/User');

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
      delete updateData.role;

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
      return await User.findById(userId);
    } catch (error) {
      throw error;
    }
  }

  async getProfileByRole(userId, role) {
    try {
      const user = await User.findById(userId);
      
      if (!user) {
        return null;
      }

      // Check if user has the required role
      if (user.role !== role) {
        return null;
      }

      return user;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = new UserRepository();
