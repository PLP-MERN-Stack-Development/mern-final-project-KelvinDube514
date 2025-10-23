const express = require('express');
const router = express.Router();
const { 
  validateCoordinatesMiddleware, 
  validateBoundsMiddleware,
  validateRouteMiddleware 
} = require('../middleware/locationValidation');
const { 
  createGeospatialQuery, 
  getNearestCity, 
  calculateDistance,
  getSouthAfricaBounds 
} = require('../utils/locationUtils');
const Incident = require('../models/Incident');
const Alert = require('../models/Alert');
const Location = require('../models/Location');
const logger = require('../config/logger');

/**
 * Get incidents within a specific area
 * GET /api/maps/incidents
 */
router.get('/incidents', validateCoordinatesMiddleware, async (req, res, next) => {
  try {
    const { lat, lng, radius } = req.validatedCoordinates;
    const { type, severity, status, limit = 50 } = req.query;
    
    // Build query
    let query = createGeospatialQuery(lat, lng, radius);
    query.isActive = true;
    
    // Add filters
    if (type) query.type = type;
    if (severity) query.severity = severity;
    if (status) query.status = status;
    
    const incidents = await Incident.find(query)
      .populate('reportedBy', 'firstName lastName')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .lean();
    
    // Add distance to each incident
    const incidentsWithDistance = incidents.map(incident => {
      const [lng, lat] = incident.location.coordinates;
      const distance = calculateDistance(lat, lng, lat, lng);
      return {
        ...incident,
        distance: Math.round(distance * 100) / 100 // Round to 2 decimal places
      };
    });
    
    res.json({
      success: true,
      data: incidentsWithDistance,
      count: incidentsWithDistance.length,
      center: { lat, lng },
      radius
    });
  } catch (error) {
    logger.error('Error fetching incidents for map:', error);
    next(error);
  }
});

/**
 * Get alerts within a specific area
 * GET /api/maps/alerts
 */
router.get('/alerts', validateCoordinatesMiddleware, async (req, res, next) => {
  try {
    const { lat, lng, radius } = req.validatedCoordinates;
    const { priority, status, limit = 50 } = req.query;
    
    // Build query
    let query = createGeospatialQuery(lat, lng, radius);
    query.isActive = true;
    
    // Add filters
    if (priority) query.priority = priority;
    if (status) query.status = status;
    
    const alerts = await Alert.find(query)
      .populate('createdBy', 'firstName lastName role')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .lean();
    
    // Add distance to each alert
    const alertsWithDistance = alerts.map(alert => {
      const [lng, lat] = alert.location.coordinates;
      const distance = calculateDistance(lat, lng, lat, lng);
      return {
        ...alert,
        distance: Math.round(distance * 100) / 100
      };
    });
    
    res.json({
      success: true,
      data: alertsWithDistance,
      count: alertsWithDistance.length,
      center: { lat, lng },
      radius
    });
  } catch (error) {
    logger.error('Error fetching alerts for map:', error);
    next(error);
  }
});

/**
 * Get locations within a specific area
 * GET /api/maps/locations
 */
router.get('/locations', validateCoordinatesMiddleware, async (req, res, next) => {
  try {
    const { lat, lng, radius } = req.validatedCoordinates;
    const { type, safetyRating, limit = 100 } = req.query;
    
    // Build query
    let query = createGeospatialQuery(lat, lng, radius);
    query.isActive = true;
    
    // Add filters
    if (type) query.type = type;
    if (safetyRating) query.safetyRating = { $gte: parseInt(safetyRating) };
    
    const locations = await Location.find(query)
      .sort({ safetyRating: -1, name: 1 })
      .limit(parseInt(limit))
      .lean();
    
    // Add distance to each location
    const locationsWithDistance = locations.map(location => {
      const [lng, lat] = location.location.coordinates;
      const distance = calculateDistance(lat, lng, lat, lng);
      return {
        ...location,
        distance: Math.round(distance * 100) / 100
      };
    });
    
    res.json({
      success: true,
      data: locationsWithDistance,
      count: locationsWithDistance.length,
      center: { lat, lng },
      radius
    });
  } catch (error) {
    logger.error('Error fetching locations for map:', error);
    next(error);
  }
});

/**
 * Get map data within bounds
 * GET /api/maps/bounds
 */
router.get('/bounds', validateBoundsMiddleware, async (req, res, next) => {
  try {
    const { north, south, east, west } = req.validatedBounds;
    const { types, limit = 200 } = req.query;
    
    // Create bounds polygon for MongoDB query
    const boundsPolygon = {
      type: 'Polygon',
      coordinates: [[
        [west, south],
        [east, south],
        [east, north],
        [west, north],
        [west, south]
      ]]
    };
    
    // Build base query
    const baseQuery = {
      location: {
        $geoWithin: {
          $geometry: boundsPolygon
        }
      },
      isActive: true
    };
    
    // Fetch data in parallel
    const [incidents, alerts, locations] = await Promise.all([
      Incident.find(baseQuery)
        .populate('reportedBy', 'firstName lastName')
        .sort({ createdAt: -1 })
        .limit(parseInt(limit))
        .lean(),
      Alert.find(baseQuery)
        .populate('createdBy', 'firstName lastName role')
        .sort({ createdAt: -1 })
        .limit(parseInt(limit))
        .lean(),
      Location.find(baseQuery)
        .sort({ safetyRating: -1 })
        .limit(parseInt(limit))
        .lean()
    ]);
    
    res.json({
      success: true,
      data: {
        incidents,
        alerts,
        locations
      },
      bounds: { north, south, east, west },
      counts: {
        incidents: incidents.length,
        alerts: alerts.length,
        locations: locations.length
      }
    });
  } catch (error) {
    logger.error('Error fetching map bounds data:', error);
    next(error);
  }
});

/**
 * Get nearest city information
 * GET /api/maps/nearest-city
 */
router.get('/nearest-city', validateCoordinatesMiddleware, async (req, res, next) => {
  try {
    const { lat, lng } = req.validatedCoordinates;
    
    const nearestCity = getNearestCity(lat, lng);
    
    res.json({
      success: true,
      data: nearestCity
    });
  } catch (error) {
    logger.error('Error getting nearest city:', error);
    next(error);
  }
});

/**
 * Calculate safe route (placeholder for Google Maps Directions API integration)
 * POST /api/maps/route
 */
router.post('/route', validateRouteMiddleware, async (req, res, next) => {
  try {
    const { origin, destination, waypoints } = req.validatedRoute;
    const { avoidHighRiskAreas = true, travelMode = 'driving' } = req.body;
    
    // This is a placeholder implementation
    // In production, you would integrate with Google Maps Directions API
    // or implement your own routing algorithm that considers safety factors
    
    const route = {
      origin,
      destination,
      waypoints,
      travelMode,
      avoidHighRiskAreas,
      distance: '0 km', // Placeholder
      duration: '0 min', // Placeholder
      steps: [], // Placeholder
      warnings: [],
      calculatedAt: new Date()
    };
    
    // Add safety warnings based on incidents in the area
    if (avoidHighRiskAreas) {
      const originQuery = createGeospatialQuery(origin.coordinates[1], origin.coordinates[0], 5);
      const destinationQuery = createGeospatialQuery(destination.coordinates[1], destination.coordinates[0], 5);
      
      const [originIncidents, destinationIncidents] = await Promise.all([
        Incident.find({ ...originQuery, severity: { $in: ['high', 'critical'] } }).countDocuments(),
        Incident.find({ ...destinationQuery, severity: { $in: ['high', 'critical'] } }).countDocuments()
      ]);
      
      if (originIncidents > 0) {
        route.warnings.push(`High-risk area near origin: ${originIncidents} recent incidents`);
      }
      
      if (destinationIncidents > 0) {
        route.warnings.push(`High-risk area near destination: ${destinationIncidents} recent incidents`);
      }
    }
    
    res.json({
      success: true,
      data: route
    });
  } catch (error) {
    logger.error('Error calculating route:', error);
    next(error);
  }
});

/**
 * Get South Africa bounds for map initialization
 * GET /api/maps/bounds/south-africa
 */
router.get('/bounds/south-africa', (req, res) => {
  try {
    const bounds = getSouthAfricaBounds();
    
    res.json({
      success: true,
      data: {
        bounds,
        center: { lat: -28.4793, lng: 24.6727 }, // Center of South Africa
        zoom: 6
      }
    });
  } catch (error) {
    logger.error('Error getting South Africa bounds:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get South Africa bounds'
    });
  }
});

/**
 * Get map statistics
 * GET /api/maps/stats
 */
router.get('/stats', validateCoordinatesMiddleware, async (req, res, next) => {
  try {
    const { lat, lng, radius } = req.validatedCoordinates;
    
    // Get statistics for the area
    const query = createGeospatialQuery(lat, lng, radius);
    
    const [
      totalIncidents,
      activeIncidents,
      totalAlerts,
      activeAlerts,
      totalLocations,
      verifiedLocations
    ] = await Promise.all([
      Incident.countDocuments({ ...query, isActive: true }),
      Incident.countDocuments({ ...query, isActive: true, status: { $ne: 'resolved' } }),
      Alert.countDocuments({ ...query, isActive: true }),
      Alert.countDocuments({ ...query, isActive: true, status: { $ne: 'expired' } }),
      Location.countDocuments({ ...query, isActive: true }),
      Location.countDocuments({ ...query, isActive: true, isVerified: true })
    ]);
    
    // Get severity breakdown
    const severityBreakdown = await Incident.aggregate([
      { $match: { ...query, isActive: true } },
      { $group: { _id: '$severity', count: { $sum: 1 } } }
    ]);
    
    res.json({
      success: true,
      data: {
        center: { lat, lng },
        radius,
        incidents: {
          total: totalIncidents,
          active: activeIncidents,
          severity: severityBreakdown.reduce((acc, item) => {
            acc[item._id] = item.count;
            return acc;
          }, {})
        },
        alerts: {
          total: totalAlerts,
          active: activeAlerts
        },
        locations: {
          total: totalLocations,
          verified: verifiedLocations
        }
      }
    });
  } catch (error) {
    logger.error('Error getting map statistics:', error);
    next(error);
  }
});

module.exports = router;
