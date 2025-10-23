# SecurePath Backend API

A robust RESTful API for SecurePath - Real-time neighborhood safety & alert system built with Node.js, Express.js, MongoDB, and Socket.io.

## 🚀 Features

- **Authentication & Authorization**: JWT-based auth with role-based access control
- **Real-time Communication**: Socket.io for live alerts and updates
- **Incident Management**: Report, track, and verify safety incidents
- **Location-based Services**: Geospatial queries for nearby incidents
- **Community Verification**: Voting system for incident credibility
- **Security**: Rate limiting, input validation, and security headers
- **Comprehensive Testing**: Unit and integration tests with Jest
- **Logging**: Structured logging with Winston

## 🛠️ Tech Stack

- **Runtime**: Node.js (v18+)
- **Framework**: Express.js
- **Database**: MongoDB Atlas
- **Real-time**: Socket.io
- **Authentication**: JWT + bcrypt
- **Validation**: Joi
- **Testing**: Jest + Supertest
- **Logging**: Winston
- **Security**: Helmet, CORS, Rate Limiting

## 📋 Prerequisites

- Node.js (v18 or higher)
- MongoDB Atlas account
- npm or yarn

## 🚀 Quick Start

### 1. Clone and Install

```bash
cd backend
npm install
```

### 2. Environment Setup

Copy the example environment file and configure your variables:

```bash
cp env.example .env
```

Update `.env` with your configuration:

```env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb+srv://your-connection-string
JWT_SECRET=your-jwt-secret-key
JWT_EXPIRE=7d
REFRESH_TOKEN_SECRET=your-refresh-token-secret
REFRESH_TOKEN_EXPIRE=30d
UPLOAD_PATH=./uploads
MAX_FILE_SIZE=5242880
CORS_ORIGIN=http://localhost:3000
```

### 3. Start Development Server

```bash
npm run dev
```

The API will be available at `http://localhost:5000`

## 📚 API Documentation

### Base URL
```
http://localhost:5000/api
```

### Authentication Endpoints

| Method | Endpoint | Description | Access |
|--------|----------|-------------|---------|
| POST | `/auth/register` | Register new user | Public |
| POST | `/auth/login` | User login | Public |
| GET | `/auth/me` | Get current user | Private |
| PUT | `/auth/profile` | Update profile | Private |
| PUT | `/auth/change-password` | Change password | Private |
| POST | `/auth/verify-email` | Verify email | Public |
| POST | `/auth/forgot-password` | Request password reset | Public |
| POST | `/auth/reset-password` | Reset password | Public |
| POST | `/auth/logout` | Logout user | Private |

### Incident Endpoints

| Method | Endpoint | Description | Access |
|--------|----------|-------------|---------|
| GET | `/incidents` | Get all incidents | Private |
| GET | `/incidents/:id` | Get incident by ID | Private |
| POST | `/incidents` | Create new incident | Private |
| PUT | `/incidents/:id` | Update incident | Private |
| DELETE | `/incidents/:id` | Delete incident | Private |
| POST | `/incidents/:id/vote` | Vote on incident | Private |
| GET | `/incidents/nearby` | Get nearby incidents | Public |
| GET | `/incidents/stats` | Get incident statistics | Admin/Authority |

### Health Check

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | API health status |

## 🔐 Authentication

The API uses JWT (JSON Web Tokens) for authentication. Include the token in the Authorization header:

```bash
Authorization: Bearer <your-jwt-token>
```

### User Roles

- **citizen**: Regular users who can report incidents and vote
- **authority**: Police/emergency services who can verify incidents
- **admin**: System administrators with full access

## 🌍 Real-time Features (Socket.io)

Connect to the Socket.io server for real-time updates:

```javascript
import io from 'socket.io-client';

const socket = io('http://localhost:5000', {
  auth: {
    token: 'your-jwt-token'
  }
});

// Listen for new incidents
socket.on('new-incident', (incident) => {
  console.log('New incident:', incident);
});

// Listen for emergency alerts
socket.on('emergency-alert', (alert) => {
  console.log('Emergency alert:', alert);
});
```

### Socket Events

#### Client → Server
- `update-location`: Update user location
- `report-incident`: Report incident in real-time
- `incident-updated`: Update incident status
- `broadcast-alert`: Broadcast emergency alert (Authority only)

#### Server → Client
- `connected`: Connection confirmation
- `new-incident`: New incident reported nearby
- `incident-update`: Incident status updated
- `emergency-alert`: Emergency alert broadcast
- `user-typing`: User typing indicator
- `error`: Error messages

## 🧪 Testing

Run the test suite:

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

### Test Coverage

The test suite covers:
- Authentication flows
- Incident CRUD operations
- Authorization and permissions
- Real-time functionality
- Error handling
- Input validation

## 📊 Database Schema

### Users Collection
```javascript
{
  firstName: String,
  lastName: String,
  email: String (unique),
  password: String (hashed),
  role: String (citizen|authority|admin),
  location: {
    type: "Point",
    coordinates: [Number, Number]
  },
  preferences: {
    notifications: Object,
    alertRadius: Number
  },
  isVerified: Boolean,
  isActive: Boolean
}
```

### Incidents Collection
```javascript
{
  title: String,
  description: String,
  type: String (enum),
  severity: String (low|medium|high|critical),
  status: String (reported|verified|investigating|resolved),
  location: {
    type: "Point",
    coordinates: [Number, Number]
  },
  reportedBy: ObjectId,
  verifiedBy: ObjectId,
  communityVotes: [{
    user: ObjectId,
    vote: String (confirm|deny|unclear)
  }],
  verificationScore: Number,
  images: [Object],
  isActive: Boolean
}
```

## 🔒 Security Features

- **Rate Limiting**: Prevents API abuse
- **Input Validation**: Joi schema validation
- **CORS**: Configurable cross-origin requests
- **Helmet**: Security headers
- **Password Hashing**: bcrypt with salt rounds
- **JWT Expiration**: Configurable token lifetimes
- **File Upload Security**: Type and size validation

## 📝 Scripts

| Script | Description |
|--------|-------------|
| `npm start` | Start production server |
| `npm run dev` | Start development server with nodemon |
| `npm test` | Run test suite |
| `npm run test:watch` | Run tests in watch mode |
| `npm run test:coverage` | Run tests with coverage report |
| `npm run lint` | Run ESLint |
| `npm run lint:fix` | Fix ESLint errors |
| `npm run format` | Format code with Prettier |

## 🌐 Deployment

### Environment Variables for Production

```env
NODE_ENV=production
PORT=5000
MONGODB_URI=mongodb+srv://your-production-connection
JWT_SECRET=your-production-jwt-secret
CORS_ORIGIN=https://your-frontend-domain.com
```

### Docker Deployment (Optional)

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 5000
CMD ["npm", "start"]
```

## 📈 Monitoring & Logging

- **Winston Logger**: Structured logging with different levels
- **Request Logging**: HTTP request/response logging
- **Error Tracking**: Comprehensive error logging
- **Health Checks**: `/health` endpoint for monitoring

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Check the API documentation
- Review the test files for usage examples

## 🗺️ Roadmap

- [ ] Alert management system
- [ ] Location-based services
- [ ] File upload handling
- [ ] Push notifications
- [ ] Analytics dashboard
- [ ] Mobile API optimization
