/**
 * ApiService - Centralized service for all backend API communication
 * Handles HTTP requests, error handling, authentication, and response transformation
 */

import { QueryClient } from '@tanstack/react-query';

// Base API configuration
const API_BASE_URL = (import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000') + '/api';

// Types for API responses
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: Array<{
    field: string;
    message: string;
  }>;
  statusCode?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// User types
export interface User {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: 'citizen' | 'authority' | 'admin';
  isActive: boolean;
  location?: {
    coordinates: [number, number];
    address: {
      street: string;
      city: string;
      state: string;
      zipCode: string;
      country: string;
    };
  };
  createdAt: string;
  updatedAt: string;
}

// Post/Incident types
export interface Post {
  _id: string;
  type: 'crime' | 'accident' | 'hazard' | 'suspicious' | 'emergency' | 'other';
  title: string;
  description: string;
  location: {
    type: 'Point';
    coordinates: [number, number];
    address: {
      street: string;
      city: string;
      state: string;
      zipCode: string;
      country: string;
    };
  };
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'pending' | 'verified' | 'resolved' | 'dismissed';
  media?: Array<{
    type: 'image' | 'video';
    url: string;
    filename: string;
  }>;
  reportedBy: User;
  verifiedBy?: User;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Alert types
export interface Alert {
  _id: string;
  type: 'critical' | 'warning' | 'info' | 'safe';
  title: string;
  message: string;
  location: {
    type: 'Point';
    coordinates: [number, number];
    address: {
      street: string;
      city: string;
      state: string;
      zipCode: string;
      country: string;
    };
  };
  priority: 'low' | 'medium' | 'high' | 'critical';
  targetAudience: 'all' | 'authorities' | 'citizens';
  radius?: number; // Alert radius in kilometers
  createdBy: User;
  isActive: boolean;
  expiresAt?: string;
  createdAt: string;
  updatedAt: string;
}

// Request types
export interface CreatePostRequest {
  type: Post['type'];
  title: string;
  description: string;
  location: {
    coordinates: [number, number];
    address: string;
  };
  severity: Post['severity'];
  media?: File[];
}

export interface UpdatePostRequest extends Partial<CreatePostRequest> {
  status?: Post['status'];
}

export interface CreateAlertRequest {
  type: Alert['type'];
  title: string;
  message: string;
  location: {
    coordinates: [number, number];
    address: string;
  };
  priority: Alert['priority'];
  targetAudience?: Alert['targetAudience'];
  radius?: number;
  expiresAt?: string;
}

// API Error class
export class ApiError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public errors?: Array<{ field: string; message: string }>
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

class ApiService {
  private authToken: string | null = null;
  private queryClient: QueryClient | null = null;

  /**
   * Initialize the API service with authentication token and query client
   */
  initialize(token: string | null, queryClient: QueryClient) {
    this.authToken = token;
    this.queryClient = queryClient;
  }

  /**
   * Set authentication token
   */
  setAuthToken(token: string | null) {
    this.authToken = token;
  }

  /**
   * Get authentication headers
   */
  private getAuthHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (this.authToken) {
      headers.Authorization = `Bearer ${this.authToken}`;
    }

    return headers;
  }

  /**
   * Make HTTP request with error handling
   */
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${API_BASE_URL}${endpoint}`;
    
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          ...this.getAuthHeaders(),
          ...options.headers,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new ApiError(
          response.status,
          data.message || 'An error occurred',
          data.errors
        );
      }

      return data;
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }

      // Network or other errors
      throw new ApiError(
        0,
        error instanceof Error ? error.message : 'Network error occurred'
      );
    }
  }

  /**
   * Upload files using FormData
   */
  private async uploadFiles<T>(
    endpoint: string,
    formData: FormData
  ): Promise<ApiResponse<T>> {
    const url = `${API_BASE_URL}${endpoint}`;
    
    try {
      const headers: Record<string, string> = {};
      
      if (this.authToken) {
        headers.Authorization = `Bearer ${this.authToken}`;
      }

      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new ApiError(
          response.status,
          data.message || 'Upload failed',
          data.errors
        );
      }

      return data;
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }

      throw new ApiError(
        0,
        error instanceof Error ? error.message : 'Upload failed'
      );
    }
  }

  // Authentication endpoints
  async login(email: string, password: string): Promise<ApiResponse<{ user: User; token: string }>> {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  async register(userData: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    location?: { coordinates: [number, number]; address: string };
  }): Promise<ApiResponse<{ user: User; token: string }>> {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  async logout(): Promise<ApiResponse> {
    return this.request('/auth/logout', {
      method: 'POST',
    });
  }

  async refreshToken(): Promise<ApiResponse<{ token: string }>> {
    return this.request('/auth/refresh', {
      method: 'POST',
    });
  }

  async getProfile(): Promise<ApiResponse<User>> {
    return this.request('/auth/profile');
  }

  async updateProfile(userData: Partial<User>): Promise<ApiResponse<User>> {
    return this.request('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(userData),
    });
  }

  // Posts/Incidents endpoints
  async getPosts(params?: {
    page?: number;
    limit?: number;
    type?: Post['type'];
    severity?: Post['severity'];
    status?: Post['status'];
    location?: { coordinates: [number, number]; radius: number };
  }): Promise<ApiResponse<PaginatedResponse<Post>>> {
    const searchParams = new URLSearchParams();
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          if (key === 'location') {
            searchParams.append('lat', value.coordinates[1].toString());
            searchParams.append('lng', value.coordinates[0].toString());
            searchParams.append('radius', value.radius.toString());
          } else {
            searchParams.append(key, value.toString());
          }
        }
      });
    }

    const endpoint = `/incidents${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;
    return this.request(endpoint);
  }

  async getPost(id: string): Promise<ApiResponse<Post>> {
    return this.request(`/incidents/${id}`);
  }

  async createPost(postData: CreatePostRequest): Promise<ApiResponse<Post>> {
    if (postData.media && postData.media.length > 0) {
      const formData = new FormData();
      
      // Add text fields
      formData.append('type', postData.type);
      formData.append('title', postData.title);
      formData.append('description', postData.description);
      formData.append('severity', postData.severity);
      formData.append('latitude', postData.location.coordinates[1].toString());
      formData.append('longitude', postData.location.coordinates[0].toString());
      formData.append('address', postData.location.address);
      
      // Add media files
      postData.media.forEach((file) => {
        formData.append('media', file);
      });

      return this.uploadFiles('/incidents', formData);
    } else {
      return this.request('/incidents', {
        method: 'POST',
        body: JSON.stringify({
          ...postData,
          latitude: postData.location.coordinates[1],
          longitude: postData.location.coordinates[0],
          address: postData.location.address,
        }),
      });
    }
  }

  async updatePost(id: string, postData: UpdatePostRequest): Promise<ApiResponse<Post>> {
    return this.request(`/incidents/${id}`, {
      method: 'PUT',
      body: JSON.stringify(postData),
    });
  }

  async deletePost(id: string): Promise<ApiResponse> {
    return this.request(`/incidents/${id}`, {
      method: 'DELETE',
    });
  }

  // Alerts endpoints
  async getAlerts(params?: {
    page?: number;
    limit?: number;
    type?: Alert['type'];
    priority?: Alert['priority'];
    location?: { coordinates: [number, number]; radius: number };
  }): Promise<ApiResponse<PaginatedResponse<Alert>>> {
    const searchParams = new URLSearchParams();
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          if (key === 'location') {
            searchParams.append('lat', value.coordinates[1].toString());
            searchParams.append('lng', value.coordinates[0].toString());
            searchParams.append('radius', value.radius.toString());
          } else {
            searchParams.append(key, value.toString());
          }
        }
      });
    }

    const endpoint = `/alerts${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;
    return this.request(endpoint);
  }

  async getAlert(id: string): Promise<ApiResponse<Alert>> {
    return this.request(`/alerts/${id}`);
  }

  async createAlert(alertData: CreateAlertRequest): Promise<ApiResponse<Alert>> {
    return this.request('/alerts', {
      method: 'POST',
      body: JSON.stringify({
        ...alertData,
        latitude: alertData.location.coordinates[1],
        longitude: alertData.location.coordinates[0],
        address: alertData.location.address,
      }),
    });
  }

  async updateAlert(id: string, alertData: Partial<CreateAlertRequest>): Promise<ApiResponse<Alert>> {
    return this.request(`/alerts/${id}`, {
      method: 'PUT',
      body: JSON.stringify(alertData),
    });
  }

  async deleteAlert(id: string): Promise<ApiResponse> {
    return this.request(`/alerts/${id}`, {
      method: 'DELETE',
    });
  }

  // Dashboard/Analytics endpoints
  async getDashboardMetrics(): Promise<ApiResponse<{
    totalIncidents: number;
    activeAlerts: number;
    safetyScore: number;
    recentActivity: number;
    incidentsByType: Record<string, number>;
    incidentsBySeverity: Record<string, number>;
    trendsData: Array<{ date: string; incidents: number; alerts: number }>;
  }>> {
    return this.request('/dashboard/metrics');
  }

  // Incidents analytics/statistics endpoints
  async getIncidentStats(): Promise<ApiResponse<any>> {
    return this.request('/incidents/stats');
  }

  async getNearbyActivity(location: {
    coordinates: [number, number];
    radius: number;
  }): Promise<ApiResponse<{
    incidents: Post[];
    alerts: Alert[];
  }>> {
    const params = new URLSearchParams({
      lat: location.coordinates[1].toString(),
      lng: location.coordinates[0].toString(),
      radius: location.radius.toString(),
    });

    return this.request(`/dashboard/nearby?${params.toString()}`);
  }

  // Utility methods for React Query integration
  async invalidateQueries(queryKeys: string[]) {
    if (this.queryClient) {
      await Promise.all(
        queryKeys.map(key => this.queryClient!.invalidateQueries({ queryKey: [key] }))
      );
    }
  }

  async updateQueryData<T>(queryKey: string[], updater: (old: T | undefined) => T) {
    if (this.queryClient) {
      this.queryClient.setQueryData(queryKey, updater);
    }
  }
}

// Create singleton instance
export const apiService = new ApiService();
export default ApiService;
