const request = require('supertest');
const app = require('../app');
const User = require('../models/User');
const { setupDB } = require('./testSetup');

setupDB('user-testing');

describe('User API', () => {
  let testUser;
  let authToken;

  beforeAll(async () => {
    testUser = await User.create({
      name: 'Admin User',
      email: 'admin@example.com',
      role: 'ADMIN'
    });
    
    authToken = 'valid-test-token';
  });

  describe('GET /api/users', () => {
    it('should fetch all users', async () => {
      const res = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${authToken}`);
      
      expect(res.statusCode).toEqual(200);
      expect(res.body).toBeInstanceOf(Array);
    });
  });

  describe('POST /api/users', () => {
    it('should create a new user', async () => {
      const newUser = {
        name: 'New User',
        email: 'new@example.com',
        role: 'READ_ONLY_USER'
      };

      const res = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${authToken}`)
        .send(newUser);
      
      expect(res.statusCode).toEqual(201);
      expect(res.body.email).toBe('new@example.com');
    });
  });
});