const mongoose = require('mongoose');

const locationSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Location name is required'],
    trim: true,
    maxlength: [100, 'Location name cannot exceed 100 characters']
  },
  type: {
    type: String,
    required: [true, 'Location type is required'],
    enum: [
      'residential', 'commercial', 'park', 'school', 'hospital',
      'police_station', 'fire_station', 'transit_station',
      'entertainment', 'restaurant', 'other'
    ]
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
    }
  },
  address: {
    street: {
      type: String,
      required: [true, 'Street address is required'],
      trim: true
    },
    city: {
      type: String,
      required: [true, 'City is required'],
      trim: true
    },
    state: {
      type: String,
      required: [true, 'State is required'],
      trim: true
    },
    zipCode: {
      type: String,
      required: [true, 'ZIP code is required'],
      trim: true
    },
    country: {
      type: String,
      default: 'South Africa',
      trim: true
    }
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  safetyRating: {
    type: Number,
    min: 1,
    max: 5,
    default: 3
  },
  safetyFactors: [{
    factor: {
      type: String,
      enum: [
        'lighting', 'visibility', 'traffic', 'pedestrian_access',
        'emergency_services', 'surveillance', 'population_density',
        'historical_incidents', 'time_of_day', 'day_of_week'
      ]
    },
    rating: {
      type: Number,
      min: 1,
      max: 5
    },
    description: String,
    updatedAt: {
      type: Date,
      default: Date.now
    }
  }],
  operatingHours: {
    open: String,
    close: String,
    days: [{
      type: String,
      enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
    }]
  },
  contactInfo: {
    phone: String,
    email: String,
    website: String
  },
  amenities: [{
    type: String,
    enum: [
      'parking', 'public_transport', 'lighting', 'security_cameras',
      'emergency_call_box', 'restrooms', 'accessibility', 'wifi'
    ]
  }],
  incidentHistory: [{
    incident: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Incident'
    },
    severity: String,
    date: Date,
    resolved: {
      type: Boolean,
      default: false
    }
  }],
  isVerified: {
    type: Boolean,
    default: false
  },
  verifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  verificationDate: Date,
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
locationSchema.index({ location: '2dsphere' });
locationSchema.index({ type: 1 });
locationSchema.index({ 'address.city': 1, 'address.state': 1 });
locationSchema.index({ safetyRating: -1 });
locationSchema.index({ isVerified: 1, isActive: 1 });

// Virtual for full address
locationSchema.virtual('fullAddress').get(function() {
  return `${this.address.street}, ${this.address.city}, ${this.address.state} ${this.address.zipCode}`;
});

// Method to update safety rating based on factors
locationSchema.methods.updateSafetyRating = function() {
  if (this.safetyFactors.length === 0) {return;}

  const totalRating = this.safetyFactors.reduce((sum, factor) => sum + factor.rating, 0);
  this.safetyRating = Math.round(totalRating / this.safetyFactors.length);

  return this.save();
};

// Method to add safety factor
locationSchema.methods.addSafetyFactor = function(factor, rating, description) {
  // Remove existing factor of same type
  this.safetyFactors = this.safetyFactors.filter(f => f.factor !== factor);

  // Add new factor
  this.safetyFactors.push({
    factor,
    rating,
    description,
    updatedAt: new Date()
  });

  // Update overall safety rating
  this.updateSafetyRating();

  return this.save();
};

// Method to add incident to history
locationSchema.methods.addIncident = function(incidentId, severity) {
  this.incidentHistory.push({
    incident: incidentId,
    severity,
    date: new Date()
  });

  return this.save();
};

// Ensure virtual fields are serialized
locationSchema.set('toJSON', {
  virtuals: true
});

module.exports = mongoose.model('Location', locationSchema);
