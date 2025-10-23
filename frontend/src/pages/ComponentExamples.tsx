import { useState } from 'react';
import { Shield, Heart, Trash2, Save, Settings, Home, User, HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import Layout from '@/components/Layout';
import Navigation, { NavItem } from '@/components/Navigation';
import Footer from '@/components/Footer';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

const ComponentExamples = () => {
  const [notificationCount, setNotificationCount] = useState(5);

  // Custom navigation items for demonstration
  const customNavItems: NavItem[] = [
    { path: '/examples', label: 'Examples', icon: HelpCircle },
    { path: '/dashboard', label: 'Dashboard', icon: Shield },
    { path: '/settings', label: 'Settings', icon: Settings },
    { path: '/profile', label: 'Profile', icon: User },
  ];

  const handleNotificationClick = () => {
    setNotificationCount(prev => Math.max(0, prev - 1));
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="space-y-12 p-8">
        {/* Page Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-foreground">UI Component Examples</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Comprehensive examples of all reusable UI components including Button variants, 
            Card layouts, Navigation configurations, Footer customizations, and Layout compositions.
          </p>
        </div>

        {/* Button Component Examples */}
        <section className="space-y-6">
          <div>
            <h2 className="text-2xl font-semibold mb-4">Button Component</h2>
            <p className="text-muted-foreground mb-6">
              The Button component supports multiple variants: primary (default), secondary, and danger (destructive).
            </p>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Button Variants</CardTitle>
              <CardDescription>
                All button variants with different sizes and configurations
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Variants */}
              <div>
                <h4 className="font-medium mb-3">Variants</h4>
                <div className="flex flex-wrap gap-3">
                  <Button variant="default">Primary Button</Button>
                  <Button variant="secondary">Secondary Button</Button>
                  <Button variant="destructive">Danger Button</Button>
                  <Button variant="outline">Outline Button</Button>
                  <Button variant="ghost">Ghost Button</Button>
                  <Button variant="link">Link Button</Button>
                </div>
              </div>

              <Separator />

              {/* Sizes */}
              <div>
                <h4 className="font-medium mb-3">Sizes</h4>
                <div className="flex flex-wrap items-center gap-3">
                  <Button size="sm">Small</Button>
                  <Button size="default">Default</Button>
                  <Button size="lg">Large</Button>
                  <Button size="icon"><Settings className="h-4 w-4" /></Button>
                </div>
              </div>

              <Separator />

              {/* With Icons */}
              <div>
                <h4 className="font-medium mb-3">With Icons</h4>
                <div className="flex flex-wrap gap-3">
                  <Button>
                    <Save className="h-4 w-4 mr-2" />
                    Save Changes
                  </Button>
                  <Button variant="destructive">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Item
                  </Button>
                  <Button variant="outline">
                    <Heart className="h-4 w-4 mr-2" />
                    Add to Favorites
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Card Component Examples */}
        <section className="space-y-6">
          <div>
            <h2 className="text-2xl font-semibold mb-4">Card Component</h2>
            <p className="text-muted-foreground mb-6">
              The Card component provides a flexible container for displaying content with headers, descriptions, content areas, and footers.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Simple Card */}
            <Card>
              <CardHeader>
                <CardTitle>Simple Card</CardTitle>
                <CardDescription>
                  A basic card with header and content
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  This is a simple card example showing the basic structure and styling.
                </p>
              </CardContent>
            </Card>

            {/* Card with Footer */}
            <Card>
              <CardHeader>
                <CardTitle>Feature Card</CardTitle>
                <CardDescription>
                  Enhanced security features
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Shield className="h-4 w-4 text-primary" />
                    <span className="text-sm">End-to-end encryption</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Shield className="h-4 w-4 text-primary" />
                    <span className="text-sm">Real-time monitoring</span>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button className="w-full">Learn More</Button>
              </CardFooter>
            </Card>

            {/* Interactive Card */}
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Interactive Card</CardTitle>
                  <Badge>New</Badge>
                </div>
                <CardDescription>
                  Click to interact with this card
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  This card has hover effects and could trigger actions when clicked.
                </p>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button variant="outline">Cancel</Button>
                <Button>Continue</Button>
              </CardFooter>
            </Card>
          </div>
        </section>

        {/* Navigation Component Examples */}
        <section className="space-y-6">
          <div>
            <h2 className="text-2xl font-semibold mb-4">Navigation Component</h2>
            <p className="text-muted-foreground mb-6">
              Customizable navigation bar with different configurations, custom logos, and navigation items.
            </p>
          </div>

          <div className="space-y-8">
            {/* Default Navigation */}
            <Card>
              <CardHeader>
                <CardTitle>Default Navigation</CardTitle>
                <CardDescription>Standard navigation with default settings</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="border rounded-lg overflow-hidden">
                  <Navigation 
                    sticky={false}
                    notificationCount={notificationCount}
                    onNotificationClick={handleNotificationClick}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Custom Navigation */}
            <Card>
              <CardHeader>
                <CardTitle>Custom Navigation</CardTitle>
                <CardDescription>Navigation with custom logo, items, and no notifications</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="border rounded-lg overflow-hidden">
                  <Navigation 
                    sticky={false}
                    logoText="CustomApp"
                    logoIcon={Home}
                    navItems={customNavItems}
                    showNotifications={false}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Footer Component Examples */}
        <section className="space-y-6">
          <div>
            <h2 className="text-2xl font-semibold mb-4">Footer Component</h2>
            <p className="text-muted-foreground mb-6">
              Flexible footer component with customizable sections, social links, and contact information.
            </p>
          </div>

          <div className="space-y-8">
            {/* Default Footer */}
            <Card>
              <CardHeader>
                <CardTitle>Default Footer</CardTitle>
                <CardDescription>Complete footer with all sections enabled</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="border rounded-lg overflow-hidden">
                  <Footer />
                </div>
              </CardContent>
            </Card>

            {/* Minimal Footer */}
            <Card>
              <CardHeader>
                <CardTitle>Minimal Footer</CardTitle>
                <CardDescription>Simplified footer without social links and contact info</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="border rounded-lg overflow-hidden">
                  <Footer 
                    showSocialLinks={false}
                    showContactInfo={false}
                    companyName="MinimalApp"
                    customLinks={[
                      { label: 'About', href: '/about' },
                      { label: 'Contact', href: '/contact' }
                    ]}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Layout Component Example */}
        <section className="space-y-6">
          <div>
            <h2 className="text-2xl font-semibold mb-4">Layout Component</h2>
            <p className="text-muted-foreground mb-6">
              Complete layout wrapper that combines Navigation and Footer components with flexible content area.
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Layout Usage</CardTitle>
              <CardDescription>
                Example showing how the Layout component wraps page content
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="bg-muted p-4 rounded-lg">
                  <h4 className="font-medium mb-2">Basic Layout Usage:</h4>
                  <pre className="text-sm text-muted-foreground overflow-x-auto">
{`<Layout>
  <YourPageContent />
</Layout>`}
                  </pre>
                </div>
                
                <div className="bg-muted p-4 rounded-lg">
                  <h4 className="font-medium mb-2">Custom Layout with Props:</h4>
                  <pre className="text-sm text-muted-foreground overflow-x-auto">
{`<Layout
  navigationProps={{ 
    logoText: "CustomApp",
    showNotifications: false 
  }}
  footerProps={{ 
    showSocialLinks: false,
    companyName: "MyCompany" 
  }}
>
  <YourPageContent />
</Layout>`}
                  </pre>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Implementation Notes */}
        <section className="space-y-6">
          <div>
            <h2 className="text-2xl font-semibold mb-4">Implementation Notes</h2>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Component Features</CardTitle>
              <CardDescription>
                Key features and customization options for each component
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h4 className="font-medium mb-2">✅ Button Component</h4>
                <ul className="text-sm text-muted-foreground space-y-1 ml-4">
                  <li>• Primary, secondary, and danger variants</li>
                  <li>• Multiple sizes (sm, default, lg, icon)</li>
                  <li>• Support for icons and custom styling</li>
                  <li>• Accessible with proper focus states</li>
                </ul>
              </div>

              <div>
                <h4 className="font-medium mb-2">✅ Card Component</h4>
                <ul className="text-sm text-muted-foreground space-y-1 ml-4">
                  <li>• Flexible layout with header, content, and footer sections</li>
                  <li>• Composable sub-components for maximum flexibility</li>
                  <li>• Built-in styling with customization options</li>
                  <li>• Responsive design with proper spacing</li>
                </ul>
              </div>

              <div>
                <h4 className="font-medium mb-2">✅ Navigation Component</h4>
                <ul className="text-sm text-muted-foreground space-y-1 ml-4">
                  <li>• Customizable logo, text, and navigation items</li>
                  <li>• Optional notification system with counts</li>
                  <li>• Responsive mobile menu with hamburger toggle</li>
                  <li>• Sticky positioning and custom styling support</li>
                </ul>
              </div>

              <div>
                <h4 className="font-medium mb-2">✅ Footer Component</h4>
                <ul className="text-sm text-muted-foreground space-y-1 ml-4">
                  <li>• Configurable sections (social links, contact info, etc.)</li>
                  <li>• Custom links and copyright information</li>
                  <li>• Responsive grid layout for different screen sizes</li>
                  <li>• Company branding and social media integration</li>
                </ul>
              </div>

              <div>
                <h4 className="font-medium mb-2">✅ Layout Component</h4>
                <ul className="text-sm text-muted-foreground space-y-1 ml-4">
                  <li>• Combines Navigation and Footer in a complete layout</li>
                  <li>• Props pass-through for customizing child components</li>
                  <li>• Flexible content area with custom styling options</li>
                  <li>• Optional navigation and footer display controls</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  );
};

export default ComponentExamples;
