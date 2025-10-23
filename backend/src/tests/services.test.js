const analyticsService = require('../services/analyticsService');
const metricsService = require('../services/metricsService');
const User = require('../models/User');
const Incident = require('../models/Incident');
const Alert = require('../models/Alert');

describe('Services Tests', () => {
  let testUser;
  let testIncident;
  let testAlert;

  beforeEach(async () => {
    // Clean up database
    await User.deleteMany({});
    await Incident.deleteMany({});
    await Alert.deleteMany({});

    // Create test user
    testUser = await User.create({
      firstName: 'Test',
      lastName: 'User',
      email: 'test@example.com',
      password: 'Password123!',
      role: 'citizen',
      isVerified: true,
      location: {
        coordinates: [-74.006, 40.7128],
        address: {
          street: '123 Test St',
          city: 'New York',
          state: 'NY',
          zipCode: '10001',
          country: 'USA'
        }
      }
    });

    // Create test incident
    testIncident = await Incident.create({
      title: 'Test Incident',
      description: 'This is a test incident for testing purposes',
      type: 'theft',
      severity: 'medium',
      location: {
        coordinates: [-74.006, 40.7128],
        address: {
          street: '123 Test St',
          city: 'New York',
          state: 'NY',
          zipCode: '10001',
          country: 'USA'
        }
      },
      reportedBy: testUser._id
    });

    // Create test alert
    testAlert = await Alert.create({
      title: 'Test Alert',
      message: 'This is a test alert for testing purposes',
      type: 'safety_warning',
      priority: 'medium',
      location: {
        coordinates: [-74.006, 40.7128],
        address: {
          street: '123 Test St',
          city: 'New York',
          state: 'NY',
          zipCode: '10001',
          country: 'USA'
        }
      },
      createdBy: testUser._id
    });
  });

  describe('Analytics Service', () => {
    describe('calculateSafetyScore', () => {
      it('should calculate safety score correctly', async () => {
        const safetyScore = await analyticsService.calculateSafetyScore(
          testUser.location.coordinates[1], // lat
          testUser.location.coordinates[0], // lng
          5 // radius in km
        );

        expect(safetyScore).toBeDefined();
        expect(typeof safetyScore).toBe('number');
        expect(safetyScore).toBeGreaterThanOrEqual(0);
        expect(safetyScore).toBeLessThanOrEqual(100);
      });

      it('should return high safety score for area with no incidents', async () => {
        // Clear all incidents
        await Incident.deleteMany({});

        const safetyScore = await analyticsService.calculateSafetyScore(
          testUser.location.coordinates[1],
          testUser.location.coordinates[0],
          5
        );

        expect(safetyScore).toBeGreaterThan(80);
      });

      it('should handle invalid coordinates gracefully', async () => {
        const safetyScore = await analyticsService.calculateSafetyScore(
          999, // invalid lat
          999, // invalid lng
          5
        );

        expect(safetyScore).toBeDefined();
        expect(typeof safetyScore).toBe('number');
      });
    });

    describe('getIncidentTrends', () => {
      it('should return incident trends data', async () => {
        const trends = await analyticsService.getIncidentTrends({
          startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
          endDate: new Date(),
          location: testUser.location.coordinates,
          radius: 10
        });

        expect(trends).toBeDefined();
        expect(Array.isArray(trends.dailyTrends)).toBe(true);
        expect(Array.isArray(trends.typeTrends)).toBe(true);
        expect(Array.isArray(trends.severityTrends)).toBe(true);
      });

      it('should filter by date range correctly', async () => {
        const trends = await analyticsService.getIncidentTrends({
          startDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // tomorrow
          endDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // day after tomorrow
          location: testUser.location.coordinates,
          radius: 10
        });

        expect(trends.totalIncidents).toBe(0);
      });
    });

    describe('generateSafetyReport', () => {
      it('should generate comprehensive safety report', async () => {
        const report = await analyticsService.generateSafetyReport({
          location: testUser.location.coordinates,
          radius: 10,
          timeframe: '30d'
        });

        expect(report).toBeDefined();
        expect(report).toHaveProperty('safetyScore');
        expect(report).toHaveProperty('incidentSummary');
        expect(report).toHaveProperty('alertSummary');
        expect(report).toHaveProperty('trends');
        expect(report).toHaveProperty('recommendations');
      });
    });
  });

  describe('Metrics Service', () => {
    describe('getSystemMetrics', () => {
      it('should return system performance metrics', async () => {
        const metrics = await metricsService.getSystemMetrics();

        expect(metrics).toBeDefined();
        expect(metrics).toHaveProperty('memory');
        expect(metrics).toHaveProperty('cpu');
        expect(metrics).toHaveProperty('uptime');
        expect(metrics).toHaveProperty('database');
        expect(typeof metrics.uptime).toBe('number');
      });
    });

    describe('getDatabaseMetrics', () => {
      it('should return database metrics', async () => {
        const metrics = await metricsService.getDatabaseMetrics();

        expect(metrics).toBeDefined();
        expect(metrics).toHaveProperty('users');
        expect(metrics).toHaveProperty('incidents');
        expect(metrics).toHaveProperty('alerts');
        expect(metrics).toHaveProperty('collections');
        expect(typeof metrics.users.total).toBe('number');
        expect(typeof metrics.incidents.total).toBe('number');
        expect(typeof metrics.alerts.total).toBe('number');
      });
    });

    describe('getApiMetrics', () => {
      it('should return API usage metrics', async () => {
        const metrics = await metricsService.getApiMetrics();

        expect(metrics).toBeDefined();
        expect(metrics).toHaveProperty('totalRequests');
        expect(metrics).toHaveProperty('averageResponseTime');
        expect(metrics).toHaveProperty('errorRate');
        expect(metrics).toHaveProperty('endpoints');
        expect(typeof metrics.totalRequests).toBe('number');
      });
    });

    describe('getUserActivityMetrics', () => {
      it('should return user activity metrics', async () => {
        const metrics = await metricsService.getUserActivityMetrics();

        expect(metrics).toBeDefined();
        expect(metrics).toHaveProperty('activeUsers');
        expect(metrics).toHaveProperty('newRegistrations');
        expect(metrics).toHaveProperty('usersByRole');
        expect(metrics).toHaveProperty('verificationRate');
        expect(typeof metrics.activeUsers.today).toBe('number');
      });
    });

    describe('getIncidentMetrics', () => {
      it('should return incident-specific metrics', async () => {
        const metrics = await metricsService.getIncidentMetrics();

        expect(metrics).toBeDefined();
        expect(metrics).toHaveProperty('total');
        expect(metrics).toHaveProperty('byType');
        expect(metrics).toHaveProperty('bySeverity');
        expect(metrics).toHaveProperty('byStatus');
        expect(metrics).toHaveProperty('averageResolutionTime');
        expect(typeof metrics.total).toBe('number');
      });
    });

    describe('getAlertMetrics', () => {
      it('should return alert-specific metrics', async () => {
        const metrics = await metricsService.getAlertMetrics();

        expect(metrics).toBeDefined();
        expect(metrics).toHaveProperty('total');
        expect(metrics).toHaveProperty('byType');
        expect(metrics).toHaveProperty('byPriority');
        expect(metrics).toHaveProperty('deliveryRate');
        expect(metrics).toHaveProperty('responseTime');
        expect(typeof metrics.total).toBe('number');
      });
    });

    describe('getPerformanceMetrics', () => {
      it('should return performance metrics with time series data', async () => {
        const metrics = await metricsService.getPerformanceMetrics('24h');

        expect(metrics).toBeDefined();
        expect(metrics).toHaveProperty('timeframe');
        expect(metrics).toHaveProperty('responseTime');
        expect(metrics).toHaveProperty('throughput');
        expect(metrics).toHaveProperty('errorRate');
        expect(metrics).toHaveProperty('dataPoints');
        expect(Array.isArray(metrics.dataPoints)).toBe(true);
      });

      it('should handle different timeframes', async () => {
        const timeframes = ['1h', '24h', '7d', '30d'];

        for (const timeframe of timeframes) {
          const metrics = await metricsService.getPerformanceMetrics(timeframe);
          expect(metrics.timeframe).toBe(timeframe);
          expect(Array.isArray(metrics.dataPoints)).toBe(true);
        }
      });
    });
  });

  describe('Integration Tests', () => {
    it('should handle service dependencies correctly', async () => {
      // Create multiple incidents for better data
      await Incident.create([
        {
          title: 'Test Incident 2',
          description: 'Another test incident',
          type: 'assault',
          severity: 'high',
          location: {
            coordinates: [-74.007, 40.7129],
            address: {
              street: '124 Test St',
              city: 'New York',
              state: 'NY',
              zipCode: '10001',
              country: 'USA'
            }
          },
          reportedBy: testUser._id
        },
        {
          title: 'Test Incident 3',
          description: 'Third test incident',
          type: 'vandalism',
          severity: 'low',
          location: {
            coordinates: [-74.008, 40.7130],
            address: {
              street: '125 Test St',
              city: 'New York',
              state: 'NY',
              zipCode: '10001',
              country: 'USA'
            }
          },
          reportedBy: testUser._id
        }
      ]);

      // Test analytics service with more data
      const safetyScore = await analyticsService.calculateSafetyScore(
        testUser.location.coordinates[1],
        testUser.location.coordinates[0],
        5
      );

      const trends = await analyticsService.getIncidentTrends({
        startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        endDate: new Date(),
        location: testUser.location.coordinates,
        radius: 10
      });

      const report = await analyticsService.generateSafetyReport({
        location: testUser.location.coordinates,
        radius: 10,
        timeframe: '7d'
      });

      // Test metrics service
      const dbMetrics = await metricsService.getDatabaseMetrics();
      const incidentMetrics = await metricsService.getIncidentMetrics();

      // Assertions
      expect(safetyScore).toBeDefined();
      expect(trends.totalIncidents).toBeGreaterThan(0);
      expect(report.incidentSummary.total).toBeGreaterThan(0);
      expect(dbMetrics.incidents.total).toBeGreaterThan(0);
      expect(incidentMetrics.total).toBeGreaterThan(0);
    });

    it('should handle errors gracefully', async () => {
      // Test with invalid data
      try {
        await analyticsService.calculateSafetyScore(null, null, -1);
      } catch (error) {
        expect(error).toBeDefined();
      }

      // Test metrics with database disconnect simulation
      const originalFind = Incident.find;
      Incident.find = jest.fn().mockRejectedValue(new Error('Database error'));

      try {
        await metricsService.getIncidentMetrics();
      } catch (error) {
        expect(error.message).toContain('Database error');
      }

      // Restore original method
      Incident.find = originalFind;
    });
  });
});
