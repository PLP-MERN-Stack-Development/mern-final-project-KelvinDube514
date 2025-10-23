import { Link } from 'react-router-dom';
import { Shield, Mail, Phone, MapPin, Github, Twitter, Facebook } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import ShinyText from '@/components/ui/ShinyText';

export interface FooterProps {
  className?: string;
  showSocialLinks?: boolean;
  showContactInfo?: boolean;
  customLinks?: Array<{
    label: string;
    href: string;
    external?: boolean;
  }>;
  copyrightText?: string;
  companyName?: string;
}

const Footer = ({ 
  className = "",
  showSocialLinks = true,
  showContactInfo = true,
  customLinks = [],
  copyrightText,
  companyName = "SecurePath"
}: FooterProps) => {
  const currentYear = new Date().getFullYear();
  const defaultCopyright = copyrightText || `© ${currentYear} ${companyName}. All rights reserved.`;

  const navigationLinks = [
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Safety Map', href: '/map' },
    { label: 'Report Alert', href: '/report' },
    { label: 'Profile', href: '/profile' },
  ];

  const legalLinks = [
    { label: 'Privacy Policy', href: '/privacy' },
    { label: 'Terms of Service', href: '/terms' },
    { label: 'Cookie Policy', href: '/cookies' },
    { label: 'Help Center', href: '/help' },
  ];

  const socialLinks = [
    { icon: Twitter, href: 'https://twitter.com', label: 'Twitter' },
    { icon: Facebook, href: 'https://facebook.com', label: 'Facebook' },
    { icon: Github, href: 'https://github.com', label: 'GitHub' },
  ];

  const contactInfo = [
    { icon: Phone, text: '+1 (555) 123-4567', href: 'tel:+15551234567' },
    { icon: Mail, text: 'support@securepath.com', href: 'mailto:support@securepath.com' },
    { icon: MapPin, text: '123 Safety St, Security City, SC 12345', href: '#' },
  ];

  const allCustomLinks = [...customLinks, ...legalLinks];

  return (
    <footer className={`bg-card border-t ${className}`}>
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Company Info */}
          <div className="space-y-4">
            <Link to="/" className="flex items-center space-x-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
                <Shield className="h-6 w-6 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold text-foreground">
                <ShinyText text={companyName} speed={3} />
              </span>
            </Link>
            <p className="text-sm text-muted-foreground max-w-sm">
              <ShinyText text="Building safer communities through real-time intelligence, verified reporting, and connected neighborhood networks." speed={5} />
            </p>
            {showSocialLinks && (
              <div className="flex space-x-2">
                {socialLinks.map((social, index) => {
                  const Icon = social.icon;
                  return (
                    <Button
                      key={index}
                      variant="ghost"
                      size="sm"
                      asChild
                      className="h-9 w-9 p-0"
                    >
                      <a 
                        href={social.href} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        aria-label={social.label}
                      >
                        <Icon className="h-4 w-4" />
                      </a>
                    </Button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Navigation Links */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-foreground">
              <ShinyText text="Navigation" speed={3} />
            </h3>
            <ul className="space-y-2">
              {navigationLinks.map((link, index) => (
                <li key={index}>
                  <Link 
                    to={link.href} 
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal & Custom Links */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-foreground">
              <ShinyText text="Legal & Support" speed={3} />
            </h3>
            <ul className="space-y-2">
              {allCustomLinks.map((link, index) => (
                <li key={index}>
                  {link.external ? (
                    <a 
                      href={link.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {link.label}
                    </a>
                  ) : (
                    <Link 
                      to={link.href} 
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {link.label}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Information */}
          {showContactInfo && (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-foreground">
                <ShinyText text="Contact Us" speed={3} />
              </h3>
              <ul className="space-y-3">
                {contactInfo.map((contact, index) => {
                  const Icon = contact.icon;
                  return (
                    <li key={index}>
                      <a 
                        href={contact.href}
                        className="flex items-center space-x-2 text-sm text-muted-foreground hover:text-foreground transition-colors group"
                      >
                        <Icon className="h-4 w-4 group-hover:text-primary transition-colors" />
                        <span>{contact.text}</span>
                      </a>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </div>

        <Separator className="my-8" />

        {/* Bottom Bar */}
        <div className="flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0">
          <p className="text-sm text-muted-foreground">
            {defaultCopyright}
          </p>
          <div className="flex items-center space-x-4 text-sm text-muted-foreground">
            <span><ShinyText text="Made with ❤️ for community safety" speed={4} /></span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
