const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const Incident = require('../models/Incident');
const User = require('../models/User');
require('dotenv').config();

// Import incidents from the provided JSON file
async function importSecurePathIncidents() {
  try {
    console.log('Starting SecurePath incidents import...');
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Read the JSON file
    const jsonFilePath = path.join(__dirname, '../../securepath.incidents.json');
    
    if (!fs.existsSync(jsonFilePath)) {
      console.error('JSON file not found at:', jsonFilePath);
      console.log('Please ensure the securepath.incidents.json file is in the Downloads folder');
      process.exit(1);
    }

    const rawData = fs.readFileSync(jsonFilePath, 'utf8');
    const incidentsData = JSON.parse(rawData);
    
    console.log(`Found ${incidentsData.length} incidents in the JSON file`);

    // Get existing incidents to avoid duplicates
    const existingIncidentIds = await Incident.find({}, 'incidentId').lean();
    const existingIdsSet = new Set(existingIncidentIds.map(inc => inc.incidentId));
    
    console.log(`Found ${existingIdsSet.size} existing incidents in database`);

    // Get all unique user IDs from the incidents
    const uniqueUserIds = [...new Set(incidentsData.map(inc => inc.reportedBy && inc.reportedBy.$oid).filter(Boolean))];
    console.log(`Found ${uniqueUserIds.length} unique user IDs in incidents`);

    // Check which users exist in our database
    const existingUsers = await User.find({ _id: { $in: uniqueUserIds } }).select('_id email role');
    const existingUserIdsSet = new Set(existingUsers.map(user => user._id.toString()));
    
    console.log(`Found ${existingUserIdsSet.size} existing users in database`);

    // Get a demo user as fallback
    const demoUser = await User.findOne({ role: 'citizen' }).select('_id email');
    if (!demoUser) {
      console.log('No demo user found. Creating a demo user...');
      
      const newDemoUser = await User.create({
        firstName: 'Demo',
        lastName: 'User',
        email: 'demo@securepath.com',
        password: 'demo123', // Will be hashed by middleware
        role: 'citizen',
        isActive: true
      });
      
      console.log('Created demo user:', newDemoUser._id);
    }

    const fallbackUser = demoUser || await User.findOne({ role: 'citizen' });
    
    if (!fallbackUser) {
      console.error('Could not create or find a fallback user');
      process.exit(1);
    }

    // Process and filter incidents
    const incidentsToImport = [];
    let skippedCount = 0;
    let duplicateCount = 0;

    for (const incidentData of incidentsData) {
      // Skip if incident already exists
      if (existingIdsSet.has(incidentData.incidentId)) {
        duplicateCount++;
        continue;
      }

      // Skip if no reportedBy user ID
      if (!incidentData.reportedBy || !incidentData.reportedBy.$oid) {
        skippedCount++;
        continue;
      }

      // Check if user exists, use fallback if not
      const reportedByUserId = existingUserIdsSet.has(incidentData.reportedBy.$oid) 
        ? incidentData.reportedBy.$oid 
        : fallbackUser._id;

      // Transform the incident data to match our schema
      const transformedIncident = {
        incidentId: incidentData.incidentId,
        title: incidentData.title,
        description: incidentData.description,
        type: incidentData.type,
        severity: incidentData.severity,
        status: incidentData.status,
        location: {
          type: incidentData.location.type,
          coordinates: incidentData.location.coordinates,
          address: {
            street: incidentData.location.address?.street || '',
            city: incidentData.location.address?.city || '',
            state: incidentData.location.address?.state || '',
            zipCode: incidentData.location.address?.zipCode || '',
            country: incidentData.location.address?.country || 'South Africa'
          }
        },
        reportedBy: reportedByUserId,
        reportedByEmail: incidentData.reportedByEmail || null,
        tags: incidentData.tags || [],
        tag: incidentData.tag || null,
        isPublic: incidentData.isPublic !== undefined ? incidentData.isPublic : true,
        verificationScore: incidentData.verificationScore || 0,
        isActive: incidentData.isActive !== undefined ? incidentData.isActive : true,
        
        // Enhanced fields
        priority: incidentData.priority || 1,
        responseTime: incidentData.responseTime || null,
        impactRadius: incidentData.impactRadius || 500,
        relatedIncidents: incidentData.relatedIncidents || [],
        
        // Analytics
        analytics: {
          views: incidentData.analytics?.views || 0,
          engagements: incidentData.analytics?.engagements || 0,
          shares: incidentData.analytics?.shares || 0,
          heatmapContribution: incidentData.analytics?.heatmapContribution || 1,
          lastViewedAt: incidentData.analytics?.lastViewedAt || null
        },
        
        // Verification
        verification: {
          autoVerified: incidentData.verification?.autoVerified || false,
          trustScore: incidentData.verification?.trustScore || 50,
          sources: incidentData.verification?.sources || []
        },
        
        // Metadata
        metadata: {
          deviceInfo: incidentData.metadata?.deviceInfo || null,
          reportMethod: incidentData.metadata?.reportMethod || 'web_app',
          dataQuality: incidentData.metadata?.dataQuality || 100
        },
        
        // Preserve original timestamps
        createdAt: incidentData.createdAt ? new Date(incidentData.createdAt.$date) : new Date(),
        updatedAt: incidentData.updatedAt ? new Date(incidentData.updatedAt.$date) : new Date(),
        
        // Additional fields
        images: incidentData.images || [],
        witnesses: incidentData.witnesses || [],
        communityVotes: incidentData.communityVotes || []
      };

      incidentsToImport.push(transformedIncident);
    }

    console.log(`Processed incidents:`);
    console.log(`- To import: ${incidentsToImport.length}`);
    console.log(`- Duplicates skipped: ${duplicateCount}`);
    console.log(`- Skipped (no user): ${skippedCount}`);

    if (incidentsToImport.length === 0) {
      console.log('No new incidents to import');
      process.exit(0);
    }

    // Import incidents in batches to avoid memory issues
    const batchSize = 100;
    let importedCount = 0;

    for (let i = 0; i < incidentsToImport.length; i += batchSize) {
      const batch = incidentsToImport.slice(i, i + batchSize);
      
      try {
        const inserted = await Incident.insertMany(batch, { 
          ordered: false, // Continue on errors
          validateBeforeSave: true 
        });
        
        importedCount += inserted.length;
        console.log(`Imported batch ${Math.floor(i / batchSize) + 1}: ${inserted.length} incidents`);
        
      } catch (error) {
        console.error(`Error importing batch ${Math.floor(i / batchSize) + 1}:`, error.message);
        
        // Try importing individually to identify problematic records
        for (const incident of batch) {
          try {
            await Incident.create(incident);
            importedCount++;
          } catch (individualError) {
            console.error(`Failed to import incident ${incident.incidentId}:`, individualError.message);
          }
        }
      }
    }

    console.log(`\nImport completed successfully!`);
    console.log(`Total incidents imported: ${importedCount}`);
    console.log(`Total incidents in database: ${await Incident.countDocuments({ isActive: true })}`);

    // Display summary statistics
    const stats = await Incident.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          byType: { $push: '$type' },
          bySeverity: { $push: '$severity' },
          byStatus: { $push: '$status' }
        }
      }
    ]);

    if (stats.length > 0) {
      const stat = stats[0];
      console.log(`\nDatabase Statistics:`);
      console.log(`- Total incidents: ${stat.total}`);
      
      // Count by type
      const typeCounts = {};
      stat.byType.forEach(type => typeCounts[type] = (typeCounts[type] || 0) + 1);
      console.log(`- By type:`, typeCounts);
      
      // Count by severity
      const severityCounts = {};
      stat.bySeverity.forEach(severity => severityCounts[severity] = (severityCounts[severity] || 0) + 1);
      console.log(`- By severity:`, severityCounts);
      
      // Count by status
      const statusCounts = {};
      stat.byStatus.forEach(status => statusCounts[status] = (statusCounts[status] || 0) + 1);
      console.log(`- By status:`, statusCounts);
    }

    process.exit(0);

  } catch (error) {
    console.error('Error importing SecurePath incidents:', error);
    process.exit(1);
  }
}

// Run the import if this file is executed directly
if (require.main === module) {
  importSecurePathIncidents();
}

module.exports = importSecurePathIncidents;
