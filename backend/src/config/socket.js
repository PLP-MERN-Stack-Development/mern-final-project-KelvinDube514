const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const logger = require('./logger');

// Enhanced Socket.io authentication middleware
const socketAuth = async (socket, next) => {
  try {
    // Extract token from multiple possible locations
    const token = socket.handshake.auth.token || 
                  socket.handshake.headers.authorization?.split(' ')[1] ||
                  socket.handshake.query.token;

    if (!token) {
      logger.warn('Socket connection attempted without token:', {
        socketId: socket.id,
        ip: socket.handshake.address,
        userAgent: socket.handshake.headers['user-agent']
      });
      return next(new Error('AUTH_TOKEN_REQUIRED'));
    }

    // Verify JWT token with enhanced validation
    const decoded = jwt.verify(token, process.env.JWT_SECRET, {
      issuer: 'securepath-api',
      audience: 'securepath-client'
    });

    // Fetch user with additional validation
    const user = await User.findById(decoded.userId).select('-password');

    if (!user) {
      logger.warn('Socket auth failed - user not found:', { userId: decoded.userId });
      return next(new Error('USER_NOT_FOUND'));
    }

    // Account status and verification checks removed - allow all users

    // Attach user data to socket
    socket.userId = user._id.toString();
    socket.user = user;
    socket.userRole = user.role;
    socket.joinedAt = new Date();

    logger.info('Socket authenticated successfully:', {
      userId: user._id,
      socketId: socket.id,
      role: user.role,
      email: user.email
    });

    next();
  } catch (error) {
    logger.error('Socket authentication error:', {
      error: error.message,
      socketId: socket.id,
      ip: socket.handshake.address
    });

    // Return specific error codes for better client handling
    if (error.name === 'JsonWebTokenError') {
      return next(new Error('INVALID_TOKEN'));
    } else if (error.name === 'TokenExpiredError') {
      return next(new Error('TOKEN_EXPIRED'));
    } else {
      return next(new Error('AUTH_FAILED'));
    }
  }
};

// Initialize Socket.io
const initializeSocket = (server) => {
  // Build allowed origins from env to align with HTTP CORS
  const socketAllowedOrigins = (process.env.CORS_ORIGINS
    ? process.env.CORS_ORIGINS.split(',').map(o => o.trim()).filter(Boolean)
    : [])
    .concat(process.env.CORS_ORIGIN ? [process.env.CORS_ORIGIN] : [])
    .concat([
      'http://localhost:3000',
      'http://localhost:3001',
      'http://localhost:5173',
      'http://127.0.0.1:5173'
    ]);

  const io = new Server(server, {
    cors: {
      origin: Array.from(new Set(socketAllowedOrigins)),
      methods: ['GET', 'POST'],
      credentials: true
    },
    transports: ['websocket', 'polling'],
    // Enhanced configuration for production
    pingTimeout: 60000, // 60 seconds
    pingInterval: 25000, // 25 seconds
    connectTimeout: 45000, // 45 seconds
    maxHttpBufferSize: 1e6, // 1MB
    allowEIO3: true, // Allow Engine.IO v3 clients
    // Compression and performance
    compression: true,
    httpCompression: true,
    // Connection management
    allowRequest: (req, callback) => {
      // Additional connection validation can be added here
      const userAgent = req.headers['user-agent'] || '';
      const ip = req.socket.remoteAddress;
      
      // Basic validation
      if (userAgent.length === 0) {
        logger.warn('Socket connection blocked - no user agent:', { ip });
        return callback('No user agent provided', false);
      }
      
      callback(null, true);
    }
  });

  // Apply authentication middleware
  io.use(socketAuth);

  // Store connected users
  const connectedUsers = new Map();
  const locationRooms = new Map();

  io.on('connection', (socket) => {
    const userId = socket.userId;
    const user = socket.user;

    logger.info('User connected:', { userId, email: user.email });

    // Store user connection
    connectedUsers.set(userId, {
      socketId: socket.id,
      user: user,
      connectedAt: new Date(),
      location: user.location
    });

    // Join user to their personal room
    socket.join(`user:${userId}`);

    // Join location-based rooms if user has location
    if (user.location && user.location.coordinates) {
      const { coordinates } = user.location;
      const locationKey = `${Math.round(coordinates[1] * 100) / 100},${Math.round(coordinates[0] * 100) / 100}`;

      socket.join(`location:${locationKey}`);

      if (!locationRooms.has(locationKey)) {
        locationRooms.set(locationKey, new Set());
      }
      locationRooms.get(locationKey).add(userId);
    }

    // Handle user location updates
    socket.on('update-location', (data) => {
      try {
        const { coordinates, address } = data;

        if (coordinates && coordinates.length === 2) {
          // Update user's location in memory
          if (connectedUsers.has(userId)) {
            connectedUsers.get(userId).location = {
              coordinates,
              address
            };
          }

          // Leave old location room and join new one
          if (user.location && user.location.coordinates) {
            const oldLocationKey = `${Math.round(user.location.coordinates[1] * 100) / 100},${Math.round(user.location.coordinates[0] * 100) / 100}`;
            socket.leave(`location:${oldLocationKey}`);

            if (locationRooms.has(oldLocationKey)) {
              locationRooms.get(oldLocationKey).delete(userId);
              if (locationRooms.get(oldLocationKey).size === 0) {
                locationRooms.delete(oldLocationKey);
              }
            }
          }

          // Join new location room
          const newLocationKey = `${Math.round(coordinates[1] * 100) / 100},${Math.round(coordinates[0] * 100) / 100}`;
          socket.join(`location:${newLocationKey}`);

          if (!locationRooms.has(newLocationKey)) {
            locationRooms.set(newLocationKey, new Set());
          }
          locationRooms.get(newLocationKey).add(userId);

          logger.info('User location updated:', { userId, newLocation: coordinates });
        }
      } catch (error) {
        logger.error('Location update error:', error);
        socket.emit('error', { message: 'Failed to update location' });
      }
    });

    // Handle incident reporting
    socket.on('report-incident', (incidentData) => {
      try {
        // Emit to nearby users in the same location
        if (incidentData.location && incidentData.location.coordinates) {
          const { coordinates } = incidentData.location;
          const locationKey = `${Math.round(coordinates[1] * 100) / 100},${Math.round(coordinates[0] * 100) / 100}`;

          socket.to(`location:${locationKey}`).emit('new-incident', {
            ...incidentData,
            reportedBy: {
              id: user._id,
              name: `${user.firstName} ${user.lastName}`,
              role: user.role
            },
            timestamp: new Date()
          });

          logger.info('Incident reported via socket:', {
            incidentId: incidentData._id,
            reporterId: userId,
            location: coordinates
          });
        }
      } catch (error) {
        logger.error('Incident reporting error:', error);
        socket.emit('error', { message: 'Failed to report incident' });
      }
    });

    // Handle incident updates
    socket.on('incident-updated', (updateData) => {
      try {
        const { incidentId, updates, location } = updateData;

        if (location && location.coordinates) {
          const locationKey = `${Math.round(location.coordinates[1] * 100) / 100},${Math.round(location.coordinates[0] * 100) / 100}`;

          socket.to(`location:${locationKey}`).emit('incident-update', {
            incidentId,
            updates,
            updatedBy: {
              id: user._id,
              name: `${user.firstName} ${user.lastName}`,
              role: user.role
            },
            timestamp: new Date()
          });
        }

        logger.info('Incident updated via socket:', {
          incidentId,
          updatedBy: userId,
          updates: Object.keys(updates)
        });
      } catch (error) {
        logger.error('Incident update error:', error);
        socket.emit('error', { message: 'Failed to update incident' });
      }
    });

    // Handle alert broadcasting
    socket.on('broadcast-alert', (alertData) => {
      try {
        if (user.role === 'authority' || user.role === 'admin') {
          const { targetAudience, location, radius } = alertData;

          if (targetAudience === 'all') {
            io.emit('emergency-alert', {
              ...alertData,
              broadcastBy: {
                id: user._id,
                name: `${user.firstName} ${user.lastName}`,
                role: user.role
              },
              timestamp: new Date()
            });
          } else if (targetAudience === 'specific_area' && location) {
            const locationKey = `${Math.round(location.coordinates[1] * 100) / 100},${Math.round(location.coordinates[0] * 100) / 100}`;

            socket.to(`location:${locationKey}`).emit('emergency-alert', {
              ...alertData,
              broadcastBy: {
                id: user._id,
                name: `${user.firstName} ${user.lastName}`,
                role: user.role
              },
              timestamp: new Date()
            });
          }

          logger.info('Alert broadcasted:', {
            alertId: alertData._id,
            broadcasterId: userId,
            targetAudience
          });
        } else {
          socket.emit('error', { message: 'Unauthorized to broadcast alerts' });
        }
      } catch (error) {
        logger.error('Alert broadcasting error:', error);
        socket.emit('error', { message: 'Failed to broadcast alert' });
      }
    });

    // Handle dashboard subscription
    socket.on('dashboard:subscribe', (data) => {
      try {
        // Join dashboard room for role-based updates
        socket.join(`dashboard:${user.role}`);
        socket.join(`dashboard:all`);
        
        // Send initial metrics
        const metrics = {
          connectedUsers: connectedUsers.size,
          locationRooms: locationRooms.size,
          timestamp: new Date()
        };
        
        socket.emit('dashboard:metrics', metrics);
        
        logger.info('User subscribed to dashboard updates:', {
          userId,
          role: user.role
        });
      } catch (error) {
        logger.error('Dashboard subscription error:', error);
        socket.emit('error', { message: 'Failed to subscribe to dashboard updates' });
      }
    });

    // Handle dashboard metrics refresh request
    socket.on('dashboard:refresh-metrics', (data) => {
      try {
        const metrics = {
          connectedUsers: connectedUsers.size,
          locationRooms: locationRooms.size,
          timestamp: new Date()
        };
        
        socket.emit('dashboard:metrics', metrics);
      } catch (error) {
        logger.error('Dashboard metrics refresh error:', error);
      }
    });

    // Handle typing indicators for chat
    socket.on('typing-start', (data) => {
      socket.to(`user:${data.userId}`).emit('user-typing', {
        userId: user._id,
        name: `${user.firstName} ${user.lastName}`
      });
    });

    socket.on('typing-stop', (data) => {
      socket.to(`user:${data.userId}`).emit('user-stopped-typing', {
        userId: user._id
      });
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      logger.info('User disconnected:', { userId, email: user.email });

      // Remove from connected users
      connectedUsers.delete(userId);

      // Remove from location rooms
      if (user.location && user.location.coordinates) {
        const locationKey = `${Math.round(user.location.coordinates[1] * 100) / 100},${Math.round(user.location.coordinates[0] * 100) / 100}`;

        if (locationRooms.has(locationKey)) {
          locationRooms.get(locationKey).delete(userId);
          if (locationRooms.get(locationKey).size === 0) {
            locationRooms.delete(locationKey);
          }
        }
      }

      // Emit user disconnected event for other services
      socket.broadcast.emit('user:disconnected', userId);
    });

    // Send connection confirmation
    socket.emit('connected', {
      message: 'Connected to SecurePath',
      userId: user._id,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role
      }
    });

    // Emit user connected event for other services
    socket.broadcast.emit('user:connected', user._id);
  });

  // Helper functions for external use
  const broadcastIncident = (incident, location) => {
    if (location && location.coordinates) {
      const locationKey = `${Math.round(location.coordinates[1] * 100) / 100},${Math.round(location.coordinates[0] * 100) / 100}`;

      io.to(`location:${locationKey}`).emit('new-incident', {
        ...incident,
        timestamp: new Date()
      });
    }
  };

  const broadcastAlert = (alert, targetAudience, location) => {
    if (targetAudience === 'all') {
      io.emit('emergency-alert', {
        ...alert,
        timestamp: new Date()
      });
    } else if (targetAudience === 'specific_area' && location) {
      const locationKey = `${Math.round(location.coordinates[1] * 100) / 100},${Math.round(location.coordinates[0] * 100) / 100}`;

      io.to(`location:${locationKey}`).emit('emergency-alert', {
        ...alert,
        timestamp: new Date()
      });
    }
  };

  const getConnectedUsers = () => {
    return Array.from(connectedUsers.values());
  };

  const getUserCount = () => {
    return connectedUsers.size;
  };

  const broadcastDashboardUpdate = (updateType, data, targetRole = null) => {
    const update = {
      type: updateType,
      data,
      timestamp: new Date()
    };

    if (targetRole) {
      io.to(`dashboard:${targetRole}`).emit('dashboard:update', update);
    } else {
      io.to('dashboard:all').emit('dashboard:update', update);
    }
  };

  const broadcastMetricsUpdate = (targetRole = null) => {
    const metrics = {
      connectedUsers: connectedUsers.size,
      locationRooms: locationRooms.size,
      timestamp: new Date()
    };

    if (targetRole) {
      io.to(`dashboard:${targetRole}`).emit('dashboard:metrics', metrics);
    } else {
      io.to('dashboard:all').emit('dashboard:metrics', metrics);
    }
  };

  return {
    io,
    broadcastIncident,
    broadcastAlert,
    broadcastDashboardUpdate,
    broadcastMetricsUpdate,
    getConnectedUsers,
    getUserCount
  };
};

module.exports = { initializeSocket, socketAuth };
