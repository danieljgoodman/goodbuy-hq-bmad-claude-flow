// Summary interfaces for unified dashboard
export interface ValuationSummary {
  currentValue: number;
  confidence: number;
  methodology: string;
  marketMultiple?: number;
  revenueMultiple?: number;
  growthRate?: number;
}

export interface HealthScoreSummary {
  overallScore: number;
  categoryScores?: {
    [category: string]: number;
  };
  trend?: 'improving' | 'stable' | 'declining';
}

export interface DocumentAnalysisSummary {
  totalDocuments: number;
  keyInsights: number;
  documentTypes?: {
    [type: string]: number;
  };
  qualityScore?: number;
}

export interface OpportunitiesSummary {
  totalOpportunities: number;
  potentialValue: number;
  topOpportunities?: {
    title: string;
    impact: string;
  }[];
  priorityCount?: {
    [priority: string]: number;
  };
}

export interface IntegrationStatus {
  isConnected: boolean;
  lastSyncAttempt: Date;
  syncStatus: 'success' | 'partial' | 'failed' | 'in_progress';
  errorCount: number;
  components: {
    valuation: ComponentStatus;
    healthScore: ComponentStatus;
    documentIntelligence: ComponentStatus;
    opportunities: ComponentStatus;
  };
}

export interface ComponentStatus {
  status: 'current' | 'outdated' | 'processing' | 'error';
  lastUpdated: Date;
  errorMessage?: string;
}

export interface ExportRecord {
  id: string;
  exportType: 'pdf' | 'powerpoint' | 'excel' | 'json';
  template: 'executive' | 'detailed' | 'investor' | 'custom';
  status: 'pending' | 'generating' | 'completed' | 'failed';
  createdAt: Date;
  completedAt?: Date;
  downloadUrl?: string;
  errorMessage?: string;
}

export interface UpgradePrompt {
  id: string;
  userId: string;
  triggerContext: 'export' | 'drill_down' | 'advanced_analysis' | 'consultation';
  promptType: 'modal' | 'banner' | 'inline' | 'sidebar';
  content: {
    headline: string;
    description: string;
    benefits: string[];
    callToAction: string;
    urgency?: string;
  };
  targeting: {
    userSegment: string;
    behaviorTriggers: string[];
    usagePattern: string;
  };
  conversionTracking: {
    impressions: number;
    clicks: number;
    conversions: number;
    conversionRate: number;
  };
  abTestVariant?: string;
  isActive: boolean;
  createdAt: Date;
}

export interface DashboardPreferences {
  layout: 'grid' | 'list' | 'compact';
  defaultView: 'overview' | 'detailed';
  autoRefresh: boolean;
  refreshInterval: number; // in seconds
  notifications: {
    dataUpdates: boolean;
    exportCompletion: boolean;
    upgradePrompts: boolean;
  };
  customization: {
    hiddenComponents: string[];
    componentOrder: string[];
    colorScheme: 'light' | 'dark' | 'auto';
  };
}

export interface PerformanceMetrics {
  id: string;
  dashboardId: string;
  loadTimes: {
    initialLoad: number;
    componentLoad: { [key: string]: number };
    exportGeneration: { [key: string]: number };
    drillDownNavigation: number;
  };
  dataFreshness: {
    valuation: Date;
    healthScore: Date;
    documents: Date;
    opportunities: Date;
    lastSync: Date;
  };
  userEngagement: {
    sessionDuration: number;
    componentInteractions: { [key: string]: number };
    exportRequests: number;
    upgradePromptEngagement: number;
  };
  systemHealth: {
    apiResponseTimes: { [key: string]: number };
    errorRates: { [key: string]: number };
    cacheHitRates: { [key: string]: number };
  };
  measuredAt: Date;
}

export interface UnifiedDashboard {
  id: string;
  userId: string;
  businessId: string;
  lastUpdated: Date;
  components: {
    valuation: {
      evaluationId: string;
      status: 'current' | 'outdated' | 'processing' | 'error';
      lastCalculated: Date;
      summary: ValuationSummary;
    };
    healthScore: {
      analysisId: string;
      status: 'current' | 'outdated' | 'processing' | 'error';
      lastCalculated: Date;
      summary: HealthScoreSummary;
    };
    documentIntelligence: {
      analysisId: string;
      status: 'current' | 'outdated' | 'processing' | 'error';
      lastAnalyzed: Date;
      summary: DocumentAnalysisSummary;
    };
    opportunities: {
      analysisId: string;
      status: 'current' | 'outdated' | 'processing' | 'error';
      lastGenerated: Date;
      summary: OpportunitiesSummary;
    };
  };
  integrationStatus: IntegrationStatus;
  exportHistory: ExportRecord[];
  upgradePrompts: UpgradePrompt[];
  userPreferences: DashboardPreferences;
  performanceMetrics: PerformanceMetrics;
}