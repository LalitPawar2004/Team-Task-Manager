const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { getDashboardStats } = require('../controllers/dashboardController');

// Protected route
router.use(protect);

// Get dashboard stats
router.get('/', getDashboardStats);

module.exports = router;