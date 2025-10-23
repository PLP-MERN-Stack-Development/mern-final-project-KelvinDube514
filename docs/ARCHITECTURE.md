# Technical Architecture Overview

## Table of Contents

1. [System Overview](#system-overview)
2. [Architecture Diagram](#architecture-diagram)
3. [Technology Stack](#technology-stack)
4. [System Components](#system-components)
5. [Data Flow](#data-flow)
6. [Database Schema](#database-schema)
7. [Security Architecture](#security-architecture)
8. [Scalability](#scalability)
9. [Performance Optimization](#performance-optimization)
10. [Monitoring and Logging](#monitoring-and-logging)

---

## System Overview

Community Safe Path is a full-stack web application built with modern technologies, following a client-server architecture with real-time capabilities.

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         Client Layer                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   React UI   │  │  React Query │  │  Socket.IO   │      │
│  │  (TypeScript)│  │   (State)    │  │   Client     │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ HTTPS/WSS
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      Application Layer                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  Express.js  │  │  Socket.IO   │  │     JWT      │      │
│  │   REST API   │  │    Server    │  │     Auth     │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ MongoDB Protocol
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                        Data Layer                            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   MongoDB    │  │    Redis     │  │   File       │      │
│  │   Database   │  │    Cache     │  │   Storage    │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                              │
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    External Services                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Google Maps  │  │    Sentry    │  │   SendGrid   │      │
│  │     API      │  │    Error     │  │    Email     │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
```

---

## Architecture Diagram

### Component Architecture

```
Frontend (React + TypeScript)
├── Components
│   ├── UI Components (shadcn/ui)
│   ├── Feature Components
│   ├── Layout Components
│   └── Form Components
├── Services
│   ├── API Service
│   ├── Notification Service
│   └── Real-time Service
├── State Management
│   ├── React Query (Server State)
│   └── Context API (UI State)
├── Routing
│   └── React Router
└── Utilities
    ├── Validation (Zod)
    ├── Formatting
    └── Helpers

Backend (Node.js + Express)
├── Routes
│   ├── Auth Routes
│   ├── Incident Routes
│   ├── Alert Routes
│   └── User Routes
├── Controllers
│   ├── Auth Controller
│   ├── Incident Controller
│   ├── Alert Controller
│   └── User Controller
├── Middleware
│   ├── Authentication
│   ├── Authorization
│   ├── Validation
│   ├── Error Handler
│   └── Rate Limiter
├── Models
│   ├── User Model
│   ├── Incident Model
│   ├── Alert Model
│   └── Comment Model
├── Services
│   ├── Analytics Service
│   ├── Metrics Service
│   └── Notification Service
└── Utilities
    ├── Logger
    ├── Validators
    └── Helpers
```

---

## Technology Stack

### Frontend Technologies

| Technology | Version | Purpose |
|------------|---------|---------|
| React | 18.3.1 | UI Framework |
| TypeScript | 5.8.3 | Type Safety |
| Vite | 5.4.19 | Build Tool |
| TanStack Query | 5.83.0 | Server State Management |
| React Router | 6.30.1 | Routing |
| Tailwind CSS | 3.4.17 | Styling |
| shadcn/ui | Latest | UI Components |
| Radix UI | Latest | Accessible Components |
| Socket.IO Client | 4.8.1 | Real-time Communication |
| React Hook Form | 7.61.1 | Form Management |
| Zod | 3.25.76 | Schema Validation |
| Leaflet | 1.9.4 | Maps |
| Recharts | 2.15.4 | Charts |
| Sentry | 8.31.0 | Error Tracking |

### Backend Technologies

| Technology | Version | Purpose |
|------------|---------|---------|
| Node.js | 18/20 | Runtime |
| Express.js | 5.1.0 | Web Framework |
| MongoDB | 8.18.1 | Database |
| Mongoose | 8.18.1 | ODM |
| Socket.IO | 4.8.1 | Real-time Communication |
| JWT | 9.0.2 | Authentication |
| bcryptjs | 3.0.2 | Password Hashing |
| Joi | 18.0.1 | Validation |
| Winston | 3.17.0 | Logging |
| Helmet | 8.1.0 | Security |
| CORS | 2.8.5 | Cross-Origin |
| Multer | 2.0.2 | File Upload |
| Sentry | 8.31.0 | Error Tracking |

### DevOps & Tools

| Tool | Purpose |
|------|---------|
| Docker | Containerization |
| GitHub Actions | CI/CD |
| Jest | Backend Testing |
| Vitest | Frontend Testing |
| Playwright | E2E Testing |
| ESLint | Linting |
| Prettier | Code Formatting |
| MongoDB Atlas | Database Hosting |
| Render | Backend Hosting |
| Netlify | Frontend Hosting |

---

## System Components

### 1. Frontend Application

#### Component Structure

```typescript
// Component Hierarchy
App
├── ThemeProvider
│   └── QueryClientProvider
│       └── Router
│           ├── PublicRoutes
│           │   ├── Homepage
│           │   ├── Login
│           │   └── Signup
│           └── ProtectedRoutes
│               ├── Dashboard
│               ├── Map
│               ├── ReportIncident
│               ├── Profile
│               └── Notifications
```

#### State Management Strategy

**Server State (React Query)**:
- API data caching
- Automatic refetching
- Optimistic updates
- Background synchronization

**UI State (Context API)**:
- Theme (dark/light)
- User preferences
- Modal states
- Toast notifications

#### Routing Strategy

```typescript
// Route Configuration
const routes = [
  {
    path: '/',
    element: <Homepage />,
    public: true
  },
  {
    path: '/dashboard',
    element: <ProtectedRoute><Dashboard /></ProtectedRoute>,
    requiresAuth: true
  },
  {
    path: '/map',
    element: <SafetyMap />,
    public: true
  },
  {
    path: '/report',
    element: <ProtectedRoute><ReportAlert /></ProtectedRoute>,
    requiresAuth: true
  }
];
```

### 2. Backend Application

#### Layered Architecture

```
┌─────────────────────────────────────┐
│         Presentation Layer          │
│  (Routes, Controllers, Middleware)  │
└─────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────┐
│          Business Layer             │
│     (Services, Business Logic)      │
└─────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────┐
│           Data Layer                │
│      (Models, Database Access)      │
└─────────────────────────────────────┘
```

#### Request Flow

```
1. Client Request
   ↓
2. CORS Middleware
   ↓
3. Rate Limiter
   ↓
4. Body Parser
   ↓
5. Authentication Middleware (if required)
   ↓
6. Authorization Middleware (if required)
   ↓
7. Validation Middleware
   ↓
8. Route Handler
   ↓
9. Controller
   ↓
10. Service Layer
   ↓
11. Database Query
   ↓
12. Response Formatter
   ↓
13. Error Handler (if error)
   ↓
14. Client Response
```

#### Middleware Stack

```javascript
// Middleware Order
app.use(helmet());              // Security headers
app.use(cors());                // CORS
app.use(express.json());        // Body parser
app.use(rateLimiter);           // Rate limiting
app.use(logger);                // Request logging
app.use('/api', routes);        // Routes
app.use(errorHandler);          // Error handling
```

### 3. Real-time Communication

#### WebSocket Architecture

```
Client                          Server
  │                               │
  │  ──── Connect (Socket.IO) ──→ │
  │                               │
  │  ←─── Authentication ────────  │
  │                               │
  │  ──── Join Rooms ───────────→ │
  │  (location-based, user-specific)
  │                               │
  │  ←─── New Incident ──────────  │
  │  ←─── New Alert ─────────────  │
  │  ←─── Status Update ─────────  │
  │                               │
  │  ──── Disconnect ───────────→ │
```

#### Socket Events

**Client → Server**:
- `join-location`: Join location-based room
- `leave-location`: Leave location-based room
- `incident-update`: Update incident status
- `typing`: User typing indicator

**Server → Client**:
- `new-incident`: New incident created
- `incident-updated`: Incident status changed
- `new-alert`: New alert issued
- `alert-expired`: Alert expired
- `user-joined`: User joined location

---

## Data Flow

### Incident Reporting Flow

```
1. User fills form
   ↓
2. Client-side validation (Zod)
   ↓
3. API request with JWT token
   ↓
4. Server authentication
   ↓
5. Server validation (Joi)
   ↓
6. File upload (if media)
   ↓
7. Database insert
   ↓
8. WebSocket broadcast
   ↓
9. Response to client
   ↓
10. UI update (optimistic)
   ↓
11. Cache invalidation (React Query)
```

### Authentication Flow

```
Registration:
1. User submits form
   ↓
2. Password hashing (bcrypt)
   ↓
3. User creation in DB
   ↓
4. JWT token generation
   ↓
5. Token sent to client
   ↓
6. Token stored (localStorage)

Login:
1. User submits credentials
   ↓
2. User lookup in DB
   ↓
3. Password comparison
   ↓
4. JWT token generation
   ↓
5. Token sent to client
   ↓
6. Token stored (localStorage)

Authenticated Request:
1. Token from localStorage
   ↓
2. Token in Authorization header
   ↓
3. Server token verification
   ↓
4. User extraction from token
   ↓
5. Request processing
```

---

## Database Schema

### Collections

#### Users Collection

```javascript
{
  _id: ObjectId,
  firstName: String,
  lastName: String,
  email: String (unique, indexed),
  password: String (hashed),
  role: String (enum: citizen, authority, admin),
  phone: String,
  location: {
    type: "Point",
    coordinates: [Number, Number], // [longitude, latitude]
    address: {
      street: String,
      city: String,
      state: String,
      zipCode: String,
      country: String
    }
  },
  isActive: Boolean,
  isVerified: Boolean,
  lastLogin: Date,
  createdAt: Date,
  updatedAt: Date
}

// Indexes
db.users.createIndex({ email: 1 }, { unique: true });
db.users.createIndex({ location: "2dsphere" });
```

#### Incidents Collection

```javascript
{
  _id: ObjectId,
  type: String (enum: crime, accident, hazard, suspicious, emergency, other),
  title: String,
  description: String,
  location: {
    type: "Point",
    coordinates: [Number, Number],
    address: {
      street: String,
      city: String,
      state: String,
      zipCode: String,
      country: String
    }
  },
  severity: String (enum: low, medium, high, critical),
  status: String (enum: pending, verified, resolved, dismissed),
  media: [{
    type: String (enum: image, video),
    url: String,
    filename: String
  }],
  reportedBy: ObjectId (ref: User),
  verifiedBy: ObjectId (ref: User),
  votes: {
    upvotes: Number,
    downvotes: Number,
    voters: [ObjectId]
  },
  comments: [{
    user: ObjectId (ref: User),
    text: String,
    createdAt: Date
  }],
  isActive: Boolean,
  createdAt: Date,
  updatedAt: Date
}

// Indexes
db.incidents.createIndex({ location: "2dsphere" });
db.incidents.createIndex({ createdAt: -1 });
db.incidents.createIndex({ status: 1 });
db.incidents.createIndex({ type: 1 });
db.incidents.createIndex({ severity: 1 });
```

#### Alerts Collection

```javascript
{
  _id: ObjectId,
  type: String (enum: critical, warning, info, safe),
  title: String,
  message: String,
  location: {
    type: "Point",
    coordinates: [Number, Number],
    address: {
      street: String,
      city: String,
      state: String,
      zipCode: String,
      country: String
    }
  },
  severity: String (enum: low, medium, high, critical),
  radius: Number, // in meters
  issuedBy: ObjectId (ref: User),
  targetAudience: String (enum: all, authorities, citizens),
  isActive: Boolean,
  expiresAt: Date,
  createdAt: Date,
  updatedAt: Date
}

// Indexes
db.alerts.createIndex({ location: "2dsphere" });
db.alerts.createIndex({ isActive: 1, expiresAt: 1 });
db.alerts.createIndex({ createdAt: -1 });
```

### Relationships

```
User ──┬─── reports ───→ Incident
       │
       ├─── verifies ──→ Incident
       │
       ├─── issues ────→ Alert
       │
       └─── comments ──→ Incident

Incident ──┬─── has ────→ Comments
           │
           └─── has ────→ Media

Alert ─────── targets ──→ Users (by location)
```

---

## Security Architecture

### Authentication & Authorization

**JWT Token Structure**:
```javascript
{
  header: {
    alg: "HS256",
    typ: "JWT"
  },
  payload: {
    userId: "507f1f77bcf86cd799439011",
    role: "citizen",
    iat: 1634567890,
    exp: 1634568790
  },
  signature: "..."
}
```

**Authorization Levels**:
```
Admin > Authority > Citizen > Guest
```

### Security Measures

1. **Input Validation**
   - Client-side: Zod schemas
   - Server-side: Joi schemas
   - Sanitization: XSS prevention

2. **Authentication**
   - JWT tokens (15 min expiry)
   - Refresh tokens (7 days)
   - Secure password hashing (bcrypt, 10 rounds)

3. **Authorization**
   - Role-based access control (RBAC)
   - Resource ownership checks
   - Permission middleware

4. **Data Protection**
   - HTTPS only in production
   - Encrypted passwords
   - Secure headers (Helmet.js)
   - CORS configuration

5. **Rate Limiting**
   - 100 requests per 15 minutes (general)
   - 5 requests per 15 minutes (auth)
   - IP-based tracking

6. **Error Handling**
   - No sensitive data in errors
   - Proper HTTP status codes
   - Centralized error handling

---

## Scalability

### Horizontal Scaling

**Load Balancing**:
```
                  Load Balancer
                       │
        ┌──────────────┼──────────────┐
        │              │              │
    Server 1       Server 2       Server 3
        │              │              │
        └──────────────┴──────────────┘
                       │
                  MongoDB Cluster
```

**Session Management**:
- Stateless JWT tokens
- No server-side sessions
- Redis for WebSocket state (if needed)

### Vertical Scaling

**Database Optimization**:
- Indexes on frequently queried fields
- Geospatial indexes for location queries
- Connection pooling
- Query optimization

**Caching Strategy**:
```
Client Request
    ↓
Check React Query Cache
    ↓ (miss)
Check Redis Cache
    ↓ (miss)
Query Database
    ↓
Cache in Redis
    ↓
Return to Client
```

### CDN Strategy

**Static Assets**:
- Frontend build files
- Images and media
- JavaScript bundles
- CSS files

**CDN Configuration**:
- Cloudflare or AWS CloudFront
- Edge caching
- Automatic compression
- SSL/TLS

---

## Performance Optimization

### Frontend Optimization

1. **Code Splitting**
   ```typescript
   const Dashboard = lazy(() => import('./pages/Dashboard'));
   const Map = lazy(() => import('./pages/SafetyMap'));
   ```

2. **Image Optimization**
   - Lazy loading
   - WebP format
   - Responsive images
   - Compression

3. **Bundle Optimization**
   - Tree shaking
   - Minification
   - Code splitting
   - Dynamic imports

4. **Caching**
   - Service Worker
   - React Query cache
   - Browser cache headers

### Backend Optimization

1. **Database Queries**
   - Proper indexing
   - Query optimization
   - Projection (select only needed fields)
   - Pagination

2. **API Response**
   - Compression (gzip)
   - Minimal payload
   - Efficient serialization

3. **Caching**
   - Redis for frequent queries
   - In-memory caching
   - Cache invalidation strategy

---

## Monitoring and Logging

### Application Monitoring

**Sentry Integration**:
- Error tracking
- Performance monitoring
- User feedback
- Release tracking

**Metrics Collected**:
- Response times
- Error rates
- Request counts
- User activity

### Logging Strategy

**Log Levels**:
```
ERROR   - Critical errors
WARN    - Warning messages
INFO    - General information
HTTP    - HTTP requests
DEBUG   - Debug information
```

**Log Format**:
```json
{
  "timestamp": "2024-01-01T00:00:00.000Z",
  "level": "info",
  "message": "User logged in",
  "userId": "507f1f77bcf86cd799439011",
  "ip": "192.168.1.1",
  "userAgent": "Mozilla/5.0..."
}
```

**Log Storage**:
- Development: Console + File
- Production: Winston + Cloud logging

---

## Deployment Architecture

### Production Environment

```
┌─────────────────────────────────────────┐
│            Netlify CDN                  │
│         (Frontend Hosting)              │
└─────────────────────────────────────────┘
                 │
                 │ HTTPS
                 ▼
┌─────────────────────────────────────────┐
│           Render.com                    │
│        (Backend Hosting)                │
│  ┌───────────────────────────────────┐  │
│  │   Node.js Application Servers     │  │
│  └───────────────────────────────────┘  │
└─────────────────────────────────────────┘
                 │
                 │ MongoDB Protocol
                 ▼
┌─────────────────────────────────────────┐
│         MongoDB Atlas                   │
│       (Database Cluster)                │
│  ┌───────────────────────────────────┐  │
│  │   Primary + Secondary Replicas    │  │
│  └───────────────────────────────────┘  │
└─────────────────────────────────────────┘
```

### CI/CD Pipeline

```
Code Push → GitHub
    ↓
GitHub Actions
    ├── Run Tests
    ├── Run Linter
    ├── Security Scan
    └── Build
        ↓
    Deploy
    ├── Backend → Render
    └── Frontend → Netlify
        ↓
    Verify Deployment
        ↓
    Notify Team
```

---

## Future Enhancements

### Planned Features

1. **Microservices Architecture**
   - Separate services for incidents, alerts, users
   - API Gateway
   - Service mesh

2. **Advanced Analytics**
   - Machine learning for incident prediction
   - Trend analysis
   - Risk scoring

3. **Mobile Applications**
   - React Native apps
   - Push notifications
   - Offline support

4. **Enhanced Real-time**
   - WebRTC for video streaming
   - Live incident updates
   - Chat functionality

---

## Conclusion

This architecture provides:
- ✅ Scalability for growth
- ✅ Security best practices
- ✅ High performance
- ✅ Maintainability
- ✅ Real-time capabilities
- ✅ Comprehensive monitoring

For questions or contributions, see [CONTRIBUTING.md](../CONTRIBUTING.md).

---

*Last Updated: October 2025*
