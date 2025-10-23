/**
 * Location utilities for South Africa validation and geospatial operations
 */

// South Africa geographic boundaries
const SOUTH_AFRICA_BOUNDS = {
  north: -22.1255,  // Northern border
  south: -34.8192,  // Southern border  
  east: 32.8301,    // Eastern border
  west: 16.4699     // Western border
};

// Major South African cities for reference
const MAJOR_CITIES = [
  { name: 'Johannesburg', lat: -26.2041, lng: 28.0473, province: 'Gauteng' },
  { name: 'Cape Town', lat: -33.9249, lng: 18.4241, province: 'Western Cape' },
  { name: 'Durban', lat: -29.8587, lng: 31.0218, province: 'KwaZulu-Natal' },
  { name: 'Pretoria', lat: -25.7479, lng: 28.2293, province: 'Gauteng' },
  { name: 'Port Elizabeth', lat: -33.9608, lng: 25.6022, province: 'Eastern Cape' },
  { name: 'Bloemfontein', lat: -29.0852, lng: 26.1596, province: 'Free State' },
  { name: 'Polokwane', lat: -23.9008, lng: 29.4519, province: 'Limpopo' },
  { name: 'Nelspruit', lat: -25.4745, lng: 30.9703, province: 'Mpumalanga' },
  { name: 'Kimberley', lat: -28.7282, lng: 24.7499, province: 'Northern Cape' },
  { name: 'Mahikeng', lat: -25.8652, lng: 25.6442, province: 'North West' }
];

/**
 * Validate if coordinates are within South Africa
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @returns {boolean} - True if within South Africa
 */
const isWithinSouthAfrica = (lat, lng) => {
  if (typeof lat !== 'number' || typeof lng !== 'number') {
    return false;
  }
  
  return lat >= SOUTH_AFRICA_BOUNDS.south && 
         lat <= SOUTH_AFRICA_BOUNDS.north && 
         lng >= SOUTH_AFRICA_BOUNDS.west && 
         lng <= SOUTH_AFRICA_BOUNDS.east;
};

/**
 * Validate location object
 * @param {Object} location - Location object with coordinates
 * @returns {Object} - Validation result
 */
const validateLocation = (location) => {
  const errors = [];
  
  if (!location) {
    errors.push('Location is required');
    return { isValid: false, errors };
  }
  
  if (!location.coordinates || !Array.isArray(location.coordinates)) {
    errors.push('Location coordinates are required and must be an array');
    return { isValid: false, errors };
  }
  
  if (location.coordinates.length !== 2) {
    errors.push('Location coordinates must contain exactly 2 values [longitude, latitude]');
    return { isValid: false, errors };
  }
  
  const [lng, lat] = location.coordinates;
  
  if (typeof lng !== 'number' || typeof lat !== 'number') {
    errors.push('Longitude and latitude must be numbers');
    return { isValid: false, errors };
  }
  
  if (lng < -180 || lng > 180) {
    errors.push('Longitude must be between -180 and 180');
  }
  
  if (lat < -90 || lat > 90) {
    errors.push('Latitude must be between -90 and 90');
  }
  
  if (!isWithinSouthAfrica(lat, lng)) {
    errors.push('Location must be within South Africa');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Calculate distance between two points using Haversine formula
 * @param {number} lat1 - First point latitude
 * @param {number} lng1 - First point longitude
 * @param {number} lat2 - Second point latitude
 * @param {number} lng2 - Second point longitude
 * @returns {number} - Distance in kilometers
 */
const calculateDistance = (lat1, lng1, lat2, lng2) => {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

/**
 * Get South Africa bounds for MongoDB geospatial queries
 * @returns {Object} - Bounds object for MongoDB
 */
const getSouthAfricaBounds = () => {
  return {
    type: 'Polygon',
    coordinates: [[
      [SOUTH_AFRICA_BOUNDS.west, SOUTH_AFRICA_BOUNDS.south],
      [SOUTH_AFRICA_BOUNDS.east, SOUTH_AFRICA_BOUNDS.south],
      [SOUTH_AFRICA_BOUNDS.east, SOUTH_AFRICA_BOUNDS.north],
      [SOUTH_AFRICA_BOUNDS.west, SOUTH_AFRICA_BOUNDS.north],
      [SOUTH_AFRICA_BOUNDS.west, SOUTH_AFRICA_BOUNDS.south]
    ]]
  };
};

/**
 * Create MongoDB geospatial query for South Africa
 * @param {number} lat - Center latitude
 * @param {number} lng - Center longitude
 * @param {number} radius - Radius in kilometers
 * @returns {Object} - MongoDB query object
 */
const createGeospatialQuery = (lat, lng, radius = 10) => {
  if (!isWithinSouthAfrica(lat, lng)) {
    throw new Error('Center point must be within South Africa');
  }
  
  return {
    location: {
      $geoWithin: {
        $centerSphere: [[lng, lat], radius / 6371] // Convert km to radians
      }
    }
  };
};

/**
 * Get nearest major city to given coordinates
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @returns {Object} - Nearest city object
 */
const getNearestCity = (lat, lng) => {
  let nearestCity = null;
  let minDistance = Infinity;
  
  MAJOR_CITIES.forEach(city => {
    const distance = calculateDistance(lat, lng, city.lat, city.lng);
    if (distance < minDistance) {
      minDistance = distance;
      nearestCity = { ...city, distance };
    }
  });
  
  return nearestCity;
};

/**
 * Format coordinates for display
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @param {number} precision - Decimal places (default: 6)
 * @returns {string} - Formatted coordinates
 */
const formatCoordinates = (lat, lng, precision = 6) => {
  return `${lat.toFixed(precision)}, ${lng.toFixed(precision)}`;
};

/**
 * Parse address string to extract location components
 * @param {string} address - Full address string
 * @returns {Object} - Parsed address components
 */
const parseAddress = (address) => {
  if (!address || typeof address !== 'string') {
    return null;
  }
  
  // Simple parsing for South African addresses
  // This is a basic implementation - in production, use a proper geocoding service
  const parts = address.split(',').map(part => part.trim());
  
  return {
    street: parts[0] || '',
    city: parts[1] || '',
    state: parts[2] || '',
    zipCode: parts[3] || '',
    country: 'South Africa'
  };
};

/**
 * Validate and sanitize location data for database storage
 * @param {Object} locationData - Raw location data
 * @returns {Object} - Sanitized location data
 */
const sanitizeLocationData = (locationData) => {
  if (!locationData) {
    return null;
  }
  
  const sanitized = {
    type: 'Point',
    coordinates: [0, 0], // Default to center of South Africa
    address: {
      street: '',
      city: '',
      state: '',
      zipCode: '',
      country: 'South Africa'
    }
  };
  
  // Validate and set coordinates
  if (locationData.coordinates && Array.isArray(locationData.coordinates)) {
    const [lng, lat] = locationData.coordinates;
    if (typeof lng === 'number' && typeof lat === 'number' && isWithinSouthAfrica(lat, lng)) {
      sanitized.coordinates = [lng, lat];
    }
  }
  
  // Set address components
  if (locationData.address) {
    if (typeof locationData.address === 'string') {
      const parsed = parseAddress(locationData.address);
      if (parsed) {
        sanitized.address = { ...sanitized.address, ...parsed };
      }
    } else if (typeof locationData.address === 'object') {
      sanitized.address = { ...sanitized.address, ...locationData.address };
    }
  }
  
  return sanitized;
};

module.exports = {
  SOUTH_AFRICA_BOUNDS,
  MAJOR_CITIES,
  isWithinSouthAfrica,
  validateLocation,
  calculateDistance,
  getSouthAfricaBounds,
  createGeospatialQuery,
  getNearestCity,
  formatCoordinates,
  parseAddress,
  sanitizeLocationData
};
