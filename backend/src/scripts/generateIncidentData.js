const mongoose = require('mongoose');
const Incident = require('../models/Incident');
const User = require('../models/User');
require('dotenv').config();

// City coordinates with province mappings (coords given as [lng, lat] for GeoJSON)
const cityInfo = {
  Johannesburg: { coords: [28.0473, -26.2041], province: 'Gauteng' },
  Sandton: { coords: [28.0567, -26.1076], province: 'Gauteng' },
  Pretoria: { coords: [28.2293, -25.7479], province: 'Gauteng' },
  'Cape Town': { coords: [18.4241, -33.9249], province: 'Western Cape' },
  Durban: { coords: [31.0218, -29.8587], province: 'KwaZulu-Natal' },
  'Port Elizabeth': { coords: [25.6, -33.9581], province: 'Eastern Cape' },
  Bloemfontein: { coords: [26.2299, -29.0852], province: 'Free State' },
  Polokwane: { coords: [29.4583, -23.9045], province: 'Limpopo' }
};

// Incident templates
const incidentTemplates = [
  ['Cybersecurity', 'Unauthorized Access Attempt', 'Multiple failed login attempts detected.'],
  ['Cybersecurity', 'Malware Detected', 'Suspicious executable identified on secure server.'],
  ['Cybersecurity', 'Phishing Attempt', 'User reported a phishing email impersonating IT support.'],
  ['Physical Security', 'Unauthorized Entry', 'Access granted with a stolen badge.'],
  ['Physical Security', 'Suspicious Vehicle', 'Vehicle parked near restricted zone without clearance.'],
  ['Network', 'DDoS Attack', 'High volume of traffic disrupting services.'],
  ['Network', 'Service Outage', 'Unexpected downtime on core network service.'],
  ['Operational', 'Power Failure', 'Unplanned power outage affecting operations.'],
  ['Operational', 'Fire Alarm', 'Smoke detected in office building, fire alarm triggered.'],
  ['Operational', 'Equipment Theft', 'Critical equipment reported missing from facility.']
];

const severities = ['low', 'medium', 'high', 'critical'];
const statusesSource = ['Open', 'Investigating', 'Resolved', 'Closed'];
const cities = Object.keys(cityInfo);

function randomDate() {
  const startDate = new Date('2025-07-15T00:00:00Z');
  const randomDays = Math.floor(Math.random() * 61); // 0..60
  const randomHours = Math.floor(Math.random() * 24);
  const randomMinutes = Math.floor(Math.random() * 60);
  const result = new Date(startDate);
  result.setUTCDate(startDate.getUTCDate() + randomDays);
  result.setUTCHours(randomHours, randomMinutes, 0, 0);
  return result;
}

function mapStatus(src) {
  const map = {
    Open: 'reported',
    Investigating: 'investigating',
    Resolved: 'resolved',
    Closed: 'resolved'
  };
  return map[src] || 'reported';
}

function mapCategoryToType(category) {
  const map = {
    Operational: 'other',
    Cybersecurity: 'suspicious_activity',
    Network: 'other',
    'Physical Security': 'suspicious_activity'
  };
  return map[category] || 'other';
}

async function generateAndSeed() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);

    const demoUser = await User.findOne({ role: 'citizen' });
    if (!demoUser) {
      console.log('No demo user found. Please run createDemoUsers.js first.');
      process.exit(1);
    }

    const incidents = [];
    for (let i = 0; i < 30; i += 1) {
      const [category, title, description] = incidentTemplates[Math.floor(Math.random() * incidentTemplates.length)];
      const city = cities[Math.floor(Math.random() * cities.length)];
      const severity = severities[Math.floor(Math.random() * severities.length)];
      const statusSrc = statusesSource[Math.floor(Math.random() * statusesSource.length)];

      const geo = cityInfo[city];
      const incident = {
        incidentId: `INC-2025-${String(i + 1).padStart(4, '0')}`,
        title,
        description,
        type: mapCategoryToType(category),
        severity,
        status: mapStatus(statusSrc),
        location: {
          type: 'Point',
          coordinates: [geo.coords[0], geo.coords[1]],
          address: {
            street: 'Generated Address',
            city,
            state: geo.province,
            zipCode: '0000',
            country: 'South Africa'
          }
        },
        reportedBy: demoUser._id,
        createdAt: randomDate()
      };

      incidents.push(incident);
    }

    await Incident.deleteMany({});
    const inserted = await Incident.insertMany(incidents);
    console.log(`Seeded ${inserted.length} incidents.`);
    process.exit(0);
  } catch (err) {
    console.error('Error generating incidents:', err);
    process.exit(1);
  }
}

if (require.main === module) {
  generateAndSeed();
}
