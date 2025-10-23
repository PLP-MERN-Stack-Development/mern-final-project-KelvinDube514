const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../app');
const User = require('../models/User');
const Incident = require('../models/Incident');
const { generateToken } = require('../middleware/auth');

describe('Incident Endpoints', () => {
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
    await Incident.deleteMany({});

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
        coordinates: [-74.006, 40.7128], // NYC coordinates
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

  describe('POST /api/incidents', () => {
    it('should create incident successfully as citizen', async () => {
      const incidentData = {
        title: 'Suspicious Activity Report',
        description: 'I noticed suspicious behavior near the park entrance',
        type: 'suspicious_activity',
        severity: 'medium',
        location: {
          coordinates: [-74.006, 40.7128],
          address: {
            street: '789 Park St',
            city: 'New York',
            state: 'NY',
            zipCode: '10001',
            country: 'USA'
          }
        }
      };

      const response = await request(app)
        .post('/api/incidents')
        .set('Authorization', `Bearer ${citizenToken}`)
        .send(incidentData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('Incident reported successfully');
      expect(response.body.data.incident.title).toBe(incidentData.title);
      expect(response.body.data.incident.reportedBy._id).toBe(citizenUser._id.toString());
    });

    it('should fail to create incident without authentication', async () => {
      const incidentData = {
        title: 'Test Incident',
        description: 'Test description',
        type: 'theft',
        severity: 'low',
        location: {
          coordinates: [-74.006, 40.7128]
        }
      };

      const response = await request(app)
        .post('/api/incidents')
        .send(incidentData)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('No token provided');
    });

    it('should fail to create incident with invalid data', async () => {
      const incidentData = {
        title: '',
        description: 'Test',
        type: 'invalid_type',
        location: {
          coordinates: [200, 200] // Invalid coordinates
        }
      };

      const response = await request(app)
        .post('/api/incidents')
        .set('Authorization', `Bearer ${citizenToken}`)
        .send(incidentData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.details).toBeDefined();
    });
  });

  describe('GET /api/incidents', () => {
    beforeEach(async () => {
      // Create test incidents
      await Incident.create([
        {
          title: 'Theft Report',
          description: 'Someone stole my bike',
          type: 'theft',
          severity: 'medium',
          location: {
            type: 'Point',
            coordinates: [-74.006, 40.7128]
          },
          reportedBy: citizenUser._id
        },
        {
          title: 'Traffic Accident',
          description: 'Car accident at intersection',
          type: 'traffic_accident',
          severity: 'high',
          location: {
            type: 'Point',
            coordinates: [-74.005, 40.7129]
          },
          reportedBy: citizenUser._id
        }
      ]);
    });

    it('should get incidents successfully', async () => {
      const response = await request(app)
        .get('/api/incidents')
        .set('Authorization', `Bearer ${citizenToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.incidents).toHaveLength(2);
      expect(response.body.data.pagination.total).toBe(2);
    });

    it('should filter incidents by type', async () => {
      const response = await request(app)
        .get('/api/incidents?type=theft')
        .set('Authorization', `Bearer ${citizenToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.incidents).toHaveLength(1);
      expect(response.body.data.incidents[0].type).toBe('theft');
    });

    it('should filter incidents by severity', async () => {
      const response = await request(app)
        .get('/api/incidents?severity=high')
        .set('Authorization', `Bearer ${citizenToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.incidents).toHaveLength(1);
      expect(response.body.data.incidents[0].severity).toBe('high');
    });

    it('should paginate incidents correctly', async () => {
      const response = await request(app)
        .get('/api/incidents?page=1&limit=1')
        .set('Authorization', `Bearer ${citizenToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.incidents).toHaveLength(1);
      expect(response.body.data.pagination.page).toBe(1);
      expect(response.body.data.pagination.limit).toBe(1);
      expect(response.body.data.pagination.total).toBe(2);
    });
  });

  describe('GET /api/incidents/:id', () => {
    let incident;

    beforeEach(async () => {
      incident = await Incident.create({
        title: 'Test Incident',
        description: 'Test description',
        type: 'theft',
        severity: 'medium',
        location: {
          type: 'Point',
          coordinates: [-74.006, 40.7128]
        },
        reportedBy: citizenUser._id
      });
    });

    it('should get incident by ID successfully', async () => {
      const response = await request(app)
        .get(`/api/incidents/${incident._id}`)
        .set('Authorization', `Bearer ${citizenToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.incident._id).toBe(incident._id.toString());
      expect(response.body.data.incident.title).toBe('Test Incident');
    });

    it('should fail to get non-existent incident', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .get(`/api/incidents/${fakeId}`)
        .set('Authorization', `Bearer ${citizenToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Incident not found');
    });
  });

  describe('PUT /api/incidents/:id', () => {
    let incident;

    beforeEach(async () => {
      incident = await Incident.create({
        title: 'Test Incident',
        description: 'Test description',
        type: 'theft',
        severity: 'medium',
        location: {
          type: 'Point',
          coordinates: [-74.006, 40.7128]
        },
        reportedBy: citizenUser._id
      });
    });

    it('should update incident as reporter', async () => {
      const updateData = {
        title: 'Updated Incident Title',
        severity: 'high'
      };

      const response = await request(app)
        .put(`/api/incidents/${incident._id}`)
        .set('Authorization', `Bearer ${citizenToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.incident.title).toBe(updateData.title);
      expect(response.body.data.incident.severity).toBe(updateData.severity);
    });

    it('should update and verify incident as authority', async () => {
      const updateData = {
        status: 'verified',
        resolutionNotes: 'Verified by police'
      };

      const response = await request(app)
        .put(`/api/incidents/${incident._id}`)
        .set('Authorization', `Bearer ${authorityToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.incident.status).toBe('verified');
      expect(response.body.data.incident.verifiedBy._id).toBe(authorityUser._id.toString());
    });

    it('should fail to update incident as unauthorized user', async () => {
      // Create another citizen user
      const otherUser = await User.create({
        firstName: 'Other',
        lastName: 'User',
        email: 'other@example.com',
        password: 'password123',
        role: 'citizen',
        isVerified: true
      });
      const otherToken = generateToken(otherUser._id);

      const updateData = {
        title: 'Unauthorized Update'
      };

      const response = await request(app)
        .put(`/api/incidents/${incident._id}`)
        .set('Authorization', `Bearer ${otherToken}`)
        .send(updateData)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Not authorized');
    });
  });

  describe('POST /api/incidents/:id/vote', () => {
    let incident;

    beforeEach(async () => {
      incident = await Incident.create({
        title: 'Test Incident',
        description: 'Test description',
        type: 'theft',
        severity: 'medium',
        location: {
          type: 'Point',
          coordinates: [-74.006, 40.7128]
        },
        reportedBy: citizenUser._id
      });
    });

    it('should vote on incident successfully', async () => {
      const voteData = {
        vote: 'confirm'
      };

      const response = await request(app)
        .post(`/api/incidents/${incident._id}/vote`)
        .set('Authorization', `Bearer ${citizenToken}`)
        .send(voteData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('Vote recorded successfully');
      expect(response.body.data.verificationScore).toBe(100);
      expect(response.body.data.totalVotes).toBe(1);
    });

    it('should fail to vote twice on same incident', async () => {
      const voteData = {
        vote: 'confirm'
      };

      // First vote
      await request(app)
        .post(`/api/incidents/${incident._id}/vote`)
        .set('Authorization', `Bearer ${citizenToken}`)
        .send(voteData);

      // Second vote should fail
      const response = await request(app)
        .post(`/api/incidents/${incident._id}/vote`)
        .set('Authorization', `Bearer ${citizenToken}`)
        .send(voteData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('already voted');
    });

    it('should fail to vote with invalid vote type', async () => {
      const voteData = {
        vote: 'invalid_vote'
      };

      const response = await request(app)
        .post(`/api/incidents/${incident._id}/vote`)
        .set('Authorization', `Bearer ${citizenToken}`)
        .send(voteData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.details).toBeDefined();
    });
  });

  describe('GET /api/incidents/nearby', () => {
    beforeEach(async () => {
      // Create incidents at different locations
      await Incident.create([
        {
          title: 'Near Incident',
          description: 'Nearby incident',
          type: 'theft',
          severity: 'medium',
          location: {
            type: 'Point',
            coordinates: [-74.006, 40.7128] // Same as user location
          },
          reportedBy: citizenUser._id
        },
        {
          title: 'Far Incident',
          description: 'Far away incident',
          type: 'assault',
          severity: 'high',
          location: {
            type: 'Point',
            coordinates: [-80.000, 45.000] // Far from user location
          },
          reportedBy: citizenUser._id
        }
      ]);
    });

    it('should get nearby incidents successfully', async () => {
      const response = await request(app)
        .get('/api/incidents/nearby?lat=40.7128&lng=-74.006&radius=10')
        .set('Authorization', `Bearer ${citizenToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.incidents.length).toBeGreaterThan(0);
    });

    it('should require coordinates for nearby search', async () => {
      const response = await request(app)
        .get('/api/incidents/nearby')
        .set('Authorization', `Bearer ${citizenToken}`)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Latitude and longitude are required');
    });
  });

  describe('GET /api/incidents/stats', () => {
    beforeEach(async () => {
      // Create incidents with different types and severities
      await Incident.create([
        {
          title: 'Theft 1',
          description: 'Theft incident',
          type: 'theft',
          severity: 'medium',
          status: 'verified',
          location: {
            type: 'Point',
            coordinates: [-74.006, 40.7128]
          },
          reportedBy: citizenUser._id
        },
        {
          title: 'Assault 1',
          description: 'Assault incident',
          type: 'assault',
          severity: 'high',
          status: 'resolved',
          location: {
            type: 'Point',
            coordinates: [-74.006, 40.7128]
          },
          reportedBy: citizenUser._id
        }
      ]);
    });

    it('should get incident stats as authority', async () => {
      const response = await request(app)
        .get('/api/incidents/stats')
        .set('Authorization', `Bearer ${authorityToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.totalIncidents).toBe(2);
      expect(response.body.data.verifiedCount).toBe(1);
      expect(response.body.data.resolvedCount).toBe(1);
      expect(response.body.data.byType.theft).toBe(1);
      expect(response.body.data.byType.assault).toBe(1);
    });

    it('should fail to get stats as citizen', async () => {
      const response = await request(app)
        .get('/api/incidents/stats')
        .set('Authorization', `Bearer ${citizenToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Access denied');
    });
  });

  describe('DELETE /api/incidents/:id', () => {
    let incident;

    beforeEach(async () => {
      incident = await Incident.create({
        title: 'Test Incident',
        description: 'Test description',
        type: 'theft',
        severity: 'medium',
        location: {
          type: 'Point',
          coordinates: [-74.006, 40.7128]
        },
        reportedBy: citizenUser._id
      });
    });

    it('should delete incident as reporter', async () => {
      const response = await request(app)
        .delete(`/api/incidents/${incident._id}`)
        .set('Authorization', `Bearer ${citizenToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('deleted successfully');

      // Verify incident is soft deleted
      const deletedIncident = await Incident.findById(incident._id);
      expect(deletedIncident.isActive).toBe(false);
    });

    it('should delete incident as admin', async () => {
      const response = await request(app)
        .delete(`/api/incidents/${incident._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('deleted successfully');
    });

    it('should fail to delete incident as unauthorized user', async () => {
      // Create another citizen user
      const otherUser = await User.create({
        firstName: 'Other',
        lastName: 'User',
        email: 'other@example.com',
        password: 'password123',
        role: 'citizen',
        isVerified: true
      });
      const otherToken = generateToken(otherUser._id);

      const response = await request(app)
        .delete(`/api/incidents/${incident._id}`)
        .set('Authorization', `Bearer ${otherToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Not authorized');
    });
  });
});
