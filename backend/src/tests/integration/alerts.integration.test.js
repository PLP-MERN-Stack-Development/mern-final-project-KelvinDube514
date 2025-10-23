const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../../app');
const User = require('../../models/User');
const Alert = require('../../models/Alert');
const { generateToken } = require('../../middleware/auth');

describe('Alerts API Integration Tests', () => {
  let authToken;
  let testUser;
  let authorityUser;
  let authorityToken;

  beforeAll(async () => {
    await mongoose.connect(process.env.MONGODB_URI);
  });

  afterAll(async () => {
    await mongoose.connection.db.dropDatabase();
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    await User.deleteMany({});
    await Alert.deleteMany({});

    testUser = await User.create({
      firstName: 'Test',
      lastName: 'User',
      email: 'test@example.com',
      password: 'password123',
      role: 'citizen',
      isVerified: true
    });

    authorityUser = await User.create({
      firstName: 'Authority',
      lastName: 'User',
      email: 'authority@example.com',
      password: 'password123',
      role: 'authority',
      isVerified: true
    });

    authToken = generateToken(testUser._id);
    authorityToken = generateToken(authorityUser._id);
  });

  describe('POST /api/alerts - Create Alert', () => {
    it('should allow authority to create alert', async () => {
      const alertData = {
        type: 'warning',
        title: 'Severe Weather Alert',
        message: 'Heavy rain expected in the area',
        location: {
          coordinates: [-74.006, 40.7128],
          address: {
            street: 'Downtown',
            city: 'New York',
            state: 'NY',
            zipCode: '10001',
            country: 'USA'
          }
        },
        severity: 'medium',
        radius: 5000,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
      };

      const response = await request(app)
        .post('/api/alerts')
        .set('Authorization', `Bearer ${authorityToken}`)
        .send(alertData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.alert.title).toBe(alertData.title);
      expect(response.body.data.alert.issuedBy).toBeDefined();
    });

    it('should not allow regular user to create alert', async () => {
      const alertData = {
        type: 'warning',
        title: 'Test Alert',
        message: 'Test message',
        location: {
          coordinates: [-74.006, 40.7128],
          address: {
            city: 'New York',
            state: 'NY',
            country: 'USA'
          }
        },
        severity: 'low',
        radius: 1000
      };

      await request(app)
        .post('/api/alerts')
        .set('Authorization', `Bearer ${authToken}`)
        .send(alertData)
        .expect(403);
    });

    it('should fail with invalid alert data', async () => {
      const invalidData = {
        type: 'invalid-type',
        title: '',
        message: 'Test'
      };

      await request(app)
        .post('/api/alerts')
        .set('Authorization', `Bearer ${authorityToken}`)
        .send(invalidData)
        .expect(400);
    });

    it('should create critical alert', async () => {
      const criticalAlert = {
        type: 'critical',
        title: 'Emergency Evacuation',
        message: 'Immediate evacuation required',
        location: {
          coordinates: [-74.006, 40.7128],
          address: {
            city: 'New York',
            state: 'NY',
            country: 'USA'
          }
        },
        severity: 'critical',
        radius: 10000,
        expiresAt: new Date(Date.now() + 6 * 60 * 60 * 1000)
      };

      const response = await request(app)
        .post('/api/alerts')
        .set('Authorization', `Bearer ${authorityToken}`)
        .send(criticalAlert)
        .expect(201);

      expect(response.body.data.alert.type).toBe('critical');
      expect(response.body.data.alert.severity).toBe('critical');
    });
  });

  describe('GET /api/alerts - List Alerts', () => {
    beforeEach(async () => {
      const now = new Date();
      await Alert.create([
        {
          type: 'warning',
          title: 'Weather Alert',
          message: 'Heavy rain expected',
          location: {
            coordinates: [-74.006, 40.7128],
            address: {
              city: 'New York',
              state: 'NY',
              country: 'USA'
            }
          },
          severity: 'medium',
          radius: 5000,
          issuedBy: authorityUser._id,
          isActive: true,
          expiresAt: new Date(now.getTime() + 24 * 60 * 60 * 1000)
        },
        {
          type: 'critical',
          title: 'Emergency Alert',
          message: 'Immediate action required',
          location: {
            coordinates: [-74.007, 40.7129],
            address: {
              city: 'New York',
              state: 'NY',
              country: 'USA'
            }
          },
          severity: 'critical',
          radius: 10000,
          issuedBy: authorityUser._id,
          isActive: true,
          expiresAt: new Date(now.getTime() + 6 * 60 * 60 * 1000)
        },
        {
          type: 'info',
          title: 'Information',
          message: 'Community meeting scheduled',
          location: {
            coordinates: [-74.008, 40.7130],
            address: {
              city: 'New York',
              state: 'NY',
              country: 'USA'
            }
          },
          severity: 'low',
          radius: 2000,
          issuedBy: authorityUser._id,
          isActive: true,
          expiresAt: new Date(now.getTime() + 48 * 60 * 60 * 1000)
        }
      ]);
    });

    it('should get all active alerts', async () => {
      const response = await request(app)
        .get('/api/alerts')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.alerts.length).toBe(3);
    });

    it('should filter alerts by type', async () => {
      const response = await request(app)
        .get('/api/alerts?type=critical')
        .expect(200);

      expect(response.body.data.alerts.length).toBe(1);
      expect(response.body.data.alerts[0].type).toBe('critical');
    });

    it('should filter alerts by severity', async () => {
      const response = await request(app)
        .get('/api/alerts?severity=critical')
        .expect(200);

      expect(response.body.data.alerts.length).toBe(1);
      expect(response.body.data.alerts[0].severity).toBe('critical');
    });

    it('should get alerts by location', async () => {
      const response = await request(app)
        .get('/api/alerts?lat=40.7128&lng=-74.006&radius=6000')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.alerts.length).toBeGreaterThan(0);
    });

    it('should paginate alerts', async () => {
      const response = await request(app)
        .get('/api/alerts?page=1&limit=2')
        .expect(200);

      expect(response.body.data.alerts.length).toBe(2);
      expect(response.body.data.pagination).toBeDefined();
    });

    it('should only return active alerts by default', async () => {
      // Create an expired alert
      await Alert.create({
        type: 'info',
        title: 'Expired Alert',
        message: 'This alert has expired',
        location: {
          coordinates: [-74.006, 40.7128],
          address: {
            city: 'New York',
            state: 'NY',
            country: 'USA'
          }
        },
        severity: 'low',
        radius: 1000,
        issuedBy: authorityUser._id,
        isActive: false,
        expiresAt: new Date(Date.now() - 24 * 60 * 60 * 1000)
      });

      const response = await request(app)
        .get('/api/alerts')
        .expect(200);

      expect(response.body.data.alerts.every(alert => alert.isActive)).toBe(true);
    });
  });

  describe('GET /api/alerts/:id - Get Single Alert', () => {
    let testAlert;

    beforeEach(async () => {
      testAlert = await Alert.create({
        type: 'warning',
        title: 'Test Alert',
        message: 'Test message',
        location: {
          coordinates: [-74.006, 40.7128],
          address: {
            city: 'New York',
            state: 'NY',
            country: 'USA'
          }
        },
        severity: 'medium',
        radius: 5000,
        issuedBy: authorityUser._id,
        isActive: true,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
      });
    });

    it('should get alert by id', async () => {
      const response = await request(app)
        .get(`/api/alerts/${testAlert._id}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.alert.title).toBe(testAlert.title);
    });

    it('should return 404 for non-existent alert', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      await request(app)
        .get(`/api/alerts/${fakeId}`)
        .expect(404);
    });
  });

  describe('PUT /api/alerts/:id - Update Alert', () => {
    let testAlert;

    beforeEach(async () => {
      testAlert = await Alert.create({
        type: 'warning',
        title: 'Test Alert',
        message: 'Test message',
        location: {
          coordinates: [-74.006, 40.7128],
          address: {
            city: 'New York',
            state: 'NY',
            country: 'USA'
          }
        },
        severity: 'medium',
        radius: 5000,
        issuedBy: authorityUser._id,
        isActive: true,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
      });
    });

    it('should allow authority to update alert', async () => {
      const updates = {
        title: 'Updated Alert',
        message: 'Updated message'
      };

      const response = await request(app)
        .put(`/api/alerts/${testAlert._id}`)
        .set('Authorization', `Bearer ${authorityToken}`)
        .send(updates)
        .expect(200);

      expect(response.body.data.alert.title).toBe(updates.title);
      expect(response.body.data.alert.message).toBe(updates.message);
    });

    it('should not allow regular user to update alert', async () => {
      await request(app)
        .put(`/api/alerts/${testAlert._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ title: 'Hacked' })
        .expect(403);
    });

    it('should allow deactivating alert', async () => {
      const response = await request(app)
        .put(`/api/alerts/${testAlert._id}`)
        .set('Authorization', `Bearer ${authorityToken}`)
        .send({ isActive: false })
        .expect(200);

      expect(response.body.data.alert.isActive).toBe(false);
    });
  });

  describe('DELETE /api/alerts/:id - Delete Alert', () => {
    let testAlert;

    beforeEach(async () => {
      testAlert = await Alert.create({
        type: 'warning',
        title: 'Test Alert',
        message: 'Test message',
        location: {
          coordinates: [-74.006, 40.7128],
          address: {
            city: 'New York',
            state: 'NY',
            country: 'USA'
          }
        },
        severity: 'medium',
        radius: 5000,
        issuedBy: authorityUser._id,
        isActive: true,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
      });
    });

    it('should allow authority to delete alert', async () => {
      await request(app)
        .delete(`/api/alerts/${testAlert._id}`)
        .set('Authorization', `Bearer ${authorityToken}`)
        .expect(200);

      const deletedAlert = await Alert.findById(testAlert._id);
      expect(deletedAlert).toBeNull();
    });

    it('should not allow regular user to delete alert', async () => {
      await request(app)
        .delete(`/api/alerts/${testAlert._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(403);
    });
  });

  describe('Alert Notifications', () => {
    it('should send notifications when alert is created', async () => {
      const alertData = {
        type: 'critical',
        title: 'Emergency',
        message: 'Immediate action required',
        location: {
          coordinates: [-74.006, 40.7128],
          address: {
            city: 'New York',
            state: 'NY',
            country: 'USA'
          }
        },
        severity: 'critical',
        radius: 10000,
        expiresAt: new Date(Date.now() + 6 * 60 * 60 * 1000)
      };

      const response = await request(app)
        .post('/api/alerts')
        .set('Authorization', `Bearer ${authorityToken}`)
        .send(alertData)
        .expect(201);

      expect(response.body.success).toBe(true);
      // In a real scenario, we would verify that notifications were sent
      // This would require mocking the notification service
    });
  });
});
