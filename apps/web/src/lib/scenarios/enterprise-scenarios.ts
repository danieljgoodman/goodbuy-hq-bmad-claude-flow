/**
 * Enterprise Scenario Modeling System
 * Story 11.5: Complex multi-scenario financial modeling
 */

import { type EnterpriseScenarioModel, type ScenarioConfiguration, type YearlyProjection } from '@/types/enterprise-evaluation';
import { prisma } from '@/lib/prisma';

/**
 * Default scenario assumptions
 */
const DEFAULT_ASSUMPTIONS = {
  baseCase: {
    revenueGrowthRate: 0.10, // 10% annual growth
    marginImprovement: 0.005, // 0.5% annual margin improvement
    capexPercentage: 0.05, // 5% of revenue
    workingCapitalChange: 0.02 // 2% of revenue
  },
  optimistic: {
    revenueGrowthRate: 0.20, // 20% annual growth
    marginImprovement: 0.010, // 1% annual margin improvement
    capexPercentage: 0.07, // 7% of revenue (investment for growth)
    workingCapitalChange: 0.03 // 3% of revenue
  },
  conservative: {
    revenueGrowthRate: 0.05, // 5% annual growth
    marginImprovement: 0.002, // 0.2% annual margin improvement
    capexPercentage: 0.03, // 3% of revenue (minimal investment)
    workingCapitalChange: 0.01 // 1% of revenue
  }
};

/**
 * Calculate projections for a single scenario
 */
export function calculateScenarioProjections(
  baseRevenue: number,
  baseGrossMargin: number,
  baseNetMargin: number,
  assumptions: typeof DEFAULT_ASSUMPTIONS.baseCase,
  years: number = 5
): YearlyProjection[] {
  const projections: YearlyProjection[] = [];
  let currentRevenue = baseRevenue;
  let currentGrossMargin = baseGrossMargin;
  let currentNetMargin = baseNetMargin;

  for (let year = 1; year <= years; year++) {
    // Calculate revenue growth
    currentRevenue = currentRevenue * (1 + assumptions.revenueGrowthRate);

    // Calculate margin improvements
    currentGrossMargin = Math.min(
      currentGrossMargin + assumptions.marginImprovement,
      0.75 // Cap at 75% gross margin
    );
    currentNetMargin = Math.min(
      currentNetMargin + (assumptions.marginImprovement * 0.6), // Net margin improves slower
      0.35 // Cap at 35% net margin
    );

    // Calculate cash flow components
    const grossProfit = currentRevenue * currentGrossMargin;
    const netIncome = currentRevenue * currentNetMargin;
    const capex = currentRevenue * assumptions.capexPercentage;
    const workingCapitalChange = currentRevenue * assumptions.workingCapitalChange;

    // Free cash flow = Net Income + Non-cash charges - Capex - WC change
    const cashFlow = netIncome - capex - workingCapitalChange;

    projections.push({
      year: new Date().getFullYear() + year,
      revenue: Math.round(currentRevenue),
      grossMargin: parseFloat((currentGrossMargin * 100).toFixed(2)),
      netMargin: parseFloat((currentNetMargin * 100).toFixed(2)),
      cashFlow: Math.round(cashFlow),
      capex: Math.round(capex)
    });
  }

  return projections;
}

/**
 * Calculate valuation for a scenario using DCF and multiples
 */
export function calculateScenarioValuation(
  projections: YearlyProjection[],
  industryMultiple: number = 3.5,
  discountRate: number = 0.12 // 12% WACC
): {
  dcfValue: number;
  multipleValue: number;
  assetValue: number;
} {
  // DCF Valuation
  let dcfValue = 0;
  projections.forEach((projection, index) => {
    const discountFactor = Math.pow(1 + discountRate, index + 1);
    dcfValue += projection.cashFlow / discountFactor;
  });

  // Terminal value (Gordon Growth Model with 3% perpetual growth)
  const terminalGrowth = 0.03;
  const lastCashFlow = projections[projections.length - 1].cashFlow;
  const terminalValue = (lastCashFlow * (1 + terminalGrowth)) / (discountRate - terminalGrowth);
  const discountedTerminalValue = terminalValue / Math.pow(1 + discountRate, projections.length);
  dcfValue += discountedTerminalValue;

  // Multiple-based valuation
  const lastRevenue = projections[projections.length - 1].revenue;
  const multipleValue = lastRevenue * industryMultiple;

  // Asset-based valuation (simplified)
  const assetValue = lastRevenue * 0.8; // Simplified asset value

  return {
    dcfValue: Math.round(dcfValue),
    multipleValue: Math.round(multipleValue),
    assetValue: Math.round(assetValue)
  };
}

/**
 * Calculate risk score for a scenario
 */
export function calculateRiskScore(
  assumptions: typeof DEFAULT_ASSUMPTIONS.baseCase,
  marketConditions: {
    competitionLevel: 'low' | 'medium' | 'high';
    marketMaturity: 'emerging' | 'growing' | 'mature';
    regulatoryRisk: 'low' | 'medium' | 'high';
  }
): number {
  let riskScore = 50; // Base risk score

  // Revenue growth risk
  if (assumptions.revenueGrowthRate > 0.15) {
    riskScore += 15; // High growth is riskier
  } else if (assumptions.revenueGrowthRate < 0.05) {
    riskScore += 10; // Low growth has execution risk
  }

  // Competition risk
  const competitionRisk = {
    low: 0,
    medium: 10,
    high: 20
  };
  riskScore += competitionRisk[marketConditions.competitionLevel];

  // Market maturity risk
  const maturityRisk = {
    emerging: 20,
    growing: 10,
    mature: 5
  };
  riskScore += maturityRisk[marketConditions.marketMaturity];

  // Regulatory risk
  const regRisk = {
    low: 0,
    medium: 10,
    high: 25
  };
  riskScore += regRisk[marketConditions.regulatoryRisk];

  return Math.min(100, Math.max(0, riskScore));
}

/**
 * Create full scenario model for enterprise evaluation
 */
export async function createEnterpriseScenarioModel(
  businessEvaluationId: string,
  baseFinancials: {
    revenue: number;
    grossMargin: number;
    netMargin: number;
  },
  marketConditions: {
    competitionLevel: 'low' | 'medium' | 'high';
    marketMaturity: 'emerging' | 'growing' | 'mature';
    regulatoryRisk: 'low' | 'medium' | 'high';
    industryMultiple: number;
  },
  customAssumptions?: Partial<typeof DEFAULT_ASSUMPTIONS>
): Promise<EnterpriseScenarioModel> {
  // Merge custom assumptions with defaults
  const assumptions = {
    baseCase: { ...DEFAULT_ASSUMPTIONS.baseCase, ...customAssumptions?.baseCase },
    optimistic: { ...DEFAULT_ASSUMPTIONS.optimistic, ...customAssumptions?.optimistic },
    conservative: { ...DEFAULT_ASSUMPTIONS.conservative, ...customAssumptions?.conservative }
  };

  // Calculate projections for each scenario
  const baseProjections = calculateScenarioProjections(
    baseFinancials.revenue,
    baseFinancials.grossMargin,
    baseFinancials.netMargin,
    assumptions.baseCase
  );

  const optimisticProjections = calculateScenarioProjections(
    baseFinancials.revenue,
    baseFinancials.grossMargin,
    baseFinancials.netMargin,
    assumptions.optimistic
  );

  const conservativeProjections = calculateScenarioProjections(
    baseFinancials.revenue,
    baseFinancials.grossMargin,
    baseFinancials.netMargin,
    assumptions.conservative
  );

  // Calculate valuations
  const baseValuation = calculateScenarioValuation(
    baseProjections,
    marketConditions.industryMultiple
  );

  const optimisticValuation = calculateScenarioValuation(
    optimisticProjections,
    marketConditions.industryMultiple * 1.2 // Higher multiple for growth scenario
  );

  const conservativeValuation = calculateScenarioValuation(
    conservativeProjections,
    marketConditions.industryMultiple * 0.8 // Lower multiple for conservative scenario
  );

  // Calculate risk scores
  const baseRisk = calculateRiskScore(assumptions.baseCase, marketConditions);
  const optimisticRisk = calculateRiskScore(assumptions.optimistic, marketConditions);
  const conservativeRisk = calculateRiskScore(assumptions.conservative, marketConditions);

  // Create scenario configurations
  const baseScenario: ScenarioConfiguration = {
    name: 'Base Case',
    assumptions: assumptions.baseCase,
    projections: baseProjections,
    valuation: baseValuation,
    riskScore: baseRisk,
    probabilityWeight: 0.50 // 50% probability
  };

  const optimisticScenario: ScenarioConfiguration = {
    name: 'Optimistic Case',
    assumptions: assumptions.optimistic,
    projections: optimisticProjections,
    valuation: optimisticValuation,
    riskScore: optimisticRisk,
    probabilityWeight: 0.25 // 25% probability
  };

  const conservativeScenario: ScenarioConfiguration = {
    name: 'Conservative Case',
    assumptions: assumptions.conservative,
    projections: conservativeProjections,
    valuation: conservativeValuation,
    riskScore: conservativeRisk,
    probabilityWeight: 0.25 // 25% probability
  };

  // Save to database
  const scenarioModel = await prisma.enterpriseScenarioModel.upsert({
    where: { businessEvaluationId },
    update: {
      baseScenario,
      optimisticScenario,
      conservativeScenario,
      customScenarios: [],
      lastUpdated: new Date(),
      calculationVersion: '1.0.0'
    },
    create: {
      businessEvaluationId,
      baseScenario,
      optimisticScenario,
      conservativeScenario,
      customScenarios: [],
      projectionHorizon: 5,
      calculationVersion: '1.0.0'
    }
  });

  return scenarioModel;
}

/**
 * Calculate weighted average valuation across scenarios
 */
export function calculateWeightedValuation(
  scenarios: ScenarioConfiguration[]
): {
  weightedDcf: number;
  weightedMultiple: number;
  weightedAsset: number;
  expectedValue: number;
} {
  let weightedDcf = 0;
  let weightedMultiple = 0;
  let weightedAsset = 0;

  scenarios.forEach(scenario => {
    weightedDcf += scenario.valuation.dcfValue * scenario.probabilityWeight;
    weightedMultiple += scenario.valuation.multipleValue * scenario.probabilityWeight;
    weightedAsset += scenario.valuation.assetValue * scenario.probabilityWeight;
  });

  // Expected value is average of the three methods
  const expectedValue = (weightedDcf + weightedMultiple + weightedAsset) / 3;

  return {
    weightedDcf: Math.round(weightedDcf),
    weightedMultiple: Math.round(weightedMultiple),
    weightedAsset: Math.round(weightedAsset),
    expectedValue: Math.round(expectedValue)
  };
}

/**
 * Perform sensitivity analysis on key variables
 */
export function performSensitivityAnalysis(
  baseCase: ScenarioConfiguration,
  variable: 'revenue' | 'margin' | 'multiple',
  range: number = 0.20 // +/- 20% range
): Array<{
  adjustment: number;
  value: number;
}> {
  const results = [];
  const steps = 5;
  const stepSize = (range * 2) / steps;

  for (let i = 0; i <= steps; i++) {
    const adjustment = -range + (i * stepSize);
    let adjustedValue = baseCase.valuation.dcfValue;

    switch (variable) {
      case 'revenue':
        // Adjust revenue growth rate
        const adjustedAssumptions = {
          ...baseCase.assumptions,
          revenueGrowthRate: baseCase.assumptions.revenueGrowthRate * (1 + adjustment)
        };
        const adjustedProjections = calculateScenarioProjections(
          baseCase.projections[0].revenue / (1 + baseCase.assumptions.revenueGrowthRate),
          baseCase.projections[0].grossMargin / 100,
          baseCase.projections[0].netMargin / 100,
          adjustedAssumptions
        );
        adjustedValue = calculateScenarioValuation(adjustedProjections).dcfValue;
        break;

      case 'margin':
        // Adjust margin improvement
        const marginAdjustedAssumptions = {
          ...baseCase.assumptions,
          marginImprovement: baseCase.assumptions.marginImprovement * (1 + adjustment)
        };
        const marginAdjustedProjections = calculateScenarioProjections(
          baseCase.projections[0].revenue / (1 + baseCase.assumptions.revenueGrowthRate),
          baseCase.projections[0].grossMargin / 100,
          baseCase.projections[0].netMargin / 100,
          marginAdjustedAssumptions
        );
        adjustedValue = calculateScenarioValuation(marginAdjustedProjections).dcfValue;
        break;

      case 'multiple':
        // Adjust industry multiple
        adjustedValue = baseCase.valuation.multipleValue * (1 + adjustment);
        break;
    }

    results.push({
      adjustment: adjustment * 100, // Convert to percentage
      value: Math.round(adjustedValue)
    });
  }

  return results;
}

/**
 * Compare scenarios to identify key value drivers
 */
export function identifyValueDrivers(
  baseCase: ScenarioConfiguration,
  optimisticCase: ScenarioConfiguration
): Array<{
  driver: string;
  impact: number;
  percentage: number;
}> {
  const baseValue = baseCase.valuation.dcfValue;
  const optimisticValue = optimisticCase.valuation.dcfValue;
  const totalImpact = optimisticValue - baseValue;

  const drivers = [];

  // Revenue growth impact
  const revenueImpact = (optimisticCase.assumptions.revenueGrowthRate - baseCase.assumptions.revenueGrowthRate) * baseValue * 5;
  drivers.push({
    driver: 'Revenue Growth',
    impact: Math.round(revenueImpact),
    percentage: (revenueImpact / totalImpact) * 100
  });

  // Margin improvement impact
  const marginImpact = (optimisticCase.assumptions.marginImprovement - baseCase.assumptions.marginImprovement) * baseValue * 10;
  drivers.push({
    driver: 'Margin Improvement',
    impact: Math.round(marginImpact),
    percentage: (marginImpact / totalImpact) * 100
  });

  // Working capital impact
  const wcImpact = (baseCase.assumptions.workingCapitalChange - optimisticCase.assumptions.workingCapitalChange) * baseValue * 2;
  drivers.push({
    driver: 'Working Capital Efficiency',
    impact: Math.round(wcImpact),
    percentage: (wcImpact / totalImpact) * 100
  });

  // Other factors
  const otherImpact = totalImpact - revenueImpact - marginImpact - wcImpact;
  drivers.push({
    driver: 'Other Factors',
    impact: Math.round(otherImpact),
    percentage: (otherImpact / totalImpact) * 100
  });

  return drivers.sort((a, b) => b.impact - a.impact);
}