/**
 * NotificationService - Handles audio notifications for alerts
 * Provides different sounds for different alert types with user preferences
 */

export interface NotificationPreferences {
  enabled: boolean;
  volume: number; // 0-1
  critical: boolean;
  warning: boolean;
  info: boolean;
  safe: boolean;
}

export type AlertType = 'critical' | 'warning' | 'info' | 'safe';

class NotificationService {
  private audioContext: AudioContext | null = null;
  private preferences: NotificationPreferences;
  private isInitialized = false;

  constructor() {
    this.preferences = this.loadPreferences();
  }

  /**
   * Initialize the audio context and load preferences
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Initialize Web Audio API
      if (typeof window !== 'undefined' && window.AudioContext) {
        this.audioContext = new AudioContext();
        this.isInitialized = true;
      }
    } catch (error) {
      console.warn('Failed to initialize NotificationService:', error);
    }
  }

  /**
   * Play notification sound for specific alert type
   */
  async playNotification(alertType: AlertType): Promise<void> {
    if (!this.preferences.enabled || !this.preferences[alertType]) {
      return;
    }

    await this.initialize();

    if (!this.audioContext) {
      console.warn('Audio context not available');
      return;
    }

    try {
      // Resume audio context if suspended (required by browser policies)
      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
      }

      const frequency = this.getFrequencyForAlertType(alertType);
      const duration = this.getDurationForAlertType(alertType);
      
      await this.playTone(frequency, duration);
    } catch (error) {
      console.error('Failed to play notification sound:', error);
    }
  }

  /**
   * Generate a tone using Web Audio API
   */
  private async playTone(frequency: number, duration: number): Promise<void> {
    if (!this.audioContext) return;

    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);

    oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
    oscillator.type = 'sine';

    // Set volume based on preferences
    gainNode.gain.setValueAtTime(this.preferences.volume * 0.3, this.audioContext.currentTime);
    
    // Fade out to avoid clicking
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);

    oscillator.start(this.audioContext.currentTime);
    oscillator.stop(this.audioContext.currentTime + duration);

    return new Promise(resolve => {
      oscillator.onended = () => resolve();
    });
  }

  /**
   * Get frequency for different alert types
   */
  private getFrequencyForAlertType(alertType: AlertType): number {
    switch (alertType) {
      case 'critical':
        return 800; // High urgency
      case 'warning':
        return 600; // Medium urgency
      case 'info':
        return 400; // Low urgency
      case 'safe':
        return 300; // Calm
      default:
        return 500;
    }
  }

  /**
   * Get duration for different alert types
   */
  private getDurationForAlertType(alertType: AlertType): number {
    switch (alertType) {
      case 'critical':
        return 1.5; // Longer for critical
      case 'warning':
        return 1.0;
      case 'info':
        return 0.8;
      case 'safe':
        return 0.6;
      default:
        return 1.0;
    }
  }

  /**
   * Play a sequence of beeps for critical alerts
   */
  async playCriticalAlert(): Promise<void> {
    if (!this.preferences.enabled || !this.preferences.critical) {
      return;
    }

    await this.initialize();

    if (!this.audioContext) return;

    try {
      // Play three urgent beeps for critical alerts
      await this.playTone(800, 0.3);
      await new Promise(resolve => setTimeout(resolve, 100));
      await this.playTone(900, 0.3);
      await new Promise(resolve => setTimeout(resolve, 100));
      await this.playTone(1000, 0.4);
    } catch (error) {
      console.error('Failed to play critical alert sound:', error);
    }
  }

  /**
   * Update notification preferences
   */
  updatePreferences(newPreferences: Partial<NotificationPreferences>): void {
    this.preferences = { ...this.preferences, ...newPreferences };
    this.savePreferences();
  }

  /**
   * Get current preferences
   */
  getPreferences(): NotificationPreferences {
    return { ...this.preferences };
  }

  /**
   * Test notification sound
   */
  async testNotification(alertType: AlertType): Promise<void> {
    // Temporarily enable notifications for testing
    const originalEnabled = this.preferences.enabled;
    const originalTypeEnabled = this.preferences[alertType];
    
    this.preferences.enabled = true;
    this.preferences[alertType] = true;

    if (alertType === 'critical') {
      await this.playCriticalAlert();
    } else {
      await this.playNotification(alertType);
    }

    // Restore original settings
    this.preferences.enabled = originalEnabled;
    this.preferences[alertType] = originalTypeEnabled;
  }

  /**
   * Load preferences from localStorage
   */
  private loadPreferences(): NotificationPreferences {
    try {
      const stored = localStorage.getItem('notification-preferences');
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.warn('Failed to load notification preferences:', error);
    }

    // Return default preferences
    return {
      enabled: true,
      volume: 0.7,
      critical: true,
      warning: true,
      info: true,
      safe: true
    };
  }

  /**
   * Save preferences to localStorage
   */
  private savePreferences(): void {
    try {
      localStorage.setItem('notification-preferences', JSON.stringify(this.preferences));
    } catch (error) {
      console.warn('Failed to save notification preferences:', error);
    }
  }

  /**
   * Check if notifications are supported by the browser
   */
  isSupported(): boolean {
    return typeof window !== 'undefined' && 
           window.AudioContext !== undefined;
  }

  /**
   * Request permission for browser notifications (for future use)
   */
  async requestPermission(): Promise<boolean> {
    if (typeof window === 'undefined' || !window.Notification) {
      return false;
    }

    if (Notification.permission === 'granted') {
      return true;
    }

    if (Notification.permission === 'denied') {
      return false;
    }

    try {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    } catch (error) {
      console.warn('Failed to request notification permission:', error);
      return false;
    }
  }
}

// Create singleton instance
export const notificationService = new NotificationService();
export default NotificationService;
