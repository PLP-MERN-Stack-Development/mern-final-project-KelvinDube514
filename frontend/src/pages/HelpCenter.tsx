import { HelpCircle, Search, MessageCircle, Phone, Mail, BookOpen, Video, Download, AlertTriangle, Map, Bell, User, Shield } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import Layout from '@/components/Layout';
import { useState } from 'react';

const HelpCenter = () => {
  const [searchQuery, setSearchQuery] = useState('');

  const quickActions = [
    {
      title: "Report an Incident",
      description: "Submit a safety incident or emergency",
      icon: AlertTriangle,
      href: "/report",
      color: "text-red-600"
    },
    {
      title: "View Safety Map",
      description: "Check recent incidents in your area",
      icon: Map,
      href: "/map",
      color: "text-blue-600"
    },
    {
      title: "Manage Notifications",
      description: "Update your alert preferences",
      icon: Bell,
      href: "/notifications",
      color: "text-yellow-600"
    },
    {
      title: "Update Profile",
      description: "Edit your account information",
      icon: User,
      href: "/profile",
      color: "text-green-600"
    }
  ];

  const faqCategories = [
    {
      title: "Getting Started",
      icon: BookOpen,
      questions: [
        {
          question: "How do I create an account?",
          answer: "Click the 'Sign Up' button on the homepage, fill in your details, and verify your email address. You'll be able to access all features immediately after registration."
        },
        {
          question: "What information do I need to provide?",
          answer: "You'll need your name, email address, phone number, and location. This information helps us provide accurate safety alerts and emergency services if needed."
        },
        {
          question: "Is the platform free to use?",
          answer: "Yes, SecurePath is completely free for all users. We believe community safety should be accessible to everyone."
        }
      ]
    },
    {
      title: "Reporting Incidents",
      icon: AlertTriangle,
      questions: [
        {
          question: "What types of incidents can I report?",
          answer: "You can report any safety-related incidents including crimes, accidents, suspicious activities, natural disasters, or other emergencies that affect community safety."
        },
        {
          question: "How quickly are incidents processed?",
          answer: "Incidents are typically processed and appear on the safety map within 5-10 minutes. Emergency situations are prioritized and may appear faster."
        },
        {
          question: "Can I report incidents anonymously?",
          answer: "Yes, you can choose to report incidents anonymously. However, providing your contact information helps emergency services follow up if needed."
        }
      ]
    },
    {
      title: "Safety Features",
      icon: Shield,
      questions: [
        {
          question: "How do safety alerts work?",
          answer: "You'll receive notifications about incidents near your location or areas you're monitoring. You can customize alert types and distance settings in your profile."
        },
        {
          question: "Can I track multiple locations?",
          answer: "Yes, you can monitor multiple locations by adding them to your watchlist. This is useful if you have family in different areas or travel frequently."
        },
        {
          question: "How accurate is the location data?",
          answer: "Location accuracy depends on your device's GPS and network connection. We use the most precise location data available to ensure accurate incident mapping."
        }
      ]
    }
  ];

  const supportChannels = [
    {
      title: "Live Chat",
      description: "Get instant help from our support team",
      icon: MessageCircle,
      availability: "24/7",
      responseTime: "Immediate",
      action: "Start Chat"
    },
    {
      title: "Phone Support",
      description: "Speak directly with a support representative",
      icon: Phone,
      availability: "Mon-Fri 8AM-8PM",
      responseTime: "Immediate",
      action: "Call Now"
    },
    {
      title: "Email Support",
      description: "Send us a detailed message",
      icon: Mail,
      availability: "24/7",
      responseTime: "Within 4 hours",
      action: "Send Email"
    }
  ];

  const resources = [
    {
      title: "User Guide",
      description: "Complete guide to using SecurePath",
      icon: BookOpen,
      type: "PDF",
      size: "2.3 MB"
    },
    {
      title: "Video Tutorials",
      description: "Step-by-step video instructions",
      icon: Video,
      type: "Video Series",
      size: "15 videos"
    },
    {
      title: "Safety Tips",
      description: "Best practices for community safety",
      icon: Shield,
      type: "Guide",
      size: "1.8 MB"
    }
  ];

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-4">
            <HelpCircle className="h-12 w-12 text-primary mr-3" />
            <h1 className="text-4xl font-bold">Help Center</h1>
          </div>
          <p className="text-xl text-muted-foreground mb-6">
            Find answers, get support, and learn how to use SecurePath
          </p>
          
          {/* Search Bar */}
          <div className="max-w-md mx-auto">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search for help..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mb-12">
          <h2 className="text-2xl font-semibold mb-6">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {quickActions.map((action, index) => {
              const Icon = action.icon;
              return (
                <Card key={index} className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardContent className="p-6">
                    <div className="flex items-center mb-3">
                      <Icon className={`h-8 w-8 ${action.color} mr-3`} />
                      <h3 className="font-semibold">{action.title}</h3>
                    </div>
                    <p className="text-sm text-muted-foreground mb-4">{action.description}</p>
                    <Button variant="outline" size="sm" className="w-full">
                      Go to {action.title}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* FAQ Sections */}
        <div className="mb-12">
          <h2 className="text-2xl font-semibold mb-6">Frequently Asked Questions</h2>
          <div className="space-y-8">
            {faqCategories.map((category, categoryIndex) => {
              const Icon = category.icon;
              return (
                <Card key={categoryIndex}>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Icon className="h-6 w-6 text-primary mr-3" />
                      {category.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {category.questions.map((faq, faqIndex) => (
                        <div key={faqIndex} className="border-l-2 border-primary/20 pl-4">
                          <h4 className="font-medium mb-2">{faq.question}</h4>
                          <p className="text-sm text-muted-foreground">{faq.answer}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Support Channels */}
        <div className="mb-12">
          <h2 className="text-2xl font-semibold mb-6">Get Support</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {supportChannels.map((channel, index) => {
              const Icon = channel.icon;
              return (
                <Card key={index}>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Icon className="h-6 w-6 text-primary mr-3" />
                      {channel.title}
                    </CardTitle>
                    <CardDescription>{channel.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Availability:</span>
                        <span>{channel.availability}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Response Time:</span>
                        <span>{channel.responseTime}</span>
                      </div>
                      <Button className="w-full mt-4">
                        {channel.action}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Resources */}
        <div className="mb-12">
          <h2 className="text-2xl font-semibold mb-6">Resources & Downloads</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {resources.map((resource, index) => {
              const Icon = resource.icon;
              return (
                <Card key={index}>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <div className="flex items-center">
                        <Icon className="h-6 w-6 text-primary mr-3" />
                        {resource.title}
                      </div>
                      <Badge variant="outline">{resource.type}</Badge>
                    </CardTitle>
                    <CardDescription>{resource.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">{resource.size}</span>
                      <Button variant="outline" size="sm">
                        <Download className="h-4 w-4 mr-2" />
                        Download
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Contact Information */}
        <Card>
          <CardHeader>
            <CardTitle>Still Need Help?</CardTitle>
            <CardDescription>
              Can't find what you're looking for? Our support team is here to help.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium mb-3">Contact Information</h4>
                <div className="space-y-2 text-sm">
                  <p><strong>Email:</strong> support@securepath.com</p>
                  <p><strong>Phone:</strong> +1 (555) 123-4567</p>
                  <p><strong>Address:</strong> 123 Safety St, Security City, SC 12345</p>
                </div>
              </div>
              <div>
                <h4 className="font-medium mb-3">Emergency Support</h4>
                <div className="space-y-2 text-sm">
                  <p className="text-red-600"><strong>Emergency Hotline:</strong> +1 (555) 911-HELP</p>
                  <p className="text-muted-foreground">Available 24/7 for urgent safety issues</p>
                  <Button variant="destructive" size="sm" className="mt-3">
                    <Phone className="h-4 w-4 mr-2" />
                    Call Emergency Line
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default HelpCenter;
