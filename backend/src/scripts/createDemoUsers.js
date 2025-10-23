require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const logger = require('../config/logger');

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    logger.info('MongoDB connected for demo user creation');
  } catch (error) {
    logger.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

// Demo users to create
const demoUsers = [
  {
    firstName: 'John',
    lastName: 'Doe',
    email: 'demo@securepath.co.za',
    password: 'demo123',
    phone: '+27 11 123 4567',
    role: 'admin',
    isVerified: true,
    location: {
      type: 'Point',
      coordinates: [28.0473, -26.2041], // Johannesburg [lng, lat]
      address: {
        street: '123 Demo Street',
        city: 'Johannesburg',
        state: 'Gauteng',
        zipCode: '2000',
        country: 'South Africa'
      }
    },
    preferences: {
      notifications: {
        email: true,
        push: true,
        sms: false
      },
      alertRadius: 5
    }
  },
  {
    firstName: 'Sarah',
    lastName: 'Wilson',
    email: 'sarah.wilson@securepath.co.za',
    password: 'demo123',
    phone: '+27 11 987 6543',
    role: 'authority',
    isVerified: true,
    location: {
      type: 'Point',
      coordinates: [28.0473, -26.2041], // [lng, lat]
      address: {
        street: '456 Police Station',
        city: 'Johannesburg',
        state: 'Gauteng',
        zipCode: '2000',
        country: 'South Africa'
      }
    },
    preferences: {
      notifications: {
        email: true,
        push: true,
        sms: true
      },
      alertRadius: 10
    }
  },
  {
    firstName: 'Mike',
    lastName: 'Johnson',
    email: 'mike.johnson@securepath.co.za',
    password: 'demo123',
    phone: '+27 11 555 1234',
    role: 'citizen',
    isVerified: true,
    location: {
      type: 'Point',
      coordinates: [28.0473, -26.2041], // [lng, lat]
      address: {
        street: '789 Community Center',
        city: 'Johannesburg',
        state: 'Gauteng',
        zipCode: '2000',
        country: 'South Africa'
      }
    },
    preferences: {
      notifications: {
        email: true,
        push: true,
        sms: false
      },
      alertRadius: 3
    }
  }
];

const createDemoUsers = async () => {
  try {
    await connectDB();

    // Clear existing demo users
    await User.deleteMany({
      email: { $in: demoUsers.map(user => user.email) }
    });
    logger.info('Cleared existing demo users');

    // Create new demo users
    for (const userData of demoUsers) {
      const user = new User(userData);
      await user.save();
      logger.info(`Created demo user: ${user.email}`);
    }

    logger.info('Demo users created successfully!');
    logger.info('Demo credentials:');
    demoUsers.forEach(user => {
      logger.info(`Email: ${user.email}, Password: demo123, Role: ${user.role}`);
    });

  } catch (error) {
    logger.error('Error creating demo users:', error);
  } finally {
    mongoose.connection.close();
  }
};

// Run the script
if (require.main === module) {
  createDemoUsers();
}

module.exports = createDemoUsers;
