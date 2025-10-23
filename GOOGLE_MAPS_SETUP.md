# Google Maps Integration Setup Guide

## Overview
The Interactive Safety Map now includes enhanced Google Maps integration with real-time alerts, safe routes visualization, and advanced map controls, all restricted to South Africa.

## Features Implemented

### ✅ Enhanced Frontend Components
- **GoogleMapWrapper**: Main map component with South Africa restrictions and performance optimizations
- **AlertMarkers**: Real-time alert markers with enhanced styling, hover effects, and improved info windows
- **SafeRouteCalculator**: Advanced route calculation with safety considerations and better error handling
- **LocationSearch**: South Africa-specific location search with autocomplete and quick city selection
- **MapControls**: New comprehensive map controls with layer management, map type switching, and fullscreen mode
- **Enhanced SafetyMap**: Complete map interface with tabs for alerts and routes, plus fullscreen support

### ✅ Backend APIs
- **Location Utilities**: South Africa boundary validation and geospatial operations
- **Location Validation Middleware**: Comprehensive validation for all location data
- **Maps Routes**: New API endpoints for map-specific operations
- **Enhanced Security**: All location data validated within South Africa boundaries

## Setup Instructions

### 1. Google Maps API Key Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable the following APIs:
   - Maps JavaScript API
   - Places API
   - Directions API
   - Geocoding API
4. Create credentials (API Key)
5. Restrict the API key to your domain for security

### 2. Environment Configuration

Create a `.env` file in the frontend directory:

```env
# Google Maps API Key
VITE_GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here

# Backend API URL
VITE_API_URL=http://localhost:5000

# Socket.io Server URL
VITE_SOCKET_URL=http://localhost:5000
```

### 3. Install Dependencies

The required dependencies are already installed:
- `@googlemaps/react-wrapper`
- `@googlemaps/js-api-loader`

### 4. Environment Configuration

Create a `.env` file in the frontend directory with your Google Maps API key:

```env
# Google Maps API Configuration
VITE_GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here

# Backend API Configuration  
VITE_API_URL=http://localhost:5000
VITE_SOCKET_URL=http://localhost:5000

# Development Settings
VITE_APP_ENV=development
VITE_DEBUG_MAPS=false
```

### 5. Start the Application

```bash
# Start backend
cd backend
npm start

# Start frontend
cd frontend
npm run dev
```

## API Endpoints

### Maps API Endpoints

#### Get Incidents in Area
```
GET /api/maps/incidents?lat=-26.2041&lng=28.0473&radius=10
```

#### Get Alerts in Area
```
GET /api/maps/alerts?lat=-26.2041&lng=28.0473&radius=10
```

#### Get Locations in Area
```
GET /api/maps/locations?lat=-26.2041&lng=28.0473&radius=10
```

#### Get Map Data within Bounds
```
GET /api/maps/bounds?north=-22&south=-35&east=33&west=16
```

#### Get Nearest City
```
GET /api/maps/nearest-city?lat=-26.2041&lng=28.0473
```

#### Calculate Safe Route
```
POST /api/maps/route
{
  "origin": {
    "coordinates": [28.0473, -26.2041],
    "address": "Johannesburg, South Africa"
  },
  "destination": {
    "coordinates": [18.4241, -33.9249],
    "address": "Cape Town, South Africa"
  },
  "avoidHighRiskAreas": true
}
```

#### Get South Africa Bounds
```
GET /api/maps/bounds/south-africa
```

#### Get Map Statistics
```
GET /api/maps/stats?lat=-26.2041&lng=28.0473&radius=10
```

## South Africa Restrictions

### Geographic Boundaries
- **North**: -22.1255° (Northern border)
- **South**: -34.8192° (Southern border)
- **East**: 32.8301° (Eastern border)
- **West**: 16.4699° (Western border)

### Validation Features
- All location inputs validated within South Africa
- Map bounds restricted to South Africa
- Geocoding results filtered to South Africa
- Route calculations limited to South African roads

### Major Cities Included
- Johannesburg, Cape Town, Durban, Pretoria
- Port Elizabeth, Bloemfontein, Polokwane
- Nelspruit, Kimberley, Mahikeng

## Enhanced Features

### 🆕 Advanced Map Controls
- **Map Type Switching**: Roadmap, Satellite, Hybrid, and Terrain views
- **Layer Management**: Toggle traffic, transit, and bicycle layers
- **Fullscreen Mode**: Immersive map viewing experience
- **Zoom Controls**: Precise zoom in/out with level indicators
- **Reset View**: Quick return to South Africa overview

### 🆕 Enhanced Alert Markers
- **Improved Styling**: Better visual hierarchy with enhanced colors and icons
- **Hover Effects**: Interactive marker scaling and highlighting
- **Rich Info Windows**: Detailed alert information with severity indicators
- **Performance Optimization**: Marker clustering and rendering limits
- **Accessibility**: Better contrast and keyboard navigation

### 🆕 Smart Location Search
- **Enhanced Autocomplete**: Improved Google Places integration
- **Quick City Selection**: One-click access to major South African cities
- **GPS Integration**: Current location detection with validation
- **Address Validation**: All locations verified within South Africa bounds

### Real-time Features
- Real-time alerts from backend Socket.io
- Color-coded markers (Critical=Red, Warning=Amber, Info=Blue, Safe=Green)
- Clickable markers with detailed info windows
- Automatic map updates when new alerts arrive

### Route Safety
- Route calculation considers recent incidents
- High-risk area warnings
- Alternative route suggestions
- Safety scoring for different routes

## Usage Examples

### 1. View Safety Alerts
1. Navigate to `/map`
2. Use the "Safety Alerts" tab
3. Search for a location in South Africa
4. View real-time alerts on the map
5. Click markers for detailed information
6. Use the map controls to switch between map types

### 2. Plan Safe Routes
1. Switch to the "Safe Routes" tab
2. Select origin and destination
3. View calculated route with safety warnings
4. Get alternative route suggestions
5. Use fullscreen mode for better route visualization

### 3. Advanced Map Navigation
1. Use the map controls panel (top-right)
2. Switch between Roadmap, Satellite, Hybrid, and Terrain views
3. Toggle traffic, transit, and bicycle layers
4. Use zoom controls for precise navigation
5. Enable fullscreen mode for immersive viewing

### 4. Location Search
1. Use the search bar to find locations
2. Quick select from major South African cities
3. Get current location with GPS
4. All searches restricted to South Africa
5. Enhanced autocomplete with better suggestions

### 5. Map Controls
1. Click the eye icon to expand/collapse controls
2. Change map type using the dropdown
3. Use zoom in/out buttons for precise control
4. Toggle layers on/off as needed
5. Reset view to return to South Africa overview

## Security Features

### API Key Protection
- API key stored in environment variables
- Domain restrictions recommended
- Rate limiting on all endpoints

### Location Validation
- All coordinates validated within South Africa
- Input sanitization and validation
- Geographic boundary enforcement

### Data Privacy
- No location data stored unnecessarily
- User location data encrypted
- Compliance with South African data protection laws

## Troubleshooting

### Common Issues

1. **Map not loading**
   - Check API key is correct
   - Verify APIs are enabled in Google Cloud Console
   - Check browser console for errors

2. **Location search not working**
   - Ensure Places API is enabled
   - Check API key has Places API permissions
   - Verify location is within South Africa

3. **Routes not calculating**
   - Ensure Directions API is enabled
   - Check origin and destination are valid
   - Verify both points are within South Africa

### Error Messages
- "Location outside South Africa": Selected location is outside SA boundaries
- "Invalid coordinates": Coordinates are not valid numbers
- "API key not found": Google Maps API key is missing or invalid

## Performance Optimization

### Map Performance
- Marker clustering for large numbers of alerts
- Lazy loading of map data
- Efficient geospatial queries
- Cached location data

### API Optimization
- Parallel data fetching
- Efficient MongoDB geospatial indexes
- Response caching where appropriate
- Rate limiting to prevent abuse

## Future Enhancements

### Planned Features
- Traffic data integration
- Weather overlay
- Public transport integration
- Community safety ratings
- Mobile app optimization

### API Improvements
- WebSocket real-time updates
- Advanced route optimization
- Machine learning safety predictions
- Integration with emergency services

## Support

For technical support or questions about the Google Maps integration:
1. Check the browser console for errors
2. Verify API key configuration
3. Test with known South African locations
4. Check network connectivity
5. Review API quotas and limits

## Compliance

This implementation complies with:
- Google Maps API Terms of Service
- South African data protection regulations
- Community safety platform requirements
- Geographic data usage policies
