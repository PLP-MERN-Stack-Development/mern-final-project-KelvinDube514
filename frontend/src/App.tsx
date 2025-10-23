import { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/components/theme-provider";
import { useRealTime } from "@/hooks/useRealTime";
import { apiService } from "@/services/ApiService";
import Layout from "./components/Layout";
import Homepage from "./pages/Homepage";
import Dashboard from "./pages/Dashboard";
import SafetyMap from "./pages/SafetyMap";
import ReportAlert from "./pages/ReportAlert";
import Profile from "./pages/Profile";
import Notifications from "./pages/Notifications";
import ComponentExamples from "./pages/ComponentExamples";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import NotFound from "./pages/NotFound";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfService from "./pages/TermsOfService";
import CookiePolicy from "./pages/CookiePolicy";
import HelpCenter from "./pages/HelpCenter";
import ProtectedRoute from "./components/ProtectedRoute";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: (failureCount, error: any) => {
        // Don't retry on 401/403 errors
        if (error?.statusCode === 401 || error?.statusCode === 403) {
          return false;
        }
        return failureCount < 3;
      },
    },
    mutations: {
      retry: (failureCount, error: any) => {
        // Don't retry on 400/401/403 errors
        if (error?.statusCode >= 400 && error?.statusCode < 500) {
          return false;
        }
        return failureCount < 2;
      },
    },
  },
});

const AppContent = () => {
  // Initialize API service with stored auth token
  useEffect(() => {
    const token = localStorage.getItem('authToken');
    apiService.initialize(token, queryClient);
  }, []);

  // Initialize real-time services globally
  const { isConnected } = useRealTime({
    serverUrl: 'http://localhost:5000',
    autoConnect: true,
    enableGeolocation: true,
    authToken: localStorage.getItem('authToken')
  });

  return (
    <BrowserRouter>
      <Routes>
        {/* Homepage without layout (custom design) */}
        <Route path="/" element={<Homepage />} />
        
        {/* Authentication pages without layout */}
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        
        {/* Component examples page without layout to show components independently */}
        <Route path="/examples" element={<ComponentExamples />} />
        
        {/* Legal and Support pages with layout */}
        <Route path="/privacy" element={<Layout><PrivacyPolicy /></Layout>} />
        <Route path="/terms" element={<Layout><TermsOfService /></Layout>} />
        <Route path="/cookies" element={<Layout><CookiePolicy /></Layout>} />
        <Route path="/help" element={<Layout><HelpCenter /></Layout>} />
        
        {/* Protected pages that require authentication */}
        <Route path="/dashboard" element={<ProtectedRoute><Layout><Dashboard /></Layout></ProtectedRoute>} />
        <Route path="/map" element={<ProtectedRoute><Layout><SafetyMap /></Layout></ProtectedRoute>} />
        <Route path="/report" element={<ProtectedRoute><Layout><ReportAlert /></Layout></ProtectedRoute>} />
        <Route path="/notifications" element={<ProtectedRoute><Layout><Notifications /></Layout></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><Layout><Profile /></Layout></ProtectedRoute>} />
        
        {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
        <Route path="*" element={<Layout><NotFound /></Layout>} />
      </Routes>
    </BrowserRouter>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider defaultTheme="system" storageKey="securepath-ui-theme">
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <AppContent />
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
