const catchAsync = require('../utils/catchAsync');
const projectService = require('../services/projectService');

const getAllProjects = catchAsync(async (req, res) => {
  const projects = await projectService.getUserProjects(req.user._id);
  res.json(projects);
});

const getProjectById = catchAsync(async (req, res) => {
  const project = await projectService.getProjectById(req.params.id);
  res.json(project);
});

const createProject = catchAsync(async (req, res) => {
  const project = await projectService.createProject({
    ...req.body,
    ownerId: req.user._id
  });
  res.status(201).json(project);
});

const updateProject = catchAsync(async (req, res) => {
  const project = await projectService.updateProject(req.params.id, req.body);
  res.json(project);
});

const deleteProject = catchAsync(async (req, res) => {
  await projectService.deleteProject(req.params.id);
  res.status(204).json();
});

const addMembers = catchAsync(async (req, res) => {
  const project = await projectService.addMembers(req.params.id, req.body.userIds);
  res.json(project);
});

const removeMember = catchAsync(async (req, res) => {
  const project = await projectService.removeMember(req.params.id, req.params.userId);
  res.json(project);
});

module.exports = {
  getAllProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProject,
  addMembers,
  removeMember
};