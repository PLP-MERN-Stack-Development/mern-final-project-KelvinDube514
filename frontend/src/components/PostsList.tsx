/**
 * PostsList - Component for displaying posts with loading/error states and optimistic updates
 * Features: Pagination, filtering, real-time updates, optimistic UI
 */

import { useState } from 'react';
import { Eye, MapPin, Clock, AlertTriangle, Loader2, RefreshCw, Filter, Search } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { usePosts, useDeletePost, useUpdatePost } from '@/hooks/useApi';
import { Post } from '@/services/ApiService';
import { useToast } from '@/hooks/use-toast';
import ShinyText from '@/components/ui/ShinyText';

interface PostsListProps {
  location?: { coordinates: [number, number]; radius: number };
  onPostSelect?: (post: Post) => void;
  showFilters?: boolean;
}

const PostsList = ({ location, onPostSelect, showFilters = true }: PostsListProps) => {
  const { toast } = useToast();
  
  // Filter states
  const [filters, setFilters] = useState({
    page: 1,
    limit: 20,
    type: undefined as Post['type'] | undefined,
    severity: undefined as Post['severity'] | undefined,
    status: undefined as Post['status'] | undefined,
    search: '',
  });

  // Query posts
  const { 
    data: postsData, 
    isLoading, 
    isError, 
    error, 
    refetch,
    isFetching
  } = usePosts({
    ...filters,
    location,
    type: filters.type,
    severity: filters.severity,
    status: filters.status,
  });

  const deletePostMutation = useDeletePost();
  const updatePostMutation = useUpdatePost();

  const posts = postsData?.data || [];
  const pagination = postsData?.pagination;

  const typeOptions = [
    { value: 'crime', label: 'Crime/Security', color: 'bg-red-500' },
    { value: 'accident', label: 'Traffic Accident', color: 'bg-orange-500' },
    { value: 'hazard', label: 'Environmental Hazard', color: 'bg-yellow-500' },
    { value: 'suspicious', label: 'Suspicious Activity', color: 'bg-purple-500' },
    { value: 'emergency', label: 'Emergency', color: 'bg-red-600' },
    { value: 'other', label: 'Other', color: 'bg-gray-500' }
  ];

  const severityOptions = [
    { value: 'low', label: 'Low', color: 'bg-green-500' },
    { value: 'medium', label: 'Medium', color: 'bg-yellow-500' },
    { value: 'high', label: 'High', color: 'bg-orange-500' },
    { value: 'critical', label: 'Critical', color: 'bg-red-600' }
  ];

  const statusOptions = [
    { value: 'pending', label: 'Pending', color: 'bg-gray-500' },
    { value: 'verified', label: 'Verified', color: 'bg-blue-500' },
    { value: 'resolved', label: 'Resolved', color: 'bg-green-500' },
    { value: 'dismissed', label: 'Dismissed', color: 'bg-gray-400' }
  ];

  const getTypeInfo = (type: Post['type']) => 
    typeOptions.find(option => option.value === type) || typeOptions[typeOptions.length - 1];

  const getSeverityInfo = (severity: Post['severity']) => 
    severityOptions.find(option => option.value === severity) || severityOptions[0];

  const getStatusInfo = (status: Post['status']) => 
    statusOptions.find(option => option.value === status) || statusOptions[0];

  const formatTimeAgo = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return `${diffInSeconds}s ago`;
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
  };

  const calculateDistance = (post: Post) => {
    if (!location) return null;
    
    const [postLng, postLat] = post.location.coordinates;
    const [userLng, userLat] = location.coordinates;
    
    const R = 6371; // Earth's radius in km
    const dLat = (userLat - postLat) * Math.PI / 180;
    const dLng = (userLng - postLng) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(postLat * Math.PI / 180) * Math.cos(userLat * Math.PI / 180) *
              Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c;
    
    return distance < 1 ? `${Math.round(distance * 1000)}m` : `${distance.toFixed(1)}km`;
  };

  const handleDeletePost = async (postId: string) => {
    if (!confirm('Are you sure you want to delete this post?')) return;
    
    try {
      await deletePostMutation.mutateAsync(postId);
    } catch (error) {
      // Error handled by mutation
    }
  };

  const handleUpdateStatus = async (postId: string, status: Post['status']) => {
    try {
      await updatePostMutation.mutateAsync({ id: postId, data: { status } });
    } catch (error) {
      // Error handled by mutation
    }
  };

  const handleFilterChange = (key: string, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      page: 1 // Reset to first page when filtering
    }));
  };

  const clearFilters = () => {
    setFilters({
      page: 1,
      limit: 20,
      type: undefined,
      severity: undefined,
      status: undefined,
      search: '',
    });
  };

  const PostSkeleton = () => (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start space-x-4">
          <Skeleton className="w-12 h-12 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
            <div className="flex space-x-2">
              <Skeleton className="h-6 w-16" />
              <Skeleton className="h-6 w-20" />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">
            <ShinyText text="Safety Reports" speed={4} />
          </h2>
          <p className="text-muted-foreground">
            <ShinyText text="Community incident reports and safety updates" speed={5} />
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isFetching}
          >
            <RefreshCw className={`h-4 w-4 mr-1 ${isFetching ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          
          {pagination && (
            <Badge variant="outline">
              {pagination.total} total reports
            </Badge>
          )}
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center space-x-2 text-lg">
              <Filter className="h-4 w-4" />
              <span>Filters</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              {/* Search */}
              <div className="md:col-span-2">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search reports..."
                    value={filters.search}
                    onChange={(e) => handleFilterChange('search', e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Type Filter */}
              <Select
                value={filters.type || ''}
                onValueChange={(value) => handleFilterChange('type', value || undefined)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Types</SelectItem>
                  {typeOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      <div className="flex items-center space-x-2">
                        <div className={`w-3 h-3 rounded-full ${option.color}`} />
                        <span>{option.label}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Severity Filter */}
              <Select
                value={filters.severity || ''}
                onValueChange={(value) => handleFilterChange('severity', value || undefined)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Severities" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Severities</SelectItem>
                  {severityOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      <div className="flex items-center space-x-2">
                        <div className={`w-3 h-3 rounded-full ${option.color}`} />
                        <span>{option.label}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Status Filter */}
              <Select
                value={filters.status || ''}
                onValueChange={(value) => handleFilterChange('status', value || undefined)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Statuses</SelectItem>
                  {statusOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      <div className="flex items-center space-x-2">
                        <div className={`w-3 h-3 rounded-full ${option.color}`} />
                        <span>{option.label}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Active Filters */}
            {(filters.type || filters.severity || filters.status || filters.search) && (
              <div className="flex items-center justify-between mt-4">
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-muted-foreground">Active filters:</span>
                  {filters.type && (
                    <Badge variant="secondary">
                      Type: {getTypeInfo(filters.type).label}
                    </Badge>
                  )}
                  {filters.severity && (
                    <Badge variant="secondary">
                      Severity: {getSeverityInfo(filters.severity).label}
                    </Badge>
                  )}
                  {filters.status && (
                    <Badge variant="secondary">
                      Status: {getStatusInfo(filters.status).label}
                    </Badge>
                  )}
                  {filters.search && (
                    <Badge variant="secondary">
                      Search: "{filters.search}"
                    </Badge>
                  )}
                </div>
                <Button variant="ghost" size="sm" onClick={clearFilters}>
                  Clear All
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Error State */}
      {isError && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Failed to load posts: {error?.message || 'Unknown error occurred'}
          </AlertDescription>
        </Alert>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, index) => (
            <PostSkeleton key={index} />
          ))}
        </div>
      )}

      {/* Posts List */}
      {!isLoading && posts.length > 0 && (
        <div className="space-y-4">
          {posts.map((post) => {
            const typeInfo = getTypeInfo(post.type);
            const severityInfo = getSeverityInfo(post.severity);
            const statusInfo = getStatusInfo(post.status);
            const distance = calculateDistance(post);

            return (
              <Card key={post._id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start space-x-4">
                    {/* Type Icon */}
                    <div className={`w-12 h-12 rounded-full ${typeInfo.color} flex items-center justify-center text-white font-semibold`}>
                      {post.type.charAt(0).toUpperCase()}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg mb-1">{post.title}</h3>
                          <p className="text-muted-foreground text-sm mb-3 line-clamp-2">
                            {post.description}
                          </p>
                          
                          {/* Badges */}
                          <div className="flex flex-wrap items-center gap-2 mb-2">
                            <Badge variant="outline" className="text-xs">
                              <div className="flex items-center space-x-1">
                                <div className={`w-2 h-2 rounded-full ${typeInfo.color}`} />
                                <span>{typeInfo.label}</span>
                              </div>
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              <div className="flex items-center space-x-1">
                                <div className={`w-2 h-2 rounded-full ${severityInfo.color}`} />
                                <span>{severityInfo.label}</span>
                              </div>
                            </Badge>
                            <Badge variant={statusInfo.value === 'verified' ? 'default' : 'secondary'} className="text-xs">
                              {statusInfo.label}
                            </Badge>
                          </div>

                          {/* Meta Info */}
                          <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                            <div className="flex items-center space-x-1">
                              <MapPin className="h-3 w-3" />
                              <span className="truncate max-w-32">
                                {post.location.address.street || 'Unknown location'}
                              </span>
                              {distance && <span>({distance})</span>}
                            </div>
                            <div className="flex items-center space-x-1">
                              <Clock className="h-3 w-3" />
                              <span>{formatTimeAgo(post.createdAt)}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <span>by {post.reportedBy.firstName} {post.reportedBy.lastName}</span>
                            </div>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center space-x-2 ml-4">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onPostSelect?.(post)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          
                          {/* Status Update Dropdown */}
                          <Select
                            value={post.status}
                            onValueChange={(value) => handleUpdateStatus(post._id, value as Post['status'])}
                            disabled={updatePostMutation.isPending}
                          >
                            <SelectTrigger className="w-32 h-8">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {statusOptions.map((option) => (
                                <SelectItem key={option.value} value={option.value}>
                                  {option.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && posts.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Reports Found</h3>
            <p className="text-muted-foreground mb-4">
              {Object.values(filters).some(v => v) 
                ? 'No reports match your current filters. Try adjusting or clearing your filters.'
                : 'No safety reports have been submitted yet.'}
            </p>
            {Object.values(filters).some(v => v) && (
              <Button variant="outline" onClick={clearFilters}>
                Clear Filters
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleFilterChange('page', filters.page - 1)}
              disabled={filters.page <= 1 || isFetching}
            >
              Previous
            </Button>
            <span className="text-sm text-muted-foreground">
              Page {pagination.page} of {pagination.totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleFilterChange('page', filters.page + 1)}
              disabled={filters.page >= pagination.totalPages || isFetching}
            >
              Next
            </Button>
          </div>
          
          <div className="text-sm text-muted-foreground">
            Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
            {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
            {pagination.total} reports
          </div>
        </div>
      )}

      {/* Loading indicator for pagination */}
      {isFetching && !isLoading && (
        <div className="flex items-center justify-center py-4">
          <Loader2 className="h-4 w-4 animate-spin mr-2" />
          <span className="text-sm text-muted-foreground">Loading...</span>
        </div>
      )}
    </div>
  );
};

export default PostsList;
