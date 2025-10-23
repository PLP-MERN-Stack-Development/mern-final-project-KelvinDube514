import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Layers, 
  Map, 
  Satellite, 
  Navigation, 
  Maximize2, 
  Minimize2,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Eye,
  EyeOff
} from 'lucide-react';
// Deprecated: Google Maps controls

interface MapControlsProps {
  map: any;
  onMapTypeChange: (mapTypeId: any) => void;
  onToggleFullscreen: () => void;
  isFullscreen: boolean;
  onResetView: () => void;
  onToggleLayers: (layer: string, visible: boolean) => void;
  visibleLayers: string[];
  className?: string;
}

const MapControls: React.FC<MapControlsProps> = ({
  map,
  onMapTypeChange,
  onToggleFullscreen,
  isFullscreen,
  onResetView,
  onToggleLayers,
  visibleLayers,
  className = ''
}) => {
  const [currentMapType, setCurrentMapType] = useState<google.maps.MapTypeId>(google.maps.MapTypeId.ROADMAP);
  const [isControlsExpanded, setIsControlsExpanded] = useState(false);

  const mapTypeOptions = getMapTypeOptions();

  const handleMapTypeChange = (mapTypeId: string) => {
    const selectedType = mapTypeOptions.find(option => option.id === mapTypeId)?.type;
    if (selectedType) {
      setCurrentMapType(selectedType);
      onMapTypeChange(selectedType);
    }
  };

  const handleZoomIn = () => {
    const currentZoom = map.getZoom();
    if (currentZoom && currentZoom < 18) {
      map.setZoom(currentZoom + 1);
    }
  };

  const handleZoomOut = () => {
    const currentZoom = map.getZoom();
    if (currentZoom && currentZoom > 6) {
      map.setZoom(currentZoom - 1);
    }
  };

  const getMapTypeIcon = (typeId: string) => {
    switch (typeId) {
      case 'roadmap':
        return <Map className="h-4 w-4" />;
      case 'satellite':
        return <Satellite className="h-4 w-4" />;
      case 'hybrid':
        return <Layers className="h-4 w-4" />;
      case 'terrain':
        return <Navigation className="h-4 w-4" />;
      default:
        return <Map className="h-4 w-4" />;
    }
  };

  return (
    <div className={`absolute top-4 right-4 z-10 ${className}`}>
      <Card className="w-64">
        <CardContent className="p-4 space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold">Map Controls</h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsControlsExpanded(!isControlsExpanded)}
            >
              {isControlsExpanded ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
          </div>

          {isControlsExpanded && (
            <>
              {/* Map Type Selection */}
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground">Map Type</label>
                <Select value={mapTypeOptions.find(opt => opt.type === currentMapType)?.id} onValueChange={handleMapTypeChange}>
                  <SelectTrigger className="h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {mapTypeOptions.map((option) => (
                      <SelectItem key={option.id} value={option.id}>
                        <div className="flex items-center gap-2">
                          {getMapTypeIcon(option.id)}
                          <span>{option.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Zoom Controls */}
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground">Zoom</label>
                <div className="flex gap-1">
                  <Button variant="outline" size="sm" onClick={handleZoomOut}>
                    <ZoomOut className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleZoomIn}>
                    <ZoomIn className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Layer Controls */}
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground">Layers</label>
                <div className="space-y-1">
                  {[
                    { id: 'traffic', label: 'Traffic', icon: '🚗' },
                    { id: 'transit', label: 'Transit', icon: '🚌' },
                    { id: 'bicycle', label: 'Bicycle', icon: '🚲' }
                  ].map((layer) => (
                    <div key={layer.id} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-sm">{layer.icon}</span>
                        <span className="text-xs">{layer.label}</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onToggleLayers(layer.id, !visibleLayers.includes(layer.id))}
                      >
                        {visibleLayers.includes(layer.id) ? (
                          <Eye className="h-3 w-3" />
                        ) : (
                          <EyeOff className="h-3 w-3" />
                        )}
                      </Button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground">Actions</label>
                <div className="grid grid-cols-2 gap-2">
                  <Button variant="outline" size="sm" onClick={onResetView}>
                    <RotateCcw className="h-4 w-4 mr-1" />
                    Reset
                  </Button>
                  <Button variant="outline" size="sm" onClick={onToggleFullscreen}>
                    {isFullscreen ? (
                      <>
                        <Minimize2 className="h-4 w-4 mr-1" />
                        Exit
                      </>
                    ) : (
                      <>
                        <Maximize2 className="h-4 w-4 mr-1" />
                        Full
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {/* Map Info */}
              <div className="pt-2 border-t">
                <div className="text-xs text-muted-foreground">
                  <div className="flex justify-between">
                    <span>Zoom Level:</span>
                    <Badge variant="secondary" className="text-xs">
                      {map.getZoom() || 0}
                    </Badge>
                  </div>
                  <div className="flex justify-between mt-1">
                    <span>Bounds:</span>
                    <Badge variant="outline" className="text-xs">
                      South Africa
                    </Badge>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Quick Controls (Always Visible) */}
          <div className="flex gap-1">
            <Button variant="outline" size="sm" onClick={handleZoomOut}>
              <ZoomOut className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={handleZoomIn}>
              <ZoomIn className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={onToggleFullscreen}>
              {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default MapControls;
