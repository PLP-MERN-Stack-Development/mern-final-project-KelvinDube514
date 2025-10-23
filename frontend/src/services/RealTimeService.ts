/**
 * RealTimeService - Handles Socket.io connections and real-time notifications
 * Integrates with NotificationService to play sounds for incoming alerts
 */

import { io, Socket } from 'socket.io-client';
import { notificationService, AlertType } from './NotificationService';

export interface RealTimeAlert {
  id: string;
  type: 'critical' | 'warning' | 'info' | 'safe';
  title: string;
  message: string;
  location: {
    coordinates: [number, number];
    address: string;
  };
  createdBy: string;
  priority: string;
  createdAt: string;
  expiresAt: string;
}

export interface RealTimeIncident {
  id: string;
  type: string;
  title: string;
  description: string;
  location: {
    coordinates: [number, number];
    address: string;
  };
  severity: 'low' | 'medium' | 'high' | 'critical';
  reportedBy: string;
  createdAt: string;
}

type EventCallback<T = any> = (data: T) => void;

class RealTimeService {
  private socket: Socket | null = null;
  private isConnected = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private eventListeners: Map<string, EventCallback[]> = new Map();

  /**
   * Initialize connection to the backend Socket.io server
   */
  connect(serverUrl: string = 'http://localhost:5000', authToken?: string): void {
    if (this.socket?.connected) {
      console.log('Already connected to real-time service');
      return;
    }

    try {
      // Get token from localStorage if not provided
      const token = authToken || localStorage.getItem('authToken');
      
      this.socket = io(serverUrl, {
        transports: ['websocket', 'polling'],
        timeout: 20000,
        forceNew: true,
        auth: {
          token: token || undefined
        }
      });

      this.setupEventHandlers();
      console.log('Connecting to real-time service...');
    } catch (error) {
      console.error('Failed to initialize real-time connection:', error);
    }
  }

  /**
   * Setup Socket.io event handlers
   */
  private setupEventHandlers(): void {
    if (!this.socket) return;

    // Connection events
    this.socket.on('connect', () => {
      console.log('Connected to real-time service');
      this.isConnected = true;
      this.reconnectAttempts = 0;
      this.emit('connected', true);
    });

    this.socket.on('disconnect', (reason) => {
      console.log('Disconnected from real-time service:', reason);
      this.isConnected = false;
      this.emit('connected', false);
    });

    this.socket.on('connect_error', (error) => {
      console.error('Connection error:', error);
      this.handleReconnection();
    });

    // Alert events
    this.socket.on('new_alert', (alert: RealTimeAlert) => {
      console.log('Received new alert:', alert);
      this.handleNewAlert(alert);
      this.emit('alert', alert);
    });

    this.socket.on('alert_updated', (alert: RealTimeAlert) => {
      console.log('Alert updated:', alert);
      this.emit('alert_updated', alert);
    });

    // Incident events
    this.socket.on('new_incident', (incident: RealTimeIncident) => {
      console.log('Received new incident:', incident);
      this.handleNewIncident(incident);
      this.emit('incident', incident);
    });

    this.socket.on('incident_updated', (incident: RealTimeIncident) => {
      console.log('Incident updated:', incident);
      this.emit('incident_updated', incident);
    });

    // Location-based events
    this.socket.on('emergency_broadcast', (data: any) => {
      console.log('Emergency broadcast received:', data);
      // Play critical alert sound for emergency broadcasts
      notificationService.playCriticalAlert();
      this.emit('emergency_broadcast', data);
    });

    // System notifications
    this.socket.on('system_notification', (notification: any) => {
      console.log('System notification:', notification);
      this.emit('system_notification', notification);
    });
  }

  /**
   * Handle new alert and play appropriate notification sound
   */
  private async handleNewAlert(alert: RealTimeAlert): Promise<void> {
    try {
      // Map alert priority to sound type
      let soundType: AlertType = 'info';
      
      switch (alert.priority?.toLowerCase()) {
        case 'critical':
        case 'urgent':
          soundType = 'critical';
          break;
        case 'high':
          soundType = 'warning';
          break;
        case 'medium':
          soundType = 'info';
          break;
        case 'low':
          soundType = 'safe';
          break;
        default:
          soundType = alert.type as AlertType;
      }

      // Play notification sound
      if (alert.priority === 'critical' || alert.priority === 'urgent') {
        await notificationService.playCriticalAlert();
      } else {
        await notificationService.playNotification(soundType);
      }

      // Show browser notification if permission granted
      if (Notification.permission === 'granted') {
        new Notification(alert.title, {
          body: alert.message,
          icon: '/favicon.ico',
          tag: alert.id,
          requireInteraction: soundType === 'critical'
        });
      }
    } catch (error) {
      console.error('Failed to handle new alert:', error);
    }
  }

  /**
   * Handle new incident and play appropriate notification sound
   */
  private async handleNewIncident(incident: RealTimeIncident): Promise<void> {
    try {
      // Map incident severity to sound type
      let soundType: AlertType = 'info';
      
      switch (incident.severity) {
        case 'critical':
          soundType = 'critical';
          break;
        case 'high':
          soundType = 'warning';
          break;
        case 'medium':
          soundType = 'info';
          break;
        case 'low':
          soundType = 'safe';
          break;
      }

      // Play notification sound
      if (incident.severity === 'critical') {
        await notificationService.playCriticalAlert();
      } else {
        await notificationService.playNotification(soundType);
      }

      // Show browser notification if permission granted
      if (Notification.permission === 'granted') {
        new Notification(`New ${incident.type} Incident`, {
          body: incident.description,
          icon: '/favicon.ico',
          tag: incident.id,
          requireInteraction: incident.severity === 'critical'
        });
      }
    } catch (error) {
      console.error('Failed to handle new incident:', error);
    }
  }

  /**
   * Handle reconnection attempts
   */
  private handleReconnection(): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
      
      setTimeout(() => {
        this.socket?.connect();
      }, Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000));
    } else {
      console.error('Max reconnection attempts reached');
      this.emit('reconnection_failed', true);
    }
  }

  /**
   * Join a location-based room for receiving nearby alerts
   */
  joinLocationRoom(latitude: number, longitude: number): void {
    if (!this.socket?.connected) {
      console.warn('Cannot join location room: not connected');
      return;
    }

    this.socket.emit('join_location', { latitude, longitude });
    console.log(`Joined location room: ${latitude}, ${longitude}`);
  }

  /**
   * Leave a location-based room
   */
  leaveLocationRoom(latitude: number, longitude: number): void {
    if (!this.socket?.connected) {
      console.warn('Cannot leave location room: not connected');
      return;
    }

    this.socket.emit('leave_location', { latitude, longitude });
    console.log(`Left location room: ${latitude}, ${longitude}`);
  }

  /**
   * Subscribe to real-time events
   */
  on<T = any>(event: string, callback: EventCallback<T>): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event)!.push(callback);
  }

  /**
   * Unsubscribe from real-time events
   */
  off(event: string, callback?: EventCallback): void {
    const listeners = this.eventListeners.get(event);
    if (!listeners) return;

    if (callback) {
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    } else {
      this.eventListeners.set(event, []);
    }
  }

  /**
   * Emit event to registered listeners
   */
  private emit<T = any>(event: string, data: T): void {
    const listeners = this.eventListeners.get(event) || [];
    listeners.forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error(`Error in event listener for ${event}:`, error);
      }
    });
  }

  /**
   * Send authentication token for socket connection
   */
  authenticate(token: string): void {
    if (!this.socket?.connected) {
      console.warn('Cannot authenticate: not connected');
      return;
    }

    this.socket.emit('authenticate', { token });
  }

  /**
   * Get connection status
   */
  getConnectionStatus(): boolean {
    return this.isConnected && !!this.socket?.connected;
  }

  /**
   * Disconnect from the service
   */
  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
      console.log('Disconnected from real-time service');
    }
  }

  /**
   * Manually trigger test notifications (for development)
   */
  triggerTestNotification(type: AlertType = 'info'): void {
    const testAlert: RealTimeAlert = {
      id: `test-${Date.now()}`,
      type,
      title: `Test ${type.charAt(0).toUpperCase() + type.slice(1)} Alert`,
      message: 'This is a test notification to verify sound functionality',
      location: {
        coordinates: [0, 0],
        address: 'Test Location'
      },
      createdBy: 'System',
      priority: type === 'critical' ? 'critical' : 'medium',
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    };

    this.handleNewAlert(testAlert);
    this.emit('alert', testAlert);
  }
}

// Create singleton instance
export const realTimeService = new RealTimeService();
export default RealTimeService;
