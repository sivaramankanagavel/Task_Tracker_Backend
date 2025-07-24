const User = require('../models/User');
const AppError = require('../utils/appError');

class UserService {
  async getAllUsers() {
    try {
      return await User.find();
    } catch (error) {
      throw new AppError('Failed to fetch users', 500);
    }
  }

  async getUserById(id) {
    const user = await User.findById(id);
    if (!user) {
      throw new AppError('User not found', 404);
    }
    return user;
  }

  async createUser(userData) {
    try {
      const user = new User(userData);
      return await user.save();
    } catch (error) {
      throw new AppError('Failed to create user', 400);
    }
  }

  async updateUser(id, updateData) {
    const user = await User.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true
    });
    if (!user) {
      throw new AppError('User not found', 404);
    }
    return user;
  }

  async deleteUser(id) {
    const user = await User.findByIdAndDelete(id);
    if (!user) {
      throw new AppError('User not found', 404);
    }
    return user;
  }
}

module.exports = new UserService();