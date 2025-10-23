const { validateLocation, isWithinSouthAfrica } = require('../utils/locationUtils');
const logger = require('../config/logger');

/**
 * Middleware to validate location data in request body
 */
const validateLocationMiddleware = (req, res, next) => {
  try {
    const { location } = req.body;
    
    if (!location) {
      return res.status(400).json({
        success: false,
        message: 'Location is required',
        errors: [{ field: 'location', message: 'Location data is required' }]
      });
    }
    
    const validation = validateLocation(location);
    
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        message: 'Invalid location data',
        errors: validation.errors.map(error => ({ field: 'location', message: error }))
      });
    }
    
    // Add validated location to request
    req.validatedLocation = location;
    next();
  } catch (error) {
    logger.error('Location validation error:', error);
    res.status(500).json({
      success: false,
      message: 'Location validation failed',
      errors: [{ field: 'location', message: 'Internal validation error' }]
    });
  }
};

/**
 * Middleware to validate coordinates in query parameters
 */
const validateCoordinatesMiddleware = (req, res, next) => {
  try {
    const { lat, lng, radius } = req.query;
    
    if (!lat || !lng) {
      return res.status(400).json({
        success: false,
        message: 'Latitude and longitude are required',
        errors: [{ field: 'coordinates', message: 'lat and lng query parameters are required' }]
      });
    }
    
    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);
    
    if (isNaN(latitude) || isNaN(longitude)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid coordinates format',
        errors: [{ field: 'coordinates', message: 'lat and lng must be valid numbers' }]
      });
    }
    
    if (!isWithinSouthAfrica(latitude, longitude)) {
      return res.status(400).json({
        success: false,
        message: 'Coordinates must be within South Africa',
        errors: [{ field: 'coordinates', message: 'Location must be within South Africa boundaries' }]
      });
    }
    
    // Validate radius if provided
    if (radius) {
      const radiusNum = parseFloat(radius);
      if (isNaN(radiusNum) || radiusNum <= 0 || radiusNum > 100) {
        return res.status(400).json({
          success: false,
          message: 'Invalid radius',
          errors: [{ field: 'radius', message: 'Radius must be a number between 0 and 100 kilometers' }]
        });
      }
    }
    
    // Add validated coordinates to request
    req.validatedCoordinates = {
      lat: latitude,
      lng: longitude,
      radius: radius ? parseFloat(radius) : 10 // Default 10km radius
    };
    
    next();
  } catch (error) {
    logger.error('Coordinates validation error:', error);
    res.status(500).json({
      success: false,
      message: 'Coordinates validation failed',
      errors: [{ field: 'coordinates', message: 'Internal validation error' }]
    });
  }
};

/**
 * Middleware to validate location bounds for map queries
 */
const validateBoundsMiddleware = (req, res, next) => {
  try {
    const { north, south, east, west } = req.query;
    
    if (!north || !south || !east || !west) {
      return res.status(400).json({
        success: false,
        message: 'Map bounds are required',
        errors: [{ field: 'bounds', message: 'north, south, east, and west parameters are required' }]
      });
    }
    
    const bounds = {
      north: parseFloat(north),
      south: parseFloat(south),
      east: parseFloat(east),
      west: parseFloat(west)
    };
    
    // Validate bounds are numbers
    if (Object.values(bounds).some(val => isNaN(val))) {
      return res.status(400).json({
        success: false,
        message: 'Invalid bounds format',
        errors: [{ field: 'bounds', message: 'All bounds values must be valid numbers' }]
      });
    }
    
    // Validate bounds are within South Africa
    if (!isWithinSouthAfrica(bounds.north, bounds.west) || 
        !isWithinSouthAfrica(bounds.south, bounds.east)) {
      return res.status(400).json({
        success: false,
        message: 'Bounds must be within South Africa',
        errors: [{ field: 'bounds', message: 'Map bounds must be within South Africa boundaries' }]
      });
    }
    
    // Validate bounds make sense
    if (bounds.north <= bounds.south || bounds.east <= bounds.west) {
      return res.status(400).json({
        success: false,
        message: 'Invalid bounds values',
        errors: [{ field: 'bounds', message: 'North must be greater than south, east must be greater than west' }]
      });
    }
    
    req.validatedBounds = bounds;
    next();
  } catch (error) {
    logger.error('Bounds validation error:', error);
    res.status(500).json({
      success: false,
      message: 'Bounds validation failed',
      errors: [{ field: 'bounds', message: 'Internal validation error' }]
    });
  }
};

/**
 * Middleware to validate route waypoints
 */
const validateRouteMiddleware = (req, res, next) => {
  try {
    const { origin, destination, waypoints } = req.body;
    
    if (!origin || !destination) {
      return res.status(400).json({
        success: false,
        message: 'Origin and destination are required',
        errors: [{ field: 'route', message: 'Origin and destination coordinates are required' }]
      });
    }
    
    // Validate origin
    const originValidation = validateLocation(origin);
    if (!originValidation.isValid) {
      return res.status(400).json({
        success: false,
        message: 'Invalid origin location',
        errors: originValidation.errors.map(error => ({ field: 'origin', message: error }))
      });
    }
    
    // Validate destination
    const destinationValidation = validateLocation(destination);
    if (!destinationValidation.isValid) {
      return res.status(400).json({
        success: false,
        message: 'Invalid destination location',
        errors: destinationValidation.errors.map(error => ({ field: 'destination', message: error }))
      });
    }
    
    // Validate waypoints if provided
    if (waypoints && Array.isArray(waypoints)) {
      for (let i = 0; i < waypoints.length; i++) {
        const waypointValidation = validateLocation(waypoints[i]);
        if (!waypointValidation.isValid) {
          return res.status(400).json({
            success: false,
            message: `Invalid waypoint at index ${i}`,
            errors: waypointValidation.errors.map(error => ({ field: `waypoints[${i}]`, message: error }))
          });
        }
      }
    }
    
    req.validatedRoute = {
      origin,
      destination,
      waypoints: waypoints || []
    };
    
    next();
  } catch (error) {
    logger.error('Route validation error:', error);
    res.status(500).json({
      success: false,
      message: 'Route validation failed',
      errors: [{ field: 'route', message: 'Internal validation error' }]
    });
  }
};

module.exports = {
  validateLocationMiddleware,
  validateCoordinatesMiddleware,
  validateBoundsMiddleware,
  validateRouteMiddleware
};
