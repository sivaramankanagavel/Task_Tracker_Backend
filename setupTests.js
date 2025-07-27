// setupTests.js
// This file sets up global mocks for Mongoose, Firebase Admin SDK, and Express middleware
// to isolate our tests from actual database and external service calls.

// Mock Mongoose globally
jest.mock('mongoose', () => {
  const mockSchema = jest.fn((definition, options) => {
    const schemaInstance = {
      virtual: jest.fn().mockReturnThis(),
      set: jest.fn().mockReturnThis(),
      pre: jest.fn().mockReturnThis(),
      post: jest.fn().mockReturnThis(),
    };
    return schemaInstance;
  });

  mockSchema.Types = {
    ObjectId: jest.fn(() => ({
      toHexString: jest.fn(() => '60d0fe4f3a76a3b4b8b8b8b8'), // Consistent mock ID
      toString: jest.fn(() => '60d0fe4f3a76a3b4b8b8b8b8'), // Consistent mock ID
    })),
  };

  const mongoose = {
    connect: jest.fn(),
    model: jest.fn((name, schema) => {
      const MockModel = {
        find: jest.fn().mockReturnThis(),
        findById: jest.fn().mockReturnThis(),
        findByIdAndUpdate: jest.fn().mockReturnThis(),
        findByIdAndDelete: jest.fn().mockReturnThis(),
        findOne: jest.fn().mockReturnThis(),
        create: jest.fn(),
        save: jest.fn(),
        populate: jest.fn().mockReturnThis(),
        exec: jest.fn(),
        lean: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
      };

      const ModelConstructor = jest.fn(data => {
        const instance = {
          ...data,
          save: jest.fn().mockResolvedValue({ ...data, _id: new mongoose.Types.ObjectId().toHexString() }),
        };
        instance.toObject = jest.fn(() => instance);
        instance.toJSON = jest.fn(() => instance);
        return instance;
      });

      Object.assign(ModelConstructor, MockModel);
      return ModelConstructor;
    }),
    Schema: mockSchema,
    Types: {
      ObjectId: jest.fn(() => ({
        toHexString: jest.fn(() => '60d0fe4f3a76a3b4b8b8b8b8'),
        toString: jest.fn(() => '60d0fe4f3a76a3b4b8b8b8b8'),
      })),
    },
    set: jest.fn(),
  };

  return mongoose;
});


// Mock firebase-admin globally
jest.mock('firebase-admin', () => {
  const mockAuth = {
    getUserByEmail: jest.fn(),
    createCustomToken: jest.fn(),
    verifyIdToken: jest.fn(),
  };

  const mockFirebaseAdmin = {
    initializeApp: jest.fn(),
    credential: {
      cert: jest.fn(),
    },
    auth: jest.fn(() => mockAuth),
    apps: [], // Mock an empty array for apps to prevent errors in firebaseConfig.js
  };

  return mockFirebaseAdmin;
});

// Mock jsonwebtoken globally
jest.mock('jsonwebtoken', () => ({
  sign: jest.fn(() => 'mocked_jwt_token'),
  verify: jest.fn(),
}));

// Mock dotenv to load environment variables for tests
require('dotenv').config({ path: './.env' });

// IMPORTANT: Mock the global error handler to ensure tests don't hang
// when an error is passed to next() in Express middleware.
jest.mock('./middleware/errorHandler', () => (err, req, res, next) => {
  // Simulate the error handling logic to send a response immediately
  const statusCode = err.statusCode || 500;
  const status = err.status || 'error';
  const message = err.message || 'Something went very wrong!';

  res.status(statusCode).json({
    status,
    message,
    // Include error details in development for easier debugging in tests
    // Only include if NODE_ENV is explicitly 'development' or similar for tests
    ...(process.env.NODE_ENV === 'development' && { error: err, stack: err.stack }),
  });
});

// Mock authMiddleware to simplify testing of protected routes
jest.mock('./middleware/authMiddleware', () => {
  const AppError = require('./utils/appError'); // Import AppError here

  const mockUser = {
    _id: '60d0fe4f3a76a3b4b8b8b8b8', // Consistent mock user ID for regular users
    name: 'Mock User',
    email: 'mock@example.com',
    role: 'USER',
    emailVerified: true, // Added for consistency
  };
  const mockAdminUser = {
    _id: '60d0fe4f3a76a3b4b8b8b8b9', // Consistent mock user ID for admin users
    name: 'Mock Admin',
    email: 'admin@example.com',
    role: 'ADMIN',
    emailVerified: true, // Added for consistency
  };

  return {
    protect: jest.fn((req, res, next) => {
      // This mock protect middleware will always set req.user for simplicity in tests.
      // For specific tests that need to simulate no token or invalid token,
      // those tests should mock `authMiddleware.protect` locally or adjust `req.headers.authorization`
      // and expect the global error handler to catch.
      if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        const token = req.headers.authorization.split(' ')[1];
        if (token === 'valid_auth_token') {
          req.user = mockUser;
        } else if (token === 'valid_admin_token') {
          req.user = mockAdminUser;
        } else if (token === 'invalid_token') {
          // Simulate invalid token scenario by calling next with an error
          return next(new AppError('Invalid token', 401));
        } else if (token === 'token_for_non_existent_user') {
          // Simulate user not found scenario
          return next(new AppError('The user belonging to this token no longer exists.', 401));
        }
      } else {
        // Simulate no token scenario
        return next(new AppError('You are not logged in! Please log in to get access.', 401));
      }
      next(); // Proceed to the next middleware or route handler
    }),
    restrictTo: jest.fn((...roles) => (req, res, next) => {
      if (!req.user || !roles.includes(req.user.role)) {
        return next(new AppError('You do not have permission to perform this action', 403));
      }
      next();
    }),
  };
});
