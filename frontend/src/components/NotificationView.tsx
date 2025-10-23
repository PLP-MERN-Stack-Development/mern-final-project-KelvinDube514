import React, { useState, useEffect } from 'react';
import { X, Bell, Volume2, VolumeX, MapPin, Clock, Shield, AlertTriangle, CheckCircle, Info } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import ShinyText from '@/components/ui/ShinyText';
import { notificationService, NotificationPreferences, AlertType } from '@/services/NotificationService';

interface Alert {
  id: number;
  type: 'critical' | 'warning' | 'info' | 'safe';
  title: string;
  location: string;
  time: string;
  distance: string;
  verified: boolean;
  description: string;
  fullDescription?: string;
  createdBy?: string;
  priority?: string;
  actions?: string[];
}

interface NotificationViewProps {
  alert?: Alert;
  isOpen: boolean;
  onClose: () => void;
  mode?: 'view' | 'settings';
}

const NotificationView: React.FC<NotificationViewProps> = ({ 
  alert, 
  isOpen, 
  onClose, 
  mode = 'view' 
}) => {
  const [preferences, setPreferences] = useState<NotificationPreferences>(notificationService.getPreferences());
  const [isTesting, setIsTesting] = useState<AlertType | null>(null);

  useEffect(() => {
    setPreferences(notificationService.getPreferences());
  }, []);

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'critical':
        return <AlertTriangle className="h-6 w-6 text-destructive" />;
      case 'warning':
        return <AlertTriangle className="h-6 w-6 text-warning" />;
      case 'info':
        return <Info className="h-6 w-6 text-blue-500" />;
      case 'safe':
        return <CheckCircle className="h-6 w-6 text-success" />;
      default:
        return <Bell className="h-6 w-6" />;
    }
  };

  const getAlertColor = (type: string) => {
    switch (type) {
      case 'critical':
        return 'border-destructive bg-destructive/10';
      case 'warning':
        return 'border-warning bg-warning/10';
      case 'info':
        return 'border-blue-500 bg-blue-500/10';
      case 'safe':
        return 'border-success bg-success/10';
      default:
        return 'border-border';
    }
  };

  const handlePreferenceChange = (key: keyof NotificationPreferences, value: boolean | number) => {
    const newPreferences = { ...preferences, [key]: value };
    setPreferences(newPreferences);
    notificationService.updatePreferences(newPreferences);
  };

  const handleTestSound = async (alertType: AlertType) => {
    setIsTesting(alertType);
    try {
      await notificationService.testNotification(alertType);
    } catch (error) {
      console.error('Failed to test notification:', error);
    } finally {
      setTimeout(() => setIsTesting(null), 1000);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="flex items-center space-x-2">
            <Bell className="h-5 w-5 text-primary" />
            <span>
              <ShinyText 
                text={mode === 'settings' ? 'Notification Settings' : 'Alert Details'} 
                speed={3} 
              />
            </span>
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>

        <CardContent className="space-y-6">
          {mode === 'view' && alert && (
            <>
              {/* Alert Information */}
              <div className={`rounded-lg border-2 p-4 ${getAlertColor(alert.type)}`}>
                <div className="flex items-start space-x-3">
                  <div className="mt-1">
                    {getAlertIcon(alert.type)}
                  </div>
                  <div className="flex-1 space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold">
                        <ShinyText text={alert.title} speed={3} />
                      </h3>
                      <Badge variant="outline" className="capitalize">
                        {alert.type}
                      </Badge>
                    </div>
                    
                    <p className="text-sm text-muted-foreground">
                      <ShinyText text={alert.description} speed={5} />
                    </p>

                    {alert.fullDescription && (
                      <p className="text-sm">
                        <ShinyText text={alert.fullDescription} speed={5} />
                      </p>
                    )}

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

                    {alert.verified && (
                      <div className="flex items-center space-x-2">
                        <Shield className="h-4 w-4 text-success" />
                        <span className="text-sm font-medium text-success">Verified</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Actions */}
              {alert.actions && alert.actions.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-medium">Recommended Actions</h4>
                  <ul className="space-y-1">
                    {alert.actions.map((action, index) => (
                      <li key={index} className="text-sm text-muted-foreground flex items-center space-x-2">
                        <div className="w-1 h-1 bg-primary rounded-full" />
                        <span>{action}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          )}

          {mode === 'settings' && (
            <>
              {/* Notification Settings */}
              <div className="space-y-6">
                {/* Master Toggle */}
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label htmlFor="notifications-enabled" className="text-base font-medium">
                      Enable Notification Sounds
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Play audio alerts when new notifications arrive
                    </p>
                  </div>
                  <Switch
                    id="notifications-enabled"
                    checked={preferences.enabled}
                    onCheckedChange={(checked) => handlePreferenceChange('enabled', checked)}
                  />
                </div>

                <Separator />

                {/* Volume Control */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-base font-medium">Volume</Label>
                    <div className="flex items-center space-x-2">
                      {preferences.volume === 0 ? (
                        <VolumeX className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <Volume2 className="h-4 w-4 text-muted-foreground" />
                      )}
                      <span className="text-sm text-muted-foreground w-8 text-right">
                        {Math.round(preferences.volume * 100)}%
                      </span>
                    </div>
                  </div>
                  <Slider
                    value={[preferences.volume]}
                    onValueChange={([value]) => handlePreferenceChange('volume', value)}
                    max={1}
                    step={0.1}
                    className="w-full"
                    disabled={!preferences.enabled}
                  />
                </div>

                <Separator />

                {/* Alert Type Settings */}
                <div className="space-y-4">
                  <h4 className="text-base font-medium">Alert Types</h4>
                  
                  {[
                    { type: 'critical' as AlertType, label: 'Critical Alerts', description: 'Emergency situations requiring immediate attention' },
                    { type: 'warning' as AlertType, label: 'Warning Alerts', description: 'Important safety warnings and updates' },
                    { type: 'info' as AlertType, label: 'Information Alerts', description: 'General community updates and news' },
                    { type: 'safe' as AlertType, label: 'Safety Confirmations', description: 'All-clear and safety confirmations' }
                  ].map(({ type, label, description }) => (
                    <div key={type} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center space-x-2">
                            {getAlertIcon(type)}
                            <Label htmlFor={`alert-${type}`} className="font-medium">
                              {label}
                            </Label>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {description}
                          </p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleTestSound(type)}
                            disabled={!preferences.enabled || isTesting === type}
                          >
                            {isTesting === type ? 'Playing...' : 'Test'}
                          </Button>
                          <Switch
                            id={`alert-${type}`}
                            checked={preferences[type]}
                            onCheckedChange={(checked) => handlePreferenceChange(type, checked)}
                            disabled={!preferences.enabled}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <Separator />

                {/* Browser Notifications */}
                <div className="space-y-3">
                  <h4 className="text-base font-medium">Browser Notifications</h4>
                  <p className="text-sm text-muted-foreground">
                    Enable browser notifications to receive alerts even when the app is not in focus
                  </p>
                  <Button
                    variant="outline"
                    onClick={() => notificationService.requestPermission()}
                    className="w-full"
                  >
                    Enable Browser Notifications
                  </Button>
                </div>
              </div>
            </>
          )}

          {/* Footer Actions */}
          <div className="flex justify-end space-x-2">
            {mode === 'view' && (
              <Button variant="outline" onClick={onClose}>
                Close
              </Button>
            )}
            {mode === 'settings' && (
              <Button onClick={onClose}>
                Save Settings
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default NotificationView;
