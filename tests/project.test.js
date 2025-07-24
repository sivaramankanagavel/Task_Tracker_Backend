const request = require('supertest');
const app = require('../app');
const User = require('../models/User');
const Project = require('../models/Project');
const { setupDB } = require('./testSetup');

setupDB('project-testing');

describe('Project API', () => {
  let testUser;
  let authToken;

  beforeAll(async () => {
    testUser = await User.create({
      name: 'Test User',
      email: 'test@example.com',
      role: 'TASK_CREATOR'
    });
    
    authToken = 'valid-test-token';
  });

  describe('POST /api/projects', () => {
    it('should create a new project', async () => {
      const newProject = {
        name: 'Test Project',
        description: 'Test Description'
      };

      const res = await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${authToken}`)
        .send(newProject);
      
      expect(res.statusCode).toEqual(201);
      expect(res.body.name).toBe('Test Project');
    });
  });
});