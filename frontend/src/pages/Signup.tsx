/**
 * Signup Page - User registration form
 * Features: Form validation, password confirmation, optional location, navigation to dashboard on success
 */

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Loader2, UserPlus, ArrowLeft, MapPin } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { useRegister, useProfile } from '@/hooks/useApi';
import { registerSchema } from '@/lib/validations';
import ShinyText from '@/components/ui/ShinyText';

type SignupFormData = {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
  location?: {
    coordinates: [number, number];
    address: string;
  };
};

const Signup = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [useLocation, setUseLocation] = useState(false);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const registerMutation = useRegister();
  const { data: profile } = useProfile();

  const form = useForm<SignupFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
  });

  // Redirect if already logged in
  useEffect(() => {
    if (profile) {
      navigate('/dashboard');
    }
  }, [profile, navigate]);

  const getCurrentLocation = async () => {
    if (!navigator.geolocation) {
      toast({
        title: 'Geolocation not supported',
        description: 'Your browser does not support geolocation.',
        variant: 'destructive',
      });
      return;
    }

    setIsGettingLocation(true);
    
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        
        try {
          // Reverse geocode to get address
          const response = await fetch(
            `https://api.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`
          );
          const data = await response.json();
          
          const address = data.display_name || `${latitude}, ${longitude}`;
          
          form.setValue('location', {
            coordinates: [longitude, latitude],
            address: address,
          });
          
          toast({
            title: 'Location set',
            description: 'Your current location has been added to your profile.',
          });
        } catch (error) {
          // Fallback to coordinates only
          form.setValue('location', {
            coordinates: [longitude, latitude],
            address: `${latitude}, ${longitude}`,
          });
          
          toast({
            title: 'Location set',
            description: 'Your coordinates have been saved.',
          });
        }
        
        setIsGettingLocation(false);
      },
      (error) => {
        console.error('Error getting location:', error);
        toast({
          title: 'Location error',
          description: 'Unable to get your current location.',
          variant: 'destructive',
        });
        setIsGettingLocation(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000, // 5 minutes
      }
    );
  };

  const onSubmit = async (data: SignupFormData) => {
    try {
      const registrationData = {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        password: data.password,
        ...(data.location && { location: data.location }),
      };
      
      await registerMutation.mutateAsync(registrationData);
      // Redirect to intended page or dashboard
      const from = location.state?.from || '/dashboard';
      navigate(from, { replace: true });
    } catch (error) {
      // Error is handled by the mutation's onError callback
      console.error('Registration failed:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-green-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="container mx-auto px-4 py-8">
        {/* Back to Home Link */}
        <div className="mb-6">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Link>
        </div>

        <div className="flex items-center justify-center min-h-[calc(100vh-12rem)]">
          <Card className="w-full max-w-md">
            <CardHeader className="space-y-1 text-center">
              <CardTitle className="text-2xl font-bold">
                <ShinyText text="Join SecurePath" speed={3} />
              </CardTitle>
              <CardDescription>
                <ShinyText text="Create your account to help build a safer community" speed={4} />
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  {/* Name Fields */}
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="firstName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>First Name</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="John"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="lastName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Last Name</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Doe"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Email Field */}
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input
                            type="email"
                            placeholder="john@example.com"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Password Field */}
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Password</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input
                              type={showPassword ? 'text' : 'password'}
                              placeholder="Create a strong password"
                              {...field}
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                              onClick={() => setShowPassword(!showPassword)}
                            >
                              {showPassword ? (
                                <EyeOff className="h-4 w-4" />
                              ) : (
                                <Eye className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Confirm Password Field */}
                  <FormField
                    control={form.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Confirm Password</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input
                              type={showConfirmPassword ? 'text' : 'password'}
                              placeholder="Confirm your password"
                              {...field}
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            >
                              {showConfirmPassword ? (
                                <EyeOff className="h-4 w-4" />
                              ) : (
                                <Eye className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Location Section */}
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="useLocation"
                        checked={useLocation}
                        onCheckedChange={(checked) => {
                          setUseLocation(checked as boolean);
                          if (!checked) {
                            form.setValue('location', undefined);
                          }
                        }}
                      />
                      <Label 
                        htmlFor="useLocation" 
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        Add location to profile (optional)
                      </Label>
                    </div>

                    {useLocation && (
                      <div className="space-y-2">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={getCurrentLocation}
                          disabled={isGettingLocation}
                          className="w-full"
                        >
                          {isGettingLocation ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Getting Location...
                            </>
                          ) : (
                            <>
                              <MapPin className="mr-2 h-4 w-4" />
                              Use Current Location
                            </>
                          )}
                        </Button>

                        {form.watch('location') && (
                          <div className="text-xs text-muted-foreground p-2 bg-muted rounded">
                            📍 {form.watch('location')?.address}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Submit Button */}
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={registerMutation.isPending}
                  >
                    {registerMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating Account...
                      </>
                    ) : (
                      <>
                        <UserPlus className="mr-2 h-4 w-4" />
                        Create Account
                      </>
                    )}
                  </Button>

                  {/* Error Display */}
                  {registerMutation.isError && (
                    <Alert variant="destructive">
                      <AlertDescription>
                        {registerMutation.error?.message || 'Registration failed. Please try again.'}
                      </AlertDescription>
                    </Alert>
                  )}
                </form>
              </Form>

              {/* Sign In Link */}
              <div className="mt-6 text-center">
                <p className="text-sm text-muted-foreground">
                  Already have an account?{' '}
                  <Link
                    to="/login"
                    className="font-medium text-primary hover:underline"
                  >
                    Sign in
                  </Link>
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Signup;
