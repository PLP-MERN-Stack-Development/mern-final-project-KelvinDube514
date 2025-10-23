import { Shield, Eye, Lock, Database, Users, Mail } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Layout from '@/components/Layout';

const PrivacyPolicy = () => {
  const lastUpdated = "December 2024";

  const sections = [
    {
      title: "Information We Collect",
      icon: Database,
      content: [
        "Personal information you provide when creating an account (name, email, phone number)",
        "Location data when you report incidents or use safety features",
        "Incident reports and safety alerts you submit",
        "Usage data and analytics to improve our services",
        "Device information and browser data for security purposes"
      ]
    },
    {
      title: "How We Use Your Information",
      icon: Eye,
      content: [
        "Provide and maintain our safety services",
        "Process and display incident reports on the safety map",
        "Send you important safety alerts and notifications",
        "Improve our platform and develop new features",
        "Ensure platform security and prevent abuse",
        "Comply with legal obligations and law enforcement requests"
      ]
    },
    {
      title: "Data Protection",
      icon: Lock,
      content: [
        "All data is encrypted in transit and at rest",
        "We implement industry-standard security measures",
        "Access to personal data is limited to authorized personnel",
        "Regular security audits and vulnerability assessments",
        "Secure data centers with physical and digital safeguards"
      ]
    },
    {
      title: "Your Rights",
      icon: Users,
      content: [
        "Access your personal data and request copies",
        "Correct inaccurate or incomplete information",
        "Delete your account and associated data",
        "Opt-out of non-essential communications",
        "Data portability - export your data in a standard format",
        "Withdraw consent for data processing where applicable"
      ]
    }
  ];

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-4">
            <Shield className="h-12 w-12 text-primary mr-3" />
            <h1 className="text-4xl font-bold">Privacy Policy</h1>
          </div>
          <p className="text-xl text-muted-foreground mb-4">
            Your privacy and data security are our top priorities
          </p>
          <Badge variant="outline" className="text-sm">
            Last updated: {lastUpdated}
          </Badge>
        </div>

        {/* Introduction */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Our Commitment to Privacy</CardTitle>
            <CardDescription>
              At SecurePath, we are committed to protecting your privacy and ensuring the security of your personal information. 
              This Privacy Policy explains how we collect, use, and safeguard your data when you use our community safety platform.
            </CardDescription>
          </CardHeader>
        </Card>

        {/* Main Content Sections */}
        <div className="space-y-8">
          {sections.map((section, index) => {
            const Icon = section.icon;
            return (
              <Card key={index}>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Icon className="h-6 w-6 text-primary mr-3" />
                    {section.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {section.content.map((item, itemIndex) => (
                      <li key={itemIndex} className="flex items-start">
                        <div className="w-2 h-2 bg-primary rounded-full mt-2 mr-3 flex-shrink-0" />
                        <span className="text-muted-foreground">{item}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Data Sharing */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Data Sharing and Third Parties</CardTitle>
            <CardDescription>
              We do not sell, trade, or rent your personal information to third parties. We may share data only in these limited circumstances:
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              <li className="flex items-start">
                <div className="w-2 h-2 bg-primary rounded-full mt-2 mr-3 flex-shrink-0" />
                <span className="text-muted-foreground">
                  <strong>Emergency Services:</strong> When necessary to protect public safety or respond to emergencies
                </span>
              </li>
              <li className="flex items-start">
                <div className="w-2 h-2 bg-primary rounded-full mt-2 mr-3 flex-shrink-0" />
                <span className="text-muted-foreground">
                  <strong>Legal Requirements:</strong> When required by law, court order, or government request
                </span>
              </li>
              <li className="flex items-start">
                <div className="w-2 h-2 bg-primary rounded-full mt-2 mr-3 flex-shrink-0" />
                <span className="text-muted-foreground">
                  <strong>Service Providers:</strong> With trusted partners who help us operate our platform (under strict confidentiality agreements)
                </span>
              </li>
              <li className="flex items-start">
                <div className="w-2 h-2 bg-primary rounded-full mt-2 mr-3 flex-shrink-0" />
                <span className="text-muted-foreground">
                  <strong>Consent:</strong> When you explicitly give us permission to share your information
                </span>
              </li>
            </ul>
          </CardContent>
        </Card>

        {/* Contact Information */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Mail className="h-6 w-6 text-primary mr-3" />
              Contact Us
            </CardTitle>
            <CardDescription>
              If you have questions about this Privacy Policy or want to exercise your rights, please contact us:
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p><strong>Email:</strong> privacy@securepath.com</p>
              <p><strong>Phone:</strong> +1 (555) 123-4567</p>
              <p><strong>Address:</strong> 123 Safety St, Security City, SC 12345</p>
              <p className="text-sm text-muted-foreground mt-4">
                We will respond to your inquiry within 30 days of receipt.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Updates */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Policy Updates</CardTitle>
            <CardDescription>
              We may update this Privacy Policy from time to time. We will notify you of any material changes by:
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              <li className="flex items-start">
                <div className="w-2 h-2 bg-primary rounded-full mt-2 mr-3 flex-shrink-0" />
                <span className="text-muted-foreground">Posting the updated policy on our website</span>
              </li>
              <li className="flex items-start">
                <div className="w-2 h-2 bg-primary rounded-full mt-2 mr-3 flex-shrink-0" />
                <span className="text-muted-foreground">Sending email notifications to registered users</span>
              </li>
              <li className="flex items-start">
                <div className="w-2 h-2 bg-primary rounded-full mt-2 mr-3 flex-shrink-0" />
                <span className="text-muted-foreground">Displaying in-app notifications for significant changes</span>
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default PrivacyPolicy;
