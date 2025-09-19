import { useState } from 'react';
import { User, MapPin, Bell, Shield, Settings, Edit, Save, X } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';

const Profile = () => {
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  
  const [profile, setProfile] = useState({
    name: 'Alex Johnson',
    email: 'alex.johnson@email.com',
    phone: '+1 (555) 123-4567',
    address: '123 Safe Street, Secure City, SC 12345',
    emergencyContact: 'Sarah Johnson - (555) 987-6543'
  });

  const [notifications, setNotifications] = useState({
    alerts: true,
    community: true,
    emergency: true,
    marketing: false
  });

  const [privacy, setPrivacy] = useState({
    shareLocation: true,
    showProfile: false,
    allowMessages: true,
    verifiedOnly: true
  });

  const handleSave = () => {
    toast({
      title: "Profile Updated",
      description: "Your profile settings have been saved successfully.",
    });
    setIsEditing(false);
  };

  const userStats = [
    { label: 'Reports Submitted', value: '12', color: 'text-primary' },
    { label: 'Community Score', value: '87', color: 'text-success' },
    { label: 'Verified Reports', value: '9', color: 'text-blue-500' },
    { label: 'Days Active', value: '45', color: 'text-purple-500' }
  ];

  return (
    <div className="container mx-auto px-4 py-6 max-w-4xl space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Profile Settings</h1>
          <p className="text-muted-foreground">Manage your account and safety preferences</p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="outline" className="flex items-center space-x-1">
            <Shield className="h-3 w-3" />
            <span>Verified Member</span>
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center space-x-2">
                  <User className="h-5 w-5 text-primary" />
                  <span>Personal Information</span>
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsEditing(!isEditing)}
                >
                  {isEditing ? <X className="h-4 w-4" /> : <Edit className="h-4 w-4" />}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-4 mb-6">
                <Avatar className="h-16 w-16">
                  <AvatarFallback className="bg-primary text-primary-foreground text-xl font-bold">
                    AJ
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-lg font-semibold">{profile.name}</h3>
                  <p className="text-sm text-muted-foreground">Active since March 2024</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    value={profile.name}
                    onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                    disabled={!isEditing}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={profile.email}
                    onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                    disabled={!isEditing}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    value={profile.phone}
                    onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                    disabled={!isEditing}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address">Home Address</Label>
                  <Input
                    id="address"
                    value={profile.address}
                    onChange={(e) => setProfile({ ...profile, address: e.target.value })}
                    disabled={!isEditing}
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="emergency">Emergency Contact</Label>
                  <Input
                    id="emergency"
                    value={profile.emergencyContact}
                    onChange={(e) => setProfile({ ...profile, emergencyContact: e.target.value })}
                    disabled={!isEditing}
                  />
                </div>
              </div>

              {isEditing && (
                <div className="flex space-x-2 pt-4">
                  <Button onClick={handleSave} size="sm">
                    <Save className="h-4 w-4 mr-2" />
                    Save Changes
                  </Button>
                  <Button variant="outline" onClick={() => setIsEditing(false)} size="sm">
                    Cancel
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Notification Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Bell className="h-5 w-5 text-primary" />
                <span>Notification Preferences</span>
              </CardTitle>
              <CardDescription>
                Choose what notifications you want to receive
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="alerts">Safety Alerts</Label>
                  <p className="text-sm text-muted-foreground">Critical safety notifications</p>
                </div>
                <Switch
                  id="alerts"
                  checked={notifications.alerts}
                  onCheckedChange={(checked) => setNotifications({ ...notifications, alerts: checked })}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="community">Community Updates</Label>
                  <p className="text-sm text-muted-foreground">Neighborhood events and news</p>
                </div>
                <Switch
                  id="community"
                  checked={notifications.community}
                  onCheckedChange={(checked) => setNotifications({ ...notifications, community: checked })}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="emergency">Emergency Broadcasts</Label>
                  <p className="text-sm text-muted-foreground">Emergency services and weather alerts</p>
                </div>
                <Switch
                  id="emergency"
                  checked={notifications.emergency}
                  onCheckedChange={(checked) => setNotifications({ ...notifications, emergency: checked })}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="marketing">Marketing Communications</Label>
                  <p className="text-sm text-muted-foreground">Product updates and promotions</p>
                </div>
                <Switch
                  id="marketing"
                  checked={notifications.marketing}
                  onCheckedChange={(checked) => setNotifications({ ...notifications, marketing: checked })}
                />
              </div>
            </CardContent>
          </Card>

          {/* Privacy Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Shield className="h-5 w-5 text-primary" />
                <span>Privacy & Security</span>
              </CardTitle>
              <CardDescription>
                Control your privacy and data sharing preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="location">Share Location</Label>
                  <p className="text-sm text-muted-foreground">Allow location sharing for better alerts</p>
                </div>
                <Switch
                  id="location"
                  checked={privacy.shareLocation}
                  onCheckedChange={(checked) => setPrivacy({ ...privacy, shareLocation: checked })}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="profile">Public Profile</Label>
                  <p className="text-sm text-muted-foreground">Make your profile visible to community</p>
                </div>
                <Switch
                  id="profile"
                  checked={privacy.showProfile}
                  onCheckedChange={(checked) => setPrivacy({ ...privacy, showProfile: checked })}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="messages">Allow Messages</Label>
                  <p className="text-sm text-muted-foreground">Receive messages from other users</p>
                </div>
                <Switch
                  id="messages"
                  checked={privacy.allowMessages}
                  onCheckedChange={(checked) => setPrivacy({ ...privacy, allowMessages: checked })}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="verified">Verified Users Only</Label>
                  <p className="text-sm text-muted-foreground">Only receive alerts from verified users</p>
                </div>
                <Switch
                  id="verified"
                  checked={privacy.verifiedOnly}
                  onCheckedChange={(checked) => setPrivacy({ ...privacy, verifiedOnly: checked })}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* User Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Activity Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {userStats.map((stat, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">{stat.label}</span>
                  <span className={`text-xl font-bold ${stat.color}`}>{stat.value}</span>
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
                Update Location
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Settings className="h-4 w-4 mr-2" />
                Account Settings
              </Button>
              <Button variant="outline" className="w-full justify-start text-destructive hover:text-destructive">
                <X className="h-4 w-4 mr-2" />
                Delete Account
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Profile;