const express = require('express');
const router = express.Router();
const projectController = require('../controllers/projectController');
const authMiddleware = require('../middleware/authMiddleware');

router.get('/', authMiddleware.protect, projectController.getAllProjects);
router.get('/:id', authMiddleware.protect, projectController.getProjectById);
router.post('/', authMiddleware.protect, projectController.createProject);
router.put('/:id', authMiddleware.protect, projectController.updateProject);
router.delete('/:id', authMiddleware.protect, projectController.deleteProject);
router.post('/:id/members', authMiddleware.protect, projectController.addMembers);
router.delete('/:id/members/:userId', authMiddleware.protect, projectController.removeMember);

module.exports = router;