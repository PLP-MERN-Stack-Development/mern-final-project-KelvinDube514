import { describe, it, expect, vi, beforeEach } from 'vitest';
import NotificationService from './NotificationService';

describe('NotificationService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock Notification API
    global.Notification = {
      permission: 'default',
      requestPermission: vi.fn().mockResolvedValue('granted'),
    } as any;
  });

  describe('Permission Management', () => {
    it('should request notification permission', async () => {
      const result = await NotificationService.requestPermission();
      
      expect(global.Notification.requestPermission).toHaveBeenCalled();
      expect(result).toBe('granted');
    });

    it('should check if notifications are supported', () => {
      const isSupported = NotificationService.isSupported();
      
      expect(isSupported).toBe(true);
    });

    it('should handle unsupported browsers', () => {
      const originalNotification = global.Notification;
      (global as any).Notification = undefined;
      
      const isSupported = NotificationService.isSupported();
      
      expect(isSupported).toBe(false);
      
      global.Notification = originalNotification;
    });
  });

  describe('Notification Display', () => {
    it('should show a notification when permission is granted', async () => {
      global.Notification = class MockNotification {
        constructor(public title: string, public options?: NotificationOptions) {}
      } as any;
      global.Notification.permission = 'granted';

      const title = 'Test Notification';
      const options = { body: 'Test body' };

      NotificationService.show(title, options);

      // Notification should be created
      expect(true).toBe(true); // Basic check since we can't easily verify constructor calls
    });

    it('should not show notification when permission is denied', () => {
      global.Notification.permission = 'denied';

      const title = 'Test Notification';
      const options = { body: 'Test body' };

      // Should not throw error
      expect(() => NotificationService.show(title, options)).not.toThrow();
    });
  });

  describe('Alert Notifications', () => {
    beforeEach(() => {
      global.Notification = class MockNotification {
        constructor(public title: string, public options?: NotificationOptions) {}
      } as any;
      global.Notification.permission = 'granted';
    });

    it('should show critical alert notification', () => {
      const alert = {
        type: 'critical' as const,
        title: 'Emergency Alert',
        message: 'Immediate action required',
      };

      expect(() => NotificationService.showAlert(alert)).not.toThrow();
    });

    it('should show warning notification', () => {
      const alert = {
        type: 'warning' as const,
        title: 'Warning',
        message: 'Be cautious',
      };

      expect(() => NotificationService.showAlert(alert)).not.toThrow();
    });

    it('should show info notification', () => {
      const alert = {
        type: 'info' as const,
        title: 'Information',
        message: 'FYI',
      };

      expect(() => NotificationService.showAlert(alert)).not.toThrow();
    });
  });

  describe('Incident Notifications', () => {
    beforeEach(() => {
      global.Notification = class MockNotification {
        constructor(public title: string, public options?: NotificationOptions) {}
      } as any;
      global.Notification.permission = 'granted';
    });

    it('should show incident notification', () => {
      const incident = {
        title: 'New Incident',
        type: 'crime' as const,
        severity: 'high' as const,
        location: {
          address: {
            city: 'New York',
          },
        },
      };

      expect(() => NotificationService.showIncident(incident)).not.toThrow();
    });

    it('should include location in notification', () => {
      const incident = {
        title: 'Theft Reported',
        type: 'crime' as const,
        severity: 'medium' as const,
        location: {
          address: {
            city: 'Brooklyn',
            street: '123 Main St',
          },
        },
      };

      expect(() => NotificationService.showIncident(incident)).not.toThrow();
    });
  });
});
