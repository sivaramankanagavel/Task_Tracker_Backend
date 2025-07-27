const request = require('supertest');
const app = require('../app'); // Ensure this points to your Express app
const taskService = require('../services/taskService'); // This will be the mocked version
const AppError = require('../utils/appError');
const mongoose = require('mongoose'); // Import mongoose for ObjectId

// Mock the entire taskService module
jest.mock('../services/taskService', () => ({
  getAllTasks: jest.fn(),
  getTaskById: jest.fn(),
  createTask: jest.fn(),
  updateTask: jest.fn(),
  deleteTask: jest.fn(),
  getTasksByProject: jest.fn(),
  getTasksByAssignee: jest.fn(),
}));

describe('Task API', () => {
  // Define mock data
  const mockUserId = '60d0fe4f3a76a3b4b8b8b8b8'; // Must match mockUser._id in setupTests.js
  const mockAssigneeId = '60d0fe4f3a76a3b4b8b8b8b9'; // Must match mockAdminUser._id in setupTests.js (or another mock user)
  const mockProjectId = '60d0fe4f3a76a3b4b8b8b8c0';
  const mockTaskId = 'task1'; // Using a string for simplicity in tests

  const mockTask = {
    _id: mockTaskId,
    description: 'Test Task',
    dueDate: new Date().toISOString(),
    status: 'NOT_STARTED',
    ownerId: mockUserId,
    projectId: mockProjectId,
    assigneeId: mockAssigneeId,
    createdAt: new Date().toISOString(),
  };

  const mockTasks = [
    mockTask,
    {
      _id: 'task2',
      description: 'Another Task',
      dueDate: new Date().toISOString(),
      status: 'IN_PROGRESS',
      ownerId: mockUserId,
      projectId: mockProjectId,
      assigneeId: mockUserId,
      createdAt: new Date().toISOString(),
    },
  ];

  const mockToken = 'valid_auth_token'; // Token for mockUserId from setupTests.js
  const mockAssigneeToken = 'valid_admin_token'; // Assuming mockAssigneeId uses admin token for simplicity in tests

  beforeEach(() => {
    jest.clearAllMocks(); // Clear mocks before each test

    // Default mock implementations for taskService
    taskService.getAllTasks.mockResolvedValue(mockTasks);
    taskService.getTaskById.mockResolvedValue(mockTask);
    taskService.createTask.mockResolvedValue(mockTask);
    taskService.updateTask.mockResolvedValue({ ...mockTask, status: 'IN_PROGRESS' });
    taskService.deleteTask.mockResolvedValue(null); // delete usually returns void or null
    taskService.getTasksByProject.mockResolvedValue([mockTask]);
    taskService.getTasksByAssignee.mockResolvedValue([mockTask]);
  });

  describe('GET /api/v1/tasks', () => {
    it('should get all tasks', async () => {
      const res = await request(app)
        .get('/api/v1/tasks')
        .set('Authorization', `Bearer ${mockToken}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body).toEqual(mockTasks);
      expect(taskService.getAllTasks).toHaveBeenCalledTimes(1);
    });

    it('should return 500 if fetching tasks fails', async () => {
      taskService.getAllTasks.mockRejectedValue(new AppError('Failed to fetch tasks', 500));

      const res = await request(app)
        .get('/api/v1/tasks')
        .set('Authorization', `Bearer ${mockToken}`);

      expect(res.statusCode).toEqual(500);
      expect(res.body.status).toEqual('error');
      expect(res.body.message).toEqual('Failed to fetch tasks');
      expect(taskService.getAllTasks).toHaveBeenCalledTimes(1);
    });
  });

  describe('GET /api/v1/tasks/:id', () => {
    it('should get a task by ID', async () => {
      const res = await request(app)
        .get(`/api/v1/tasks/${mockTaskId}`)
        .set('Authorization', `Bearer ${mockToken}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body).toEqual(mockTask);
      expect(taskService.getTaskById).toHaveBeenCalledWith(mockTaskId);
    });

    it('should return 404 if task not found', async () => {
      taskService.getTaskById.mockRejectedValue(new AppError('Task not found', 404));

      const res = await request(app)
        .get(`/api/v1/tasks/nonexistentid`)
        .set('Authorization', `Bearer ${mockToken}`);

      expect(res.statusCode).toEqual(404);
      expect(res.body.status).toEqual('fail');
      expect(res.body.message).toEqual('Task not found');
      expect(taskService.getTaskById).toHaveBeenCalledWith('nonexistentid');
    });
  });

  describe('POST /api/v1/tasks', () => {
    const newTaskData = {
      description: 'New Task',
      dueDate: new Date().toISOString(),
      projectId: mockProjectId,
      assigneeId: mockAssigneeId,
    };
    const createdTask = {
      _id: 'newTaskId',
      ...newTaskData,
      ownerId: mockUserId, // ownerId comes from req.user._id
      status: 'NOT_STARTED',
      createdAt: new Date().toISOString(),
    };

    it('should create a new task', async () => {
      taskService.createTask.mockResolvedValue(createdTask);

      const res = await request(app)
        .post('/api/v1/tasks')
        .set('Authorization', `Bearer ${mockToken}`)
        .send(newTaskData);

      expect(res.statusCode).toEqual(201);
      expect(res.body).toEqual(createdTask);
      // Ensure ownerId is passed correctly from req.user._id
      expect(taskService.createTask).toHaveBeenCalledWith({ ...newTaskData, ownerId: mockUserId });
    });

    it('should return 400 if task creation fails', async () => {
      taskService.createTask.mockRejectedValue(new AppError('Failed to create task: Missing fields', 400));

      const res = await request(app)
        .post('/api/v1/tasks')
        .set('Authorization', `Bearer ${mockToken}`)
        .send({}); // Send empty data to trigger validation error

      expect(res.statusCode).toEqual(400);
      expect(res.body.status).toEqual('fail');
      expect(res.body.message).toEqual('Failed to create task: Missing fields');
      // Expect it to be called with whatever was sent + ownerId
      expect(taskService.createTask).toHaveBeenCalledWith({ ownerId: mockUserId });
    });
  });

  describe('PUT /api/v1/tasks/:id', () => {
    const updateData = { status: 'IN_PROGRESS' };
    const updatedTask = { ...mockTask, ...updateData };

    it('should update an existing task by owner', async () => {
      taskService.updateTask.mockResolvedValue(updatedTask);

      const res = await request(app)
        .put(`/api/v1/tasks/${mockTaskId}`)
        .set('Authorization', `Bearer ${mockToken}`) // User is owner
        .send(updateData);

      expect(res.statusCode).toEqual(200);
      expect(res.body.data.task).toEqual(updatedTask);
      expect(taskService.updateTask).toHaveBeenCalledWith(mockTaskId, updateData, mockUserId);
    });

    it('should update an existing task by assignee', async () => {
      taskService.updateTask.mockResolvedValue(updatedTask);

      const res = await request(app)
        .put(`/api/v1/tasks/${mockTaskId}`)
        .set('Authorization', `Bearer ${mockAssigneeToken}`) // User is assignee
        .send(updateData);

      expect(res.statusCode).toEqual(200);
      expect(res.body.data.task).toEqual(updatedTask);
      expect(taskService.updateTask).toHaveBeenCalledWith(mockTaskId, updateData, mockAssigneeId);
    });

    it('should return 403 if not authorized to update task', async () => {
      // Simulate a user who is neither owner nor assignee
      const unauthorizedUserId = '60d0fe4f3a76a3b4b8b8b8f0';
      const unauthorizedToken = 'unauthorized_token'; // Add this to setupTests.js if needed

      // Temporarily mock authMiddleware.protect for this specific test
      // to set an unauthorized user.
      const originalProtect = require('../middleware/authMiddleware').protect;
      require('../middleware/authMiddleware').protect.mockImplementationOnce((req, res, next) => {
        req.user = { _id: unauthorizedUserId, role: 'USER' };
        next();
      });

      taskService.updateTask.mockRejectedValue(new AppError('Not authorized to update this task', 403));

      const res = await request(app)
        .put(`/api/v1/tasks/${mockTaskId}`)
        .set('Authorization', `Bearer ${unauthorizedToken}`)
        .send(updateData);

      expect(res.statusCode).toEqual(403);
      expect(res.body.status).toEqual('fail');
      expect(res.body.message).toEqual('Not authorized to update this task');
      expect(taskService.updateTask).toHaveBeenCalledWith(mockTaskId, updateData, unauthorizedUserId);

      // Restore original mock after test
      require('../middleware/authMiddleware').protect = originalProtect;
    });

    it('should return 404 if task to update not found', async () => {
      taskService.updateTask.mockRejectedValue(new AppError('Task not found', 404));

      const res = await request(app)
        .put(`/api/v1/tasks/nonexistentid`)
        .set('Authorization', `Bearer ${mockToken}`)
        .send(updateData);

      expect(res.statusCode).toEqual(404);
      expect(res.body.status).toEqual('fail');
      expect(res.body.message).toEqual('Task not found');
      expect(taskService.updateTask).toHaveBeenCalledWith('nonexistentid', updateData, mockUserId);
    });
  });

  describe('DELETE /api/v1/tasks/:id', () => {
    it('should delete a task by owner', async () => {
      taskService.deleteTask.mockResolvedValue(null);

      const res = await request(app)
        .delete(`/api/v1/tasks/${mockTaskId}`)
        .set('Authorization', `Bearer ${mockToken}`); // User is owner

      expect(res.statusCode).toEqual(204);
      expect(res.body).toEqual({}); // 204 No Content typically has an empty body
      expect(taskService.deleteTask).toHaveBeenCalledWith(mockTaskId, mockUserId);
    });

    it('should return 403 if not authorized to delete task', async () => {
      // Simulate a user who is not the owner
      const unauthorizedUserId = '60d0fe4f3a76a3b4b8b8b8f0';
      const unauthorizedToken = 'unauthorized_token'; // Add this to setupTests.js if needed

      // Temporarily mock authMiddleware.protect for this specific test
      const originalProtect = require('../middleware/authMiddleware').protect;
      require('../middleware/authMiddleware').protect.mockImplementationOnce((req, res, next) => {
        req.user = { _id: unauthorizedUserId, role: 'USER' };
        next();
      });

      taskService.deleteTask.mockRejectedValue(new AppError('Not authorized to delete this task', 403));

      const res = await request(app)
        .delete(`/api/v1/tasks/${mockTaskId}`)
        .set('Authorization', `Bearer ${unauthorizedToken}`);

      expect(res.statusCode).toEqual(403);
      expect(res.body.status).toEqual('fail');
      expect(res.body.message).toEqual('Not authorized to delete this task');
      expect(taskService.deleteTask).toHaveBeenCalledWith(mockTaskId, unauthorizedUserId);

      // Restore original mock after test
      require('../middleware/authMiddleware').protect = originalProtect;
    });

    it('should return 404 if task to delete not found', async () => {
      taskService.deleteTask.mockRejectedValue(new AppError('Task not found', 404));

      const res = await request(app)
        .delete(`/api/v1/tasks/nonexistentid`)
        .set('Authorization', `Bearer ${mockToken}`);

      expect(res.statusCode).toEqual(404);
      expect(res.body.status).toEqual('fail');
      expect(res.body.message).toEqual('Task not found');
      expect(taskService.deleteTask).toHaveBeenCalledWith('nonexistentid', mockUserId);
    });
  });

  describe('GET /api/v1/tasks/project/:projectId', () => {
    it('should get tasks by project ID', async () => {
      const res = await request(app)
        .get(`/api/v1/tasks/project/${mockProjectId}`)
        .set('Authorization', `Bearer ${mockToken}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body).toEqual([mockTask]);
      expect(taskService.getTasksByProject).toHaveBeenCalledWith(mockProjectId);
    });

    it('should return 500 if fetching tasks by project fails', async () => {
      taskService.getTasksByProject.mockRejectedValue(new AppError('Failed to fetch tasks by project', 500));

      const res = await request(app)
        .get(`/api/v1/tasks/project/${mockProjectId}`)
        .set('Authorization', `Bearer ${mockToken}`);

      expect(res.statusCode).toEqual(500);
      expect(res.body.status).toEqual('error');
      expect(res.body.message).toEqual('Failed to fetch tasks by project');
      expect(taskService.getTasksByProject).toHaveBeenCalledWith(mockProjectId);
    });
  });

  describe('GET /api/v1/tasks/user/:userId', () => {
    it('should get tasks by assignee ID', async () => {
      const res = await request(app)
        .get(`/api/v1/tasks/user/${mockAssigneeId}`)
        .set('Authorization', `Bearer ${mockToken}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body).toEqual([mockTask]);
      expect(taskService.getTasksByAssignee).toHaveBeenCalledWith(mockAssigneeId);
    });

    it('should return 500 if fetching tasks by assignee fails', async () => {
      taskService.getTasksByAssignee.mockRejectedValue(new AppError('Failed to fetch tasks by assignee', 500));

      const res = await request(app)
        .get(`/api/v1/tasks/user/${mockAssigneeId}`)
        .set('Authorization', `Bearer ${mockToken}`);

      expect(res.statusCode).toEqual(500);
      expect(res.body.status).toEqual('error');
      expect(res.body.message).toEqual('Failed to fetch tasks by assignee');
      expect(taskService.getTasksByAssignee).toHaveBeenCalledWith(mockAssigneeId);
    });
  });
});
