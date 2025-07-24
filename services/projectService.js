const Project = require("../models/Project");
const AppError = require("../utils/appError");

class ProjectService {
  async getUserProjects(userId) {
    try {
      return await Project.find({
        $or: [{ ownerId: userId }, { members: userId }],
      }).populate("members ownerId");
    } catch (error) {
      throw new AppError("Failed to fetch projects", 500);
    }
  }

  async getProjectById(id) {
    const project = await Project.findById(id).populate("members ownerId");
    if (!project) {
      throw new AppError("Project not found", 404);
    }
    return project;
  }

  async createProject(projectData) {
    try {
      const project = new Project(projectData);
      return await project.save();
    } catch (error) {
      throw new AppError("Failed to create project", 400);
    }
  }

  async updateProject(id, updateData) {
    const project = await Project.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });
    if (!project) {
      throw new AppError("Project not found", 404);
    }
    return project;
  }

  async deleteProject(id) {
    const project = await Project.findByIdAndDelete(id);
    if (!project) {
      throw new AppError("Project not found", 404);
    }
    return project;
  }

  async addMembers(projectId, userIds) {
    const project = await Project.findById(projectId);
    if (!project) {
      throw new AppError("Project not found", 404);
    }
    project.members.push(...userIds);
    await project.save();
    return project;
  }

  async removeMember(projectId, userId) {
    const project = await Project.findById(projectId);
    if (!project) {
      throw new AppError("Project not found", 404);
    }
    project.members = project.members.filter(
      (member) => member.toString() !== userId
    );
    await project.save();
    return project;
  }
}

module.exports = new ProjectService();