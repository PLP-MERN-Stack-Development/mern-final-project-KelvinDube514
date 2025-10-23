const User = require('../models/User');
const Incident = require('../models/Incident');
const Alert = require('../models/Alert');
const logger = require('../config/logger');

// @desc    Get all users with pagination
// @route   GET /api/admin/users
// @access  Private (Admin/Authority only)
const getAllUsers = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = '',
      role = '',
      isVerified = '',
      isActive = '',
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Build filter query
    const filter = {};
    
    if (search) {
      filter.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (role) filter.role = role;
    if (isVerified !== '') filter.isVerified = isVerified === 'true';
    if (isActive !== '') filter.isActive = isActive === 'true';

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Get users with pagination
    const users = await User.find(filter)
      .select('-password -verificationToken -resetPasswordToken')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));

    // Get total count for pagination
    const total = await User.countDocuments(filter);

    // Calculate pagination info
    const totalPages = Math.ceil(total / parseInt(limit));
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    logger.info('Admin users list accessed:', {
      adminId: req.user._id,
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      filters: filter
    });

    res.json({
      success: true,
      data: {
        users,
        pagination: {
          current: parseInt(page),
          pages: totalPages,
          total,
          hasNext: hasNextPage,
          hasPrev: hasPrevPage,
          limit: parseInt(limit)
        }
      }
    });
  } catch (error) {
    logger.error('Get all users error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve users.'
    });
  }
};

// @desc    Get user by ID
// @route   GET /api/admin/users/:id
// @access  Private (Admin/Authority only)
const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('-password -verificationToken -resetPasswordToken');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found.'
      });
    }

    // Get user statistics
    const incidentCount = await Incident.countDocuments({ reportedBy: user._id });
    const verifiedIncidentCount = await Incident.countDocuments({ 
      reportedBy: user._id, 
      status: 'verified' 
    });

    logger.info('Admin user details accessed:', {
      adminId: req.user._id,
      targetUserId: user._id
    });

    res.json({
      success: true,
      data: {
        user,
        statistics: {
          incidentsReported: incidentCount,
          verifiedIncidents: verifiedIncidentCount,
          verificationRate: incidentCount > 0 ? (verifiedIncidentCount / incidentCount * 100).toFixed(1) : 0
        }
      }
    });
  } catch (error) {
    logger.error('Get user by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve user.'
    });
  }
};

// @desc    Update user status (verify, activate/deactivate)
// @route   PUT /api/admin/users/:id/status
// @access  Private (Admin only)
const updateUserStatus = async (req, res) => {
  try {
    const { isVerified, isActive, role } = req.body;
    const userId = req.params.id;

    // Prevent self-modification of admin status
    if (userId === req.user._id.toString() && (isActive === false)) {
      return res.status(400).json({
        success: false,
        message: 'Cannot deactivate your own account.'
      });
    }

    const updateData = {};
    if (typeof isVerified === 'boolean') updateData.isVerified = isVerified;
    if (typeof isActive === 'boolean') updateData.isActive = isActive;
    if (role && ['citizen', 'authority', 'admin'].includes(role)) {
      // Only super admin can create other admins
      if (role === 'admin' && req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Only admins can assign admin role.'
        });
      }
      updateData.role = role;
    }

    const user = await User.findByIdAndUpdate(
      userId,
      updateData,
      { new: true, runValidators: true }
    ).select('-password -verificationToken -resetPasswordToken');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found.'
      });
    }

    logger.info('User status updated by admin:', {
      adminId: req.user._id,
      targetUserId: user._id,
      updates: updateData
    });

    res.json({
      success: true,
      message: 'User status updated successfully.',
      data: { user }
    });
  } catch (error) {
    logger.error('Update user status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update user status.'
    });
  }
};

// @desc    Delete user account
// @route   DELETE /api/admin/users/:id
// @access  Private (Admin only)
const deleteUser = async (req, res) => {
  try {
    const userId = req.params.id;

    // Prevent self-deletion
    if (userId === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete your own account.'
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found.'
      });
    }

    // Soft delete: deactivate instead of removing from database
    user.isActive = false;
    user.email = `deleted_${Date.now()}_${user.email}`;
    await user.save();

    logger.warn('User account deleted by admin:', {
      adminId: req.user._id,
      deletedUserId: user._id,
      deletedUserEmail: user.email
    });

    res.json({
      success: true,
      message: 'User account has been deactivated.'
    });
  } catch (error) {
    logger.error('Delete user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete user account.'
    });
  }
};

// @desc    Get system statistics
// @route   GET /api/admin/statistics
// @access  Private (Admin/Authority only)
const getSystemStats = async (req, res) => {
  try {
    // User statistics
    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({ isActive: true });
    const verifiedUsers = await User.countDocuments({ isVerified: true });
    const citizenCount = await User.countDocuments({ role: 'citizen' });
    const authorityCount = await User.countDocuments({ role: 'authority' });
    const adminCount = await User.countDocuments({ role: 'admin' });

    // Recent registrations (last 30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const recentRegistrations = await User.countDocuments({
      createdAt: { $gte: thirtyDaysAgo }
    });

    // Incident statistics
    const totalIncidents = await Incident.countDocuments();
    const pendingIncidents = await Incident.countDocuments({ status: 'reported' });
    const verifiedIncidents = await Incident.countDocuments({ status: 'verified' });
    const resolvedIncidents = await Incident.countDocuments({ status: 'resolved' });

    // Recent incidents (last 7 days)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const recentIncidents = await Incident.countDocuments({
      createdAt: { $gte: sevenDaysAgo }
    });

    // Alert statistics
    const totalAlerts = await Alert.countDocuments();
    const activeAlerts = await Alert.countDocuments({
      $or: [
        { expiresAt: { $exists: false } },
        { expiresAt: { $gte: new Date() } }
      ]
    });

    logger.info('System statistics accessed:', {
      adminId: req.user._id
    });

    res.json({
      success: true,
      data: {
        users: {
          total: totalUsers,
          active: activeUsers,
          verified: verifiedUsers,
          recentRegistrations,
          byRole: {
            citizen: citizenCount,
            authority: authorityCount,
            admin: adminCount
          }
        },
        incidents: {
          total: totalIncidents,
          pending: pendingIncidents,
          verified: verifiedIncidents,
          resolved: resolvedIncidents,
          recent: recentIncidents
        },
        alerts: {
          total: totalAlerts,
          active: activeAlerts
        }
      }
    });
  } catch (error) {
    logger.error('Get system stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve system statistics.'
    });
  }
};

// @desc    Get recent activity logs
// @route   GET /api/admin/activity
// @access  Private (Admin only)
const getRecentActivity = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Get recent user registrations
    const recentUsers = await User.find()
      .select('firstName lastName email role createdAt')
      .sort({ createdAt: -1 })
      .limit(5);

    // Get recent incidents
    const recentIncidents = await Incident.find()
      .select('title type severity status createdAt reportedBy')
      .populate('reportedBy', 'firstName lastName')
      .sort({ createdAt: -1 })
      .limit(10);

    // Get recent alerts
    const recentAlerts = await Alert.find()
      .select('title type priority createdAt createdBy')
      .populate('createdBy', 'firstName lastName')
      .sort({ createdAt: -1 })
      .limit(5);

    logger.info('Admin activity log accessed:', {
      adminId: req.user._id
    });

    res.json({
      success: true,
      data: {
        recentUsers,
        recentIncidents,
        recentAlerts
      }
    });
  } catch (error) {
    logger.error('Get recent activity error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve recent activity.'
    });
  }
};

module.exports = {
  getAllUsers,
  getUserById,
  updateUserStatus,
  deleteUser,
  getSystemStats,
  getRecentActivity
};
