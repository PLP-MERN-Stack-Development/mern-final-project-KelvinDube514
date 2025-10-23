import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  AlertTriangle, 
  Shield, 
  Clock, 
  MapPin, 
  User, 
  Eye, 
  ChevronDown, 
  ChevronUp,
  Calendar,
  Tag
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface IncidentReportCardProps {
  incident: {
    _id: string;
    incidentId?: string;
    title: string;
    description: string;
    category?: string;
    type: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    status: string;
    tag?: string;
    location?: {
      coordinates: [number, number];
      address?: {
        city?: string;
        state?: string;
        country?: string;
      };
      properties?: {
        city?: string;
        province?: string;
        country?: string;
      };
    };
    reportedBy?: {
      firstName?: string;
      lastName?: string;
      email?: string;
    };
    reportedByEmail?: string;
    createdAt: string;
    updatedAt?: string;
    analytics?: {
      views?: number;
      engagements?: number;
    };
  };
  onViewDetails?: (incident: any) => void;
  showFullDescription?: boolean;
}

const IncidentReportCard = ({ 
  incident, 
  onViewDetails, 
  showFullDescription = false 
}: IncidentReportCardProps) => {
  const [isExpanded, setIsExpanded] = useState(showFullDescription);

  const getSeverityColor = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'critical':
        return 'bg-red-500 text-white';
      case 'high':
        return 'bg-orange-500 text-white';
      case 'medium':
        return 'bg-yellow-500 text-black';
      case 'low':
        return 'bg-green-500 text-white';
      default:
        return 'bg-gray-500 text-white';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'open':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'investigating':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'resolved':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'closed':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'reported':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getCategoryIcon = (category?: string) => {
    switch (category) {
      case 'Cybersecurity':
        return <Shield className="h-4 w-4" />;
      case 'Physical Security':
        return <AlertTriangle className="h-4 w-4" />;
      case 'Network':
        return <Shield className="h-4 w-4" />;
      case 'Operational':
        return <Clock className="h-4 w-4" />;
      default:
        return <AlertTriangle className="h-4 w-4" />;
    }
  };

  const formatLocation = () => {
    if (incident.location?.properties) {
      const { city, province, country } = incident.location.properties;
      return [city, province, country].filter(Boolean).join(', ');
    }
    if (incident.location?.address) {
      const { city, state, country } = incident.location.address;
      return [city, state, country].filter(Boolean).join(', ');
    }
    return 'Location not specified';
  };

  const formatReporter = () => {
    if (incident.reportedBy) {
      const { firstName, lastName, email } = incident.reportedBy;
      if (firstName && lastName) {
        return `${firstName} ${lastName}`;
      }
      return email || 'Unknown Reporter';
    }
    return incident.reportedByEmail || 'Unknown Reporter';
  };

  const formatDate = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true });
    } catch {
      return 'Unknown time';
    }
  };

  return (
    <Card className="w-full hover:shadow-md transition-shadow duration-200">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-lg font-semibold text-foreground line-clamp-2">
              {incident.title}
            </CardTitle>
            <CardDescription className="mt-1 flex items-center gap-2 text-sm">
              <Calendar className="h-3 w-3" />
              {formatDate(incident.createdAt)}
              {incident.incidentId && (
                <>
                  <span>•</span>
                  <span className="font-mono text-xs">{incident.incidentId}</span>
                </>
              )}
            </CardDescription>
          </div>
          <div className="flex flex-col gap-2 ml-4">
            <Badge className={getSeverityColor(incident.severity)}>
              {incident.severity.toUpperCase()}
            </Badge>
            <Badge variant="outline" className={getStatusColor(incident.status)}>
              {incident.status.charAt(0).toUpperCase() + incident.status.slice(1)}
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {/* Category and Tag */}
        <div className="flex items-center gap-2 mb-3">
          {incident.category && (
            <Badge variant="secondary" className="flex items-center gap-1">
              {getCategoryIcon(incident.category)}
              {incident.category}
            </Badge>
          )}
          {incident.tag && (
            <Badge variant="outline" className="flex items-center gap-1">
              <Tag className="h-3 w-3" />
              {incident.tag}
            </Badge>
          )}
        </div>

        {/* Description */}
        <div className="mb-4">
          <p className={`text-sm text-muted-foreground ${
            isExpanded ? '' : 'line-clamp-3'
          }`}>
            {incident.description}
          </p>
          {incident.description.length > 150 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="mt-2 p-0 h-auto text-xs text-primary hover:text-primary/80"
            >
              {isExpanded ? (
                <>
                  <ChevronUp className="h-3 w-3 mr-1" />
                  Show less
                </>
              ) : (
                <>
                  <ChevronDown className="h-3 w-3 mr-1" />
                  Show more
                </>
              )}
            </Button>
          )}
        </div>

        {/* Location and Reporter */}
        <div className="space-y-2 mb-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4" />
            <span>{formatLocation()}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <User className="h-4 w-4" />
            <span>Reported by {formatReporter()}</span>
          </div>
        </div>

        {/* Analytics */}
        {incident.analytics && (incident.analytics.views || incident.analytics.engagements) && (
          <div className="flex items-center gap-4 text-xs text-muted-foreground mb-4">
            {incident.analytics.views && (
              <div className="flex items-center gap-1">
                <Eye className="h-3 w-3" />
                <span>{incident.analytics.views} views</span>
              </div>
            )}
            {incident.analytics.engagements && (
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                <span>{incident.analytics.engagements} engagements</span>
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between pt-2 border-t">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              {incident.type.replace('_', ' ').toUpperCase()}
            </Badge>
          </div>
          {onViewDetails && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onViewDetails(incident)}
              className="text-xs"
            >
              View Details
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default IncidentReportCard;
