require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const cookieParser = require('cookie-parser');
const cors = require('cors'); // Import the cors package
const AppError = require('./utils/appError');
const globalErrorHandler = require('./middleware/errorHandler');

const authRoutes = require('./routes/authRoutes');
const projectRoutes = require('./routes/projectRoutes');
const taskRoutes = require('./routes/taskRoutes');
const userRoutes = require('./routes/userRoutes');

const app = express();

// CORS Configuration
// For production, you should restrict origins for security:
app.use(cors({
  origin: ['http://localhost:3000'], // Replace with your actual frontend domains
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'], // Allowed HTTP methods
  allowedHeaders: ['Content-Type', 'Authorization'], // Allowed headers
  credentials: true // Allow cookies to be sent with requests
}));


// Middleware
app.use(express.json());
app.use(cookieParser());

// Database Connection
const DB = process.env.MONGODB_URI;

mongoose
  .connect(DB, {
    useNewUrlParser: true, // Deprecated, but kept for compatibility with older Mongoose versions
    useUnifiedTopology: true, // Deprecated, but kept for compatibility with older Mongoose versions
  })
  .then(() => console.log('DB connection successful!'))
  .catch((err) => console.error('DB connection error:', err));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/users', userRoutes);

// Handle undefined routes
app.all('*', (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

// Global Error Handling Middleware
app.use(globalErrorHandler);

const port = process.env.PORT || 5000;
app.listen(port, () => {
  console.log(`App running on port ${port}...`);
});