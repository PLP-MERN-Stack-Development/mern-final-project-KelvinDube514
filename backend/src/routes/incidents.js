const express = require('express');
const router = express.Router();
const {
  getIncidents,
  getIncident,
  createIncident,
  updateIncident,
  deleteIncident,
  voteOnIncident,
  getNearbyIncidents,
  getIncidentStats,
  getIncidentAnalytics,
  getIncidentHotspots,
  generateIncidentReport,
  trackIncidentEngagement
} = require('../controllers/incidentController');
const { protect, authorize, optionalAuth } = require('../middleware/auth');
const { validate, incidentSchemas, querySchemas } = require('../middleware/validation');
const { incidentLimiter } = require('../middleware/security');

// Apply rate limiting to incident creation
router.use('/create', incidentLimiter);

// Public routes (with optional auth) - allow controller to handle missing coords message
router.get('/nearby', optionalAuth, getNearbyIncidents);

// Protected routes
router.use(protect);

// Regular user routes
router.get('/', validate(querySchemas.pagination, 'query'), getIncidents);
router.get('/stats', authorize('admin', 'authority'), getIncidentStats);

// Analytics and reporting routes (Admin/Authority only)
router.get('/analytics', authorize('admin', 'authority'), getIncidentAnalytics);
router.get('/hotspots', getIncidentHotspots);
router.get('/reports', authorize('admin', 'authority'), generateIncidentReport);

// Individual incident routes
router.get('/:id', getIncident);
router.post('/', validate(incidentSchemas.create), createIncident);
router.put('/:id', validate(incidentSchemas.update), updateIncident);
router.delete('/:id', deleteIncident);
router.post('/:id/vote', validate(incidentSchemas.vote), voteOnIncident);
router.post('/:id/engage', trackIncidentEngagement);

module.exports = router;
