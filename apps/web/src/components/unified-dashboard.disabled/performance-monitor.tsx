'use client';

import { Activity, Clock, Database, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import type { PerformanceMetrics } from '@/types/unified-dashboard';

interface PerformanceMonitorProps {
  metrics: PerformanceMetrics;
  dashboardId: string;
}

export function PerformanceMonitor({
  metrics,
  dashboardId
}: PerformanceMonitorProps) {
  const formatLoadTime = (time: number) => {
    return time < 1000 ? `${Math.round(time)}ms` : `${(time / 1000).toFixed(1)}s`;
  };

  const getPerformanceColor = (time: number, threshold: number = 1000) => {
    if (time < threshold * 0.5) return 'text-green-600';
    if (time < threshold) return 'text-yellow-600';
    return 'text-red-600';
  };

  const calculateHealthScore = () => {
    // Simple health score based on load times and error rates
    const avgLoadTime = metrics.loadTimes.initialLoad;
    const loadScore = Math.max(0, 100 - (avgLoadTime / 50)); // 5 seconds = 0 score
    
    const avgErrorRate = Object.values(metrics.systemHealth.errorRates).reduce((a, b) => a + b, 0) / 
                        Object.values(metrics.systemHealth.errorRates).length || 0;
    const errorScore = Math.max(0, 100 - (avgErrorRate * 100));
    
    return Math.round((loadScore + errorScore) / 2);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center text-lg">
          <Activity className="h-5 w-5 mr-2" />
          System Performance
        </CardTitle>
      </CardHeader>
      
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Load Time */}
          <div className="text-center">
            <Clock className="h-8 w-8 mx-auto mb-2 text-blue-600" />
            <p className="text-sm text-muted-foreground">Load Time</p>
            <p className={`text-lg font-semibold ${getPerformanceColor(metrics.loadTimes.initialLoad)}`}>
              {formatLoadTime(metrics.loadTimes.initialLoad)}
            </p>
          </div>

          {/* System Health */}
          <div className="text-center">
            <Database className="h-8 w-8 mx-auto mb-2 text-green-600" />
            <p className="text-sm text-muted-foreground">Health Score</p>
            <p className={`text-lg font-semibold ${getPerformanceColor(100 - calculateHealthScore(), 50)}`}>
              {calculateHealthScore()}%
            </p>
          </div>

          {/* Data Freshness */}
          <div className="text-center">
            <TrendingUp className="h-8 w-8 mx-auto mb-2 text-purple-600" />
            <p className="text-sm text-muted-foreground">Data Freshness</p>
            <p className="text-lg font-semibold text-green-600">
              {Math.round((Date.now() - metrics.dataFreshness.lastSync.getTime()) / (1000 * 60))}m ago
            </p>
          </div>

          {/* Session Duration */}
          <div className="text-center">
            <Activity className="h-8 w-8 mx-auto mb-2 text-orange-600" />
            <p className="text-sm text-muted-foreground">Session</p>
            <p className="text-lg font-semibold">
              {formatLoadTime(metrics.userEngagement.sessionDuration)}
            </p>
          </div>
        </div>

        {/* Component Load Times */}
        <div className="mt-6 space-y-2">
          <h4 className="font-medium">Component Performance</h4>
          {Object.entries(metrics.loadTimes.componentLoad).map(([component, time]) => (
            <div key={component} className="flex justify-between items-center">
              <span className="text-sm capitalize">{component}</span>
              <div className="flex items-center space-x-2 w-32">
                <Progress 
                  value={Math.max(0, 100 - (time / 20))} // 2 seconds = 0%
                  className="flex-1" 
                />
                <span className="text-sm w-12">{formatLoadTime(time)}</span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}