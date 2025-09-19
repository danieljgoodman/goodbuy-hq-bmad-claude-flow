// Enterprise Dashboard Components Export
// Comprehensive interactive scenario modeling system

// Main Components
export { default as InteractiveModeling } from './InteractiveModeling';
export { default as UnifiedStrategicDashboard } from './UnifiedStrategicDashboard';
export { default as ScenarioMatrix } from './ScenarioMatrix';
export { default as CapitalStructureOptimizer } from './CapitalStructureOptimizer';
export { default as ExitStrategyDashboard } from './ExitStrategyDashboard';

// Strategic Components
export { default as StrategicOptionValuation } from './StrategicOptionValuation';

// Example and Demo Components
export { default as InteractiveModelingExample } from './examples/InteractiveModelingExample';

// Hooks
export { useInteractiveModeling } from '@/hooks/useInteractiveModeling';

// Types
export type {
  ModelingVariable,
  ScenarioSnapshot,
  ModelingState
} from './InteractiveModeling';

export type {
  CapitalStructureData,
  CapitalStructure,
  CostAnalysis,
  LeverageMetrics,
  CapitalScenario
} from './CapitalStructureOptimizer';

// Re-export enterprise dashboard types for convenience
export type {
  StrategicScenarioData,
  StrategicScenario,
  ScenarioAssumption,
  YearlyProjection,
  ScenarioMetric,
  RiskAnalysis,
  RiskFactor,
  SensitivityData,
  SensitivityVariable,
  SensitivityResult,
  MonteCarloResults,
  ConfidenceInterval,
  DistributionPoint,
  EnterpriseMetrics,
  StrategicInsight,
  PortfolioAllocation,
  RiskMetric,
  OptionValuation,
  EnterpriseAnalytics,
  BenchmarkComparison,
  ScenarioResult,
  DashboardSection,
  EnterpriseConfig,
  ChartData,
  ChartDataset,
  EnterpriseApiResponse,
  EnterpriseUserPermissions,
  EnterpriseDashboardState,
  DashboardFilters
} from '../../../types/enterprise-dashboard';

// Component configuration and utilities
export const INTERACTIVE_MODELING_CONFIG = {
  defaultVariables: {
    growthRate: { min: -0.1, max: 0.5, default: 0.15, step: 0.01 },
    marketConditions: { min: 0.5, max: 1.5, default: 1.0, step: 0.05 },
    riskFactor: { min: 0.01, max: 0.2, default: 0.05, step: 0.005 },
    costInflation: { min: 0.0, max: 0.1, default: 0.03, step: 0.005 },
    capitalEfficiency: { min: 0.5, max: 1.2, default: 0.8, step: 0.05 }
  },
  categories: ['growth', 'market', 'risk', 'cost', 'capital'] as const,
  maxScenarios: 10,
  maxComparisons: 4,
  autoSaveInterval: 30000, // 30 seconds
  debounceDelay: 300 // 300ms
};

export const DASHBOARD_LAYOUT_CONFIG = {
  breakpoints: {
    mobile: 768,
    tablet: 1024,
    desktop: 1280
  },
  components: {
    interactive: { minHeight: 600, defaultSpan: 2 },
    scenarioMatrix: { minHeight: 400, defaultSpan: 1 },
    capitalStructure: { minHeight: 400, defaultSpan: 1 },
    exitStrategy: { minHeight: 300, defaultSpan: 2 }
  },
  maxFullscreenComponents: 1
};

// Color schemes for different components
export const ENTERPRISE_COLORS = {
  primary: '#2c1810',
  secondary: '#059669',
  accent: '#dc2626',
  warning: '#ea580c',
  info: '#3b82f6',
  success: '#10b981',
  muted: '#6b7280',
  categories: {
    growth: '#10b981',
    market: '#3b82f6',
    risk: '#dc2626',
    cost: '#ea580c',
    capital: '#7c3aed'
  },
  riskLevels: {
    low: '#10b981',
    medium: '#ea580c',
    high: '#dc2626'
  }
};

// Default chart configurations
export const CHART_CONFIG = {
  defaultHeight: 300,
  animation: {
    duration: 300,
    easing: 'easeInOut'
  },
  colors: [
    '#2c1810', '#059669', '#dc2626', '#7c3aed', '#ea580c',
    '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'
  ],
  gridColor: '#e5e7eb',
  axisColor: '#6b7280',
  tooltipBg: 'rgba(0, 0, 0, 0.8)'
};

// Validation schemas for modeling variables
export const VARIABLE_VALIDATION = {
  required: ['id', 'name', 'value', 'minValue', 'maxValue', 'unit', 'category'],
  categories: ['growth', 'market', 'risk', 'cost', 'capital'],
  impacts: ['high', 'medium', 'low'],
  valueConstraints: {
    min: -1,
    max: 10,
    precision: 4
  }
};

// Integration utilities
export const createDefaultVariable = (
  id: string,
  name: string,
  category: 'growth' | 'market' | 'risk' | 'cost' | 'capital',
  config: Partial<any> = {}
): any => ({
  id,
  name,
  value: 0.1,
  minValue: 0,
  maxValue: 1,
  step: 0.01,
  unit: '%',
  category,
  description: `${name} parameter`,
  impact: 'medium',
  locked: false,
  ...config
});

export const validateScenarioData = (data: any): boolean => {
  return !!(
    data &&
    data.scenarios &&
    Array.isArray(data.scenarios) &&
    data.scenarios.length > 0 &&
    data.riskAssessment &&
    data.recommendedPath
  );
};

export const calculateROI = (
  initialInvestment: number,
  finalValue: number,
  timeFrameYears: number
): number => {
  if (initialInvestment <= 0 || timeFrameYears <= 0) return 0;
  return ((finalValue - initialInvestment) / initialInvestment) * 100;
};

export const calculateNPV = (
  cashFlows: number[],
  discountRate: number,
  initialInvestment: number
): number => {
  const npv = cashFlows.reduce((acc, cashFlow, index) => {
    return acc + cashFlow / Math.pow(1 + discountRate, index + 1);
  }, 0);
  return npv - initialInvestment;
};

export const calculateIRR = (
  cashFlows: number[],
  initialInvestment: number,
  precision: number = 0.0001
): number => {
  const allCashFlows = [-initialInvestment, ...cashFlows];
  let rate = 0.1; // Initial guess
  let iteration = 0;
  const maxIterations = 1000;

  while (iteration < maxIterations) {
    let npv = 0;
    let npvDerivative = 0;

    for (let i = 0; i < allCashFlows.length; i++) {
      npv += allCashFlows[i] / Math.pow(1 + rate, i);
      npvDerivative -= (i * allCashFlows[i]) / Math.pow(1 + rate, i + 1);
    }

    if (Math.abs(npv) < precision) break;

    const newRate = rate - npv / npvDerivative;
    if (Math.abs(newRate - rate) < precision) break;

    rate = newRate;
    iteration++;
  }

  return rate * 100; // Return as percentage
};

// Error handling utilities
export class InteractiveModelingError extends Error {
  constructor(message: string, public code: string, public details?: any) {
    super(message);
    this.name = 'InteractiveModelingError';
  }
}

export const handleModelingError = (error: unknown): InteractiveModelingError => {
  if (error instanceof InteractiveModelingError) {
    return error;
  }

  if (error instanceof Error) {
    return new InteractiveModelingError(
      error.message,
      'MODELING_ERROR',
      { originalError: error }
    );
  }

  return new InteractiveModelingError(
    'An unknown error occurred in interactive modeling',
    'UNKNOWN_ERROR',
    { error }
  );
};

// Performance monitoring utilities
export const createPerformanceMonitor = () => {
  const metrics = new Map<string, number>();

  return {
    start: (operation: string) => {
      metrics.set(`${operation}_start`, performance.now());
    },

    end: (operation: string) => {
      const startTime = metrics.get(`${operation}_start`);
      if (startTime) {
        const duration = performance.now() - startTime;
        metrics.set(`${operation}_duration`, duration);
        return duration;
      }
      return 0;
    },

    getMetrics: () => Object.fromEntries(metrics),

    clear: () => metrics.clear()
  };
};

// Export version for compatibility tracking
export const INTERACTIVE_MODELING_VERSION = '1.0.0';