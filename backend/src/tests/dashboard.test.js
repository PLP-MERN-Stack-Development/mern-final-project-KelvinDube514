const request = require('supertest');
const app = require('../app');
const User = require('../models/User');
const Incident = require('../models/Incident');
const Alert = require('../models/Alert');

describe('Dashboard Endpoints', () => {
  let authToken;
  let adminToken;
  let authorityToken;
  let citizenUser;
  let adminUser;
  let authorityUser;

  beforeEach(async () => {
    // Clean database
    await User.deleteMany({});
    await Incident.deleteMany({});
    await Alert.deleteMany({});

    // Create test users
    citizenUser = await User.create({
      firstName: 'John',
      lastName: 'Citizen',
      email: 'citizen@example.com',
      password: 'Password123!',
      role: 'citizen',
      isVerified: true
    });

    authorityUser = await User.create({
      firstName: 'Jane',
      lastName: 'Authority',
      email: 'authority@example.com',
      password: 'Password123!',
      role: 'authority',
      isVerified: true
    });

    adminUser = await User.create({
      firstName: 'Admin',
      lastName: 'User',
      email: 'admin@example.com',
      password: 'Password123!',
      role: 'admin',
      isVerified: true
    });

    // Get auth tokens
    const citizenLogin = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'citizen@example.com',
        password: 'Password123!'
      });
    authToken = citizenLogin.body.token;

    const authorityLogin = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'authority@example.com',
        password: 'Password123!'
      });
    authorityToken = authorityLogin.body.token;

    const adminLogin = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'admin@example.com',
        password: 'Password123!'
      });
    adminToken = adminLogin.body.token;

    // Create sample data for dashboard
    await Incident.create([
      {
        title: 'Test Incident 1',
        description: 'First test incident for dashboard',
        type: 'theft',
        severity: 'high',
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
        reportedBy: citizenUser._id
      },
      {
        title: 'Test Incident 2',
        description: 'Second test incident for dashboard',
        type: 'assault',
        severity: 'medium',
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
        reportedBy: citizenUser._id
      }
    ]);

    await Alert.create([
      {
        title: 'Test Alert 1',
        message: 'First test alert for dashboard',
        type: 'safety_warning',
        priority: 'high',
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
        createdBy: authorityUser._id
      }
    ]);
  });

  describe('GET /api/dashboard/overview', () => {
    it('should get dashboard overview for citizen', async () => {
      const res = await request(app)
        .get('/api/dashboard/overview')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('incidents');
      expect(res.body.data).toHaveProperty('alerts');
      expect(res.body.data).toHaveProperty('userStats');
    });

    it('should get enhanced dashboard overview for authority', async () => {
      const res = await request(app)
        .get('/api/dashboard/overview')
        .set('Authorization', `Bearer ${authorityToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('incidents');
      expect(res.body.data).toHaveProperty('alerts');
      expect(res.body.data).toHaveProperty('userStats');
      expect(res.body.data).toHaveProperty('systemStats');
    });

    it('should get full dashboard overview for admin', async () => {
      const res = await request(app)
        .get('/api/dashboard/overview')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('incidents');
      expect(res.body.data).toHaveProperty('alerts');
      expect(res.body.data).toHaveProperty('userStats');
      expect(res.body.data).toHaveProperty('systemStats');
      expect(res.body.data).toHaveProperty('performance');
    });

    it('should require authentication', async () => {
      const res = await request(app)
        .get('/api/dashboard/overview')
        .expect(401);

      expect(res.body.success).toBe(false);
    });

    it('should filter data by location for citizen', async () => {
      const res = await request(app)
        .get('/api/dashboard/overview')
        .query({
          lat: 40.7128,
          lng: -74.006,
          radius: 5
        })
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.incidents.nearby).toBeDefined();
    });
  });

  describe('GET /api/dashboard/safety-metrics', () => {
    it('should get safety metrics for authorized users', async () => {
      const res = await request(app)
        .get('/api/dashboard/safety-metrics')
        .set('Authorization', `Bearer ${authorityToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('safetyScore');
      expect(res.body.data).toHaveProperty('trends');
      expect(res.body.data).toHaveProperty('riskAreas');
      expect(typeof res.body.data.safetyScore).toBe('number');
    });

    it('should deny access to citizens', async () => {
      const res = await request(app)
        .get('/api/dashboard/safety-metrics')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(403);

      expect(res.body.success).toBe(false);
    });

    it('should support different time ranges', async () => {
      const res = await request(app)
        .get('/api/dashboard/safety-metrics')
        .query({ timeframe: '7d' })
        .set('Authorization', `Bearer ${authorityToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.timeframe).toBe('7d');
    });

    it('should support location filtering', async () => {
      const res = await request(app)
        .get('/api/dashboard/safety-metrics')
        .query({
          lat: 40.7128,
          lng: -74.006,
          radius: 10
        })
        .set('Authorization', `Bearer ${authorityToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.location).toBeDefined();
    });
  });

  describe('GET /api/dashboard/analytics', () => {
    it('should get analytics data for admin', async () => {
      const res = await request(app)
        .get('/api/dashboard/analytics')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('incidentAnalytics');
      expect(res.body.data).toHaveProperty('userAnalytics');
      expect(res.body.data).toHaveProperty('systemAnalytics');
      expect(res.body.data).toHaveProperty('trends');
    });

    it('should allow authority access to limited analytics', async () => {
      const res = await request(app)
        .get('/api/dashboard/analytics')
        .set('Authorization', `Bearer ${authorityToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('incidentAnalytics');
      // Should not have full system analytics
      expect(res.body.data.systemAnalytics).toBeUndefined();
    });

    it('should deny access to citizens', async () => {
      const res = await request(app)
        .get('/api/dashboard/analytics')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(403);

      expect(res.body.success).toBe(false);
    });

    it('should support date range filtering', async () => {
      const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      const endDate = new Date().toISOString();

      const res = await request(app)
        .get('/api/dashboard/analytics')
        .query({
          startDate,
          endDate
        })
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.dateRange).toBeDefined();
    });
  });

  describe('GET /api/dashboard/reports', () => {
    it('should get reports for admin', async () => {
      const res = await request(app)
        .get('/api/dashboard/reports')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('reports');
      expect(Array.isArray(res.body.data.reports)).toBe(true);
    });

    it('should support report type filtering', async () => {
      const res = await request(app)
        .get('/api/dashboard/reports')
        .query({ type: 'safety' })
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.reportType).toBe('safety');
    });

    it('should support pagination', async () => {
      const res = await request(app)
        .get('/api/dashboard/reports')
        .query({
          page: 1,
          limit: 5
        })
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.pagination).toBeDefined();
      expect(res.body.data.pagination.page).toBe(1);
      expect(res.body.data.pagination.limit).toBe(5);
    });

    it('should deny access to unauthorized users', async () => {
      const res = await request(app)
        .get('/api/dashboard/reports')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(403);

      expect(res.body.success).toBe(false);
    });
  });

  describe('Real-time Dashboard Updates', () => {
    it('should handle real-time metrics updates', async () => {
      // This would typically test Socket.io integration
      // For now, we'll test the API endpoints that support real-time updates
      
      const res = await request(app)
        .get('/api/dashboard/overview')
        .query({ realtime: true })
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.timestamp).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid query parameters gracefully', async () => {
      const res = await request(app)
        .get('/api/dashboard/overview')
        .query({
          lat: 'invalid',
          lng: 'invalid',
          radius: -1
        })
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);

      expect(res.body.success).toBe(false);
      expect(res.body.error).toBeDefined();
    });

    it('should handle missing location data', async () => {
      const res = await request(app)
        .get('/api/dashboard/safety-metrics')
        .query({
          lat: 40.7128
          // Missing lng parameter
        })
        .set('Authorization', `Bearer ${authorityToken}`)
        .expect(400);

      expect(res.body.success).toBe(false);
    });

    it('should handle database errors gracefully', async () => {
      // Simulate database error by closing connection
      const originalFind = Incident.find;
      Incident.find = jest.fn().mockRejectedValue(new Error('Database connection error'));

      const res = await request(app)
        .get('/api/dashboard/overview')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(500);

      expect(res.body.success).toBe(false);

      // Restore original method
      Incident.find = originalFind;
    });
  });
});
