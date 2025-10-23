const mongoose = require('mongoose');
const Incident = require('../models/Incident');
const User = require('../models/User');
const logger = require('../config/logger');
require('dotenv').config();

// Map your incident data to the database schema
const incidentData = [
  {
    _id: new mongoose.Types.ObjectId('68cd6481e7bd13915e9a096c'),
    title: 'Fire Alarm',
    description: 'Smoke detected in office building, fire alarm triggered.',
    type: 'fire', // mapped from category "Operational"
    severity: 'critical',
    status: 'investigating', // mapped from "Investigating"
    location: {
      type: 'Point',
      coordinates: [-26.2041, 28.0473], // Johannesburg coordinates as default
      address: {
        street: '123 Business District',
        city: 'Johannesburg',
        state: 'Gauteng',
        zipCode: '2000',
        country: 'South Africa'
      }
    },
    reportedBy: null, // Will be set to a demo user
    incidentId: 'INC-2025-0001',
    createdAt: new Date('2025-09-12T19:43:00Z')
  },
  {
    _id: new mongoose.Types.ObjectId('68cd6481e7bd13915e9a096d'),
    title: 'Malware Detected',
    description: 'Suspicious executable identified on secure server.',
    type: 'suspicious_activity', // mapped from category "Cybersecurity"
    severity: 'critical',
    status: 'resolved', // mapped from "Resolved"
    location: {
      type: 'Point',
      coordinates: [-26.2041, 28.0473],
      address: {
        street: '456 Tech Hub',
        city: 'Johannesburg',
        state: 'Gauteng',
        zipCode: '2000',
        country: 'South Africa'
      }
    },
    reportedBy: null,
    incidentId: 'INC-2025-0002',
    createdAt: new Date('2025-09-10T13:57:00Z')
  },
  {
    _id: new mongoose.Types.ObjectId('68cd6481e7bd13915e9a096e'),
    title: 'Power Failure',
    description: 'Unplanned power outage affecting operations.',
    type: 'other', // mapped from category "Operational"
    severity: 'high',
    status: 'investigating',
    location: {
      type: 'Point',
      coordinates: [-26.2041, 28.0473],
      address: {
        street: '789 Industrial Area',
        city: 'Johannesburg',
        state: 'Gauteng',
        zipCode: '2000',
        country: 'South Africa'
      }
    },
    reportedBy: null,
    incidentId: 'INC-2025-0003',
    createdAt: new Date('2025-09-10T05:57:00Z')
  },
  {
    _id: new mongoose.Types.ObjectId('68cd6481e7bd13915e9a096f'),
    title: 'Fire Alarm',
    description: 'Smoke detected in office building, fire alarm triggered.',
    type: 'fire',
    severity: 'medium',
    status: 'reported', // mapped from "Open"
    location: {
      type: 'Point',
      coordinates: [-26.2041, 28.0473],
      address: {
        street: '321 Corporate Plaza',
        city: 'Johannesburg',
        state: 'Gauteng',
        zipCode: '2000',
        country: 'South Africa'
      }
    },
    reportedBy: null,
    incidentId: 'INC-2025-0004',
    createdAt: new Date('2025-08-08T20:55:00Z')
  },
  {
    _id: new mongoose.Types.ObjectId('68cd6481e7bd13915e9a0970'),
    title: 'Unauthorized Access Attempt',
    description: 'Multiple failed login attempts detected.',
    type: 'suspicious_activity',
    severity: 'medium',
    status: 'resolved',
    location: {
      type: 'Point',
      coordinates: [-26.2041, 28.0473],
      address: {
        street: '654 Security Building',
        city: 'Johannesburg',
        state: 'Gauteng',
        zipCode: '2000',
        country: 'South Africa'
      }
    },
    reportedBy: null,
    incidentId: 'INC-2025-0005',
    createdAt: new Date('2025-08-07T03:48:00Z')
  },
  {
    _id: new mongoose.Types.ObjectId('68cd6481e7bd13915e9a0971'),
    title: 'Power Failure',
    description: 'Unplanned power outage affecting operations.',
    type: 'other',
    severity: 'high',
    status: 'reported',
    location: {
      type: 'Point',
      coordinates: [-26.2041, 28.0473],
      address: {
        street: '987 Power Station',
        city: 'Johannesburg',
        state: 'Gauteng',
        zipCode: '2000',
        country: 'South Africa'
      }
    },
    reportedBy: null,
    incidentId: 'INC-2025-0006',
    createdAt: new Date('2025-09-09T19:11:00Z')
  },
  {
    _id: new mongoose.Types.ObjectId('68cd6481e7bd13915e9a0972'),
    title: 'Fire Alarm',
    description: 'Smoke detected in office building, fire alarm triggered.',
    type: 'fire',
    severity: 'high',
    status: 'investigating',
    location: {
      type: 'Point',
      coordinates: [-26.2041, 28.0473],
      address: {
        street: '147 Emergency Center',
        city: 'Johannesburg',
        state: 'Gauteng',
        zipCode: '2000',
        country: 'South Africa'
      }
    },
    reportedBy: null,
    incidentId: 'INC-2025-0007',
    createdAt: new Date('2025-09-04T07:48:00Z')
  },
  {
    _id: new mongoose.Types.ObjectId('68cd6481e7bd13915e9a0973'),
    title: 'Equipment Theft',
    description: 'Critical equipment reported missing from facility.',
    type: 'theft',
    severity: 'low',
    status: 'investigating',
    location: {
      type: 'Point',
      coordinates: [-26.2041, 28.0473],
      address: {
        street: '258 Warehouse District',
        city: 'Johannesburg',
        state: 'Gauteng',
        zipCode: '2000',
        country: 'South Africa'
      }
    },
    reportedBy: null,
    incidentId: 'INC-2025-0008',
    createdAt: new Date('2025-07-22T13:49:00Z')
  },
  {
    _id: new mongoose.Types.ObjectId('68cd6481e7bd13915e9a0974'),
    title: 'Unauthorized Access Attempt',
    description: 'Multiple failed login attempts detected.',
    type: 'suspicious_activity',
    severity: 'medium',
    status: 'resolved', // mapped from "Closed"
    location: {
      type: 'Point',
      coordinates: [-26.2041, 28.0473],
      address: {
        street: '369 Data Center',
        city: 'Johannesburg',
        state: 'Gauteng',
        zipCode: '2000',
        country: 'South Africa'
      }
    },
    reportedBy: null,
    incidentId: 'INC-2025-0009',
    createdAt: new Date('2025-08-06T18:00:00Z')
  },
  {
    _id: new mongoose.Types.ObjectId('68cd6481e7bd13915e9a0975'),
    title: 'Service Outage',
    description: 'Unexpected downtime on core network service.',
    type: 'other', // mapped from category "Network"
    severity: 'high',
    status: 'resolved',
    location: {
      type: 'Point',
      coordinates: [-26.2041, 28.0473],
      address: {
        street: '741 Network Hub',
        city: 'Johannesburg',
        state: 'Gauteng',
        zipCode: '2000',
        country: 'South Africa'
      }
    },
    reportedBy: null,
    incidentId: 'INC-2025-0010',
    createdAt: new Date('2025-08-23T08:34:00Z')
  },
  {
    _id: new mongoose.Types.ObjectId('68cd6481e7bd13915e9a0976'),
    title: 'Suspicious Vehicle',
    description: 'Vehicle parked near restricted zone without clearance.',
    type: 'suspicious_activity', // mapped from category "Physical Security"
    severity: 'high',
    status: 'reported',
    location: {
      type: 'Point',
      coordinates: [-26.2041, 28.0473],
      address: {
        street: '852 Security Checkpoint',
        city: 'Johannesburg',
        state: 'Gauteng',
        zipCode: '2000',
        country: 'South Africa'
      }
    },
    reportedBy: null,
    incidentId: 'INC-2025-0011',
    createdAt: new Date('2025-08-18T08:48:00Z')
  },
  {
    _id: new mongoose.Types.ObjectId('68cd6481e7bd13915e9a0977'),
    title: 'Power Failure',
    description: 'Unplanned power outage affecting operations.',
    type: 'other',
    severity: 'medium',
    status: 'resolved', // mapped from "Closed"
    location: {
      type: 'Point',
      coordinates: [-26.2041, 28.0473],
      address: {
        street: '963 Utility Building',
        city: 'Johannesburg',
        state: 'Gauteng',
        zipCode: '2000',
        country: 'South Africa'
      }
    },
    reportedBy: null,
    incidentId: 'INC-2025-0012',
    createdAt: new Date('2025-08-14T23:36:00Z')
  },
  {
    _id: new mongoose.Types.ObjectId('68cd6481e7bd13915e9a0978'),
    title: 'Malware Detected',
    description: 'Suspicious executable identified on secure server.',
    type: 'suspicious_activity',
    severity: 'critical',
    status: 'reported',
    location: {
      type: 'Point',
      coordinates: [-26.2041, 28.0473],
      address: {
        street: '174 Server Farm',
        city: 'Johannesburg',
        state: 'Gauteng',
        zipCode: '2000',
        country: 'South Africa'
      }
    },
    reportedBy: null,
    incidentId: 'INC-2025-0013',
    createdAt: new Date('2025-08-08T02:06:00Z')
  },
  {
    _id: new mongoose.Types.ObjectId('68cd6481e7bd13915e9a0979'),
    title: 'Service Outage',
    description: 'Unexpected downtime on core network service.',
    type: 'other',
    severity: 'medium',
    status: 'reported',
    location: {
      type: 'Point',
      coordinates: [-26.2041, 28.0473],
      address: {
        street: '285 Communication Center',
        city: 'Johannesburg',
        state: 'Gauteng',
        zipCode: '2000',
        country: 'South Africa'
      }
    },
    reportedBy: null,
    incidentId: 'INC-2025-0014',
    createdAt: new Date('2025-07-30T20:13:00Z')
  },
  {
    _id: new mongoose.Types.ObjectId('68cd6481e7bd13915e9a097a'),
    title: 'Phishing Attempt',
    description: 'User reported a phishing email impersonating IT support.',
    type: 'suspicious_activity',
    severity: 'medium',
    status: 'reported',
    location: {
      type: 'Point',
      coordinates: [-26.2041, 28.0473],
      address: {
        street: '396 IT Department',
        city: 'Johannesburg',
        state: 'Gauteng',
        zipCode: '2000',
        country: 'South Africa'
      }
    },
    reportedBy: null,
    incidentId: 'INC-2025-0015',
    createdAt: new Date('2025-08-08T18:39:00Z')
  },
  {
    _id: new mongoose.Types.ObjectId('68cd6481e7bd13915e9a097b'),
    title: 'Power Failure',
    description: 'Unplanned power outage affecting operations.',
    type: 'other',
    severity: 'high',
    status: 'resolved', // mapped from "Closed"
    location: {
      type: 'Point',
      coordinates: [-26.2041, 28.0473],
      address: {
        street: '507 Power Grid',
        city: 'Johannesburg',
        state: 'Gauteng',
        zipCode: '2000',
        country: 'South Africa'
      }
    },
    reportedBy: null,
    incidentId: 'INC-2025-0016',
    createdAt: new Date('2025-08-27T18:30:00Z')
  },
  {
    _id: new mongoose.Types.ObjectId('68cd6481e7bd13915e9a097c'),
    title: 'Phishing Attempt',
    description: 'User reported a phishing email impersonating IT support.',
    type: 'suspicious_activity',
    severity: 'low',
    status: 'reported',
    location: {
      type: 'Point',
      coordinates: [-26.2041, 28.0473],
      address: {
        street: '618 Email Server',
        city: 'Johannesburg',
        state: 'Gauteng',
        zipCode: '2000',
        country: 'South Africa'
      }
    },
    reportedBy: null,
    incidentId: 'INC-2025-0017',
    createdAt: new Date('2025-08-06T10:56:00Z')
  },
  {
    _id: new mongoose.Types.ObjectId('68cd6481e7bd13915e9a097d'),
    title: 'Equipment Theft',
    description: 'Critical equipment reported missing from facility.',
    type: 'theft',
    severity: 'high',
    status: 'reported',
    location: {
      type: 'Point',
      coordinates: [-26.2041, 28.0473],
      address: {
        street: '729 Equipment Storage',
        city: 'Johannesburg',
        state: 'Gauteng',
        zipCode: '2000',
        country: 'South Africa'
      }
    },
    reportedBy: null,
    incidentId: 'INC-2025-0018',
    createdAt: new Date('2025-09-08T12:32:00Z')
  },
  {
    _id: new mongoose.Types.ObjectId('68cd6481e7bd13915e9a097e'),
    title: 'Equipment Theft',
    description: 'Critical equipment reported missing from facility.',
    type: 'theft',
    severity: 'low',
    status: 'investigating',
    location: {
      type: 'Point',
      coordinates: [-26.2041, 28.0473],
      address: {
        street: '830 Storage Facility',
        city: 'Johannesburg',
        state: 'Gauteng',
        zipCode: '2000',
        country: 'South Africa'
      }
    },
    reportedBy: null,
    incidentId: 'INC-2025-0019',
    createdAt: new Date('2025-08-13T22:39:00Z')
  },
  {
    _id: new mongoose.Types.ObjectId('68cd6481e7bd13915e9a097f'),
    title: 'Unauthorized Entry',
    description: 'Access granted with a stolen badge.',
    type: 'suspicious_activity', // mapped from category "Physical Security"
    severity: 'high',
    status: 'resolved',
    location: {
      type: 'Point',
      coordinates: [-26.2041, 28.0473],
      address: {
        street: '941 Access Control',
        city: 'Johannesburg',
        state: 'Gauteng',
        zipCode: '2000',
        country: 'South Africa'
      }
    },
    reportedBy: null,
    incidentId: 'INC-2025-0020',
    createdAt: new Date('2025-08-21T20:18:00Z')
  }
];

// Function to map status values
const mapStatus = (status) => {
  const statusMap = {
    'Open': 'reported',
    'Investigating': 'investigating',
    'Resolved': 'resolved',
    'Closed': 'resolved'
  };
  return statusMap[status] || 'reported';
};

// Function to map category to type
const mapCategoryToType = (category) => {
  const categoryMap = {
    'Operational': 'other',
    'Cybersecurity': 'suspicious_activity',
    'Network': 'other',
    'Physical Security': 'suspicious_activity'
  };
  return categoryMap[category] || 'other';
};

const seedIncidents = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Get a demo user to assign as reporter
    const demoUser = await User.findOne({ role: 'citizen' });
    if (!demoUser) {
      console.log('No demo user found. Please run createDemoUsers.js first.');
      process.exit(1);
    }

    // Assign the demo user as reporter for all incidents
    incidentData.forEach(incident => {
      incident.reportedBy = demoUser._id;
    });

    // Clear existing incidents (optional - remove if you want to keep existing data)
    await Incident.deleteMany({});
    console.log('Cleared existing incidents');

    // Insert the new incidents
    const insertedIncidents = await Incident.insertMany(incidentData);
    console.log(`Successfully seeded ${insertedIncidents.length} incidents`);

    // Log some statistics
    const stats = await Incident.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          bySeverity: {
            $push: {
              severity: '$severity',
              status: '$status',
              type: '$type'
            }
          }
        }
      }
    ]);

    if (stats.length > 0) {
      const stat = stats[0];
      console.log(`Total incidents: ${stat.total}`);

      // Count by severity
      const severityCount = {};
      const statusCount = {};
      const typeCount = {};

      stat.bySeverity.forEach(incident => {
        severityCount[incident.severity] = (severityCount[incident.severity] || 0) + 1;
        statusCount[incident.status] = (statusCount[incident.status] || 0) + 1;
        typeCount[incident.type] = (typeCount[incident.type] || 0) + 1;
      });

      console.log('By severity:', severityCount);
      console.log('By status:', statusCount);
      console.log('By type:', typeCount);
    }

    process.exit(0);
  } catch (error) {
    console.error('Error seeding incidents:', error);
    process.exit(1);
  }
};

// Run the seed function
seedIncidents();
