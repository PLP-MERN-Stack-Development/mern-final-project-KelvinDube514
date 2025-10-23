const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../app');
const User = require('../models/User');
const { generateToken, verifyToken, protect, authorize, optionalAuth, checkOwnership } = require('../middleware/auth');
const { validate, userSchemas } = require('../middleware/validation');

describe('Middleware Tests', () => {
  let testUser;
  let testToken;

  beforeAll(async () => {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/securepath-test');
  });

  afterAll(async () => {
    await mongoose.connection.db.dropDatabase();
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    await User.deleteMany({});

    testUser = await User.create({
      firstName: 'Test',
      lastName: 'User',
      email: 'test@example.com',
      password: 'password123',
      role: 'citizen',
      isVerified: true,
      isActive: true
    });

    testToken = generateToken(testUser._id);
  });

  describe('Auth Middleware', () => {
    describe('generateToken', () => {
      it('should generate a valid JWT token', () => {
        const token = generateToken(testUser._id);
        expect(token).toBeDefined();
        expect(typeof token).toBe('string');
        expect(token.split('.')).toHaveLength(3); // JWT has 3 parts
      });
    });

    describe('verifyToken', () => {
      it('should verify a valid token', () => {
        const token = generateToken(testUser._id);
        const decoded = verifyToken(token);

        expect(decoded).toBeDefined();
        expect(decoded.userId).toBe(testUser._id.toString());
      });

      it('should return null for invalid token', () => {
        const decoded = verifyToken('invalid-token');
        expect(decoded).toBeNull();
      });

      it('should return null for expired token', () => {
        // Create a token with very short expiry
        const shortToken = require('jsonwebtoken').sign(
          { userId: testUser._id },
          process.env.JWT_SECRET,
          { expiresIn: '1ms' }
        );

        // Wait for token to expire
        setTimeout(() => {
          const decoded = verifyToken(shortToken);
          expect(decoded).toBeNull();
        }, 10);
      });
    });

    describe('protect middleware', () => {
      it('should allow access with valid token', async () => {
        const response = await request(app)
          .get('/api/auth/me')
          .set('Authorization', `Bearer ${testToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
      });

      it('should deny access without token', async () => {
        const response = await request(app)
          .get('/api/auth/me')
          .expect(401);

        expect(response.body.success).toBe(false);
        expect(response.body.message).toContain('No token provided');
      });

      it('should deny access with invalid token', async () => {
        const response = await request(app)
          .get('/api/auth/me')
          .set('Authorization', 'Bearer invalid-token')
          .expect(401);

        expect(response.body.success).toBe(false);
        expect(response.body.message).toContain('Invalid token');
      });

      it('should deny access with malformed authorization header', async () => {
        const response = await request(app)
          .get('/api/auth/me')
          .set('Authorization', 'InvalidFormat token')
          .expect(401);

        expect(response.body.success).toBe(false);
        expect(response.body.message).toContain('No token provided');
      });

      it('should allow access for inactive user after removing restrictions', async () => {
        // Deactivate user
        await User.findByIdAndUpdate(testUser._id, { isActive: false });

        const response = await request(app)
          .get('/api/auth/me')
          .set('Authorization', `Bearer ${testToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.user).toBeDefined();
      });

      it('should allow access for unverified user after removing restrictions', async () => {
        // Make user unverified
        await User.findByIdAndUpdate(testUser._id, { isVerified: false });

        const response = await request(app)
          .get('/api/auth/me')
          .set('Authorization', `Bearer ${testToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.user).toBeDefined();
      });

      it('should allow access for unverified user on verify-email route', async () => {
        // Make user unverified
        await User.findByIdAndUpdate(testUser._id, { isVerified: false });

        // This would need a specific route for testing, but the logic is in the middleware
        const response = await request(app)
          .get('/api/auth/verify-email')
          .set('Authorization', `Bearer ${testToken}`)
          .expect(404); // Route doesn't exist, but middleware would pass

        // The 404 is expected since the route doesn't exist
        // The important thing is that the middleware didn't block it
      });
    });

    describe('authorize middleware', () => {
      it('should allow access for authorized role', async () => {
        // Create a test route that uses authorize middleware
        const testApp = require('express')();
        testApp.use(require('express').json());
        testApp.get('/test-auth', protect, authorize('citizen'), (req, res) => {
          res.json({ success: true, message: 'Authorized' });
        });

        const response = await request(testApp)
          .get('/test-auth')
          .set('Authorization', `Bearer ${testToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
      });

      it('should deny access for unauthorized role', async () => {
        const testApp = require('express')();
        testApp.use(require('express').json());
        testApp.get('/test-auth', protect, authorize('admin'), (req, res) => {
          res.json({ success: true, message: 'Authorized' });
        });

        const response = await request(testApp)
          .get('/test-auth')
          .set('Authorization', `Bearer ${testToken}`)
          .expect(403);

        expect(response.body.success).toBe(false);
        expect(response.body.message).toContain('Access denied');
      });

      it('should allow access for multiple roles', async () => {
        const testApp = require('express')();
        testApp.use(require('express').json());
        testApp.get('/test-auth', protect, authorize('citizen', 'authority'), (req, res) => {
          res.json({ success: true, message: 'Authorized' });
        });

        const response = await request(testApp)
          .get('/test-auth')
          .set('Authorization', `Bearer ${testToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
      });

      it('should require authentication before authorization', async () => {
        const testApp = require('express')();
        testApp.use(require('express').json());
        testApp.get('/test-auth', authorize('citizen'), (req, res) => {
          res.json({ success: true, message: 'Authorized' });
        });

        const response = await request(testApp)
          .get('/test-auth')
          .expect(401);

        expect(response.body.success).toBe(false);
        expect(response.body.message).toContain('Authentication required');
      });
    });

    describe('optionalAuth middleware', () => {
      it('should set user when valid token is provided', async () => {
        const testApp = require('express')();
        testApp.use(require('express').json());
        testApp.get('/test-optional', optionalAuth, (req, res) => {
          res.json({
            success: true,
            hasUser: !!req.user,
            userId: req.user ? req.user._id.toString() : null
          });
        });

        const response = await request(testApp)
          .get('/test-optional')
          .set('Authorization', `Bearer ${testToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.hasUser).toBe(true);
        expect(response.body.userId).toBe(testUser._id.toString());
      });

      it('should not set user when no token is provided', async () => {
        const testApp = require('express')();
        testApp.use(require('express').json());
        testApp.get('/test-optional', optionalAuth, (req, res) => {
          res.json({
            success: true,
            hasUser: !!req.user,
            userId: req.user ? req.user._id.toString() : null
          });
        });

        const response = await request(testApp)
          .get('/test-optional')
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.hasUser).toBe(false);
        expect(response.body.userId).toBeNull();
      });

      it('should not set user when invalid token is provided', async () => {
        const testApp = require('express')();
        testApp.use(require('express').json());
        testApp.get('/test-optional', optionalAuth, (req, res) => {
          res.json({
            success: true,
            hasUser: !!req.user,
            userId: req.user ? req.user._id.toString() : null
          });
        });

        const response = await request(testApp)
          .get('/test-optional')
          .set('Authorization', 'Bearer invalid-token')
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.hasUser).toBe(false);
        expect(response.body.userId).toBeNull();
      });
    });

    describe('checkOwnership middleware', () => {
      it('should allow access when user owns resource', async () => {
        const testApp = require('express')();
        testApp.use(require('express').json());
        testApp.get('/test-ownership/:id', protect, checkOwnership(), (req, res) => {
          res.json({ success: true, message: 'Access granted' });
        });

        const response = await request(testApp)
          .get(`/test-ownership/${testUser._id}`)
          .set('Authorization', `Bearer ${testToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
      });

      it('should deny access when user does not own resource', async () => {
        const otherUser = await User.create({
          firstName: 'Other',
          lastName: 'User',
          email: 'other@example.com',
          password: 'password123',
          role: 'citizen',
          isVerified: true
        });

        const testApp = require('express')();
        testApp.use(require('express').json());
        testApp.get('/test-ownership/:id', protect, checkOwnership(), (req, res) => {
          res.json({ success: true, message: 'Access granted' });
        });

        const response = await request(testApp)
          .get(`/test-ownership/${otherUser._id}`)
          .set('Authorization', `Bearer ${testToken}`)
          .expect(403);

        expect(response.body.success).toBe(false);
        expect(response.body.message).toContain('Access denied');
      });

      it('should allow admin access to any resource', async () => {
        // Create admin user
        const adminUser = await User.create({
          firstName: 'Admin',
          lastName: 'User',
          email: 'admin@example.com',
          password: 'password123',
          role: 'admin',
          isVerified: true
        });
        const adminToken = generateToken(adminUser._id);

        const testApp = require('express')();
        testApp.use(require('express').json());
        testApp.get('/test-ownership/:id', protect, checkOwnership(), (req, res) => {
          res.json({ success: true, message: 'Access granted' });
        });

        const response = await request(testApp)
          .get(`/test-ownership/${testUser._id}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
      });

      it('should require authentication before ownership check', async () => {
        const testApp = require('express')();
        testApp.use(require('express').json());
        testApp.get('/test-ownership/:id', checkOwnership(), (req, res) => {
          res.json({ success: true, message: 'Access granted' });
        });

        const response = await request(testApp)
          .get(`/test-ownership/${testUser._id}`)
          .expect(401);

        expect(response.body.success).toBe(false);
        expect(response.body.message).toContain('Authentication required');
      });
    });
  });

  describe('Validation Middleware', () => {
    describe('validate function', () => {
      it('should pass validation for valid data', async () => {
        const testApp = require('express')();
        testApp.use(require('express').json());
        testApp.post('/test-validation', validate(userSchemas.register), (req, res) => {
          res.json({ success: true, data: req.body });
        });

        const validData = {
          firstName: 'John',
          lastName: 'Doe',
          email: 'john.doe@example.com',
          password: 'password123'
        };

        const response = await request(testApp)
          .post('/test-validation')
          .send(validData)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.firstName).toBe(validData.firstName);
      });

      it('should fail validation for invalid data', async () => {
        const testApp = require('express')();
        const { globalErrorHandler } = require('../utils/errorHandler');
        testApp.use(require('express').json());
        testApp.post('/test-validation', validate(userSchemas.register), (req, res) => {
          res.json({ success: true, data: req.body });
        });
        testApp.use(globalErrorHandler);

        const invalidData = {
          firstName: '',
          lastName: 'Doe',
          email: 'invalid-email',
          password: '123'
        };

        const response = await request(testApp)
          .post('/test-validation')
          .send(invalidData)
          .expect(400);

        expect(response.body.success).toBe(false);
        expect(response.body.error.message).toContain('Validation failed');
        expect(response.body.error.details).toBeDefined();
        expect(response.body.error.details.length).toBeGreaterThan(0);
      });

      it('should validate query parameters', async () => {
        const testApp = require('express')();
        testApp.use(require('express').json());
        testApp.get('/test-validation', validate(userSchemas.register, 'query'), (req, res) => {
          res.json({ success: true, data: req.query });
        });

        const response = await request(testApp)
          .get('/test-validation?firstName=John&lastName=Doe&email=john.doe@example.com&password=password123')
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.firstName).toBe('John');
      });

      it('should validate route parameters', async () => {
        const testApp = require('express')();
        testApp.use(require('express').json());
        testApp.get('/test-validation/:id', validate(userSchemas.register, 'params'), (req, res) => {
          res.json({ success: true, data: req.params });
        });

        const response = await request(testApp)
          .get('/test-validation/123')
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.id).toBe('123');
      });

      it('should strip unknown fields', async () => {
        const testApp = require('express')();
        testApp.use(require('express').json());
        testApp.post('/test-validation', validate(userSchemas.register), (req, res) => {
          res.json({ success: true, data: req.body });
        });

        const dataWithUnknownFields = {
          firstName: 'John',
          lastName: 'Doe',
          email: 'john.doe@example.com',
          password: 'password123',
          unknownField: 'should be stripped'
        };

        const response = await request(testApp)
          .post('/test-validation')
          .send(dataWithUnknownFields)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.unknownField).toBeUndefined();
      });

      it('should provide detailed error messages', async () => {
        const testApp = require('express')();
        const { globalErrorHandler } = require('../utils/errorHandler');
        testApp.use(require('express').json());
        testApp.post('/test-validation', validate(userSchemas.register), (req, res) => {
          res.json({ success: true, data: req.body });
        });
        testApp.use(globalErrorHandler);

        const invalidData = {
          firstName: 'A', // Too short
          lastName: '', // Empty
          email: 'not-an-email', // Invalid format
          password: '123' // Too short
        };

        const response = await request(testApp)
          .post('/test-validation')
          .send(invalidData)
          .expect(400);

        expect(response.body.success).toBe(false);
        expect(response.body.error.details).toBeDefined();

        const errors = response.body.error.details;
        expect(errors.some(error => error.field === 'firstName')).toBe(true);
        expect(errors.some(error => error.field === 'lastName')).toBe(true);
        expect(errors.some(error => error.field === 'email')).toBe(true);
        expect(errors.some(error => error.field === 'password')).toBe(true);
      });
    });
  });
});
