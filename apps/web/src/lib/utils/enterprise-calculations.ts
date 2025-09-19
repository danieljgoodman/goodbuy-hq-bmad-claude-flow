import type {
  FinancialProjection,
  YearlyFinancials,
  SensitivityData,
  ConfidenceInterval,
  MultiScenarioProjectionData
} from '@/components/dashboard/enterprise/MultiScenarioProjections';

// Financial calculation utilities for enterprise projections

/**
 * Calculate compound annual growth rate (CAGR)
 */
export const calculateCAGR = (initialValue: number, finalValue: number, years: number): number => {
  if (initialValue <= 0 || finalValue <= 0 || years <= 0) return 0;
  return (Math.pow(finalValue / initialValue, 1 / years) - 1) * 100;
};

/**
 * Calculate enterprise valuation using multiple methods
 */
export const calculateValuation = (
  revenue: number,
  ebitda: number,
  cashFlow: number,
  industry: string = 'general'
): number => {
  // Industry-specific multiples
  const multiples = {
    technology: { revenue: 8.5, ebitda: 15.2, cashFlow: 12.8 },
    healthcare: { revenue: 4.2, ebitda: 12.5, cashFlow: 11.2 },
    manufacturing: { revenue: 2.1, ebitda: 8.5, cashFlow: 9.2 },
    services: { revenue: 3.2, ebitda: 10.1, cashFlow: 8.9 },
    general: { revenue: 3.5, ebitda: 10.0, cashFlow: 9.5 }
  };

  const industryMultiples = multiples[industry as keyof typeof multiples] || multiples.general;

  // Calculate valuations using different methods
  const revenueValuation = revenue * industryMultiples.revenue;
  const ebitdaValuation = ebitda * industryMultiples.ebitda;
  const cashFlowValuation = cashFlow * industryMultiples.cashFlow;

  // Weighted average valuation (EBITDA gets highest weight for mature businesses)
  const weightedValuation = (
    revenueValuation * 0.2 +
    ebitdaValuation * 0.5 +
    cashFlowValuation * 0.3
  );

  return Math.max(0, weightedValuation);
};

/**
 * Generate financial projections based on growth scenarios
 */
export const generateFinancialProjections = (
  baseYear: number,
  baseRevenue: number,
  baseEbitda: number,
  baseCashFlow: number,
  growthRates: {
    revenue: number[];
    ebitda: number[];
    cashFlow: number[];
  },
  industry: string = 'general'
): YearlyFinancials[] => {
  const projections: YearlyFinancials[] = [];

  let currentRevenue = baseRevenue;
  let currentEbitda = baseEbitda;
  let currentCashFlow = baseCashFlow;

  for (let i = 0; i < growthRates.revenue.length; i++) {
    const year = baseYear + i + 1;

    // Apply growth rates
    currentRevenue *= (1 + growthRates.revenue[i] / 100);
    currentEbitda *= (1 + growthRates.ebitda[i] / 100);
    currentCashFlow *= (1 + growthRates.cashFlow[i] / 100);

    // Calculate valuation
    const valuation = calculateValuation(currentRevenue, currentEbitda, currentCashFlow, industry);

    // Calculate derived metrics
    const revenueGrowthRate = growthRates.revenue[i];
    const ebitdaMargin = currentRevenue > 0 ? (currentEbitda / currentRevenue) * 100 : 0;

    projections.push({
      year,
      revenue: Math.round(currentRevenue),
      ebitda: Math.round(currentEbitda),
      cashFlow: Math.round(currentCashFlow),
      valuation: Math.round(valuation),
      growthRate: revenueGrowthRate,
      margin: ebitdaMargin
    });
  }

  return projections;
};

/**
 * Create scenario projections (base, optimistic, conservative)
 */
export const createScenarioProjections = (
  baseFinancials: {
    revenue: number;
    ebitda: number;
    cashFlow: number;
    year: number;
  },
  industry: string = 'general'
): {
  baseCase: FinancialProjection;
  optimisticCase: FinancialProjection;
  conservativeCase: FinancialProjection;
} => {
  // Base case growth rates (moderate growth)
  const baseGrowthRates = {
    revenue: [8, 12, 15, 12, 10],
    ebitda: [10, 15, 18, 15, 12],
    cashFlow: [12, 18, 20, 18, 15]
  };

  // Optimistic case (aggressive growth)
  const optimisticGrowthRates = {
    revenue: [15, 25, 30, 25, 20],
    ebitda: [20, 30, 35, 30, 25],
    cashFlow: [25, 35, 40, 35, 30]
  };

  // Conservative case (modest growth)
  const conservativeGrowthRates = {
    revenue: [3, 5, 7, 5, 4],
    ebitda: [5, 7, 10, 7, 6],
    cashFlow: [6, 8, 12, 8, 7]
  };

  const baseCase: FinancialProjection = {
    scenarioName: 'Base Case',
    projections: generateFinancialProjections(
      baseFinancials.year,
      baseFinancials.revenue,
      baseFinancials.ebitda,
      baseFinancials.cashFlow,
      baseGrowthRates,
      industry
    ),
    assumptions: [
      { category: 'Market', description: 'Steady market growth', value: '8-15%', confidence: 'medium' },
      { category: 'Competition', description: 'Moderate competitive pressure', value: 'Medium', confidence: 'medium' },
      { category: 'Operations', description: 'Operational improvements', value: '2-3% margin expansion', confidence: 'high' }
    ],
    keyDrivers: [
      { name: 'Market Expansion', impact: 'high', description: 'Geographic expansion', currentValue: 100, projectedValue: 250 },
      { name: 'Operational Efficiency', impact: 'medium', description: 'Process optimization', currentValue: 100, projectedValue: 180 },
      { name: 'Product Innovation', impact: 'medium', description: 'New product lines', currentValue: 100, projectedValue: 200 }
    ],
    riskFactors: [
      { category: 'Market', description: 'Economic downturn', probability: 30, impact: 'high' },
      { category: 'Competition', description: 'New market entrants', probability: 40, impact: 'medium' },
      { category: 'Operations', description: 'Key person dependency', probability: 25, impact: 'medium' }
    ],
    confidence: 75,
    probability: 60
  };

  const optimisticCase: FinancialProjection = {
    scenarioName: 'Optimistic Case',
    projections: generateFinancialProjections(
      baseFinancials.year,
      baseFinancials.revenue,
      baseFinancials.ebitda,
      baseFinancials.cashFlow,
      optimisticGrowthRates,
      industry
    ),
    assumptions: [
      { category: 'Market', description: 'Strong market tailwinds', value: '20-30%', confidence: 'medium' },
      { category: 'Competition', description: 'Market leadership achieved', value: 'Low pressure', confidence: 'low' },
      { category: 'Operations', description: 'Digital transformation success', value: '5-7% margin expansion', confidence: 'medium' }
    ],
    keyDrivers: [
      { name: 'Market Leadership', impact: 'critical', description: 'Dominant market position', currentValue: 100, projectedValue: 400 },
      { name: 'Technology Advantage', impact: 'high', description: 'Proprietary technology', currentValue: 100, projectedValue: 350 },
      { name: 'Strategic Acquisitions', impact: 'high', description: 'Successful M&A', currentValue: 100, projectedValue: 300 }
    ],
    riskFactors: [
      { category: 'Execution', description: 'Scaling challenges', probability: 35, impact: 'medium' },
      { category: 'Market', description: 'Overheated market correction', probability: 20, impact: 'high' }
    ],
    confidence: 60,
    probability: 25
  };

  const conservativeCase: FinancialProjection = {
    scenarioName: 'Conservative Case',
    projections: generateFinancialProjections(
      baseFinancials.year,
      baseFinancials.revenue,
      baseFinancials.ebitda,
      baseFinancials.cashFlow,
      conservativeGrowthRates,
      industry
    ),
    assumptions: [
      { category: 'Market', description: 'Slow market growth', value: '3-7%', confidence: 'high' },
      { category: 'Competition', description: 'Intense competitive pressure', value: 'High', confidence: 'high' },
      { category: 'Operations', description: 'Limited margin expansion', value: '0-1%', confidence: 'high' }
    ],
    keyDrivers: [
      { name: 'Cost Control', impact: 'high', description: 'Expense management', currentValue: 100, projectedValue: 120 },
      { name: 'Market Defense', impact: 'medium', description: 'Protecting market share', currentValue: 100, projectedValue: 110 },
      { name: 'Efficiency Gains', impact: 'medium', description: 'Incremental improvements', currentValue: 100, projectedValue: 130 }
    ],
    riskFactors: [
      { category: 'Market', description: 'Market contraction', probability: 45, impact: 'high' },
      { category: 'Competition', description: 'Price wars', probability: 50, impact: 'medium' },
      { category: 'Operations', description: 'Rising costs', probability: 60, impact: 'medium' }
    ],
    confidence: 85,
    probability: 70
  };

  return { baseCase, optimisticCase, conservativeCase };
};

/**
 * Generate sensitivity analysis data
 */
export const generateSensitivityAnalysis = (
  baseProjections: YearlyFinancials[]
): SensitivityData => {
  return {
    variables: [
      {
        name: 'Revenue Growth Rate',
        baseValue: 12,
        variations: { pessimistic: 5, optimistic: 25 }
      },
      {
        name: 'EBITDA Margin',
        baseValue: 20,
        variations: { pessimistic: 15, optimistic: 30 }
      },
      {
        name: 'Market Multiple',
        baseValue: 10,
        variations: { pessimistic: 7, optimistic: 15 }
      },
      {
        name: 'Customer Retention',
        baseValue: 90,
        variations: { pessimistic: 80, optimistic: 95 }
      }
    ],
    scenarios: [
      {
        name: 'Economic Downturn',
        impacts: { revenue: -25, ebitda: -35, valuation: -40 }
      },
      {
        name: 'Market Expansion',
        impacts: { revenue: 30, ebitda: 25, valuation: 35 }
      },
      {
        name: 'Operational Excellence',
        impacts: { revenue: 10, ebitda: 20, valuation: 25 }
      },
      {
        name: 'Competitive Pressure',
        impacts: { revenue: -15, ebitda: -20, valuation: -25 }
      },
      {
        name: 'Technology Disruption',
        impacts: { revenue: -30, ebitda: -25, valuation: -35 }
      }
    ]
  };
};

/**
 * Generate confidence intervals for projections
 */
export const generateConfidenceIntervals = (
  projections: YearlyFinancials[],
  confidenceLevel: number = 0.8
): ConfidenceInterval[] => {
  const intervals: ConfidenceInterval[] = [];
  const metrics: ('revenue' | 'ebitda' | 'cashflow' | 'valuation')[] = ['revenue', 'ebitda', 'cashflow', 'valuation'];

  projections.forEach(projection => {
    metrics.forEach(metric => {
      const baseValue = projection[metric === 'cashflow' ? 'cashFlow' : metric];

      // Confidence intervals widen over time
      const yearDelta = projection.year - projections[0].year + 1;
      const uncertainty = Math.min(0.4, 0.1 * yearDelta); // Max 40% uncertainty

      const range = baseValue * uncertainty * (1 - confidenceLevel);

      intervals.push({
        metric,
        year: projection.year,
        lower: Math.max(0, baseValue - range),
        upper: baseValue + range,
        mean: baseValue
      });
    });
  });

  return intervals;
};

/**
 * Create sample multi-scenario projection data for testing/demo
 */
export const createSampleProjectionData = (): MultiScenarioProjectionData => {
  const baseFinancials = {
    revenue: 5000000, // $5M
    ebitda: 1000000,  // $1M
    cashFlow: 800000, // $800K
    year: new Date().getFullYear()
  };

  const scenarios = createScenarioProjections(baseFinancials, 'technology');

  // Add a custom scenario
  const customScenario: FinancialProjection = {
    scenarioName: 'Acquisition Strategy',
    projections: generateFinancialProjections(
      baseFinancials.year,
      baseFinancials.revenue,
      baseFinancials.ebitda,
      baseFinancials.cashFlow,
      {
        revenue: [20, 35, 25, 20, 15],
        ebitda: [25, 40, 30, 25, 20],
        cashFlow: [30, 45, 35, 30, 25]
      },
      'technology'
    ),
    assumptions: [
      { category: 'Strategy', description: 'Strategic acquisitions', value: '2-3 targets', confidence: 'medium' },
      { category: 'Integration', description: 'Successful integration', value: '18 months', confidence: 'medium' },
      { category: 'Synergies', description: 'Revenue and cost synergies', value: '15-25%', confidence: 'low' }
    ],
    keyDrivers: [
      { name: 'Acquisition Targets', impact: 'critical', description: 'Strategic acquisitions', currentValue: 100, projectedValue: 500 },
      { name: 'Integration Success', impact: 'high', description: 'Smooth integration', currentValue: 100, projectedValue: 300 },
      { name: 'Synergy Realization', impact: 'high', description: 'Cost and revenue synergies', currentValue: 100, projectedValue: 250 }
    ],
    riskFactors: [
      { category: 'Execution', description: 'Integration failures', probability: 40, impact: 'critical' },
      { category: 'Market', description: 'Target valuation inflation', probability: 60, impact: 'high' },
      { category: 'Cultural', description: 'Cultural integration challenges', probability: 35, impact: 'medium' }
    ],
    confidence: 50,
    probability: 30
  };

  return {
    baseCase: scenarios.baseCase,
    optimisticCase: scenarios.optimisticCase,
    conservativeCase: scenarios.conservativeCase,
    customScenarios: [customScenario],
    sensitivityAnalysis: generateSensitivityAnalysis(scenarios.baseCase.projections),
    confidenceIntervals: generateConfidenceIntervals(scenarios.baseCase.projections)
  };
};

/**
 * Validate projection data
 */
export const validateProjectionData = (data: MultiScenarioProjectionData): {
  valid: boolean;
  errors: string[];
} => {
  const errors: string[] = [];

  // Check that all required scenarios exist
  if (!data.baseCase) errors.push('Base case scenario is required');
  if (!data.optimisticCase) errors.push('Optimistic case scenario is required');
  if (!data.conservativeCase) errors.push('Conservative case scenario is required');

  // Check that projections have consistent years
  const allScenarios = [data.baseCase, data.optimisticCase, data.conservativeCase, ...data.customScenarios];
  const baseYears = data.baseCase?.projections.map(p => p.year) || [];

  allScenarios.forEach((scenario, index) => {
    if (!scenario) return;

    const scenarioYears = scenario.projections.map(p => p.year);
    if (JSON.stringify(scenarioYears) !== JSON.stringify(baseYears)) {
      errors.push(`Scenario ${index} has mismatched projection years`);
    }

    // Check for negative values
    scenario.projections.forEach((projection, yearIndex) => {
      if (projection.revenue < 0) errors.push(`Negative revenue in scenario ${index}, year ${yearIndex}`);
      if (projection.ebitda < -projection.revenue) errors.push(`EBITDA too negative in scenario ${index}, year ${yearIndex}`);
    });
  });

  return {
    valid: errors.length === 0,
    errors
  };
};

// Export helper functions for formatting
export const formatters = {
  currency: (value: number): string =>
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value),

  percentage: (value: number): string => `${value.toFixed(1)}%`,

  compactCurrency: (value: number): string => {
    if (value >= 1e9) return `$${(value / 1e9).toFixed(1)}B`;
    if (value >= 1e6) return `$${(value / 1e6).toFixed(1)}M`;
    if (value >= 1e3) return `$${(value / 1e3).toFixed(1)}K`;
    return `$${value.toFixed(0)}`;
  }
};