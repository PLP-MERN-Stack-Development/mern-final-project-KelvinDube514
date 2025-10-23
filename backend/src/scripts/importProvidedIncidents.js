const mongoose = require('mongoose');
const Incident = require('../models/Incident');
const User = require('../models/User');
require('dotenv').config();

// Map external status/category to schema enums
const mapStatus = (status) => {
  const statusMap = {
    Open: 'open',
    Investigating: 'investigating',
    Resolved: 'resolved',
    Closed: 'closed'
  };
  return statusMap[status] || 'reported';
};

const mapCategoryToType = (category) => {
  const categoryMap = {
    Operational: 'other',
    Cybersecurity: 'suspicious_activity',
    Network: 'other',
    'Physical Security': 'suspicious_activity'
  };
  return categoryMap[category] || 'other';
};

// Provided incidents (trimmed to required fields and mapped later)
const providedIncidents = [
  {
    incidentId: 'INC-2025-0031',
    title: 'Malware Detected',
    description: 'Suspicious executable identified on secure server.',
    category: 'Cybersecurity',
    severity: 'High',
    status: 'Investigating',
    location: {
      type: 'Point',
      coordinates: [28.2293, -25.7479],
      properties: { country: 'South Africa', province: 'Gauteng', city: 'Pretoria' }
    },
    reportedBy: 'manager@securepath.com',
    createdAt: '2025-08-10T14:32:00Z',
    tag: 'salutation'
  },
  {
    incidentId: 'INC-2025-0032',
    title: 'Unauthorized Entry',
    description: 'Access granted with a stolen badge.',
    category: 'Physical Security',
    severity: 'Critical',
    status: 'Open',
    location: {
      type: 'Point',
      coordinates: [18.4241, -33.9249],
      properties: { country: 'South Africa', province: 'Western Cape', city: 'Cape Town' }
    },
    reportedBy: 'auditor@securepath.com',
    createdAt: '2025-08-03T09:15:00Z',
    tag: 'salutation'
  },
  {
    incidentId: 'INC-2025-0033',
    title: 'Service Outage',
    description: 'Unexpected downtime on core network service.',
    category: 'Network',
    severity: 'Medium',
    status: 'Resolved',
    location: {
      type: 'Point',
      coordinates: [31.0218, -29.8587],
      properties: { country: 'South Africa', province: 'KwaZulu-Natal', city: 'Durban' }
    },
    reportedBy: 'operator@securepath.com',
    createdAt: '2025-09-05T11:48:00Z',
    tag: 'salutation'
  },
  {
    incidentId: 'INC-2025-0034',
    title: 'Phishing Attempt',
    description: 'User reported a phishing email impersonating IT support.',
    category: 'Cybersecurity',
    severity: 'Low',
    status: 'Closed',
    location: {
      type: 'Point',
      coordinates: [28.0473, -26.2041],
      properties: { country: 'South Africa', province: 'Gauteng', city: 'Johannesburg' }
    },
    reportedBy: 'analyst@securepath.com',
    createdAt: '2025-08-28T18:02:00Z',
    tag: 'salutation'
  },
  {
    incidentId: 'INC-2025-0035',
    title: 'Suspicious Vehicle',
    description: 'Vehicle parked near restricted zone without clearance.',
    category: 'Physical Security',
    severity: 'Medium',
    status: 'Investigating',
    location: {
      type: 'Point',
      coordinates: [26.2299, -29.0852],
      properties: { country: 'South Africa', province: 'Free State', city: 'Bloemfontein' }
    },
    reportedBy: 'admin@securepath.com',
    createdAt: '2025-07-25T07:43:00Z',
    tag: 'salutation'
  },
  {
    incidentId: 'INC-2025-0036',
    title: 'Power Failure',
    description: 'Unplanned power outage affecting operations.',
    category: 'Operational',
    severity: 'High',
    status: 'Resolved',
    location: {
      type: 'Point',
      coordinates: [29.4583, -23.9045],
      properties: { country: 'South Africa', province: 'Limpopo', city: 'Polokwane' }
    },
    reportedBy: 'operator@securepath.com',
    createdAt: '2025-08-14T03:20:00Z',
    tag: 'salutation'
  },
  {
    incidentId: 'INC-2025-0037',
    title: 'Fire Alarm',
    description: 'Smoke detected in office building, fire alarm triggered.',
    category: 'Operational',
    severity: 'Critical',
    status: 'Open',
    location: {
      type: 'Point',
      coordinates: [18.4241, -33.9249],
      properties: { country: 'South Africa', province: 'Western Cape', city: 'Cape Town' }
    },
    reportedBy: 'manager@securepath.com',
    createdAt: '2025-09-01T21:15:00Z',
    tag: 'salutation'
  },
  {
    incidentId: 'INC-2025-0038',
    title: 'Equipment Theft',
    description: 'Critical equipment reported missing from facility.',
    category: 'Operational',
    severity: 'Medium',
    status: 'Investigating',
    location: {
      type: 'Point',
      coordinates: [28.0567, -26.1076],
      properties: { country: 'South Africa', province: 'Gauteng', city: 'Sandton' }
    },
    reportedBy: 'auditor@securepath.com',
    createdAt: '2025-07-22T12:00:00Z',
    tag: 'salutation'
  },
  {
    incidentId: 'INC-2025-0039',
    title: 'DDoS Attack',
    description: 'High volume of traffic disrupting services.',
    category: 'Network',
    severity: 'Critical',
    status: 'Investigating',
    location: {
      type: 'Point',
      coordinates: [25.6, -33.9581],
      properties: { country: 'South Africa', province: 'Eastern Cape', city: 'Port Elizabeth' }
    },
    reportedBy: 'admin@securepath.com',
    createdAt: '2025-08-19T16:30:00Z',
    tag: 'salutation'
  },
  {
    incidentId: 'INC-2025-0040',
    title: 'Unauthorized Access Attempt',
    description: 'Multiple failed login attempts detected.',
    category: 'Cybersecurity',
    severity: 'High',
    status: 'Open',
    location: {
      type: 'Point',
      coordinates: [28.2293, -25.7479],
      properties: { country: 'South Africa', province: 'Gauteng', city: 'Pretoria' }
    },
    reportedBy: 'analyst@securepath.com',
    createdAt: '2025-08-06T06:12:00Z',
    tag: 'salutation'
  },
  {
    incidentId: 'INC-2025-0041',
    title: 'Unauthorized Entry',
    description: 'Access granted with a cloned ID badge.',
    category: 'Physical Security',
    severity: 'Medium',
    status: 'Closed',
    location: {
      type: 'Point',
      coordinates: [28.0473, -26.2041],
      properties: { country: 'South Africa', province: 'Gauteng', city: 'Johannesburg' }
    },
    reportedBy: 'manager@securepath.com',
    createdAt: '2025-09-08T08:40:00Z',
    tag: 'salutation'
  },
  {
    incidentId: 'INC-2025-0042',
    title: 'Malware Detected',
    description: 'Ransomware attempt blocked on firewall.',
    category: 'Cybersecurity',
    severity: 'Critical',
    status: 'Open',
    location: {
      type: 'Point',
      coordinates: [31.0218, -29.8587],
      properties: { country: 'South Africa', province: 'KwaZulu-Natal', city: 'Durban' }
    },
    reportedBy: 'admin@securepath.com',
    createdAt: '2025-07-30T17:22:00Z',
    tag: 'salutation'
  },
  {
    incidentId: 'INC-2025-0043',
    title: 'Phishing Attempt',
    description: 'Mass email campaign targeting employees.',
    category: 'Cybersecurity',
    severity: 'Medium',
    status: 'Investigating',
    location: {
      type: 'Point',
      coordinates: [26.2299, -29.0852],
      properties: { country: 'South Africa', province: 'Free State', city: 'Bloemfontein' }
    },
    reportedBy: 'analyst@securepath.com',
    createdAt: '2025-09-02T10:05:00Z',
    tag: 'salutation'
  },
  {
    incidentId: 'INC-2025-0044',
    title: 'Suspicious Vehicle',
    description: 'Unmarked van parked near server facility.',
    category: 'Physical Security',
    severity: 'Low',
    status: 'Open',
    location: {
      type: 'Point',
      coordinates: [29.4583, -23.9045],
      properties: { country: 'South Africa', province: 'Limpopo', city: 'Polokwane' }
    },
    reportedBy: 'operator@securepath.com',
    createdAt: '2025-08-12T20:48:00Z',
    tag: 'salutation'
  },
  {
    incidentId: 'INC-2025-0045',
    title: 'Power Failure',
    description: 'Temporary outage due to grid instability.',
    category: 'Operational',
    severity: 'High',
    status: 'Resolved',
    location: {
      type: 'Point',
      coordinates: [18.4241, -33.9249],
      properties: { country: 'South Africa', province: 'Western Cape', city: 'Cape Town' }
    },
    reportedBy: 'auditor@securepath.com',
    createdAt: '2025-08-18T13:55:00Z',
    tag: 'salutation'
  },
  {
    incidentId: 'INC-2025-0046',
    title: 'Equipment Theft',
    description: 'Laptop stolen from restricted office zone.',
    category: 'Operational',
    severity: 'Medium',
    status: 'Investigating',
    location: {
      type: 'Point',
      coordinates: [28.0567, -26.1076],
      properties: { country: 'South Africa', province: 'Gauteng', city: 'Sandton' }
    },
    reportedBy: 'manager@securepath.com',
    createdAt: '2025-08-09T15:33:00Z',
    tag: 'salutation'
  },
  {
    incidentId: 'INC-2025-0047',
    title: 'Fire Alarm',
    description: 'Triggered by overheated equipment in server room.',
    category: 'Operational',
    severity: 'Critical',
    status: 'Investigating',
    location: {
      type: 'Point',
      coordinates: [25.6, -33.9581],
      properties: { country: 'South Africa', province: 'Eastern Cape', city: 'Port Elizabeth' }
    },
    reportedBy: 'analyst@securepath.com',
    createdAt: '2025-07-27T04:17:00Z',
    tag: 'salutation'
  },
  {
    incidentId: 'INC-2025-0048',
    title: 'Unauthorized Access Attempt',
    description: 'Brute force attack on VPN credentials detected.',
    category: 'Cybersecurity',
    severity: 'High',
    status: 'Open',
    location: {
      type: 'Point',
      coordinates: [28.2293, -25.7479],
      properties: { country: 'South Africa', province: 'Gauteng', city: 'Pretoria' }
    },
    reportedBy: 'admin@securepath.com',
    createdAt: '2025-09-04T02:12:00Z',
    tag: 'salutation'
  },
  {
    incidentId: 'INC-2025-0049',
    title: 'DDoS Attack',
    description: 'Sustained flood of requests against public API.',
    category: 'Network',
    severity: 'Critical',
    status: 'Investigating',
    location: {
      type: 'Point',
      coordinates: [28.0473, -26.2041],
      properties: { country: 'South Africa', province: 'Gauteng', city: 'Johannesburg' }
    },
    reportedBy: 'operator@securepath.com',
    createdAt: '2025-08-21T19:29:00Z',
    tag: 'salutation'
  },
  {
    incidentId: 'INC-2025-0050',
    title: 'Unauthorized Entry',
    description: 'Guard reported forced entry at facility perimeter.',
    category: 'Physical Security',
    severity: 'High',
    status: 'Open',
    location: {
      type: 'Point',
      coordinates: [31.0218, -29.8587],
      properties: { country: 'South Africa', province: 'KwaZulu-Natal', city: 'Durban' }
    },
    reportedBy: 'auditor@securepath.com',
    createdAt: '2025-08-15T23:10:00Z',
    tag: 'salutation'
  }
];

async function importIncidents() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);

    // Build a map of reporter email -> user id (fallback to a demo citizen)
    const distinctEmails = Array.from(new Set(providedIncidents.map(i => i.reportedBy).filter(Boolean)));

    // Try to fetch all by email
    const users = await User.find({ email: { $in: distinctEmails } }).select('_id email role');
    const emailToUserId = new Map(users.map(u => [u.email, u._id]));

    const demoCitizen = await User.findOne({ role: 'citizen' }).select('_id');
    if (!demoCitizen) {
      console.log('No demo citizen found. Consider running createDemoUsers.js');
      // Proceed without exiting; we will fail only if we cannot assign any reporter
    }

    // Normalize and map incidents to schema
    const docs = providedIncidents.map(src => {
      const addressProps = src.location && src.location.properties ? src.location.properties : {};
      const reporterId = emailToUserId.get(src.reportedBy) || (demoCitizen ? demoCitizen._id : null);

      return {
        incidentId: src.incidentId,
        title: src.title,
        description: src.description,
        type: mapCategoryToType(src.category),
        category: src.category,
        severity: String(src.severity || 'medium').toLowerCase(),
        status: mapStatus(src.status),
        location: {
          type: 'Point',
          coordinates: Array.isArray(src.location && src.location.coordinates) ? [
            Number(src.location.coordinates[0]),
            Number(src.location.coordinates[1])
          ] : undefined,
          address: {
            street: undefined,
            city: addressProps.city,
            state: addressProps.province,
            zipCode: undefined,
            country: addressProps.country || 'South Africa'
          },
          properties: {
            country: addressProps.country || 'South Africa',
            province: addressProps.province,
            city: addressProps.city
          }
        },
        reportedBy: reporterId,
        reportedByEmail: src.reportedBy,
        tag: src.tag || 'salutation',
        createdAt: src.createdAt ? new Date(src.createdAt) : new Date()
      };
    }).filter(doc => doc.reportedBy && doc.location && doc.location.coordinates);

    if (docs.length === 0) {
      console.log('No incidents prepared for insertion (missing reporter or coordinates).');
      process.exit(1);
    }

    // Insert without deleting existing
    const inserted = await Incident.insertMany(docs, { ordered: false });
    console.log(`Inserted ${inserted.length} incidents.`);

    process.exit(0);
  } catch (err) {
    console.error('Error importing provided incidents:', err);
    process.exit(1);
  }
}

if (require.main === module) {
  importIncidents();
}

module.exports = importIncidents;
