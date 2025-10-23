const request = require('supertest');
const app = require('../app');
const User = require('../models/User');
const Incident = require('../models/Incident');
const Alert = require('../models/Alert');
const fs = require('fs').promises;
const path = require('path');

describe('Export Endpoints', () => {
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

    // Create sample data for export
    await Incident.create([
      {
        title: 'Export Test Incident 1',
        description: 'First incident for export testing',
        type: 'theft',
        severity: 'high',
        status: 'reported',
        location: {
          coordinates: [-74.006, 40.7128],
          address: {
            street: '123 Export St',
            city: 'New York',
            state: 'NY',
            zipCode: '10001',
            country: 'USA'
          }
        },
        reportedBy: citizenUser._id,
        createdAt: new Date('2024-01-01')
      },
      {
        title: 'Export Test Incident 2',
        description: 'Second incident for export testing',
        type: 'assault',
        severity: 'medium',
        status: 'verified',
        location: {
          coordinates: [-74.007, 40.7129],
          address: {
            street: '124 Export St',
            city: 'New York',
            state: 'NY',
            zipCode: '10001',
            country: 'USA'
          }
        },
        reportedBy: citizenUser._id,
        verifiedBy: authorityUser._id,
        createdAt: new Date('2024-01-02')
      }
    ]);

    await Alert.create([
      {
        title: 'Export Test Alert 1',
        message: 'First alert for export testing',
        type: 'safety_warning',
        priority: 'high',
        location: {
          coordinates: [-74.006, 40.7128],
          address: {
            street: '123 Export St',
            city: 'New York',
            state: 'NY',
            zipCode: '10001',
            country: 'USA'
          }
        },
        createdBy: authorityUser._id,
        createdAt: new Date('2024-01-01')
      }
    ]);
  });

  afterEach(async () => {
    // Clean up exported files
    try {
      const uploadsDir = path.join(__dirname, '../../uploads');
      const files = await fs.readdir(uploadsDir);
      const exportFiles = files.filter(file => 
        file.startsWith('incidents_export_') || 
        file.startsWith('alerts_export_') ||
        file.startsWith('users_export_')
      );
      
      for (const file of exportFiles) {
        await fs.unlink(path.join(uploadsDir, file));
      }
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  describe('GET /api/export/incidents', () => {
    it('should export incidents as CSV for authority', async () => {
      const res = await request(app)
        .get('/api/export/incidents')
        .query({ format: 'csv' })
        .set('Authorization', `Bearer ${authorityToken}`)
        .expect(200);

      expect(res.headers['content-type']).toContain('text/csv');
      expect(res.headers['content-disposition']).toContain('attachment');
      expect(res.text).toContain('Export Test Incident 1');
      expect(res.text).toContain('Export Test Incident 2');
    });

    it('should export incidents as JSON for authority', async () => {
      const res = await request(app)
        .get('/api/export/incidents')
        .query({ format: 'json' })
        .set('Authorization', `Bearer ${authorityToken}`)
        .expect(200);

      expect(res.headers['content-type']).toContain('application/json');
      expect(res.body).toHaveProperty('data');
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);
    });

    it('should export incidents as Excel for admin', async () => {
      const res = await request(app)
        .get('/api/export/incidents')
        .query({ format: 'xlsx' })
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.headers['content-type']).toContain('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      expect(res.headers['content-disposition']).toContain('attachment');
    });

    it('should filter incidents by date range', async () => {
      const res = await request(app)
        .get('/api/export/incidents')
        .query({
          format: 'json',
          startDate: '2024-01-01',
          endDate: '2024-01-01'
        })
        .set('Authorization', `Bearer ${authorityToken}`)
        .expect(200);

      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].title).toBe('Export Test Incident 1');
    });

    it('should filter incidents by type', async () => {
      const res = await request(app)
        .get('/api/export/incidents')
        .query({
          format: 'json',
          type: 'theft'
        })
        .set('Authorization', `Bearer ${authorityToken}`)
        .expect(200);

      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].type).toBe('theft');
    });

    it('should filter incidents by severity', async () => {
      const res = await request(app)
        .get('/api/export/incidents')
        .query({
          format: 'json',
          severity: 'high'
        })
        .set('Authorization', `Bearer ${authorityToken}`)
        .expect(200);

      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].severity).toBe('high');
    });

    it('should filter incidents by status', async () => {
      const res = await request(app)
        .get('/api/export/incidents')
        .query({
          format: 'json',
          status: 'verified'
        })
        .set('Authorization', `Bearer ${authorityToken}`)
        .expect(200);

      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].status).toBe('verified');
    });

    it('should filter incidents by location', async () => {
      const res = await request(app)
        .get('/api/export/incidents')
        .query({
          format: 'json',
          lat: 40.7128,
          lng: -74.006,
          radius: 1
        })
        .set('Authorization', `Bearer ${authorityToken}`)
        .expect(200);

      expect(res.body.data.length).toBeGreaterThan(0);
    });

    it('should deny access to citizens', async () => {
      const res = await request(app)
        .get('/api/export/incidents')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(403);

      expect(res.body.success).toBe(false);
    });

    it('should require authentication', async () => {
      const res = await request(app)
        .get('/api/export/incidents')
        .expect(401);

      expect(res.body.success).toBe(false);
    });

    it('should handle invalid format gracefully', async () => {
      const res = await request(app)
        .get('/api/export/incidents')
        .query({ format: 'invalid' })
        .set('Authorization', `Bearer ${authorityToken}`)
        .expect(400);

      expect(res.body.success).toBe(false);
    });
  });

  describe('GET /api/export/alerts', () => {
    it('should export alerts as CSV for authority', async () => {
      const res = await request(app)
        .get('/api/export/alerts')
        .query({ format: 'csv' })
        .set('Authorization', `Bearer ${authorityToken}`)
        .expect(200);

      expect(res.headers['content-type']).toContain('text/csv');
      expect(res.text).toContain('Export Test Alert 1');
    });

    it('should export alerts as JSON for authority', async () => {
      const res = await request(app)
        .get('/api/export/alerts')
        .query({ format: 'json' })
        .set('Authorization', `Bearer ${authorityToken}`)
        .expect(200);

      expect(res.body).toHaveProperty('data');
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);
    });

    it('should filter alerts by date range', async () => {
      const res = await request(app)
        .get('/api/export/alerts')
        .query({
          format: 'json',
          startDate: '2024-01-01',
          endDate: '2024-01-01'
        })
        .set('Authorization', `Bearer ${authorityToken}`)
        .expect(200);

      expect(res.body.data.length).toBe(1);
    });

    it('should filter alerts by type', async () => {
      const res = await request(app)
        .get('/api/export/alerts')
        .query({
          format: 'json',
          type: 'safety_warning'
        })
        .set('Authorization', `Bearer ${authorityToken}`)
        .expect(200);

      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].type).toBe('safety_warning');
    });

    it('should filter alerts by priority', async () => {
      const res = await request(app)
        .get('/api/export/alerts')
        .query({
          format: 'json',
          priority: 'high'
        })
        .set('Authorization', `Bearer ${authorityToken}`)
        .expect(200);

      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].priority).toBe('high');
    });

    it('should deny access to citizens', async () => {
      const res = await request(app)
        .get('/api/export/alerts')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(403);

      expect(res.body.success).toBe(false);
    });
  });

  describe('GET /api/export/users', () => {
    it('should export users as CSV for admin only', async () => {
      const res = await request(app)
        .get('/api/export/users')
        .query({ format: 'csv' })
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.headers['content-type']).toContain('text/csv');
      expect(res.text).toContain('citizen@example.com');
      expect(res.text).toContain('authority@example.com');
      expect(res.text).toContain('admin@example.com');
    });

    it('should export users as JSON for admin only', async () => {
      const res = await request(app)
        .get('/api/export/users')
        .query({ format: 'json' })
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body).toHaveProperty('data');
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBe(3);
    });

    it('should filter users by role', async () => {
      const res = await request(app)
        .get('/api/export/users')
        .query({
          format: 'json',
          role: 'citizen'
        })
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].role).toBe('citizen');
    });

    it('should filter users by verification status', async () => {
      const res = await request(app)
        .get('/api/export/users')
        .query({
          format: 'json',
          isVerified: true
        })
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.data.length).toBe(3);
      expect(res.body.data.every(user => user.isVerified)).toBe(true);
    });

    it('should exclude sensitive data from user export', async () => {
      const res = await request(app)
        .get('/api/export/users')
        .query({ format: 'json' })
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      // Check that password and other sensitive fields are not included
      expect(res.body.data[0]).not.toHaveProperty('password');
      expect(res.body.data[0]).not.toHaveProperty('verificationToken');
      expect(res.body.data[0]).not.toHaveProperty('resetPasswordToken');
    });

    it('should deny access to authority users', async () => {
      const res = await request(app)
        .get('/api/export/users')
        .set('Authorization', `Bearer ${authorityToken}`)
        .expect(403);

      expect(res.body.success).toBe(false);
    });

    it('should deny access to citizens', async () => {
      const res = await request(app)
        .get('/api/export/users')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(403);

      expect(res.body.success).toBe(false);
    });
  });

  describe('Export Rate Limiting', () => {
    it('should apply rate limiting to export endpoints', async () => {
      // Make multiple rapid requests to test rate limiting
      const requests = Array(6).fill().map(() => 
        request(app)
          .get('/api/export/incidents')
          .query({ format: 'json' })
          .set('Authorization', `Bearer ${authorityToken}`)
      );

      const responses = await Promise.all(requests);
      
      // Some requests should be rate limited (429 status)
      const rateLimitedResponses = responses.filter(res => res.status === 429);
      expect(rateLimitedResponses.length).toBeGreaterThan(0);
    });
  });

  describe('Error Handling', () => {
    it('should handle database errors gracefully', async () => {
      // Simulate database error
      const originalFind = Incident.find;
      Incident.find = jest.fn().mockRejectedValue(new Error('Database error'));

      const res = await request(app)
        .get('/api/export/incidents')
        .query({ format: 'json' })
        .set('Authorization', `Bearer ${authorityToken}`)
        .expect(500);

      expect(res.body.success).toBe(false);

      // Restore original method
      Incident.find = originalFind;
    });

    it('should handle invalid date ranges', async () => {
      const res = await request(app)
        .get('/api/export/incidents')
        .query({
          format: 'json',
          startDate: 'invalid-date',
          endDate: '2024-01-01'
        })
        .set('Authorization', `Bearer ${authorityToken}`)
        .expect(400);

      expect(res.body.success).toBe(false);
    });

    it('should handle empty result sets', async () => {
      const res = await request(app)
        .get('/api/export/incidents')
        .query({
          format: 'json',
          startDate: '2025-01-01',
          endDate: '2025-01-02'
        })
        .set('Authorization', `Bearer ${authorityToken}`)
        .expect(200);

      expect(res.body.data).toEqual([]);
    });
  });
});
