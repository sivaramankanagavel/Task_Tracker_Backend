const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const authMiddleware = require('../middleware/authMiddleware');

router.get('/', authMiddleware.protect, authMiddleware.restrictTo('ADMIN', 'TASK_CREATOR'), userController.getAllUsers);
router.get('/:id', authMiddleware.protect, userController.getUserById);
router.post('/', authMiddleware.protect, authMiddleware.restrictTo('ADMIN'), userController.createUser);
router.put('/:id', authMiddleware.protect, userController.updateUser);
router.delete('/:id', authMiddleware.protect, authMiddleware.restrictTo('ADMIN'), userController.deleteUser);

module.exports = router;