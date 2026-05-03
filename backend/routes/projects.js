const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { protect } = require('../middleware/auth');
const {
  createProject,
  getProjects,
  getProjectById,
  addMember,
  removeMember,
  deleteProject,
} = require('../controllers/projectController');

// Validation
const projectValidation = [
  body('name', 'Project name is required').not().isEmpty().trim(),
];

// All routes are protected
router.use(protect);

// Project CRUD
router.post('/', projectValidation, createProject);
router.get('/', getProjects);
router.get('/:id', getProjectById);
router.delete('/:id', deleteProject);

// Member management
router.post('/:id/members', addMember);
router.delete('/:id/members/:userId', removeMember);

module.exports = router;