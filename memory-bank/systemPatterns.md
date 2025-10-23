# System Patterns - SecurePath Backend Architecture

## Core Architectural Patterns

### MVC Architecture
- **Models**: Mongoose schemas with validation and middleware
- **Controllers**: Business logic handlers for each resource
- **Routes**: Express router modules with middleware chains
- **Middleware**: Authentication, validation, and security layers

### Database Design Patterns

#### Geospatial Schema
```javascript
location: {
  type: { type: String, enum: ['Point'], default: 'Point' },
  coordinates: [Number], // [longitude, latitude]
  address: { street, city, state, zipCode, country }
}
```

#### Role-Based Access Control
```javascript
role: { type: String, enum: ['citizen', 'authority', 'admin'], default: 'citizen' }
```

#### Soft Delete Pattern
```javascript
isActive: { type: Boolean, default: true }
```

### Authentication Flow
1. User registration with email/password
2. JWT token generation on login
3. Token verification middleware on protected routes
4. Role-based authorization for specific endpoints
5. Refresh token mechanism for extended sessions

### Error Handling Pattern
```javascript
// Standardized error response
{
  success: false,
  message: "User-friendly error message",
  errors: [{ field: "fieldName", message: "Specific validation error" }],
  statusCode: 400
}
```

### Validation Pattern
- Joi schemas for input validation
- Middleware wrapper for validation logic
- Detailed error messages for client debugging
- Sanitization of input data

### Logging Pattern
```javascript
// Winston structured logging
logger.info('Operation completed', {
  userId: req.user._id,
  action: 'incident_created',
  incidentId: incident._id,
  timestamp: new Date(),
  service: 'securepath-api'
});
```

## Real-time Communication Patterns

### Socket.io Event Handling
- **Connection**: User authentication and room joining
- **Location Updates**: Dynamic room management based on coordinates
- **Broadcasting**: Incident reports and emergency alerts
- **Disconnection**: Cleanup and room management

### Room Management Strategy
```javascript
// Location-based rooms (rounded to 2 decimal places)
const locationKey = `${Math.round(lat * 100) / 100},${Math.round(lng * 100) / 100}`;
socket.join(`location:${locationKey}`);
```

## Data Access Patterns

### Mongoose Middleware
- **Pre-save**: Password hashing, data validation
- **Pre-find**: Soft delete filtering
- **Post-save**: Logging and event triggering

### Aggregation Patterns
```javascript
// Geospatial queries with distance calculation
const nearbyIncidents = await Incident.aggregate([
  {
    $geoNear: {
      near: { type: "Point", coordinates: [lng, lat] },
      distanceField: "distance",
      maxDistance: radius * 1000,
      spherical: true
    }
  }
]);
```

### Index Strategy
- **Geospatial**: 2dsphere indexes for location queries
- **Compound**: Combined indexes for filtering and sorting
- **Unique**: Email uniqueness constraints
- **TTL**: Automatic cleanup for temporary tokens

## Security Patterns

### Middleware Chain
1. **Security Headers**: Helmet for XSS protection
2. **CORS**: Cross-origin request handling
3. **Rate Limiting**: Request throttling
4. **Authentication**: JWT token verification
5. **Authorization**: Role-based access control
6. **Validation**: Input sanitization and validation

### Input Sanitization
- Joi schema validation
- MongoDB injection prevention
- XSS protection through encoding
- File upload restrictions

## Testing Patterns

### Test Structure
- **Setup**: MongoDB Memory Server for isolated testing
- **Mocking**: Global test utilities for common operations
- **Coverage**: 121 tests across 5 test suites
- **Integration**: Full request/response cycle testing

### Test Categories
- **Unit Tests**: Model validation and utility functions
- **Integration Tests**: API endpoint functionality
- **Middleware Tests**: Authentication and validation
- **Error Tests**: Error handling and edge cases
