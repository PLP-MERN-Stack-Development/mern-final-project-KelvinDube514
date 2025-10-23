# Technical Context - SecurePath Backend

## Technology Stack

### Core Backend
- **Runtime**: Node.js (>=18.0.0)
- **Framework**: Express.js 5.1.0
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT with bcryptjs for password hashing
- **Real-time**: Socket.io for WebSocket connections

### Key Dependencies
- **Security**: Helmet, express-rate-limit, CORS
- **Validation**: Joi for input validation
- **Logging**: Winston for structured logging
- **File Upload**: Multer for media handling
- **Testing**: Jest with Supertest and MongoDB Memory Server

### Database Configuration
- **Primary Database**: MongoDB Atlas - securepathdb.zq4orio.mongodb.net
- **Connection**: Mongoose with connection pooling and monitoring
- **Indexes**: Geospatial (2dsphere) indexes for location queries
- **Collections**: Users, Incidents, Alerts, Locations

### Environment Configuration
```
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb+srv://kelvintshimane911_db_user:mX105WwweJiJ102v@securepathdb.zq4orio.mongodb.net/securepath
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRE=7d
REFRESH_TOKEN_SECRET=your_refresh_token_secret_here
REFRESH_TOKEN_EXPIRE=30d
UPLOAD_PATH=./uploads
MAX_FILE_SIZE=5242880
CORS_ORIGIN=http://localhost:5173
```

### API Architecture
- **RESTful Design**: Standard HTTP methods and status codes
- **Endpoint Structure**: /api/{resource} pattern
- **Authentication**: Bearer token in Authorization header
- **Error Handling**: Standardized error responses with proper HTTP codes
- **Rate Limiting**: General and endpoint-specific rate limits

### Security Features
- **Helmet**: Security headers and XSS protection
- **CORS**: Configurable cross-origin resource sharing
- **Input Validation**: Joi schemas for all incoming data
- **Password Security**: bcryptjs with salt rounds of 12
- **JWT Security**: Secure token generation and verification
- **Request Logging**: Comprehensive request/response logging

### Real-time Features
- **Socket.io Integration**: Authenticated WebSocket connections
- **Location-based Rooms**: Users join rooms based on geographic location
- **Event Broadcasting**: Incident reports and emergency alerts
- **Connection Management**: User presence tracking and disconnection handling

### Development Tools
- **Linting**: ESLint with custom configuration
- **Testing**: Jest with 121 comprehensive tests
- **Development Server**: Nodemon for auto-reload
- **Code Coverage**: Jest coverage reporting
- **Scripts**: NPM scripts for testing, linting, and data seeding
