/**
 * Custom React Query hooks for API state management
 * Provides optimistic updates, caching, and error handling
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { 
  apiService, 
  Post, 
  Alert, 
  CreatePostRequest, 
  UpdatePostRequest, 
  CreateAlertRequest,
  User,
  ApiError,
  PaginatedResponse
} from '@/services/ApiService';

// Query keys for React Query
export const QUERY_KEYS = {
  POSTS: 'posts',
  POST: 'post',
  ALERTS: 'alerts',
  ALERT: 'alert',
  PROFILE: 'profile',
  DASHBOARD_METRICS: 'dashboardMetrics',
  NEARBY_ACTIVITY: 'nearbyActivity',
} as const;

// Authentication hooks
export const useLogin = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) =>
      apiService.login(email, password),
    onSuccess: (response) => {
      if (response.success && response.data) {
        // Store token and initialize API service
        localStorage.setItem('authToken', response.data.token);
        apiService.setAuthToken(response.data.token);
        
        // Cache user data
        queryClient.setQueryData([QUERY_KEYS.PROFILE], response.data.user);
        
        toast({
          title: 'Login successful',
          description: 'Welcome back to SecurePath!',
        });
      }
    },
    onError: (error: ApiError) => {
      toast({
        title: 'Login failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
};

export const useRegister = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userData: {
      firstName: string;
      lastName: string;
      email: string;
      password: string;
      location?: { coordinates: [number, number]; address: string };
    }) => apiService.register(userData),
    onSuccess: (response) => {
      if (response.success && response.data) {
        localStorage.setItem('authToken', response.data.token);
        apiService.setAuthToken(response.data.token);
        queryClient.setQueryData([QUERY_KEYS.PROFILE], response.data.user);
        
        toast({
          title: 'Registration successful',
          description: 'Welcome to SecurePath!',
        });
      }
    },
    onError: (error: ApiError) => {
      toast({
        title: 'Registration failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
};

export const useLogout = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => apiService.logout(),
    onSuccess: () => {
      localStorage.removeItem('authToken');
      apiService.setAuthToken(null);
      queryClient.clear();
      
      toast({
        title: 'Logged out',
        description: 'You have been successfully logged out.',
      });
    },
    onError: (error: ApiError) => {
      // Even if logout fails on server, clear local data
      localStorage.removeItem('authToken');
      apiService.setAuthToken(null);
      queryClient.clear();
      
      toast({
        title: 'Logged out',
        description: 'You have been logged out.',
      });
    },
  });
};

export const useProfile = () => {
  return useQuery({
    queryKey: [QUERY_KEYS.PROFILE],
    queryFn: async () => {
      const response = await apiService.getProfile();
      return response.data;
    },
    enabled: !!localStorage.getItem('authToken'),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useUpdateProfile = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userData: Partial<User>) => apiService.updateProfile(userData),
    onMutate: async (newData) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: [QUERY_KEYS.PROFILE] });

      // Snapshot previous value
      const previousProfile = queryClient.getQueryData([QUERY_KEYS.PROFILE]);

      // Optimistically update profile
      queryClient.setQueryData([QUERY_KEYS.PROFILE], (old: User | undefined) => {
        if (!old) return old;
        return { ...old, ...newData };
      });

      return { previousProfile };
    },
    onSuccess: (response) => {
      if (response.success && response.data) {
        queryClient.setQueryData([QUERY_KEYS.PROFILE], response.data);
        toast({
          title: 'Profile updated',
          description: 'Your profile has been successfully updated.',
        });
      }
    },
    onError: (error: ApiError, _, context) => {
      // Rollback optimistic update
      if (context?.previousProfile) {
        queryClient.setQueryData([QUERY_KEYS.PROFILE], context.previousProfile);
      }
      
      toast({
        title: 'Update failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
};

// Posts/Incidents hooks
export const usePosts = (params?: {
  page?: number;
  limit?: number;
  type?: Post['type'];
  severity?: Post['severity'];
  status?: Post['status'];
  location?: { coordinates: [number, number]; radius: number };
}) => {
  return useQuery({
    queryKey: [QUERY_KEYS.POSTS, params],
    queryFn: async () => {
      const response = await apiService.getPosts(params);
      return response.data;
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    placeholderData: (previousData) => previousData,
  });
};

export const usePost = (id: string) => {
  return useQuery({
    queryKey: [QUERY_KEYS.POST, id],
    queryFn: async () => {
      const response = await apiService.getPost(id);
      return response.data;
    },
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useCreatePost = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (postData: CreatePostRequest) => apiService.createPost(postData),
    onMutate: async (newPost) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: [QUERY_KEYS.POSTS] });

      // Snapshot previous value
      const previousPosts = queryClient.getQueryData([QUERY_KEYS.POSTS]);

      // Create optimistic post
      const optimisticPost: Post = {
        _id: `temp-${Date.now()}`,
        type: newPost.type,
        title: newPost.title,
        description: newPost.description,
        location: {
          type: 'Point',
          coordinates: newPost.location.coordinates,
          address: {
            street: newPost.location.address,
            city: '',
            state: '',
            zipCode: '',
            country: '',
          },
        },
        severity: newPost.severity,
        status: 'pending',
        reportedBy: queryClient.getQueryData([QUERY_KEYS.PROFILE]) as User,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Optimistically update posts list
      queryClient.setQueryData([QUERY_KEYS.POSTS], (old: PaginatedResponse<Post> | undefined) => {
        if (!old) return old;
        return {
          ...old,
          data: [optimisticPost, ...old.data],
        };
      });

      return { previousPosts, optimisticPost };
    },
    onSuccess: (response, _, context) => {
      if (response.success && response.data) {
        // Update the optimistic post with real data
        queryClient.setQueryData([QUERY_KEYS.POSTS], (old: PaginatedResponse<Post> | undefined) => {
          if (!old) return old;
          return {
            ...old,
            data: old.data.map(post => 
              post._id === context?.optimisticPost._id ? response.data! : post
            ),
          };
        });

        // Invalidate and refetch
        queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.POSTS] });
        queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.DASHBOARD_METRICS] });
        
        toast({
          title: 'Post created',
          description: 'Your safety report has been submitted successfully.',
        });
      }
    },
    onError: (error: ApiError, _, context) => {
      // Rollback optimistic update
      if (context?.previousPosts) {
        queryClient.setQueryData([QUERY_KEYS.POSTS], context.previousPosts);
      }
      
      toast({
        title: 'Failed to create post',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
};

export const useUpdatePost = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdatePostRequest }) =>
      apiService.updatePost(id, data),
    onMutate: async ({ id, data }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: [QUERY_KEYS.POST, id] });
      await queryClient.cancelQueries({ queryKey: [QUERY_KEYS.POSTS] });

      // Snapshot previous values
      const previousPost = queryClient.getQueryData([QUERY_KEYS.POST, id]);
      const previousPosts = queryClient.getQueryData([QUERY_KEYS.POSTS]);

      // Optimistically update post
      queryClient.setQueryData([QUERY_KEYS.POST, id], (old: Post | undefined) => {
        if (!old) return old;
        return { ...old, ...data, updatedAt: new Date().toISOString() };
      });

      // Update in posts list
      queryClient.setQueryData([QUERY_KEYS.POSTS], (old: PaginatedResponse<Post> | undefined) => {
        if (!old) return old;
        return {
          ...old,
          data: old.data.map(post => 
            post._id === id ? { ...post, ...data, updatedAt: new Date().toISOString() } : post
          ),
        };
      });

      return { previousPost, previousPosts };
    },
    onSuccess: (response, { id }) => {
      if (response.success && response.data) {
        queryClient.setQueryData([QUERY_KEYS.POST, id], response.data);
        queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.POSTS] });
        
        toast({
          title: 'Post updated',
          description: 'The post has been successfully updated.',
        });
      }
    },
    onError: (error: ApiError, { id }, context) => {
      // Rollback optimistic updates
      if (context?.previousPost) {
        queryClient.setQueryData([QUERY_KEYS.POST, id], context.previousPost);
      }
      if (context?.previousPosts) {
        queryClient.setQueryData([QUERY_KEYS.POSTS], context.previousPosts);
      }
      
      toast({
        title: 'Update failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
};

export const useDeletePost = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => apiService.deletePost(id),
    onMutate: async (id) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: [QUERY_KEYS.POSTS] });

      // Snapshot previous value
      const previousPosts = queryClient.getQueryData([QUERY_KEYS.POSTS]);

      // Optimistically remove post
      queryClient.setQueryData([QUERY_KEYS.POSTS], (old: PaginatedResponse<Post> | undefined) => {
        if (!old) return old;
        return {
          ...old,
          data: old.data.filter(post => post._id !== id),
        };
      });

      return { previousPosts };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.POSTS] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.DASHBOARD_METRICS] });
      
      toast({
        title: 'Post deleted',
        description: 'The post has been successfully deleted.',
      });
    },
    onError: (error: ApiError, _, context) => {
      // Rollback optimistic update
      if (context?.previousPosts) {
        queryClient.setQueryData([QUERY_KEYS.POSTS], context.previousPosts);
      }
      
      toast({
        title: 'Delete failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
};

// Alerts hooks
export const useAlerts = (params?: {
  page?: number;
  limit?: number;
  type?: Alert['type'];
  priority?: Alert['priority'];
  location?: { coordinates: [number, number]; radius: number };
}) => {
  return useQuery({
    queryKey: [QUERY_KEYS.ALERTS, params],
    queryFn: async () => {
      const response = await apiService.getAlerts(params);
      return response.data;
    },
    staleTime: 1 * 60 * 1000, // 1 minute (alerts need fresh data)
    placeholderData: (previousData) => previousData,
  });
};

export const useAlert = (id: string) => {
  return useQuery({
    queryKey: [QUERY_KEYS.ALERT, id],
    queryFn: async () => {
      const response = await apiService.getAlert(id);
      return response.data;
    },
    enabled: !!id,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

export const useCreateAlert = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (alertData: CreateAlertRequest) => apiService.createAlert(alertData),
    onSuccess: (response) => {
      if (response.success) {
        queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.ALERTS] });
        queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.DASHBOARD_METRICS] });
        
        toast({
          title: 'Alert created',
          description: 'Emergency alert has been broadcasted successfully.',
        });
      }
    },
    onError: (error: ApiError) => {
      toast({
        title: 'Failed to create alert',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
};

// Dashboard hooks
export const useDashboardMetrics = () => {
  return useQuery({
    queryKey: [QUERY_KEYS.DASHBOARD_METRICS],
    queryFn: async () => {
      const response = await apiService.getDashboardMetrics();
      return response.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 30 * 1000, // Refetch every 30 seconds
  });
};

export const useNearbyActivity = (location: {
  coordinates: [number, number];
  radius: number;
}) => {
  return useQuery({
    queryKey: [QUERY_KEYS.NEARBY_ACTIVITY, location],
    queryFn: async () => {
      const response = await apiService.getNearbyActivity(location);
      return response.data;
    },
    enabled: !!location.coordinates[0] && !!location.coordinates[1],
    staleTime: 2 * 60 * 1000, // 2 minutes
    refetchInterval: 30 * 1000, // Refetch every 30 seconds
  });
};
