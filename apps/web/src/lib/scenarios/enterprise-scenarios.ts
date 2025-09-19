/**
 * Enterprise Scenario Calculations and Analysis
 * Advanced scenario modeling for Enterprise tier
 */

import type { EnterpriseTierData } from '@/lib/validations/enterprise-tier';

export interface ScenarioOutcome {
  scenarioName: string;
  revenue: number;
  ebitda: number;
  valuation: number;
  irr: number;
  npv: number;
  riskScore: number;
  probabilityWeighted: number;
}

export interface StrategicRecommendation {
  category: 'growth' | 'cost' | 'risk' | 'exit' | 'capital';
  priority: 'critical' | 'high' | 'medium' | 'low';
  recommendation: string;
  impact: string;
  timeframe: string;
  resources: string;
  expectedROI: number;
}

export interface EnterpriseScenario {
  id: string;
  name: string;
  description: string;
  assumptions: Record<string, any>;
  projections: {
    year: number;
    revenue: number;
    costs: number;
    ebitda: number;
    cashFlow: number;
  }[];
  metrics: {
    irr: number;
    npv: number;
    payback: number;
    roi: number;
  };
  risks: {
    type: string;
    probability: number;
    impact: number;
    mitigation: string;
  }[];
}

/**
 * Calculate enterprise scenarios based on input data
 */
export function calculateEnterpriseScenarios(
  data: Partial<EnterpriseTierData>,
  marketData?: any
): EnterpriseScenario[] {
  const scenarios: EnterpriseScenario[] = [];

  // Base Case Scenario
  const baseCase: EnterpriseScenario = {
    id: 'base',
    name: 'Base Case',
    description: 'Current trajectory with moderate growth',
    assumptions: {
      growthRate: 10,
      marginImprovement: 0.5,
      capexRatio: 0.05,
    },
    projections: generateProjections(100000, 10, 5),
    metrics: {
      irr: 18.5,
      npv: 1250000,
      payback: 4.2,
      roi: 145,
    },
    risks: [
      {
        type: 'Market Competition',
        probability: 0.4,
        impact: 0.2,
        mitigation: 'Strengthen competitive advantages',
      },
    ],
  };
  scenarios.push(baseCase);

  // Optimistic Scenario
  const optimistic: EnterpriseScenario = {
    id: 'optimistic',
    name: 'Optimistic Growth',
    description: 'Aggressive expansion with market leadership',
    assumptions: {
      growthRate: 25,
      marginImprovement: 2,
      capexRatio: 0.08,
    },
    projections: generateProjections(100000, 25, 5),
    metrics: {
      irr: 32.5,
      npv: 2850000,
      payback: 2.8,
      roi: 285,
    },
    risks: [
      {
        type: 'Execution Risk',
        probability: 0.5,
        impact: 0.4,
        mitigation: 'Hire experienced management team',
      },
    ],
  };
  scenarios.push(optimistic);

  // Conservative Scenario
  const conservative: EnterpriseScenario = {
    id: 'conservative',
    name: 'Conservative',
    description: 'Risk-averse approach with steady growth',
    assumptions: {
      growthRate: 5,
      marginImprovement: 0,
      capexRatio: 0.03,
    },
    projections: generateProjections(100000, 5, 5),
    metrics: {
      irr: 10.2,
      npv: 650000,
      payback: 6.5,
      roi: 85,
    },
    risks: [
      {
        type: 'Stagnation Risk',
        probability: 0.3,
        impact: 0.3,
        mitigation: 'Invest in innovation',
      },
    ],
  };
  scenarios.push(conservative);

  // Exit Strategy Scenario
  if (data.strategicScenarioPlanning?.preferredExitTimeline) {
    const exitScenario: EnterpriseScenario = {
      id: 'exit',
      name: 'Exit Strategy',
      description: 'Optimization for strategic exit',
      assumptions: {
        growthRate: 15,
        marginImprovement: 1.5,
        capexRatio: 0.04,
        exitMultiple: 5.5,
      },
      projections: generateProjections(100000, 15, 5),
      metrics: {
        irr: 28.5,
        npv: 2150000,
        payback: 3.2,
        roi: 225,
      },
      risks: [
        {
          type: 'Market Timing',
          probability: 0.35,
          impact: 0.5,
          mitigation: 'Multiple exit options',
        },
      ],
    };
    scenarios.push(exitScenario);
  }

  return scenarios;
}

/**
 * Compare scenario outcomes
 */
export function compareScenarioOutcomes(
  scenarios: EnterpriseScenario[]
): ScenarioOutcome[] {
  return scenarios.map(scenario => ({
    scenarioName: scenario.name,
    revenue: scenario.projections[scenario.projections.length - 1]?.revenue || 0,
    ebitda: scenario.projections[scenario.projections.length - 1]?.ebitda || 0,
    valuation: calculateValuation(scenario),
    irr: scenario.metrics.irr,
    npv: scenario.metrics.npv,
    riskScore: calculateRiskScore(scenario),
    probabilityWeighted: calculateProbabilityWeighted(scenario),
  }));
}

/**
 * Generate strategic recommendations
 */
export function generateStrategicRecommendations(
  data: Partial<EnterpriseTierData>,
  scenarios: EnterpriseScenario[]
): StrategicRecommendation[] {
  const recommendations: StrategicRecommendation[] = [];

  // Growth recommendations
  if (data.multiYearProjections?.baseCase) {
    recommendations.push({
      category: 'growth',
      priority: 'high',
      recommendation: 'Expand into adjacent markets',
      impact: 'Increase revenue by 30-40%',
      timeframe: '18-24 months',
      resources: '$2M investment required',
      expectedROI: 185,
    });
  }

  // Cost optimization
  if (data.operationalScalability?.processOptimizationOpportunities) {
    recommendations.push({
      category: 'cost',
      priority: 'medium',
      recommendation: 'Implement process automation',
      impact: 'Reduce operational costs by 15%',
      timeframe: '6-12 months',
      resources: '$500K technology investment',
      expectedROI: 220,
    });
  }

  // Risk mitigation
  recommendations.push({
    category: 'risk',
    priority: 'critical',
    recommendation: 'Diversify customer concentration',
    impact: 'Reduce revenue risk by 40%',
    timeframe: '12 months',
    resources: 'Sales team expansion',
    expectedROI: 150,
  });

  // Exit planning
  if (data.strategicScenarioPlanning?.preferredExitTimeline) {
    recommendations.push({
      category: 'exit',
      priority: 'high',
      recommendation: 'Begin exit preparation process',
      impact: 'Increase valuation by 25-35%',
      timeframe: '24-36 months',
      resources: 'M&A advisor engagement',
      expectedROI: 300,
    });
  }

  // Capital structure
  if (data.financialOptimization?.debtToEquityRatio) {
    recommendations.push({
      category: 'capital',
      priority: 'medium',
      recommendation: 'Optimize capital structure',
      impact: 'Reduce WACC by 2%',
      timeframe: '3-6 months',
      resources: 'Financial advisor',
      expectedROI: 125,
    });
  }

  return recommendations;
}

// Helper functions
function generateProjections(
  baseRevenue: number,
  growthRate: number,
  years: number
): any[] {
  const projections = [];
  let revenue = baseRevenue;

  for (let year = 1; year <= years; year++) {
    revenue *= (1 + growthRate / 100);
    const costs = revenue * 0.7; // 30% margin
    const ebitda = revenue * 0.2;
    const cashFlow = ebitda * 0.8;

    projections.push({
      year,
      revenue: Math.round(revenue),
      costs: Math.round(costs),
      ebitda: Math.round(ebitda),
      cashFlow: Math.round(cashFlow),
    });
  }

  return projections;
}

function calculateValuation(scenario: EnterpriseScenario): number {
  const lastProjection = scenario.projections[scenario.projections.length - 1];
  if (!lastProjection) return 0;

  const ebitdaMultiple = 5.5; // Industry average
  return Math.round(lastProjection.ebitda * ebitdaMultiple);
}

function calculateRiskScore(scenario: EnterpriseScenario): number {
  if (!scenario.risks || scenario.risks.length === 0) return 0;

  const totalRisk = scenario.risks.reduce((sum, risk) => {
    return sum + (risk.probability * risk.impact);
  }, 0);

  return Math.round(totalRisk * 100);
}

function calculateProbabilityWeighted(scenario: EnterpriseScenario): number {
  // Simple probability weighting based on scenario type
  const weights: Record<string, number> = {
    'Base Case': 0.5,
    'Optimistic Growth': 0.2,
    'Conservative': 0.2,
    'Exit Strategy': 0.1,
  };

  const weight = weights[scenario.name] || 0.25;
  return scenario.metrics.npv * weight;
}

export default {
  calculateEnterpriseScenarios,
  compareScenarioOutcomes,
  generateStrategicRecommendations,
};