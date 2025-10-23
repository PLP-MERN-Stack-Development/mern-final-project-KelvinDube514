import { TrendingUp, TrendingDown, Shield, Users, MapPin, Clock } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import ShinyText from '@/components/ui/ShinyText';

const SafetyMetrics = () => {
  const metrics = [
    {
      title: 'Safety Score',
      value: '87%',
      change: '+5%',
      trend: 'up',
      description: 'vs last week',
      icon: Shield,
      color: 'text-success'
    },
    {
      title: 'Active Alerts',
      value: '4',
      change: '-2',
      trend: 'down',
      description: 'in your area',
      icon: MapPin,
      color: 'text-warning'
    },
    {
      title: 'Community Members',
      value: '1,247',
      change: '+23',
      trend: 'up',
      description: 'active this week',
      icon: Users,
      color: 'text-primary'
    },
    {
      title: 'Response Time',
      value: '3.2 min',
      change: '-0.8 min',
      trend: 'down',
      description: 'average response',
      icon: Clock,
      color: 'text-success'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {metrics.map((metric, index) => {
        const Icon = metric.icon;
        const isPositive = 
          (metric.trend === 'up' && (metric.title === 'Safety Score' || metric.title === 'Community Members')) ||
          (metric.trend === 'down' && (metric.title === 'Active Alerts' || metric.title === 'Response Time'));
        
        return (
          <Card key={index} className="relative overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                <ShinyText text={metric.title} speed={3} />
              </CardTitle>
              <Icon className={`h-4 w-4 ${metric.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground mb-1">
                <ShinyText text={metric.value} speed={2} />
              </div>
              <div className="flex items-center space-x-2">
                <div className={`flex items-center text-sm ${
                  isPositive ? 'text-success' : 'text-destructive'
                }`}>
                  {metric.trend === 'up' ? (
                    <TrendingUp className="h-3 w-3 mr-1" />
                  ) : (
                    <TrendingDown className="h-3 w-3 mr-1" />
                  )}
                  {metric.change}
                </div>
                <span className="text-xs text-muted-foreground">
                  {metric.description}
                </span>
              </div>
            </CardContent>
            
            {/* Subtle background gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent pointer-events-none" />
          </Card>
        );
      })}
    </div>
  );
};

export default SafetyMetrics;