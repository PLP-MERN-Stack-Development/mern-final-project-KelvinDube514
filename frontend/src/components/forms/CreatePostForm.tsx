/**
 * CreatePostForm - Form component for creating safety posts/incidents
 * Features: Form validation, file upload, geolocation, optimistic updates
 */

import { useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { AlertTriangle, MapPin, Camera, Send, Loader2, X, Upload } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { useCreatePost } from '@/hooks/useApi';
import { createPostSchema, CreatePostFormData } from '@/lib/validations';
import ShinyText from '@/components/ui/ShinyText';

interface CreatePostFormProps {
  onSuccess?: () => void;
  initialData?: Partial<CreatePostFormData>;
}

const CreatePostForm = ({ onSuccess, initialData }: CreatePostFormProps) => {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);

  const form = useForm<CreatePostFormData>({
    resolver: zodResolver(createPostSchema),
    defaultValues: {
      type: initialData?.type || 'other',
      title: initialData?.title || '',
      description: initialData?.description || '',
      location: initialData?.location || {
        coordinates: [0, 0],
        address: ''
      },
      severity: initialData?.severity || 'medium',
      media: [],
    },
  });

  const createPostMutation = useCreatePost();

  const alertTypes = [
    { value: 'crime', label: 'Crime/Security', color: 'bg-destructive', icon: '🚨' },
    { value: 'accident', label: 'Traffic Accident', color: 'bg-warning', icon: '🚗' },
    { value: 'hazard', label: 'Environmental Hazard', color: 'bg-orange-500', icon: '⚠️' },
    { value: 'suspicious', label: 'Suspicious Activity', color: 'bg-yellow-500', icon: '👁️' },
    { value: 'emergency', label: 'Emergency Services', color: 'bg-red-600', icon: '🚑' },
    { value: 'other', label: 'Other', color: 'bg-gray-500', icon: '📋' }
  ];

  const severityLevels = [
    { value: 'low', label: 'Low', description: 'Information only', color: 'bg-green-500' },
    { value: 'medium', label: 'Medium', description: 'Moderate concern', color: 'bg-yellow-500' },
    { value: 'high', label: 'High', description: 'Immediate attention', color: 'bg-orange-500' },
    { value: 'critical', label: 'Critical', description: 'Emergency situation', color: 'bg-red-600' }
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

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    
    // Validate file types and sizes
    const validFiles = files.filter(file => {
      const isValidType = ['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/webm'].includes(file.type);
      const isValidSize = file.size <= 5 * 1024 * 1024; // 5MB
      
      if (!isValidType) {
        toast({
          title: 'Invalid file type',
          description: `${file.name} is not a supported file type.`,
          variant: 'destructive',
        });
        return false;
      }
      
      if (!isValidSize) {
        toast({
          title: 'File too large',
          description: `${file.name} is larger than 5MB.`,
          variant: 'destructive',
        });
        return false;
      }
      
      return true;
    });

    if (uploadedFiles.length + validFiles.length > 5) {
      toast({
        title: 'Too many files',
        description: 'Maximum 5 files allowed.',
        variant: 'destructive',
      });
      return;
    }

    const newFiles = [...uploadedFiles, ...validFiles];
    setUploadedFiles(newFiles);
    form.setValue('media', newFiles);
  };

  const removeFile = (index: number) => {
    const newFiles = uploadedFiles.filter((_, i) => i !== index);
    setUploadedFiles(newFiles);
    form.setValue('media', newFiles);
  };

  const onSubmit = async (data: CreatePostFormData) => {
    try {
      await createPostMutation.mutateAsync(data);
      
      // Reset form and files
      form.reset();
      setUploadedFiles([]);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      
      onSuccess?.();
    } catch (error) {
      // Error is handled by the mutation
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <AlertTriangle className="h-5 w-5 text-primary" />
            <span><ShinyText text="Report Safety Incident" speed={3} /></span>
          </CardTitle>
          <CardDescription>
            <ShinyText text="Provide detailed information to help keep the community safe" speed={5} />
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Quick Type Selection */}
              <div className="space-y-3">
                <Label>Alert Type *</Label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {alertTypes.map((type) => (
                    <Button
                      key={type.value}
                      type="button"
                      variant={form.watch('type') === type.value ? "default" : "outline"}
                      onClick={() => {
                        form.setValue('type', type.value as any);
                        if (!form.getValues('title')) {
                          form.setValue('title', type.label);
                        }
                      }}
                      className="h-16 flex flex-col items-center justify-center space-y-1"
                    >
                      <span className="text-lg">{type.icon}</span>
                      <span className="text-xs font-medium">{type.label}</span>
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
                    <FormLabel>Title *</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="Brief description of the incident"
                        disabled={createPostMutation.isPending}
                      />
                    </FormControl>
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
                            disabled={createPostMutation.isPending}
                          />
                        </FormControl>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={getCurrentLocation}
                        disabled={isGettingLocation || createPostMutation.isPending}
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

              {/* Severity Level */}
              <div className="space-y-3">
                <Label>Severity Level *</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {severityLevels.map((level) => (
                    <Button
                      key={level.value}
                      type="button"
                      variant={form.watch('severity') === level.value ? "default" : "outline"}
                      onClick={() => form.setValue('severity', level.value as any)}
                      className="h-auto p-4 flex flex-col items-start text-left"
                      disabled={createPostMutation.isPending}
                    >
                      <div className="flex items-center space-x-2 mb-1">
                        <div className={`w-3 h-3 rounded-full ${level.color}`} />
                        <span className="font-medium">{level.label}</span>
                      </div>
                      <span className="text-xs text-muted-foreground">{level.description}</span>
                    </Button>
                  ))}
                </div>
                {form.formState.errors.severity && (
                  <p className="text-sm text-destructive">{form.formState.errors.severity.message}</p>
                )}
              </div>

              {/* Description */}
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Detailed Description *</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        placeholder="Provide as much detail as possible to help others understand the situation..."
                        rows={4}
                        disabled={createPostMutation.isPending}
                      />
                    </FormControl>
                    <FormDescription>
                      Include what happened, when, and any other relevant details.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Media Upload */}
              <div className="space-y-3">
                <Label>Attach Media (Optional)</Label>
                <div className="border-2 border-dashed border-muted rounded-lg p-6 text-center">
                  <Camera className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground mb-2">
                    Upload photos or videos (max 5 files, 5MB each)
                  </p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*,video/*"
                    multiple
                    onChange={handleFileUpload}
                    className="hidden"
                    disabled={createPostMutation.isPending}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={createPostMutation.isPending}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Choose Files
                  </Button>
                </div>

                {/* Uploaded Files Preview */}
                {uploadedFiles.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Uploaded Files:</p>
                    <div className="space-y-2">
                      {uploadedFiles.map((file, index) => (
                        <div key={index} className="flex items-center justify-between p-2 border rounded">
                          <div className="flex items-center space-x-2">
                            <div className="w-2 h-2 bg-green-500 rounded-full" />
                            <span className="text-sm">{file.name}</span>
                            <Badge variant="outline" className="text-xs">
                              {(file.size / 1024 / 1024).toFixed(1)}MB
                            </Badge>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeFile(index)}
                            disabled={createPostMutation.isPending}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Error Alert */}
              {createPostMutation.isError && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    {createPostMutation.error?.message || 'Failed to submit report. Please try again.'}
                  </AlertDescription>
                </Alert>
              )}

              {/* Submit Button */}
              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <Button
                  type="submit"
                  className="flex-1 bg-primary hover:bg-primary/90"
                  disabled={createPostMutation.isPending || !form.formState.isValid}
                >
                  {createPostMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      <ShinyText text="Submit Report" speed={3} />
                    </>
                  )}
                </Button>
                
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    form.reset();
                    setUploadedFiles([]);
                    if (fileInputRef.current) {
                      fileInputRef.current.value = '';
                    }
                  }}
                  disabled={createPostMutation.isPending}
                >
                  <ShinyText text="Reset Form" speed={3} />
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* Disclaimer */}
      <Card className="mt-6 border-warning/20 bg-warning/5">
        <CardContent className="p-4">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="h-5 w-5 text-warning mt-0.5" />
            <div className="space-y-1">
              <p className="text-sm font-medium text-warning-foreground">
                <ShinyText text="Important Notice" speed={3} />
              </p>
              <p className="text-xs text-muted-foreground">
                <ShinyText text="For immediate emergencies, call 911. This reporting system is for community awareness and non-emergency situations. All reports are reviewed and verified before being shared with the community." speed={6} />
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CreatePostForm;
