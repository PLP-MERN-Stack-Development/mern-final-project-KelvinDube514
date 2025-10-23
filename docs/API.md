# SecurePath API Documentation

Base URL: `/api`

## Auth
- POST `/api/auth/register`
- POST `/api/auth/login`
- GET `/api/auth/me` (Bearer)

## Incidents
- GET `/api/incidents`
- GET `/api/incidents/:id`
- POST `/api/incidents` (Bearer)
- PUT `/api/incidents/:id` (Bearer)
- DELETE `/api/incidents/:id` (Bearer)
- POST `/api/incidents/:id/vote` (Bearer)
- GET `/api/incidents/nearby?lat=..&lng=..&radius=..`
- GET `/api/incidents/stats`

## Alerts
- GET `/api/alerts`
- POST `/api/alerts` (Bearer)
- GET `/api/alerts/:id`
- PUT `/api/alerts/:id` (Bearer)
- DELETE `/api/alerts/:id` (Bearer)

## Locations
- GET `/api/locations`
- POST `/api/locations` (Bearer)
- GET `/api/locations/:id`
- PUT `/api/locations/:id` (Bearer)
- DELETE `/api/locations/:id` (Bearer)
- GET `/api/locations/nearby/search?lat=..&lng=..&radius=..`

## Maps
- GET `/api/maps/health`


