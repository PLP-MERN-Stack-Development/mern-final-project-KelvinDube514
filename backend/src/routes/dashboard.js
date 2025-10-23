const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  getDashboardOverview,
  getSafetyMetrics,
  getAnalytics,
  getReports,
  getRealTimeMetrics,
  getIncidentFeed,
  getEnhancedAnalytics,
  clearMetricsCache
} = require('../controllers/dashboardController');

// @route   GET /api/dashboard/overview
// @desc    Get dashboard overview statistics
// @access  Private
router.get('/overview', protect, getDashboardOverview);

// @route   GET /api/dashboard/safety-metrics
// @desc    Get safety metrics for dashboard
// @access  Private
// Citizens should not access safety metrics
router.get('/safety-metrics', protect, authorize('admin', 'authority'), getSafetyMetrics);

// @route   GET /api/dashboard/metrics
// @desc    Get real-time dashboard metrics
// @access  Private
router.get('/metrics', protect, getRealTimeMetrics);

// @route   GET /api/dashboard/feed
// @desc    Get incident feed for dashboard
// @access  Private
router.get('/feed', protect, getIncidentFeed);

// @route   GET /api/dashboard/analytics
// @desc    Get incident analytics data (legacy)
// @access  Private (Admin/Authority)
// Limit analytics to admin/authority
router.get('/analytics', protect, authorize('admin', 'authority'), getAnalytics);

// @route   GET /api/dashboard/enhanced-analytics
// @desc    Get enhanced analytics using AnalyticsService
// @access  Private (Admin/Authority)
router.get('/enhanced-analytics', protect, authorize('admin', 'authority'), getEnhancedAnalytics);

// @route   GET /api/dashboard/reports
// @desc    Get reports data
// @access  Private
// Reports restricted to admin only per test expectations
router.get('/reports', protect, authorize('admin'), getReports);

// @route   GET /api/dashboard/nearby
// @desc    Get nearby incidents and alerts for dashboard
// @access  Private
router.get('/nearby', protect, async (req, res) => {
  try {
    const { lat, lng, radius = 10 } = req.query;
    
    if (!lat || !lng) {
      return res.status(400).json({
        success: false,
        message: 'Latitude and longitude are required'
      });
    }

    const location = {
      type: 'Point',
      coordinates: [parseFloat(lng), parseFloat(lat)]
    };

    // Get nearby incidents
    const incidents = await require('../models/Incident').find({
      location: {
        $near: {
          $geometry: location,
          $maxDistance: parseFloat(radius) * 1000 // Convert km to meters
        }
      },
      isActive: true
    }).limit(20).sort({ createdAt: -1 });

    // Get nearby alerts
    const alerts = await require('../models/Alert').find({
      location: {
        $near: {
          $geometry: location,
          $maxDistance: parseFloat(radius) * 1000 // Convert km to meters
        }
      },
      isActive: true
    }).limit(10).sort({ createdAt: -1 });

    res.json({
      success: true,
      data: {
        incidents,
        alerts
      }
    });
  } catch (error) {
    console.error('Dashboard nearby error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get nearby data'
    });
  }
});

// @route   POST /api/dashboard/cache/clear
// @desc    Clear metrics cache
// @access  Private (Admin only)
router.post('/cache/clear', protect, authorize('admin'), clearMetricsCache);

module.exports = router;
