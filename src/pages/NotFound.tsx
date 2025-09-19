import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { Home, Shield, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="text-center space-y-6">
        <div className="space-y-4">
          <div className="flex justify-center">
            <div className="relative">
              <Shield className="h-24 w-24 text-primary" />
              <AlertTriangle className="absolute -top-2 -right-2 h-8 w-8 text-warning animate-pulse" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-foreground">404</h1>
          <h2 className="text-2xl font-semibold text-foreground">Page Not Found</h2>
          <p className="text-muted-foreground max-w-md mx-auto">
            The safety path you're looking for doesn't exist. Let's get you back to a secure location.
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button asChild className="bg-primary hover:bg-primary/90">
            <Link to="/" className="flex items-center space-x-2">
              <Home className="h-4 w-4" />
              <span>Return to Dashboard</span>
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/report" className="flex items-center space-x-2">
              <AlertTriangle className="h-4 w-4" />
              <span>Report an Issue</span>
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
