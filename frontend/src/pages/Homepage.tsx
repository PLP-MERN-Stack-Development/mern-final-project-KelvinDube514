import { Link } from 'react-router-dom';
import { Shield, MapPin, Users, Clock, AlertTriangle, ArrowRight, CheckCircle, LogIn, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Navigation from '@/components/Navigation';
import ShinyText from '@/components/ui/ShinyText';
import { useProfile } from '@/hooks/useApi';
import bannerVideo from '@/assets/Banner.mp4';

const Homepage = () => {
  const { data: profile } = useProfile();
  const isAuthenticated = !!profile;

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
      {/* Navigation */}
      <Navigation />
      
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary/10 via-background to-secondary/10">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent" />
        <div className="container mx-auto px-4 py-16 lg:py-24">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div className="space-y-4">
                <Badge className="w-fit bg-primary/10 text-primary border-primary/20">
                  <ShinyText text="Real-Time Safety Platform" speed={3} />
                </Badge>
                <h1 className="text-4xl lg:text-6xl font-bold text-foreground leading-tight">
                  <ShinyText text="Stay Safe with " speed={4} />
                  <span className="text-primary"><ShinyText text="Community" speed={3} /></span>{' '}
                  <ShinyText text="Intelligence" speed={4} />
                </h1>
                <p className="text-lg text-muted-foreground max-w-lg">
                  <ShinyText text="SecurePath connects communities through real-time safety alerts, verified incident reports, and intelligent route planning to keep you and your loved ones safe." speed={5} />
                </p>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4">
                {isAuthenticated ? (
                  <>
                    <Button size="lg" asChild className="h-12 px-8">
                      <Link to="/dashboard" className="flex items-center space-x-2">
                        <Shield className="h-5 w-5" />
                        <span><ShinyText text="Go to Dashboard" speed={3} /></span>
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    </Button>
                    <Button variant="outline" size="lg" asChild className="h-12 px-8">
                      <Link to="/map" className="flex items-center space-x-2">
                        <MapPin className="h-5 w-5" />
                        <span><ShinyText text="View Safety Map" speed={3} /></span>
                      </Link>
                    </Button>
                  </>
                ) : (
                  <>
                    <Button size="lg" asChild className="h-12 px-8">
                      <Link to="/signup" className="flex items-center space-x-2">
                        <UserPlus className="h-5 w-5" />
                        <span><ShinyText text="Get Started" speed={3} /></span>
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    </Button>
                    <Button variant="outline" size="lg" asChild className="h-12 px-8">
                      <Link to="/login" className="flex items-center space-x-2">
                        <LogIn className="h-5 w-5" />
                        <span><ShinyText text="Sign In" speed={3} /></span>
                      </Link>
                    </Button>
                  </>
                )}
              </div>
            </div>

            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-2xl blur-3xl" />
              <div className="relative rounded-2xl overflow-hidden shadow-2xl">
                <video 
                  src={bannerVideo}
                  autoPlay
                  muted
                  loop
                  playsInline
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
                <div className="text-3xl lg:text-4xl font-bold text-primary">
                  <ShinyText text={stat.number} speed={2} />
                </div>
                <div className="text-sm text-muted-foreground font-medium">
                  <ShinyText text={stat.label} speed={4} />
                </div>
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
              <ShinyText text="Comprehensive Safety Features" speed={4} />
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              <ShinyText text="Our platform combines community intelligence with advanced technology to provide real-time safety insights and protection for your neighborhood." speed={5} />
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
                      <CardTitle className="text-xl">
                        <ShinyText text={feature.title} speed={3} />
                      </CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">
                      <ShinyText text={feature.description} speed={5} />
                    </p>
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
                    <ShinyText text="Join Our Safety Community" speed={4} />
                  </h2>
                  <p className="text-muted-foreground max-w-2xl mx-auto">
                    <ShinyText text="Be part of a connected community that looks out for each other. Start receiving real-time safety updates and contribute to neighborhood security." speed={5} />
                  </p>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  {isAuthenticated ? (
                    <>
                      <Button size="lg" asChild className="h-12 px-8">
                        <Link to="/dashboard" className="flex items-center space-x-2">
                          <CheckCircle className="h-5 w-5" />
                          <span><ShinyText text="View Your Dashboard" speed={3} /></span>
                        </Link>
                      </Button>
                      <Button variant="outline" size="lg" asChild className="h-12 px-8">
                        <Link to="/report" className="flex items-center space-x-2">
                          <AlertTriangle className="h-5 w-5" />
                          <span><ShinyText text="Report an Incident" speed={3} /></span>
                        </Link>
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button size="lg" asChild className="h-12 px-8">
                        <Link to="/signup" className="flex items-center space-x-2">
                          <CheckCircle className="h-5 w-5" />
                          <span><ShinyText text="Join Our Community" speed={3} /></span>
                        </Link>
                      </Button>
                      <Button variant="outline" size="lg" asChild className="h-12 px-8">
                        <Link to="/login" className="flex items-center space-x-2">
                          <LogIn className="h-5 w-5" />
                          <span><ShinyText text="Sign In" speed={3} /></span>
                        </Link>
                      </Button>
                    </>
                  )}
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