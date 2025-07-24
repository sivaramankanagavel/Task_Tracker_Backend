const request = require('supertest');
const app = require('../app');
const User = require('../models/User');
const { setupDB } = require('./testSetup');

setupDB('auth-testing');

describe('Auth API', () => {
  let testUser;

  beforeEach(async () => {
    testUser = await User.create({
      name: 'Test User',
      email: 'test@example.com',
      role: 'READ_ONLY_USER'
    });
  });

  describe('POST /api/auth/login/email', () => {
    it('should login with valid credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login/email')
        .send({ email: 'test@example.com', password: 'password123' });
      
      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('token');
      expect(res.body.data.user.email).toBe('test@example.com');
    });

    it('should reject invalid credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login/email')
        .send({ email: 'test@example.com', password: 'wrongpassword' });
      
      expect(res.statusCode).toEqual(401);
    });
  });
});