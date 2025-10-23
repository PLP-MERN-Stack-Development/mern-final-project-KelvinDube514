const express = require('express');
const router = express.Router();
const {
  exportIncidentsCSV,
  exportIncidents,
  exportAlerts,
  exportUsers,
  exportAnalyticsReport,
  createDatabaseBackup,
  listBackups,
  getDatabaseHealth,
  exportCollectionCSV,
  cleanupOldBackups
} = require('../controllers/exportController');
const { protect, authorize } = require('../middleware/auth');
const { exportLimiter } = require('../middleware/security');

// Apply rate limiting to export endpoints
router.use(exportLimiter);

// All routes require authentication
router.use(protect);

// Backward compatible CSV-only endpoint
// @route   GET /api/export/incidents/csv
// @desc    Export incidents to CSV
// @access  Private (Admin/Authority)
router.get('/incidents/csv', authorize('admin', 'authority'), exportIncidentsCSV);

// Unified incidents export with format & filters
// @route   GET /api/export/incidents
// @access  Private (Admin/Authority)
router.get('/incidents', authorize('admin', 'authority'), exportIncidents);

// Alerts export
// @route   GET /api/export/alerts
// @access  Private (Admin/Authority)
router.get('/alerts', authorize('admin', 'authority'), exportAlerts);

// @route   GET /api/export/analytics/report
// @desc    Export analytics report (JSON/CSV)
// @access  Private (Admin/Authority)
router.get('/analytics/report', authorize('admin', 'authority'), exportAnalyticsReport);

// @route   GET /api/export/health
// @desc    Get database health status
// @access  Private (Admin/Authority)
router.get('/health', authorize('admin', 'authority'), getDatabaseHealth);

// @route   GET /api/export/:collection/csv
// @desc    Export any collection to CSV
// @access  Private (Admin only)
router.get('/:collection/csv', authorize('admin'), exportCollectionCSV);

// Users export
// @route   GET /api/export/users
// @access  Private (Admin only)
router.get('/users', authorize('admin'), exportUsers);

// @route   POST /api/export/backup
// @desc    Create database backup
// @access  Private (Admin only)
router.post('/backup', authorize('admin'), createDatabaseBackup);

// @route   GET /api/export/backups
// @desc    List available backups
// @access  Private (Admin only)
router.get('/backups', authorize('admin'), listBackups);

// @route   DELETE /api/export/backups/cleanup
// @desc    Cleanup old backups
// @access  Private (Admin only)
router.delete('/backups/cleanup', authorize('admin'), cleanupOldBackups);

module.exports = router;
