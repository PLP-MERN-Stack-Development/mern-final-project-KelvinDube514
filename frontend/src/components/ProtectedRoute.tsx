/**
 * ProtectedRoute - Component to protect routes that require authentication
 * Redirects unauthenticated users to login page
 */

import { ReactNode, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useProfile } from '@/hooks/useApi';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: ReactNode;
  fallback?: ReactNode;
}

const ProtectedRoute = ({ children, fallback }: ProtectedRouteProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { data: profile, isLoading, error } = useProfile();

  useEffect(() => {
    // If not loading and no profile (not authenticated), redirect to login
    if (!isLoading && !profile) {
      navigate('/login', { 
        state: { from: location.pathname },
        replace: true 
      });
    }
  }, [profile, isLoading, navigate, location.pathname]);

  // Show loading spinner while checking authentication
  if (isLoading) {
    return (
      fallback || (
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="flex flex-col items-center space-y-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-muted-foreground">Loading...</p>
          </div>
        </div>
      )
    );
  }

  // If there's an error or no profile, don't render children
  if (error || !profile) {
    return null;
  }

  // User is authenticated, render children
  return <>{children}</>;
};

export default ProtectedRoute;
