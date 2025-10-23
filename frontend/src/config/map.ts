// South Africa-focused map configuration for Leaflet/OpenStreetMap
export const MAP_CONFIG = {
  SOUTH_AFRICA_BOUNDS: {
    north: -22.1255,
    south: -34.8192,
    east: 32.8301,
    west: 16.4699
  },
  DEFAULT_CENTER: { lat: -26.2041, lng: 28.0473 }, // Johannesburg
  DEFAULT_ZOOM: 6,
  MAX_ZOOM: 19,
  MIN_ZOOM: 4
};

export const MAJOR_CITIES = [
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

export function isWithinSouthAfrica(lat: number, lng: number): boolean {
  const { north, south, east, west } = MAP_CONFIG.SOUTH_AFRICA_BOUNDS;
  return lat >= south && lat <= north && lng >= west && lng <= east;
}

export function getSouthAfricaLeafletBounds(): [[number, number], [number, number]] {
  const { north, south, east, west } = MAP_CONFIG.SOUTH_AFRICA_BOUNDS;
  // Leaflet LatLngBounds expects [[southWestLat, southWestLng], [northEastLat, northEastLng]]
  return [[south, west], [north, east]];
}

export function getOptimalZoomForSouthAfrica(hasUserLocation: boolean): number {
  return hasUserLocation ? 15 : MAP_CONFIG.DEFAULT_ZOOM;
}

export type LatLngLiteral = { lat: number; lng: number };

