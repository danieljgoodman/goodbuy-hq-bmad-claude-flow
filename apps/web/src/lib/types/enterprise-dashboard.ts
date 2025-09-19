/**
 * Enterprise Dashboard Type Definitions
 * Comprehensive TypeScript interfaces for Enterprise data structures
 */

// Core data types
export interface EnterpriseMetrics {
  totalRevenue: number;
  totalAssets: number;
  grossMargin: number;
  netMargin: number;
  employeeCount: number;
  marketShare: number;
  debtToEquity: number;
  workingCapital: number;
  lastUpdated: Date;
}

export interface StrategicScenario {
  id: string;
  name: string;
  type: 'conservative' | 'base' | 'optimistic' | 'custom';
  revenueProjection: number[];
  profitProjection: number[];
  cashFlowProjection: number[];
  riskLevel: 'low' | 'medium' | 'high';
  probability: number;
  assumptions: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ExitStrategyOption {
  id: string;
  type: 'strategic' | 'financial' | 'mbo' | 'esop' | 'ipo' | 'family';
  feasibility: 'high' | 'medium' | 'low';
  timeline: string;
  estimatedValue: number;
  pros: string[];
  cons: string[];
  requirements: string[];
  rank: number;
}

export interface CapitalStructureData {
  currentDebt: number;
  currentEquity: number;
  debtToEquityRatio: number;
  debtServiceCoverage: number;
  debtCapacity: number;
  workingCapitalNeeds: number;
  cashPosition: number;
  creditLines: number;
  optimalStructure: {
    targetDebtRatio: number;
    recommendations: string[];
  };
}

export interface YearlyProjection {
  year: number;
  revenue: number;
  grossMargin: number;
  netMargin: number;
  cashFlow: number;
  capex: number;
}

export interface FinancialProjections {
  baseCase: YearlyProjection[];
  optimisticCase: YearlyProjection[];
  conservativeCase: YearlyProjection[];
  currentMetrics: {
    grossMargin: number;
    netMargin: number;
    growth: number;
  };
  projectedMetrics: {
    grossMargin: number;
    netMargin: number;
    growth: number;
  };
  keyAssumptions: string[];
}

export interface MarketExpansionOption {
  market: string;
  opportunitySize: number;
  timeToEntry: number;
  investmentRequired: number;
  expectedROI: number;
  riskFactors: string[];
}

export interface AcquisitionOption {
  targetType: string;
  synergies: number;
  integrationRisk: 'low' | 'medium' | 'high';
  paybackPeriod: number;
}

export interface PartnershipOption {
  type: string;
  strategicValue: number;
  revenuePotential: number;
}

export interface PlatformOption {
  strategy: string;
  valueCreation: number;
  feasibilityScore: number;
}

export interface FranchisingOption {
  model: string;
  scalability: number;
  capitalRequirement: number;
}

export interface StrategicOptions {
  internationalExpansion: MarketExpansionOption[];
  acquisitionTargets: AcquisitionOption[];
  strategicPartnerships: PartnershipOption[];
  platformStrategies: PlatformOption[];
  franchising: FranchisingOption[];
}

// Dashboard data aggregation
export interface DashboardData {
  metrics: EnterpriseMetrics;
  scenarios: StrategicScenario[];
  projections: FinancialProjections | null;
  lastUpdated: Date;
}

// API request/response types
export interface DashboardQueryParams {
  evaluationId: string;
  includeProjections?: boolean;
  includeScenarios?: boolean;
  timeRange?: '1m' | '3m' | '6m' | '1y' | '3y' | '5y';
}

export interface ScenarioSaveData {
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

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Hook options and return types
export interface UseEnterpriseDataOptions {
  evaluationId: string;
  includeProjections?: boolean;
  includeScenarios?: boolean;
  timeRange?: '1m' | '3m' | '6m' | '1y' | '3y' | '5y';
  refreshInterval?: number;
  enableRealTime?: boolean;
}

export interface UseEnterpriseDataReturn {
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

// Chart and visualization data types
export interface ChartDataPoint {
  x: number | string;
  y: number;
  label?: string;
  color?: string;
  metadata?: Record<string, any>;
}

export interface TimeSeriesData {
  date: Date;
  value: number;
  category?: string;
}

export interface ScenarioComparisonData {
  scenario: string;
  year: number;
  revenue: number;
  profit: number;
  cashFlow: number;
}

export interface WaterfallChartData {
  category: string;
  value: number;
  type: 'positive' | 'negative' | 'total';
  cumulative?: number;
}

export interface BubbleChartData {
  x: number;
  y: number;
  size: number;
  label: string;
  category?: string;
}

// Risk assessment types
export interface RiskFactor {
  id: string;
  category: 'financial' | 'operational' | 'market' | 'regulatory' | 'strategic';
  description: string;
  impact: 'low' | 'medium' | 'high';
  probability: 'low' | 'medium' | 'high';
  mitigation: string[];
  score: number;
}

export interface RiskAssessment {
  overallScore: number;
  factors: RiskFactor[];
  recommendations: string[];
  lastUpdated: Date;
}

// Performance benchmarking types
export interface BenchmarkMetric {
  metric: string;
  value: number;
  industry: string;
  percentile: number;
  benchmark: number;
  variance: number;
  trend: 'improving' | 'stable' | 'declining';
}

export interface PerformanceBenchmark {
  industry: string;
  size: 'small' | 'medium' | 'large';
  metrics: BenchmarkMetric[];
  overallRanking: number;
  keyInsights: string[];
}

// Scenario modeling types
export interface ModelAssumption {
  id: string;
  name: string;
  category: 'market' | 'financial' | 'operational' | 'strategic';
  baseValue: number;
  range: {
    min: number;
    max: number;
  };
  distribution: 'normal' | 'uniform' | 'triangular';
  sensitivity: number;
}

export interface MonteCarloResult {
  metric: string;
  mean: number;
  median: number;
  standardDeviation: number;
  percentiles: {
    p10: number;
    p25: number;
    p75: number;
    p90: number;
  };
  confidenceInterval: {
    lower: number;
    upper: number;
    level: number;
  };
}

export interface SensitivityAnalysis {
  baseCase: number;
  variables: {
    name: string;
    impact: number;
    elasticity: number;
  }[];
  tornadoChart: {
    variable: string;
    low: number;
    high: number;
    range: number;
  }[];
}

// Valuation types
export interface ValuationMethod {
  method: 'dcf' | 'multiple' | 'asset' | 'option';
  value: number;
  confidence: 'low' | 'medium' | 'high';
  assumptions: string[];
  sensitivity: SensitivityAnalysis;
}

export interface ValuationSummary {
  methods: ValuationMethod[];
  weightedAverage: number;
  range: {
    low: number;
    high: number;
  };
  recommendation: string;
  keyDrivers: string[];
}

// Tax optimization types
export interface TaxStrategy {
  strategy: string;
  annualSavings: number;
  implementationCost: number;
  complexity: 'low' | 'medium' | 'high';
  riskLevel: 'low' | 'medium' | 'high';
  timeline: string;
  requirements: string[];
}

export interface TaxOptimizationPlan {
  currentTax: number;
  optimizedTax: number;
  totalSavings: number;
  strategies: TaxStrategy[];
  implementation: {
    phase: number;
    strategy: string;
    timeline: string;
    priority: 'high' | 'medium' | 'low';
  }[];
}

// Export/import types
export interface ExportOptions {
  format: 'pdf' | 'excel' | 'powerpoint' | 'csv';
  sections: string[];
  includeCharts: boolean;
  includeAssumptions: boolean;
  confidential: boolean;
}

export interface ImportMapping {
  sourceField: string;
  targetField: string;
  transformation?: 'currency' | 'percentage' | 'date' | 'number';
  validation?: string;
}

// Audit and compliance types
export interface AuditLogEntry {
  id: string;
  timestamp: Date;
  userId: string;
  action: 'create' | 'read' | 'update' | 'delete' | 'export';
  resource: string;
  details: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
}

export interface ComplianceCheck {
  rule: string;
  status: 'pass' | 'fail' | 'warning';
  description: string;
  recommendation?: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export interface ComplianceReport {
  overallStatus: 'compliant' | 'non-compliant' | 'needs-review';
  checks: ComplianceCheck[];
  summary: {
    total: number;
    passed: number;
    failed: number;
    warnings: number;
  };
  lastAudit: Date;
  nextAudit: Date;
}

// Integration types
export interface DataSource {
  id: string;
  name: string;
  type: 'accounting' | 'crm' | 'erp' | 'bank' | 'payroll' | 'custom';
  status: 'connected' | 'disconnected' | 'error' | 'syncing';
  lastSync: Date;
  mapping: ImportMapping[];
  config: Record<string, any>;
}

export interface SyncStatus {
  source: string;
  status: 'success' | 'error' | 'in-progress';
  lastSync: Date;
  recordsProcessed: number;
  errors: string[];
  warnings: string[];
}

// Notification types
export interface NotificationSettings {
  email: boolean;
  sms: boolean;
  inApp: boolean;
  triggers: {
    dataUpdates: boolean;
    scenarioChanges: boolean;
    thresholdAlerts: boolean;
    complianceIssues: boolean;
  };
}

export interface Notification {
  id: string;
  type: 'info' | 'warning' | 'error' | 'success';
  title: string;
  message: string;
  data?: Record<string, any>;
  read: boolean;
  createdAt: Date;
  expiresAt?: Date;
}

// User preferences and settings
export interface DashboardPreferences {
  layout: 'grid' | 'list' | 'cards';
  theme: 'light' | 'dark' | 'auto';
  defaultTimeRange: '1m' | '3m' | '6m' | '1y' | '3y' | '5y';
  refreshInterval: number;
  enableAnimations: boolean;
  compactMode: boolean;
  favoriteMetrics: string[];
  hiddenSections: string[];
}

// Error types
export interface ValidationError {
  field: string;
  message: string;
  code: string;
  value?: any;
}

export interface ApiError {
  status: number;
  message: string;
  code?: string;
  details?: ValidationError[];
  timestamp: Date;
  requestId?: string;
}

// Utility types
export type SortDirection = 'asc' | 'desc';
export type FilterOperator = 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte' | 'in' | 'nin' | 'contains';

export interface SortConfig {
  field: string;
  direction: SortDirection;
}

export interface FilterConfig {
  field: string;
  operator: FilterOperator;
  value: any;
}

export interface PaginationConfig {
  page: number;
  limit: number;
  total?: number;
}

export interface QueryConfig {
  sort?: SortConfig[];
  filters?: FilterConfig[];
  pagination?: PaginationConfig;
  search?: string;
}

// Re-export commonly used types
export type {
  EnterpriseMetrics as Metrics,
  StrategicScenario as Scenario,
  FinancialProjections as Projections,
  CapitalStructureData as CapitalStructure,
  ExitStrategyOption as ExitStrategy,
  StrategicOptions as Options
};