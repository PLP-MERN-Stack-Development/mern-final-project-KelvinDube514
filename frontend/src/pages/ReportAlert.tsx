import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import CreatePostForm from '@/components/forms/CreatePostForm';
import CreateAlertForm from '@/components/forms/CreateAlertForm';
import PostsList from '@/components/PostsList';
import ShinyText from '@/components/ui/ShinyText';

const ReportAlert = () => {
  const [activeTab, setActiveTab] = useState('report');

  const handlePostCreated = () => {
    // Switch to list view after successful creation
    setActiveTab('browse');
  };

  const handleAlertCreated = () => {
    // Switch to list view after successful creation
    setActiveTab('browse');
  };

  return (
    <div className="container mx-auto px-4 py-6">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">
          <ShinyText text="Community Safety Center" speed={4} />
        </h1>
        <p className="text-muted-foreground">
          <ShinyText text="Report incidents, create alerts, and browse community safety reports" speed={5} />
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="report">Report Incident</TabsTrigger>
          <TabsTrigger value="alert">Create Alert</TabsTrigger>
          <TabsTrigger value="browse">Browse Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="report">
          <CreatePostForm onSuccess={handlePostCreated} />
        </TabsContent>

        <TabsContent value="alert">
          <CreateAlertForm onSuccess={handleAlertCreated} />
        </TabsContent>

        <TabsContent value="browse">
          <PostsList showFilters={true} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ReportAlert;