const app = require('./app');
const { connectDB, createIndexes } = require('./config/database');
const logger = require('./config/logger');
const { initializeSocket } = require('./config/socket');

// Connect to database and create indexes
const initializeDatabase = async () => {
  try {
    await connectDB();
    // Create database indexes after connection is established
    setTimeout(async () => {
      await createIndexes();
    }, 2000); // Wait 2 seconds for connection to be fully established
  } catch (error) {
    logger.error('Database initialization failed:', error);
    process.exit(1);
  }
};

initializeDatabase();

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  logger.info(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
  console.log(`🚀 SecurePath API Server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`📚 API docs: http://localhost:${PORT}/api`);
  console.log(`🔌 Socket.io enabled for real-time features`);
});

// Initialize Socket.io
const { io, broadcastIncident, broadcastAlert, getConnectedUsers, getUserCount } = initializeSocket(server);

// Make Socket.io instance available globally for use in controllers
global.io = io;
global.broadcastIncident = broadcastIncident;
global.broadcastAlert = broadcastAlert;
global.getConnectedUsers = getConnectedUsers;
global.getUserCount = getUserCount;

// Handle server errors
server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    logger.error(`Port ${PORT} is already in use`);
    console.error(`❌ Port ${PORT} is already in use. Please use a different port.`);
  } else {
    logger.error('Server error:', error);
    console.error('❌ Server error:', error);
  }
  process.exit(1);
});

// Graceful shutdown
const gracefulShutdown = () => {
  logger.info('Received shutdown signal. Starting graceful shutdown...');

  server.close(() => {
    logger.info('HTTP server closed');

    // Close database connection
    require('mongoose').connection.close(false, () => {
      logger.info('Database connection closed');
      process.exit(0);
    });
  });

  // Force close server after 30 seconds
  setTimeout(() => {
    logger.error('Could not close connections in time, forcefully shutting down');
    process.exit(1);
  }, 30000);
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

module.exports = server;
