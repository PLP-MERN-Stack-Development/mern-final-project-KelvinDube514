import React, { useEffect, useMemo, useRef } from 'react';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-defaulticon-compatibility';
import 'leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css';
import { MAP_CONFIG, getSouthAfricaLeafletBounds, LatLngLiteral } from '@/config/map';

interface OSMMapWrapperProps {
  center?: LatLngLiteral;
  zoom?: number;
  className?: string;
  onMapReady?: (map: L.Map) => void;
  children?: React.ReactNode;
}

const BoundsInitializer: React.FC<{ onReady?: (map: L.Map) => void } & { center: LatLngLiteral; zoom: number }> = ({ onReady, center, zoom }) => {
  const map = useMap();

  useEffect(() => {
    const bounds = L.latLngBounds(getSouthAfricaLeafletBounds());
    map.setMaxBounds(bounds);
    map.setMinZoom(MAP_CONFIG.MIN_ZOOM);
    map.setMaxZoom(MAP_CONFIG.MAX_ZOOM);
    map.setView([center.lat, center.lng], zoom, { animate: false });
    onReady?.(map);
  }, [map, onReady, center, zoom]);

  return null;
};

const OSMMapWrapper: React.FC<OSMMapWrapperProps> = ({
  center = MAP_CONFIG.DEFAULT_CENTER,
  zoom = MAP_CONFIG.DEFAULT_ZOOM,
  className = '',
  onMapReady,
  children
}) => {
  const tileAttribution = useMemo(
    () =>
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    []
  );

  // Organic Maps compatible tiles: use generic OSM tiles; users can open in Organic Maps via deep links elsewhere
  const tileUrl = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';

  return (
    <div className={`w-full h-full ${className}`}>
      <MapContainer
        style={{ width: '100%', height: '100%' }}
        center={[center.lat, center.lng]}
        zoom={zoom}
        scrollWheelZoom
        zoomControl
      >
        <TileLayer url={tileUrl} attribution={tileAttribution} />
        <BoundsInitializer onReady={onMapReady} center={center} zoom={zoom} />
        {children}
      </MapContainer>
    </div>
  );
};

export default OSMMapWrapper;

