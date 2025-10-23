const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
require('dotenv').config();

// Import configurations
const logger = require('./config/logger');

// Import middleware
const {
  securityHeaders,
  corsMiddleware,
  generalLimiter,
  requestLogger,
  sanitizeInput
} = require('./middleware/security');

// Import enhanced error handling
const { globalErrorHandler } = require('./utils/errorHandler');

// Import routes
const authRoutes = require('./routes/auth');
const incidentRoutes = require('./routes/incidents');
const locationRoutes = require('./routes/locations');
const alertRoutes = require('./routes/alerts');
const adminRoutes = require('./routes/admin');
const dashboardRoutes = require('./routes/dashboard');
const exportRoutes = require('./routes/export');
const mapRoutes = require('./routes/maps');

// Initialize Express app
const app = express();

// Trust proxy (for accurate IP addresses)
app.set('trust proxy', 1);

// Optional Sentry request handler (initialized only if DSN is set in logger)
try {
  const Sentry = require('@sentry/node');
  if (process.env.SENTRY_DSN && Sentry && Sentry.setupExpressErrorHandler) {
    app.use(Sentry.Handlers.requestHandler());
  }
} catch (_) {}

// Security middleware
app.use(securityHeaders);
app.use(corsMiddleware);

// Rate limiting
app.use(generalLimiter);

// Request logging
app.use(requestLogger);

// Input sanitization
app.use(sanitizeInput);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static files
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Health check endpoints
const healthResponse = (req, res) => {
  res.status(200).json({
    success: true,
    message: 'SecurePath API is running',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0'
  });
};

app.get('/health', healthResponse);
app.get('/api/health', healthResponse);

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/incidents', incidentRoutes);
app.use('/api/alerts', alertRoutes);
app.use('/api/locations', locationRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/export', exportRoutes);
app.use('/api/maps', mapRoutes);

// API documentation endpoint
app.get('/api', (req, res) => {
  res.json({
    success: true,
    message: 'SecurePath API',
    version: '1.0.0',
    endpoints: {
      auth: {
        register: 'POST /api/auth/register',
        login: 'POST /api/auth/login',
        profile: 'GET /api/auth/me',
        getProfile: 'GET /api/auth/profile',
        updateProfile: 'PUT /api/auth/profile',
        changePassword: 'PUT /api/auth/change-password',
        logout: 'POST /api/auth/logout'
      },
      incidents: {
        getIncidents: 'GET /api/incidents',
        getIncident: 'GET /api/incidents/:id',
        createIncident: 'POST /api/incidents',
        updateIncident: 'PUT /api/incidents/:id',
        deleteIncident: 'DELETE /api/incidents/:id',
        voteOnIncident: 'POST /api/incidents/:id/vote',
        getNearbyIncidents: 'GET /api/incidents/nearby',
        getStats: 'GET /api/incidents/stats'
      }
      ,
      locations: {
        list: 'GET /api/locations',
        create: 'POST /api/locations',
        getById: 'GET /api/locations/:id',
        update: 'PUT /api/locations/:id',
        delete: 'DELETE /api/locations/:id',
        nearby: 'GET /api/locations/nearby/search'
      },
      alerts: {
        list: 'GET /api/alerts',
        create: 'POST /api/alerts',
        getById: 'GET /api/alerts/:id',
        update: 'PUT /api/alerts/:id',
        delete: 'DELETE /api/alerts/:id',
        markRead: 'POST /api/alerts/:id/mark-read',
        nearby: 'GET /api/alerts/nearby',
        stats: 'GET /api/alerts/stats'
      },
      dashboard: {
        overview: 'GET /api/dashboard/overview',
        safetyMetrics: 'GET /api/dashboard/safety-metrics',
        analytics: 'GET /api/dashboard/analytics',
        reports: 'GET /api/dashboard/reports',
        nearby: 'GET /api/dashboard/nearby'
      }
    }
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`
  });
});

// Sentry error handler (must be after all routes)
try {
  const Sentry = require('@sentry/node');
  if (process.env.SENTRY_DSN && Sentry && Sentry.Handlers) {
    app.use(Sentry.Handlers.errorHandler());
  }
} catch (_) {}

// Global error handler
app.use(globalErrorHandler);

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
  logger.error('Unhandled Promise Rejection:', err);
  // Close server & exit process
  process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  logger.error('Uncaught Exception:', err);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received. Shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT received. Shutting down gracefully...');
  process.exit(0);
});

module.exports = app;
