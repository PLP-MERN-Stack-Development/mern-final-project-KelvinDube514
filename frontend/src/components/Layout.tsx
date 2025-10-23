import { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Shield, Map, AlertTriangle, User } from 'lucide-react';
import Navigation, { NavigationProps } from './Navigation';
import Footer, { FooterProps } from './Footer';
import { cn } from '@/lib/utils';
import { useRealTime } from '@/hooks/useRealTime';

export interface LayoutProps {
  children: ReactNode;
  className?: string;
  showNavigation?: boolean;
  showFooter?: boolean;
  navigationProps?: Partial<NavigationProps>;
  footerProps?: Partial<FooterProps>;
  containerClassName?: string;
  mainClassName?: string;
}

const Layout = ({
  children,
  className,
  showNavigation = true,
  showFooter = true,
  navigationProps = {},
  footerProps = {},
  containerClassName,
  mainClassName
}: LayoutProps) => {
  const navigate = useNavigate();
  const { alerts, incidents } = useRealTime();
  
  // Calculate unread notification count
  const unreadCount = alerts.length + incidents.length;
  
  // Enhanced navigation items including notifications
  const navItems = [
    { path: '/dashboard', label: 'Dashboard', icon: Shield },
    { path: '/map', label: 'Safety Map', icon: Map },
    { path: '/report', label: 'Report Alert', icon: AlertTriangle },
    { path: '/notifications', label: 'Notifications', icon: Bell },
    { path: '/profile', label: 'Profile', icon: User },
  ];

  const handleNotificationClick = () => {
    navigate('/notifications');
  };
  return (
    <div className={cn("min-h-screen bg-background flex flex-col", className)}>
      {/* Navigation */}
      {showNavigation && (
        <Navigation 
          {...navigationProps}
          navItems={navItems}
          notificationCount={unreadCount}
          onNotificationClick={handleNotificationClick}
        />
      )}
      
      {/* Main Content */}
      <main className={cn("flex-1", mainClassName)}>
        <div className={cn(containerClassName)}>
          {children}
        </div>
      </main>
      
      {/* Footer */}
      {showFooter && <Footer {...footerProps} />}
    </div>
  );
};

export default Layout;
