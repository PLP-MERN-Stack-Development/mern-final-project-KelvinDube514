import { FileText, Scale, AlertTriangle, Shield, Users, Gavel } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Layout from '@/components/Layout';

const TermsOfService = () => {
  const lastUpdated = "December 2024";

  const sections = [
    {
      title: "Acceptance of Terms",
      icon: FileText,
      content: [
        "By accessing or using SecurePath, you agree to be bound by these Terms of Service",
        "If you disagree with any part of these terms, you may not access the service",
        "These terms apply to all visitors, users, and others who access or use the service",
        "We reserve the right to update these terms at any time without prior notice"
      ]
    },
    {
      title: "User Responsibilities",
      icon: Users,
      content: [
        "Provide accurate and truthful information when creating your account",
        "Use the platform responsibly and in accordance with local laws",
        "Report only genuine safety incidents and emergencies",
        "Respect other users and maintain a professional tone in communications",
        "Do not abuse, harass, or threaten other users",
        "Keep your account credentials secure and confidential"
      ]
    },
    {
      title: "Prohibited Activities",
      icon: AlertTriangle,
      content: [
        "Submitting false, misleading, or fraudulent incident reports",
        "Using the platform for commercial purposes without authorization",
        "Attempting to gain unauthorized access to other users' accounts",
        "Uploading malicious software or engaging in hacking activities",
        "Violating any applicable local, state, or federal laws",
        "Impersonating other individuals or organizations"
      ]
    },
    {
      title: "Service Availability",
      icon: Shield,
      content: [
        "We strive to maintain 99.9% uptime but cannot guarantee uninterrupted service",
        "Scheduled maintenance may temporarily interrupt service availability",
        "We are not liable for service interruptions due to circumstances beyond our control",
        "Users should have alternative emergency contact methods available",
        "Critical safety information should not rely solely on our platform"
      ]
    },
    {
      title: "Intellectual Property",
      icon: Scale,
      content: [
        "All content, features, and functionality of SecurePath are owned by us",
        "Users retain ownership of content they submit (incident reports, etc.)",
        "By submitting content, you grant us a license to use it for platform operations",
        "You may not copy, modify, or distribute our proprietary software",
        "Trademarks and logos are protected and may not be used without permission"
      ]
    },
    {
      title: "Limitation of Liability",
      icon: Gavel,
      content: [
        "SecurePath is provided 'as is' without warranties of any kind",
        "We are not liable for any direct, indirect, or consequential damages",
        "Users assume full responsibility for their use of the platform",
        "We do not guarantee the accuracy of user-submitted information",
        "Emergency situations should always involve contacting official emergency services"
      ]
    }
  ];

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-4">
            <FileText className="h-12 w-12 text-primary mr-3" />
            <h1 className="text-4xl font-bold">Terms of Service</h1>
          </div>
          <p className="text-xl text-muted-foreground mb-4">
            Please read these terms carefully before using our platform
          </p>
          <Badge variant="outline" className="text-sm">
            Last updated: {lastUpdated}
          </Badge>
        </div>

        {/* Introduction */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Welcome to SecurePath</CardTitle>
            <CardDescription>
              These Terms of Service ("Terms") govern your use of the SecurePath community safety platform. 
              By using our service, you agree to these terms and our Privacy Policy. If you have any questions, 
              please contact us at legal@securepath.com.
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

        {/* Account Termination */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Account Termination</CardTitle>
            <CardDescription>
              We reserve the right to terminate or suspend your account at any time for violations of these terms:
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              <li className="flex items-start">
                <div className="w-2 h-2 bg-primary rounded-full mt-2 mr-3 flex-shrink-0" />
                <span className="text-muted-foreground">
                  <strong>Immediate Termination:</strong> For serious violations such as false emergency reports or harassment
                </span>
              </li>
              <li className="flex items-start">
                <div className="w-2 h-2 bg-primary rounded-full mt-2 mr-3 flex-shrink-0" />
                <span className="text-muted-foreground">
                  <strong>Warning System:</strong> Minor violations may result in warnings before termination
                </span>
              </li>
              <li className="flex items-start">
                <div className="w-2 h-2 bg-primary rounded-full mt-2 mr-3 flex-shrink-0" />
                <span className="text-muted-foreground">
                  <strong>Appeal Process:</strong> You may appeal account actions by contacting our support team
                </span>
              </li>
              <li className="flex items-start">
                <div className="w-2 h-2 bg-primary rounded-full mt-2 mr-3 flex-shrink-0" />
                <span className="text-muted-foreground">
                  <strong>Data Retention:</strong> Your data may be retained for legal and safety purposes after termination
                </span>
              </li>
            </ul>
          </CardContent>
        </Card>

        {/* Dispute Resolution */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Dispute Resolution</CardTitle>
            <CardDescription>
              Any disputes arising from these terms or your use of SecurePath will be resolved as follows:
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              <li className="flex items-start">
                <div className="w-2 h-2 bg-primary rounded-full mt-2 mr-3 flex-shrink-0" />
                <span className="text-muted-foreground">
                  <strong>Governing Law:</strong> These terms are governed by the laws of the State of California
                </span>
              </li>
              <li className="flex items-start">
                <div className="w-2 h-2 bg-primary rounded-full mt-2 mr-3 flex-shrink-0" />
                <span className="text-muted-foreground">
                  <strong>Jurisdiction:</strong> Any legal proceedings will be conducted in California courts
                </span>
              </li>
              <li className="flex items-start">
                <div className="w-2 h-2 bg-primary rounded-full mt-2 mr-3 flex-shrink-0" />
                <span className="text-muted-foreground">
                  <strong>Mediation:</strong> We encourage resolving disputes through mediation before litigation
                </span>
              </li>
              <li className="flex items-start">
                <div className="w-2 h-2 bg-primary rounded-full mt-2 mr-3 flex-shrink-0" />
                <span className="text-muted-foreground">
                  <strong>Class Action Waiver:</strong> You agree to resolve disputes individually, not as part of a class action
                </span>
              </li>
            </ul>
          </CardContent>
        </Card>

        {/* Contact Information */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Contact Information</CardTitle>
            <CardDescription>
              For questions about these Terms of Service, please contact us:
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p><strong>Legal Department:</strong> legal@securepath.com</p>
              <p><strong>General Support:</strong> support@securepath.com</p>
              <p><strong>Phone:</strong> +1 (555) 123-4567</p>
              <p><strong>Address:</strong> 123 Safety St, Security City, SC 12345</p>
            </div>
          </CardContent>
        </Card>

        {/* Effective Date */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Effective Date</CardTitle>
            <CardDescription>
              These Terms of Service are effective as of {lastUpdated} and will remain in effect until modified or terminated.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    </Layout>
  );
};

export default TermsOfService;
