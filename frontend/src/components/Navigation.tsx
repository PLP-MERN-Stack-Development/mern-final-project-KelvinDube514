import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Shield, Map, AlertTriangle, User, Menu, X, Bell, LucideIcon, LogIn, UserPlus, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import ShinyText from '@/components/ui/ShinyText';
import { ThemeToggle } from '@/components/theme-toggle';
import { useProfile, useLogout } from '@/hooks/useApi';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export interface NavItem {
  path: string;
  label: string;
  icon: LucideIcon;
}

export interface NavigationProps {
  className?: string;
  logoText?: string;
  logoIcon?: LucideIcon;
  logoHref?: string;
  navItems?: NavItem[];
  showNotifications?: boolean;
  notificationCount?: number;
  onNotificationClick?: () => void;
  sticky?: boolean;
}

const Navigation = ({
  className,
  logoText = "SecurePath",
  logoIcon: LogoIcon = Shield,
  logoHref = "/",
  navItems,
  showNotifications = true,
  notificationCount = 3,
  onNotificationClick,
  sticky = true
}: NavigationProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { data: profile, isLoading: profileLoading } = useProfile();
  const logoutMutation = useLogout();

  const isActive = (path: string) => location.pathname === path;

  const defaultNavItems: NavItem[] = [
    { path: '/dashboard', label: 'Dashboard', icon: Shield },
    { path: '/map', label: 'Safety Map', icon: Map },
    { path: '/report', label: 'Report Alert', icon: AlertTriangle },
    { path: '/profile', label: 'Profile', icon: User },
  ];

  const navigationItems = navItems || defaultNavItems;

  const handleLogout = async () => {
    try {
      await logoutMutation.mutateAsync();
      navigate('/');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  // Show different navigation for authenticated vs unauthenticated users
  const showAuthNavigation = profile && !profileLoading;

  return (
    <nav className={cn(
      "z-50 w-full border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60",
      sticky && "sticky top-0",
      className
    )}>
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link to={logoHref} className="flex items-center space-x-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
              <LogoIcon className="h-6 w-6 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold text-foreground">
              <ShinyText text={logoText} speed={3} />
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1">
            {showAuthNavigation ? (
              // Authenticated navigation
              navigationItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                      isActive(item.path)
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span className="font-medium">
                      <ShinyText text={item.label} speed={3} />
                    </span>
                  </Link>
                );
              })
            ) : (
              // Unauthenticated navigation
              <>
                <Link
                  to="/login"
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                    isActive('/login')
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                  }`}
                >
                  <LogIn className="h-4 w-4" />
                  <span className="font-medium">
                    <ShinyText text="Login" speed={3} />
                  </span>
                </Link>
                <Link
                  to="/signup"
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                    isActive('/signup')
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                  }`}
                >
                  <UserPlus className="h-4 w-4" />
                  <span className="font-medium">
                    <ShinyText text="Sign Up" speed={3} />
                  </span>
                </Link>
              </>
            )}
          </div>

          {/* User Menu, Notifications, Theme Toggle & Mobile Menu */}
          <div className="flex items-center space-x-2">
            {showAuthNavigation && showNotifications && (
              <Button 
                variant="ghost" 
                size="sm" 
                className="relative"
                onClick={onNotificationClick}
              >
                <Bell className="h-5 w-5" />
                {notificationCount > 0 && (
                  <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs bg-destructive">
                    {notificationCount > 99 ? '99+' : notificationCount}
                  </Badge>
                )}
              </Button>
            )}

            {/* User Menu for Authenticated Users */}
            {showAuthNavigation && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="relative h-8 w-8 rounded-full">
                    <User className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">
                        {profile?.firstName} {profile?.lastName}
                      </p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {profile?.email}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate('/profile')}>
                    <User className="mr-2 h-4 w-4" />
                    <span>Profile</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/notifications')}>
                    <Bell className="mr-2 h-4 w-4" />
                    <span>Notifications</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={handleLogout}
                    disabled={logoutMutation.isPending}
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}

            {/* Theme Toggle */}
            <ThemeToggle />

            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="sm"
              className="md:hidden"
              onClick={() => setIsOpen(!isOpen)}
            >
              {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <div className="md:hidden pb-4 animate-slide-up">
            <div className="flex flex-col space-y-2">
              {showAuthNavigation ? (
                // Authenticated mobile navigation
                <>
                  {navigationItems.map((item) => {
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.path}
                        to={item.path}
                        onClick={() => setIsOpen(false)}
                        className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                          isActive(item.path)
                            ? 'bg-primary text-primary-foreground'
                            : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                        }`}
                      >
                        <Icon className="h-5 w-5" />
                        <span className="font-medium">
                          <ShinyText text={item.label} speed={3} />
                        </span>
                      </Link>
                    );
                  })}
                  <div className="border-t pt-2 mt-2">
                    <button
                      onClick={() => {
                        handleLogout();
                        setIsOpen(false);
                      }}
                      disabled={logoutMutation.isPending}
                      className="flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors text-muted-foreground hover:text-foreground hover:bg-muted w-full text-left"
                    >
                      <LogOut className="h-5 w-5" />
                      <span className="font-medium">
                        <ShinyText text="Log out" speed={3} />
                      </span>
                    </button>
                  </div>
                </>
              ) : (
                // Unauthenticated mobile navigation
                <>
                  <Link
                    to="/login"
                    onClick={() => setIsOpen(false)}
                    className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                      isActive('/login')
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                    }`}
                  >
                    <LogIn className="h-5 w-5" />
                    <span className="font-medium">
                      <ShinyText text="Login" speed={3} />
                    </span>
                  </Link>
                  <Link
                    to="/signup"
                    onClick={() => setIsOpen(false)}
                    className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                      isActive('/signup')
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                    }`}
                  >
                    <UserPlus className="h-5 w-5" />
                    <span className="font-medium">
                      <ShinyText text="Sign Up" speed={3} />
                    </span>
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navigation;