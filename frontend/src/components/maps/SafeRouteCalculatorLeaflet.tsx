import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { useToast } from '@/hooks/use-toast';

interface Props {
  map: L.Map | null;
  origin: { lat: number; lng: number } | null;
  destination: { lat: number; lng: number } | null;
  onRouteCalculated?: (distanceKm: number, durationMin: number) => void;
  onRouteError?: (error: string) => void;
}

const SafeRouteCalculatorLeaflet: React.FC<Props> = ({ map, origin, destination, onRouteCalculated, onRouteError }) => {
  const { toast } = useToast();
  const layerRef = useRef<L.LayerGroup | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);

  useEffect(() => {
    if (!map) return;
    if (!layerRef.current) {
      layerRef.current = L.layerGroup().addTo(map);
    }
    return () => {
      layerRef.current?.clearLayers();
      if (layerRef.current) map.removeLayer(layerRef.current);
      layerRef.current = null;
    };
  }, [map]);

  useEffect(() => {
    const fetchRoute = async () => {
      if (!map || !origin || !destination) return;
      setIsCalculating(true);
      layerRef.current?.clearLayers();
      try {
        const url = `https://router.project-osrm.org/route/v1/driving/${origin.lng},${origin.lat};${destination.lng},${destination.lat}?overview=full&geometries=geojson`;
        const res = await fetch(url);
        const data = await res.json();
        if (!data.routes || data.routes.length === 0) throw new Error('No route found');
        const route = data.routes[0];
        const coords = route.geometry.coordinates.map((c: [number, number]) => [c[1], c[0]] as [number, number]);
        const polyline = L.polyline(coords, { color: '#10b981', weight: 4, opacity: 0.9 }).addTo(layerRef.current!);
        map.fitBounds(polyline.getBounds(), { padding: [20, 20] });
        const distanceKm = route.distance / 1000;
        const durationMin = route.duration / 60;
        onRouteCalculated?.(distanceKm, durationMin);
        toast({ title: 'Route calculated', description: `${distanceKm.toFixed(1)} km, ${Math.round(durationMin)} min` });
      } catch (e: any) {
        const msg = e?.message || 'Failed to calculate route';
        onRouteError?.(msg);
        toast({ title: 'Route calculation failed', description: msg, variant: 'destructive' });
      } finally {
        setIsCalculating(false);
      }
    };
    fetchRoute();
  }, [map, origin, destination]);

  return null;
};

export default SafeRouteCalculatorLeaflet;

