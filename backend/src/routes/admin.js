const express = require('express');
const router = express.Router();
const {
  getAllUsers,
  getUserById,
  updateUserStatus,
  deleteUser,
  getSystemStats,
  getRecentActivity
} = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/auth');
const { validate, querySchemas } = require('../middleware/validation');
const { authLimiter } = require('../middleware/security');

// Apply rate limiting to admin routes (use auth limiter as fallback)
router.use(authLimiter);

// Protect all routes with authentication
router.use(protect);

// User management routes (Admin and Authority can view)
router.get('/users', authorize('admin', 'authority'), getAllUsers);
router.get('/users/:id', authorize('admin', 'authority'), getUserById);

// User status management (Admin only)
router.put('/users/:id/status', authorize('admin'), updateUserStatus);
router.delete('/users/:id', authorize('admin'), deleteUser);

// System statistics (Admin and Authority can view)
router.get('/statistics', authorize('admin', 'authority'), getSystemStats);

// Activity logs (Admin only)
router.get('/activity', authorize('admin'), getRecentActivity);

module.exports = router;
