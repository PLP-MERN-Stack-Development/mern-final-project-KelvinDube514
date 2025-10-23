const express = require('express');
const router = express.Router();
const {
  register,
  login,
  getMe,
  updateProfile,
  changePassword,
  verifyEmail,
  forgotPassword,
  resetPassword,
  logout
} = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const { validate, userSchemas, authAuxSchemas } = require('../middleware/validation');
const { authLimiter } = require('../middleware/security');

// Apply rate limiting to auth routes
router.use(authLimiter);

// Public routes
router.post('/register', validate(userSchemas.register), register);
router.post('/login', validate(userSchemas.login), login);
router.post('/verify-email', validate(authAuxSchemas.verifyEmail), verifyEmail);
router.post('/forgot-password', validate(authAuxSchemas.forgotPassword), forgotPassword);
router.post('/reset-password', validate(authAuxSchemas.resetPassword), resetPassword);

// Protected routes
router.use(protect); // All routes below this are protected

router.get('/me', getMe);
router.get('/profile', getMe); // Add GET /profile endpoint
router.put('/profile', validate(userSchemas.updateProfile), updateProfile);
router.put('/change-password', validate(userSchemas.changePassword), changePassword);
router.post('/logout', logout);

module.exports = router;
