const catchAsync = require('../utils/catchAsync');
const userService = require('../services/userService');

const getAllUsers = catchAsync(async (req, res) => {
  const users = await userService.getAllUsers();
  res.json(users);
});

const getUserById = catchAsync(async (req, res) => {
  const user = await userService.getUserById(req.params.id);
  res.json(user);
});

const createUser = catchAsync(async (req, res) => {
  const user = await userService.createUser(req.body);
  res.status(201).json(user);
});

const updateUser = catchAsync(async (req, res) => {
  const user = await userService.updateUser(req.params.id, req.body);
  res.json(user);
});

const deleteUser = catchAsync(async (req, res) => {
  await userService.deleteUser(req.params.id);
  res.status(204).json();
});

module.exports = {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser
};