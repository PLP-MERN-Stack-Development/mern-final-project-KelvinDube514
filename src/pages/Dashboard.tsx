import { useState, useEffect } from 'react';
import { AlertTriangle, MapPin, Shield, Clock, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import AlertCard from '@/components/AlertCard';
import SafetyMetrics from '@/components/SafetyMetrics';

interface Alert {
  id: number;
  type: 'critical' | 'warning' | 'info' | 'safe';
  title: string;
  location: string;
  time: string;
  distance: string;
  verified: boolean;
  description: string;
}

const Dashboard = () => {
  const [alerts, setAlerts] = useState<Alert[]>([
    {
      id: 1,
      type: 'critical' as const,
      title: 'Armed Robbery Reported',
      location: '5th Avenue & Main St',
      time: '5 minutes ago',
      distance: '0.3 miles',
      verified: true,
      description: 'Police responding to armed robbery at convenience store'
    },
    {
      id: 2,
      type: 'warning' as const,
      title: 'Traffic Accident',
      location: 'Highway 101 North',
      time: '12 minutes ago',
      distance: '1.2 miles',
      verified: true,
      description: 'Multi-car accident blocking two lanes'
    },
    {
      id: 3,
      type: 'info' as const,
      title: 'Community Event',
      location: 'Central Park',
      time: '1 hour ago',
      distance: '0.8 miles',
      verified: false,
      description: 'Large gathering for neighborhood watch meeting'
    },
    {
      id: 4,
      type: 'safe' as const,
      title: 'All Clear',
      location: 'Downtown District',
      time: '2 hours ago',
      distance: '0.5 miles',
      verified: true,
      description: 'Regular patrol completed, area secure'
    }
  ]);

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Safety Dashboard</h1>
          <p className="text-muted-foreground">Real-time neighborhood safety overview</p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="outline" className="flex items-center space-x-1">
            <div className="h-2 w-2 bg-success rounded-full animate-pulse-glow"></div>
            <span>Live Updates</span>
          </Badge>
        </div>
      </div>

      {/* Safety Metrics */}
      <SafetyMetrics />

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Shield className="h-5 w-5 text-primary" />
            <span>Quick Actions</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button className="h-16 bg-primary hover:bg-primary/90" size="lg">
              <div className="flex flex-col items-center space-y-1">
                <AlertTriangle className="h-6 w-6" />
                <span>Report Alert</span>
              </div>
            </Button>
            <Button variant="outline" className="h-16" size="lg">
              <div className="flex flex-col items-center space-y-1">
                <MapPin className="h-6 w-6" />
                <span>Find Safe Route</span>
              </div>
            </Button>
            <Button variant="outline" className="h-16" size="lg">
              <div className="flex flex-col items-center space-y-1">
                <Shield className="h-6 w-6" />
                <span>Emergency Contact</span>
              </div>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Recent Alerts */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Clock className="h-5 w-5 text-primary" />
              <span>Recent Alerts</span>
            </div>
            <Badge variant="outline">
              {alerts.length} Active
            </Badge>
          </CardTitle>
          <CardDescription>
            Latest safety alerts in your neighborhood
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {alerts.map((alert) => (
              <AlertCard key={alert.id} alert={alert} />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;