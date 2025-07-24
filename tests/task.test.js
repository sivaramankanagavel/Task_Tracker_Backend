const request = require('supertest');
const app = require('../app');
const User = require('../models/User');
const Project = require('../models/Project');
const Task = require('../models/Task');
const { setupDB } = require('./testSetup');

setupDB('task-testing');

describe('Task API', () => {
  let testUser;
  let testProject;
  let authToken;

  beforeAll(async () => {
    testUser = await User.create({
      name: 'Test User',
      email: 'test@example.com',
      role: 'TASK_CREATOR'
    });

    testProject = await Project.create({
      name: 'Test Project',
      description: 'Test Description',
      ownerId: testUser._id
    });
    
    authToken = 'valid-test-token';
  });

  describe('POST /api/tasks', () => {
    it('should create a new task', async () => {
      const newTask = {
        description: 'Test Task',
        dueDate: new Date(Date.now() + 86400000),
        status: 'NOT_STARTED',
        projectId: testProject._id,
        assigneeId: testUser._id
      };

      const res = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .send(newTask);
      
      expect(res.statusCode).toEqual(201);
      expect(res.body.description).toBe('Test Task');
    });
  });
});