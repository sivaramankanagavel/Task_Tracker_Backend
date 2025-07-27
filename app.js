// app.js
const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors'); // Make sure this is installed: npm install cors
const helmet = require('helmet'); // Make sure this is installed: npm install helmet
const morgan = require('morgan'); // Make sure this is installed: npm install morgan
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const projectRoutes = require('./routes/projectRoutes');
const taskRoutes = require('./routes/taskRoutes');
const globalErrorHandler = require('./middleware/errorHandler');
const AppError = require('./utils/appError');
const mongoose = require('mongoose'); // Mongoose is mocked globally

// Load environment variables from .env file
dotenv.config({ path: './.env' });

const app = express();

// CORS Configuration
app.use(cors({
  origin: ['http://localhost:3000'], // Replace with your actual frontend domains
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'], // Allowed HTTP methods
  allowedHeaders: ['Content-Type', 'Authorization'], // Allowed headers
  credentials: true // Allow cookies to be sent with requests
}));

// Middleware
app.use(helmet()); // Security middleware
app.use(express.json()); // Body parser for JSON data

// Only use morgan in development or specific environments, and skip for tests
if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'production') {
  app.use(morgan('dev'));
}

// NOTE: Database connection is handled in server.js, NOT here.
// Mongoose is globally mocked in setupTests.js for testing.

// Routes
app.use('/api/v1/auth', authRoutes); // Ensure your routes use /api/v1 prefix consistently
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/projects', projectRoutes);
app.use('/api/v1/tasks', taskRoutes);

// Handle undefined routes
app.all('*', (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

// Global error handling middleware
app.use(globalErrorHandler);

module.exports = app; // Export the app for testing
