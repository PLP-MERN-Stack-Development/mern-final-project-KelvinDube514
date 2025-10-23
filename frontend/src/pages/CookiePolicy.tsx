import { Cookie, Settings, Eye, Shield, Database, Users } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Layout from '@/components/Layout';

const CookiePolicy = () => {
  const lastUpdated = "December 2024";

  const cookieTypes = [
    {
      title: "Essential Cookies",
      icon: Shield,
      description: "Required for basic website functionality",
      examples: [
        "Authentication and login status",
        "Security and fraud prevention",
        "Load balancing and performance",
        "Basic user preferences"
      ],
      canDisable: false
    },
    {
      title: "Analytics Cookies",
      icon: Database,
      description: "Help us understand how you use our platform",
      examples: [
        "Page views and user interactions",
        "Feature usage statistics",
        "Performance monitoring",
        "Error tracking and debugging"
      ],
      canDisable: true
    },
    {
      title: "Functional Cookies",
      icon: Settings,
      description: "Remember your preferences and settings",
      examples: [
        "Language and region preferences",
        "Theme and display settings",
        "Notification preferences",
        "Map view and location settings"
      ],
      canDisable: true
    },
    {
      title: "Marketing Cookies",
      icon: Eye,
      description: "Used for targeted advertising and content",
      examples: [
        "Ad personalization",
        "Social media integration",
        "Content recommendations",
        "Campaign effectiveness tracking"
      ],
      canDisable: true
    }
  ];

  const cookieDetails = [
    {
      name: "_auth_token",
      purpose: "Maintains your login session",
      duration: "Session",
      type: "Essential"
    },
    {
      name: "_csrf_token",
      purpose: "Protects against cross-site request forgery",
      duration: "Session",
      type: "Essential"
    },
    {
      name: "user_preferences",
      purpose: "Stores your display and notification settings",
      duration: "1 year",
      type: "Functional"
    },
    {
      name: "_analytics_id",
      purpose: "Tracks anonymous usage statistics",
      duration: "2 years",
      type: "Analytics"
    },
    {
      name: "map_settings",
      purpose: "Remembers your map view preferences",
      duration: "6 months",
      type: "Functional"
    }
  ];

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-4">
            <Cookie className="h-12 w-12 text-primary mr-3" />
            <h1 className="text-4xl font-bold">Cookie Policy</h1>
          </div>
          <p className="text-xl text-muted-foreground mb-4">
            How we use cookies to enhance your experience
          </p>
          <Badge variant="outline" className="text-sm">
            Last updated: {lastUpdated}
          </Badge>
        </div>

        {/* Introduction */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>What Are Cookies?</CardTitle>
            <CardDescription>
              Cookies are small text files that are stored on your device when you visit our website. 
              They help us provide you with a better experience by remembering your preferences and 
              understanding how you use our platform. This policy explains what cookies we use and how you can control them.
            </CardDescription>
          </CardHeader>
        </Card>

        {/* Cookie Types */}
        <div className="space-y-6 mb-8">
          <h2 className="text-2xl font-semibold">Types of Cookies We Use</h2>
          {cookieTypes.map((cookieType, index) => {
            const Icon = cookieType.icon;
            return (
              <Card key={index}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Icon className="h-6 w-6 text-primary mr-3" />
                      {cookieType.title}
                    </div>
                    {cookieType.canDisable && (
                      <Badge variant="secondary" className="text-xs">
                        Can be disabled
                      </Badge>
                    )}
                  </CardTitle>
                  <CardDescription>{cookieType.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <h4 className="font-medium">Examples:</h4>
                    <ul className="space-y-1">
                      {cookieType.examples.map((example, exampleIndex) => (
                        <li key={exampleIndex} className="flex items-start text-sm text-muted-foreground">
                          <div className="w-1.5 h-1.5 bg-primary rounded-full mt-2 mr-2 flex-shrink-0" />
                          {example}
                        </li>
                      ))}
                    </ul>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Cookie Details Table */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Specific Cookies We Use</CardTitle>
            <CardDescription>
              Detailed information about the cookies used on our platform
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-3 font-medium">Cookie Name</th>
                    <th className="text-left p-3 font-medium">Purpose</th>
                    <th className="text-left p-3 font-medium">Duration</th>
                    <th className="text-left p-3 font-medium">Type</th>
                  </tr>
                </thead>
                <tbody>
                  {cookieDetails.map((cookie, index) => (
                    <tr key={index} className="border-b">
                      <td className="p-3 font-mono text-sm">{cookie.name}</td>
                      <td className="p-3 text-sm text-muted-foreground">{cookie.purpose}</td>
                      <td className="p-3 text-sm">{cookie.duration}</td>
                      <td className="p-3">
                        <Badge 
                          variant={cookie.type === "Essential" ? "default" : "secondary"}
                          className="text-xs"
                        >
                          {cookie.type}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Cookie Management */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Settings className="h-6 w-6 text-primary mr-3" />
              Managing Your Cookie Preferences
            </CardTitle>
            <CardDescription>
              You have control over which cookies you accept. Here's how to manage them:
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div>
                <h4 className="font-medium mb-3">Browser Settings</h4>
                <p className="text-sm text-muted-foreground mb-3">
                  Most web browsers allow you to control cookies through their settings. You can:
                </p>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-start">
                    <div className="w-1.5 h-1.5 bg-primary rounded-full mt-2 mr-2 flex-shrink-0" />
                    Block all cookies (may affect website functionality)
                  </li>
                  <li className="flex items-start">
                    <div className="w-1.5 h-1.5 bg-primary rounded-full mt-2 mr-2 flex-shrink-0" />
                    Delete existing cookies
                  </li>
                  <li className="flex items-start">
                    <div className="w-1.5 h-1.5 bg-primary rounded-full mt-2 mr-2 flex-shrink-0" />
                    Set preferences for specific websites
                  </li>
                </ul>
              </div>

              <div>
                <h4 className="font-medium mb-3">Our Cookie Settings</h4>
                <p className="text-sm text-muted-foreground mb-3">
                  You can also manage your cookie preferences directly through our platform:
                </p>
                <Button variant="outline" className="mr-3">
                  Cookie Settings
                </Button>
                <Button variant="outline">
                  Privacy Dashboard
                </Button>
              </div>

              <div>
                <h4 className="font-medium mb-3">Third-Party Cookies</h4>
                <p className="text-sm text-muted-foreground">
                  Some cookies are set by third-party services we use (like Google Analytics). 
                  You can manage these through your browser settings or by visiting the 
                  respective third-party websites.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Impact of Disabling Cookies */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Impact of Disabling Cookies</CardTitle>
            <CardDescription>
              Understanding what happens when you disable different types of cookies
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-4 border rounded-lg">
                <h4 className="font-medium text-red-600 mb-2">Essential Cookies (Cannot be disabled)</h4>
                <p className="text-sm text-muted-foreground">
                  Disabling these would prevent you from logging in or using basic platform features.
                </p>
              </div>
              <div className="p-4 border rounded-lg">
                <h4 className="font-medium text-yellow-600 mb-2">Functional Cookies</h4>
                <p className="text-sm text-muted-foreground">
                  You'll need to re-enter your preferences each time you visit, and some features may not work as expected.
                </p>
              </div>
              <div className="p-4 border rounded-lg">
                <h4 className="font-medium text-blue-600 mb-2">Analytics Cookies</h4>
                <p className="text-sm text-muted-foreground">
                  We won't be able to improve our platform based on usage patterns, but your experience won't be affected.
                </p>
              </div>
              <div className="p-4 border rounded-lg">
                <h4 className="font-medium text-green-600 mb-2">Marketing Cookies</h4>
                <p className="text-sm text-muted-foreground">
                  You may see less relevant ads, but the core platform functionality remains unchanged.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Contact Information */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Questions About Cookies?</CardTitle>
            <CardDescription>
              If you have any questions about our use of cookies, please contact us:
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p><strong>Email:</strong> privacy@securepath.com</p>
              <p><strong>Phone:</strong> +1 (555) 123-4567</p>
              <p><strong>Address:</strong> 123 Safety St, Security City, SC 12345</p>
            </div>
          </CardContent>
        </Card>

        {/* Updates */}
        <Card>
          <CardHeader>
            <CardTitle>Policy Updates</CardTitle>
            <CardDescription>
              We may update this Cookie Policy from time to time. Any changes will be posted on this page 
              with an updated revision date. We encourage you to review this policy periodically.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    </Layout>
  );
};

export default CookiePolicy;
