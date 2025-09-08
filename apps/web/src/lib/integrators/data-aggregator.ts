import type { 
  UnifiedDashboard,
  IntegrationStatus,
  ComponentStatus,
  PerformanceMetrics
} from '@/types/unified-dashboard';
import type { 
  ValuationSummary,
  HealthScoreSummary,
  DocumentAnalysisSummary,
  OpportunitiesSummary 
} from '@/types';

export class DataAggregator {
  private static instance: DataAggregator;
  private cache: Map<string, any> = new Map();
  private refreshListeners: Map<string, Function[]> = new Map();

  static getInstance(): DataAggregator {
    if (!DataAggregator.instance) {
      DataAggregator.instance = new DataAggregator();
    }
    return DataAggregator.instance;
  }

  async aggregateUnifiedDashboard(
    userId: string,
    businessId: string
  ): Promise<UnifiedDashboard> {
    const startTime = performance.now();
    
    try {
      // Parallel data fetching for performance
      const [
        valuationData,
        healthData,
        documentData,
        opportunityData
      ] = await Promise.allSettled([
        this.fetchValuationData(businessId),
        this.fetchHealthScoreData(businessId),
        this.fetchDocumentData(businessId),
        this.fetchOpportunityData(businessId)
      ]);

      const components = {
        valuation: this.processValuationComponent(valuationData),
        healthScore: this.processHealthScoreComponent(healthData),
        documentIntelligence: this.processDocumentComponent(documentData),
        opportunities: this.processOpportunityComponent(opportunityData)
      };

      const integrationStatus = this.calculateIntegrationStatus(components);
      const performanceMetrics = await this.calculatePerformanceMetrics(
        businessId,
        performance.now() - startTime
      );

      const unifiedDashboard: UnifiedDashboard = {
        id: `dashboard_${businessId}`,
        userId,
        businessId,
        lastUpdated: new Date(),
        components,
        integrationStatus,
        exportHistory: await this.fetchExportHistory(userId),
        upgradePrompts: await this.fetchUpgradePrompts(userId),
        userPreferences: await this.fetchUserPreferences(userId),
        performanceMetrics
      };

      // Cache the result
      this.cache.set(`unified_${businessId}`, unifiedDashboard);
      this.notifyRefreshListeners(businessId, unifiedDashboard);

      return unifiedDashboard;
    } catch (error) {
      console.error('Error aggregating unified dashboard:', error);
      throw new Error('Failed to aggregate dashboard data');
    }
  }

  private async fetchValuationData(businessId: string): Promise<any> {
    try {
      const response = await fetch(`/api/evaluations/${businessId}/latest`);
      if (!response.ok) throw new Error('Valuation fetch failed');
      return await response.json();
    } catch (error) {
      console.error('Valuation data fetch error:', error);
      return { error: (error as Error).message };
    }
  }

  private async fetchHealthScoreData(businessId: string): Promise<any> {
    try {
      const response = await fetch(`/api/health-analysis/${businessId}/latest`);
      if (!response.ok) throw new Error('Health score fetch failed');
      return await response.json();
    } catch (error) {
      console.error('Health score data fetch error:', error);
      return { error: (error as Error).message };
    }
  }

  private async fetchDocumentData(businessId: string): Promise<any> {
    try {
      const response = await fetch(`/api/documents/${businessId}/intelligence`);
      if (!response.ok) throw new Error('Document data fetch failed');
      return await response.json();
    } catch (error) {
      console.error('Document data fetch error:', error);
      return { error: (error as Error).message };
    }
  }

  private async fetchOpportunityData(businessId: string): Promise<any> {
    try {
      const response = await fetch(`/api/opportunities/${businessId}/latest`);
      if (!response.ok) throw new Error('Opportunity data fetch failed');
      return await response.json();
    } catch (error) {
      console.error('Opportunity data fetch error:', error);
      return { error: (error as Error).message };
    }
  }

  private processValuationComponent(data: PromiseSettledResult<any>) {
    if (data.status === 'rejected' || data.value?.error) {
      return {
        evaluationId: '',
        status: 'error' as const,
        lastCalculated: new Date(),
        summary: {} as ValuationSummary
      };
    }

    const evaluation = data.value;
    return {
      evaluationId: evaluation.id || '',
      status: this.determineComponentStatus(evaluation.updatedAt),
      lastCalculated: new Date(evaluation.updatedAt || evaluation.createdAt),
      summary: {
        currentValue: evaluation.valuations?.weighted?.value || 0,
        confidence: Math.round((evaluation.confidenceFactors?.overall || 0) * 100),
        methodology: evaluation.valuations?.weighted?.methodology || 'Unknown',
        lastUpdated: new Date(evaluation.updatedAt || evaluation.createdAt),
        status: evaluation.status || 'completed'
      } as ValuationSummary
    };
  }

  private processHealthScoreComponent(data: PromiseSettledResult<any>) {
    if (data.status === 'rejected' || data.value?.error) {
      return {
        analysisId: '',
        status: 'error' as const,
        lastCalculated: new Date(),
        summary: {} as HealthScoreSummary
      };
    }

    const healthData = data.value;
    return {
      analysisId: healthData.id || '',
      status: this.determineComponentStatus(healthData.calculatedAt),
      lastCalculated: new Date(healthData.calculatedAt),
      summary: {
        overallScore: healthData.overallScore || 0,
        dimensions: healthData.dimensions || {},
        trend: (healthData.trendAnalysis?.trendDirection || 'stable') as 'improving' | 'stable' | 'declining'
      } as HealthScoreSummary
    };
  }

  private processDocumentComponent(data: PromiseSettledResult<any>) {
    if (data.status === 'rejected' || data.value?.error) {
      return {
        analysisId: '',
        status: 'error' as const,
        lastAnalyzed: new Date(),
        summary: {} as DocumentAnalysisSummary
      };
    }

    const docData = data.value;
    return {
      analysisId: docData.id || '',
      status: this.determineComponentStatus(docData.processingMetrics?.lastProcessed),
      lastAnalyzed: new Date(docData.processingMetrics?.lastProcessed || new Date()),
      summary: {
        totalDocuments: docData.documents?.length || 0,
        averageQualityScore: docData.aggregatedInsights?.qualityScore || 0,
        lastProcessed: docData.processingMetrics?.lastProcessed ? new Date(docData.processingMetrics.lastProcessed) : null,
        keyInsights: docData.aggregatedInsights?.keyInsights?.length || 0
      } as DocumentAnalysisSummary
    };
  }

  private processOpportunityComponent(data: PromiseSettledResult<any>) {
    if (data.status === 'rejected' || data.value?.error) {
      return {
        analysisId: '',
        status: 'error' as const,
        lastGenerated: new Date(),
        summary: {} as OpportunitiesSummary
      };
    }

    const oppData = data.value;
    return {
      analysisId: oppData.id || '',
      status: this.determineComponentStatus(oppData.lastUpdated),
      lastGenerated: new Date(oppData.lastUpdated),
      summary: {
        totalOpportunities: oppData.summary?.totalOpportunities || oppData.opportunities?.length || 0,
        estimatedImpact: oppData.summary?.totalPotentialValue || oppData.priorityMatrix?.totalPotentialValue || 0,
        priorityDistribution: {
          'high': oppData.summary?.highPriorityCount || 0,
          'medium': oppData.summary?.mediumPriorityCount || 0,
          'low': oppData.summary?.lowPriorityCount || 0
        },
        potentialValue: oppData.summary?.totalPotentialValue || oppData.priorityMatrix?.totalPotentialValue || 0
      } as OpportunitiesSummary
    };
  }

  private determineComponentStatus(updatedAt: string): 'current' | 'outdated' | 'processing' {
    const lastUpdate = new Date(updatedAt);
    const now = new Date();
    const hoursSinceUpdate = (now.getTime() - lastUpdate.getTime()) / (1000 * 60 * 60);
    
    // Consider data outdated after 24 hours
    return hoursSinceUpdate > 24 ? 'outdated' : 'current';
  }

  private calculateIntegrationStatus(components: any): IntegrationStatus {
    const componentStatuses = Object.values(components).map((comp: any) => comp.status);
    const errorCount = componentStatuses.filter(status => status === 'error').length;
    const outdatedCount = componentStatuses.filter(status => status === 'outdated').length;
    
    let syncStatus: 'success' | 'partial' | 'failed' | 'in_progress' = 'success';
    if (errorCount > 0) {
      syncStatus = errorCount === componentStatuses.length ? 'failed' : 'partial';
    } else if (outdatedCount > 0) {
      syncStatus = 'partial';
    }

    return {
      isConnected: errorCount < componentStatuses.length,
      lastSyncAttempt: new Date(),
      syncStatus,
      errorCount,
      components: {
        valuation: { status: components.valuation.status, lastUpdated: components.valuation.lastCalculated },
        healthScore: { status: components.healthScore.status, lastUpdated: components.healthScore.lastCalculated },
        documentIntelligence: { status: components.documentIntelligence.status, lastUpdated: components.documentIntelligence.lastAnalyzed },
        opportunities: { status: components.opportunities.status, lastUpdated: components.opportunities.lastGenerated }
      }
    };
  }

  private async calculatePerformanceMetrics(businessId: string, loadTime: number): Promise<PerformanceMetrics> {
    return {
      id: `perf_${businessId}_${Date.now()}`,
      dashboardId: `dashboard_${businessId}`,
      loadTimes: {
        initialLoad: loadTime,
        componentLoad: {
          valuation: Math.random() * 1000, // TODO: Track real metrics
          healthScore: Math.random() * 1000,
          documents: Math.random() * 1000,
          opportunities: Math.random() * 1000
        },
        exportGeneration: {},
        drillDownNavigation: Math.random() * 500
      },
      dataFreshness: {
        valuation: new Date(),
        healthScore: new Date(),
        documents: new Date(),
        opportunities: new Date(),
        lastSync: new Date()
      },
      userEngagement: {
        sessionDuration: 0,
        componentInteractions: {},
        exportRequests: 0,
        upgradePromptEngagement: 0
      },
      systemHealth: {
        apiResponseTimes: {},
        errorRates: {},
        cacheHitRates: {}
      },
      measuredAt: new Date()
    };
  }

  private async fetchExportHistory(userId: string) {
    // Return empty array since export history API was removed
    return [];
  }

  private async fetchUpgradePrompts(userId: string) {
    // Return empty array since premium prompts API was removed
    return [];
  }

  private async fetchUserPreferences(userId: string) {
    // Return default preferences since user preferences API was removed
    return {
      layout: 'grid' as const,
      defaultView: 'overview' as const,
      autoRefresh: true,
      refreshInterval: 300,
      notifications: {
        dataUpdates: true,
        exportCompletion: true,
        upgradePrompts: false
      },
      customization: {
        hiddenComponents: [],
        componentOrder: ['valuation', 'healthScore', 'documentIntelligence', 'opportunities'],
        colorScheme: 'light' as const
      }
    };
  }

  // Subscription management for real-time updates
  subscribeToRefresh(businessId: string, callback: Function) {
    const listeners = this.refreshListeners.get(businessId) || [];
    listeners.push(callback);
    this.refreshListeners.set(businessId, listeners);
  }

  unsubscribeFromRefresh(businessId: string, callback: Function) {
    const listeners = this.refreshListeners.get(businessId) || [];
    const updatedListeners = listeners.filter(l => l !== callback);
    this.refreshListeners.set(businessId, updatedListeners);
  }

  private notifyRefreshListeners(businessId: string, data: UnifiedDashboard) {
    const listeners = this.refreshListeners.get(businessId) || [];
    listeners.forEach(callback => callback(data));
  }

  // Cache management
  clearCache(businessId?: string) {
    if (businessId) {
      this.cache.delete(`unified_${businessId}`);
    } else {
      this.cache.clear();
    }
  }

  getCachedData(businessId: string): UnifiedDashboard | null {
    return this.cache.get(`unified_${businessId}`) || null;
  }
}