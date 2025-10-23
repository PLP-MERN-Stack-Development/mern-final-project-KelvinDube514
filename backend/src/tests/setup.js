const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

// Increase timeout for database operations
jest.setTimeout(30000);

let mongoServer;

// Setup test environment
beforeAll(async () => {
  // Set test environment variables
  process.env.NODE_ENV = 'test';
  process.env.JWT_SECRET = 'test-jwt-secret-key';
  process.env.REFRESH_TOKEN_SECRET = 'test-refresh-token-secret';

  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  process.env.MONGODB_URI = uri;
  await mongoose.connect(uri);
});

// Cleanup after all tests
afterAll(async () => {
  // Drop DB and close connections
  if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
  }
  if (mongoServer) {
    await mongoServer.stop();
  }
});

// Global test utilities
global.testUtils = {
  generateTestUser: (overrides = {}) => ({
    firstName: 'Test',
    lastName: 'User',
    email: 'test@example.com',
    password: 'Password123!',
    role: 'citizen',
    isVerified: true,
    ...overrides
  }),

  generateTestIncident: (overrides = {}) => ({
    title: 'Test Incident',
    description: 'Test incident description for testing purposes',
    type: 'theft',
    severity: 'medium',
    location: {
      coordinates: [-74.006, 40.7128],
      address: {
        street: '123 Test St',
        city: 'Test City',
        state: 'TS',
        zipCode: '12345',
        country: 'USA'
      }
    },
    ...overrides
  }),

  waitFor: (ms) => new Promise(resolve => setTimeout(resolve, ms))
};
