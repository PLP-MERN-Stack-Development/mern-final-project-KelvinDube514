import { AlertTriangle, MapPin, Clock, Shield, CheckCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import ShinyText from '@/components/ui/ShinyText';

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

interface AlertCardProps {
  alert: Alert;
  onViewDetails?: (alert: Alert) => void;
}

const AlertCard = ({ alert, onViewDetails }: AlertCardProps) => {
  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'critical':
        return <AlertTriangle className="h-5 w-5 text-destructive" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-warning" />;
      case 'info':
        return <AlertTriangle className="h-5 w-5 text-blue-500" />;
      case 'safe':
        return <CheckCircle className="h-5 w-5 text-success" />;
      default:
        return <AlertTriangle className="h-5 w-5" />;
    }
  };

  const getAlertStyle = (type: string) => {
    switch (type) {
      case 'critical':
        return 'border-l-4 border-l-destructive bg-destructive/5';
      case 'warning':
        return 'border-l-4 border-l-warning bg-warning/5';
      case 'info':
        return 'border-l-4 border-l-blue-500 bg-blue-500/5';
      case 'safe':
        return 'border-l-4 border-l-success bg-success/5';
      default:
        return '';
    }
  };

  const getBadgeVariant = (type: string) => {
    switch (type) {
      case 'critical':
        return 'destructive';
      case 'warning':
        return 'secondary';
      case 'info':
        return 'secondary';
      case 'safe':
        return 'secondary';
      default:
        return 'secondary';
    }
  };

  return (
    <Card className={`transition-all hover:shadow-md ${getAlertStyle(alert.type)}`}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-3 flex-1">
            <div className="mt-1">
              {getAlertIcon(alert.type)}
            </div>
            <div className="flex-1 space-y-2">
              <div className="flex items-center space-x-2">
                <h3 className="font-semibold text-foreground">
                  <ShinyText text={alert.title} speed={3} />
                </h3>
                {alert.verified && (
                  <Badge variant="outline" className="text-xs">
                    <Shield className="h-3 w-3 mr-1" />
                    <ShinyText text="Verified" speed={3} />
                  </Badge>
                )}
              </div>
              
              <p className="text-sm text-muted-foreground">
                <ShinyText text={alert.description} speed={5} />
              </p>
              
              <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                <div className="flex items-center space-x-1">
                  <MapPin className="h-4 w-4" />
                  <span>{alert.location}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Clock className="h-4 w-4" />
                  <span>{alert.time}</span>
                </div>
                <span>{alert.distance} away</span>
              </div>
            </div>
          </div>
          
          <div className="flex flex-col items-end space-y-2">
            <Badge variant={getBadgeVariant(alert.type)} className="capitalize">
              {alert.type}
            </Badge>
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-8 text-xs"
              onClick={() => onViewDetails?.(alert)}
            >
              <ShinyText text="View Details" speed={3} />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AlertCard;