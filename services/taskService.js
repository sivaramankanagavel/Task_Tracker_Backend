const Task = require("../models/Task");
const User = require("../models/User");
const AppError = require("../utils/appError");

class TaskService {
  async getAllTasks() {
    try {
      return await Task.find().populate("ownerId assigneeId projectId");
    } catch (error) {
      throw new AppError("Failed to fetch tasks", 500);
    }
  }

  async getTaskById(id) {
    const task = await Task.findById(id).populate(
      "ownerId assigneeId projectId"
    );
    if (!task) {
      throw new AppError("Task not found", 404);
    }
    return task;
  }

  async createTask(taskData) {
    try {
      const task = new Task(taskData);
      return await task.save();
    } catch (error) {
      throw new AppError("Failed to create task: " + error.message, 400);
    }
  }

  async updateTask(id, updateData, userId) {
    const task = await Task.findById(id);

    if (!task) {
      throw new AppError("Task not found", 404);
    }

    if ((await User.findById(userId)).role !== 'ADMIN') {
      throw new AppError("Not authorized to update this task", 403);
    }

    const allowedFields = ['description', 'dueDate', 'status', 'assigneeId', 'projectId', 'name'];
    if (Object.keys(updateData).length > 0) {
      Object.keys(updateData).forEach((key) => {
        if (!allowedFields.includes(key)) delete updateData[key];
      });
    }

    const updatedTask = await Task.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    }).populate("ownerId assigneeId projectId");

    return updatedTask;
  }

  async deleteTask(id, userId, role) {
    const task = await Task.findById(id);

    if (!task) {
      throw new AppError("Task not found", 404);
    }

    if ((await User.findById(userId)).role !== 'ADMIN') {
      throw new AppError("Not authorized to delete this task", 403);
    }

    await Task.findByIdAndDelete(id);
  }

  async getTasksByProject(projectId) {
    try {
      return await Task.find({ projectId }).populate("assigneeId ownerId");
    } catch (error) {
      throw new AppError("Failed to fetch tasks by project", 500);
    }
  }

  async getTasksByAssignee(userId) {
    try {
      return await Task.find({ assigneeId: userId }).populate("projectId ownerId");
    } catch (error) {
      throw new AppError("Failed to fetch tasks by assignee", 500);
    }
  }
}

module.exports = new TaskService();