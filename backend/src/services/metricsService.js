const Incident = require('../models/Incident');
const User = require('../models/User');
const Alert = require('../models/Alert');
const logger = require('../config/logger');

/**
 * Real-time Metrics Service for MongoDB data aggregation
 * Provides live dashboard metrics and real-time analytics
 */
class MetricsService {
  constructor() {
    this.metricsCache = new Map();
    this.cacheExpiry = 60 * 1000; // 1 minute cache
    this.updateInterval = 30 * 1000; // Update every 30 seconds
    
    // Start background metrics updates
    this.startMetricsUpdater();
  }

  /**
   * Get real-time dashboard metrics
   */
  async getDashboardMetrics(userRole = 'citizen', location = null) {
    const cacheKey = `dashboard_${userRole}_${location ? `${location.lat}_${location.lng}` : 'global'}`;
    
    // Check cache first
    const cached = this.metricsCache.get(cacheKey);
    if (cached && (Date.now() - cached.timestamp) < this.cacheExpiry) {
      return cached.data;
    }

    try {
      const metrics = await this.calculateDashboardMetrics(userRole, location);
      
      // Cache the results
      this.metricsCache.set(cacheKey, {
        data: metrics,
        timestamp: Date.now()
      });

      return metrics;
    } catch (error) {
      logger.error('Dashboard metrics error:', error);
      throw new Error('Failed to retrieve dashboard metrics');
    }
  }

  /**
   * Calculate comprehensive dashboard metrics
   */
  async calculateDashboardMetrics(userRole, location) {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today - 24 * 60 * 60 * 1000);
    const thisWeek = new Date(now - 7 * 24 * 60 * 60 * 1000);
    const lastWeek = new Date(now - 14 * 24 * 60 * 60 * 1000);

    // Base query based on user role and location
    let baseQuery = { isActive: true };
    
    if (location) {
      baseQuery.location = {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [location.lng, location.lat]
          },
          $maxDistance: 10000 // 10km radius
        }
      };
    }

    // Parallel execution of all metric calculations
    const [
      overviewMetrics,
      trendMetrics,
      severityMetrics,
      typeMetrics,
      responseMetrics,
      engagementMetrics,
      locationMetrics,
      alertMetrics
    ] = await Promise.all([
      this.getOverviewMetrics(baseQuery, today, yesterday),
      this.getTrendMetrics(baseQuery, thisWeek, lastWeek),
      this.getSeverityMetrics(baseQuery),
      this.getTypeMetrics(baseQuery),
      this.getResponseMetrics(baseQuery),
      this.getEngagementMetrics(baseQuery),
      this.getLocationMetrics(baseQuery),
      this.getAlertMetrics(baseQuery)
    ]);

    return {
      timestamp: now,
      overview: overviewMetrics,
      trends: trendMetrics,
      breakdown: {
        severity: severityMetrics,
        type: typeMetrics
      },
      performance: responseMetrics,
      engagement: engagementMetrics,
      location: locationMetrics,
      alerts: alertMetrics,
      refreshRate: this.updateInterval / 1000 // seconds
    };
  }

  /**
   * Get overview metrics (total counts, today vs yesterday)
   */
  async getOverviewMetrics(baseQuery, today, yesterday) {
    const results = await Incident.aggregate([
      { $match: baseQuery },
      {
        $facet: {
          total: [
            { $count: 'count' }
          ],
          today: [
            { $match: { createdAt: { $gte: today } } },
            { $count: 'count' }
          ],
          yesterday: [
            { 
              $match: { 
                createdAt: { 
                  $gte: yesterday, 
                  $lt: today 
                } 
              } 
            },
            { $count: 'count' }
          ],
          critical: [
            { $match: { severity: 'critical' } },
            { $count: 'count' }
          ],
          resolved: [
            { $match: { status: 'resolved' } },
            { $count: 'count' }
          ],
          verified: [
            { $match: { status: 'verified' } },
            { $count: 'count' }
          ]
        }
      }
    ]);

    const data = results[0];
    const total = data.total[0]?.count || 0;
    const todayCount = data.today[0]?.count || 0;
    const yesterdayCount = data.yesterday[0]?.count || 0;
    
    return {
      total,
      today: todayCount,
      yesterday: yesterdayCount,
      critical: data.critical[0]?.count || 0,
      resolved: data.resolved[0]?.count || 0,
      verified: data.verified[0]?.count || 0,
      changeFromYesterday: yesterdayCount > 0 ? 
        Math.round(((todayCount - yesterdayCount) / yesterdayCount) * 100) : 0,
      resolutionRate: total > 0 ? Math.round((data.resolved[0]?.count || 0) / total * 100) : 0
    };
  }

  /**
   * Get trend metrics (this week vs last week)
   */
  async getTrendMetrics(baseQuery, thisWeek, lastWeek) {
    const results = await Incident.aggregate([
      { $match: baseQuery },
      {
        $facet: {
          thisWeek: [
            { $match: { createdAt: { $gte: thisWeek } } },
            {
              $group: {
                _id: { $dayOfWeek: '$createdAt' },
                count: { $sum: 1 },
                criticalCount: { $sum: { $cond: [{ $eq: ['$severity', 'critical'] }, 1, 0] } }
              }
            }
          ],
          lastWeek: [
            { 
              $match: { 
                createdAt: { 
                  $gte: lastWeek, 
                  $lt: thisWeek 
                } 
              } 
            },
            {
              $group: {
                _id: { $dayOfWeek: '$createdAt' },
                count: { $sum: 1 }
              }
            }
          ]
        }
      }
    ]);

    const thisWeekTotal = results[0].thisWeek.reduce((sum, day) => sum + day.count, 0);
    const lastWeekTotal = results[0].lastWeek.reduce((sum, day) => sum + day.count, 0);
    
    return {
      thisWeek: thisWeekTotal,
      lastWeek: lastWeekTotal,
      weeklyChange: lastWeekTotal > 0 ? 
        Math.round(((thisWeekTotal - lastWeekTotal) / lastWeekTotal) * 100) : 0,
      dailyBreakdown: results[0].thisWeek
    };
  }

  /**
   * Get severity breakdown metrics
   */
  async getSeverityMetrics(baseQuery) {
    const results = await Incident.aggregate([
      { $match: baseQuery },
      {
        $group: {
          _id: '$severity',
          count: { $sum: 1 },
          avgResponseTime: { $avg: '$responseTime' },
          avgVerificationScore: { $avg: '$verificationScore' }
        }
      },
      { $sort: { count: -1 } }
    ]);

    return results.reduce((acc, item) => {
      acc[item._id] = {
        count: item.count,
        avgResponseTime: Math.round(item.avgResponseTime || 0),
        avgVerificationScore: Math.round(item.avgVerificationScore || 0)
      };
      return acc;
    }, {});
  }

  /**
   * Get incident type breakdown metrics
   */
  async getTypeMetrics(baseQuery) {
    const results = await Incident.aggregate([
      { $match: baseQuery },
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 },
          avgSeverity: { $avg: { 
            $switch: {
              branches: [
                { case: { $eq: ['$severity', 'low'] }, then: 1 },
                { case: { $eq: ['$severity', 'medium'] }, then: 2 },
                { case: { $eq: ['$severity', 'high'] }, then: 3 },
                { case: { $eq: ['$severity', 'critical'] }, then: 4 }
              ],
              default: 1
            }
          }},
          totalViews: { $sum: '$analytics.views' }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    return results.map(item => ({
      type: item._id,
      count: item.count,
      avgSeverity: Math.round(item.avgSeverity * 10) / 10,
      totalViews: item.totalViews
    }));
  }

  /**
   * Get response time metrics
   */
  async getResponseMetrics(baseQuery) {
    const results = await Incident.aggregate([
      { 
        $match: { 
          ...baseQuery, 
          responseTime: { $exists: true, $ne: null },
          verifiedBy: { $exists: true }
        } 
      },
      {
        $group: {
          _id: null,
          avgResponseTime: { $avg: '$responseTime' },
          minResponseTime: { $min: '$responseTime' },
          maxResponseTime: { $max: '$responseTime' },
          totalVerified: { $sum: 1 }
        }
      }
    ]);

    const data = results[0] || {};
    return {
      avgResponseTime: Math.round(data.avgResponseTime || 0),
      minResponseTime: data.minResponseTime || 0,
      maxResponseTime: data.maxResponseTime || 0,
      totalVerified: data.totalVerified || 0
    };
  }

  /**
   * Get engagement metrics
   */
  async getEngagementMetrics(baseQuery) {
    const results = await Incident.aggregate([
      { $match: baseQuery },
      {
        $group: {
          _id: null,
          totalViews: { $sum: '$analytics.views' },
          totalEngagements: { $sum: '$analytics.engagements' },
          totalVotes: { $sum: { $size: '$communityVotes' } },
          avgViewsPerIncident: { $avg: '$analytics.views' },
          incidentsWithImages: { 
            $sum: { 
              $cond: [
                { $gt: [{ $size: { $ifNull: ['$images', []] } }, 0] }, 
                1, 
                0
              ] 
            } 
          }
        }
      }
    ]);

    const data = results[0] || {};
    return {
      totalViews: data.totalViews || 0,
      totalEngagements: data.totalEngagements || 0,
      totalVotes: data.totalVotes || 0,
      avgViewsPerIncident: Math.round(data.avgViewsPerIncident || 0),
      incidentsWithImages: data.incidentsWithImages || 0,
      engagementRate: data.totalViews > 0 ? 
        Math.round((data.totalEngagements / data.totalViews) * 100) : 0
    };
  }

  /**
   * Get location-based metrics
   */
  async getLocationMetrics(baseQuery) {
    if (!baseQuery.location) {
      return null;
    }

    const results = await Incident.aggregate([
      { $match: baseQuery },
      {
        $group: {
          _id: null,
          nearbyCount: { $sum: 1 },
          avgDistance: { $avg: '$distance' },
          mostCommonType: { $push: '$type' },
          riskScore: { 
            $avg: { 
              $multiply: [
                '$priority', 
                { 
                  $switch: {
                    branches: [
                      { case: { $eq: ['$severity', 'low'] }, then: 1 },
                      { case: { $eq: ['$severity', 'medium'] }, then: 2 },
                      { case: { $eq: ['$severity', 'high'] }, then: 3 },
                      { case: { $eq: ['$severity', 'critical'] }, then: 4 }
                    ],
                    default: 1
                  }
                }
              ] 
            }
          }
        }
      }
    ]);

    const data = results[0] || {};
    return {
      nearbyCount: data.nearbyCount || 0,
      riskScore: Math.round((data.riskScore || 0) * 10) / 10,
      radius: 10 // km
    };
  }

  /**
   * Get alert metrics
   */
  async getAlertMetrics(baseQuery) {
    const now = new Date();
    const last24h = new Date(now - 24 * 60 * 60 * 1000);

    try {
      const [typeResults, priorityResults, deliveryResults] = await Promise.all([
        // By type
        Alert.aggregate([
          { $match: { isActive: true, createdAt: { $gte: last24h } } },
          {
            $group: {
              _id: '$type',
              count: { $sum: 1 },
              latest: { $max: '$createdAt' }
            }
          }
        ]),

        // By priority
        Alert.aggregate([
          { $match: { isActive: true, createdAt: { $gte: last24h } } },
          {
            $group: {
              _id: '$priority',
              count: { $sum: 1 },
              latest: { $max: '$createdAt' }
            }
          }
        ]),

        // Delivery metrics (simulated)
        Alert.aggregate([
          { $match: { isActive: true, createdAt: { $gte: last24h } } },
          {
            $group: {
              _id: null,
              total: { $sum: 1 },
              delivered: { $sum: { $cond: [{ $ne: ['$deliveredAt', null] }, 1, 0] } },
              avgResponseTime: { $avg: '$responseTime' }
            }
          }
        ])
      ]);

      const total = typeResults.reduce((sum, item) => sum + item.count, 0);
      const deliveryData = deliveryResults[0] || { total: 0, delivered: 0, avgResponseTime: 0 };
      const deliveryRate = deliveryData.total > 0 ? (deliveryData.delivered / deliveryData.total) * 100 : 0;

      return {
        total,
        byType: typeResults.reduce((acc, item) => {
          acc[item._id] = {
            count: item.count,
            latest: item.latest
          };
          return acc;
        }, {}),
        byPriority: priorityResults.reduce((acc, item) => {
          acc[item._id] = {
            count: item.count,
            latest: item.latest
          };
          return acc;
        }, {}),
        deliveryRate: Math.round(deliveryRate),
        responseTime: Math.round(deliveryData.avgResponseTime || 0),
        timeRange: '24h'
      };
    } catch (error) {
      logger.warn('Alert metrics unavailable:', error.message);
      return {
        total: 0,
        byType: {},
        byPriority: {},
        deliveryRate: 0,
        responseTime: 0,
        timeRange: '24h'
      };
    }
  }

  /**
   * Get real-time incident feed
   */
  async getRealtimeIncidentFeed(limit = 10, location = null) {
    let query = { isActive: true };
    
    if (location) {
      query.location = {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [location.lng, location.lat]
          },
          $maxDistance: 5000 // 5km radius
        }
      };
    }

    const incidents = await Incident.find(query)
      .populate('reportedBy', 'firstName lastName')
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    return incidents.map(incident => ({
      id: incident._id,
      title: incident.title,
      type: incident.type,
      severity: incident.severity,
      status: incident.status,
      location: incident.location,
      reportedBy: incident.reportedBy,
      createdAt: incident.createdAt,
      timeAgo: this.getTimeAgo(incident.createdAt),
      impactScore: this.calculateSimpleImpactScore(incident)
    }));
  }

  /**
   * Start background metrics updater
   */
  startMetricsUpdater() {
    // Don't start in test environment to prevent Jest hanging
    if (process.env.NODE_ENV === 'test') {
      return;
    }

    this.updateIntervalId = setInterval(async () => {
      try {
        // Clear expired cache entries
        for (const [key, value] of this.metricsCache.entries()) {
          if (Date.now() - value.timestamp > this.cacheExpiry) {
            this.metricsCache.delete(key);
          }
        }

        // Broadcast metrics update to connected clients
        if (global.io) {
          const globalMetrics = await this.getDashboardMetrics('admin');
          global.io.emit('metrics:update', globalMetrics);
        }
      } catch (error) {
        logger.error('Metrics updater error:', error);
      }
    }, this.updateInterval);
  }

  /**
   * Stop background metrics updater
   */
  stopMetricsUpdater() {
    if (this.updateIntervalId) {
      clearInterval(this.updateIntervalId);
      this.updateIntervalId = null;
    }
  }

  /**
   * Helper methods
   */
  getTimeAgo(date) {
    const now = new Date();
    const diffInMinutes = Math.floor((now - new Date(date)) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d ago`;
  }

  calculateSimpleImpactScore(incident) {
    const severityWeight = {
      'low': 1, 'medium': 2, 'high': 3, 'critical': 4
    };
    const typeWeight = {
      'theft': 2, 'assault': 4, 'vandalism': 1, 'traffic_accident': 3,
      'suspicious_activity': 1, 'fire': 4, 'medical_emergency': 4,
      'natural_disaster': 5, 'road_hazard': 2, 'other': 1
    };
    
    return (severityWeight[incident.severity] || 1) * (typeWeight[incident.type] || 1);
  }

  /**
   * Clear metrics cache (for testing or manual refresh)
   */
  clearCache() {
    this.metricsCache.clear();
    logger.info('Metrics cache cleared');
  }

  /**
   * Get system performance metrics
   */
  async getSystemMetrics() {
    try {
      const memUsage = process.memoryUsage();
      const uptime = process.uptime();
      
      return {
        memory: {
          used: Math.round(memUsage.heapUsed / 1024 / 1024), // MB
          total: Math.round(memUsage.heapTotal / 1024 / 1024), // MB
          external: Math.round(memUsage.external / 1024 / 1024), // MB
          rss: Math.round(memUsage.rss / 1024 / 1024) // MB
        },
        cpu: {
          usage: process.cpuUsage(),
          loadAverage: process.platform !== 'win32' ? require('os').loadavg() : [0, 0, 0]
        },
        uptime: Math.round(uptime), // seconds
        database: {
          connected: true, // Assume connected if we can query
          responseTime: await this.getDatabaseResponseTime()
        },
        nodeVersion: process.version,
        platform: process.platform,
        arch: process.arch
      };
    } catch (error) {
      logger.error('System metrics error:', error);
      return {
        memory: { used: 0, total: 0, external: 0, rss: 0 },
        cpu: { usage: {}, loadAverage: [0, 0, 0] },
        uptime: 0,
        database: { connected: false, responseTime: 0 },
        nodeVersion: process.version,
        platform: process.platform,
        arch: process.arch
      };
    }
  }

  /**
   * Get database metrics
   */
  async getDatabaseMetrics() {
    try {
      const [userStats, incidentStats, alertStats, collectionStats] = await Promise.all([
        User.aggregate([
          { $group: { _id: null, total: { $sum: 1 }, verified: { $sum: { $cond: ['$isVerified', 1, 0] } } } }
        ]),
        Incident.aggregate([
          { $group: { _id: null, total: { $sum: 1 }, active: { $sum: { $cond: ['$isActive', 1, 0] } } } }
        ]),
        Alert.aggregate([
          { $group: { _id: null, total: { $sum: 1 }, active: { $sum: { $cond: ['$isActive', 1, 0] } } } }
        ]),
        this.getCollectionStats()
      ]);

      return {
        users: {
          total: userStats[0]?.total || 0,
          verified: userStats[0]?.verified || 0,
          unverified: (userStats[0]?.total || 0) - (userStats[0]?.verified || 0)
        },
        incidents: {
          total: incidentStats[0]?.total || 0,
          active: incidentStats[0]?.active || 0,
          resolved: (incidentStats[0]?.total || 0) - (incidentStats[0]?.active || 0)
        },
        alerts: {
          total: alertStats[0]?.total || 0,
          active: alertStats[0]?.active || 0,
          expired: (alertStats[0]?.total || 0) - (alertStats[0]?.active || 0)
        },
        collections: collectionStats
      };
    } catch (error) {
      logger.error('Database metrics error:', error);
      return {
        users: { total: 0, verified: 0, unverified: 0 },
        incidents: { total: 0, active: 0, resolved: 0 },
        alerts: { total: 0, active: 0, expired: 0 },
        collections: []
      };
    }
  }

  /**
   * Get API usage metrics
   */
  async getApiMetrics() {
    try {
      // This would typically come from a request logging system
      // For now, return mock data based on available information
      const now = new Date();
      const last24h = new Date(now - 24 * 60 * 60 * 1000);
      
      const [incidentCount, alertCount, userCount] = await Promise.all([
        Incident.countDocuments({ createdAt: { $gte: last24h } }),
        Alert.countDocuments({ createdAt: { $gte: last24h } }),
        User.countDocuments({ createdAt: { $gte: last24h } })
      ]);

      const totalRequests = incidentCount + alertCount + userCount * 2; // Estimate

      return {
        totalRequests,
        averageResponseTime: 150, // ms - estimated
        errorRate: 0.02, // 2% - estimated
        endpoints: {
          '/api/incidents': { requests: incidentCount, avgResponseTime: 200 },
          '/api/alerts': { requests: alertCount, avgResponseTime: 180 },
          '/api/auth': { requests: userCount * 2, avgResponseTime: 120 }
        },
        timeRange: '24h',
        lastUpdated: now
      };
    } catch (error) {
      logger.error('API metrics error:', error);
      return {
        totalRequests: 0,
        averageResponseTime: 0,
        errorRate: 0,
        endpoints: {},
        timeRange: '24h',
        lastUpdated: new Date()
      };
    }
  }

  /**
   * Get user activity metrics
   */
  async getUserActivityMetrics() {
    try {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const last7d = new Date(now - 7 * 24 * 60 * 60 * 1000);
      const last30d = new Date(now - 30 * 24 * 60 * 60 * 1000);

      const [activeUsers, newRegistrations, usersByRole, verificationStats] = await Promise.all([
        // Active users (users who created incidents/alerts in last 7 days)
        User.aggregate([
          {
            $lookup: {
              from: 'incidents',
              localField: '_id',
              foreignField: 'reportedBy',
              as: 'incidents'
            }
          },
          {
            $lookup: {
              from: 'alerts',
              localField: '_id',
              foreignField: 'createdBy',
              as: 'alerts'
            }
          },
          {
            $match: {
              $or: [
                { 'incidents.createdAt': { $gte: last7d } },
                { 'alerts.createdAt': { $gte: last7d } }
              ]
            }
          },
          { $count: 'count' }
        ]),

        // New registrations
        User.aggregate([
          {
            $facet: {
              today: [{ $match: { createdAt: { $gte: today } } }, { $count: 'count' }],
              last7d: [{ $match: { createdAt: { $gte: last7d } } }, { $count: 'count' }],
              last30d: [{ $match: { createdAt: { $gte: last30d } } }, { $count: 'count' }]
            }
          }
        ]),

        // Users by role
        User.aggregate([
          { $group: { _id: '$role', count: { $sum: 1 } } }
        ]),

        // Verification rate
        User.aggregate([
          {
            $group: {
              _id: null,
              total: { $sum: 1 },
              verified: { $sum: { $cond: ['$isVerified', 1, 0] } }
            }
          }
        ])
      ]);

      const verificationData = verificationStats[0] || { total: 0, verified: 0 };
      const verificationRate = verificationData.total > 0 ? 
        Math.round((verificationData.verified / verificationData.total) * 100) : 0;

      return {
        activeUsers: {
          today: activeUsers[0]?.count || 0,
          last7d: activeUsers[0]?.count || 0,
          last30d: activeUsers[0]?.count || 0
        },
        newRegistrations: {
          today: newRegistrations[0]?.today[0]?.count || 0,
          last7d: newRegistrations[0]?.last7d[0]?.count || 0,
          last30d: newRegistrations[0]?.last30d[0]?.count || 0
        },
        usersByRole: usersByRole.reduce((acc, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {}),
        verificationRate,
        totalUsers: verificationData.total
      };
    } catch (error) {
      logger.error('User activity metrics error:', error);
      return {
        activeUsers: { today: 0, last7d: 0, last30d: 0 },
        newRegistrations: { today: 0, last7d: 0, last30d: 0 },
        usersByRole: {},
        verificationRate: 0,
        totalUsers: 0
      };
    }
  }

  /**
   * Get incident-specific metrics
   */
  async getIncidentMetrics() {
    try {
      const [totalStats, typeStats, severityStats, statusStats, resolutionStats] = await Promise.all([
        // Total incidents
        Incident.aggregate([
          { $group: { _id: null, total: { $sum: 1 }, active: { $sum: { $cond: ['$isActive', 1, 0] } } } }
        ]),

        // By type
        Incident.aggregate([
          { $group: { _id: '$type', count: { $sum: 1 } } },
          { $sort: { count: -1 } }
        ]),

        // By severity
        Incident.aggregate([
          { $group: { _id: '$severity', count: { $sum: 1 } } },
          { $sort: { count: -1 } }
        ]),

        // By status
        Incident.aggregate([
          { $group: { _id: '$status', count: { $sum: 1 } } },
          { $sort: { count: -1 } }
        ]),

        // Average resolution time
        Incident.aggregate([
          { $match: { status: 'resolved', responseTime: { $exists: true, $ne: null } } },
          { $group: { _id: null, avgResolutionTime: { $avg: '$responseTime' } } }
        ])
      ]);

      const totalData = totalStats[0] || { total: 0, active: 0 };
      const avgResolutionTime = resolutionStats[0]?.avgResolutionTime || 0;

      return {
        total: totalData.total,
        active: totalData.active,
        resolved: totalData.total - totalData.active,
        byType: typeStats.reduce((acc, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {}),
        bySeverity: severityStats.reduce((acc, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {}),
        byStatus: statusStats.reduce((acc, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {}),
        averageResolutionTime: Math.round(avgResolutionTime)
      };
    } catch (error) {
      logger.error('Incident metrics error:', error);
      return {
        total: 0,
        active: 0,
        resolved: 0,
        byType: {},
        bySeverity: {},
        byStatus: {},
        averageResolutionTime: 0
      };
    }
  }

  /**
   * Get performance metrics with time series data
   */
  async getPerformanceMetrics(timeframe = '24h') {
    try {
      const now = new Date();
      let startDate;
      
      switch (timeframe) {
        case '1h':
          startDate = new Date(now - 60 * 60 * 1000);
          break;
        case '24h':
          startDate = new Date(now - 24 * 60 * 60 * 1000);
          break;
        case '7d':
          startDate = new Date(now - 7 * 24 * 60 * 60 * 1000);
          break;
        case '30d':
          startDate = new Date(now - 30 * 24 * 60 * 60 * 1000);
          break;
        default:
          startDate = new Date(now - 24 * 60 * 60 * 1000);
      }

      // Get incident creation data for time series
      const timeSeriesData = await Incident.aggregate([
        { $match: { createdAt: { $gte: startDate } } },
        {
          $group: {
            _id: {
              $dateToString: {
                format: timeframe === '1h' ? '%Y-%m-%d %H:00' : '%Y-%m-%d',
                date: '$createdAt'
              }
            },
            count: { $sum: 1 },
            avgResponseTime: { $avg: '$responseTime' }
          }
        },
        { $sort: { _id: 1 } }
      ]);

      // Calculate overall metrics
      const totalIncidents = timeSeriesData.reduce((sum, item) => sum + item.count, 0);
      const avgResponseTime = timeSeriesData.length > 0 ? 
        timeSeriesData.reduce((sum, item) => sum + (item.avgResponseTime || 0), 0) / timeSeriesData.length : 0;

      return {
        timeframe,
        responseTime: {
          average: Math.round(avgResponseTime),
          min: Math.min(...timeSeriesData.map(item => item.avgResponseTime || 0)),
          max: Math.max(...timeSeriesData.map(item => item.avgResponseTime || 0))
        },
        throughput: {
          total: totalIncidents,
          average: Math.round(totalIncidents / (timeSeriesData.length || 1))
        },
        errorRate: 0.02, // 2% - estimated
        dataPoints: timeSeriesData.map(item => ({
          timestamp: item._id,
          incidents: item.count,
          avgResponseTime: Math.round(item.avgResponseTime || 0)
        }))
      };
    } catch (error) {
      logger.error('Performance metrics error:', error);
      return {
        timeframe,
        responseTime: { average: 0, min: 0, max: 0 },
        throughput: { total: 0, average: 0 },
        errorRate: 0,
        dataPoints: []
      };
    }
  }

  /**
   * Helper method to get database response time
   */
  async getDatabaseResponseTime() {
    try {
      const start = Date.now();
      await User.findOne().limit(1);
      return Date.now() - start;
    } catch (error) {
      return 0;
    }
  }

  /**
   * Helper method to get collection statistics
   */
  async getCollectionStats() {
    try {
      // This would typically use db.stats() but for simplicity return basic info
      return [
        { name: 'users', count: await User.countDocuments() },
        { name: 'incidents', count: await Incident.countDocuments() },
        { name: 'alerts', count: await Alert.countDocuments() }
      ];
    } catch (error) {
      logger.error('Collection stats error:', error);
      return [];
    }
  }
}

// Export singleton instance
module.exports = new MetricsService();
