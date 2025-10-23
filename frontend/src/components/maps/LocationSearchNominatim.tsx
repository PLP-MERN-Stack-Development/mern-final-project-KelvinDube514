import React, { useEffect, useRef, useState } from 'react';
import { Search, MapPin, Navigation } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { MAP_CONFIG, MAJOR_CITIES, LatLngLiteral, isWithinSouthAfrica } from '@/config/map';
import L from 'leaflet';

interface LocationSearchProps {
  map: L.Map | null;
  onLocationSelect: (location: LatLngLiteral, label: string) => void;
  onCurrentLocation?: () => void;
  placeholder?: string;
  className?: string;
}

interface SearchResult {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
}

const LocationSearchNominatim: React.FC<LocationSearchProps> = ({
  map,
  onLocationSelect,
  onCurrentLocation,
  placeholder = 'Search for a location in South Africa...',
  className = ''
}) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const { toast } = useToast();
  const controllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    return () => controllerRef.current?.abort();
  }, []);

  const performSearch = async (value: string) => {
    if (!value || value.length < 3) {
      setResults([]);
      setShowResults(false);
      return;
    }
    controllerRef.current?.abort();
    const c = new AbortController();
    controllerRef.current = c;
    setIsSearching(true);
    try {
      const url = new URL('https://nominatim.openstreetmap.org/search');
      url.searchParams.set('q', `${value}, South Africa`);
      url.searchParams.set('countrycodes', 'za');
      url.searchParams.set('format', 'json');
      url.searchParams.set('addressdetails', '1');
      url.searchParams.set('limit', '8');
      const res = await fetch(url.toString(), {
        signal: c.signal,
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'CommunitySafePath/1.0 (Nominatim Usage)'
        }
      });
      const data: SearchResult[] = await res.json();
      setResults(data);
      setShowResults(true);
    } catch (e) {
      if (!(e instanceof DOMException && e.name === 'AbortError')) {
        setResults([]);
        setShowResults(false);
      }
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelect = (item: SearchResult) => {
    const lat = parseFloat(item.lat);
    const lng = parseFloat(item.lon);
    if (!isWithinSouthAfrica(lat, lng)) {
      toast({
        title: 'Location outside South Africa',
        description: 'Please select a location within South Africa.',
        variant: 'destructive'
      });
      return;
    }
    if (map) {
      map.setView([lat, lng], 15);
    }
    onLocationSelect({ lat, lng }, item.display_name);
    setQuery(item.display_name);
    setShowResults(false);
  };

  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast({ title: 'Geolocation not supported', variant: 'destructive' });
      return;
    }
    setIsGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        if (!isWithinSouthAfrica(lat, lng)) {
          toast({ title: 'Location outside South Africa', variant: 'destructive' });
          setIsGettingLocation(false);
          return;
        }
        if (map) map.setView([lat, lng], 15);
        const label = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
        onLocationSelect({ lat, lng }, label);
        onCurrentLocation?.();
        setQuery(label);
        setIsGettingLocation(false);
      },
      () => {
        setIsGettingLocation(false);
        toast({ title: 'Location error', description: 'Could not get your current location.', variant: 'destructive' });
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 }
    );
  };

  const handleQuickCity = (city: typeof MAJOR_CITIES[0]) => {
    const location = { lat: city.lat, lng: city.lng };
    if (map) map.setView([location.lat, location.lng], 12);
    setQuery(city.name);
    onLocationSelect(location, `${city.name}, ${city.province}`);
    setShowResults(false);
  };

  return (
    <div className={`relative ${className}`}>
      <Card>
        <CardContent className="p-4">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={placeholder}
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  performSearch(e.target.value);
                }}
                onFocus={() => results.length > 0 && setShowResults(true)}
                className="pl-10"
              />
              {showResults && results.length > 0 && (
                <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-background border rounded-md shadow-lg max-h-60 overflow-y-auto">
                  {results.map((r) => (
                    <div key={r.place_id} className="p-3 hover:bg-muted cursor-pointer border-b last:border-b-0" onClick={() => handleSelect(r)}>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium truncate">{r.display_name}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <Button variant="outline" size="icon" onClick={handleGetCurrentLocation} disabled={isGettingLocation}>
              <Navigation className="h-4 w-4" />
            </Button>
          </div>
          <div className="mt-3">
            <p className="text-xs text-muted-foreground mb-2">Quick select:</p>
            <div className="flex flex-wrap gap-1">
              {MAJOR_CITIES.slice(0, 5).map((city) => (
                <Button key={city.name} variant="ghost" size="sm" className="text-xs h-6 px-2" onClick={() => handleQuickCity(city)}>
                  {city.name}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default LocationSearchNominatim;

