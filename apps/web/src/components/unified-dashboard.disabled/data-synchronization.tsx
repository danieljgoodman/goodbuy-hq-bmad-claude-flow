'use client';

import { RefreshCw, CheckCircle, AlertCircle, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import type { IntegrationStatus } from '@/types/unified-dashboard';

interface DataSynchronizationProps {
  integrationStatus: IntegrationStatus;
  onRefresh: () => void;
}

export function DataSynchronization({
  integrationStatus,
  onRefresh
}: DataSynchronizationProps) {
  const getSyncIcon = () => {
    switch (integrationStatus.syncStatus) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'partial':
        return <AlertCircle className="h-5 w-5 text-yellow-600" />;
      case 'failed':
        return <AlertCircle className="h-5 w-5 text-red-600" />;
      case 'in_progress':
        return <RefreshCw className="h-5 w-5 text-blue-600 animate-spin" />;
      default:
        return <Clock className="h-5 w-5 text-gray-600" />;
    }
  };

  const getSyncMessage = () => {
    const messages = {
      success: 'All components synchronized successfully',
      partial: `${integrationStatus.errorCount} components need attention`,
      failed: 'Synchronization failed - please refresh',
      in_progress: 'Synchronizing data...'
    };
    return messages[integrationStatus.syncStatus] || 'Status unknown';
  };

  const getSyncProgress = () => {
    const total = Object.keys(integrationStatus.components).length;
    const errors = integrationStatus.errorCount;
    return ((total - errors) / total) * 100;
  };

  if (integrationStatus.syncStatus === 'success') {
    return null; // Don't show when everything is working
  }

  return (
    <Card className="border-l-4 border-l-blue-500">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {getSyncIcon()}
            <div>
              <p className="font-medium">{getSyncMessage()}</p>
              <p className="text-sm text-muted-foreground">
                Last sync: {integrationStatus.lastSyncAttempt.toLocaleTimeString()}
              </p>
              {integrationStatus.syncStatus === 'partial' && (
                <div className="mt-2">
                  <Progress value={getSyncProgress()} className="w-48" />
                </div>
              )}
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Badge variant={
              integrationStatus.syncStatus === 'partial' ? 'secondary' :
              integrationStatus.syncStatus === 'failed' ? 'destructive' :
              integrationStatus.syncStatus === 'in_progress' ? 'outline' :
              'outline'
            }>
              {integrationStatus.syncStatus.replace('_', ' ')}
            </Badge>
            
            <Button 
              variant="outline" 
              size="sm"
              onClick={onRefresh}
              disabled={integrationStatus.syncStatus === 'in_progress'}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${
                integrationStatus.syncStatus === 'in_progress' ? 'animate-spin' : ''
              }`} />
              Refresh
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}