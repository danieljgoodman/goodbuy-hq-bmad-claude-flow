'use client'

import { useEffect, useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { useEvaluationStore } from '@/stores/evaluation-store'
import { EvaluationService } from '@/lib/services/evaluation-service';
// Removed ProtectedRoute - Clerk middleware handles authentication
import DashboardLayout from '@/components/dashboard/dashboard-layout';
import { Skeleton } from '@/components/ui/skeleton';
import type { DashboardMetrics, ChartDataPoint, ActivityItem, HealthScoreBreakdown, DashboardFilters, ComparisonState, ExportData } from '@/types/dashboard';

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header Skeleton */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-96" />
          <Skeleton className="h-4 w-64" />
        </div>
        <div className="flex space-x-2">
          <Skeleton className="h-9 w-24" />
          <Skeleton className="h-9 w-24" />
        </div>
      </div>

      {/* Navigation Skeleton */}
      <div className="flex space-x-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-32" />
        ))}
      </div>

      {/* Dashboard Grid Skeleton */}
      <div className="grid lg:grid-cols-2 gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="space-y-4">
            <Skeleton className="h-48 w-full" />
          </div>
        ))}
      </div>

      {/* Performance Monitor Skeleton */}
      <Skeleton className="h-32 w-full" />
    </div>
  );
}

// Function to calculate real metrics from evaluations
const calculateMetricsFromEvaluations = (evaluations: any[]): DashboardMetrics | null => {
  if (evaluations.length === 0) return null;

  const completedEvaluations = evaluations.filter(e => e.status === 'completed');
  if (completedEvaluations.length === 0) return null;

  // Get the latest evaluation for current metrics
  const latestEvaluation = completedEvaluations.sort((a, b) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )[0];

  // Calculate average health score
  const avgHealthScore = completedEvaluations.reduce((sum, evaluation) => sum + (evaluation.healthScore || 0), 0) / completedEvaluations.length;

  // Get business valuation (handle both object and number formats)
  const getValuation = (val: any): number => {
    if (typeof val === 'object' && val?.value) return val.value;
    if (typeof val === 'number') return val;
    return 0;
  };

  const currentValuation = getValuation(latestEvaluation.valuations?.weighted);
  
  // Calculate growth rate if we have multiple evaluations
  let growthRate = 0;
  if (completedEvaluations.length > 1) {
    const oldestEval = completedEvaluations[completedEvaluations.length - 1];
    const oldValuation = getValuation(oldestEval.valuations?.weighted);
    if (oldValuation > 0) {
      growthRate = ((currentValuation - oldValuation) / oldValuation) * 100;
    }
  }

  // Determine risk level based on health score
  const riskLevel = avgHealthScore >= 80 ? 'low' : avgHealthScore >= 60 ? 'medium' : 'high';

  return {
    businessValuation: currentValuation,
    healthScore: Math.round(avgHealthScore),
    growthRate: Math.round(growthRate * 10) / 10, // Round to 1 decimal
    riskLevel: riskLevel as 'low' | 'medium' | 'high',
    lastUpdated: new Date(latestEvaluation.updatedAt || latestEvaluation.createdAt),
    totalEvaluations: evaluations.length,
    documentsProcessed: evaluations.reduce((sum, evaluation) => sum + (evaluation.documentsProcessed || 0), 0),
    averageProcessingTime: 2.1 // This would need to be calculated from actual processing times
  };
};

// Function to generate chart data from evaluations
const generateChartDataFromEvaluations = (evaluations: any[]): { valuationData: ChartDataPoint[], trendData: ChartDataPoint[] } => {
  const completedEvaluations = evaluations
    .filter(e => e.status === 'completed')
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  const valuationData: ChartDataPoint[] = completedEvaluations.map(evaluation => ({
    date: new Date(evaluation.createdAt).toISOString().split('T')[0],
    value: typeof evaluation.valuations?.weighted === 'object' && evaluation.valuations?.weighted?.value 
      ? evaluation.valuations.weighted.value 
      : typeof evaluation.valuations?.weighted === 'number'
      ? evaluation.valuations.weighted
      : 0,
    category: 'valuation'
  }));

  const trendData: ChartDataPoint[] = completedEvaluations.map(evaluation => ({
    date: new Date(evaluation.createdAt).toISOString().split('T')[0],
    value: evaluation.healthScore || 0,
    category: 'health'
  }));

  return { valuationData, trendData };
};

// Function to generate activity items from evaluations
const generateActivityFromEvaluations = (evaluations: any[]): ActivityItem[] => {
  return evaluations
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 8) // Get latest 8 activities
    .map(evaluation => ({
      id: evaluation.id,
      type: evaluation.status === 'completed' ? 'evaluation_created' : 'data_updated' as any,
      timestamp: new Date(evaluation.createdAt),
      description: evaluation.status === 'completed' 
        ? `Business evaluation completed with ${evaluation.healthScore}/100 health score`
        : evaluation.status === 'processing'
        ? 'Business evaluation in progress'
        : 'Business evaluation failed',
      metadata: {
        evaluationId: evaluation.id,
        healthScore: evaluation.healthScore,
        status: evaluation.status
      },
      userId: evaluation.userId,
      status: evaluation.status === 'completed' ? 'success' : evaluation.status === 'processing' ? 'pending' : 'error' as any
    }));
};

export default function DashboardPage() {
  const { isLoaded, user } = useUser();
  const router = useRouter();
  const { evaluations, loadEvaluations, isLoading: evaluationsLoading } = useEvaluationStore();
  
  // Dashboard state
  const [filters, setFilters] = useState<DashboardFilters>({
    dateRange: {
      start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      end: new Date()
    },
    businessCategories: [],
    evaluationTypes: ['completed', 'processing', 'failed']
  });
  
  const [comparison, setComparison] = useState<ComparisonState>({
    selectedEvaluations: [],
    comparisonMode: 'side-by-side',
    metrics: ['healthScore', 'valuation']
  });

  // Handler functions
  const handleFiltersChange = (newFilters: DashboardFilters) => {
    setFilters(newFilters);
    // TODO: Apply filters to data
  };

  const handleComparisonChange = (newComparison: ComparisonState) => {
    setComparison(newComparison);
  };

  const handleExport = async (exportData: ExportData): Promise<string> => {
    // TODO: Implement actual export functionality
    console.log('Export data:', exportData);
    return '/fake-export-url';
  };

  const handleShareDashboard = () => {
    // TODO: Implement share functionality
    const shareUrl = `${window.location.origin}/dashboard/shared/${user?.id}`;
    navigator.clipboard.writeText(shareUrl);
    console.log('Dashboard shared:', shareUrl);
  };

  const handleUpdateLatestEvaluation = () => {
    if (evaluations.length > 0) {
      const latestEval = evaluations.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )[0];
      router.push(`/evaluation/${latestEval.id}/edit`);
    }
  };

  const handleViewAllEvaluations = () => {
    router.push('/evaluations');
  };

  const handleViewAnalytics = () => {
    router.push('/analytics');
  };

  const handleDeleteEvaluation = async (evaluationId: string) => {
    try {
      await EvaluationService.deleteEvaluation(evaluationId);
      // Reload evaluations to reflect the deletion
      await loadEvaluations(true);
    } catch (error) {
      console.error('Failed to delete evaluation:', error);
      throw error; // Re-throw to let the component handle the error state
    }
  };

  // Check if user has completed onboarding
  useEffect(() => {
    if (isLoaded && user && !user.unsafeMetadata?.onboardingCompleted) {
      router.push('/onboarding');
    }
  }, [isLoaded, user, router]);

  useEffect(() => {
    if (user) {
      loadEvaluations(true).catch(error => {
        console.error('Failed to load evaluations:', error)
      });
    }
  }, [user, loadEvaluations]);

  if (!isLoaded || evaluationsLoading) {
    return (
      <div className="container mx-auto py-6">
        <DashboardSkeleton />
      </div>
    );
  }

  if (!user) {
    router.push('/sign-in');
    return null;
  }

  // If user hasn't completed onboarding, they'll be redirected by the useEffect above
  if (!user.unsafeMetadata?.onboardingCompleted) {
    return null;
  }

  // Calculate real data from evaluations
  const realMetrics = calculateMetricsFromEvaluations(evaluations);
  const { valuationData, trendData } = generateChartDataFromEvaluations(evaluations);
  const activityData = generateActivityFromEvaluations(evaluations);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary pt-20 pb-8">
        <div className="container mx-auto px-4 max-w-7xl">
          <DashboardLayout
            metrics={realMetrics}
            activities={activityData}
            valuationData={valuationData}
            trendData={trendData}
            evaluations={evaluations}
            filters={filters}
            comparison={comparison}
            isLoading={evaluationsLoading}
            onRefresh={() => loadEvaluations(true)}
            onCreateEvaluation={() => router.push('/onboarding')}
            onViewEvaluation={(id) => router.push(`/evaluation/${id}`)}
            onDeleteEvaluation={handleDeleteEvaluation}
            onFiltersChange={handleFiltersChange}
            onComparisonChange={handleComparisonChange}
            onExport={handleExport}
            onShareDashboard={handleShareDashboard}
            onUpdateLatestEvaluation={handleUpdateLatestEvaluation}
            onViewAllEvaluations={handleViewAllEvaluations}
            onViewAnalytics={handleViewAnalytics}
          />
        </div>
      </div>
  );
}