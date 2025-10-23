const logger = require('../config/logger');

// Standard error codes for the application
const ERROR_CODES = {
  // Authentication & Authorization Errors (1000-1999)
  AUTHENTICATION_REQUIRED: 1000,
  INVALID_CREDENTIALS: 1001,
  TOKEN_EXPIRED: 1002,
  TOKEN_INVALID: 1003,
  INSUFFICIENT_PERMISSIONS: 1004,
  ACCOUNT_DEACTIVATED: 1005,
  EMAIL_NOT_VERIFIED: 1006,
  PASSWORD_RESET_REQUIRED: 1007,

  // Validation Errors (2000-2999)
  VALIDATION_ERROR: 2000,
  REQUIRED_FIELD_MISSING: 2001,
  INVALID_FORMAT: 2002,
  VALUE_OUT_OF_RANGE: 2003,
  DUPLICATE_VALUE: 2004,
  INVALID_FILE_TYPE: 2005,
  FILE_SIZE_EXCEEDED: 2006,

  // Resource Errors (3000-3999)
  RESOURCE_NOT_FOUND: 3000,
  RESOURCE_ALREADY_EXISTS: 3001,
  RESOURCE_ACCESS_DENIED: 3002,
  RESOURCE_LOCKED: 3003,
  RESOURCE_CORRUPTED: 3004,

  // Business Logic Errors (4000-4999)
  INCIDENT_ALREADY_VOTED: 4000,
  ALERT_EXPIRED: 4001,
  LOCATION_OUT_OF_BOUNDS: 4002,
  INVALID_STATUS_TRANSITION: 4003,
  OPERATION_NOT_ALLOWED: 4004,

  // System Errors (5000-5999)
  DATABASE_ERROR: 5000,
  EXTERNAL_SERVICE_ERROR: 5001,
  RATE_LIMIT_EXCEEDED: 5002,
  SERVER_OVERLOADED: 5003,
  MAINTENANCE_MODE: 5004,

  // Generic Errors (9000-9999)
  UNKNOWN_ERROR: 9000,
  NOT_IMPLEMENTED: 9001,
  DEPRECATED_ENDPOINT: 9002
};

// Error severity levels
const ERROR_SEVERITY = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical'
};

// Custom error class
class AppError extends Error {
  constructor(message, statusCode, errorCode = null, severity = ERROR_SEVERITY.MEDIUM, details = null) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.severity = severity;
    this.details = details;
    this.isOperational = true; // Distinguish from programming errors
    this.timestamp = new Date().toISOString();

    Error.captureStackTrace(this, this.constructor);
  }
}

// Enhanced error response sanitization
const sanitizeErrorResponse = (error, req, res, next) => {
  // Log error details for monitoring
  const errorLog = {
    message: error.message,
    statusCode: error.statusCode || 500,
    errorCode: error.errorCode || ERROR_CODES.UNKNOWN_ERROR,
    severity: error.severity || ERROR_SEVERITY.MEDIUM,
    path: req.path,
    method: req.method,
    userId: req.user?._id || null,
    userAgent: req.get('User-Agent'),
    ip: req.ip,
    timestamp: new Date().toISOString()
  };

  // Log based on severity
  switch (error.severity) {
    case ERROR_SEVERITY.CRITICAL:
      logger.error('Critical error occurred:', errorLog);
      break;
    case ERROR_SEVERITY.HIGH:
      logger.error('High severity error:', errorLog);
      break;
    case ERROR_SEVERITY.MEDIUM:
      logger.warn('Medium severity error:', errorLog);
      break;
    default:
      logger.info('Low severity error:', errorLog);
  }

  // Determine if this is a known operational error
  const isOperationalError = error.isOperational || error.statusCode < 500;

  // Base response structure
  const errorResponse = {
    success: false,
    error: {
      message: error.message || 'An unexpected error occurred',
      code: error.errorCode || ERROR_CODES.UNKNOWN_ERROR,
      severity: error.severity || ERROR_SEVERITY.MEDIUM,
      timestamp: error.timestamp || new Date().toISOString()
    }
  };

  // Add details for validation errors
  if (error.name === 'ValidationError' || error.errorCode === ERROR_CODES.VALIDATION_ERROR) {
    errorResponse.error.details = error.details || extractValidationErrors(error);
  }

  // Add helpful information based on error type
  if (error.statusCode === 401) {
    errorResponse.error.code = ERROR_CODES.AUTHENTICATION_REQUIRED;
    errorResponse.error.action = 'Please log in to access this resource';
  } else if (error.statusCode === 403) {
    errorResponse.error.code = ERROR_CODES.INSUFFICIENT_PERMISSIONS;
    errorResponse.error.action = 'You do not have permission to perform this action';
  } else if (error.statusCode === 404) {
    errorResponse.error.code = ERROR_CODES.RESOURCE_NOT_FOUND;
    errorResponse.error.action = 'Please check the resource identifier and try again';
  } else if (error.statusCode === 429) {
    errorResponse.error.code = ERROR_CODES.RATE_LIMIT_EXCEEDED;
    errorResponse.error.action = 'Please wait before making another request';
    errorResponse.error.retryAfter = error.retryAfter || 60;
  }

  // In development, include stack trace for debugging
  if (process.env.NODE_ENV === 'development' && !isOperationalError) {
    errorResponse.debug = {
      stack: error.stack,
      details: error.details
    };
  }

  // For production, sanitize sensitive information
  if (process.env.NODE_ENV === 'production') {
    // Don't expose internal error details
    if (!isOperationalError) {
      errorResponse.error.message = 'Internal server error';
      errorResponse.error.code = ERROR_CODES.UNKNOWN_ERROR;
    }
  }

  // Send the error response
  res.status(error.statusCode || 500).json(errorResponse);
};

// Extract validation errors from Mongoose or Joi errors
const extractValidationErrors = (error) => {
  const validationErrors = [];

  if (error.errors) {
    // Mongoose validation errors
    for (const field in error.errors) {
      validationErrors.push({
        field: field,
        message: error.errors[field].message,
        value: error.errors[field].value
      });
    }
  } else if (error.details) {
    // Joi validation errors
    error.details.forEach(detail => {
      validationErrors.push({
        field: detail.path.join('.'),
        message: detail.message,
        value: detail.context?.value
      });
    });
  }

  return validationErrors;
};

// Async error wrapper to catch async function errors
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// Common error factories
const errorFactories = {
  notFound: (resource = 'Resource') => 
    new AppError(`${resource} not found`, 404, ERROR_CODES.RESOURCE_NOT_FOUND, ERROR_SEVERITY.LOW),
  
  unauthorized: (message = 'Authentication required') => 
    new AppError(message, 401, ERROR_CODES.AUTHENTICATION_REQUIRED, ERROR_SEVERITY.MEDIUM),
  
  forbidden: (message = 'Insufficient permissions') => 
    new AppError(message, 403, ERROR_CODES.INSUFFICIENT_PERMISSIONS, ERROR_SEVERITY.MEDIUM),
  
  badRequest: (message = 'Invalid request data', details = null) => 
    new AppError(message, 400, ERROR_CODES.VALIDATION_ERROR, ERROR_SEVERITY.LOW, details),
  
  conflict: (message = 'Resource already exists') => 
    new AppError(message, 409, ERROR_CODES.RESOURCE_ALREADY_EXISTS, ERROR_SEVERITY.LOW),
  
  rateLimit: (message = 'Too many requests', retryAfter = 60) => {
    const error = new AppError(message, 429, ERROR_CODES.RATE_LIMIT_EXCEEDED, ERROR_SEVERITY.MEDIUM);
    error.retryAfter = retryAfter;
    return error;
  },
  
  serverError: (message = 'Internal server error') => 
    new AppError(message, 500, ERROR_CODES.UNKNOWN_ERROR, ERROR_SEVERITY.HIGH)
};

// Handle specific error types
const handleSpecificErrors = (error) => {
  // MongoDB duplicate key error
  if (error.code === 11000) {
    const field = Object.keys(error.keyPattern)[0];
    return new AppError(
      `${field} already exists`, 
      409, 
      ERROR_CODES.DUPLICATE_VALUE, 
      ERROR_SEVERITY.LOW,
      { field, value: error.keyValue[field] }
    );
  }

  // MongoDB validation error
  if (error.name === 'ValidationError') {
    return new AppError(
      'Validation failed',
      400,
      ERROR_CODES.VALIDATION_ERROR,
      ERROR_SEVERITY.LOW,
      extractValidationErrors(error)
    );
  }

  // JWT errors
  if (error.name === 'JsonWebTokenError') {
    return new AppError('Invalid token', 401, ERROR_CODES.TOKEN_INVALID, ERROR_SEVERITY.MEDIUM);
  }

  if (error.name === 'TokenExpiredError') {
    return new AppError('Token expired', 401, ERROR_CODES.TOKEN_EXPIRED, ERROR_SEVERITY.MEDIUM);
  }

  // MongoDB connection errors
  if (error.name === 'MongoError' || error.name === 'MongooseError') {
    return new AppError(
      'Database connection error', 
      500, 
      ERROR_CODES.DATABASE_ERROR, 
      ERROR_SEVERITY.HIGH
    );
  }

  return error;
};

// Global error handler
const globalErrorHandler = (error, req, res, next) => {
  // Handle specific error types first
  const processedError = handleSpecificErrors(error);
  
  // Use the enhanced sanitization
  sanitizeErrorResponse(processedError, req, res, next);
};

module.exports = {
  AppError,
  ERROR_CODES,
  ERROR_SEVERITY,
  sanitizeErrorResponse,
  extractValidationErrors,
  asyncHandler,
  errorFactories,
  handleSpecificErrors,
  globalErrorHandler
};
