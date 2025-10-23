const Incident = require('../models/Incident');
const User = require('../models/User');
const Alert = require('../models/Alert');
const logger = require('../config/logger');

/**
 * Advanced Analytics Service for MongoDB data aggregation
 * Provides comprehensive analytics and reporting capabilities
 */
class AnalyticsService {
  /**
   * Get comprehensive incident analytics
   * @param {Object} options - Analytics options
   * @returns {Object} Analytics data
   */
  static async getIncidentAnalytics(options = {}) {
    const { 
      timeRange = '30d', 
      location = null, 
      radius = 5000, 
      includeResolved = true 
    } = options;

    try {
      const dateFilter = this.getDateFilter(timeRange);
      const baseFilter = { isActive: true, ...dateFilter };
      
      // Add location filter if provided
      if (location && location.coordinates) {
        // Use $geoWithin for aggregation pipelines instead of $near
        const center = location.coordinates;
        const radiusInDegrees = radius / 111000; // Approximate conversion from meters to degrees
        
        baseFilter.location = {
          $geoWithin: {
            $centerSphere: [center, radiusInDegrees]
          }
        };
      }

      if (!includeResolved) {
        baseFilter.status = { $ne: 'resolved' };
      }

      // Parallel aggregation queries for performance
      const [
        incidentStats,
        timeSeriesData,
        geographicData,
        severityTrends,
        responseMetrics,
        engagementStats,
        hotspots
      ] = await Promise.all([
        this.getIncidentStats(baseFilter),
        this.getTimeSeriesData(baseFilter, timeRange),
        this.getGeographicDistribution(baseFilter),
        this.getSeverityTrends(baseFilter),
        this.getResponseMetrics(baseFilter),
        this.getEngagementStats(baseFilter),
        this.getIncidentHotspots(baseFilter)
      ]);

      return {
        timeRange,
        generatedAt: new Date(),
        stats: incidentStats,
        timeSeries: timeSeriesData,
        geographic: geographicData,
        trends: severityTrends,
        performance: responseMetrics,
        engagement: engagementStats,
        hotspots
      };
    } catch (error) {
      logger.error('Analytics service error:', error);
      throw new Error('Failed to generate analytics data');
    }
  }

  /**
   * Get basic incident statistics
   */
  static async getIncidentStats(filter) {
    return await Incident.aggregate([
      { $match: filter },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          byType: {
            $push: {
              k: '$type',
              v: 1
            }
          },
          bySeverity: {
            $push: {
              k: '$severity',
              v: 1
            }
          },
          byStatus: {
            $push: {
              k: '$status',
              v: 1
            }
          },
          avgVerificationScore: { $avg: '$verificationScore' },
          totalViews: { $sum: '$analytics.views' },
          totalEngagements: { $sum: '$analytics.engagements' }
        }
      },
      {
        $project: {
          total: 1,
          typeBreakdown: { $arrayToObject: '$byType' },
          severityBreakdown: { $arrayToObject: '$bySeverity' },
          statusBreakdown: { $arrayToObject: '$byStatus' },
          avgVerificationScore: { $round: ['$avgVerificationScore', 2] },
          totalViews: 1,
          totalEngagements: 1
        }
      }
    ]);
  }

  /**
   * Get time series data for trends
   */
  static async getTimeSeriesData(filter, timeRange) {
    const groupFormat = this.getTimeGroupFormat(timeRange);
    
    return await Incident.aggregate([
      { $match: filter },
      {
        $group: {
          _id: {
            $dateToString: {
              format: groupFormat,
              date: '$createdAt'
            }
          },
          count: { $sum: 1 },
          critical: { $sum: { $cond: [{ $eq: ['$severity', 'critical'] }, 1, 0] } },
          high: { $sum: { $cond: [{ $eq: ['$severity', 'high'] }, 1, 0] } },
          resolved: { $sum: { $cond: [{ $eq: ['$status', 'resolved'] }, 1, 0] } },
          avgResponseTime: { $avg: '$responseTime' },
          totalViews: { $sum: '$analytics.views' }
        }
      },
      { $sort: { _id: 1 } }
    ]);
  }

  /**
   * Get geographic distribution of incidents
   */
  static async getGeographicDistribution(filter) {
    return await Incident.aggregate([
      { $match: filter },
      {
        $group: {
          _id: {
            // Group by approximate location (grid-based)
            lat: { $round: [{ $arrayElemAt: ['$location.coordinates', 1] }, 2] },
            lng: { $round: [{ $arrayElemAt: ['$location.coordinates', 0] }, 2] }
          },
          count: { $sum: 1 },
          severity: { $push: '$severity' },
          types: { $push: '$type' },
          avgImpactScore: { $avg: { $multiply: ['$priority', '$analytics.heatmapContribution'] } }
        }
      },
      {
        $project: {
          location: {
            type: 'Point',
            coordinates: ['$_id.lng', '$_id.lat']
          },
          count: 1,
          criticalCount: {
            $size: {
              $filter: {
                input: '$severity',
                cond: { $eq: ['$$this', 'critical'] }
              }
            }
          },
          mostCommonType: {
            $arrayElemAt: [
              {
                $map: {
                  input: { $setUnion: '$types' },
                  as: 'type',
                  in: {
                    type: '$$type',
                    count: {
                      $size: {
                        $filter: {
                          input: '$types',
                          cond: { $eq: ['$$this', '$$type'] }
                        }
                      }
                    }
                  }
                }
              },
              0
            ]
          },
          avgImpactScore: { $round: ['$avgImpactScore', 2] }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 100 }
    ]);
  }

  /**
   * Get severity trends over time
   */
  static async getSeverityTrends(filter) {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    
    return await Incident.aggregate([
      { $match: filter },
      {
        $facet: {
          last24h: [
            { $match: { createdAt: { $gte: oneDayAgo } } },
            {
              $group: {
                _id: '$severity',
                count: { $sum: 1 }
              }
            }
          ],
          last7d: [
            { $match: { createdAt: { $gte: oneWeekAgo } } },
            {
              $group: {
                _id: '$severity',
                count: { $sum: 1 }
              }
            }
          ],
          overall: [
            {
              $group: {
                _id: '$severity',
                count: { $sum: 1 }
              }
            }
          ]
        }
      }
    ]);
  }

  /**
   * Get response time metrics
   */
  static async getResponseMetrics(filter) {
    return await Incident.aggregate([
      { 
        $match: { 
          ...filter, 
          responseTime: { $exists: true, $ne: null },
          verifiedBy: { $exists: true }
        } 
      },
      {
        $group: {
          _id: null,
          avgResponseTime: { $avg: '$responseTime' },
          medianResponseTime: { $median: '$responseTime' },
          minResponseTime: { $min: '$responseTime' },
          maxResponseTime: { $max: '$responseTime' },
          responseTimeByType: {
            $push: {
              type: '$type',
              responseTime: '$responseTime'
            }
          }
        }
      },
      {
        $project: {
          avgResponseTime: { $round: ['$avgResponseTime', 2] },
          medianResponseTime: 1,
          minResponseTime: 1,
          maxResponseTime: 1,
          responseTimeByType: 1
        }
      }
    ]);
  }

  /**
   * Get user engagement statistics
   */
  static async getEngagementStats(filter) {
    return await Incident.aggregate([
      { $match: filter },
      {
        $group: {
          _id: null,
          totalViews: { $sum: '$analytics.views' },
          totalEngagements: { $sum: '$analytics.engagements' },
          totalVotes: { $sum: { $size: '$communityVotes' } },
          avgViewsPerIncident: { $avg: '$analytics.views' },
          avgEngagementsPerIncident: { $avg: '$analytics.engagements' },
          mostViewedIncident: { $max: '$analytics.views' },
          engagementRate: {
            $avg: {
              $cond: [
                { $eq: ['$analytics.views', 0] },
                0,
                { $divide: ['$analytics.engagements', '$analytics.views'] }
              ]
            }
          }
        }
      },
      {
        $project: {
          totalViews: 1,
          totalEngagements: 1,
          totalVotes: 1,
          avgViewsPerIncident: { $round: ['$avgViewsPerIncident', 2] },
          avgEngagementsPerIncident: { $round: ['$avgEngagementsPerIncident', 2] },
          mostViewedIncident: 1,
          engagementRate: { $round: [{ $multiply: ['$engagementRate', 100] }, 2] }
        }
      }
    ]);
  }

  /**
   * Get incident hotspots using geospatial clustering
   */
  static async getIncidentHotspots(filter, maxDistance = 1000) {
    return await Incident.aggregate([
      { $match: filter },
      {
        $geoNear: {
          near: { type: 'Point', coordinates: [28.0473, -26.2041] }, // Johannesburg center
          distanceField: 'distance',
          maxDistance: 50000, // 50km radius
          spherical: true
        }
      },
      {
        $group: {
          _id: {
            // Create grid cells for clustering
            lat: { $round: [{ $divide: [{ $arrayElemAt: ['$location.coordinates', 1] }, 0.01] }] },
            lng: { $round: [{ $divide: [{ $arrayElemAt: ['$location.coordinates', 0] }, 0.01] }] }
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
          }
        }
      },
      {
        $match: { count: { $gte: 3 } } // Only clusters with 3+ incidents
      },
      {
        $project: {
          centerPoint: {
            type: 'Point',
            coordinates: [
              { $multiply: ['$_id.lng', 0.01] },
              { $multiply: ['$_id.lat', 0.01] }
            ]
          },
          incidentCount: '$count',
          severityScore: 1,
          riskLevel: {
            $switch: {
              branches: [
                { case: { $gte: ['$severityScore', 12] }, then: 'critical' },
                { case: { $gte: ['$severityScore', 8] }, then: 'high' },
                { case: { $gte: ['$severityScore', 4] }, then: 'medium' }
              ],
              default: 'low'
            }
          },
          recentIncidents: {
            $filter: {
              input: '$incidents',
              cond: {
                $gte: [
                  '$$this.createdAt',
                  { $subtract: [new Date(), 7 * 24 * 60 * 60 * 1000] }
                ]
              }
            }
          }
        }
      },
      { $sort: { severityScore: -1, incidentCount: -1 } },
      { $limit: 20 }
    ]);
  }

  /**
   * Generate comprehensive report
   */
  static async generateReport(options = {}) {
    const { format = 'json', includeRawData = false } = options;
    
    try {
      const analytics = await this.getIncidentAnalytics(options);
      
      const report = {
        metadata: {
          generatedAt: new Date(),
          format,
          timeRange: options.timeRange || '30d',
          version: '1.0'
        },
        executive_summary: {
          total_incidents: analytics.stats[0]?.total || 0,
          critical_incidents: analytics.stats[0]?.severityBreakdown?.critical || 0,
          resolution_rate: this.calculateResolutionRate(analytics.stats[0]),
          avg_response_time: analytics.performance[0]?.avgResponseTime || 0,
          engagement_rate: analytics.engagement[0]?.engagementRate || 0
        },
        detailed_analytics: analytics,
        recommendations: this.generateRecommendations(analytics)
      };

      if (includeRawData) {
        report.raw_data = await this.getRawData(options);
      }

      return report;
    } catch (error) {
      logger.error('Report generation error:', error);
      throw new Error('Failed to generate report');
    }
  }

  /**
   * Helper methods
   */
  static getDateFilter(timeRange) {
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
  }

  static getTimeGroupFormat(timeRange) {
    switch (timeRange) {
      case '24h':
        return '%Y-%m-%d %H:00';
      case '7d':
        return '%Y-%m-%d';
      case '30d':
        return '%Y-%m-%d';
      case '90d':
        return '%Y-%m-%d';
      case '1y':
        return '%Y-%m';
      default:
        return '%Y-%m-%d';
    }
  }

  static calculateResolutionRate(stats) {
    if (!stats || !stats.statusBreakdown) return 0;
    const total = stats.total || 0;
    const resolved = stats.statusBreakdown.resolved || 0;
    return total > 0 ? Math.round((resolved / total) * 100) : 0;
  }

  static generateRecommendations(analytics) {
    const recommendations = [];
    
    // Handle different analytics object structures
    const stats = analytics.stats?.[0] || analytics.stats || {};
    const performance = analytics.performance?.[0] || analytics.performance || {};
    
    // High critical incidents
    if (stats.severityBreakdown?.critical > (stats.total || 0) * 0.1) {
      recommendations.push({
        type: 'alert',
        priority: 'high',
        message: 'High number of critical incidents detected. Consider increasing patrol frequency.',
        action: 'Deploy additional resources to high-risk areas'
      });
    }
    
    // Low verification scores
    if (stats.avgVerificationScore < 60) {
      recommendations.push({
        type: 'improvement',
        priority: 'medium',
        message: 'Low average verification score indicates potential data quality issues.',
        action: 'Implement additional verification processes'
      });
    }
    
    // Poor response times
    if (performance.avgResponseTime > 120) {
      recommendations.push({
        type: 'performance',
        priority: 'high',
        message: 'Average response time exceeds 2 hours. Consider process optimization.',
        action: 'Review and streamline incident response workflow'
      });
    }
    
    return recommendations;
  }

  static async getRawData(options) {
    const filter = { isActive: true, ...this.getDateFilter(options.timeRange || '30d') };
    return await Incident.find(filter)
      .populate('reportedBy', 'firstName lastName email')
      .populate('verifiedBy', 'firstName lastName email role')
      .limit(1000)
      .sort({ createdAt: -1 });
  }

  /**
   * Calculate safety score for a location
   */
  static async calculateSafetyScore(lat, lng, radiusKm = 5) {
    try {
      if (!lat || !lng || radiusKm <= 0) {
        return 50; // Default neutral score for invalid inputs
      }

      // Validate coordinate bounds
      if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
        return 50; // Default neutral score for out-of-bounds coordinates
      }

      const radiusMeters = radiusKm * 1000;
      
      // Find incidents within radius
      const radiusInDegrees = radiusMeters / 111000; // Approximate conversion from meters to degrees
      const incidents = await Incident.find({
        isActive: true,
        location: {
          $geoWithin: {
            $centerSphere: [[lng, lat], radiusInDegrees]
          }
        }
      });

      if (incidents.length === 0) {
        return 85; // High safety score for no incidents
      }

      // Calculate weighted score based on incident severity and recency
      let totalWeight = 0;
      let weightedScore = 0;

      const now = new Date();
      const oneWeekAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);
      const oneMonthAgo = new Date(now - 30 * 24 * 60 * 60 * 1000);

      incidents.forEach(incident => {
        let severityWeight = 1;
        switch (incident.severity) {
          case 'critical': severityWeight = 4; break;
          case 'high': severityWeight = 3; break;
          case 'medium': severityWeight = 2; break;
          case 'low': severityWeight = 1; break;
        }

        let recencyWeight = 1;
        if (incident.createdAt > oneWeekAgo) {
          recencyWeight = 3; // Recent incidents have higher impact
        } else if (incident.createdAt > oneMonthAgo) {
          recencyWeight = 2;
        }

        const weight = severityWeight * recencyWeight;
        totalWeight += weight;
        weightedScore += weight * (100 - (severityWeight * 20)); // Higher severity = lower score
      });

      const averageScore = totalWeight > 0 ? weightedScore / totalWeight : 50;
      return Math.max(0, Math.min(100, Math.round(averageScore)));
    } catch (error) {
      logger.error('Safety score calculation error:', error);
      return 50; // Default neutral score on error
    }
  }

  /**
   * Get incident trends data
   */
  static async getIncidentTrends(options = {}) {
    const {
      startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      endDate = new Date(),
      location = null,
      radius = 10000
    } = options;

    try {
      let baseFilter = {
        isActive: true,
        createdAt: { $gte: startDate, $lte: endDate }
      };

      // Add location filter if provided
      if (location && location.length === 2) {
        // Use $geoWithin for aggregation pipelines instead of $near
        const center = location;
        const radiusInDegrees = radius / 111000; // Approximate conversion from meters to degrees
        
        baseFilter.location = {
          $geoWithin: {
            $centerSphere: [center, radiusInDegrees]
          }
        };
      }

      const [dailyTrends, typeTrends, severityTrends] = await Promise.all([
        // Daily trends
        Incident.aggregate([
          { $match: baseFilter },
          {
            $group: {
              _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
              count: { $sum: 1 },
              critical: { $sum: { $cond: [{ $eq: ['$severity', 'critical'] }, 1, 0] } },
              high: { $sum: { $cond: [{ $eq: ['$severity', 'high'] }, 1, 0] } }
            }
          },
          { $sort: { _id: 1 } }
        ]),

        // Type trends
        Incident.aggregate([
          { $match: baseFilter },
          {
            $group: {
              _id: '$type',
              count: { $sum: 1 }
            }
          },
          { $sort: { count: -1 } }
        ]),

        // Severity trends
        Incident.aggregate([
          { $match: baseFilter },
          {
            $group: {
              _id: '$severity',
              count: { $sum: 1 }
            }
          },
          { $sort: { count: -1 } }
        ])
      ]);

      const totalIncidents = dailyTrends.reduce((sum, day) => sum + day.count, 0);

      return {
        totalIncidents,
        dailyTrends,
        typeTrends,
        severityTrends,
        timeRange: {
          startDate,
          endDate
        }
      };
    } catch (error) {
      logger.error('Incident trends error:', error);
      throw new Error('Failed to get incident trends');
    }
  }

  /**
   * Generate comprehensive safety report
   */
  static async generateSafetyReport(options = {}) {
    const {
      location = null,
      radius = 10000,
      timeframe = '30d'
    } = options;

    try {
      const dateFilter = this.getDateFilter(timeframe);
      let baseFilter = { isActive: true, ...dateFilter };

      // Add location filter if provided
      if (location && location.length === 2) {
        // Use $geoWithin for aggregation pipelines instead of $near
        const center = location;
        const radiusInDegrees = radius / 111000; // Approximate conversion from meters to degrees
        
        baseFilter.location = {
          $geoWithin: {
            $centerSphere: [center, radiusInDegrees]
          }
        };
      }

      const [safetyScore, incidentSummary, alertSummary, trends] = await Promise.all([
        this.calculateSafetyScore(location ? location[1] : 0, location ? location[0] : 0, radius / 1000),
        this.getIncidentStats(baseFilter),
        this.getAlertSummary(baseFilter),
        this.getIncidentTrends({ startDate: dateFilter.createdAt.$gte, endDate: new Date(), location, radius })
      ]);

      const recommendations = this.generateRecommendations({ stats: incidentSummary, performance: [] });

      return {
        safetyScore,
        incidentSummary: {
          total: incidentSummary[0]?.total || 0,
          byType: incidentSummary[0]?.typeBreakdown || {},
          bySeverity: incidentSummary[0]?.severityBreakdown || {},
          byStatus: incidentSummary[0]?.statusBreakdown || {}
        },
        alertSummary,
        trends: {
          totalIncidents: trends.totalIncidents,
          dailyTrends: trends.dailyTrends,
          typeTrends: trends.typeTrends
        },
        recommendations,
        generatedAt: new Date(),
        location: location ? { coordinates: location, radius } : null,
        timeframe
      };
    } catch (error) {
      logger.error('Safety report generation error:', error);
      throw new Error('Failed to generate safety report');
    }
  }

  /**
   * Get alert summary for safety report
   */
  static async getAlertSummary(filter) {
    try {
      const alerts = await Alert.aggregate([
        { $match: { isActive: true, ...filter } },
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            byType: {
              $push: {
                k: '$type',
                v: 1
              }
            },
            byPriority: {
              $push: {
                k: '$priority',
                v: 1
              }
            }
          }
        },
        {
          $project: {
            total: 1,
            byType: { $arrayToObject: '$byType' },
            byPriority: { $arrayToObject: '$byPriority' }
          }
        }
      ]);

      return alerts[0] || { total: 0, byType: {}, byPriority: {} };
    } catch (error) {
      logger.error('Alert summary error:', error);
      return { total: 0, byType: {}, byPriority: {} };
    }
  }
}

module.exports = AnalyticsService;
