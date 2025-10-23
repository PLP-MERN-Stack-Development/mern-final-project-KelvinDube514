const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../app');
const User = require('../models/User');
const Alert = require('../models/Alert');
const { generateToken } = require('../middleware/auth');

describe('Alert Endpoints', () => {
  let citizenToken;
  let authorityToken;
  let adminToken;
  let citizenUser;
  let authorityUser;
  let adminUser;

  beforeAll(async () => {
    // Connect to test database
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/securepath-test');
  });

  afterAll(async () => {
    // Clean up test database
    await mongoose.connection.db.dropDatabase();
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    // Clear collections before each test
    await User.deleteMany({});
    await Alert.deleteMany({});

    // Create test users
    citizenUser = await User.create({
      firstName: 'John',
      lastName: 'Citizen',
      email: 'citizen@example.com',
      password: 'password123',
      role: 'citizen',
      isVerified: true,
      location: {
        type: 'Point',
        coordinates: [-74.006, 40.7128],
        address: {
          street: '123 Main St',
          city: 'New York',
          state: 'NY',
          zipCode: '10001',
          country: 'USA'
        }
      }
    });

    authorityUser = await User.create({
      firstName: 'Jane',
      lastName: 'Authority',
      email: 'authority@example.com',
      password: 'password123',
      role: 'authority',
      isVerified: true,
      location: {
        type: 'Point',
        coordinates: [-74.006, 40.7128],
        address: {
          street: '456 Police Ave',
          city: 'New York',
          state: 'NY',
          zipCode: '10001',
          country: 'USA'
        }
      }
    });

    adminUser = await User.create({
      firstName: 'Admin',
      lastName: 'User',
      email: 'admin@example.com',
      password: 'password123',
      role: 'admin',
      isVerified: true
    });

    // Generate tokens
    citizenToken = generateToken(citizenUser._id);
    authorityToken = generateToken(authorityUser._id);
    adminToken = generateToken(adminUser._id);
  });

  describe('POST /api/alerts', () => {
    it('should create alert successfully as authority', async () => {
      const alertData = {
        title: 'Safety Warning',
        message: 'There is a safety concern in the downtown area. Please avoid if possible.',
        type: 'safety_warning',
        priority: 'high',
        targetAudience: 'all',
        location: {
          coordinates: [-74.006, 40.7128],
          radius: 5,
          address: {
            street: '789 Downtown St',
            city: 'New York',
            state: 'NY',
            zipCode: '10001',
            country: 'USA'
          }
        }
      };

      const response = await request(app)
        .post('/api/alerts')
        .set('Authorization', `Bearer ${authorityToken}`)
        .send(alertData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('Alert created successfully');
      expect(response.body.data.alert.title).toBe(alertData.title);
      expect(response.body.data.alert.createdBy._id).toBe(authorityUser._id.toString());
    });

    it('should create alert successfully as admin', async () => {
      const alertData = {
        title: 'System Maintenance',
        message: 'The system will be under maintenance tonight.',
        type: 'system_notification',
        priority: 'medium',
        targetAudience: 'all'
      };

      const response = await request(app)
        .post('/api/alerts')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(alertData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.alert.title).toBe(alertData.title);
    });

    it('should fail to create alert as citizen', async () => {
      const alertData = {
        title: 'Test Alert',
        message: 'This should not be allowed',
        type: 'safety_warning',
        priority: 'medium',
        targetAudience: 'all'
      };

      const response = await request(app)
        .post('/api/alerts')
        .set('Authorization', `Bearer ${citizenToken}`)
        .send(alertData)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Access denied');
    });

    it('should fail to create alert without authentication', async () => {
      const alertData = {
        title: 'Test Alert',
        message: 'This should not be allowed',
        type: 'safety_warning',
        priority: 'medium',
        targetAudience: 'all'
      };

      const response = await request(app)
        .post('/api/alerts')
        .send(alertData)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('No token provided');
    });

    it('should fail to create alert with invalid data', async () => {
      const alertData = {
        title: '', // Empty title
        message: 'Short', // Too short
        type: 'invalid_type',
        priority: 'invalid_priority',
        targetAudience: 'all'
      };

      const response = await request(app)
        .post('/api/alerts')
        .set('Authorization', `Bearer ${authorityToken}`)
        .send(alertData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.errors).toBeDefined();
    });

    it('should create alert with action required', async () => {
      const alertData = {
        title: 'Emergency Evacuation',
        message: 'Please evacuate the area immediately.',
        type: 'emergency_alert',
        priority: 'critical',
        targetAudience: 'all',
        actionRequired: true,
        actionText: 'Evacuate Now',
        actionUrl: 'https://emergency.gov/evacuation'
      };

      const response = await request(app)
        .post('/api/alerts')
        .set('Authorization', `Bearer ${authorityToken}`)
        .send(alertData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.alert.actionRequired).toBe(true);
      expect(response.body.data.alert.actionText).toBe(alertData.actionText);
      expect(response.body.data.alert.actionUrl).toBe(alertData.actionUrl);
    });
  });

  describe('GET /api/alerts', () => {
    beforeEach(async () => {
      // Create test alerts
      await Alert.create([
        {
          title: 'Weather Alert',
          message: 'Heavy rain expected',
          type: 'weather_alert',
          priority: 'medium',
          targetAudience: 'all',
          createdBy: authorityUser._id
        },
        {
          title: 'Traffic Alert',
          message: 'Road closure on Main St',
          type: 'traffic_alert',
          priority: 'high',
          targetAudience: 'all',
          createdBy: authorityUser._id
        },
        {
          title: 'System Alert',
          message: 'System maintenance scheduled',
          type: 'system_notification',
          priority: 'low',
          targetAudience: 'all',
          createdBy: adminUser._id
        }
      ]);
    });

    it('should get alerts successfully', async () => {
      const response = await request(app)
        .get('/api/alerts')
        .set('Authorization', `Bearer ${citizenToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.alerts).toHaveLength(3);
      expect(response.body.data.pagination.total).toBe(3);
    });

    it('should filter alerts by type', async () => {
      const response = await request(app)
        .get('/api/alerts?type=weather_alert')
        .set('Authorization', `Bearer ${citizenToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.alerts).toHaveLength(1);
      expect(response.body.data.alerts[0].type).toBe('weather_alert');
    });

    it('should filter alerts by priority', async () => {
      const response = await request(app)
        .get('/api/alerts?priority=high')
        .set('Authorization', `Bearer ${citizenToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.alerts).toHaveLength(1);
      expect(response.body.data.alerts[0].priority).toBe('high');
    });

    it('should filter alerts by target audience', async () => {
      const response = await request(app)
        .get('/api/alerts?targetAudience=all')
        .set('Authorization', `Bearer ${citizenToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.alerts).toHaveLength(3);
    });

    it('should paginate alerts correctly', async () => {
      const response = await request(app)
        .get('/api/alerts?page=1&limit=2')
        .set('Authorization', `Bearer ${citizenToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.alerts).toHaveLength(2);
      expect(response.body.data.pagination.page).toBe(1);
      expect(response.body.data.pagination.limit).toBe(2);
      expect(response.body.data.pagination.total).toBe(3);
    });

    it('should sort alerts by creation date', async () => {
      const response = await request(app)
        .get('/api/alerts?sort=createdAt&order=asc')
        .set('Authorization', `Bearer ${citizenToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.alerts).toHaveLength(3);

      // Check if sorted by creation date (ascending)
      const times = response.body.data.alerts.map(alert => new Date(alert.createdAt).getTime());
      for (let i = 1; i < times.length; i++) {
        expect(times[i]).toBeGreaterThanOrEqual(times[i - 1]);
      }
    });
  });

  describe('GET /api/alerts/:id', () => {
    let alert;

    beforeEach(async () => {
      alert = await Alert.create({
        title: 'Test Alert',
        message: 'This is a test alert message',
        type: 'safety_warning',
        priority: 'medium',
        targetAudience: 'all',
        createdBy: authorityUser._id
      });
    });

    it('should get alert by ID successfully', async () => {
      const response = await request(app)
        .get(`/api/alerts/${alert._id}`)
        .set('Authorization', `Bearer ${citizenToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.alert._id).toBe(alert._id.toString());
      expect(response.body.data.alert.title).toBe('Test Alert');
    });

    it('should fail to get non-existent alert', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .get(`/api/alerts/${fakeId}`)
        .set('Authorization', `Bearer ${citizenToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Alert not found');
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .get(`/api/alerts/${alert._id}`)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('No token provided');
    });
  });

  describe('PUT /api/alerts/:id', () => {
    let alert;

    beforeEach(async () => {
      alert = await Alert.create({
        title: 'Test Alert',
        message: 'This is a test alert message',
        type: 'safety_warning',
        priority: 'medium',
        targetAudience: 'all',
        createdBy: authorityUser._id
      });
    });

    it('should update alert as creator', async () => {
      const updateData = {
        title: 'Updated Alert Title',
        priority: 'high'
      };

      const response = await request(app)
        .put(`/api/alerts/${alert._id}`)
        .set('Authorization', `Bearer ${authorityToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.alert.title).toBe(updateData.title);
      expect(response.body.data.alert.priority).toBe(updateData.priority);
    });

    it('should update alert as admin', async () => {
      const updateData = {
        title: 'Admin Updated Alert',
        priority: 'critical'
      };

      const response = await request(app)
        .put(`/api/alerts/${alert._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.alert.title).toBe(updateData.title);
    });

    it('should fail to update alert as unauthorized user', async () => {
      const updateData = {
        title: 'Unauthorized Update'
      };

      const response = await request(app)
        .put(`/api/alerts/${alert._id}`)
        .set('Authorization', `Bearer ${citizenToken}`)
        .send(updateData)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Not authorized');
    });

    it('should fail to update alert with invalid data', async () => {
      const updateData = {
        title: '', // Empty title
        priority: 'invalid_priority'
      };

      const response = await request(app)
        .put(`/api/alerts/${alert._id}`)
        .set('Authorization', `Bearer ${authorityToken}`)
        .send(updateData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.errors).toBeDefined();
    });
  });

  describe('POST /api/alerts/:id/mark-read', () => {
    let alert;

    beforeEach(async () => {
      alert = await Alert.create({
        title: 'Test Alert',
        message: 'This is a test alert message',
        type: 'safety_warning',
        priority: 'medium',
        targetAudience: 'all',
        createdBy: authorityUser._id
      });
    });

    it('should mark alert as read successfully', async () => {
      const response = await request(app)
        .post(`/api/alerts/${alert._id}/mark-read`)
        .set('Authorization', `Bearer ${citizenToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('Alert marked as read');
    });

    it('should fail to mark non-existent alert as read', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .post(`/api/alerts/${fakeId}/mark-read`)
        .set('Authorization', `Bearer ${citizenToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Alert not found');
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .post(`/api/alerts/${alert._id}/mark-read`)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('No token provided');
    });
  });

  describe('GET /api/alerts/nearby', () => {
    beforeEach(async () => {
      // Create alerts at different locations
      await Alert.create([
        {
          title: 'Near Alert',
          message: 'Nearby alert',
          type: 'safety_warning',
          priority: 'medium',
          targetAudience: 'all',
          location: {
            type: 'Point',
            coordinates: [-74.006, 40.7128], // Same as user location
            radius: 5
          },
          createdBy: authorityUser._id
        },
        {
          title: 'Far Alert',
          message: 'Far away alert',
          type: 'traffic_alert',
          priority: 'high',
          targetAudience: 'all',
          location: {
            type: 'Point',
            coordinates: [-80.000, 45.000], // Far from user location
            radius: 5
          },
          createdBy: authorityUser._id
        }
      ]);
    });

    it('should get nearby alerts successfully', async () => {
      const response = await request(app)
        .get('/api/alerts/nearby?lat=40.7128&lng=-74.006&radius=10')
        .set('Authorization', `Bearer ${citizenToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.alerts.length).toBeGreaterThan(0);
    });

    it('should require coordinates for nearby search', async () => {
      const response = await request(app)
        .get('/api/alerts/nearby')
        .set('Authorization', `Bearer ${citizenToken}`)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Latitude and longitude are required');
    });

    it('should filter by alert type in nearby search', async () => {
      const response = await request(app)
        .get('/api/alerts/nearby?lat=40.7128&lng=-74.006&radius=10&type=safety_warning')
        .set('Authorization', `Bearer ${citizenToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.alerts.every(alert => alert.type === 'safety_warning')).toBe(true);
    });
  });

  describe('DELETE /api/alerts/:id', () => {
    let alert;

    beforeEach(async () => {
      alert = await Alert.create({
        title: 'Test Alert',
        message: 'This is a test alert message',
        type: 'safety_warning',
        priority: 'medium',
        targetAudience: 'all',
        createdBy: authorityUser._id
      });
    });

    it('should delete alert as creator', async () => {
      const response = await request(app)
        .delete(`/api/alerts/${alert._id}`)
        .set('Authorization', `Bearer ${authorityToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('deleted successfully');

      // Verify alert is soft deleted
      const deletedAlert = await Alert.findById(alert._id);
      expect(deletedAlert.isActive).toBe(false);
    });

    it('should delete alert as admin', async () => {
      const response = await request(app)
        .delete(`/api/alerts/${alert._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('deleted successfully');
    });

    it('should fail to delete alert as unauthorized user', async () => {
      const response = await request(app)
        .delete(`/api/alerts/${alert._id}`)
        .set('Authorization', `Bearer ${citizenToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Not authorized');
    });

    it('should fail to delete non-existent alert', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .delete(`/api/alerts/${fakeId}`)
        .set('Authorization', `Bearer ${authorityToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Alert not found');
    });
  });

  describe('GET /api/alerts/stats', () => {
    beforeEach(async () => {
      // Create alerts with different types and priorities
      await Alert.create([
        {
          title: 'Alert 1',
          message: 'Test alert 1',
          type: 'safety_warning',
          priority: 'high',
          targetAudience: 'all',
          createdBy: authorityUser._id
        },
        {
          title: 'Alert 2',
          message: 'Test alert 2',
          type: 'traffic_alert',
          priority: 'medium',
          targetAudience: 'all',
          createdBy: authorityUser._id
        },
        {
          title: 'Alert 3',
          message: 'Test alert 3',
          type: 'weather_alert',
          priority: 'low',
          targetAudience: 'all',
          createdBy: adminUser._id
        }
      ]);
    });

    it('should get alert stats as authority', async () => {
      const response = await request(app)
        .get('/api/alerts/stats')
        .set('Authorization', `Bearer ${authorityToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.totalAlerts).toBe(3);
      expect(response.body.data.byType.safety_warning).toBe(1);
      expect(response.body.data.byType.traffic_alert).toBe(1);
      expect(response.body.data.byType.weather_alert).toBe(1);
      expect(response.body.data.byPriority.high).toBe(1);
      expect(response.body.data.byPriority.medium).toBe(1);
      expect(response.body.data.byPriority.low).toBe(1);
    });

    it('should get alert stats as admin', async () => {
      const response = await request(app)
        .get('/api/alerts/stats')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.totalAlerts).toBe(3);
    });

    it('should fail to get stats as citizen', async () => {
      const response = await request(app)
        .get('/api/alerts/stats')
        .set('Authorization', `Bearer ${citizenToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Access denied');
    });
  });
});
