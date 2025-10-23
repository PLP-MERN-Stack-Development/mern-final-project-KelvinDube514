const mongoose = require('mongoose');
const Alert = require('../models/Alert');
const User = require('../models/User');
const { alertSchemas } = require('../middleware/validation');

// Helper to build standard success response
function ok(res, data, message = 'Success', status = 200) {
  return res.status(status).json({ success: true, message, data });
}

// Helper to build standard error response
function fail(res, message = 'Request failed', status = 400, extra = {}) {
  return res.status(status).json({ success: false, message, ...extra });
}

// POST /api/alerts
async function createAlert(req, res) {
  try {
    // Only authority or admin via route middleware; createdBy from auth user
    const { error, value } = alertSchemas.create.validate(req.body, { abortEarly: false });
    if (error) {
      return fail(res, 'Validation error', 400, { errors: error.details.map(d => d.message) });
    }

    const alertToCreate = {
      ...value,
      createdBy: req.user._id
    };

    const alert = await Alert.create(alertToCreate);
    const populated = await Alert.findById(alert._id).populate('createdBy', '-password');
    return ok(res, { alert: populated }, 'Alert created successfully', 201);
  } catch (err) {
    return fail(res, err.message || 'Failed to create alert', 500);
  }
}

// GET /api/alerts
async function getAlerts(req, res) {
  try {
    const { type, priority, targetAudience, page = 1, limit = 10, sort = 'createdAt', order = 'desc' } = req.query;
    const filter = { isActive: { $ne: false } };
    if (type) {filter.type = type;}
    if (priority) {filter.priority = priority;}
    if (targetAudience) {filter.targetAudience = targetAudience;}

    const skip = (Number(page) - 1) * Number(limit);
    const sortSpec = { [sort]: order === 'asc' ? 1 : -1 };

    const [alerts, total] = await Promise.all([
      Alert.find(filter).sort(sortSpec).skip(skip).limit(Number(limit)),
      Alert.countDocuments(filter)
    ]);

    return ok(res, { alerts, pagination: { page: Number(page), limit: Number(limit), total } });
  } catch (err) {
    return fail(res, err.message || 'Failed to get alerts', 500);
  }
}

// GET /api/alerts/:id
async function getAlertById(req, res) {
  try {
    const { id } = req.params;
    const alert = await Alert.findById(id);
    if (!alert) {
      return fail(res, 'Alert not found', 404);
    }
    return ok(res, { alert });
  } catch (err) {
    return fail(res, 'Alert not found', 404);
  }
}

// PUT /api/alerts/:id
async function updateAlert(req, res) {
  try {
    const { id } = req.params;
    const alert = await Alert.findById(id);
    if (!alert) {
      return fail(res, 'Alert not found', 404);
    }

    // Permission: creator or admin
    const isCreator = alert.createdBy?.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';
    if (!isCreator && !isAdmin) {
      return fail(res, 'Not authorized', 403);
    }

    // Validate partial update for known fields
    const updatable = ['title', 'message', 'type', 'priority', 'targetAudience', 'location', 'expiresAt', 'actionRequired', 'actionText', 'actionUrl', 'isActive'];
    const payload = {};
    for (const key of updatable) {
      if (key in req.body) {payload[key] = req.body[key];}
    }

    // Basic validation for update (reuse create rules where applicable)
    if ('title' in payload && (typeof payload.title !== 'string' || payload.title.trim().length < 1)) {
      return fail(res, 'Validation error', 400, { errors: ['Alert title is required'] });
    }
    if ('priority' in payload && !['low', 'medium', 'high', 'urgent', 'critical'].includes(payload.priority)) {
      return fail(res, 'Validation error', 400, { errors: ['Invalid priority'] });
    }

    Object.assign(alert, payload);
    await alert.save();
    return ok(res, { alert }, 'Alert updated successfully');
  } catch (err) {
    return fail(res, err.message || 'Failed to update alert', 500);
  }
}

// DELETE /api/alerts/:id (soft delete by setting isActive=false)
async function deleteAlert(req, res) {
  try {
    const { id } = req.params;
    const alert = await Alert.findById(id);
    if (!alert) {
      return fail(res, 'Alert not found', 404);
    }
    const isCreator = alert.createdBy?.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';
    if (!isCreator && !isAdmin) {
      return fail(res, 'Not authorized', 403);
    }

    alert.isActive = false;
    await alert.save();
    return ok(res, { alert }, 'Alert deleted successfully');
  } catch (err) {
    return fail(res, err.message || 'Failed to delete alert', 500);
  }
}

// POST /api/alerts/:id/mark-read
async function markAlertAsRead(req, res) {
  try {
    const { id } = req.params;
    const alert = await Alert.findById(id);
    if (!alert) {
      return fail(res, 'Alert not found', 404);
    }

    const existing = (alert.deliveryStatus || []).find(s => s.user?.toString() === req.user._id.toString());
    if (existing) {
      existing.status = 'read';
      existing.deliveredAt = existing.deliveredAt || new Date();
    } else {
      alert.deliveryStatus.push({ user: req.user._id, status: 'read', deliveredAt: new Date(), deliveryMethod: 'in_app' });
    }
    await alert.save();
    return ok(res, { alert }, 'Alert marked as read');
  } catch (err) {
    return fail(res, err.message || 'Failed to mark alert as read', 500);
  }
}

// GET /api/alerts/nearby
async function getNearbyAlerts(req, res) {
  try {
    const { lat, lng, radius = 5, type } = req.query;
    if (lat === undefined || lng === undefined) {
      return fail(res, 'Latitude and longitude are required', 400);
    }
    const meters = Number(radius) * 1000;
    const filter = {
      'location.coordinates': {
        $near: {
          $geometry: { type: 'Point', coordinates: [Number(lng), Number(lat)] },
          $maxDistance: meters
        }
      },
      isActive: { $ne: false }
    };
    if (type) {filter.type = type;}

    const alerts = await Alert.find(filter);
    return ok(res, { alerts });
  } catch (err) {
    return fail(res, err.message || 'Failed to fetch nearby alerts', 500);
  }
}

// GET /api/alerts/stats (authority/admin)
async function getAlertStats(req, res) {
  try {
    const totalAlerts = await Alert.countDocuments({});
    const byTypeAgg = await Alert.aggregate([
      { $group: { _id: '$type', count: { $sum: 1 } } }
    ]);
    const byPriorityAgg = await Alert.aggregate([
      { $group: { _id: '$priority', count: { $sum: 1 } } }
    ]);

    const byType = {};
    byTypeAgg.forEach(x => { byType[x._id] = x.count; });
    const byPriority = {};
    byPriorityAgg.forEach(x => { byPriority[x._id] = x.count; });

    return ok(res, { totalAlerts, byType, byPriority });
  } catch (err) {
    return fail(res, err.message || 'Failed to get alert stats', 500);
  }
}

module.exports = {
  createAlert,
  getAlerts,
  getAlertById,
  updateAlert,
  deleteAlert,
  markAlertAsRead,
  getNearbyAlerts,
  getAlertStats
};


