/**
 * CreateAlertForm - Form component for creating emergency alerts
 * Features: Form validation, geolocation, priority levels, target audience
 */

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { AlertTriangle, MapPin, Send, Loader2, Clock, Users } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Slider } from '@/components/ui/slider';
import { useToast } from '@/hooks/use-toast';
import { useCreateAlert } from '@/hooks/useApi';
import { createAlertSchema, CreateAlertFormData } from '@/lib/validations';
import ShinyText from '@/components/ui/ShinyText';

interface CreateAlertFormProps {
  onSuccess?: () => void;
  initialData?: Partial<CreateAlertFormData>;
}

const CreateAlertForm = ({ onSuccess, initialData }: CreateAlertFormProps) => {
  const { toast } = useToast();
  const [isGettingLocation, setIsGettingLocation] = useState(false);

  const form = useForm<CreateAlertFormData>({
    resolver: zodResolver(createAlertSchema),
    defaultValues: {
      type: initialData?.type || 'warning',
      title: initialData?.title || '',
      message: initialData?.message || '',
      location: initialData?.location || {
        coordinates: [0, 0],
        address: ''
      },
      priority: initialData?.priority || 'medium',
      targetAudience: initialData?.targetAudience || 'all',
      radius: initialData?.radius || 5,
    },
  });

  const createAlertMutation = useCreateAlert();

  const alertTypes = [
    { 
      value: 'critical', 
      label: 'Critical Emergency', 
      color: 'bg-red-600', 
      icon: '🚨',
      description: 'Life-threatening emergency'
    },
    { 
      value: 'warning', 
      label: 'Warning Alert', 
      color: 'bg-orange-500', 
      icon: '⚠️',
      description: 'Potential danger or hazard'
    },
    { 
      value: 'info', 
      label: 'Information', 
      color: 'bg-blue-500', 
      icon: 'ℹ️',
      description: 'Important community information'
    },
    { 
      value: 'safe', 
      label: 'All Clear', 
      color: 'bg-green-500', 
      icon: '✅',
      description: 'Situation resolved or area safe'
    }
  ];

  const priorityLevels = [
    { value: 'low', label: 'Low', description: 'General awareness', color: 'bg-green-500' },
    { value: 'medium', label: 'Medium', description: 'Moderate attention', color: 'bg-yellow-500' },
    { value: 'high', label: 'High', description: 'Urgent attention', color: 'bg-orange-500' },
    { value: 'critical', label: 'Critical', description: 'Immediate action', color: 'bg-red-600' }
  ];

  const audienceOptions = [
    { value: 'all', label: 'Everyone', description: 'All community members' },
    { value: 'authorities', label: 'Authorities Only', description: 'Law enforcement and emergency services' },
    { value: 'citizens', label: 'Citizens Only', description: 'General public excluding authorities' }
  ];

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
            `https://api.opencagedata.com/geocode/v1/json?q=${latitude}+${longitude}&key=YOUR_API_KEY`
          );
          
          let address = `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
          
          if (response.ok) {
            const data = await response.json();
            if (data.results?.[0]?.formatted) {
              address = data.results[0].formatted;
            }
          }

          form.setValue('location', {
            coordinates: [longitude, latitude],
            address,
          });

          toast({
            title: 'Location updated',
            description: 'Current location has been set.',
          });
        } catch (error) {
          // Fallback to coordinates
          form.setValue('location', {
            coordinates: [longitude, latitude],
            address: `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`,
          });
          
          toast({
            title: 'Location updated',
            description: 'Current coordinates have been set.',
          });
        } finally {
          setIsGettingLocation(false);
        }
      },
      (error) => {
        setIsGettingLocation(false);
        toast({
          title: 'Location error',
          description: error.message,
          variant: 'destructive',
        });
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000, // 5 minutes
      }
    );
  };

  const onSubmit = async (data: CreateAlertFormData) => {
    try {
      await createAlertMutation.mutateAsync(data);
      
      // Reset form
      form.reset();
      onSuccess?.();
    } catch (error) {
      // Error is handled by the mutation
    }
  };

  const radius = form.watch('radius');

  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <AlertTriangle className="h-5 w-5 text-primary" />
            <span><ShinyText text="Create Emergency Alert" speed={3} /></span>
          </CardTitle>
          <CardDescription>
            <ShinyText text="Broadcast important safety information to the community" speed={5} />
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Alert Type Selection */}
              <div className="space-y-3">
                <Label>Alert Type *</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {alertTypes.map((type) => (
                    <Button
                      key={type.value}
                      type="button"
                      variant={form.watch('type') === type.value ? "default" : "outline"}
                      onClick={() => {
                        form.setValue('type', type.value as any);
                        // Auto-set priority based on type
                        if (type.value === 'critical') {
                          form.setValue('priority', 'critical');
                        } else if (type.value === 'warning') {
                          form.setValue('priority', 'high');
                        }
                      }}
                      className="h-20 flex flex-col items-center justify-center space-y-1 p-3"
                    >
                      <span className="text-xl">{type.icon}</span>
                      <span className="text-sm font-medium text-center">{type.label}</span>
                      <span className="text-xs text-muted-foreground text-center">{type.description}</span>
                    </Button>
                  ))}
                </div>
                {form.formState.errors.type && (
                  <p className="text-sm text-destructive">{form.formState.errors.type.message}</p>
                )}
              </div>

              {/* Title */}
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Alert Title *</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="Brief, clear title for the alert"
                        disabled={createAlertMutation.isPending}
                      />
                    </FormControl>
                    <FormDescription>
                      Keep it concise and attention-grabbing
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Message */}
              <FormField
                control={form.control}
                name="message"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Alert Message *</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        placeholder="Detailed message explaining the situation and any actions to take..."
                        rows={4}
                        disabled={createAlertMutation.isPending}
                      />
                    </FormControl>
                    <FormDescription>
                      Include what happened, where, and what people should do
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Location */}
              <FormField
                control={form.control}
                name="location.address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Location *</FormLabel>
                    <div className="space-y-2">
                      <div className="relative">
                        <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="Address or landmark"
                            className="pl-10"
                            disabled={createAlertMutation.isPending}
                          />
                        </FormControl>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={getCurrentLocation}
                        disabled={isGettingLocation || createAlertMutation.isPending}
                        className="text-primary"
                      >
                        {isGettingLocation ? (
                          <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                        ) : (
                          <MapPin className="h-4 w-4 mr-1" />
                        )}
                        <ShinyText text="Use Current Location" speed={3} />
                      </Button>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Alert Radius */}
              <div className="space-y-3">
                <Label>Alert Radius: {radius} km</Label>
                <div className="px-3">
                  <Slider
                    value={[radius || 5]}
                    onValueChange={(value) => form.setValue('radius', value[0])}
                    max={50}
                    min={0.1}
                    step={0.1}
                    className="w-full"
                    disabled={createAlertMutation.isPending}
                  />
                </div>
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>0.1 km</span>
                  <span>50 km</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  People within this radius will receive the alert
                </p>
              </div>

              {/* Priority Level */}
              <div className="space-y-3">
                <Label>Priority Level *</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {priorityLevels.map((level) => (
                    <Button
                      key={level.value}
                      type="button"
                      variant={form.watch('priority') === level.value ? "default" : "outline"}
                      onClick={() => form.setValue('priority', level.value as any)}
                      className="h-auto p-4 flex flex-col items-start text-left"
                      disabled={createAlertMutation.isPending}
                    >
                      <div className="flex items-center space-x-2 mb-1">
                        <div className={`w-3 h-3 rounded-full ${level.color}`} />
                        <span className="font-medium">{level.label}</span>
                      </div>
                      <span className="text-xs text-muted-foreground">{level.description}</span>
                    </Button>
                  ))}
                </div>
                {form.formState.errors.priority && (
                  <p className="text-sm text-destructive">{form.formState.errors.priority.message}</p>
                )}
              </div>

              {/* Target Audience */}
              <FormField
                control={form.control}
                name="targetAudience"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Target Audience</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select who should receive this alert" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {audienceOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            <div className="flex flex-col">
                              <span>{option.label}</span>
                              <span className="text-xs text-muted-foreground">{option.description}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Choose who should receive this alert
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Auto-Expiry (Optional) */}
              <FormField
                control={form.control}
                name="expiresAt"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Auto-Expiry (Optional)</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="datetime-local"
                        disabled={createAlertMutation.isPending}
                      />
                    </FormControl>
                    <FormDescription>
                      Alert will automatically deactivate at this time
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Error Alert */}
              {createAlertMutation.isError && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    {createAlertMutation.error?.message || 'Failed to create alert. Please try again.'}
                  </AlertDescription>
                </Alert>
              )}

              {/* Preview */}
              {form.watch('title') && form.watch('message') && (
                <Card className="border-primary/20 bg-primary/5">
                  <CardHeader className="pb-3">
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline" className="text-xs">
                        Preview
                      </Badge>
                      <Badge variant={form.watch('type') === 'critical' ? 'destructive' : 'default'}>
                        {form.watch('type')}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <h3 className="font-semibold text-sm mb-2">{form.watch('title')}</h3>
                    <p className="text-sm text-muted-foreground mb-2">{form.watch('message')}</p>
                    <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                      <div className="flex items-center space-x-1">
                        <MapPin className="h-3 w-3" />
                        <span>{form.watch('location.address') || 'Location not set'}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Users className="h-3 w-3" />
                        <span>{audienceOptions.find(a => a.value === form.watch('targetAudience'))?.label}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Submit Button */}
              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <Button
                  type="submit"
                  className="flex-1 bg-primary hover:bg-primary/90"
                  disabled={createAlertMutation.isPending || !form.formState.isValid}
                >
                  {createAlertMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Broadcasting...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      <ShinyText text="Broadcast Alert" speed={3} />
                    </>
                  )}
                </Button>
                
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => form.reset()}
                  disabled={createAlertMutation.isPending}
                >
                  <ShinyText text="Reset Form" speed={3} />
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* Warning Notice */}
      <Card className="mt-6 border-warning/20 bg-warning/5">
        <CardContent className="p-4">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="h-5 w-5 text-warning mt-0.5" />
            <div className="space-y-1">
              <p className="text-sm font-medium text-warning-foreground">
                <ShinyText text="Important Notice" speed={3} />
              </p>
              <p className="text-xs text-muted-foreground">
                <ShinyText text="Emergency alerts are immediately broadcasted to all users in the specified area. Ensure all information is accurate before submitting. For life-threatening emergencies, call 911 immediately." speed={6} />
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CreateAlertForm;
