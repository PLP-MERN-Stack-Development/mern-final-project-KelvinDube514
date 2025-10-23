const mongoose = require('mongoose');
const User = require('../models/User');
const Incident = require('../models/Incident');
const Alert = require('../models/Alert');
const Location = require('../models/Location');

describe('Model Tests', () => {
  beforeAll(async () => {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGODB_URI);
    }
  });

  afterAll(async () => {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.dropDatabase();
      await mongoose.connection.close();
    }
  });

  beforeEach(async () => {
    await User.deleteMany({});
    await Incident.deleteMany({});
    await Alert.deleteMany({});
    await Location.deleteMany({});
  });

  describe('User Model', () => {
    it('should create a user with valid data', async () => {
      const userData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        password: 'password123',
        phone: '+1234567890',
        role: 'citizen',
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

      const user = new User(userData);
      const savedUser = await user.save();

      expect(savedUser._id).toBeDefined();
      expect(savedUser.firstName).toBe(userData.firstName);
      expect(savedUser.email).toBe(userData.email);
      expect(savedUser.password).not.toBe(userData.password); // Should be hashed
      expect(savedUser.role).toBe('citizen');
      expect(savedUser.isVerified).toBe(false);
      expect(savedUser.isActive).toBe(true);
    });

    it('should hash password before saving', async () => {
      const userData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        password: 'password123'
      };

      const user = new User(userData);
      await user.save();

      expect(user.password).not.toBe('password123');
      expect(user.password).toMatch(/^\$2[aby]\$\d+\$/); // bcrypt hash pattern
    });

    it('should validate email format', async () => {
      const userData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'invalid-email',
        password: 'password123'
      };

      const user = new User(userData);
      await expect(user.save()).rejects.toThrow();
    });

    it('should validate required fields', async () => {
      const userData = {
        firstName: '',
        email: 'john.doe@example.com',
        password: 'password123'
      };

      const user = new User(userData);
      await expect(user.save()).rejects.toThrow();
    });

    it('should accept any password length after removing restrictions', async () => {
      const userData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        password: '1' // Very short password now allowed
      };

      const user = new User(userData);
      const savedUser = await user.save();
      expect(savedUser).toBeDefined();
      expect(savedUser.email).toBe('john.doe@example.com');
    });

    it('should validate coordinates', async () => {
      const userData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        password: 'password123',
        location: {
          coordinates: [200, 200] // Invalid coordinates
        }
      };

      const user = new User(userData);
      await expect(user.save()).rejects.toThrow();
    });

    it('should compare password correctly', async () => {
      const userData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        password: 'password123'
      };

      const user = new User(userData);
      await user.save();

      const isMatch = await user.comparePassword('password123');
      const isNotMatch = await user.comparePassword('wrongpassword');

      expect(isMatch).toBe(true);
      expect(isNotMatch).toBe(false);
    });

    it('should return full name virtual field', async () => {
      const userData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        password: 'password123'
      };

      const user = new User(userData);
      await user.save();

      expect(user.fullName).toBe('John Doe');
    });

    it('should exclude sensitive fields in JSON output', async () => {
      const userData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        password: 'password123'
      };

      const user = new User(userData);
      await user.save();

      const userJSON = user.toJSON();

      expect(userJSON.password).toBeUndefined();
      expect(userJSON.verificationToken).toBeUndefined();
      expect(userJSON.resetPasswordToken).toBeUndefined();
    });

    it('should enforce unique email constraint', async () => {
      const userData1 = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        password: 'password123'
      };

      const userData2 = {
        firstName: 'Jane',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        password: 'password123'
      };

      const user1 = new User(userData1);
      await user1.save();

      const user2 = new User(userData2);
      await expect(user2.save()).rejects.toThrow();
    });

    it('should set default values correctly', async () => {
      const userData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        password: 'password123'
      };

      const user = new User(userData);
      await user.save();

      expect(user.role).toBe('citizen');
      expect(user.isVerified).toBe(false);
      expect(user.isActive).toBe(true);
      expect(user.preferences.notifications.email).toBe(true);
      expect(user.preferences.notifications.push).toBe(true);
      expect(user.preferences.notifications.sms).toBe(false);
      expect(user.preferences.alertRadius).toBe(5);
    });
  });

  describe('Incident Model', () => {
    let user;

    beforeEach(async () => {
      user = await User.create({
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        password: 'password123',
        isVerified: true
      });
    });

    it('should create an incident with valid data', async () => {
      const incidentData = {
        title: 'Test Incident',
        description: 'This is a test incident description',
        type: 'theft',
        severity: 'medium',
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
        },
        reportedBy: user._id
      };

      const incident = new Incident(incidentData);
      const savedIncident = await incident.save();

      expect(savedIncident._id).toBeDefined();
      expect(savedIncident.title).toBe(incidentData.title);
      expect(savedIncident.type).toBe(incidentData.type);
      expect(savedIncident.severity).toBe(incidentData.severity);
      expect(savedIncident.status).toBe('reported');
      expect(savedIncident.isActive).toBe(true);
      expect(savedIncident.verificationScore).toBe(0);
    });

    it('should validate incident type', async () => {
      const incidentData = {
        title: 'Test Incident',
        description: 'This is a test incident description',
        type: 'invalid_type',
        severity: 'medium',
        location: {
          type: 'Point',
          coordinates: [-74.006, 40.7128]
        },
        reportedBy: user._id
      };

      const incident = new Incident(incidentData);
      await expect(incident.save()).rejects.toThrow();
    });

    it('should validate severity level', async () => {
      const incidentData = {
        title: 'Test Incident',
        description: 'This is a test incident description',
        type: 'theft',
        severity: 'invalid_severity',
        location: {
          type: 'Point',
          coordinates: [-74.006, 40.7128]
        },
        reportedBy: user._id
      };

      const incident = new Incident(incidentData);
      await expect(incident.save()).rejects.toThrow();
    });

    it('should validate required fields', async () => {
      const incidentData = {
        title: '',
        description: 'This is a test incident description',
        type: 'theft',
        severity: 'medium',
        location: {
          type: 'Point',
          coordinates: [-74.006, 40.7128]
        },
        reportedBy: user._id
      };

      const incident = new Incident(incidentData);
      await expect(incident.save()).rejects.toThrow();
    });

    it('should validate description length', async () => {
      const incidentData = {
        title: 'Test Incident',
        description: 'Short',
        type: 'theft',
        severity: 'medium',
        location: {
          type: 'Point',
          coordinates: [-74.006, 40.7128]
        },
        reportedBy: user._id
      };

      const incident = new Incident(incidentData);
      await expect(incident.save()).rejects.toThrow();
    });

    it('should set default values correctly', async () => {
      const incidentData = {
        title: 'Test Incident',
        description: 'This is a test incident description',
        type: 'theft',
        location: {
          type: 'Point',
          coordinates: [-74.006, 40.7128]
        },
        reportedBy: user._id
      };

      const incident = new Incident(incidentData);
      await incident.save();

      expect(incident.severity).toBe('medium');
      expect(incident.status).toBe('reported');
      expect(incident.isActive).toBe(true);
      expect(incident.verificationScore).toBe(0);
      expect(incident.totalVotes).toBe(0);
    });
  });

  describe('Alert Model', () => {
    let user;

    beforeEach(async () => {
      user = await User.create({
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        password: 'password123',
        role: 'authority',
        isVerified: true
      });
    });

    it('should create an alert with valid data', async () => {
      const alertData = {
        title: 'Safety Alert',
        message: 'This is a safety alert message',
        type: 'safety_warning',
        priority: 'high',
        targetAudience: 'all',
        location: {
          type: 'Point',
          coordinates: [-74.006, 40.7128],
          radius: 5
        },
        createdBy: user._id
      };

      const alert = new Alert(alertData);
      const savedAlert = await alert.save();

      expect(savedAlert._id).toBeDefined();
      expect(savedAlert.title).toBe(alertData.title);
      expect(savedAlert.type).toBe(alertData.type);
      expect(savedAlert.priority).toBe(alertData.priority);
      expect(savedAlert.isActive).toBe(true);
      expect(savedAlert.isRead).toBe(false);
    });

    it('should validate alert type', async () => {
      const alertData = {
        title: 'Safety Alert',
        message: 'This is a safety alert message',
        type: 'invalid_type',
        priority: 'high',
        targetAudience: 'all',
        createdBy: user._id
      };

      const alert = new Alert(alertData);
      await expect(alert.save()).rejects.toThrow();
    });

    it('should validate priority level', async () => {
      const alertData = {
        title: 'Safety Alert',
        message: 'This is a safety alert message',
        type: 'safety_warning',
        priority: 'invalid_priority',
        targetAudience: 'all',
        createdBy: user._id
      };

      const alert = new Alert(alertData);
      await expect(alert.save()).rejects.toThrow();
    });

    it('should set default values correctly', async () => {
      const alertData = {
        title: 'Safety Alert',
        message: 'This is a safety alert message',
        type: 'safety_warning',
        createdBy: user._id
      };

      const alert = new Alert(alertData);
      await alert.save();

      expect(alert.priority).toBe('medium');
      expect(alert.targetAudience).toBe('all');
      expect(alert.isActive).toBe(true);
      expect(alert.isRead).toBe(false);
      expect(alert.actionRequired).toBe(false);
    });
  });

  describe('Location Model', () => {
    it('should create a location with valid data', async () => {
      const locationData = {
        name: 'Central Park',
        type: 'park',
        location: {
          type: 'Point',
          coordinates: [-73.9654, 40.7829]
        },
        address: {
          street: 'Central Park',
          city: 'New York',
          state: 'NY',
          zipCode: '10024',
          country: 'USA'
        },
        description: 'A large public park in Manhattan',
        amenities: ['parking', 'public_transport', 'lighting']
      };

      const location = new Location(locationData);
      const savedLocation = await location.save();

      expect(savedLocation._id).toBeDefined();
      expect(savedLocation.name).toBe(locationData.name);
      expect(savedLocation.type).toBe(locationData.type);
      expect(savedLocation.isActive).toBe(true);
    });

    it('should validate location type', async () => {
      const locationData = {
        name: 'Test Location',
        type: 'invalid_type',
        location: {
          type: 'Point',
          coordinates: [-73.9654, 40.7829]
        },
        address: {
          street: 'Test St',
          city: 'Test City',
          state: 'TS',
          zipCode: '12345',
          country: 'USA'
        }
      };

      const location = new Location(locationData);
      await expect(location.save()).rejects.toThrow();
    });

    it('should validate required fields', async () => {
      const locationData = {
        name: '',
        type: 'park',
        location: {
          type: 'Point',
          coordinates: [-73.9654, 40.7829]
        },
        address: {
          street: 'Test St',
          city: 'Test City',
          state: 'TS',
          zipCode: '12345',
          country: 'USA'
        }
      };

      const location = new Location(locationData);
      await expect(location.save()).rejects.toThrow();
    });

    it('should set default values correctly', async () => {
      const locationData = {
        name: 'Test Location',
        type: 'park',
        location: {
          type: 'Point',
          coordinates: [-73.9654, 40.7829]
        },
        address: {
          street: 'Test St',
          city: 'Test City',
          state: 'TS',
          zipCode: '12345',
          country: 'USA'
        }
      };

      const location = new Location(locationData);
      await location.save();

      expect(location.isActive).toBe(true);
    });
  });
});
