/**
 * useRealTime Hook - React hook for managing real-time notifications
 * Provides easy integration with RealTimeService and NotificationService
 */

import { useEffect, useState, useCallback, useRef } from 'react';
import { realTimeService, RealTimeAlert, RealTimeIncident } from '@/services/RealTimeService';
import { notificationService } from '@/services/NotificationService';

interface UseRealTimeOptions {
  serverUrl?: string;
  autoConnect?: boolean;
  enableGeolocation?: boolean;
  authToken?: string;
}

interface UseRealTimeReturn {
  isConnected: boolean;
  alerts: RealTimeAlert[];
  incidents: RealTimeIncident[];
  notifications: any[];
  connect: () => void;
  disconnect: () => void;
  joinLocationRoom: (lat: number, lng: number) => void;
  leaveLocationRoom: (lat: number, lng: number) => void;
  triggerTestNotification: (type?: 'critical' | 'warning' | 'info' | 'safe') => void;
  clearAlerts: () => void;
  clearIncidents: () => void;
  markAlertAsRead: (alertId: string) => void;
}

export const useRealTime = (options: UseRealTimeOptions = {}): UseRealTimeReturn => {
  const {
    serverUrl = 'http://localhost:5000',
    autoConnect = true,
    enableGeolocation = true,
    authToken
  } = options;

  const [isConnected, setIsConnected] = useState(false);
  const [alerts, setAlerts] = useState<RealTimeAlert[]>([]);
  const [incidents, setIncidents] = useState<RealTimeIncident[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null);
  
  const locationWatcher = useRef<number | null>(null);
  const isInitialized = useRef(false);

  // Initialize geolocation if enabled
  useEffect(() => {
    if (!enableGeolocation || !navigator.geolocation) return;

    const watchPosition = () => {
      locationWatcher.current = navigator.geolocation.watchPosition(
        (position) => {
          const newLocation = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          
          // Only update if location changed significantly (>100m)
          if (currentLocation) {
            const distance = calculateDistance(
              currentLocation.lat,
              currentLocation.lng,
              newLocation.lat,
              newLocation.lng
            );
            
            if (distance < 0.1) return; // Less than 100m, ignore
          }

          setCurrentLocation(newLocation);
        },
        (error) => {
          console.warn('Geolocation error:', error);
        },
        {
          enableHighAccuracy: false,
          timeout: 10000,
          maximumAge: 60000 // 1 minute
        }
      );
    };

    // Get initial position
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCurrentLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        });
        watchPosition();
      },
      (error) => {
        console.warn('Initial geolocation failed:', error);
        watchPosition(); // Still watch for position changes
      }
    );

    return () => {
      if (locationWatcher.current) {
        navigator.geolocation.clearWatch(locationWatcher.current);
      }
    };
  }, [enableGeolocation]);

  // Setup real-time service event listeners
  useEffect(() => {
    const handleConnection = (connected: boolean) => {
      setIsConnected(connected);
    };

    const handleAlert = (alert: RealTimeAlert) => {
      setAlerts(prev => {
        // Avoid duplicates
        const exists = prev.some(a => a.id === alert.id);
        if (exists) return prev;
        
        // Keep only last 50 alerts
        const updated = [alert, ...prev].slice(0, 50);
        return updated;
      });
    };

    const handleIncident = (incident: RealTimeIncident) => {
      setIncidents(prev => {
        // Avoid duplicates
        const exists = prev.some(i => i.id === incident.id);
        if (exists) return prev;
        
        // Keep only last 50 incidents
        const updated = [incident, ...prev].slice(0, 50);
        return updated;
      });
    };

    const handleNotification = (notification: any) => {
      setNotifications(prev => {
        const updated = [{ ...notification, timestamp: Date.now() }, ...prev].slice(0, 100);
        return updated;
      });
    };

    // Register event listeners
    realTimeService.on('connected', handleConnection);
    realTimeService.on('alert', handleAlert);
    realTimeService.on('alert_updated', handleAlert);
    realTimeService.on('incident', handleIncident);
    realTimeService.on('incident_updated', handleIncident);
    realTimeService.on('emergency_broadcast', handleNotification);
    realTimeService.on('system_notification', handleNotification);

    return () => {
      // Cleanup event listeners
      realTimeService.off('connected', handleConnection);
      realTimeService.off('alert', handleAlert);
      realTimeService.off('alert_updated', handleAlert);
      realTimeService.off('incident', handleIncident);
      realTimeService.off('incident_updated', handleIncident);
      realTimeService.off('emergency_broadcast', handleNotification);
      realTimeService.off('system_notification', handleNotification);
    };
  }, []);

  // Auto-connect if enabled
  useEffect(() => {
    if (!autoConnect || isInitialized.current) return;

    const initializeServices = async () => {
      try {
        // Initialize notification service
        await notificationService.initialize();
        
        // Connect to real-time service with authentication
        realTimeService.connect(serverUrl, authToken);
        
        isInitialized.current = true;
      } catch (error) {
        console.error('Failed to initialize real-time services:', error);
      }
    };

    initializeServices();
  }, [autoConnect, serverUrl, authToken]);

  // Join location room when location changes
  useEffect(() => {
    if (!currentLocation || !isConnected) return;

    realTimeService.joinLocationRoom(currentLocation.lat, currentLocation.lng);

    return () => {
      if (currentLocation) {
        realTimeService.leaveLocationRoom(currentLocation.lat, currentLocation.lng);
      }
    };
  }, [currentLocation, isConnected]);

  // Manual connection control
  const connect = useCallback(() => {
    realTimeService.connect(serverUrl);
  }, [serverUrl]);

  const disconnect = useCallback(() => {
    realTimeService.disconnect();
    setIsConnected(false);
  }, []);

  // Location room management
  const joinLocationRoom = useCallback((lat: number, lng: number) => {
    realTimeService.joinLocationRoom(lat, lng);
  }, []);

  const leaveLocationRoom = useCallback((lat: number, lng: number) => {
    realTimeService.leaveLocationRoom(lat, lng);
  }, []);

  // Test notification
  const triggerTestNotification = useCallback((type: 'critical' | 'warning' | 'info' | 'safe' = 'info') => {
    realTimeService.triggerTestNotification(type);
  }, []);

  // Data management
  const clearAlerts = useCallback(() => {
    setAlerts([]);
  }, []);

  const clearIncidents = useCallback(() => {
    setIncidents([]);
  }, []);

  const markAlertAsRead = useCallback((alertId: string) => {
    setAlerts(prev => prev.filter(alert => alert.id !== alertId));
  }, []);

  return {
    isConnected,
    alerts,
    incidents,
    notifications,
    connect,
    disconnect,
    joinLocationRoom,
    leaveLocationRoom,
    triggerTestNotification,
    clearAlerts,
    clearIncidents,
    markAlertAsRead
  };
};

/**
 * Calculate distance between two coordinates in kilometers
 */
function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(value: number): number {
  return value * Math.PI / 180;
}

export default useRealTime;
