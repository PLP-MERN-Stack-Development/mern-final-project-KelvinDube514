const mongoose = require('mongoose');

const alertSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Alert title is required'],
    trim: true,
    maxlength: [100, 'Title cannot exceed 100 characters']
  },
  message: {
    type: String,
    required: [true, 'Alert message is required'],
    trim: true,
    maxlength: [500, 'Message cannot exceed 500 characters']
  },
  type: {
    type: String,
    required: [true, 'Alert type is required'],
    enum: [
      'incident_alert', 'safety_warning', 'weather_alert',
      'traffic_alert', 'emergency_alert', 'system_notification'
    ]
  },
  priority: {
    type: String,
    required: [true, 'Alert priority is required'],
    enum: ['low', 'medium', 'high', 'urgent', 'critical'],
    default: 'medium'
  },
  targetAudience: {
    type: String,
    enum: ['all', 'citizens', 'authorities', 'specific_area'],
    default: 'all'
  },
  location: {
    type: {
      type: String,
      enum: ['Point', 'Polygon']
    },
    coordinates: {
      type: [Number],
      validate: {
        validator: function(coords) {
          if (this.type === 'Point') {
            return coords.length === 2 &&
                   coords[0] >= -180 && coords[0] <= 180 &&
                   coords[1] >= -90 && coords[1] <= 90;
          } else if (this.type === 'Polygon') {
            return Array.isArray(coords) && coords.length >= 3;
          }
          return true;
        },
        message: 'Invalid coordinates format'
      }
    },
    radius: {
      type: Number,
      min: 0.1,
      max: 100,
      default: 5
    },
    address: {
      street: String,
      city: String,
      state: String,
      zipCode: String,
      country: {
        type: String,
        default: 'South Africa'
      }
    }
  },
  incident: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Incident'
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Alert creator is required']
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  isApproved: {
    type: Boolean,
    default: false
  },
  isRead: {
    type: Boolean,
    default: false
  },
  approvalDate: Date,
  expiresAt: {
    type: Date,
    default: function() {
      return new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours from now
    }
  },
  deliveryStatus: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    deliveryMethod: {
      type: String,
      enum: ['push', 'email', 'sms', 'in_app']
    },
    deliveredAt: Date,
    status: {
      type: String,
      enum: ['pending', 'delivered', 'failed', 'read'],
      default: 'pending'
    }
  }],
  attachments: [{
    type: {
      type: String,
      enum: ['image', 'document', 'video']
    },
    url: String,
    filename: String,
    size: Number
  }],
  actionRequired: {
    type: Boolean,
    default: false
  },
  actionText: String,
  actionUrl: String,
  isActive: {
    type: Boolean,
    default: true
  },
  statistics: {
    totalSent: {
      type: Number,
      default: 0
    },
    totalDelivered: {
      type: Number,
      default: 0
    },
    totalRead: {
      type: Number,
      default: 0
    },
    clickThroughRate: {
      type: Number,
      default: 0
    }
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
// Use coordinates path so documents without coordinates are ignored by the index
alertSchema.index({ 'location.coordinates': '2dsphere' });
alertSchema.index({ createdBy: 1 });
alertSchema.index({ type: 1, priority: 1 });
alertSchema.index({ isActive: 1, expiresAt: 1 });
alertSchema.index({ createdAt: -1 });
alertSchema.index({ 'deliveryStatus.user': 1 });

// Virtual for delivery rate
alertSchema.virtual('deliveryRate').get(function() {
  if (this.statistics.totalSent === 0) {return 0;}
  return Math.round((this.statistics.totalDelivered / this.statistics.totalSent) * 100);
});

// Virtual for read rate
alertSchema.virtual('readRate').get(function() {
  if (this.statistics.totalDelivered === 0) {return 0;}
  return Math.round((this.statistics.totalRead / this.statistics.totalDelivered) * 100);
});

// Method to update delivery status
alertSchema.methods.updateDeliveryStatus = function(userId, method, status) {
  const deliveryIndex = this.deliveryStatus.findIndex(
    delivery => delivery.user.equals(userId) && delivery.deliveryMethod === method
  );

  if (deliveryIndex >= 0) {
    this.deliveryStatus[deliveryIndex].status = status;
    if (status === 'delivered' || status === 'read') {
      this.deliveryStatus[deliveryIndex].deliveredAt = new Date();
    }
  } else {
    this.deliveryStatus.push({
      user: userId,
      deliveryMethod: method,
      status: status,
      deliveredAt: status === 'delivered' || status === 'read' ? new Date() : null
    });
  }

  // Update statistics
  this.updateStatistics();

  return this.save();
};

// Method to update statistics
alertSchema.methods.updateStatistics = function() {
  this.statistics.totalSent = this.deliveryStatus.length;
  this.statistics.totalDelivered = this.deliveryStatus.filter(
    delivery => delivery.status === 'delivered' || delivery.status === 'read'
  ).length;
  this.statistics.totalRead = this.deliveryStatus.filter(
    delivery => delivery.status === 'read'
  ).length;

  if (this.statistics.totalDelivered > 0) {
    this.statistics.clickThroughRate = Math.round(
      (this.statistics.totalRead / this.statistics.totalDelivered) * 100
    );
  }
};

// Pre-save middleware to update statistics
alertSchema.pre('save', function(next) {
  if (this.isModified('deliveryStatus')) {
    this.updateStatistics();
  }
  next();
});

// Ensure virtual fields are serialized
alertSchema.set('toJSON', {
  virtuals: true
});

module.exports = mongoose.model('Alert', alertSchema);
