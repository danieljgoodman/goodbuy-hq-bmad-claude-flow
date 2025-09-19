// Enterprise Dashboard Types
// Following Enterprise tier specifications for strategic business intelligence

export interface EnterpriseMetrics {
  totalInvestmentValue: number;
  portfolioGrowthRate: number;
  riskAssessmentScore: number;
  diversificationIndex: number;
  liquidityRatio: number;
  performanceVsMarket: number;
  expectedAnnualReturn: number;
  volatilityIndex: number;
}

export interface StrategicInsight {
  id: string;
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  category: 'risk' | 'opportunity' | 'optimization' | 'compliance';
  priority: number;
  actionRequired: boolean;
  estimatedValue: number;
  timeline: string;
  confidence: number;
}

export interface PortfolioAllocation {
  assetClass: string;
  currentAllocation: number;
  targetAllocation: number;
  variance: number;
  performance: number;
  riskLevel: 'low' | 'medium' | 'high';
  totalValue: number;
}

export interface RiskMetric {
  type: 'market' | 'credit' | 'operational' | 'liquidity' | 'regulatory';
  currentLevel: number;
  threshold: number;
  trend: 'increasing' | 'stable' | 'decreasing';
  mitigation: string;
  lastUpdated: Date;
}

export interface OptionValuation {
  symbol: string;
  type: 'call' | 'put';
  strikePrice: number;
  currentPrice: number;
  expirationDate: Date;
  impliedVolatility: number;
  blackScholesValue: number;
  delta: number;
  gamma: number;
  theta: number;
  vega: number;
  rho: number;
  intrinsicValue: number;
  timeValue: number;
  profitLoss: number;
}

export interface EnterpriseAnalytics {
  performanceMetrics: EnterpriseMetrics;
  strategicInsights: StrategicInsight[];
  portfolioAllocations: PortfolioAllocation[];
  riskMetrics: RiskMetric[];
  optionValuations: OptionValuation[];
  benchmarkComparisons: BenchmarkComparison[];
  scenarioAnalysis: ScenarioResult[];
}

export interface BenchmarkComparison {
  benchmarkName: string;
  portfolioReturn: number;
  benchmarkReturn: number;
  outperformance: number;
  trackingError: number;
  informationRatio: number;
  period: string;
}

export interface ScenarioResult {
  scenario: string;
  probability: number;
  expectedReturn: number;
  worstCase: number;
  bestCase: number;
  varAtRisk: number;
  description: string;
}

export interface DashboardSection {
  id: string;
  title: string;
  component: string;
  order: number;
  visible: boolean;
  height: number;
  refreshInterval?: number;
}

export interface EnterpriseConfig {
  companyName: string;
  investmentHorizon: number;
  riskTolerance: 'conservative' | 'moderate' | 'aggressive';
  benchmarkIndex: string;
  reportingCurrency: string;
  complianceFramework: string[];
  customMetrics: string[];
  autoRefresh: boolean;
  refreshInterval: number;
}

// Chart and visualization types
export interface ChartData {
  labels: string[];
  datasets: ChartDataset[];
}

export interface ChartDataset {
  label: string;
  data: number[];
  backgroundColor?: string | string[];
  borderColor?: string | string[];
  borderWidth?: number;
  fill?: boolean;
}

// API response types
export interface EnterpriseApiResponse<T> {
  data: T;
  status: 'success' | 'error' | 'warning';
  message?: string;
  timestamp: Date;
  requestId: string;
}

// User permissions and access
export interface EnterpriseUserPermissions {
  canViewSensitiveData: boolean;
  canExportReports: boolean;
  canModifyAllocations: boolean;
  canAccessRiskTools: boolean;
  canViewComplianceReports: boolean;
  maxPortfolioValue: number;
  allowedRegions: string[];
}

// Dashboard state management
export interface EnterpriseDashboardState {
  isLoading: boolean;
  selectedTimeframe: '1D' | '1W' | '1M' | '3M' | '6M' | '1Y' | '2Y' | '5Y';
  activeSection: string;
  filters: DashboardFilters;
  refreshTimestamp: Date;
  error?: string;
}

export interface DashboardFilters {
  assetClasses: string[];
  riskLevels: string[];
  regions: string[];
  currencies: string[];
  dateRange: {
    start: Date;
    end: Date;
  };
}

// Strategic Scenario Analysis Types
export interface StrategicScenarioData {
  scenarios: StrategicScenario[];
  comparisonMetrics: ScenarioMetric[];
  riskAssessment: RiskAnalysis;
  recommendedPath: string;
  sensitivityAnalysis: SensitivityData;
  monteCarloSimulation?: MonteCarloResults;
}

export interface StrategicScenario {
  id: string;
  name: string;
  assumptions: ScenarioAssumption[];
  projections: YearlyProjection[];
  investmentRequired: number;
  expectedROI: number;
  riskLevel: 'low' | 'medium' | 'high';
  probabilityOfSuccess: number;
  valuationImpact: number;
  timeline: number; // months
  keyDrivers: string[];
  riskFactors: string[];
}

export interface ScenarioAssumption {
  id: string;
  category: string;
  description: string;
  value: number;
  unit: string;
  confidence: number;
}

export interface YearlyProjection {
  year: number;
  revenue: number;
  ebitda: number;
  cashFlow: number;
  valuation: number;
}

export interface ScenarioMetric {
  id: string;
  name: string;
  unit: string;
  weight: number;
  benchmarkValue?: number;
}

export interface RiskAnalysis {
  overallRisk: 'low' | 'medium' | 'high';
  riskFactors: RiskFactor[];
  mitigationStrategies: string[];
  confidenceLevel: number;
}

export interface RiskFactor {
  factor: string;
  impact: 'low' | 'medium' | 'high';
  probability: number;
  description: string;
}

export interface SensitivityData {
  variables: SensitivityVariable[];
  results: SensitivityResult[];
}

export interface SensitivityVariable {
  name: string;
  baseValue: number;
  range: [number, number];
  unit: string;
}

export interface SensitivityResult {
  variable: string;
  change: number;
  impact: number;
  scenario: string;
}

export interface MonteCarloResults {
  iterations: number;
  confidenceIntervals: ConfidenceInterval[];
  expectedValue: number;
  standardDeviation: number;
  valueAtRisk: number;
  distribution: DistributionPoint[];
}

export interface ConfidenceInterval {
  level: number; // e.g., 90, 95, 99
  lower: number;
  upper: number;
}

export interface DistributionPoint {
  value: number;
  probability: number;
}