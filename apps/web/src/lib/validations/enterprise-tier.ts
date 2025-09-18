/**
 * Enterprise Tier Validation Schemas
 * Story 11.5: Comprehensive validation for 80+ Enterprise tier fields
 */

import { z } from 'zod';

/**
 * Competitive Advantage Schema
 */
const CompetitiveAdvantageSchema = z.object({
  type: z.enum(['cost', 'technology', 'network', 'regulatory', 'brand', 'switching']),
  rank: z.number().min(1).max(10),
  sustainability: z.enum(['high', 'medium', 'low'])
});

/**
 * Process Optimization Schema
 */
const ProcessOptimizationSchema = z.object({
  processName: z.string().min(1).max(200),
  annualSavings: z.number().min(0).max(100000000),
  implementationCost: z.number().min(0).max(10000000),
  roi: z.number().min(-100).max(1000)
});

/**
 * Investment Scenario Schema
 */
const InvestmentScenarioSchema = z.object({
  investmentAmount: z.number().min(0).max(1000000000),
  revenueImpactPercentage: z.number().min(-50).max(200),
  timelineMonths: z.number().min(1).max(120),
  riskLevel: z.enum(['low', 'medium', 'high'])
});

/**
 * Exit Strategy Schema
 */
const ExitStrategySchema = z.object({
  type: z.enum(['strategic', 'financial', 'mbo', 'esop', 'ipo', 'family']),
  rank: z.number().min(1).max(6),
  feasibility: z.enum(['high', 'medium', 'low'])
});

/**
 * Market Expansion Schema
 */
const MarketExpansionSchema = z.object({
  market: z.string().min(1).max(100),
  opportunitySize: z.number().min(0).max(100000000000),
  timeToEntry: z.number().min(0).max(60),
  investmentRequired: z.number().min(0).max(1000000000),
  expectedROI: z.number().min(-100).max(1000)
});

/**
 * Value Priority Schema
 */
const ValuePrioritySchema = z.object({
  area: z.string().min(1).max(100),
  priority: z.number().min(1).max(10),
  currentScore: z.number().min(0).max(100),
  targetScore: z.number().min(0).max(100),
  investmentRequired: z.number().min(0).max(100000000)
});

/**
 * Yearly Projection Schema
 */
const YearlyProjectionSchema = z.object({
  year: z.number().min(2024).max(2050),
  revenue: z.number().min(0).max(100000000000),
  grossMargin: z.number().min(0).max(100),
  netMargin: z.number().min(-100).max(100),
  cashFlow: z.number().min(-1000000000).max(100000000000),
  capex: z.number().min(0).max(100000000000)
});

/**
 * Strategic Option Schema
 */
const StrategicOptionSchema = z.object({
  type: z.enum(['international', 'platform', 'franchise', 'licensing', 'rollup']),
  investmentRequired: z.number().min(0).max(1000000000),
  valueCreationPotential: z.number().min(0).max(100000000000),
  feasibilityScore: z.number().min(0).max(100)
});

/**
 * Strategic Value Drivers Schema
 */
export const StrategicValueDriversSchema = z.object({
  // Intellectual Property Portfolio
  patents: z.number().min(0).max(10000),
  trademarks: z.number().min(0).max(10000),
  hasTradeSecrets: z.boolean(),
  hasCopyrights: z.boolean(),
  ipPortfolioValue: z.number().min(0).max(100000000000),

  // Strategic Partnerships
  partnershipRevenuePercentage: z.number().min(0).max(100),
  partnershipAgreementsValue: z.number().min(0).max(100000000000),

  // Brand & Market Position
  brandDevelopmentInvestment: z.number().min(0).max(1000000000),
  marketPosition: z.enum(['leader', 'strong', 'niche', 'emerging']),
  customerDatabaseValue: z.number().min(0).max(100000000000),
  customerAcquisitionCost: z.number().min(0).max(1000000),

  // Competitive Advantages
  competitiveAdvantages: z.array(CompetitiveAdvantageSchema).min(1).max(10)
});

/**
 * Operational Scalability Schema
 */
export const OperationalScalabilitySchema = z.object({
  // Process Documentation
  processDocumentationPercentage: z.number().min(0).max(100),
  keyPersonDependencyPercentage: z.number().min(0).max(100),

  // Management Systems
  ownerKnowledgeConcentration: z.number().min(0).max(100),
  operationalManagerCount: z.number().min(0).max(1000),

  // Technology & Automation
  operationalUtilization: z.number().min(0).max(150),
  technologyInvestmentThreeYear: z.number().min(0).max(100000000),

  // Scalability Investment
  majorInfrastructureThreshold: z.number().min(0).max(100000000000),
  infrastructureInvestmentRequired: z.number().min(0).max(100000000),

  // Process Optimization
  processOptimizationOpportunities: z.array(ProcessOptimizationSchema).min(0).max(20)
});

/**
 * Financial Optimization Schema
 */
export const FinancialOptimizationSchema = z.object({
  // Tax Structure
  businessEntityType: z.enum(['sole', 'llc', 'scorp', 'ccorp', 'partnership']),
  taxOptimizationStrategies: z.string().max(2000),

  // Working Capital
  workingCapitalPercentage: z.number().min(-50).max(100),
  industryBenchmarkWorking: z.number().min(0).max(100),
  workingCapitalReduction: z.number().min(0).max(100000000),

  // Capital Structure
  debtToEquityRatio: z.number().min(0).max(20),
  debtServiceRequirements: z.number().min(0).max(100000000),
  debtCapacityGrowth: z.number().min(0).max(100000000),

  // Owner Compensation
  ownerCompensation: z.number().min(0).max(100000000),
  marketRateCompensation: z.number().min(0).max(100000000),
  compensationAdjustment: z.number().min(-10000000).max(10000000),

  // Non-recurring Expenses
  oneTimeExpenses2024: z.number().min(0).max(100000000),
  oneTimeExpenses2023: z.number().min(0).max(100000000),
  oneTimeExpenses2022: z.number().min(0).max(100000000)
});

/**
 * Strategic Scenario Planning Schema
 */
export const StrategicScenarioPlanningSchema = z.object({
  // Growth & Expansion
  realisticGrowthRate: z.number().min(-50).max(200),
  marketExpansionOpportunities: z.array(MarketExpansionSchema).min(0).max(10),

  // Investment Scenarios
  conservativeScenario: InvestmentScenarioSchema,
  aggressiveScenario: InvestmentScenarioSchema,
  acquisitionScenario: InvestmentScenarioSchema,

  // Exit Strategy
  preferredExitTimeline: z.enum(['one2years', 'three5years', 'five7years', 'sevenplus', 'none']),
  exitStrategyPreferences: z.array(ExitStrategySchema).min(1).max(6),
  transactionReadiness: z.enum(['ready', 'mostly', 'some', 'significant']),
  advisorsEngaged: z.array(z.enum(['broker', 'mna', 'wealth', 'legal', 'tax', 'none'])).min(0).max(6),

  // Value Maximization
  valueMaximizationPriorities: z.array(ValuePrioritySchema).min(0).max(15)
});

/**
 * Multi-Year Projections Schema
 */
export const MultiYearProjectionsSchema = z.object({
  // 5-Year Revenue Scenarios
  baseCase: z.array(YearlyProjectionSchema).length(5),
  optimisticCase: z.array(YearlyProjectionSchema).length(5),
  conservativeCase: z.array(YearlyProjectionSchema).length(5),

  // Margin Evolution
  currentGrossMargin: z.number().min(0).max(100),
  projectedGrossMarginYear5: z.number().min(0).max(100),
  currentNetMargin: z.number().min(-100).max(100),
  projectedNetMarginYear5: z.number().min(-100).max(100),

  // Capital Requirements
  maintenanceCapexPercentage: z.number().min(0).max(50),
  growthCapexFiveYear: z.number().min(0).max(100000000000),

  // Market Position Evolution
  projectedMarketPosition: z.enum(['leader', 'top3', 'niche', 'consolidated']),
  competitiveThreats: z.string().max(2000),

  // Strategic Options
  strategicOptions: z.array(StrategicOptionSchema).min(0).max(10)
});

/**
 * Complete Enterprise Tier Data Schema
 */
export const EnterpriseTierDataSchema = z.object({
  strategicValueDrivers: StrategicValueDriversSchema,
  operationalScalability: OperationalScalabilitySchema,
  financialOptimization: FinancialOptimizationSchema,
  strategicScenarioPlanning: StrategicScenarioPlanningSchema,
  multiYearProjections: MultiYearProjectionsSchema
});

/**
 * Partial Enterprise Tier Data Schema for updates
 */
export const PartialEnterpriseTierDataSchema = EnterpriseTierDataSchema.partial();

/**
 * Cross-field validation rules
 */
export const validateEnterpriseTierData = (data: z.infer<typeof EnterpriseTierDataSchema>) => {
  const errors: string[] = [];

  // Validate that growth rates are consistent
  if (data.strategicScenarioPlanning.realisticGrowthRate > 100) {
    errors.push('Realistic growth rate cannot exceed 100%');
  }

  // Validate that margins make sense
  if (data.multiYearProjections.projectedGrossMarginYear5 < data.multiYearProjections.currentGrossMargin - 20) {
    errors.push('Projected gross margin decline exceeds reasonable limits');
  }

  // Validate investment scenarios
  const conservativeReturn = data.strategicScenarioPlanning.conservativeScenario.revenueImpactPercentage;
  const aggressiveReturn = data.strategicScenarioPlanning.aggressiveScenario.revenueImpactPercentage;

  if (conservativeReturn > aggressiveReturn) {
    errors.push('Conservative scenario returns cannot exceed aggressive scenario returns');
  }

  // Validate working capital
  if (data.financialOptimization.workingCapitalPercentage > 50) {
    errors.push('Working capital percentage exceeds industry norms');
  }

  // Validate debt ratios
  if (data.financialOptimization.debtToEquityRatio > 10) {
    errors.push('Debt to equity ratio indicates high financial risk');
  }

  // Validate process optimization ROI
  data.operationalScalability.processOptimizationOpportunities.forEach((opportunity, index) => {
    if (opportunity.annualSavings > 0 && opportunity.implementationCost > 0) {
      const calculatedROI = ((opportunity.annualSavings - opportunity.implementationCost) / opportunity.implementationCost) * 100;
      if (Math.abs(calculatedROI - opportunity.roi) > 5) {
        errors.push(`Process optimization ROI calculation mismatch at index ${index}`);
      }
    }
  });

  // Validate competitive advantages ranking
  const ranks = data.strategicValueDrivers.competitiveAdvantages.map(a => a.rank);
  const uniqueRanks = new Set(ranks);
  if (ranks.length !== uniqueRanks.size) {
    errors.push('Competitive advantages must have unique rankings');
  }

  // Validate exit strategy preferences ranking
  const exitRanks = data.strategicScenarioPlanning.exitStrategyPreferences.map(e => e.rank);
  const uniqueExitRanks = new Set(exitRanks);
  if (exitRanks.length !== uniqueExitRanks.size) {
    errors.push('Exit strategy preferences must have unique rankings');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Type exports for use in API and components
 */
export type EnterpriseTierData = z.infer<typeof EnterpriseTierDataSchema>;
export type StrategicValueDrivers = z.infer<typeof StrategicValueDriversSchema>;
export type OperationalScalability = z.infer<typeof OperationalScalabilitySchema>;
export type FinancialOptimization = z.infer<typeof FinancialOptimizationSchema>;
export type StrategicScenarioPlanning = z.infer<typeof StrategicScenarioPlanningSchema>;
export type MultiYearProjections = z.infer<typeof MultiYearProjectionsSchema>;