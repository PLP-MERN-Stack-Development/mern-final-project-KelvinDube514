import React, { useState, useEffect } from 'react';
import { Bell, Clock, Filter, Search, Trash2, Eye, EyeOff, Volume2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import ShinyText from '@/components/ui/ShinyText';
import NotificationView from '@/components/NotificationView';
import { useRealTime } from '@/hooks/useRealTime';
import { formatDistanceToNow } from 'date-fns';

interface NotificationItem {
  id: string;
  type: 'alert' | 'incident' | 'system';
  title: string;
  message: string;
  timestamp: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  read: boolean;
  location?: string;
}

const Notifications = () => {
  const { alerts, incidents, notifications: systemNotifications, markAlertAsRead } = useRealTime();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'alert' | 'incident' | 'system'>('all');
  const [filterRead, setFilterRead] = useState<'all' | 'read' | 'unread'>('all');
  const [selectedNotification, setSelectedNotification] = useState<NotificationItem | null>(null);
  const [showNotificationView, setShowNotificationView] = useState(false);

  // Combine all notifications into a single list
  useEffect(() => {
    const allNotifications: NotificationItem[] = [
      // Convert real-time alerts
      ...alerts.map(alert => ({
        id: alert.id,
        type: 'alert' as const,
        title: alert.title,
        message: alert.message,
        timestamp: alert.createdAt,
        priority: alert.priority === 'critical' || alert.priority === 'urgent' ? 'critical' as const :
                 alert.priority === 'high' ? 'high' as const :
                 alert.priority === 'medium' ? 'medium' as const : 'low' as const,
        read: false,
        location: alert.location.address
      })),
      // Convert incidents
      ...incidents.map(incident => ({
        id: incident.id,
        type: 'incident' as const,
        title: incident.title,
        message: incident.description,
        timestamp: incident.createdAt,
        priority: incident.severity as 'low' | 'medium' | 'high' | 'critical',
        read: false,
        location: incident.location.address
      })),
      // Convert system notifications
      ...systemNotifications.map((notification, index) => ({
        id: `system-${index}-${notification.timestamp}`,
        type: 'system' as const,
        title: notification.title || 'System Notification',
        message: notification.message || 'System notification received',
        timestamp: new Date(notification.timestamp).toISOString(),
        priority: 'medium' as const,
        read: false
      }))
    ];

    // Sort by timestamp (newest first)
    allNotifications.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    
    setNotifications(allNotifications);
  }, [alerts, incidents, systemNotifications]);

  // Filter notifications
  const filteredNotifications = notifications.filter(notification => {
    const matchesSearch = notification.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         notification.message.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesType = filterType === 'all' || notification.type === filterType;
    
    const matchesRead = filterRead === 'all' || 
                       (filterRead === 'read' && notification.read) ||
                       (filterRead === 'unread' && !notification.read);

    return matchesSearch && matchesType && matchesRead;
  });

  const handleNotificationClick = (notification: NotificationItem) => {
    setSelectedNotification(notification);
    setShowNotificationView(true);
    
    // Mark as read
    setNotifications(prev => prev.map(n => 
      n.id === notification.id ? { ...n, read: true } : n
    ));
    
    // If it's an alert, also mark it as read in the real-time service
    if (notification.type === 'alert') {
      markAlertAsRead(notification.id);
    }
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const clearAll = () => {
    setNotifications([]);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical':
        return 'text-destructive border-destructive';
      case 'high':
        return 'text-warning border-warning';
      case 'medium':
        return 'text-blue-500 border-blue-500';
      case 'low':
        return 'text-success border-success';
      default:
        return 'text-muted-foreground border-border';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'alert':
        return <Bell className="h-4 w-4" />;
      case 'incident':
        return <Bell className="h-4 w-4" />;
      case 'system':
        return <Bell className="h-4 w-4" />;
      default:
        return <Bell className="h-4 w-4" />;
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            <ShinyText text="Notifications" speed={4} />
          </h1>
          <p className="text-muted-foreground">
            <ShinyText text={`${notifications.length} total notifications (${unreadCount} unread)`} speed={5} />
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={markAllAsRead} disabled={unreadCount === 0}>
            <Eye className="h-4 w-4 mr-2" />
            Mark All Read
          </Button>
          <Button variant="outline" onClick={clearAll} disabled={notifications.length === 0}>
            <Trash2 className="h-4 w-4 mr-2" />
            Clear All
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Filter className="h-5 w-5 text-primary" />
            <span><ShinyText text="Filters" speed={3} /></span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search notifications..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={filterType} onValueChange={(value: any) => setFilterType(value)}>
              <SelectTrigger className="w-full md:w-40">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="alert">Alerts</SelectItem>
                <SelectItem value="incident">Incidents</SelectItem>
                <SelectItem value="system">System</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterRead} onValueChange={(value: any) => setFilterRead(value)}>
              <SelectTrigger className="w-full md:w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="unread">Unread</SelectItem>
                <SelectItem value="read">Read</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Notifications List */}
      <div className="space-y-4">
        {filteredNotifications.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <Bell className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold text-muted-foreground mb-2">
                No notifications found
              </h3>
              <p className="text-sm text-muted-foreground">
                {notifications.length === 0 
                  ? "You don't have any notifications yet"
                  : "Try adjusting your filters"
                }
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredNotifications.map((notification) => (
            <Card 
              key={notification.id} 
              className={`cursor-pointer transition-all hover:shadow-md ${
                notification.read ? 'opacity-60' : 'border-l-4 border-l-primary'
              }`}
              onClick={() => handleNotificationClick(notification)}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3 flex-1">
                    <div className="mt-1">
                      {getTypeIcon(notification.type)}
                    </div>
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center justify-between">
                        <h3 className={`font-semibold ${notification.read ? 'text-muted-foreground' : 'text-foreground'}`}>
                          <ShinyText text={notification.title} speed={3} />
                        </h3>
                        <div className="flex items-center space-x-2">
                          {!notification.read && (
                            <div className="h-2 w-2 bg-primary rounded-full" />
                          )}
                          <Badge 
                            variant="outline" 
                            className={`capitalize ${getPriorityColor(notification.priority)}`}
                          >
                            {notification.priority}
                          </Badge>
                        </div>
                      </div>
                      
                      <p className="text-sm text-muted-foreground">
                        <ShinyText text={notification.message} speed={5} />
                      </p>
                      
                      <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                        <div className="flex items-center space-x-1">
                          <Clock className="h-3 w-3" />
                          <span>{formatDistanceToNow(new Date(notification.timestamp), { addSuffix: true })}</span>
                        </div>
                        {notification.location && (
                          <span>{notification.location}</span>
                        )}
                        <Badge variant="secondary" className="text-xs capitalize">
                          {notification.type}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Notification Detail View */}
      <NotificationView
        alert={selectedNotification ? {
          id: parseInt(selectedNotification.id.replace(/\D/g, '') || '0'),
          type: selectedNotification.type === 'alert' ? selectedNotification.priority as any : 'info',
          title: selectedNotification.title,
          location: selectedNotification.location || 'Unknown',
          time: formatDistanceToNow(new Date(selectedNotification.timestamp), { addSuffix: true }),
          distance: '—',
          verified: true,
          description: selectedNotification.message,
          fullDescription: selectedNotification.message,
          priority: selectedNotification.priority
        } : undefined}
        isOpen={showNotificationView}
        onClose={() => {
          setShowNotificationView(false);
          setSelectedNotification(null);
        }}
        mode="view"
      />
    </div>
  );
};

export default Notifications;
