const mongoose = require('mongoose');

const incidentSchema = new mongoose.Schema({
  incidentId: {
    type: String,
    required: false,
    trim: true
  },
  title: {
    type: String,
    required: [true, 'Incident title is required'],
    trim: true,
    minlength: [3, 'Title must be at least 3 characters'],
    maxlength: [100, 'Title cannot exceed 100 characters'],
    validate: {
      validator: function(v) {
        // Ensure title contains meaningful content (not just spaces or special chars)
        return /^[a-zA-Z0-9\s\-_.,!?'"()]+$/.test(v) && v.trim().length >= 3;
      },
      message: 'Title must contain meaningful text with alphanumeric characters'
    }
  },
  description: {
    type: String,
    required: [true, 'Incident description is required'],
    trim: true,
    minlength: [10, 'Description must be at least 10 characters'],
    maxlength: [2000, 'Description cannot exceed 2000 characters'],
    validate: {
      validator: function(v) {
        // Ensure description has meaningful content
        return v && v.trim().length >= 10;
      },
      message: 'Description must contain meaningful information'
    }
  },
  type: {
    type: String,
    required: [true, 'Incident type is required'],
    enum: [
      'theft', 'assault', 'vandalism', 'traffic_accident',
      'suspicious_activity', 'fire', 'medical_emergency',
      'natural_disaster', 'road_hazard', 'other'
    ]
  },
  category: {
    type: String,
    enum: ['Cybersecurity', 'Physical Security', 'Network', 'Operational'],
    required: false
  },
  severity: {
    type: String,
    required: [true, 'Incident severity is required'],
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium'
  },
  status: {
    type: String,
    enum: ['reported', 'verified', 'investigating', 'resolved', 'false_alarm', 'open', 'closed'],
    default: 'reported'
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number],
      required: [true, 'Location coordinates are required'],
      validate: {
        validator: function(coords) {
          return coords.length === 2 &&
                 coords[0] >= -180 && coords[0] <= 180 &&
                 coords[1] >= -90 && coords[1] <= 90;
        },
        message: 'Invalid coordinates format'
      }
    },
    address: {
      street: String,
      city: String,
      state: String,
      zipCode: String,
      country: {
        type: String,
        default: 'USA'
      }
    },
    properties: {
      country: String,
      province: String,
      city: String
    }
  },
  reportedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Reporter information is required']
  },
  reportedByEmail: {
    type: String,
    trim: true
  },
  verifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  verificationDate: Date,
  images: [{
    url: String,
    caption: String,
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  witnesses: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    contactInfo: String,
    statement: String
  }],
  policeReportNumber: String,
  estimatedTime: Date,
  tags: [{
    type: String,
    trim: true
  }],
  tag: {
    type: String,
    trim: true
  },
  isPublic: {
    type: Boolean,
    default: true
  },
  verificationScore: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  communityVotes: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    vote: {
      type: String,
      enum: ['confirm', 'deny', 'unclear']
    },
    votedAt: {
      type: Date,
      default: Date.now
    }
  }],
  resolutionNotes: String,
  resolvedAt: Date,
  isActive: {
    type: Boolean,
    default: true
  },
  // Enhanced fields for analytics
  priority: {
    type: Number,
    default: 1,
    min: 1,
    max: 5
  },
  responseTime: {
    type: Number, // Time in minutes from report to first response
    default: null
  },
  impactRadius: {
    type: Number, // Estimated impact radius in meters
    default: 500
  },
  relatedIncidents: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Incident'
  }],
  analytics: {
    views: {
      type: Number,
      default: 0
    },
    engagements: {
      type: Number,
      default: 0
    },
    shares: {
      type: Number,
      default: 0
    },
    lastViewedAt: Date,
    heatmapContribution: {
      type: Number,
      default: 1
    }
  },
  verification: {
    autoVerified: {
      type: Boolean,
      default: false
    },
    trustScore: {
      type: Number,
      default: 50,
      min: 0,
      max: 100
    },
    sources: [{
      type: {
        type: String,
        enum: ['user_report', 'official_report', 'news_media', 'social_media', 'cctv', 'witness'],
        default: 'user_report'
      },
      confidence: {
        type: Number,
        min: 0,
        max: 100,
        default: 50
      },
      timestamp: {
        type: Date,
        default: Date.now
      }
    }]
  },
  metadata: {
    deviceInfo: {
      type: String
    },
    reportMethod: {
      type: String,
      enum: ['mobile_app', 'web_app', 'api', 'admin_panel'],
      default: 'web_app'
    },
    dataQuality: {
      type: Number,
      default: 100,
      min: 0,
      max: 100
    }
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
incidentSchema.index({ location: '2dsphere' });
incidentSchema.index({ reportedBy: 1 });
incidentSchema.index({ type: 1, severity: 1 });
incidentSchema.index({ status: 1 });
incidentSchema.index({ category: 1 });
incidentSchema.index({ tag: 1 });
incidentSchema.index({ createdAt: -1 });
incidentSchema.index({ 'communityVotes.user': 1 });

// Virtual for calculating verification percentage
incidentSchema.virtual('verificationPercentage').get(function() {
  const totalVotes = this.communityVotes ? this.communityVotes.length : 0;
  if (totalVotes === 0) {return 0;}

  const confirmVotes = this.communityVotes.filter(vote => vote.vote === 'confirm').length;
  return Math.round((confirmVotes / totalVotes) * 100);
});

// Virtual for total votes count
incidentSchema.virtual('totalVotes').get(function() {
  return this.communityVotes ? this.communityVotes.length : 0;
});

// Method to add community vote
incidentSchema.methods.addVote = function(userId, vote) {
  // Initialize communityVotes if not exists
  if (!this.communityVotes) {
    this.communityVotes = [];
  }
  
  // Remove existing vote from this user
  this.communityVotes = this.communityVotes.filter(
    voteObj => !voteObj.user.equals(userId)
  );

  // Add new vote
  this.communityVotes.push({
    user: userId,
    vote: vote
  });

  // Update verification score
  this.verificationScore = this.verificationPercentage;

  return this.save();
};

// Method to check if user has voted
incidentSchema.methods.hasUserVoted = function(userId) {
  return this.communityVotes ? this.communityVotes.some(vote => vote.user.equals(userId)) : false;
};

// Method to increment view count
incidentSchema.methods.incrementViews = function() {
  if (!this.analytics) {
    this.analytics = { views: 0, engagements: 0, shares: 0, heatmapContribution: 1 };
  }
  this.analytics.views += 1;
  this.analytics.lastViewedAt = new Date();
  return this.save();
};

// Method to increment engagement
incidentSchema.methods.incrementEngagement = function() {
  if (!this.analytics) {
    this.analytics = { views: 0, engagements: 0, shares: 0, heatmapContribution: 1 };
  }
  this.analytics.engagements += 1;
  return this.save();
};

// Method to calculate impact score
incidentSchema.methods.calculateImpactScore = function() {
  const severityWeight = {
    'low': 1,
    'medium': 2,
    'high': 3,
    'critical': 4
  };
  
  const typeWeight = {
    'theft': 2,
    'assault': 4,
    'vandalism': 1,
    'traffic_accident': 3,
    'suspicious_activity': 1,
    'fire': 4,
    'medical_emergency': 4,
    'natural_disaster': 5,
    'road_hazard': 2,
    'other': 1
  };
  
  const baseScore = (severityWeight[this.severity] || 1) * (typeWeight[this.type] || 1);
  const verificationBonus = this.verificationScore > 70 ? 1.2 : 1;
  const communityBonus = (this.communityVotes && this.communityVotes.length > 5) ? 1.1 : 1;
  
  return Math.round(baseScore * verificationBonus * communityBonus);
};

// Method to check if incident is stale
incidentSchema.methods.isStale = function() {
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  return this.createdAt < oneDayAgo && this.status === 'reported';
};

// Static method to get analytics summary
incidentSchema.statics.getAnalyticsSummary = async function(filters = {}) {
  const pipeline = [
    { $match: { isActive: true, ...filters } },
    {
      $group: {
        _id: null,
        totalIncidents: { $sum: 1 },
        totalViews: { $sum: '$analytics.views' },
        totalEngagements: { $sum: '$analytics.engagements' },
        avgVerificationScore: { $avg: '$verificationScore' },
        avgResponseTime: { $avg: '$responseTime' },
        severityBreakdown: {
          $push: {
            severity: '$severity',
            type: '$type',
            views: '$analytics.views'
          }
        }
      }
    }
  ];
  
  return this.aggregate(pipeline);
};

// Pre-save middleware to update verification score
incidentSchema.pre('save', function(next) {
  if (this.isModified('communityVotes')) {
    this.verificationScore = this.verificationPercentage;
  }
  next();
});

// Ensure virtual fields are serialized
incidentSchema.set('toJSON', {
  virtuals: true
});

module.exports = mongoose.model('Incident', incidentSchema);
