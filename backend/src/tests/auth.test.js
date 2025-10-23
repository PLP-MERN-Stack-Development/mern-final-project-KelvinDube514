const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../app');
const User = require('../models/User');
const { generateToken } = require('../middleware/auth');

describe('Authentication Endpoints', () => {
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
    // Clear users collection before each test
    await User.deleteMany({});
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user successfully', async () => {
      const userData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        password: 'password123',
        phone: '+1234567890'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('registered successfully');
      expect(response.body.data.user.email).toBe(userData.email);
      expect(response.body.data.token).toBeDefined();
      expect(response.body.data.refreshToken).toBeDefined();
    });

    it('should fail to register with existing email', async () => {
      const userData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        password: 'password123'
      };

      // Register first user
      await request(app)
        .post('/api/auth/register')
        .send(userData);

      // Try to register with same email
      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('already exists');
    });

    it('should fail to register with invalid data', async () => {
      const userData = {
        firstName: '',
        lastName: 'Doe',
        email: 'invalid-email',
        password: '123'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();
      expect(response.body.error.details).toBeDefined();
    });
  });

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      // Create a test user
      const user = await User.create({
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        password: 'password123',
        isVerified: true
      });
    });

    it('should login with valid credentials', async () => {
      const loginData = {
        email: 'john.doe@example.com',
        password: 'password123'
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('Login successful');
      expect(response.body.data.token).toBeDefined();
      expect(response.body.data.refreshToken).toBeDefined();
      expect(response.body.data.user.email).toBe(loginData.email);
    });

    it('should fail to login with invalid email', async () => {
      const loginData = {
        email: 'wrong@example.com',
        password: 'password123'
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Invalid email or password');
    });

    it('should fail to login with invalid password', async () => {
      const loginData = {
        email: 'john.doe@example.com',
        password: 'wrongpassword'
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Invalid email or password');
    });
  });

  describe('GET /api/auth/me', () => {
    let token;
    let user;

    beforeEach(async () => {
      user = await User.create({
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        password: 'password123',
        isVerified: true
      });
      token = generateToken(user._id);
    });

    it('should get current user with valid token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.email).toBe(user.email);
      expect(response.body.data.user.firstName).toBe(user.firstName);
    });

    it('should fail without token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('No token provided');
    });

    it('should fail with invalid token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Invalid token');
    });
  });

  describe('PUT /api/auth/profile', () => {
    let token;
    let user;

    beforeEach(async () => {
      user = await User.create({
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        password: 'password123',
        isVerified: true
      });
      token = generateToken(user._id);
    });

    it('should update user profile successfully', async () => {
      const updateData = {
        firstName: 'Jane',
        phone: '+1234567890'
      };

      const response = await request(app)
        .put('/api/auth/profile')
        .set('Authorization', `Bearer ${token}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.firstName).toBe(updateData.firstName);
      expect(response.body.data.user.phone).toBe(updateData.phone);
    });

    it('should fail to update with invalid data', async () => {
      const updateData = {
        firstName: '',
        email: 'invalid-email'
      };

      const response = await request(app)
        .put('/api/auth/profile')
        .set('Authorization', `Bearer ${token}`)
        .send(updateData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();
      expect(response.body.error.details).toBeDefined();
    });
  });

  describe('PUT /api/auth/change-password', () => {
    let token;
    let user;

    beforeEach(async () => {
      user = await User.create({
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        password: 'password123',
        isVerified: true
      });
      token = generateToken(user._id);
    });

    it('should change password successfully', async () => {
      const passwordData = {
        currentPassword: 'password123',
        newPassword: 'newpassword123'
      };

      const response = await request(app)
        .put('/api/auth/change-password')
        .set('Authorization', `Bearer ${token}`)
        .send(passwordData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('Password changed successfully');
    });

    it('should fail with incorrect current password', async () => {
      const passwordData = {
        currentPassword: 'wrongpassword',
        newPassword: 'newpassword123'
      };

      const response = await request(app)
        .put('/api/auth/change-password')
        .set('Authorization', `Bearer ${token}`)
        .send(passwordData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Current password is incorrect');
    });
  });

  describe('POST /api/auth/logout', () => {
    let token;
    let user;

    beforeEach(async () => {
      user = await User.create({
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        password: 'password123',
        isVerified: true
      });
      token = generateToken(user._id);
    });

    it('should logout successfully', async () => {
      const response = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('Logged out successfully');
    });
  });
});
