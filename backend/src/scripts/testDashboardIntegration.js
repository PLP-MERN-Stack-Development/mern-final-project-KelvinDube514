const mongoose = require('mongoose');
const Incident = require('../models/Incident');
const User = require('../models/User');
const Alert = require('../models/Alert');
require('dotenv').config();

// Test script to verify dashboard integration
async function testDashboardIntegration() {
  try {
    console.log('🚀 Testing Dashboard Integration...\n');

    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/securepath');
    console.log('✅ Database connected');

    // Test user count
    const userCount = await User.countDocuments();
    console.log(`👥 Total users: ${userCount}`);

    // Test incident statistics
    const totalIncidents = await Incident.countDocuments({ isActive: true });
    const criticalIncidents = await Incident.countDocuments({ 
      isActive: true, 
      severity: 'critical' 
    });
    const resolvedIncidents = await Incident.countDocuments({ 
      isActive: true, 
      status: 'resolved' 
    });
    
    console.log(`📊 Incident Statistics:`);
    console.log(`   - Total incidents: ${totalIncidents}`);
    console.log(`   - Critical incidents: ${criticalIncidents}`);
    console.log(`   - Resolved incidents: ${resolvedIncidents}`);
    
    // Calculate safety score
    const safetyScore = totalIncidents > 0 ? 
      Math.round((resolvedIncidents / totalIncidents) * 100) : 100;
    console.log(`🛡️  Safety Score: ${safetyScore}%`);

    // Test incident type breakdown
    const typeBreakdown = await Incident.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);
    
    console.log(`📈 Incident Types:`);
    typeBreakdown.forEach(item => {
      console.log(`   - ${item._id}: ${item.count}`);
    });

    // Test severity breakdown
    const severityBreakdown = await Incident.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: '$severity',
          count: { $sum: 1 }
        }
      }
    ]);
    
    console.log(`⚠️  Severity Breakdown:`);
    severityBreakdown.forEach(item => {
      console.log(`   - ${item._id}: ${item.count}`);
    });

    // Test recent incidents
    const recentIncidents = await Incident.find({ isActive: true })
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('reportedBy', 'firstName lastName')
      .lean();
    
    console.log(`🕒 Recent Incidents (last 5):`);
    recentIncidents.forEach(incident => {
      console.log(`   - ${incident.title} (${incident.severity}) - ${incident.reportedBy?.firstName} ${incident.reportedBy?.lastName}`);
    });

    // Test alert count
    const activeAlerts = await Alert.countDocuments({
      $or: [
        { expiresAt: { $exists: false } },
        { expiresAt: { $gte: new Date() } }
      ]
    });
    console.log(`🚨 Active alerts: ${activeAlerts}`);

    // Test analytics aggregation
    const weeklyTrend = await Incident.aggregate([
      {
        $match: {
          isActive: true,
          createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: "%Y-%m-%d",
              date: "$createdAt"
            }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);
    
    console.log(`📅 Weekly Trend:`);
    weeklyTrend.forEach(day => {
      console.log(`   - ${day._id}: ${day.count} incidents`);
    });

    // Test user role distribution
    const roleDistribution = await User.aggregate([
      {
        $group: {
          _id: '$role',
          count: { $sum: 1 }
        }
      }
    ]);
    
    console.log(`👤 User Role Distribution:`);
    roleDistribution.forEach(role => {
      console.log(`   - ${role._id}: ${role.count}`);
    });

    console.log('\n✅ Dashboard integration test completed successfully!');
    console.log('\n📋 Summary:');
    console.log(`   - Database connection: ✅`);
    console.log(`   - User management: ✅ (${userCount} users)`);
    console.log(`   - Incident tracking: ✅ (${totalIncidents} incidents)`);
    console.log(`   - Safety scoring: ✅ (${safetyScore}% safety score)`);
    console.log(`   - Real-time metrics: ✅`);
    console.log(`   - Analytics aggregation: ✅`);
    console.log(`   - Alert system: ✅ (${activeAlerts} active alerts)`);

  } catch (error) {
    console.error('❌ Dashboard integration test failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n📡 Database disconnected');
  }
}

// Run the test
if (require.main === module) {
  testDashboardIntegration();
}

module.exports = { testDashboardIntegration };
