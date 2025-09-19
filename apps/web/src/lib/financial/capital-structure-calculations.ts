// Capital Structure Financial Calculations
// Provides utilities for WACC, leverage metrics, and capital optimization analysis

export interface CapitalStructureInputs {
  totalDebt: number;
  totalEquity: number;
  marketValueDebt: number;
  marketValueEquity: number;
  costOfDebt: number;
  costOfEquity: number;
  taxRate: number;
  ebit: number;
  interestExpense: number;
  totalAssets: number;
  totalLiabilities: number;
  operatingCashFlow: number;
  totalDebtService: number;
  cashAndEquivalents: number;
}

export interface WACCCalculation {
  wacc: number;
  weightedCostOfDebt: number;
  weightedCostOfEquity: number;
  debtWeight: number;
  equityWeight: number;
  taxShield: number;
}

export interface LeverageMetricsResult {
  debtToEquityRatio: number;
  debtToAssetRatio: number;
  equityToAssetRatio: number;
  interestCoverageRatio: number;
  debtServiceCoverageRatio: number;
  timesInterestEarned: number;
  cashCoverageRatio: number;
  debtToEBITRatio: number;
  capitalStructureRatio: number;
}

export interface OptimizationScenario {
  debtRatio: number;
  wacc: number;
  creditRating: CreditRating;
  leverageMetrics: LeverageMetricsResult;
  riskLevel: 'low' | 'medium' | 'high';
  description: string;
}

export interface CreditRating {
  rating: string;
  numericScore: number;
  riskPremium: number;
  description: string;
}

/**
 * Calculate Weighted Average Cost of Capital (WACC)
 */
export function calculateWACC(inputs: CapitalStructureInputs): WACCCalculation {
  const totalValue = inputs.marketValueDebt + inputs.marketValueEquity;
  const debtWeight = inputs.marketValueDebt / totalValue;
  const equityWeight = inputs.marketValueEquity / totalValue;

  const taxShield = inputs.taxRate;
  const afterTaxCostOfDebt = inputs.costOfDebt * (1 - taxShield);

  const weightedCostOfDebt = afterTaxCostOfDebt * debtWeight;
  const weightedCostOfEquity = inputs.costOfEquity * equityWeight;

  const wacc = weightedCostOfDebt + weightedCostOfEquity;

  return {
    wacc,
    weightedCostOfDebt,
    weightedCostOfEquity,
    debtWeight,
    equityWeight,
    taxShield
  };
}

/**
 * Calculate comprehensive leverage metrics
 */
export function calculateLeverageMetrics(inputs: CapitalStructureInputs): LeverageMetricsResult {
  const debtToEquityRatio = inputs.totalDebt / inputs.totalEquity;
  const debtToAssetRatio = inputs.totalLiabilities / inputs.totalAssets;
  const equityToAssetRatio = inputs.totalEquity / inputs.totalAssets;

  // Interest coverage ratios
  const interestCoverageRatio = inputs.ebit / inputs.interestExpense;
  const timesInterestEarned = inputs.ebit / inputs.interestExpense;

  // Debt service coverage
  const debtServiceCoverageRatio = inputs.operatingCashFlow / inputs.totalDebtService;

  // Cash coverage
  const cashCoverageRatio = (inputs.operatingCashFlow + inputs.cashAndEquivalents) / inputs.totalDebtService;

  // Additional ratios
  const debtToEBITRatio = inputs.totalDebt / inputs.ebit;
  const capitalStructureRatio = inputs.totalDebt / (inputs.totalDebt + inputs.totalEquity);

  return {
    debtToEquityRatio,
    debtToAssetRatio,
    equityToAssetRatio,
    interestCoverageRatio,
    debtServiceCoverageRatio,
    timesInterestEarned,
    cashCoverageRatio,
    debtToEBITRatio,
    capitalStructureRatio
  };
}

/**
 * Estimate credit rating based on financial metrics
 */
export function estimateCreditRating(leverageMetrics: LeverageMetricsResult, inputs: CapitalStructureInputs): CreditRating {
  let score = 0;

  // Debt-to-equity scoring (0-25 points)
  if (leverageMetrics.debtToEquityRatio <= 0.3) score += 25;
  else if (leverageMetrics.debtToEquityRatio <= 0.6) score += 20;
  else if (leverageMetrics.debtToEquityRatio <= 1.0) score += 15;
  else if (leverageMetrics.debtToEquityRatio <= 1.5) score += 10;
  else score += 5;

  // Interest coverage scoring (0-25 points)
  if (leverageMetrics.interestCoverageRatio >= 8) score += 25;
  else if (leverageMetrics.interestCoverageRatio >= 4) score += 20;
  else if (leverageMetrics.interestCoverageRatio >= 2.5) score += 15;
  else if (leverageMetrics.interestCoverageRatio >= 1.5) score += 10;
  else score += 5;

  // Debt service coverage scoring (0-25 points)
  if (leverageMetrics.debtServiceCoverageRatio >= 2.0) score += 25;
  else if (leverageMetrics.debtServiceCoverageRatio >= 1.5) score += 20;
  else if (leverageMetrics.debtServiceCoverageRatio >= 1.25) score += 15;
  else if (leverageMetrics.debtServiceCoverageRatio >= 1.0) score += 10;
  else score += 5;

  // Cash flow stability scoring (0-25 points)
  const cashFlowMargin = inputs.operatingCashFlow / (inputs.ebit || 1);
  if (cashFlowMargin >= 0.9) score += 25;
  else if (cashFlowMargin >= 0.7) score += 20;
  else if (cashFlowMargin >= 0.5) score += 15;
  else if (cashFlowMargin >= 0.3) score += 10;
  else score += 5;

  // Map score to credit rating
  let rating: string;
  let riskPremium: number;
  let description: string;

  if (score >= 85) {
    rating = 'AAA';
    riskPremium = 0.005;
    description = 'Excellent credit quality, minimal risk';
  } else if (score >= 75) {
    rating = 'AA';
    riskPremium = 0.01;
    description = 'High credit quality, low risk';
  } else if (score >= 65) {
    rating = 'A';
    riskPremium = 0.02;
    description = 'Good credit quality, moderate risk';
  } else if (score >= 55) {
    rating = 'BBB';
    riskPremium = 0.035;
    description = 'Adequate credit quality, some risk';
  } else if (score >= 45) {
    rating = 'BB';
    riskPremium = 0.055;
    description = 'Speculative grade, elevated risk';
  } else if (score >= 35) {
    rating = 'B';
    riskPremium = 0.08;
    description = 'Highly speculative, high risk';
  } else {
    rating = 'CCC';
    riskPremium = 0.12;
    description = 'Substantial risk, near default';
  }

  return {
    rating,
    numericScore: score,
    riskPremium,
    description
  };
}

/**
 * Generate capital structure optimization scenarios
 */
export function generateOptimizationScenarios(inputs: CapitalStructureInputs): OptimizationScenario[] {
  const scenarios: OptimizationScenario[] = [];
  const baseValue = inputs.marketValueDebt + inputs.marketValueEquity;

  // Conservative scenario (Low debt)
  const conservativeDebtRatio = 0.2;
  const conservativeInputs = {
    ...inputs,
    marketValueDebt: baseValue * conservativeDebtRatio,
    marketValueEquity: baseValue * (1 - conservativeDebtRatio),
    totalDebt: baseValue * conservativeDebtRatio
  };
  const conservativeWACC = calculateWACC(conservativeInputs);
  const conservativeLeverage = calculateLeverageMetrics(conservativeInputs);
  const conservativeRating = estimateCreditRating(conservativeLeverage, conservativeInputs);

  scenarios.push({
    debtRatio: conservativeDebtRatio,
    wacc: conservativeWACC.wacc,
    creditRating: conservativeRating,
    leverageMetrics: conservativeLeverage,
    riskLevel: 'low',
    description: 'Conservative capital structure with minimal leverage'
  });

  // Moderate scenario (Balanced)
  const moderateDebtRatio = 0.4;
  const moderateInputs = {
    ...inputs,
    marketValueDebt: baseValue * moderateDebtRatio,
    marketValueEquity: baseValue * (1 - moderateDebtRatio),
    totalDebt: baseValue * moderateDebtRatio
  };
  const moderateWACC = calculateWACC(moderateInputs);
  const moderateLeverage = calculateLeverageMetrics(moderateInputs);
  const moderateRating = estimateCreditRating(moderateLeverage, moderateInputs);

  scenarios.push({
    debtRatio: moderateDebtRatio,
    wacc: moderateWACC.wacc,
    creditRating: moderateRating,
    leverageMetrics: moderateLeverage,
    riskLevel: 'medium',
    description: 'Balanced capital structure optimizing cost and risk'
  });

  // Aggressive scenario (High debt)
  const aggressiveDebtRatio = 0.6;
  const aggressiveInputs = {
    ...inputs,
    marketValueDebt: baseValue * aggressiveDebtRatio,
    marketValueEquity: baseValue * (1 - aggressiveDebtRatio),
    totalDebt: baseValue * aggressiveDebtRatio
  };
  const aggressiveWACC = calculateWACC(aggressiveInputs);
  const aggressiveLeverage = calculateLeverageMetrics(aggressiveInputs);
  const aggressiveRating = estimateCreditRating(aggressiveLeverage, aggressiveInputs);

  scenarios.push({
    debtRatio: aggressiveDebtRatio,
    wacc: aggressiveWACC.wacc,
    creditRating: aggressiveRating,
    leverageMetrics: aggressiveLeverage,
    riskLevel: 'high',
    description: 'Aggressive capital structure maximizing leverage benefits'
  });

  return scenarios;
}

/**
 * Find optimal capital structure based on goal
 */
export function findOptimalStructure(
  inputs: CapitalStructureInputs,
  goal: 'wacc' | 'coverage' | 'rating'
): OptimizationScenario {
  const scenarios = generateOptimizationScenarios(inputs);

  switch (goal) {
    case 'wacc':
      return scenarios.reduce((optimal, current) =>
        current.wacc < optimal.wacc ? current : optimal
      );

    case 'coverage':
      return scenarios.reduce((optimal, current) =>
        current.leverageMetrics.debtServiceCoverageRatio > optimal.leverageMetrics.debtServiceCoverageRatio ? current : optimal
      );

    case 'rating':
      return scenarios.reduce((optimal, current) =>
        current.creditRating.numericScore > optimal.creditRating.numericScore ? current : optimal
      );

    default:
      return scenarios[1]; // Return moderate scenario as default
  }
}

/**
 * Calculate enterprise value impact of capital structure changes
 */
export function calculateEnterpriseValueImpact(
  currentWACC: number,
  optimizedWACC: number,
  fcf: number,
  growthRate: number = 0.03
): number {
  const currentValue = fcf / (currentWACC - growthRate);
  const optimizedValue = fcf / (optimizedWACC - growthRate);

  return optimizedValue - currentValue;
}

/**
 * Generate capital structure recommendations
 */
export function generateCapitalStructureRecommendations(
  current: OptimizationScenario,
  optimal: OptimizationScenario
): Array<{
  type: string;
  title: string;
  description: string;
  impact: 'low' | 'medium' | 'high';
  priority: number;
  actions: string[];
}> {
  const recommendations = [];

  // WACC optimization
  if (optimal.wacc < current.wacc) {
    recommendations.push({
      type: 'wacc_optimization',
      title: 'Optimize Cost of Capital',
      description: `Reduce WACC from ${(current.wacc * 100).toFixed(2)}% to ${(optimal.wacc * 100).toFixed(2)}%`,
      impact: 'high' as const,
      priority: 1,
      actions: [
        'Rebalance debt-to-equity ratio',
        'Negotiate better debt terms',
        'Consider refinancing existing debt'
      ]
    });
  }

  // Credit rating improvement
  if (optimal.creditRating.numericScore > current.creditRating.numericScore) {
    recommendations.push({
      type: 'credit_improvement',
      title: 'Improve Credit Profile',
      description: `Target credit rating improvement from ${current.creditRating.rating} to ${optimal.creditRating.rating}`,
      impact: 'high' as const,
      priority: 2,
      actions: [
        'Strengthen balance sheet metrics',
        'Improve debt service coverage',
        'Enhance financial reporting and transparency'
      ]
    });
  }

  // Leverage optimization
  if (Math.abs(optimal.debtRatio - current.debtRatio) > 0.1) {
    const action = optimal.debtRatio > current.debtRatio ? 'increase' : 'decrease';
    recommendations.push({
      type: 'leverage_optimization',
      title: `Optimize Leverage Ratio`,
      description: `${action === 'increase' ? 'Increase' : 'Decrease'} debt ratio from ${(current.debtRatio * 100).toFixed(1)}% to ${(optimal.debtRatio * 100).toFixed(1)}%`,
      impact: 'medium' as const,
      priority: 3,
      actions: action === 'increase'
        ? ['Evaluate debt financing options', 'Consider strategic debt for growth', 'Monitor debt service capacity']
        : ['Accelerate debt repayment', 'Retain earnings for debt reduction', 'Consider equity financing']
    });
  }

  return recommendations.sort((a, b) => a.priority - b.priority);
}

/**
 * Utility function to format currency values
 */
export function formatCurrency(value: number, currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value);
}

/**
 * Utility function to format percentage values
 */
export function formatPercentage(value: number, decimals = 2): string {
  return `${(value * 100).toFixed(decimals)}%`;
}

/**
 * Utility function to format ratio values
 */
export function formatRatio(value: number, decimals = 2): string {
  return value.toFixed(decimals);
}