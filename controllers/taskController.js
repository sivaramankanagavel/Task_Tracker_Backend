const catchAsync = require("../utils/catchAsync");
const taskService = require("../services/taskService");

const getAllTasks = catchAsync(async (req, res) => {
  const tasks = await taskService.getAllTasks();
  res.json(tasks);
});

const getTaskById = catchAsync(async (req, res) => {
  const task = await taskService.getTaskById(req.params.id);
  res.json(task);
});

const createTask = catchAsync(async (req, res) => {
  const task = await taskService.createTask({
    ...req.body,
    ownerId: req.user._id,
  });
  res.status(201).json(task);
});

const updateTask = catchAsync(async (req, res) => {
  const task = await taskService.updateTask(
    req.params.id,
    req.body,
    req.user._id
  );

  res.json({
    status: "success",
    data: {
      task,
    },
  });
});

const deleteTask = catchAsync(async (req, res) => {
  await taskService.deleteTask(req.params.id, req.user._id);
  res.status(204).send();
});

const getTasksByProject = catchAsync(async (req, res) => {
  const tasks = await taskService.getTasksByProject(req.params.projectId);
  res.json(tasks);
});

const getTasksByAssignee = catchAsync(async (req, res) => {
  const tasks = await taskService.getTasksByAssignee(req.params.userId);
  res.json(tasks);
});

module.exports = {
  getAllTasks,
  getTaskById,
  createTask,
  updateTask,
  deleteTask,
  getTasksByProject,
  getTasksByAssignee,
};