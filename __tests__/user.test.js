const request = require('supertest');
const app = require('../app');
const userService = require('../services/userService');
const AppError = require('../utils/appError');

jest.mock('../services/userService', () => ({
  getAllUsers: jest.fn(),
  getUserById: jest.fn(),
  createUser: jest.fn(),
  updateUser: jest.fn(),
  deleteUser: jest.fn(),
}));

describe('User API', () => {
  // Define mock data
  const mockUserId = '60d0fe4f3a76a3b4b8b8b8b8';
  const mockAdminId = '60d0fe4f3a76a3b4b8b8b8b9';

  const mockUser = {
    _id: mockUserId,
    name: 'Test User',
    email: 'test@example.com',
    role: 'USER',
    emailVerified: true,
  };

  const mockAdminUser = {
    _id: mockAdminId,
    name: 'Admin User',
    email: 'admin@example.com',
    role: 'ADMIN',
    emailVerified: true,
  };

  const mockUsers = [mockUser, mockAdminUser];

  const mockToken = 'valid_auth_token';
  const mockAdminToken = 'valid_admin_token';

  beforeEach(() => {
    jest.clearAllMocks();
    userService.getAllUsers.mockResolvedValue(mockUsers);
    userService.getUserById.mockResolvedValue(mockUser);
    userService.createUser.mockResolvedValue(mockUser);
    userService.updateUser.mockResolvedValue({ ...mockUser, name: 'Updated User' });
    userService.deleteUser.mockResolvedValue(null);
  });

  describe('GET /api/v1/users', () => {
    it('should get all users for ADMIN role', async () => {
      const res = await request(app)
        .get('/api/v1/users')
        .set('Authorization', `Bearer ${mockAdminToken}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body).toEqual(mockUsers);
      expect(userService.getAllUsers).toHaveBeenCalledTimes(1);
    });

    it('should return 403 if non-ADMIN tries to get all users', async () => {
      const res = await request(app)
        .get('/api/v1/users')
        .set('Authorization', `Bearer ${mockToken}`);

      expect(res.statusCode).toEqual(403);
      expect(res.body.status).toEqual('fail');
      expect(res.body.message).toEqual('You do not have permission to perform this action');
      expect(userService.getAllUsers).not.toHaveBeenCalled();
    });

    it('should return 500 if fetching users fails', async () => {
      userService.getAllUsers.mockRejectedValue(new AppError('Failed to fetch users', 500));

      const res = await request(app)
        .get('/api/v1/users')
        .set('Authorization', `Bearer ${mockAdminToken}`);

      expect(res.statusCode).toEqual(500);
      expect(res.body.status).toEqual('error');
      expect(res.body.message).toEqual('Failed to fetch users');
      expect(userService.getAllUsers).toHaveBeenCalledTimes(1);
    });
  });

  describe('GET /api/v1/users/:id', () => {
    it('should get a user by ID', async () => {
      const res = await request(app)
        .get(`/api/v1/users/${mockUserId}`)
        .set('Authorization', `Bearer ${mockToken}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body).toEqual(mockUser);
      expect(userService.getUserById).toHaveBeenCalledWith(mockUserId);
    });

    it('should return 404 if user not found', async () => {
      userService.getUserById.mockRejectedValue(new AppError('User not found', 404));

      const res = await request(app)
        .get(`/api/v1/users/nonexistentid`)
        .set('Authorization', `Bearer ${mockToken}`);

      expect(res.statusCode).toEqual(404);
      expect(res.body.status).toEqual('fail');
      expect(res.body.message).toEqual('User not found');
      expect(userService.getUserById).toHaveBeenCalledWith('nonexistentid');
    });
  });

  describe('POST /api/v1/users', () => {
    const newUserData = {
      name: 'New User',
      email: 'newuser@example.com',
      role: 'USER',
    };
    const createdUser = {
      _id: 'newUserId',
      ...newUserData,
      createdAt: new Date().toISOString(),
    };

    it('should create a new user by ADMIN', async () => {
      userService.createUser.mockResolvedValue(createdUser);

      const res = await request(app)
        .post('/api/v1/users')
        .set('Authorization', `Bearer ${mockAdminToken}`)
        .send(newUserData);

      expect(res.statusCode).toEqual(201);
      expect(res.body).toEqual(createdUser);
      expect(userService.createUser).toHaveBeenCalledWith(newUserData);
    });

    it('should return 403 if non-ADMIN tries to create a user', async () => {
      const res = await request(app)
        .post('/api/v1/users')
        .set('Authorization', `Bearer ${mockToken}`)
        .send(newUserData);

      expect(res.statusCode).toEqual(403);
      expect(res.body.status).toEqual('fail');
      expect(res.body.message).toEqual('You do not have permission to perform this action');
      expect(userService.createUser).not.toHaveBeenCalled();
    });

    it('should return 400 if user creation fails', async () => {
      userService.createUser.mockRejectedValue(new AppError('Failed to create user: Missing fields', 400));

      const res = await request(app)
        .post('/api/v1/users')
        .set('Authorization', `Bearer ${mockAdminToken}`)
        .send({});

      expect(res.statusCode).toEqual(400);
      expect(res.body.status).toEqual('fail');
      expect(res.body.message).toEqual('Failed to create user: Missing fields');
      expect(userService.createUser).toHaveBeenCalledWith({});
    });
  });

  describe('PUT /api/v1/users/:id', () => {
    const updateData = { name: 'Updated Name', email: 'updated@example.com' };
    const updatedUser = { ...mockUser, ...updateData };

    it('should update an existing user', async () => {
      userService.updateUser.mockResolvedValue(updatedUser);

      const res = await request(app)
        .put(`/api/v1/users/${mockUserId}`)
        .set('Authorization', `Bearer ${mockToken}`)
        .send(updateData);

      expect(res.statusCode).toEqual(200);
      expect(res.body).toEqual(updatedUser);
      expect(userService.updateUser).toHaveBeenCalledWith(mockUserId, updateData);
    });

    it('should return 404 if user to update not found', async () => {
      userService.updateUser.mockRejectedValue(new AppError('User not found', 404));

      const res = await request(app)
        .put(`/api/v1/users/nonexistentid`)
        .set('Authorization', `Bearer ${mockToken}`)
        .send(updateData);

      expect(res.statusCode).toEqual(404);
      expect(res.body.status).toEqual('fail');
      expect(res.body.message).toEqual('User not found');
      expect(userService.updateUser).toHaveBeenCalledWith('nonexistentid', updateData);
    });
  });

  describe('DELETE /api/v1/users/:id', () => {
    it('should delete a user by ADMIN', async () => {
      userService.deleteUser.mockResolvedValue(null);

      const res = await request(app)
        .delete(`/api/v1/users/${mockUserId}`)
        .set('Authorization', `Bearer ${mockAdminToken}`);

      expect(res.statusCode).toEqual(204);
      expect(res.body).toEqual({});
      expect(userService.deleteUser).toHaveBeenCalledWith(mockUserId);
    });

    it('should return 403 if non-ADMIN tries to delete a user', async () => {
      const res = await request(app)
        .delete(`/api/v1/users/${mockUserId}`)
        .set('Authorization', `Bearer ${mockToken}`);

      expect(res.statusCode).toEqual(403);
      expect(res.body.status).toEqual('fail');
      expect(res.body.message).toEqual('You do not have permission to perform this action');
      expect(userService.deleteUser).not.toHaveBeenCalled();
    });

    it('should return 404 if user to delete not found', async () => {
      userService.deleteUser.mockRejectedValue(new AppError('User not found', 404));

      const res = await request(app)
        .delete(`/api/v1/users/nonexistentid`)
        .set('Authorization', `Bearer ${mockAdminToken}`);

      expect(res.statusCode).toEqual(404);
      expect(res.body.status).toEqual('fail');
      expect(res.body.message).toEqual('User not found');
      expect(userService.deleteUser).toHaveBeenCalledWith('nonexistentid');
    });
  });
});
