import { useState } from 'react';
import { MapPin, Navigation, Filter, Layers, Route, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ShinyText from '@/components/ui/ShinyText';
import OSMMapWrapper from '@/components/maps/OSMMapWrapper';
import { Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { useRealTime } from '@/hooks/useRealTime';
import { useToast } from '@/hooks/use-toast';
import { MAP_CONFIG, MAJOR_CITIES, LatLngLiteral } from '@/config/map';
import LocationSearchNominatim from '@/components/maps/LocationSearchNominatim';
import SafeRouteCalculatorLeaflet from '@/components/maps/SafeRouteCalculatorLeaflet';

interface AlertMarker {
  id: string;
  type: 'critical' | 'warning' | 'info' | 'safe';
  position: LatLngLiteral;
  title: string;
  description?: string;
  timestamp: string;
  severity?: 'low' | 'medium' | 'high' | 'critical';
}

const SafetyMap = () => {
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [map, setMap] = useState<L.Map | null>(null);
  const [currentLocation, setCurrentLocation] = useState<LatLngLiteral | null>(null);
  const [routeOrigin, setRouteOrigin] = useState<LatLngLiteral | null>(null);
  const [routeDestination, setRouteDestination] = useState<LatLngLiteral | null>(null);
  const [showRouteCalculator, setShowRouteCalculator] = useState(false);
  const [activeTab, setActiveTab] = useState('alerts');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [visibleLayers, setVisibleLayers] = useState<string[]>([]);
  
  const { toast } = useToast();

  // Real-time alerts from backend
  const { alerts, isConnected } = useRealTime({
    serverUrl: 'http://localhost:5000',
    autoConnect: true,
    enableGeolocation: true,
    authToken: localStorage.getItem('authToken')
  });

  // Convert real-time alerts to map markers
  const toAlertType = (priority: string): AlertMarker['type'] => {
    if (priority === 'high') return 'critical';
    if (priority === 'medium') return 'warning';
    return 'info';
  };

  const mapAlerts: AlertMarker[] = alerts.map((alert) => ({
    id: alert.id,
    type: toAlertType(String(alert.priority)),
    position: {
      lat: alert.location?.coordinates?.[1] ?? 0,
      lng: alert.location?.coordinates?.[0] ?? 0,
    },
    title: alert.title,
    ...(('description' in alert) ? { description: (alert as unknown as { description?: string }).description } : {}),
    timestamp: new Date(alert.createdAt).toLocaleString(),
    severity: (alert.priority as 'low' | 'medium' | 'high' | 'critical') || 'low',
  })).filter((alert) =>
    alert.position.lat !== 0 && alert.position.lng !== 0 &&
    (selectedFilter === 'all' || alert.type === selectedFilter)
  );

  // Sample South African alerts for demonstration
  const sampleAlerts: AlertMarker[] = [
    { 
      id: '1', 
      type: 'critical', 
      position: { lat: -26.2041, lng: 28.0473 }, 
      title: 'Armed Robbery - Johannesburg CBD', 
      description: 'Reported armed robbery in progress near Carlton Centre',
      timestamp: '5 min ago',
      severity: 'critical'
    },
    { 
      id: '2', 
      type: 'warning', 
      position: { lat: -33.9249, lng: 18.4241 }, 
      title: 'Traffic Accident - Cape Town', 
      description: 'Multi-vehicle accident on N1 near Table Mountain',
      timestamp: '12 min ago',
      severity: 'medium'
    },
    { 
      id: '3', 
      type: 'info', 
      position: { lat: -29.8587, lng: 31.0218 }, 
      title: 'Community Event - Durban', 
      description: 'Street festival in progress at Victoria Street Market',
      timestamp: '1 hr ago',
      severity: 'low'
    },
    { 
      id: '4', 
      type: 'safe', 
      position: { lat: -25.7479, lng: 28.2293 }, 
      title: 'All Clear - Pretoria', 
      description: 'Area declared safe after earlier incident',
      timestamp: '2 hr ago',
      severity: 'low'
    },
  ];

  // Combine real-time and sample alerts
  const allAlerts = [...mapAlerts, ...sampleAlerts];

  // Handle map initialization
  const handleMapReady = (mapInstance: L.Map) => {
    setMap(mapInstance);
  };

  // Handle location selection
  const handleLocationSelect = (location: LatLngLiteral, address: string) => {
    setCurrentLocation(location);
    if (map) {
      map.setView([location.lat, location.lng], 15);
    }
  };

  // Handle current location
  const handleCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          setCurrentLocation(location);
          if (map) {
            map.setView([location.lat, location.lng], 15);
          }
        },
        (error) => {
          toast({
            title: 'Location error',
            description: 'Could not get your current location.',
            variant: 'destructive'
          });
        }
      );
    }
  };

  // Handle alert marker click
  const handleAlertClick = (alert: AlertMarker) => {
    if (map) {
      map.setView([alert.position.lat, alert.position.lng], 16);
    }
  };

  // Organic Maps deep link for coordinates
  const openInOrganicMaps = (coords: LatLngLiteral) => {
    const url = `geo:${coords.lat},${coords.lng}`;
    window.open(url, '_blank');
  };

  // Handle fullscreen toggle
  const handleToggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  // Handle layer toggle
  const handleToggleLayers = (layer: string, visible: boolean) => {
    if (visible) {
      setVisibleLayers(prev => [...prev, layer]);
    } else {
      setVisibleLayers(prev => prev.filter(l => l !== layer));
    }
  };

  // Handle reset view
  const handleResetView = () => {
    if (map) {
      const bounds = [[MAP_CONFIG.SOUTH_AFRICA_BOUNDS.south, MAP_CONFIG.SOUTH_AFRICA_BOUNDS.west], [MAP_CONFIG.SOUTH_AFRICA_BOUNDS.north, MAP_CONFIG.SOUTH_AFRICA_BOUNDS.east]] as [[number, number],[number, number]];
      map.fitBounds(bounds);
    }
  };

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            <ShinyText text="Interactive Safety Map" speed={4} />
          </h1>
          <p className="text-muted-foreground">
            <ShinyText text="Real-time alerts and safe routes visualization for South Africa" speed={5} />
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline"
            onClick={() => setActiveTab('routes')}
            className={activeTab === 'routes' ? 'bg-primary text-primary-foreground' : ''}
          >
            <Route className="h-4 w-4 mr-2" />
            <ShinyText text="Safe Routes" speed={3} />
          </Button>
          <Button 
            onClick={() => setActiveTab('alerts')}
            className={activeTab === 'alerts' ? 'bg-primary text-primary-foreground' : ''}
          >
            <AlertTriangle className="h-4 w-4 mr-2" />
            <ShinyText text="View Alerts" speed={3} />
          </Button>
        </div>
      </div>

      {/* Controls */}
      <Card>
        <CardContent className="p-4">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="alerts">Safety Alerts</TabsTrigger>
              <TabsTrigger value="routes">Safe Routes</TabsTrigger>
            </TabsList>
            
            <TabsContent value="alerts" className="space-y-4 mt-4">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <LocationSearchNominatim
                    map={map}
                    onLocationSelect={handleLocationSelect}
                    onCurrentLocation={handleCurrentLocation}
                    placeholder="Search for a location in South Africa..."
                  />
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
            </TabsContent>
            
            <TabsContent value="routes" className="space-y-4 mt-4">
              {routeOrigin && routeDestination && (
                <SafeRouteCalculatorLeaflet
                  map={map}
                  origin={routeOrigin}
                  destination={routeDestination}
                />
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Map Container */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Map */}
        <div className="lg:col-span-2">
          <Card className={`${isFullscreen ? 'fixed inset-4 z-50' : 'h-[600px]'}`}>
            <CardContent className="p-0 h-full relative">
              <OSMMapWrapper
                center={currentLocation || MAP_CONFIG.DEFAULT_CENTER}
                zoom={currentLocation ? 15 : MAP_CONFIG.DEFAULT_ZOOM}
                onMapReady={handleMapReady}
                className="h-full rounded-lg"
              >
                {allAlerts.map((alert) => (
                  <Marker key={alert.id} position={[alert.position.lat, alert.position.lng]} eventHandlers={{ click: () => handleAlertClick(alert) }}>
                    <Popup>
                      <div className="space-y-1">
                        <div className="font-medium">{alert.title}</div>
                        {alert.description && <div className="text-xs text-muted-foreground">{alert.description}</div>}
                        <div className="text-xs">{alert.timestamp}</div>
                        <Button size="sm" variant="outline" onClick={() => openInOrganicMaps(alert.position)} className="mt-2">Open in Organic Maps</Button>
                      </div>
                    </Popup>
                  </Marker>
                ))}
              </OSMMapWrapper>
              
              {/* Map Controls Overlay */}
              <div className="absolute top-3 right-3 flex gap-2">
                <Button size="sm" variant="outline" onClick={handleToggleFullscreen}>{isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}</Button>
                <Button size="sm" variant="outline" onClick={handleResetView}>Reset View</Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Connection Status */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
                <ShinyText text="Real-time Status" speed={3} />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                {isConnected ? 'Connected to live alerts' : 'Disconnected from live alerts'}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {allAlerts.length} alerts visible
              </p>
            </CardContent>
          </Card>

          {/* Legend */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                <ShinyText text="Map Legend" speed={3} />
              </CardTitle>
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
              <CardTitle className="text-lg">
                <ShinyText text="Recent Activity" speed={3} />
              </CardTitle>
              <CardDescription>
                <ShinyText text="Latest updates on the map" speed={5} />
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {allAlerts.slice(0, 4).map((alert) => (
                <div 
                  key={alert.id} 
                  className="flex items-center space-x-3 p-2 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                  onClick={() => handleAlertClick(alert)}
                >
                  <div className={`w-2 h-2 rounded-full ${
                    alert.type === 'critical' ? 'bg-destructive' :
                    alert.type === 'warning' ? 'bg-warning' :
                    alert.type === 'info' ? 'bg-blue-500' :
                    'bg-success'
                  }`} />
                  <div className="flex-1">
                    <p className="text-sm font-medium">{alert.title}</p>
                    <p className="text-xs text-muted-foreground">{alert.timestamp}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                <ShinyText text="Quick Actions" speed={3} />
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={() => window.location.href = '/report'}
              >
                <MapPin className="h-4 w-4 mr-2" />
                <ShinyText text="Report New Alert" speed={3} />
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={() => setActiveTab('routes')}
              >
                <Navigation className="h-4 w-4 mr-2" />
                <ShinyText text="Plan Safe Route" speed={3} />
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={handleCurrentLocation}
              >
                <Navigation className="h-4 w-4 mr-2" />
                <ShinyText text="Go to My Location" speed={3} />
              </Button>
            </CardContent>
          </Card>

          {/* South Africa Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                <ShinyText text="South Africa Coverage" speed={3} />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                This map is restricted to South Africa for safety and compliance.
              </p>
              <div className="mt-2 text-xs text-muted-foreground">
                <p>• All locations validated within SA borders</p>
                <p>• Real-time alerts from local authorities</p>
                <p>• Safe route calculations optimized for SA roads</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default SafetyMap;