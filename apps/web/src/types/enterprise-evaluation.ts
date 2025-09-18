/**
 * Enterprise Tier Evaluation Type Definitions
 * Story 11.5: Enterprise Tier Database Schema Extension
 *
 * This file defines the TypeScript interfaces for the Enterprise tier's
 * additional 25 fields beyond the Professional tier's 45 fields.
 */

// Competitive Advantage Types
export interface CompetitiveAdvantage {
  type: 'cost' | 'technology' | 'network' | 'regulatory' | 'brand' | 'switching';
  rank: number;
  sustainability: 'high' | 'medium' | 'low';
}

// Process Optimization Types
export interface ProcessOptimization {
  processName: string;
  annualSavings: number;
  implementationCost: number;
  roi: number;
}

// Investment Scenario Types
export interface InvestmentScenario {
  investmentAmount: number;
  revenueImpactPercentage: number;
  timelineMonths: number;
  riskLevel: 'low' | 'medium' | 'high';
}

// Exit Strategy Types
export interface ExitStrategy {
  type: 'strategic' | 'financial' | 'mbo' | 'esop' | 'ipo' | 'family';
  rank: number;
  feasibility: 'high' | 'medium' | 'low';
}

// Market Expansion Types
export interface MarketExpansion {
  market: string;
  opportunitySize: number;
  timeToEntry: number;
  investmentRequired: number;
  expectedROI: number;
}

// Value Priority Types
export interface ValuePriority {
  area: string;
  priority: number;
  currentScore: number;
  targetScore: number;
  investmentRequired: number;
}

// Advisor Types
export type AdvisorType = 'broker' | 'mna' | 'wealth' | 'legal' | 'tax' | 'none';

// Yearly Projection Types
export interface YearlyProjection {
  year: number;
  revenue: number;
  grossMargin: number;
  netMargin: number;
  cashFlow: number;
  capex: number;
}

// Strategic Option Types
export interface StrategicOption {
  type: 'international' | 'platform' | 'franchise' | 'licensing' | 'rollup';
  investmentRequired: number;
  valueCreationPotential: number;
  feasibilityScore: number;
}

/**
 * Strategic Value Drivers Section
 * IP portfolio, partnerships, brand value
 */
export interface StrategicValueDrivers {
  // Intellectual Property Portfolio
  patents: number;
  trademarks: number;
  hasTradeSecrets: boolean;
  hasCopyrights: boolean;
  ipPortfolioValue: number;

  // Strategic Partnerships
  partnershipRevenuePercentage: number;
  partnershipAgreementsValue: number;

  // Brand & Market Position
  brandDevelopmentInvestment: number;
  marketPosition: 'leader' | 'strong' | 'niche' | 'emerging';
  customerDatabaseValue: number;
  customerAcquisitionCost: number;

  // Competitive Advantages (ranked priorities)
  competitiveAdvantages: CompetitiveAdvantage[];
}

/**
 * Operational Scalability Section
 * Process documentation, management systems, technology
 */
export interface OperationalScalability {
  // Process Documentation
  processDocumentationPercentage: number;
  keyPersonDependencyPercentage: number;

  // Management Systems
  ownerKnowledgeConcentration: number;
  operationalManagerCount: number;

  // Technology & Automation
  operationalUtilization: number;
  technologyInvestmentThreeYear: number;

  // Scalability Investment
  majorInfrastructureThreshold: number;
  infrastructureInvestmentRequired: number;

  // Process Optimization
  processOptimizationOpportunities: ProcessOptimization[];
}

/**
 * Financial Optimization Section
 * Tax structure, working capital, capital structure
 */
export interface FinancialOptimization {
  // Tax Structure
  businessEntityType: 'sole' | 'llc' | 'scorp' | 'ccorp' | 'partnership';
  taxOptimizationStrategies: string;

  // Working Capital
  workingCapitalPercentage: number;
  industryBenchmarkWorking: number;
  workingCapitalReduction: number;

  // Capital Structure
  debtToEquityRatio: number;
  debtServiceRequirements: number;
  debtCapacityGrowth: number;

  // Owner Compensation
  ownerCompensation: number;
  marketRateCompensation: number;
  compensationAdjustment: number;

  // Non-recurring Expenses
  oneTimeExpenses2024: number;
  oneTimeExpenses2023: number;
  oneTimeExpenses2022: number;
}

/**
 * Strategic Scenario Planning Section
 * Growth scenarios, exit strategies, value maximization
 */
export interface StrategicScenarioPlanning {
  // Growth & Expansion
  realisticGrowthRate: number;
  marketExpansionOpportunities: MarketExpansion[];

  // Investment Scenarios
  conservativeScenario: InvestmentScenario;
  aggressiveScenario: InvestmentScenario;
  acquisitionScenario: InvestmentScenario;

  // Exit Strategy
  preferredExitTimeline: 'one2years' | 'three5years' | 'five7years' | 'sevenplus' | 'none';
  exitStrategyPreferences: ExitStrategy[];
  transactionReadiness: 'ready' | 'mostly' | 'some' | 'significant';
  advisorsEngaged: AdvisorType[];

  // Value Maximization
  valueMaximizationPriorities: ValuePriority[];
}

/**
 * Multi-Year Projections Section
 * 5-year financial projections and strategic options
 */
export interface MultiYearProjections {
  // 5-Year Revenue Scenarios
  baseCase: YearlyProjection[];
  optimisticCase: YearlyProjection[];
  conservativeCase: YearlyProjection[];

  // Margin Evolution
  currentGrossMargin: number;
  projectedGrossMarginYear5: number;
  currentNetMargin: number;
  projectedNetMarginYear5: number;

  // Capital Requirements
  maintenanceCapexPercentage: number;
  growthCapexFiveYear: number;

  // Market Position Evolution
  projectedMarketPosition: 'leader' | 'top3' | 'niche' | 'consolidated';
  competitiveThreats: string;

  // Strategic Options
  strategicOptions: StrategicOption[];
}

/**
 * Complete Enterprise Tier Data Structure
 * Combines all enterprise-specific sections
 */
export interface EnterpriseTierData {
  strategicValueDrivers: StrategicValueDrivers;
  operationalScalability: OperationalScalability;
  financialOptimization: FinancialOptimization;
  strategicScenarioPlanning: StrategicScenarioPlanning;
  multiYearProjections: MultiYearProjections;
}

/**
 * Scenario Model Data Structure
 * For complex multi-scenario modeling
 */
export interface EnterpriseScenarioModel {
  id: string;
  businessEvaluationId: string;

  // Scenario configurations
  baseScenario: ScenarioConfiguration;
  optimisticScenario: ScenarioConfiguration;
  conservativeScenario: ScenarioConfiguration;
  customScenarios: ScenarioConfiguration[];

  // Projection metadata
  projectionHorizon: number; // years
  lastUpdated: Date;
  calculationVersion: string;
}

export interface ScenarioConfiguration {
  name: string;
  assumptions: {
    revenueGrowthRate: number;
    marginImprovement: number;
    capexPercentage: number;
    workingCapitalChange: number;
  };
  projections: YearlyProjection[];
  valuation: {
    dcfValue: number;
    multipleValue: number;
    assetValue: number;
  };
  riskScore: number;
  probabilityWeight: number;
}

/**
 * Audit Log Entry for Enterprise Tier
 * Tracks all access and modifications
 */
export interface AuditLogEntry {
  id: string;
  businessEvaluationId: string;
  action: 'create' | 'read' | 'update' | 'delete' | 'export';
  fieldName?: string;
  oldValue?: any;
  newValue?: any;
  userId: string;
  userTier: string;
  ipAddress?: string;
  userAgent?: string;
  timestamp: Date;
}

/**
 * Encrypted Field List
 * Fields requiring field-level encryption
 */
export const ENCRYPTED_FIELDS = [
  'ipPortfolioValue',
  'partnershipAgreementsValue',
  'customerDatabaseValue',
  'strategicOptions',
  'exitStrategyPreferences',
  'acquisitionScenario'
] as const;

export type EncryptedFieldName = typeof ENCRYPTED_FIELDS[number];