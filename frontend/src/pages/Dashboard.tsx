import { useState, useEffect } from 'react';
import { AlertTriangle, MapPin, Shield, Clock, TrendingUp, Volume2, TestTube, Plus, FileText, Filter } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import AlertCard from '@/components/AlertCard';
import SafetyMetrics from '@/components/SafetyMetrics';
import PostsList from '@/components/PostsList';
import IncidentReportCard from '@/components/IncidentReportCard';
import ShinyText from '@/components/ui/ShinyText';
import NotificationView from '@/components/NotificationView';
import { notificationService } from '@/services/NotificationService';
import { useRealTime } from '@/hooks/useRealTime';
import { useDashboardMetrics, useNearbyActivity } from '@/hooks/useApi';
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
  const navigate = useNavigate();
  
  // Real-time connection
  const { 
    isConnected, 
    alerts: realTimeAlerts, 
    incidents, 
    triggerTestNotification 
  } = useRealTime();

  // User location for nearby activity
  const [userLocation, setUserLocation] = useState<{ coordinates: [number, number]; radius: number } | null>(null);

  // API data with better error handling
  const { 
    data: dashboardMetrics, 
    isLoading: metricsLoading, 
    error: metricsError,
    refetch: refetchMetrics
  } = useDashboardMetrics();

  const { 
    data: nearbyActivity, 
    isLoading: nearbyLoading, 
    error: nearbyError,
    refetch: refetchNearby
  } = useNearbyActivity(
    userLocation || { coordinates: [0, 0], radius: 5 }
  );

  const [selectedAlert, setSelectedAlert] = useState<any>(null);
  const [showNotificationView, setShowNotificationView] = useState(false);
  
  // Incident reports state
  const [incidentReports, setIncidentReports] = useState<any[]>([]);
  const [incidentLoading, setIncidentLoading] = useState(false);
  const [incidentError, setIncidentError] = useState<string | null>(null);
  const [incidentStats, setIncidentStats] = useState<any>(null);
  const [incidentFilters, setIncidentFilters] = useState({
    category: 'all',
    severity: 'all',
    status: 'all'
  });

  // Initialize notification service and get user location
  useEffect(() => {
    notificationService.initialize();
    
    // Get user's current location for nearby activity
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            coordinates: [position.coords.longitude, position.coords.latitude],
            radius: 10 // 10km radius
          });
        },
        (error) => {
          console.warn('Geolocation error:', error);
          // Fallback to default location (or let user manually set)
        },
        {
          enableHighAccuracy: false,
          timeout: 10000,
          maximumAge: 300000 // 5 minutes
        }
      );
    }
  }, []);

  // Fetch incident reports using ApiService (backed by MongoDB incidents collection)
  const fetchIncidentReports = async () => {
    setIncidentLoading(true);
    setIncidentError(null);
    
    try {
      const { apiService } = await import('@/services/ApiService');
      
      const params: any = {
        limit: 10,
        sort: 'createdAt',
        order: 'desc'
      };

      if (incidentFilters.category !== 'all') {
        params.category = incidentFilters.category;
      }
      if (incidentFilters.severity !== 'all') {
        params.severity = incidentFilters.severity;
      }
      if (incidentFilters.status !== 'all') {
        params.status = incidentFilters.status;
      }

      const response = await apiService.getPosts(params);

      if (response.success && response.data) {
        // Backend returns { data: { incidents, pagination, filters } }
        // Map to the list used by the dashboard
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const incidents = (response.data as any).incidents || [];
        setIncidentReports(incidents);
      } else {
        throw new Error(response.message || 'Failed to fetch incidents');
      }
    } catch (error) {
      console.error('Error fetching incident reports:', error);
      setIncidentError(error instanceof Error ? error.message : 'Failed to fetch incident reports');
    } finally {
      setIncidentLoading(false);
    }
  };

  // Fetch incident statistics using ApiService
  const fetchIncidentStats = async () => {
    try {
      const { apiService } = await import('@/services/ApiService');
      const response = await apiService.getIncidentStats();
      
      if (response.success && response.data) {
        setIncidentStats(response.data);
      } else {
        throw new Error(response.message || 'Failed to fetch incident statistics');
      }
    } catch (error) {
      console.error('Error fetching incident statistics:', error);
      // Don't set error state for stats - it's not critical
    }
  };

  // Fetch incidents when filters change
  useEffect(() => {
    fetchIncidentReports();
  }, [incidentFilters]);

  // Fetch incident statistics on component mount
  useEffect(() => {
    fetchIncidentStats();
  }, []);

  const handleViewDetails = (alert: any) => {
    setSelectedAlert(alert);
    setShowNotificationView(true);
  };

  const handleIncidentViewDetails = (incident: any) => {
    // Navigate to incident details page or show in modal
    console.log('View incident details:', incident);
    // For now, just log - you can implement navigation or modal later
  };

  const handleFilterChange = (filterType: string, value: string) => {
    setIncidentFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
  };

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            <ShinyText text="Safety Dashboard" speed={4} />
          </h1>
          <p className="text-muted-foreground">
            <ShinyText text="Real-time neighborhood safety overview" speed={5} />
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="outline" className="flex items-center space-x-1">
            <div className={`h-2 w-2 rounded-full animate-pulse-glow ${isConnected ? 'bg-success' : 'bg-destructive'}`}></div>
            <span><ShinyText text={isConnected ? "Live Updates" : "Disconnected"} speed={3} /></span>
          </Badge>
          
          {/* Test Notification Buttons (Development) */}
          <div className="flex items-center space-x-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => triggerTestNotification('critical')}
              className="h-8 px-2"
              title="Test Critical Alert Sound"
            >
              <TestTube className="h-3 w-3" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => triggerTestNotification('warning')}
              className="h-8 px-2"
              title="Test Warning Alert Sound"
            >
              <Volume2 className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </div>

      {/* Connection Status and Error States */}
      {!isConnected && (
        <Alert variant="default">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>Dashboard is disconnected from real-time services. Some features may be limited.</span>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => window.location.reload()}
            >
              Reconnect
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {metricsError && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>
              Failed to load dashboard metrics: {metricsError.message || 'Connection error'}
              {(metricsError as any).statusCode === 0 && ' (Server unavailable)'}
            </span>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => refetchMetrics()}
              disabled={metricsLoading}
            >
              {metricsLoading ? 'Retrying...' : 'Retry'}
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {nearbyError && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>Failed to load nearby activity: {(nearbyError as any).message || 'Connection error'}</span>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => refetchNearby()}
              disabled={nearbyLoading}
            >
              {nearbyLoading ? 'Retrying...' : 'Retry'}
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Safety Metrics */}
      {metricsLoading ? (
        <Card>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-8 w-16" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : dashboardMetrics ? (
        <Card>
          <CardHeader>
            <CardTitle>
              <ShinyText text="Safety Metrics" speed={3} />
            </CardTitle>
            <CardDescription>
              <ShinyText text="Current safety statistics for your area" speed={5} />
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="text-center">
                <p className="text-2xl font-bold text-primary">{dashboardMetrics.totalIncidents}</p>
                <p className="text-sm text-muted-foreground">Total Incidents</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-orange-500">{dashboardMetrics.activeAlerts}</p>
                <p className="text-sm text-muted-foreground">Active Alerts</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-green-500">{dashboardMetrics.safetyScore}/100</p>
                <p className="text-sm text-muted-foreground">Safety Score</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-500">{dashboardMetrics.recentActivity}</p>
                <p className="text-sm text-muted-foreground">Recent Activity</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : metricsError ? (
        <Card>
          <CardHeader>
            <CardTitle>
              <ShinyText text="Safety Dashboard" speed={3} />
            </CardTitle>
            <CardDescription>
              <ShinyText text="Unable to connect to safety services" speed={5} />
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-lg font-medium text-muted-foreground mb-2">Dashboard Disconnected</p>
              <p className="text-sm text-muted-foreground mb-4">
                Unable to load safety metrics. Please check your connection and try again.
              </p>
              <Button onClick={() => refetchMetrics()} disabled={metricsLoading}>
                {metricsLoading ? 'Connecting...' : 'Reconnect to Dashboard'}
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <SafetyMetrics />
      )}

      {/* Incident Report Statistics */}
      {incidentStats && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <FileText className="h-5 w-5 text-primary" />
              <span><ShinyText text="Incident Report Statistics" speed={3} /></span>
            </CardTitle>
            <CardDescription>
              <ShinyText text="Overview of incident reports by category and severity" speed={5} />
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="text-center">
                <p className="text-2xl font-bold text-primary">{incidentStats.totalIncidents}</p>
                <p className="text-sm text-muted-foreground">Total Reports</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-orange-500">{incidentStats.verifiedCount}</p>
                <p className="text-sm text-muted-foreground">Verified</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-green-500">{incidentStats.resolvedCount}</p>
                <p className="text-sm text-muted-foreground">Resolved</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-500">
                  {Object.keys(incidentStats.byCategory || {}).length}
                </p>
                <p className="text-sm text-muted-foreground">Categories</p>
              </div>
            </div>
            
            {/* Category Breakdown */}
            {incidentStats.byCategory && Object.keys(incidentStats.byCategory).length > 0 && (
              <div className="mt-6">
                <h4 className="text-sm font-medium text-muted-foreground mb-3">By Category</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {Object.entries(incidentStats.byCategory).map(([category, count]) => (
                    <div key={category} className="text-center p-3 bg-muted/50 rounded-lg">
                      <p className="text-lg font-semibold">{count as number}</p>
                      <p className="text-xs text-muted-foreground">{category}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Severity Breakdown */}
            {incidentStats.bySeverity && Object.keys(incidentStats.bySeverity).length > 0 && (
              <div className="mt-6">
                <h4 className="text-sm font-medium text-muted-foreground mb-3">By Severity</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {Object.entries(incidentStats.bySeverity).map(([severity, count]) => (
                    <div key={severity} className="text-center p-3 bg-muted/50 rounded-lg">
                      <p className="text-lg font-semibold">{count as number}</p>
                      <p className="text-xs text-muted-foreground capitalize">{severity}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Shield className="h-5 w-5 text-primary" />
            <span><ShinyText text="Quick Actions" speed={3} /></span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button 
              className="h-16 bg-primary hover:bg-primary/90" 
              size="lg"
              onClick={() => navigate('/report')}
            >
              <div className="flex flex-col items-center space-y-1">
                <Plus className="h-6 w-6" />
                <span><ShinyText text="Report Incident" speed={3} /></span>
              </div>
            </Button>
            <Button 
              variant="outline" 
              className="h-16" 
              size="lg"
              onClick={() => navigate('/map')}
            >
              <div className="flex flex-col items-center space-y-1">
                <MapPin className="h-6 w-6" />
                <span><ShinyText text="Safety Map" speed={3} /></span>
              </div>
            </Button>
            <Button 
              variant="outline" 
              className="h-16" 
              size="lg"
              onClick={() => navigate('/profile')}
            >
              <div className="flex flex-col items-center space-y-1">
                <Shield className="h-6 w-6" />
                <span><ShinyText text="Emergency Settings" speed={3} /></span>
              </div>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      {nearbyError ? (
        <Card>
          <CardContent className="p-6">
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Failed to load nearby activity: {nearbyError.message}
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      ) : nearbyLoading ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Clock className="h-5 w-5 text-primary" />
              <span><ShinyText text="Nearby Activity" speed={3} /></span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-center space-x-4">
                  <Skeleton className="w-12 h-12 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : nearbyActivity && (nearbyActivity.incidents.length > 0 || nearbyActivity.alerts.length > 0) ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Clock className="h-5 w-5 text-primary" />
                <span><ShinyText text="Nearby Activity" speed={3} /></span>
              </div>
              <Badge variant="outline">
                <ShinyText text={`${nearbyActivity.incidents.length + nearbyActivity.alerts.length} Active`} speed={3} />
              </Badge>
            </CardTitle>
            <CardDescription>
              <ShinyText text="Recent safety reports and alerts in your area" speed={5} />
            </CardDescription>
          </CardHeader>
          <CardContent>
            <PostsList 
              location={userLocation || undefined} 
              showFilters={false}
              onPostSelect={handleViewDetails}
            />
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-8 text-center">
            <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">All Clear in Your Area</h3>
            <p className="text-muted-foreground">
              No recent safety incidents or alerts reported nearby.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Incident Reports Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center space-x-2">
                <FileText className="h-5 w-5 text-primary" />
                <span><ShinyText text="Incident Reports" speed={3} /></span>
              </CardTitle>
              <CardDescription>
                <ShinyText text="Recent security and safety incident reports" speed={5} />
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchIncidentReports}
              disabled={incidentLoading}
            >
              {incidentLoading ? 'Refreshing...' : 'Refresh'}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex flex-wrap gap-4 mb-6">
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Filters:</span>
            </div>
            
            <Select
              value={incidentFilters.category}
              onValueChange={(value) => handleFilterChange('category', value)}
            >
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="Cybersecurity">Cybersecurity</SelectItem>
                <SelectItem value="Physical Security">Physical Security</SelectItem>
                <SelectItem value="Network">Network</SelectItem>
                <SelectItem value="Operational">Operational</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={incidentFilters.severity}
              onValueChange={(value) => handleFilterChange('severity', value)}
            >
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Severity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Severities</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={incidentFilters.status}
              onValueChange={(value) => handleFilterChange('status', value)}
            >
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="investigating">Investigating</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Error State */}
          {incidentError && (
            <Alert variant="destructive" className="mb-6">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription className="flex items-center justify-between">
                <span>Failed to load incident reports: {incidentError}</span>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={fetchIncidentReports}
                  disabled={incidentLoading}
                >
                  {incidentLoading ? 'Retrying...' : 'Retry'}
                </Button>
              </AlertDescription>
            </Alert>
          )}

          {/* Loading State */}
          {incidentLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="space-y-3">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                  <Skeleton className="h-20 w-full" />
                </div>
              ))}
            </div>
          ) : incidentReports.length > 0 ? (
            <div className="space-y-4">
              {incidentReports.map((incident) => (
                <IncidentReportCard
                  key={incident._id}
                  incident={incident}
                  onViewDetails={handleIncidentViewDetails}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Incident Reports</h3>
              <p className="text-muted-foreground">
                No incident reports found matching your current filters.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Notification View Modal */}
      <NotificationView
        alert={selectedAlert || undefined}
        isOpen={showNotificationView}
        onClose={() => {
          setShowNotificationView(false);
          setSelectedAlert(null);
        }}
        mode="view"
      />
    </div>
  );
};

export default Dashboard;