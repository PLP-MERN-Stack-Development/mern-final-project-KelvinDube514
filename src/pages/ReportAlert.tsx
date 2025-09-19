import { useState } from 'react';
import { AlertTriangle, MapPin, Clock, Camera, Send } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';

const ReportAlert = () => {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    type: '',
    title: '',
    location: '',
    description: '',
    urgency: 'medium'
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Mock submission
    toast({
      title: "Alert Submitted Successfully",
      description: "Your safety alert has been reported to the community and authorities.",
    });

    // Reset form
    setFormData({
      type: '',
      title: '',
      location: '',
      description: '',
      urgency: 'medium'
    });
  };

  const alertTypes = [
    { value: 'crime', label: 'Crime/Security', color: 'bg-destructive' },
    { value: 'accident', label: 'Traffic Accident', color: 'bg-warning' },
    { value: 'hazard', label: 'Environmental Hazard', color: 'bg-orange-500' },
    { value: 'suspicious', label: 'Suspicious Activity', color: 'bg-yellow-500' },
    { value: 'emergency', label: 'Emergency Services', color: 'bg-red-600' },
    { value: 'other', label: 'Other', color: 'bg-gray-500' }
  ];

  const urgencyLevels = [
    { value: 'low', label: 'Low Priority', description: 'Information only' },
    { value: 'medium', label: 'Medium Priority', description: 'Moderate concern' },
    { value: 'high', label: 'High Priority', description: 'Immediate attention needed' },
    { value: 'critical', label: 'Critical', description: 'Emergency situation' }
  ];

  return (
    <div className="container mx-auto px-4 py-6 max-w-2xl">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">Report Safety Alert</h1>
        <p className="text-muted-foreground">Help keep your community safe by reporting incidents and alerts</p>
      </div>

      {/* Quick Report Buttons */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
        {alertTypes.slice(0, 6).map((type) => (
          <Button
            key={type.value}
            variant="outline"
            onClick={() => setFormData({ ...formData, type: type.value, title: type.label })}
            className={`h-16 flex flex-col items-center justify-center space-y-1 ${
              formData.type === type.value ? 'border-primary bg-primary/10' : ''
            }`}
          >
            <div className={`w-3 h-3 rounded-full ${type.color}`} />
            <span className="text-xs font-medium">{type.label}</span>
          </Button>
        ))}
      </div>

      {/* Main Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <AlertTriangle className="h-5 w-5 text-primary" />
            <span>Alert Details</span>
          </CardTitle>
          <CardDescription>
            Provide detailed information to help others stay safe
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Alert Type */}
            <div className="space-y-2">
              <Label htmlFor="type">Alert Type *</Label>
              <Select 
                value={formData.type} 
                onValueChange={(value) => setFormData({ ...formData, type: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select alert type" />
                </SelectTrigger>
                <SelectContent>
                  {alertTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      <div className="flex items-center space-x-2">
                        <div className={`w-3 h-3 rounded-full ${type.color}`} />
                        <span>{type.label}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title">Alert Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Brief description of the alert"
                required
              />
            </div>

            {/* Location */}
            <div className="space-y-2">
              <Label htmlFor="location">Location *</Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="Address or landmark"
                  className="pl-10"
                  required
                />
              </div>
              <Button type="button" variant="ghost" size="sm" className="text-primary">
                <MapPin className="h-4 w-4 mr-1" />
                Use Current Location
              </Button>
            </div>

            {/* Urgency Level */}
            <div className="space-y-2">
              <Label>Urgency Level *</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {urgencyLevels.map((level) => (
                  <Button
                    key={level.value}
                    type="button"
                    variant={formData.urgency === level.value ? "default" : "outline"}
                    onClick={() => setFormData({ ...formData, urgency: level.value })}
                    className="h-auto p-4 flex flex-col items-start text-left"
                  >
                    <span className="font-medium">{level.label}</span>
                    <span className="text-xs text-muted-foreground">{level.description}</span>
                  </Button>
                ))}
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Detailed Description *</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Provide as much detail as possible to help others understand the situation..."
                rows={4}
                required
              />
            </div>

            {/* Media Upload */}
            <div className="space-y-2">
              <Label>Attach Media (Optional)</Label>
              <div className="border-2 border-dashed border-muted rounded-lg p-6 text-center">
                <Camera className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground mb-2">
                  Upload photos or videos to provide more context
                </p>
                <Button type="button" variant="outline" size="sm">
                  Choose Files
                </Button>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <Button 
                type="submit" 
                className="flex-1 bg-primary hover:bg-primary/90"
                disabled={!formData.type || !formData.title || !formData.location || !formData.description}
              >
                <Send className="h-4 w-4 mr-2" />
                Submit Alert
              </Button>
              <Button type="button" variant="outline" className="flex-1">
                Save as Draft
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Disclaimer */}
      <Card className="mt-6 border-warning/20 bg-warning/5">
        <CardContent className="p-4">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="h-5 w-5 text-warning mt-0.5" />
            <div className="space-y-1">
              <p className="text-sm font-medium text-warning-foreground">Important Notice</p>
              <p className="text-xs text-muted-foreground">
                For immediate emergencies, call 911. This reporting system is for community awareness and non-emergency situations.
                All reports are reviewed and verified before being shared with the community.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ReportAlert;