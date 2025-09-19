import { Link } from 'react-router-dom';
import { Shield, MapPin, Users, Clock, AlertTriangle, ArrowRight, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import heroImage from '@/assets/hero-safety.jpg';

const Homepage = () => {
  const features = [
    {
      icon: AlertTriangle,
      title: 'Real-Time Alerts',
      description: 'Get instant notifications about safety incidents, traffic accidents, and emergency situations in your area.'
    },
    {
      icon: MapPin,
      title: 'Safe Route Navigation',
      description: 'Find the safest routes to your destination based on real-time community data and verified reports.'
    },
    {
      icon: Users,
      title: 'Community Verified',
      description: 'All reports are verified by community members and local authorities for accuracy and reliability.'
    },
    {
      icon: Shield,
      title: 'Privacy Protected',
      description: 'Your location and personal data are encrypted and protected with industry-standard security measures.'
    }
  ];

  const stats = [
    { number: '15,000+', label: 'Active Users' },
    { number: '98%', label: 'Verified Reports' },
    { number: '2.3 min', label: 'Avg Response Time' },
    { number: '24/7', label: 'Community Coverage' }
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary/10 via-background to-secondary/10">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent" />
        <div className="container mx-auto px-4 py-16 lg:py-24">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div className="space-y-4">
                <Badge className="w-fit bg-primary/10 text-primary border-primary/20">
                  Real-Time Safety Platform
                </Badge>
                <h1 className="text-4xl lg:text-6xl font-bold text-foreground leading-tight">
                  Stay Safe with{' '}
                  <span className="text-primary">Community</span>{' '}
                  Intelligence
                </h1>
                <p className="text-lg text-muted-foreground max-w-lg">
                  SecurePath connects communities through real-time safety alerts, verified incident reports, 
                  and intelligent route planning to keep you and your loved ones safe.
                </p>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <Button size="lg" asChild className="h-12 px-8">
                  <Link to="/dashboard" className="flex items-center space-x-2">
                    <Shield className="h-5 w-5" />
                    <span>Get Started</span>
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
                <Button variant="outline" size="lg" asChild className="h-12 px-8">
                  <Link to="/map" className="flex items-center space-x-2">
                    <MapPin className="h-5 w-5" />
                    <span>View Safety Map</span>
                  </Link>
                </Button>
              </div>
            </div>

            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-2xl blur-3xl" />
              <div className="relative rounded-2xl overflow-hidden shadow-2xl">
                <img 
                  src={heroImage} 
                  alt="Community safety and security" 
                  className="w-full h-[400px] lg:h-[500px] object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center space-y-2">
                <div className="text-3xl lg:text-4xl font-bold text-primary">{stat.number}</div>
                <div className="text-sm text-muted-foreground font-medium">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="text-center space-y-4 mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold text-foreground">
              Comprehensive Safety Features
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Our platform combines community intelligence with advanced technology to provide 
              real-time safety insights and protection for your neighborhood.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <Card key={index} className="relative overflow-hidden group hover:shadow-lg transition-all duration-300">
                  <CardHeader>
                    <div className="flex items-center space-x-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                        <Icon className="h-6 w-6 text-primary" />
                      </div>
                      <CardTitle className="text-xl">{feature.title}</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">{feature.description}</p>
                  </CardContent>
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-br from-primary/10 to-secondary/10">
        <div className="container mx-auto px-4">
          <Card className="border-0 bg-card/80 backdrop-blur-sm">
            <CardContent className="p-8 lg:p-12">
              <div className="text-center space-y-6">
                <div className="space-y-3">
                  <h2 className="text-3xl lg:text-4xl font-bold text-foreground">
                    Join Our Safety Community
                  </h2>
                  <p className="text-muted-foreground max-w-2xl mx-auto">
                    Be part of a connected community that looks out for each other. 
                    Start receiving real-time safety updates and contribute to neighborhood security.
                  </p>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button size="lg" asChild className="h-12 px-8">
                    <Link to="/dashboard" className="flex items-center space-x-2">
                      <CheckCircle className="h-5 w-5" />
                      <span>Start Protecting Your Community</span>
                    </Link>
                  </Button>
                  <Button variant="outline" size="lg" asChild className="h-12 px-8">
                    <Link to="/report" className="flex items-center space-x-2">
                      <AlertTriangle className="h-5 w-5" />
                      <span>Report an Incident</span>
                    </Link>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
};

export default Homepage;