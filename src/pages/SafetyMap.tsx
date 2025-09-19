import { useState } from 'react';
import { MapPin, Navigation, Search, Filter, Layers } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const SafetyMap = () => {
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const mapAlerts = [
    { id: 1, type: 'critical', lat: 40.7589, lng: -73.9851, title: 'Armed Robbery', time: '5 min ago' },
    { id: 2, type: 'warning', lat: 40.7614, lng: -73.9776, title: 'Traffic Accident', time: '12 min ago' },
    { id: 3, type: 'info', lat: 40.7505, lng: -73.9934, title: 'Community Event', time: '1 hr ago' },
    { id: 4, type: 'safe', lat: 40.7549, lng: -73.9840, title: 'All Clear', time: '2 hr ago' },
  ];

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Safety Map</h1>
          <p className="text-muted-foreground">Real-time visualization of neighborhood safety alerts</p>
        </div>
        <Button className="bg-primary hover:bg-primary/90">
          <Navigation className="h-4 w-4 mr-2" />
          Find Safe Route
        </Button>
      </div>

      {/* Controls */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search for a location..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={selectedFilter} onValueChange={setSelectedFilter}>
              <SelectTrigger className="w-40">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter alerts" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Alerts</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
                <SelectItem value="warning">Warning</SelectItem>
                <SelectItem value="info">Info</SelectItem>
                <SelectItem value="safe">Safe</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline">
              <Layers className="h-4 w-4 mr-2" />
              Layers
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Map Container */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Map */}
        <div className="lg:col-span-2">
          <Card className="h-[600px]">
            <CardContent className="p-0 h-full">
              <div className="h-full bg-muted rounded-lg flex items-center justify-center relative overflow-hidden">
                {/* Mock Map Interface */}
                <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-primary/5" />
                <div className="text-center z-10">
                  <MapPin className="h-16 w-16 text-primary mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-foreground mb-2">Interactive Safety Map</h3>
                  <p className="text-muted-foreground mb-4">Real-time alerts and safe routes visualization</p>
                  <div className="flex flex-wrap justify-center gap-2">
                    {mapAlerts.map((alert) => (
                      <Badge key={alert.id} variant="outline" className="animate-pulse-glow">
                        {alert.title}
                      </Badge>
                    ))}
                  </div>
                </div>
                
                {/* Mock Alert Markers */}
                <div className="absolute top-20 left-20 w-4 h-4 bg-destructive rounded-full animate-pulse-glow" />
                <div className="absolute top-32 right-32 w-4 h-4 bg-warning rounded-full animate-pulse-glow" />
                <div className="absolute bottom-32 left-32 w-4 h-4 bg-success rounded-full animate-pulse-glow" />
                <div className="absolute bottom-20 right-20 w-4 h-4 bg-blue-500 rounded-full animate-pulse-glow" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Legend */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Map Legend</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-destructive rounded-full" />
                <span className="text-sm">Critical Alerts</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-warning rounded-full" />
                <span className="text-sm">Warning Alerts</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-blue-500 rounded-full" />
                <span className="text-sm">Info Alerts</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-success rounded-full" />
                <span className="text-sm">Safe Zones</span>
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Recent Activity</CardTitle>
              <CardDescription>Latest updates on the map</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {mapAlerts.slice(0, 4).map((alert) => (
                <div key={alert.id} className="flex items-center space-x-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                  <div className={`w-2 h-2 rounded-full ${
                    alert.type === 'critical' ? 'bg-destructive' :
                    alert.type === 'warning' ? 'bg-warning' :
                    alert.type === 'info' ? 'bg-blue-500' :
                    'bg-success'
                  }`} />
                  <div className="flex-1">
                    <p className="text-sm font-medium">{alert.title}</p>
                    <p className="text-xs text-muted-foreground">{alert.time}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" className="w-full justify-start">
                <MapPin className="h-4 w-4 mr-2" />
                Report New Alert
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Navigation className="h-4 w-4 mr-2" />
                Get Directions
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default SafetyMap;