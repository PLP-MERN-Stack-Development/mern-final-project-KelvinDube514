const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../../app');
const User = require('../../models/User');
const Incident = require('../../models/Incident');
const { generateToken } = require('../../middleware/auth');

describe('Incidents API Integration Tests', () => {
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
    await Incident.deleteMany({});

    // Create test users
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

  describe('POST /api/incidents - Create Incident', () => {
    it('should create a new incident with valid data', async () => {
      const incidentData = {
        title: 'Theft Reported',
        description: 'Car broken into on Main Street',
        type: 'theft',
        severity: 'medium',
        location: {
          coordinates: [-74.006, 40.7128],
          address: {
            street: '123 Main St',
            city: 'New York',
            state: 'NY',
            zipCode: '10001',
            country: 'USA'
          }
        }
      };

      const response = await request(app)
        .post('/api/incidents')
        .set('Authorization', `Bearer ${authToken}`)
        .send(incidentData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.incident.title).toBe(incidentData.title);
      expect(response.body.data.incident.reportedBy).toBeDefined();
      expect(response.body.data.incident.status).toBe('pending');
    });

    it('should fail to create incident without authentication', async () => {
      const incidentData = {
        title: 'Test Incident',
        description: 'Test description',
        type: 'theft',
        severity: 'low',
        location: {
          coordinates: [-74.006, 40.7128],
          address: {
            street: '123 Test St',
            city: 'Test City',
            state: 'TS',
            zipCode: '12345',
            country: 'USA'
          }
        }
      };

      await request(app)
        .post('/api/incidents')
        .send(incidentData)
        .expect(401);
    });

    it('should fail with invalid incident data', async () => {
      const invalidData = {
        title: '',
        description: 'Test',
        type: 'invalid-type',
        severity: 'invalid-severity'
      };

      const response = await request(app)
        .post('/api/incidents')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should create incident with media attachments', async () => {
      const incidentData = {
        title: 'Incident with Media',
        description: 'Test incident with images',
        type: 'vandalism',
        severity: 'medium',
        location: {
          coordinates: [-74.006, 40.7128],
          address: {
            street: '456 Test Ave',
            city: 'New York',
            state: 'NY',
            zipCode: '10002',
            country: 'USA'
          }
        },
        media: [
          {
            type: 'image',
            url: 'https://example.com/image1.jpg',
            filename: 'evidence1.jpg'
          }
        ]
      };

      const response = await request(app)
        .post('/api/incidents')
        .set('Authorization', `Bearer ${authToken}`)
        .send(incidentData)
        .expect(201);

      expect(response.body.data.incident.media).toBeDefined();
      expect(response.body.data.incident.media.length).toBe(1);
    });
  });

  describe('GET /api/incidents - List Incidents', () => {
    beforeEach(async () => {
      // Create test incidents
      await Incident.create([
        {
          title: 'Incident 1',
          description: 'Description 1',
          type: 'theft',
          severity: 'low',
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
          reportedBy: testUser._id,
          status: 'verified'
        },
        {
          title: 'Incident 2',
          description: 'Description 2',
          type: 'vandalism',
          severity: 'medium',
          location: {
            coordinates: [-74.007, 40.7129],
            address: {
              street: '456 Test Ave',
              city: 'New York',
              state: 'NY',
              zipCode: '10002',
              country: 'USA'
            }
          },
          reportedBy: testUser._id,
          status: 'pending'
        },
        {
          title: 'Incident 3',
          description: 'Description 3',
          type: 'assault',
          severity: 'high',
          location: {
            coordinates: [-74.008, 40.7130],
            address: {
              street: '789 Test Blvd',
              city: 'New York',
              state: 'NY',
              zipCode: '10003',
              country: 'USA'
            }
          },
          reportedBy: testUser._id,
          status: 'resolved'
        }
      ]);
    });

    it('should get all incidents', async () => {
      const response = await request(app)
        .get('/api/incidents')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.incidents.length).toBe(3);
    });

    it('should filter incidents by status', async () => {
      const response = await request(app)
        .get('/api/incidents?status=verified')
        .expect(200);

      expect(response.body.data.incidents.length).toBe(1);
      expect(response.body.data.incidents[0].status).toBe('verified');
    });

    it('should filter incidents by type', async () => {
      const response = await request(app)
        .get('/api/incidents?type=theft')
        .expect(200);

      expect(response.body.data.incidents.length).toBe(1);
      expect(response.body.data.incidents[0].type).toBe('theft');
    });

    it('should filter incidents by severity', async () => {
      const response = await request(app)
        .get('/api/incidents?severity=high')
        .expect(200);

      expect(response.body.data.incidents.length).toBe(1);
      expect(response.body.data.incidents[0].severity).toBe('high');
    });

    it('should paginate incidents', async () => {
      const response = await request(app)
        .get('/api/incidents?page=1&limit=2')
        .expect(200);

      expect(response.body.data.incidents.length).toBe(2);
      expect(response.body.data.pagination).toBeDefined();
      expect(response.body.data.pagination.page).toBe(1);
      expect(response.body.data.pagination.limit).toBe(2);
    });

    it('should search incidents by location', async () => {
      const response = await request(app)
        .get('/api/incidents?lat=40.7128&lng=-74.006&radius=5000')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.incidents.length).toBeGreaterThan(0);
    });
  });

  describe('GET /api/incidents/:id - Get Single Incident', () => {
    let testIncident;

    beforeEach(async () => {
      testIncident = await Incident.create({
        title: 'Test Incident',
        description: 'Test description',
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
        reportedBy: testUser._id,
        status: 'pending'
      });
    });

    it('should get incident by id', async () => {
      const response = await request(app)
        .get(`/api/incidents/${testIncident._id}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.incident.title).toBe(testIncident.title);
    });

    it('should return 404 for non-existent incident', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      await request(app)
        .get(`/api/incidents/${fakeId}`)
        .expect(404);
    });

    it('should return 400 for invalid incident id', async () => {
      await request(app)
        .get('/api/incidents/invalid-id')
        .expect(400);
    });
  });

  describe('PUT /api/incidents/:id - Update Incident', () => {
    let testIncident;

    beforeEach(async () => {
      testIncident = await Incident.create({
        title: 'Test Incident',
        description: 'Test description',
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
        reportedBy: testUser._id,
        status: 'pending'
      });
    });

    it('should update own incident', async () => {
      const updates = {
        title: 'Updated Title',
        description: 'Updated description'
      };

      const response = await request(app)
        .put(`/api/incidents/${testIncident._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updates)
        .expect(200);

      expect(response.body.data.incident.title).toBe(updates.title);
      expect(response.body.data.incident.description).toBe(updates.description);
    });

    it('should allow authority to verify incident', async () => {
      const response = await request(app)
        .put(`/api/incidents/${testIncident._id}`)
        .set('Authorization', `Bearer ${authorityToken}`)
        .send({ status: 'verified' })
        .expect(200);

      expect(response.body.data.incident.status).toBe('verified');
      expect(response.body.data.incident.verifiedBy).toBeDefined();
    });

    it('should not allow updating others incidents without permission', async () => {
      const otherUser = await User.create({
        firstName: 'Other',
        lastName: 'User',
        email: 'other@example.com',
        password: 'password123',
        role: 'citizen',
        isVerified: true
      });
      const otherToken = generateToken(otherUser._id);

      await request(app)
        .put(`/api/incidents/${testIncident._id}`)
        .set('Authorization', `Bearer ${otherToken}`)
        .send({ title: 'Hacked' })
        .expect(403);
    });
  });

  describe('DELETE /api/incidents/:id - Delete Incident', () => {
    let testIncident;

    beforeEach(async () => {
      testIncident = await Incident.create({
        title: 'Test Incident',
        description: 'Test description',
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
        reportedBy: testUser._id,
        status: 'pending'
      });
    });

    it('should delete own incident', async () => {
      await request(app)
        .delete(`/api/incidents/${testIncident._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const deletedIncident = await Incident.findById(testIncident._id);
      expect(deletedIncident).toBeNull();
    });

    it('should not allow deleting others incidents', async () => {
      const otherUser = await User.create({
        firstName: 'Other',
        lastName: 'User',
        email: 'other@example.com',
        password: 'password123',
        role: 'citizen',
        isVerified: true
      });
      const otherToken = generateToken(otherUser._id);

      await request(app)
        .delete(`/api/incidents/${testIncident._id}`)
        .set('Authorization', `Bearer ${otherToken}`)
        .expect(403);
    });

    it('should require authentication to delete', async () => {
      await request(app)
        .delete(`/api/incidents/${testIncident._id}`)
        .expect(401);
    });
  });

  describe('Incident Statistics', () => {
    beforeEach(async () => {
      await Incident.create([
        {
          title: 'Incident 1',
          description: 'Description 1',
          type: 'theft',
          severity: 'low',
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
          reportedBy: testUser._id,
          status: 'verified'
        },
        {
          title: 'Incident 2',
          description: 'Description 2',
          type: 'theft',
          severity: 'medium',
          location: {
            coordinates: [-74.007, 40.7129],
            address: {
              street: '456 Test Ave',
              city: 'New York',
              state: 'NY',
              zipCode: '10002',
              country: 'USA'
            }
          },
          reportedBy: testUser._id,
          status: 'resolved'
        }
      ]);
    });

    it('should get incident statistics', async () => {
      const response = await request(app)
        .get('/api/incidents/stats/summary')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.total).toBeDefined();
      expect(response.body.data.byType).toBeDefined();
      expect(response.body.data.bySeverity).toBeDefined();
    });
  });
});
