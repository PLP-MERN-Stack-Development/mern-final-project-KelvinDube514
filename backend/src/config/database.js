const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    // Enhanced connection options for production
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      maxPoolSize: 10, // Maintain up to 10 socket connections
      serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
      socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
      bufferCommands: false, // Disable mongoose buffering
    });

    console.log(`MongoDB Connected: ${conn.connection.host}`);
    
    // Enable monitoring
    mongoose.connection.on('connected', () => {
      console.log('✅ MongoDB connected successfully');
    });

    mongoose.connection.on('error', (error) => {
      console.error('❌ MongoDB connection error:', error);
    });

    mongoose.connection.on('disconnected', () => {
      console.log('⚠️ MongoDB disconnected');
    });

    // Graceful shutdown
    process.on('SIGINT', async () => {
      try {
        await mongoose.connection.close();
        console.log('🔄 MongoDB connection closed through app termination');
        process.exit(0);
      } catch (error) {
        console.error('Error closing MongoDB connection:', error);
        process.exit(1);
      }
    });

  } catch (error) {
    console.error('Database connection error:', error);
    process.exit(1);
  }
};

// Create database indexes for optimal performance
const createIndexes = async () => {
  try {
    const db = mongoose.connection.db;
    
    // Incident collection indexes
    await db.collection('incidents').createIndex({ location: '2dsphere' }); // Geospatial queries
    await db.collection('incidents').createIndex({ createdAt: -1 }); // Time-based queries
    await db.collection('incidents').createIndex({ severity: 1, status: 1 }); // Filtering
    await db.collection('incidents').createIndex({ type: 1, isActive: 1 }); // Type filtering
    await db.collection('incidents').createIndex({ reportedBy: 1, createdAt: -1 }); // User queries
    await db.collection('incidents').createIndex({ verificationScore: -1 }); // Analytics queries
    
    // User collection indexes
    await db.collection('users').createIndex({ email: 1 }, { unique: true });
    await db.collection('users').createIndex({ role: 1, isActive: 1 });
    
    // Alert collection indexes
    await db.collection('alerts').createIndex({ createdAt: -1 });
    await db.collection('alerts').createIndex({ severity: 1, isActive: 1 });
    await db.collection('alerts').createIndex({ location: '2dsphere' });
    
    console.log('✅ Database indexes created successfully');
  } catch (error) {
    console.error('❌ Error creating database indexes:', error);
  }
};

module.exports = { connectDB, createIndexes };
