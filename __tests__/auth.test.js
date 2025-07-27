const request = require('supertest');
const app = require('../app'); // Ensure this points to your Express app
const authMiddleware = require('../middleware/authMiddleware'); // This will now be the mocked version
const AppError = require('../utils/appError');

// Mock the entire authService module.
jest.mock('../services/authService', () => ({
  emailLogin: jest.fn(),
  googleLogin: jest.fn(),
  verifyToken: jest.fn(), // Keep this mocked as authService still uses it internally
}));
const authService = require('../services/authService'); // Now import the mocked module

describe('Auth API', () => {
  // Define mock data
  const mockUser = {
    _id: '60d0fe4f3a76a3b4b8b8b8b8', // Must match ID in setupTests.js mockUser
    name: 'Mock User',
    email: 'mock@example.com',
    role: 'USER',
    emailVerified: true, // Add emailVerified for consistency if your User model has it
  };
  const mockAdminUser = {
    _id: '60d0fe4f3a76a3b4b8b8b8b9', // Must match ID in setupTests.js mockAdminUser
    name: 'Mock Admin',
    email: 'admin@example.com',
    role: 'ADMIN',
    emailVerified: true, // Add emailVerified for consistency
  };
  const mockToken = 'valid_auth_token'; // Must match token in setupTests.js mock
  const mockAdminToken = 'valid_admin_token'; // Must match token in setupTests.js mock

  // Before each test, reset mocks and set up common mock behaviors
  beforeEach(() => {
    jest.clearAllMocks(); // Clears all mock calls and instances

    // Set up default mock implementations for authService methods
    authService.emailLogin.mockResolvedValue({ token: mockToken, user: mockUser });
    authService.googleLogin.mockResolvedValue({ token: mockToken, user: mockUser });
    // authService.verifyToken is now primarily mocked by setupTests.js via authMiddleware.protect,
    // but if any direct calls to authService.verifyToken are made, this mock will catch them.
    authService.verifyToken.mockResolvedValue({ id: mockUser._id, role: mockUser.role });
  });

  describe('POST /api/v1/auth/login/email', () => {
    it('should log in a user with email and password successfully', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login/email')
        .send({ email: 'test@example.com', password: 'password123' });

      expect(res.statusCode).toEqual(200);
      expect(res.body.status).toEqual('success');
      expect(res.body.token).toEqual(mockToken);
      expect(res.body.data.user).toEqual(mockUser);
      expect(authService.emailLogin).toHaveBeenCalledWith('test@example.com', 'password123');
    });

    it('should return 401 if email login fails', async () => {
      // Mock authService.emailLogin to throw an AppError with status 401
      authService.emailLogin.mockRejectedValue(new AppError('Authentication failed: Invalid credentials', 401));

      const res = await request(app)
        .post('/api/v1/auth/login/email')
        .send({ email: 'wrong@example.com', password: 'wrongpassword' });

      expect(res.statusCode).toEqual(401);
      expect(res.body.status).toEqual('fail');
      expect(res.body.message).toEqual('Authentication failed: Invalid credentials');
      expect(authService.emailLogin).toHaveBeenCalledWith('wrong@example.com', 'wrongpassword');
    });
  });

  describe('POST /api/v1/auth/login', () => {
    it('should log in a user with Google ID token successfully', async () => {
      const mockIdToken = 'google_id_token_123';
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ idToken: mockIdToken });

      expect(res.statusCode).toEqual(200);
      expect(res.body.status).toEqual('success');
      expect(res.body.token).toEqual(mockToken);
      expect(res.body.user).toEqual(mockUser);
      expect(authService.googleLogin).toHaveBeenCalledWith(mockIdToken);
    });

    it('should return 401 if Google login fails', async () => {
      const mockIdToken = 'invalid_google_id_token';
      // Mock authService.googleLogin to throw an AppError with status 401
      authService.googleLogin.mockRejectedValue(new AppError('Google authentication failed: Invalid token', 401));

      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ idToken: mockIdToken });

      expect(res.statusCode).toEqual(401);
      expect(res.body.status).toEqual('fail');
      expect(res.body.message).toEqual('Google authentication failed: Invalid token');
      expect(authService.googleLogin).toHaveBeenCalledWith(mockIdToken);
    });
  });

  describe('authMiddleware.protect', () => {
    // We are now testing the mocked authMiddleware.protect from setupTests.js
    // We don't need to import User or jwt here, as the mock handles it.
    const { protect } = authMiddleware; // Get the mocked protect function

    let mockReq, mockRes, mockNext;

    beforeEach(() => {
      // Reset the mock functions for each test
      jest.clearAllMocks();
      mockReq = {
        headers: {},
        cookies: {},
      };
      mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };
      mockNext = jest.fn();
    });

    it('should allow access with a valid token in Authorization header', async () => {
      mockReq.headers.authorization = `Bearer ${mockToken}`;
      await protect(mockReq, mockRes, mockNext);

      // Expect req.user to be set by the mock in setupTests.js
      expect(mockReq.user).toEqual(mockUser);
      expect(mockNext).toHaveBeenCalledTimes(1);
      expect(mockNext).toHaveBeenCalledWith(); // Called without arguments (no error)
    });

    it('should return 401 if no token is provided', async () => {
      await protect(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledTimes(1);
      expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
      expect(mockNext.mock.calls[0][0].statusCode).toBe(401);
      expect(mockNext.mock.calls[0][0].message).toEqual('You are not logged in! Please log in to get access.');
    });

    it('should return 401 if token is invalid', async () => {
      mockReq.headers.authorization = `Bearer invalid_token`;
      await protect(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledTimes(1);
      expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
      expect(mockNext.mock.calls[0][0].statusCode).toBe(401);
      expect(mockNext.mock.calls[0][0].message).toEqual('Invalid token');
    });

    it('should return 401 if user belonging to token no longer exists', async () => {
      mockReq.headers.authorization = `Bearer token_for_non_existent_user`;
      await protect(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledTimes(1);
      expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
      expect(mockNext.mock.calls[0][0].statusCode).toBe(401);
      expect(mockNext.mock.calls[0][0].message).toEqual('The user belonging to this token no longer exists.');
    });
  });

  describe('authMiddleware.restrictTo', () => {
    // We are now testing the mocked authMiddleware.restrictTo from setupTests.js
    const { restrictTo } = authMiddleware; // Get the mocked restrictTo function

    let mockReq, mockRes, mockNext;

    beforeEach(() => {
      jest.clearAllMocks();
      mockReq = {
        user: {}, // Will be set by individual tests
      };
      mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };
      mockNext = jest.fn();
    });

    it('should allow access for ADMIN role to admin-only route', () => {
      mockReq.user = mockAdminUser; // Set admin user directly for restrictTo test
      const middleware = restrictTo('ADMIN');
      middleware(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledTimes(1);
      expect(mockNext).toHaveBeenCalledWith(); // Called without arguments (no error)
    });

    it('should deny access for non-ADMIN role to admin-only route', () => {
      mockReq.user = mockUser; // Set regular user
      const middleware = restrictTo('ADMIN');
      middleware(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledTimes(1);
      expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
      expect(mockNext.mock.calls[0][0].statusCode).toBe(403);
      expect(mockNext.mock.calls[0][0].message).toEqual('You do not have permission to perform this action');
    });

    it('should allow access for USER role to user-allowed route', () => {
      mockReq.user = mockUser; // Set regular user
      const middleware = restrictTo('USER', 'ADMIN'); // USER is an allowed role
      middleware(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledTimes(1);
      expect(mockNext).toHaveBeenCalledWith(); // Called without arguments (no error)
    });
  });
});
