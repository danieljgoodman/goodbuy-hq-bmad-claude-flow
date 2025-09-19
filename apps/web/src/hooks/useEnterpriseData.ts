/**
 * Enterprise Data Hooks
 * Custom hooks for fetching and caching Enterprise data with real-time sync
 */

'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  EnterpriseMetrics,
  StrategicScenario,
  ExitStrategyOption,
  CapitalStructureData,
  FinancialProjections,
  StrategicOptions
} from '@/lib/db/enterprise-queries';

// Types for API responses
interface DashboardData {
  metrics: EnterpriseMetrics;
  scenarios: StrategicScenario[];
  projections: FinancialProjections | null;
  lastUpdated: Date;
}

interface ScenarioSaveData {
  evaluationId: string;
  scenarioType: 'conservative' | 'base' | 'optimistic' | 'custom';
  data: {
    assumptions: string[];
    revenueProjection: number[];
    profitProjection: number[];
    cashFlowProjection: number[];
    horizon: number;
  };
}

interface UseEnterpriseDataOptions {
  evaluationId: string;
  includeProjections?: boolean;
  includeScenarios?: boolean;
  timeRange?: '1m' | '3m' | '6m' | '1y' | '3y' | '5y';
  refreshInterval?: number;
  enableRealTime?: boolean;
}

interface UseEnterpriseDataReturn {
  // Data
  dashboardData: DashboardData | null;
  scenarios: StrategicScenario[];
  exitStrategies: ExitStrategyOption[];
  capitalStructure: CapitalStructureData | null;
  projections: FinancialProjections | null;
  strategicOptions: StrategicOptions | null;

  // Loading states
  isLoading: boolean;
  isLoadingScenarios: boolean;
  isLoadingExitStrategies: boolean;
  isLoadingCapitalStructure: boolean;
  isLoadingProjections: boolean;
  isLoadingStrategicOptions: boolean;

  // Error states
  error: Error | null;
  scenariosError: Error | null;
  exitStrategiesError: Error | null;
  capitalStructureError: Error | null;
  projectionsError: Error | null;
  strategicOptionsError: Error | null;

  // Actions
  refetch: () => void;
  saveScenario: (data: ScenarioSaveData) => Promise<boolean>;
  invalidateCache: () => void;

  // Real-time status
  isConnected: boolean;
  lastSync: Date | null;
}

// API utility functions
async function fetchDashboardData(
  evaluationId: string,
  options: UseEnterpriseDataOptions
): Promise<DashboardData> {
  const params = new URLSearchParams({
    evaluationId,
    includeProjections: options.includeProjections?.toString() ?? 'true',
    includeScenarios: options.includeScenarios?.toString() ?? 'true',
    timeRange: options.timeRange ?? '1y'
  });

  const response = await fetch(`/api/enterprise/dashboard?${params}`, {
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to fetch dashboard data');
  }

  const result = await response.json();
  return result.data;
}

async function fetchScenarios(evaluationId: string): Promise<StrategicScenario[]> {
  const response = await fetch(`/api/enterprise/scenarios?evaluationId=${evaluationId}`);

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to fetch scenarios');
  }

  const result = await response.json();
  return result.data;
}

async function fetchExitStrategies(evaluationId: string): Promise<ExitStrategyOption[]> {
  const response = await fetch(`/api/enterprise/exit-strategies?evaluationId=${evaluationId}`);

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to fetch exit strategies');
  }

  const result = await response.json();
  return result.data;
}

async function fetchCapitalStructure(evaluationId: string): Promise<CapitalStructureData> {
  const response = await fetch(`/api/enterprise/capital-structure?evaluationId=${evaluationId}`);

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to fetch capital structure');
  }

  const result = await response.json();
  return result.data;
}

async function fetchProjections(evaluationId: string): Promise<FinancialProjections> {
  const response = await fetch(`/api/enterprise/projections?evaluationId=${evaluationId}`);

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to fetch projections');
  }

  const result = await response.json();
  return result.data;
}

async function fetchStrategicOptions(evaluationId: string): Promise<StrategicOptions> {
  const response = await fetch(`/api/enterprise/options?evaluationId=${evaluationId}`);

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to fetch strategic options');
  }

  const result = await response.json();
  return result.data;
}

async function saveScenarioData(data: ScenarioSaveData): Promise<boolean> {
  const response = await fetch('/api/enterprise/scenarios', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to save scenario');
  }

  return true;
}

/**
 * Main Enterprise data hook
 */
export function useEnterpriseData(options: UseEnterpriseDataOptions): UseEnterpriseDataReturn {
  const queryClient = useQueryClient();
  const [isConnected, setIsConnected] = useState(true);
  const [lastSync, setLastSync] = useState<Date | null>(null);

  // Query keys
  const dashboardKey = ['enterprise', 'dashboard', options.evaluationId, options];
  const scenariosKey = ['enterprise', 'scenarios', options.evaluationId];
  const exitStrategiesKey = ['enterprise', 'exit-strategies', options.evaluationId];
  const capitalStructureKey = ['enterprise', 'capital-structure', options.evaluationId];
  const projectionsKey = ['enterprise', 'projections', options.evaluationId];
  const strategicOptionsKey = ['enterprise', 'strategic-options', options.evaluationId];

  // Main dashboard query
  const {
    data: dashboardData,
    isLoading,
    error,
    refetch: refetchDashboard
  } = useQuery({
    queryKey: dashboardKey,
    queryFn: () => fetchDashboardData(options.evaluationId, options),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes (was cacheTime)
    refetchInterval: options.refreshInterval || (options.enableRealTime ? 30000 : false),
    retry: 2,
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  // Scenarios query
  const {
    data: scenarios = [],
    isLoading: isLoadingScenarios,
    error: scenariosError
  } = useQuery({
    queryKey: scenariosKey,
    queryFn: () => fetchScenarios(options.evaluationId),
    staleTime: 10 * 60 * 1000, // 10 minutes
    enabled: options.includeScenarios !== false,
  });

  // Exit strategies query
  const {
    data: exitStrategies = [],
    isLoading: isLoadingExitStrategies,
    error: exitStrategiesError
  } = useQuery({
    queryKey: exitStrategiesKey,
    queryFn: () => fetchExitStrategies(options.evaluationId),
    staleTime: 15 * 60 * 1000, // 15 minutes
  });

  // Capital structure query
  const {
    data: capitalStructure,
    isLoading: isLoadingCapitalStructure,
    error: capitalStructureError
  } = useQuery({
    queryKey: capitalStructureKey,
    queryFn: () => fetchCapitalStructure(options.evaluationId),
    staleTime: 10 * 60 * 1000, // 10 minutes
  });

  // Projections query
  const {
    data: projections,
    isLoading: isLoadingProjections,
    error: projectionsError
  } = useQuery({
    queryKey: projectionsKey,
    queryFn: () => fetchProjections(options.evaluationId),
    staleTime: 10 * 60 * 1000, // 10 minutes
    enabled: options.includeProjections !== false,
  });

  // Strategic options query
  const {
    data: strategicOptions,
    isLoading: isLoadingStrategicOptions,
    error: strategicOptionsError
  } = useQuery({
    queryKey: strategicOptionsKey,
    queryFn: () => fetchStrategicOptions(options.evaluationId),
    staleTime: 15 * 60 * 1000, // 15 minutes
  });

  // Save scenario mutation with optimistic updates
  const saveScenarioMutation = useMutation({
    mutationFn: saveScenarioData,
    onMutate: async (newScenario: ScenarioSaveData) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: scenariosKey });

      // Snapshot previous value
      const previousScenarios = queryClient.getQueryData<StrategicScenario[]>(scenariosKey);

      // Optimistically update scenarios
      if (previousScenarios) {
        const optimisticScenario: StrategicScenario = {
          id: `${newScenario.evaluationId}-${newScenario.scenarioType}-temp`,
          name: `${newScenario.scenarioType.charAt(0).toUpperCase() + newScenario.scenarioType.slice(1)} Case`,
          type: newScenario.scenarioType,
          revenueProjection: newScenario.data.revenueProjection,
          profitProjection: newScenario.data.profitProjection,
          cashFlowProjection: newScenario.data.cashFlowProjection,
          riskLevel: newScenario.scenarioType === 'conservative' ? 'low' :
                    newScenario.scenarioType === 'optimistic' ? 'high' : 'medium',
          probability: newScenario.scenarioType === 'conservative' ? 0.3 :
                      newScenario.scenarioType === 'optimistic' ? 0.2 : 0.5,
          assumptions: newScenario.data.assumptions,
          createdAt: new Date(),
          updatedAt: new Date()
        };

        const updatedScenarios = [...previousScenarios.filter(s => s.type !== newScenario.scenarioType), optimisticScenario];
        queryClient.setQueryData(scenariosKey, updatedScenarios);
      }

      return { previousScenarios };
    },
    onError: (error, newScenario, context) => {
      // Rollback on error
      if (context?.previousScenarios) {
        queryClient.setQueryData(scenariosKey, context.previousScenarios);
      }
      toast.error('Failed to save scenario');
    },
    onSuccess: () => {
      toast.success('Scenario saved successfully');
      setLastSync(new Date());
    },
    onSettled: () => {
      // Always refetch after mutation
      queryClient.invalidateQueries({ queryKey: scenariosKey });
      queryClient.invalidateQueries({ queryKey: dashboardKey });
    },
  });

  // Refetch all data
  const refetch = useCallback(() => {
    refetchDashboard();
    queryClient.invalidateQueries({ queryKey: scenariosKey });
    queryClient.invalidateQueries({ queryKey: exitStrategiesKey });
    queryClient.invalidateQueries({ queryKey: capitalStructureKey });
    queryClient.invalidateQueries({ queryKey: projectionsKey });
    queryClient.invalidateQueries({ queryKey: strategicOptionsKey });
  }, [refetchDashboard, queryClient, scenariosKey, exitStrategiesKey, capitalStructureKey, projectionsKey, strategicOptionsKey]);

  // Save scenario wrapper
  const saveScenario = useCallback(async (data: ScenarioSaveData): Promise<boolean> => {
    try {
      await saveScenarioMutation.mutateAsync(data);
      return true;
    } catch (error) {
      console.error('Failed to save scenario:', error);
      return false;
    }
  }, [saveScenarioMutation]);

  // Invalidate cache
  const invalidateCache = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['enterprise'] });
  }, [queryClient]);

  // Real-time connection monitoring
  useEffect(() => {
    if (options.enableRealTime) {
      const checkConnection = () => {
        setIsConnected(navigator.onLine);
      };

      window.addEventListener('online', checkConnection);
      window.addEventListener('offline', checkConnection);

      return () => {
        window.removeEventListener('online', checkConnection);
        window.removeEventListener('offline', checkConnection);
      };
    }
  }, [options.enableRealTime]);

  // Update last sync when data changes
  useEffect(() => {
    if (dashboardData) {
      setLastSync(new Date());
    }
  }, [dashboardData]);

  return {
    // Data
    dashboardData: dashboardData || null,
    scenarios,
    exitStrategies,
    capitalStructure: capitalStructure || null,
    projections: projections || null,
    strategicOptions: strategicOptions || null,

    // Loading states
    isLoading,
    isLoadingScenarios,
    isLoadingExitStrategies,
    isLoadingCapitalStructure,
    isLoadingProjections,
    isLoadingStrategicOptions,

    // Error states
    error: error as Error | null,
    scenariosError: scenariosError as Error | null,
    exitStrategiesError: exitStrategiesError as Error | null,
    capitalStructureError: capitalStructureError as Error | null,
    projectionsError: projectionsError as Error | null,
    strategicOptionsError: strategicOptionsError as Error | null,

    // Actions
    refetch,
    saveScenario,
    invalidateCache,

    // Real-time status
    isConnected,
    lastSync
  };
}

/**
 * Hook for enterprise metrics only
 */
export function useEnterpriseMetrics(evaluationId: string) {
  const { dashboardData, isLoading, error } = useEnterpriseData({
    evaluationId,
    includeProjections: false,
    includeScenarios: false
  });

  return {
    metrics: dashboardData?.metrics || null,
    isLoading,
    error
  };
}

/**
 * Hook for strategic scenarios only
 */
export function useStrategicScenarios(evaluationId: string) {
  const { scenarios, isLoadingScenarios, scenariosError, saveScenario } = useEnterpriseData({
    evaluationId,
    includeProjections: false
  });

  return {
    scenarios,
    isLoading: isLoadingScenarios,
    error: scenariosError,
    saveScenario
  };
}

/**
 * Hook for financial projections only
 */
export function useFinancialProjections(evaluationId: string) {
  const { projections, isLoadingProjections, projectionsError } = useEnterpriseData({
    evaluationId,
    includeScenarios: false
  });

  return {
    projections,
    isLoading: isLoadingProjections,
    error: projectionsError
  };
}

/**
 * Hook for real-time enterprise data with WebSocket-like updates
 */
export function useRealTimeEnterpriseData(
  evaluationId: string,
  refreshInterval: number = 30000
) {
  return useEnterpriseData({
    evaluationId,
    enableRealTime: true,
    refreshInterval
  });
}

/**
 * Hook for enterprise data with optimistic updates
 */
export function useOptimisticEnterpriseData(evaluationId: string) {
  const enterpriseData = useEnterpriseData({ evaluationId });

  // Enhanced save scenario with optimistic UI updates
  const optimisticSaveScenario = useCallback(async (data: ScenarioSaveData) => {
    // UI will be updated optimistically via the mutation
    return enterpriseData.saveScenario(data);
  }, [enterpriseData.saveScenario]);

  return {
    ...enterpriseData,
    saveScenario: optimisticSaveScenario
  };
}