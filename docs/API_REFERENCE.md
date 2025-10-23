# Community Safe Path - Complete API Reference

## Table of Contents

1. [Overview](#overview)
2. [Authentication](#authentication)
3. [Endpoints](#endpoints)
   - [Auth](#auth-endpoints)
   - [Incidents](#incident-endpoints)
   - [Alerts](#alert-endpoints)
   - [Users](#user-endpoints)
   - [Dashboard](#dashboard-endpoints)
4. [Error Handling](#error-handling)
5. [Rate Limiting](#rate-limiting)
6. [Examples](#examples)

---

## Overview

### Base URLs

```
Development: http://localhost:5000/api
Production: https://your-backend.onrender.com/api
```

### Request Format

All requests should include:
```http
Content-Type: application/json
```

For authenticated requests:
```http
Authorization: Bearer <your-jwt-token>
```

### Response Format

All responses follow this structure:

**Success Response:**
```json
{
  "success": true,
  "data": { ... },
  "message": "Operation successful"
}
```

**Error Response:**
```json
{
  "success": false,
  "message": "Error description",
  "error": {
    "code": "ERROR_CODE",
    "details": [ ... ]
  }
}
```

---

## Authentication

### JWT Token Structure

Tokens are valid for 15 minutes (access token) and 7 days (refresh token).

**Token Payload:**
```json
{
  "userId": "507f1f77bcf86cd799439011",
  "role": "citizen",
  "iat": 1634567890,
  "exp": 1634568790
}
```

---

## Auth Endpoints

### Register User

Create a new user account.

**Endpoint:** `POST /api/auth/register`

**Request Body:**
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john.doe@example.com",
  "password": "SecurePassword123!",
  "phone": "+1234567890",
  "location": {
    "coordinates": [-74.006, 40.7128],
    "address": {
      "street": "123 Main St",
      "city": "New York",
      "state": "NY",
      "zipCode": "10001",
      "country": "USA"
    }
  }
}
```

**Response:** `201 Created`
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "_id": "507f1f77bcf86cd799439011",
      "firstName": "John",
      "lastName": "Doe",
      "email": "john.doe@example.com",
      "role": "citizen",
      "isActive": true,
      "createdAt": "2024-01-01T00:00:00.000Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Validation Rules:**
- `firstName`: Required, 2-50 characters
- `lastName`: Required, 2-50 characters
- `email`: Required, valid email format, unique
- `password`: Required, min 8 characters, must include uppercase, lowercase, and number
- `phone`: Optional, valid phone format
- `location`: Optional

---

### Login

Authenticate user and receive JWT tokens.

**Endpoint:** `POST /api/auth/login`

**Request Body:**
```json
{
  "email": "john.doe@example.com",
  "password": "SecurePassword123!"
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "_id": "507f1f77bcf86cd799439011",
      "firstName": "John",
      "lastName": "Doe",
      "email": "john.doe@example.com",
      "role": "citizen"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Error Responses:**
- `401 Unauthorized`: Invalid credentials
- `403 Forbidden`: Account not verified or inactive

---

### Get Current User

Get authenticated user's profile.

**Endpoint:** `GET /api/auth/me`

**Headers:**
```http
Authorization: Bearer <token>
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "user": {
      "_id": "507f1f77bcf86cd799439011",
      "firstName": "John",
      "lastName": "Doe",
      "email": "john.doe@example.com",
      "role": "citizen",
      "phone": "+1234567890",
      "location": {
        "coordinates": [-74.006, 40.7128],
        "address": {
          "city": "New York",
          "state": "NY"
        }
      },
      "isActive": true,
      "isVerified": true,
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  }
}
```

---

### Update Profile

Update user profile information.

**Endpoint:** `PUT /api/auth/profile`

**Headers:**
```http
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "firstName": "Jane",
  "lastName": "Doe",
  "phone": "+1234567890",
  "location": {
    "coordinates": [-74.006, 40.7128],
    "address": {
      "street": "456 Oak Ave",
      "city": "New York",
      "state": "NY",
      "zipCode": "10002",
      "country": "USA"
    }
  }
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Profile updated successfully",
  "data": {
    "user": { ... }
  }
}
```

---

### Change Password

Change user password.

**Endpoint:** `PUT /api/auth/change-password`

**Headers:**
```http
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "currentPassword": "OldPassword123!",
  "newPassword": "NewPassword123!"
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Password changed successfully"
}
```

---

### Logout

Invalidate current session.

**Endpoint:** `POST /api/auth/logout`

**Headers:**
```http
Authorization: Bearer <token>
```

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

---

## Incident Endpoints

### List Incidents

Get paginated list of incidents with filters.

**Endpoint:** `GET /api/incidents`

**Query Parameters:**
- `page` (number): Page number (default: 1)
- `limit` (number): Items per page (default: 20, max: 100)
- `type` (string): Filter by type (crime, accident, hazard, etc.)
- `severity` (string): Filter by severity (low, medium, high, critical)
- `status` (string): Filter by status (pending, verified, resolved, dismissed)
- `lat` (number): Latitude for location-based search
- `lng` (number): Longitude for location-based search
- `radius` (number): Search radius in meters (default: 5000)
- `startDate` (date): Filter from date
- `endDate` (date): Filter to date
- `sort` (string): Sort field (createdAt, severity, etc.)
- `order` (string): Sort order (asc, desc)

**Example Request:**
```http
GET /api/incidents?page=1&limit=20&type=crime&severity=high&lat=40.7128&lng=-74.006&radius=5000
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "incidents": [
      {
        "_id": "507f1f77bcf86cd799439011",
        "type": "crime",
        "title": "Theft Reported",
        "description": "Car broken into on Main Street",
        "location": {
          "type": "Point",
          "coordinates": [-74.006, 40.7128],
          "address": {
            "street": "123 Main St",
            "city": "New York",
            "state": "NY",
            "zipCode": "10001",
            "country": "USA"
          }
        },
        "severity": "high",
        "status": "verified",
        "media": [
          {
            "type": "image",
            "url": "https://example.com/image.jpg",
            "filename": "evidence.jpg"
          }
        ],
        "reportedBy": {
          "_id": "507f1f77bcf86cd799439012",
          "firstName": "John",
          "lastName": "Doe"
        },
        "verifiedBy": {
          "_id": "507f1f77bcf86cd799439013",
          "firstName": "Officer",
          "lastName": "Smith"
        },
        "isActive": true,
        "createdAt": "2024-01-01T00:00:00.000Z",
        "updatedAt": "2024-01-01T01:00:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 150,
      "totalPages": 8
    }
  }
}
```

---

### Get Single Incident

Get detailed information about a specific incident.

**Endpoint:** `GET /api/incidents/:id`

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "incident": {
      "_id": "507f1f77bcf86cd799439011",
      "type": "crime",
      "title": "Theft Reported",
      "description": "Detailed description...",
      "location": { ... },
      "severity": "high",
      "status": "verified",
      "media": [ ... ],
      "reportedBy": { ... },
      "verifiedBy": { ... },
      "comments": [
        {
          "user": { ... },
          "text": "I saw this too",
          "createdAt": "2024-01-01T00:30:00.000Z"
        }
      ],
      "votes": {
        "upvotes": 15,
        "downvotes": 2
      },
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T01:00:00.000Z"
    }
  }
}
```

---

### Create Incident

Report a new incident.

**Endpoint:** `POST /api/incidents`

**Headers:**
```http
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

**Request Body (Form Data):**
```
title: Theft Reported
description: Car broken into on Main Street
type: crime
severity: high
location[coordinates][0]: -74.006
location[coordinates][1]: 40.7128
location[address][street]: 123 Main St
location[address][city]: New York
location[address][state]: NY
location[address][zipCode]: 10001
location[address][country]: USA
media: [File, File, ...]
```

**Response:** `201 Created`
```json
{
  "success": true,
  "message": "Incident reported successfully",
  "data": {
    "incident": { ... }
  }
}
```

**Validation Rules:**
- `title`: Required, 5-200 characters
- `description`: Required, 20-2000 characters
- `type`: Required, one of: crime, accident, hazard, suspicious, emergency, other
- `severity`: Required, one of: low, medium, high, critical
- `location`: Required, valid coordinates and address
- `media`: Optional, max 5 files, max 5MB each, types: image/jpeg, image/png, video/mp4

---

### Update Incident

Update an existing incident.

**Endpoint:** `PUT /api/incidents/:id`

**Headers:**
```http
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "title": "Updated Title",
  "description": "Updated description",
  "status": "resolved"
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Incident updated successfully",
  "data": {
    "incident": { ... }
  }
}
```

**Authorization:**
- Users can update their own incidents
- Authorities can update any incident
- Authorities can change status to verified/resolved
- Regular users cannot change status

---

### Delete Incident

Delete an incident.

**Endpoint:** `DELETE /api/incidents/:id`

**Headers:**
```http
Authorization: Bearer <token>
```

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Incident deleted successfully"
}
```

**Authorization:**
- Users can delete their own incidents
- Authorities and admins can delete any incident

---

### Get Incident Statistics

Get aggregated statistics about incidents.

**Endpoint:** `GET /api/incidents/stats/summary`

**Headers:**
```http
Authorization: Bearer <token>
```

**Query Parameters:**
- `startDate` (date): Start date for statistics
- `endDate` (date): End date for statistics
- `lat` (number): Latitude for location-based stats
- `lng` (number): Longitude for location-based stats
- `radius` (number): Radius in meters

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "total": 1250,
    "byType": {
      "crime": 450,
      "accident": 320,
      "hazard": 280,
      "suspicious": 150,
      "emergency": 50
    },
    "bySeverity": {
      "low": 400,
      "medium": 500,
      "high": 280,
      "critical": 70
    },
    "byStatus": {
      "pending": 200,
      "verified": 800,
      "resolved": 200,
      "dismissed": 50
    },
    "trend": [
      {
        "date": "2024-01-01",
        "count": 45
      },
      {
        "date": "2024-01-02",
        "count": 52
      }
    ]
  }
}
```

---

## Alert Endpoints

### List Alerts

Get list of active alerts.

**Endpoint:** `GET /api/alerts`

**Query Parameters:**
- `page` (number): Page number
- `limit` (number): Items per page
- `type` (string): Filter by type (critical, warning, info, safe)
- `severity` (string): Filter by severity
- `lat` (number): Latitude for location-based search
- `lng` (number): Longitude for location-based search
- `radius` (number): Search radius in meters
- `isActive` (boolean): Filter by active status

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "alerts": [
      {
        "_id": "507f1f77bcf86cd799439014",
        "type": "critical",
        "title": "Emergency Evacuation",
        "message": "Immediate evacuation required due to gas leak",
        "location": {
          "type": "Point",
          "coordinates": [-74.006, 40.7128],
          "address": {
            "city": "New York",
            "state": "NY"
          }
        },
        "severity": "critical",
        "radius": 10000,
        "issuedBy": {
          "_id": "507f1f77bcf86cd799439015",
          "firstName": "Chief",
          "lastName": "Officer"
        },
        "isActive": true,
        "expiresAt": "2024-01-02T00:00:00.000Z",
        "createdAt": "2024-01-01T00:00:00.000Z"
      }
    ],
    "pagination": { ... }
  }
}
```

---

### Create Alert

Create a new alert (authorities only).

**Endpoint:** `POST /api/alerts`

**Headers:**
```http
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "type": "critical",
  "title": "Emergency Evacuation",
  "message": "Immediate evacuation required due to gas leak",
  "location": {
    "coordinates": [-74.006, 40.7128],
    "address": {
      "street": "Downtown Area",
      "city": "New York",
      "state": "NY",
      "country": "USA"
    }
  },
  "severity": "critical",
  "radius": 10000,
  "expiresAt": "2024-01-02T00:00:00.000Z"
}
```

**Response:** `201 Created`
```json
{
  "success": true,
  "message": "Alert created successfully",
  "data": {
    "alert": { ... }
  }
}
```

**Authorization:** Only users with role 'authority' or 'admin' can create alerts.

---

## User Endpoints

### List Users (Admin Only)

Get list of users.

**Endpoint:** `GET /api/users`

**Headers:**
```http
Authorization: Bearer <token>
```

**Query Parameters:**
- `page`, `limit`, `role`, `isActive`, `search`

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "users": [ ... ],
    "pagination": { ... }
  }
}
```

---

### Update User Role (Admin Only)

Change user role.

**Endpoint:** `PUT /api/users/:id/role`

**Headers:**
```http
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "role": "authority"
}
```

**Response:** `200 OK`

---

## Dashboard Endpoints

### Get Dashboard Statistics

Get comprehensive dashboard statistics.

**Endpoint:** `GET /api/dashboard/stats`

**Headers:**
```http
Authorization: Bearer <token>
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "totalIncidents": 1250,
    "activeAlerts": 5,
    "resolvedIncidents": 800,
    "averageResponseTime": "15 minutes",
    "recentActivity": [ ... ],
    "topIncidentTypes": [ ... ],
    "safetyScore": 75
  }
}
```

---

## Error Handling

### Error Codes

| Code | Status | Description |
|------|--------|-------------|
| `VALIDATION_ERROR` | 400 | Invalid request data |
| `UNAUTHORIZED` | 401 | Missing or invalid token |
| `FORBIDDEN` | 403 | Insufficient permissions |
| `NOT_FOUND` | 404 | Resource not found |
| `CONFLICT` | 409 | Resource already exists |
| `RATE_LIMIT_EXCEEDED` | 429 | Too many requests |
| `INTERNAL_ERROR` | 500 | Server error |

### Error Response Example

```json
{
  "success": false,
  "message": "Validation failed",
  "error": {
    "code": "VALIDATION_ERROR",
    "details": [
      {
        "field": "email",
        "message": "Email is required"
      },
      {
        "field": "password",
        "message": "Password must be at least 8 characters"
      }
    ]
  }
}
```

---

## Rate Limiting

### Limits

- **General endpoints**: 100 requests per 15 minutes
- **Auth endpoints**: 5 requests per 15 minutes (login/register)
- **File uploads**: 10 requests per hour

### Headers

```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1634568790
```

### Rate Limit Exceeded Response

```json
{
  "success": false,
  "message": "Too many requests, please try again later",
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "retryAfter": 900
  }
}
```

---

## Examples

### Complete Flow Example

#### 1. Register User
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@example.com",
    "password": "SecurePass123!"
  }'
```

#### 2. Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "SecurePass123!"
  }'
```

#### 3. Create Incident
```bash
curl -X POST http://localhost:5000/api/incidents \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Theft Reported",
    "description": "Car broken into on Main Street",
    "type": "crime",
    "severity": "high",
    "location": {
      "coordinates": [-74.006, 40.7128],
      "address": {
        "street": "123 Main St",
        "city": "New York",
        "state": "NY",
        "zipCode": "10001",
        "country": "USA"
      }
    }
  }'
```

#### 4. Get Incidents Near Location
```bash
curl -X GET "http://localhost:5000/api/incidents?lat=40.7128&lng=-74.006&radius=5000" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## Postman Collection

Import our Postman collection for easy API testing:

[Download Postman Collection](./postman/Community-Safe-Path.postman_collection.json)

---

## Support

For API support:
- Email: api-support@communitysafepath.com
- GitHub Issues: [Report Issue](https://github.com/KelvinDube514/community-safe-path/issues)
- Documentation: [Full Docs](./README.md)
