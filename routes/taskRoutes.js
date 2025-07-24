const express = require('express');
const router = express.Router();
const taskController = require('../controllers/taskController');
const authMiddleware = require('../middleware/authMiddleware');

router.put('/:id', authMiddleware.protect, taskController.updateTask);

router.get('/', authMiddleware.protect, taskController.getAllTasks);
router.get('/:id', authMiddleware.protect, taskController.getTaskById);
router.post('/', authMiddleware.protect, taskController.createTask);
router.delete('/:id', authMiddleware.protect, taskController.deleteTask);
router.get('/project/:projectId', authMiddleware.protect, taskController.getTasksByProject);
router.get('/user/:userId', authMiddleware.protect, taskController.getTasksByAssignee);

module.exports = router;