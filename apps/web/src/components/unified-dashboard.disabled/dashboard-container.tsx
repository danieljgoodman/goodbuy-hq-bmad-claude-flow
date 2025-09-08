'use client';

import { useEffect } from 'react';
import { Loader2, RefreshCw, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useUnifiedDashboardStore } from '@/stores/unified-dashboard-store';
import { ComponentIntegration } from './component-integration';
import { NavigationHub } from './navigation-hub';
import { DataSynchronization } from './data-synchronization';
import { PerformanceMonitor } from './performance-monitor';

interface DashboardContainerProps {
  userId: string;
  businessId: string;
  className?: string;
}

export function DashboardContainer({ 
  userId, 
  businessId, 
  className = '' 
}: DashboardContainerProps) {
  const {
    dashboard,
    isLoading,
    error,
    lastRefresh,
    componentLoading,
    loadDashboard,
    refreshAll,
    setSelectedComponent,
    selectedComponent,
    subscribeToUpdates,
    clearError
  } = useUnifiedDashboardStore();

  useEffect(() => {
    // Initial load
    loadDashboard(userId, businessId);
    
    // Subscribe to real-time updates
    subscribeToUpdates(businessId);

    // Auto-refresh every 5 minutes if user preferences allow
    const autoRefreshInterval = dashboard?.userPreferences.autoRefresh 
      ? setInterval(() => {
          loadDashboard(userId, businessId, true);
        }, (dashboard.userPreferences.refreshInterval || 300) * 1000)
      : null;

    return () => {
      if (autoRefreshInterval) {
        clearInterval(autoRefreshInterval);
      }
    };
  }, [userId, businessId]);

  const handleRefreshAll = () => {
    refreshAll(userId, businessId);
  };

  const getIntegrationStatusBadge = () => {
    if (!dashboard?.integrationStatus) return null;

    const { syncStatus, isConnected } = dashboard.integrationStatus;
    
    const statusConfig = {
      success: { variant: 'default' as const, text: 'All Connected' },
      partial: { variant: 'secondary' as const, text: 'Partial Data' },
      failed: { variant: 'destructive' as const, text: 'Connection Issues' },
      in_progress: { variant: 'outline' as const, text: 'Syncing...' }
    };

    const config = statusConfig[syncStatus];
    
    return (
      <Badge variant={config.variant}>
        {config.text}
      </Badge>
    );
  };

  if (isLoading && !dashboard) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin" />
          <p className="text-muted-foreground">Loading your unified dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-destructive">
        <CardHeader>
          <CardTitle className="text-destructive">Error Loading Dashboard</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">{error}</p>
          <div className="flex space-x-2">
            <Button onClick={handleRefreshAll} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
            <Button onClick={clearError} variant="ghost" size="sm">
              Dismiss
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!dashboard) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-center text-muted-foreground">
            No dashboard data available. Please try refreshing.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={`unified-dashboard-container space-y-6 ${className}`}>
      {/* Dashboard Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center space-x-3">
            <h1 className="text-3xl font-bold">Business Intelligence Dashboard</h1>
            {getIntegrationStatusBadge()}
          </div>
          <p className="text-muted-foreground">
            Comprehensive analysis powered by AI • Last updated {lastRefresh?.toLocaleTimeString() || 'Never'}
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button 
            onClick={handleRefreshAll} 
            variant="outline" 
            size="sm"
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh All
          </Button>
          <Button variant="ghost" size="sm">
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
        </div>
      </div>

      {/* Navigation Hub */}
      <NavigationHub 
        selectedComponent={selectedComponent || 'overview'}
        onComponentSelect={setSelectedComponent}
        componentStatuses={dashboard.integrationStatus.components}
        isLoading={componentLoading}
      />

      {/* Data Synchronization Status */}
      <DataSynchronization 
        integrationStatus={dashboard.integrationStatus}
        onRefresh={handleRefreshAll}
      />

      {/* Main Dashboard Content */}
      <div className="grid gap-6">
        {selectedComponent === 'overview' ? (
          // Overview showing all components
          <div className="grid lg:grid-cols-2 gap-6">
            <ComponentIntegration
              type="valuation"
              data={dashboard.components.valuation}
              isLoading={componentLoading.valuation}
              businessId={businessId}
            />
            <ComponentIntegration
              type="healthScore"
              data={dashboard.components.healthScore}
              isLoading={componentLoading.healthScore}
              businessId={businessId}
            />
            <ComponentIntegration
              type="documentIntelligence"
              data={dashboard.components.documentIntelligence}
              isLoading={componentLoading.documentIntelligence}
              businessId={businessId}
            />
            <ComponentIntegration
              type="opportunities"
              data={dashboard.components.opportunities}
              isLoading={componentLoading.opportunities}
              businessId={businessId}
            />
          </div>
        ) : selectedComponent && (selectedComponent as any) !== 'overview' ? (
          // Focused view of selected component
          <ComponentIntegration
            type={selectedComponent as 'valuation' | 'healthScore' | 'documentIntelligence' | 'opportunities'}
            data={dashboard.components[selectedComponent as keyof typeof dashboard.components]}
            isLoading={componentLoading[selectedComponent as keyof typeof componentLoading]}
            businessId={businessId}
            expanded={true}
          />
        ) : null}
      </div>

      {/* Performance Monitor */}
      <PerformanceMonitor
        metrics={dashboard.performanceMetrics}
        dashboardId={dashboard.id}
      />

      {/* Export History Quick Access */}
      {dashboard.exportHistory.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Recent Exports</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {dashboard.exportHistory.slice(0, 3).map((exportRecord) => (
                <div 
                  key={exportRecord.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div>
                    <p className="font-medium capitalize">
                      {exportRecord.template} {exportRecord.exportType.toUpperCase()}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(exportRecord.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <Badge variant={
                    exportRecord.status === 'completed' ? 'default' :
                    exportRecord.status === 'failed' ? 'destructive' :
                    'secondary'
                  }>
                    {exportRecord.status}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}