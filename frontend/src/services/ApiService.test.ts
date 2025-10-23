import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import ApiService from './ApiService';

const apiService = new (ApiService as any)();

// Mock fetch
global.fetch = vi.fn();

describe('ApiService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Authentication', () => {
    it('should register a new user', async () => {
      const mockResponse = {
        success: true,
        data: {
          user: { id: '123', email: 'test@example.com' },
          token: 'mock-token',
        },
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const userData = {
        firstName: 'Test',
        lastName: 'User',
        email: 'test@example.com',
        password: 'password123',
      };

      const result = await apiService.register(userData);
      
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/auth/register'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(userData),
        })
      );
      expect(result.success).toBe(true);
    });

    it('should login a user', async () => {
      const mockResponse = {
        success: true,
        data: {
          user: { id: '123', email: 'test@example.com' },
          token: 'mock-token',
        },
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const credentials = {
        email: 'test@example.com',
        password: 'password123',
      };

      const result = await apiService.login(credentials.email, credentials.password);
      
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/auth/login'),
        expect.objectContaining({
          method: 'POST',
        })
      );
      expect(result.success).toBe(true);
    });

    it('should handle authentication errors', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({
          success: false,
          message: 'Invalid credentials',
        }),
      });

      const credentials = {
        email: 'test@example.com',
        password: 'wrongpassword',
      };

      await expect(apiService.login(credentials.email, credentials.password)).rejects.toThrow();
    });
  });

  describe('Incidents', () => {
    beforeEach(() => {
      localStorage.setItem('token', 'mock-token');
    });

    it('should fetch incidents', async () => {
      const mockIncidents = [
        { id: '1', title: 'Incident 1' },
        { id: '2', title: 'Incident 2' },
      ];

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: mockIncidents,
        }),
      });

      apiService.setAuthToken('mock-token');
      const result = await apiService.getIncidents();
      
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/incidents'),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': 'Bearer mock-token',
          }),
        })
      );
      expect(result.data).toEqual(mockIncidents);
    });

    it('should create an incident', async () => {
      const newIncident = {
        title: 'New Incident',
        description: 'Test description',
        type: 'crime',
        severity: 'medium',
        location: {
          coordinates: [-74.006, 40.7128],
          address: {
            street: '123 Test St',
            city: 'New York',
            state: 'NY',
            zipCode: '10001',
            country: 'USA',
          },
        },
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: { ...newIncident, id: '123' },
        }),
      });

      const result = await apiService.createIncident(newIncident);
      
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/incidents'),
        expect.objectContaining({
          method: 'POST',
        })
      );
      expect(result.success).toBe(true);
    });

    it('should update an incident', async () => {
      const incidentId = '123';
      const updates = { status: 'resolved' };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: { id: incidentId, ...updates },
        }),
      });

      const result = await apiService.updateIncident(incidentId, updates);
      
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining(`/incidents/${incidentId}`),
        expect.objectContaining({
          method: 'PUT',
        })
      );
      expect(result.success).toBe(true);
    });

    it('should delete an incident', async () => {
      const incidentId = '123';

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          message: 'Incident deleted',
        }),
      });

      const result = await apiService.deleteIncident(incidentId);
      
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining(`/incidents/${incidentId}`),
        expect.objectContaining({
          method: 'DELETE',
        })
      );
      expect(result.success).toBe(true);
    });
  });

  describe('Alerts', () => {
    beforeEach(() => {
      localStorage.setItem('token', 'mock-token');
    });

    it('should fetch alerts', async () => {
      const mockAlerts = [
        { id: '1', title: 'Alert 1', type: 'warning' },
        { id: '2', title: 'Alert 2', type: 'critical' },
      ];

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: mockAlerts,
        }),
      });

      const result = await apiService.getAlerts();
      
      expect(result.data).toEqual(mockAlerts);
    });

    it('should create an alert', async () => {
      const newAlert = {
        type: 'warning',
        title: 'New Alert',
        message: 'Test alert message',
        location: {
          coordinates: [-74.006, 40.7128],
        },
        radius: 1000,
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: { ...newAlert, id: '123' },
        }),
      });

      const result = await apiService.createAlert(newAlert);
      
      expect(result.success).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should handle network errors', async () => {
      (global.fetch as any).mockRejectedValueOnce(new Error('Network error'));

      await expect(apiService.getIncidents()).rejects.toThrow();
    });

    it('should handle 404 errors', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => ({
          success: false,
          message: 'Not found',
        }),
      });

      await expect(apiService.getIncidents()).rejects.toThrow();
    });

    it('should handle 500 errors', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({
          success: false,
          message: 'Server error',
        }),
      });

      await expect(apiService.getIncidents()).rejects.toThrow();
    });
  });

  describe('Token Management', () => {
    it('should include auth token in requests', async () => {
      const token = 'test-token-123';
      localStorage.setItem('token', token);

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: [] }),
      });

      apiService.setAuthToken(token);
      await apiService.getIncidents();

      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': `Bearer ${token}`,
          }),
        })
      );
    });

    it('should work without token for public endpoints', async () => {
      localStorage.removeItem('token');

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: [] }),
      });

      apiService.setAuthToken(null);
      await apiService.getIncidents();

      expect(global.fetch).toHaveBeenCalled();
    });
  });
});
