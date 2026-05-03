const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { protect } = require('../middleware/auth');
const {
  createTask,
  getTasksByProject,
  getTaskById,
  updateTaskStatus,
  updateTask,
  deleteTask,
} = require('../controllers/taskController');

// Validation
const taskValidation = [
  body('title', 'Task title is required').not().isEmpty().trim(),
  body('project', 'Project ID is required').not().isEmpty(),
];

// All routes are protected
router.use(protect);

// Task routes
router.post('/', taskValidation, createTask);
router.get('/project/:projectId', getTasksByProject);
router.get('/:id', getTaskById);
router.put('/:id', updateTask);
router.patch('/:id/status', updateTaskStatus);
router.delete('/:id', deleteTask);

module.exports = router;