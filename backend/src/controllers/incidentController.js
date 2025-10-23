const Incident = require('../models/Incident');
const User = require('../models/User');
const AnalyticsService = require('../services/analyticsService');
const logger = require('../config/logger');

// @desc    Get all incidents with advanced filtering
// @route   GET /api/incidents
// @access  Private
const getIncidents = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      sort = 'createdAt',
      order = 'desc',
      type,
      severity,
      status,
      category,
      tag,
      lat,
      lng,
      radius = 5,
      // Enhanced filtering options
      dateFrom,
      dateTo,
      verificationScore,
      reportedBy,
      search,
      tags,
      priority,
      hasImages,
      hasWitnesses
    } = req.query;

    // Build advanced query
    const query = { isActive: true };

    // Basic filters
    if (type) {
      query.type = Array.isArray(type) ? { $in: type } : type;
    }
    if (severity) {
      query.severity = Array.isArray(severity) ? { $in: severity } : severity;
    }
    if (status) {
      query.status = Array.isArray(status) ? { $in: status } : status;
    }
    if (category) {
      query.category = Array.isArray(category) ? { $in: category } : category;
    }
    if (tag) {
      query.tag = Array.isArray(tag) ? { $in: tag } : tag;
    }

    // Date range filter
    if (dateFrom || dateTo) {
      query.createdAt = {};
      if (dateFrom) query.createdAt.$gte = new Date(dateFrom);
      if (dateTo) query.createdAt.$lte = new Date(dateTo);
    }

    // Verification score filter
    if (verificationScore) {
      const score = parseInt(verificationScore);
      query.verificationScore = { $gte: score };
    }

    // Reported by specific user
    if (reportedBy) {
      query.reportedBy = reportedBy;
    }

    // Text search across title and description
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tags: { $regex: search, $options: 'i' } },
        { tag: { $regex: search, $options: 'i' } },
        { category: { $regex: search, $options: 'i' } }
      ];
    }

    // Tags filter
    if (tags) {
      const tagArray = Array.isArray(tags) ? tags : [tags];
      query.tags = { $in: tagArray };
    }

    // Priority filter
    if (priority) {
      query.priority = priority;
    }

    // Has images filter
    if (hasImages === 'true') {
      query.images = { $exists: true, $ne: [] };
    }

    // Has witnesses filter
    if (hasWitnesses === 'true') {
      query.witnesses = { $exists: true, $ne: [] };
    }

    // Location filter with geospatial queries
    if (lat && lng) {
      query.location = {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [parseFloat(lng), parseFloat(lat)]
          },
          $maxDistance: radius * 1000 // Convert km to meters
        }
      };
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Enhanced sort options
    const sortObj = {};
    if (sort === 'relevance' && search) {
      // Text score sorting for search relevance
      sortObj.score = { $meta: 'textScore' };
    } else if (sort === 'priority') {
      sortObj.priority = order === 'asc' ? 1 : -1;
      sortObj.severity = -1; // Secondary sort by severity
    } else if (sort === 'verification') {
      sortObj.verificationScore = order === 'asc' ? 1 : -1;
    } else if (sort === 'engagement') {
      sortObj['analytics.views'] = order === 'asc' ? 1 : -1;
    } else {
      sortObj[sort] = order === 'asc' ? 1 : -1;
    }

    // Execute query with enhanced population
    const incidents = await Incident.find(query)
      .populate('reportedBy', 'firstName lastName email role')
      .populate('verifiedBy', 'firstName lastName email role')
      .populate('relatedIncidents', 'title type severity createdAt category tag')
      .sort(sortObj)
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    // Get total count
    const total = await Incident.countDocuments(query);

    // Enhanced response with metadata
    const response = {
      success: true,
      data: {
        incidents,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit)),
          hasNext: skip + incidents.length < total,
          hasPrev: parseInt(page) > 1
        },
        filters: {
          applied: Object.keys(req.query).filter(key => !['page', 'limit', 'sort', 'order'].includes(key)),
          total: Object.keys(query).length - 1 // Exclude isActive
        }
      }
    };

    // Add aggregated statistics if requested
    if (req.query.includeStats === 'true') {
      const stats = await Incident.aggregate([
        { $match: query },
        {
          $group: {
            _id: null,
            totalViews: { $sum: '$analytics.views' },
            totalEngagements: { $sum: '$analytics.engagements' },
            avgVerificationScore: { $avg: '$verificationScore' },
            typeBreakdown: { $push: '$type' },
            severityBreakdown: { $push: '$severity' },
            categoryBreakdown: { $push: '$category' },
            tagBreakdown: { $push: '$tag' }
          }
        }
      ]);

      if (stats.length > 0) {
        response.data.statistics = stats[0];
      }
    }

    logger.info('Incidents retrieved:', { 
      count: incidents.length, 
      total,
      filters: response.data.filters.applied
    });

    res.json(response);
  } catch (error) {
    logger.error('Get incidents error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve incidents.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Get incident by ID with enhanced details
// @route   GET /api/incidents/:id
// @access  Private
const getIncident = async (req, res) => {
  try {
    const incident = await Incident.findById(req.params.id)
      .populate('reportedBy', 'firstName lastName email')
      .populate('verifiedBy', 'firstName lastName email role')
      .populate('communityVotes.user', 'firstName lastName')
      .populate('witnesses.user', 'firstName lastName email')
      .populate('relatedIncidents', 'title type severity createdAt location category tag');

    if (!incident) {
      return res.status(404).json({
        success: false,
        message: 'Incident not found.'
      });
    }

    // Increment view count
    await incident.incrementViews();

    // Get related incidents within 1km radius
    const relatedIncidents = await Incident.find({
      _id: { $ne: incident._id },
      isActive: true,
      location: {
        $near: {
          $geometry: incident.location,
          $maxDistance: 1000 // 1km radius
        }
      }
    })
    .populate('reportedBy', 'firstName lastName')
    .limit(5)
    .lean();

    res.json({
      success: true,
      data: { 
        incident,
        relatedIncidents,
        impactScore: incident.calculateImpactScore(),
        isStale: incident.isStale()
      }
    });
  } catch (error) {
    logger.error('Get incident error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve incident.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Create new incident
// @route   POST /api/incidents
// @access  Private
const createIncident = async (req, res) => {
  try {
    const incidentData = {
      ...req.body,
      reportedBy: req.user._id
    };

    const incident = await Incident.create(incidentData);

    // Populate the created incident
    await incident.populate('reportedBy', 'firstName lastName email');

    logger.info('Incident created:', {
      incidentId: incident._id,
      userId: req.user._id,
      type: incident.type,
      severity: incident.severity
    });

    res.status(201).json({
      success: true,
      message: 'Incident reported successfully.',
      data: { incident }
    });
  } catch (error) {
    logger.error('Create incident error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to report incident.'
    });
  }
};

// @desc    Update incident
// @route   PUT /api/incidents/:id
// @access  Private
const updateIncident = async (req, res) => {
  try {
    const incident = await Incident.findById(req.params.id);

    if (!incident) {
      return res.status(404).json({
        success: false,
        message: 'Incident not found.'
      });
    }

    // Check permissions
    const canUpdate =
      req.user.role === 'admin' ||
      req.user.role === 'authority' ||
      incident.reportedBy.toString() === req.user._id.toString();

    if (!canUpdate) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this incident.'
      });
    }

    // Authority users can verify incidents
    if (req.user.role === 'authority' && req.body.status === 'verified') {
      req.body.verifiedBy = req.user._id;
      req.body.verificationDate = new Date();
    }

    const updatedIncident = await Incident.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('reportedBy', 'firstName lastName email')
      .populate('verifiedBy', 'firstName lastName email role');

    logger.info('Incident updated:', {
      incidentId: incident._id,
      userId: req.user._id,
      updates: Object.keys(req.body)
    });

    res.json({
      success: true,
      message: 'Incident updated successfully.',
      data: { incident: updatedIncident }
    });
  } catch (error) {
    logger.error('Update incident error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update incident.'
    });
  }
};

// @desc    Delete incident
// @route   DELETE /api/incidents/:id
// @access  Private
const deleteIncident = async (req, res) => {
  try {
    const incident = await Incident.findById(req.params.id);

    if (!incident) {
      return res.status(404).json({
        success: false,
        message: 'Incident not found.'
      });
    }

    // Check permissions (only admin or reporter can delete)
    const canDelete =
      req.user.role === 'admin' ||
      incident.reportedBy.toString() === req.user._id.toString();

    if (!canDelete) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this incident.'
      });
    }

    // Soft delete
    incident.isActive = false;
    await incident.save();

    logger.info('Incident deleted:', {
      incidentId: incident._id,
      userId: req.user._id
    });

    res.json({
      success: true,
      message: 'Incident deleted successfully.'
    });
  } catch (error) {
    logger.error('Delete incident error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete incident.'
    });
  }
};

// @desc    Vote on incident
// @route   POST /api/incidents/:id/vote
// @access  Private
const voteOnIncident = async (req, res) => {
  try {
    const { vote } = req.body;
    const incident = await Incident.findById(req.params.id);

    if (!incident) {
      return res.status(404).json({
        success: false,
        message: 'Incident not found.'
      });
    }

    // Check if user has already voted
    if (incident.hasUserVoted(req.user._id)) {
      return res.status(400).json({
        success: false,
        message: 'You have already voted on this incident.'
      });
    }

    // Add vote
    await incident.addVote(req.user._id, vote);

    logger.info('Incident vote added:', {
      incidentId: incident._id,
      userId: req.user._id,
      vote
    });

    res.json({
      success: true,
      message: 'Vote recorded successfully.',
      data: {
        verificationScore: incident.verificationScore,
        totalVotes: incident.communityVotes.length
      }
    });
  } catch (error) {
    logger.error('Vote incident error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to record vote.'
    });
  }
};

// @desc    Get nearby incidents
// @route   GET /api/incidents/nearby
// @access  Private
const getNearbyIncidents = async (req, res) => {
  try {
    const { lat, lng, radius = 5, limit = 20 } = req.query;

    if (lat === undefined || lng === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Latitude and longitude are required'
      });
    }

    const incidents = await Incident.find({
      isActive: true,
      location: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [parseFloat(lng), parseFloat(lat)]
          },
          $maxDistance: radius * 1000 // Convert km to meters
        }
      }
    })
      .populate('reportedBy', 'firstName lastName')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .lean();

    logger.info('Nearby incidents retrieved:', {
      count: incidents.length,
      location: { lat, lng },
      radius
    });

    res.json({
      success: true,
      data: { incidents }
    });
  } catch (error) {
    logger.error('Get nearby incidents error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve nearby incidents.'
    });
  }
};

// @desc    Get incident statistics
// @route   GET /api/incidents/stats
// @access  Private (Admin/Authority)
const getIncidentStats = async (req, res) => {
  try {
    // Only admin and authority can access stats
    if (!['admin', 'authority'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin or authority role required.'
      });
    }

    const stats = await Incident.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: null,
          totalIncidents: { $sum: 1 },
          byType: {
            $push: '$type'
          },
          bySeverity: {
            $push: '$severity'
          },
          byStatus: {
            $push: '$status'
          },
          byCategory: {
            $push: '$category'
          },
          byTag: {
            $push: '$tag'
          },
          verifiedCount: {
            $sum: { $cond: [{ $eq: ['$status', 'verified'] }, 1, 0] }
          },
          resolvedCount: {
            $sum: { $cond: [{ $eq: ['$status', 'resolved'] }, 1, 0] }
          }
        }
      }
    ]);

    const typeStats = {};
    const severityStats = {};
    const statusStats = {};
    const categoryStats = {};
    const tagStats = {};

    if (stats.length > 0) {
      const stat = stats[0];

      // Count by type
      stat.byType.forEach(type => {
        typeStats[type] = (typeStats[type] || 0) + 1;
      });

      // Count by severity
      stat.bySeverity.forEach(severity => {
        severityStats[severity] = (severityStats[severity] || 0) + 1;
      });

      // Count by status
      stat.byStatus.forEach(status => {
        statusStats[status] = (statusStats[status] || 0) + 1;
      });

      // Count by category
      stat.byCategory.forEach(category => {
        if (category) {
          categoryStats[category] = (categoryStats[category] || 0) + 1;
        }
      });

      // Count by tag
      stat.byTag.forEach(tag => {
        if (tag) {
          tagStats[tag] = (tagStats[tag] || 0) + 1;
        }
      });
    }

    res.json({
      success: true,
      data: {
        totalIncidents: stats[0]?.totalIncidents || 0,
        verifiedCount: stats[0]?.verifiedCount || 0,
        resolvedCount: stats[0]?.resolvedCount || 0,
        byType: typeStats,
        bySeverity: severityStats,
        byStatus: statusStats,
        byCategory: categoryStats,
        byTag: tagStats
      }
    });
  } catch (error) {
    logger.error('Get incident stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve incident statistics.'
    });
  }
};

// @desc    Get incident analytics using Analytics Service
// @route   GET /api/incidents/analytics
// @access  Private (Admin/Authority)
const getIncidentAnalytics = async (req, res) => {
  try {
    // Check permissions
    if (!['admin', 'authority'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin or authority role required.'
      });
    }

    const analytics = await AnalyticsService.getIncidentAnalytics(req.query);

    logger.info('Incident analytics retrieved:', {
      userId: req.user._id,
      timeRange: req.query.timeRange || '30d'
    });

    res.json({
      success: true,
      data: analytics
    });
  } catch (error) {
    logger.error('Get incident analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve analytics.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Get incident hotspots
// @route   GET /api/incidents/hotspots
// @access  Private
const getIncidentHotspots = async (req, res) => {
  try {
    const { timeRange = '30d', maxDistance = 1000 } = req.query;
    
    // Date filter based on timeRange
    const dateFilter = getDateFilter(timeRange);
    const filter = { isActive: true, ...dateFilter };

    const hotspots = await Incident.aggregate([
      { $match: filter },
      {
        $group: {
          _id: {
            // Create grid cells for clustering (roughly 500m x 500m)
            lat: { $round: [{ $divide: [{ $arrayElemAt: ['$location.coordinates', 1] }, 0.005] }] },
            lng: { $round: [{ $divide: [{ $arrayElemAt: ['$location.coordinates', 0] }, 0.005] }] }
          },
          incidents: { $push: '$$ROOT' },
          count: { $sum: 1 },
          severityScore: {
            $sum: {
              $switch: {
                branches: [
                  { case: { $eq: ['$severity', 'critical'] }, then: 4 },
                  { case: { $eq: ['$severity', 'high'] }, then: 3 },
                  { case: { $eq: ['$severity', 'medium'] }, then: 2 },
                  { case: { $eq: ['$severity', 'low'] }, then: 1 }
                ],
                default: 1
              }
            }
          },
          avgViews: { $avg: '$analytics.views' },
          types: { $push: '$type' }
        }
      },
      {
        $match: { count: { $gte: 2 } } // Only areas with 2+ incidents
      },
      {
        $project: {
          centerPoint: {
            type: 'Point',
            coordinates: [
              { $multiply: ['$_id.lng', 0.005] },
              { $multiply: ['$_id.lat', 0.005] }
            ]
          },
          incidentCount: '$count',
          severityScore: 1,
          avgViews: { $round: ['$avgViews', 2] },
          riskLevel: {
            $switch: {
              branches: [
                { case: { $gte: ['$severityScore', 10] }, then: 'critical' },
                { case: { $gte: ['$severityScore', 6] }, then: 'high' },
                { case: { $gte: ['$severityScore', 3] }, then: 'medium' }
              ],
              default: 'low'
            }
          },
          mostCommonType: {
            $arrayElemAt: [
              {
                $reduce: {
                  input: { $setUnion: '$types' },
                  initialValue: { type: '', count: 0 },
                  in: {
                    $let: {
                      vars: {
                        currentCount: {
                          $size: {
                            $filter: {
                              input: '$types',
                              cond: { $eq: ['$$this', '$$value'] }
                            }
                          }
                        }
                      },
                      in: {
                        $cond: [
                          { $gt: ['$$currentCount', '$$value.count'] },
                          { type: '$$value', count: '$$currentCount' },
                          '$$value'
                        ]
                      }
                    }
                  }
                }
              },
              0
            ]
          }
        }
      },
      { $sort: { severityScore: -1, incidentCount: -1 } },
      { $limit: 20 }
    ]);

    res.json({
      success: true,
      data: {
        hotspots,
        timeRange,
        generatedAt: new Date()
      }
    });
  } catch (error) {
    logger.error('Get incident hotspots error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve incident hotspots.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Generate comprehensive incident report
// @route   GET /api/incidents/reports
// @access  Private (Admin/Authority)
const generateIncidentReport = async (req, res) => {
  try {
    // Check permissions
    if (!['admin', 'authority'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin or authority role required.'
      });
    }

    const report = await AnalyticsService.generateReport(req.query);

    logger.info('Incident report generated:', {
      userId: req.user._id,
      format: req.query.format || 'json',
      timeRange: req.query.timeRange || '30d'
    });

    // Set appropriate headers for different formats
    if (req.query.format === 'csv') {
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="incident-report.csv"');
    }

    res.json({
      success: true,
      data: report
    });
  } catch (error) {
    logger.error('Generate incident report error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate report.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Track incident engagement
// @route   POST /api/incidents/:id/engage
// @access  Private
const trackIncidentEngagement = async (req, res) => {
  try {
    const incident = await Incident.findById(req.params.id);

    if (!incident) {
      return res.status(404).json({
        success: false,
        message: 'Incident not found.'
      });
    }

    await incident.incrementEngagement();

    res.json({
      success: true,
      message: 'Engagement tracked successfully.',
      data: {
        totalViews: incident.analytics.views,
        totalEngagements: incident.analytics.engagements
      }
    });
  } catch (error) {
    logger.error('Track incident engagement error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to track engagement.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Helper function for date filtering
const getDateFilter = (timeRange) => {
  const now = new Date();
  let startDate;
  
  switch (timeRange) {
    case '24h':
      startDate = new Date(now - 24 * 60 * 60 * 1000);
      break;
    case '7d':
      startDate = new Date(now - 7 * 24 * 60 * 60 * 1000);
      break;
    case '30d':
      startDate = new Date(now - 30 * 24 * 60 * 60 * 1000);
      break;
    case '90d':
      startDate = new Date(now - 90 * 24 * 60 * 60 * 1000);
      break;
    case '1y':
      startDate = new Date(now - 365 * 24 * 60 * 60 * 1000);
      break;
    default:
      startDate = new Date(now - 30 * 24 * 60 * 60 * 1000);
  }
  
  return { createdAt: { $gte: startDate } };
};

module.exports = {
  getIncidents,
  getIncident,
  createIncident,
  updateIncident,
  deleteIncident,
  voteOnIncident,
  getNearbyIncidents,
  getIncidentStats,
  getIncidentAnalytics,
  getIncidentHotspots,
  generateIncidentReport,
  trackIncidentEngagement
};
