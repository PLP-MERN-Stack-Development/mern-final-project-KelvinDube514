const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const logger = require('../config/logger');
const { AppError, ERROR_CODES, ERROR_SEVERITY } = require('../utils/errorHandler');

// Token blacklist (in production, use Redis or database)
const tokenBlacklist = new Set();

// Failed login attempts tracking (in production, use Redis)
const failedLoginAttempts = new Map();

// Generate JWT token with enhanced security
const generateToken = (userId, userAgent = '', ipAddress = '') => {
  const payload = {
    userId,
    iat: Math.floor(Date.now() / 1000),
    jti: crypto.randomUUID(), // Unique token ID
    // Include basic session context for additional security
    ...(userAgent && { ua: crypto.createHash('sha256').update(userAgent).digest('hex').substring(0, 16) }),
    ...(ipAddress && { ip: crypto.createHash('sha256').update(ipAddress).digest('hex').substring(0, 16) })
  };

  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d',
    issuer: 'securepath-api',
    audience: 'securepath-client'
  });
};

// Generate refresh token
const generateRefreshToken = (userId) => {
  return jwt.sign({ userId }, process.env.REFRESH_TOKEN_SECRET, {
    expiresIn: process.env.REFRESH_TOKEN_EXPIRE || '30d'
  });
};

// Verify JWT token
const verifyToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    logger.error('Token verification failed:', error.message);
    return null;
  }
};

// Middleware to protect routes
const protect = async (req, res, next) => {
  try {
    let token;

    // Get token from header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    // Check if token exists
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.'
      });
    }

    // Verify token
    const decoded = verifyToken(token);
    if (!decoded) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token.'
      });
    }

    // Get user from token
    const user = await User.findById(decoded.userId).select('-password');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found.'
      });
    }

    // Account status check removed - allow all users

    // Email verification no longer required - allow all users

    req.user = user;
    next();
  } catch (error) {
    logger.error('Auth middleware error:', error);
    return res.status(500).json({
      success: false,
      message: 'Authentication error.'
    });
  }
};

// Middleware to authorize specific roles
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required.'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Required role: ${roles.join(' or ')}`
      });
    }

    next();
  };
};

// Middleware for optional authentication (doesn't fail if no token)
const optionalAuth = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (token) {
      const decoded = verifyToken(token);
      if (decoded) {
        const user = await User.findById(decoded.userId).select('-password');
        if (user) {
          req.user = user;
        }
      }
    }

    next();
  } catch (error) {
    logger.error('Optional auth middleware error:', error);
    next(); // Continue even if auth fails
  }
};

// Middleware to check if user owns resource
const checkOwnership = (resourceField = 'userId') => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required.'
      });
    }

    // Allow admins to access all resources
    if (req.user.role === 'admin') {
      return next();
    }

    // Check if user owns the resource
    const resourceId = req.params.id || req.body[resourceField] || req.query[resourceField];
    if (!resourceId) {
      return res.status(400).json({
        success: false,
        message: 'Resource ID is required.'
      });
    }

    // For ObjectId comparison
    if (req.user._id.toString() !== resourceId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only access your own resources.'
      });
    }

    next();
  };
};

// Middleware to check if user owns resource or has admin/authority role
const authorizeOwnerOrRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required.'
      });
    }

    // Check if user has required role
    if (roles.includes(req.user.role)) {
      return next();
    }

    // Check if user owns the resource (for user ID in params)
    if (req.params.userId && req.params.userId === req.user._id.toString()) {
      return next();
    }

    // Check if user owns the resource (for user ID in body)
    if (req.body.userId && req.body.userId === req.user._id.toString()) {
      return next();
    }

    logger.warn('Ownership/Role authorization failed:', {
      userId: req.user._id,
      userRole: req.user.role,
      requiredRoles: roles,
      resourceUserId: req.params.userId || req.body.userId,
      path: req.path,
      method: req.method
    });

    return res.status(403).json({
      success: false,
      message: 'Access denied. You can only access your own resources or need higher privileges.'
    });
  };
};

// Middleware to check account verification status
const requireVerification = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required.'
    });
  }

  // Email verification no longer required - allow all authenticated users

  next();
};

// Middleware to check if account is active
const requireActiveAccount = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required.'
    });
  }

  // Account status check removed - allow all authenticated users

  next();
};

module.exports = {
  generateToken,
  generateRefreshToken,
  verifyToken,
  protect,
  authorize,
  optionalAuth,
  checkOwnership,
  authorizeOwnerOrRole,
  requireVerification,
  requireActiveAccount
};
