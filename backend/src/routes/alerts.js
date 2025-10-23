const express = require('express');
const router = express.Router();

const { protect, authorize } = require('../middleware/auth');
const {
  createAlert,
  getAlerts,
  getAlertById,
  updateAlert,
  deleteAlert,
  markAlertAsRead,
  getNearbyAlerts,
  getAlertStats
} = require('../controllers/alertController');

// Create alert (authority or admin)
router.post('/', protect, authorize('authority', 'admin'), createAlert);

// List alerts
router.get('/', protect, getAlerts);

// Nearby alerts
router.get('/nearby', protect, getNearbyAlerts);

// Stats (authority/admin)
router.get('/stats', protect, authorize('authority', 'admin'), getAlertStats);

// Single alert
router.get('/:id', protect, getAlertById);
router.put('/:id', protect, updateAlert);
router.delete('/:id', protect, deleteAlert);

// Mark read
router.post('/:id/mark-read', protect, markAlertAsRead);

module.exports = router;


