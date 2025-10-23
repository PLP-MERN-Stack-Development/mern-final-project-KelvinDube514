import React, { useState, useEffect, useRef } from 'react';
import { Search, MapPin, Navigation } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { isWithinSouthAfrica, MAJOR_CITIES, LatLngLiteral } from '@/config/map';
import L from 'leaflet';

interface LocationSearchProps {
  map: L.Map | null;
  onLocationSelect: (location: LatLngLiteral, address: string) => void;
  onCurrentLocation?: () => void;
  placeholder?: string;
  className?: string;
}

interface SearchResult { place_id: string; formatted_address: string; name?: string; }

const LocationSearch: React.FC<LocationSearchProps> = ({
  map,
  onLocationSelect,
  onCurrentLocation,
  placeholder = "Search for a location in South Africa...",
  className = ""
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  
  const searchServiceRef = useRef<any>();
  const autocompleteServiceRef = useRef<any>();
  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  useEffect(() => { /* legacy stub */ }, [map]);

  // Handle search input changes
  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    
    if (value.length > 2) {
      performSearch(value);
    } else {
      setSearchResults([]);
      setShowResults(false);
    }
  };

  // Deprecated in favor of LocationSearchNominatim; keep UI but no-op
  const performSearch = (q: string) => { setIsSearching(false); setSearchResults([]); setShowResults(false); };

  // Handle location selection
  const handleLocationSelect = async (result: SearchResult) => { /* legacy no-op */ };

  // Get current location
  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast({
        title: 'Geolocation not supported',
        description: 'Your browser does not support geolocation.',
        variant: 'destructive'
      });
      return;
    }

    setIsGettingLocation(true);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const location = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };

        // Validate location is within South Africa
        if (!isWithinSouthAfrica(location.lat, location.lng)) {
          toast({
            title: 'Location outside South Africa',
            description: 'Your current location is outside South Africa.',
            variant: 'destructive'
          });
          setIsGettingLocation(false);
          return;
        }

        // Move map to current location
        map.setCenter(location);
        map.setZoom(15);

        setIsGettingLocation(false);
        const address = `${location.lat.toFixed(6)}, ${location.lng.toFixed(6)}`;
        setSearchQuery(address);
        onLocationSelect(location, address);
        onCurrentLocation?.();
      },
      (error) => {
        setIsGettingLocation(false);
        toast({
          title: 'Location error',
          description: 'Could not get your current location.',
          variant: 'destructive'
        });
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000
      }
    );
  };

  // Handle quick city selection
  const handleQuickCitySelect = (city: typeof MAJOR_CITIES[0]) => {
    const location = { lat: city.lat, lng: city.lng };
    if (map) map.setView([location.lat, location.lng], 12);
    setSearchQuery(city.name);
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
                ref={inputRef}
                placeholder={placeholder}
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                onFocus={() => searchResults.length > 0 && setShowResults(true)}
                className="pl-10"
              />
              
              {/* Search Results Dropdown */}
              {showResults && searchResults.length > 0 && (
                <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-background border rounded-md shadow-lg max-h-60 overflow-y-auto">
                  {searchResults.map((result, index) => (
                    <div
                      key={result.place_id}
                      className="p-3 hover:bg-muted cursor-pointer border-b last:border-b-0"
                      onClick={() => handleLocationSelect(result)}
                    >
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium">{result.name}</p>
                          <p className="text-xs text-muted-foreground">{result.formatted_address}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <Button
              variant="outline"
              size="icon"
              onClick={handleGetCurrentLocation}
              disabled={isGettingLocation}
            >
              <Navigation className="h-4 w-4" />
            </Button>
          </div>

          {/* Quick City Selection */}
          <div className="mt-3">
            <p className="text-xs text-muted-foreground mb-2">Quick select:</p>
            <div className="flex flex-wrap gap-1">
              {MAJOR_CITIES.slice(0, 5).map((city) => (
                <Button
                  key={city.name}
                  variant="ghost"
                  size="sm"
                  className="text-xs h-6 px-2"
                  onClick={() => handleQuickCitySelect(city)}
                >
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

export default LocationSearch;
