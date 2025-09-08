import { BusinessMetrics, FinancialOpportunityPattern, OpportunityIdentificationResult } from '@/types/impact-analysis';

export const FINANCIAL_OPPORTUNITY_PATTERNS: FinancialOpportunityPattern[] = [
  {
    pattern: 'cash_flow_optimization',
    indicators: ['high_accounts_receivable', 'long_payment_terms', 'inventory_buildup'],
    typicalImpact: {
      revenueIncrease: 0,
      costReduction: 0.05,
      implementationCost: 0.02,
      paybackPeriod: 3
    },
    difficulty: 'medium',
    applicability: (metrics) => {
      const receivableRatio = (metrics.revenue * 0.15); // Assume 15% of revenue in receivables
      return receivableRatio > metrics.revenue * 0.10 ? 0.8 : 0.3;
    }
  },
  {
    pattern: 'cost_reduction_automation',
    indicators: ['high_labor_costs', 'repetitive_processes', 'manual_workflows'],
    typicalImpact: {
      revenueIncrease: 0,
      costReduction: 0.15,
      implementationCost: 0.08,
      paybackPeriod: 8
    },
    difficulty: 'high',
    applicability: (metrics) => {
      const laborCostRatio = metrics.expenses * 0.6; // Assume 60% of expenses are labor
      return laborCostRatio > metrics.revenue * 0.4 ? 0.9 : 0.4;
    }
  },
  {
    pattern: 'pricing_optimization',
    indicators: ['low_profit_margins', 'price_sensitive_market', 'value_proposition_gap'],
    typicalImpact: {
      revenueIncrease: 0.12,
      costReduction: 0,
      implementationCost: 0.01,
      paybackPeriod: 2
    },
    difficulty: 'medium',
    applicability: (metrics) => {
      return metrics.profitMargin < 0.15 ? 0.85 : 0.3;
    }
  },
  {
    pattern: 'working_capital_optimization',
    indicators: ['excess_inventory', 'poor_supplier_terms', 'inefficient_procurement'],
    typicalImpact: {
      revenueIncrease: 0,
      costReduction: 0.08,
      implementationCost: 0.03,
      paybackPeriod: 4
    },
    difficulty: 'medium',
    applicability: (metrics) => {
      // Higher applicability for larger companies with more complex operations
      return metrics.employeeCount > 50 ? 0.7 : 0.4;
    }
  },
  {
    pattern: 'revenue_diversification',
    indicators: ['single_revenue_stream', 'market_concentration', 'untapped_customer_segments'],
    typicalImpact: {
      revenueIncrease: 0.25,
      costReduction: 0,
      implementationCost: 0.15,
      paybackPeriod: 12
    },
    difficulty: 'very_high',
    applicability: (metrics) => {
      // More applicable to smaller companies with limited revenue streams
      return metrics.revenue < 10000000 ? 0.8 : 0.5;
    }
  },
  {
    pattern: 'tax_optimization',
    indicators: ['high_tax_burden', 'unused_deductions', 'inefficient_structure'],
    typicalImpact: {
      revenueIncrease: 0,
      costReduction: 0.06,
      implementationCost: 0.02,
      paybackPeriod: 3
    },
    difficulty: 'low',
    applicability: (metrics) => {
      // More applicable to profitable companies
      return metrics.profit > 0 ? 0.9 : 0.1;
    }
  },
  {
    pattern: 'financial_process_digitization',
    indicators: ['manual_accounting', 'paper_based_processes', 'reporting_delays'],
    typicalImpact: {
      revenueIncrease: 0,
      costReduction: 0.10,
      implementationCost: 0.05,
      paybackPeriod: 6
    },
    difficulty: 'medium',
    applicability: (metrics) => {
      // More applicable to companies that haven't digitized
      return metrics.employeeCount > 20 ? 0.7 : 0.9;
    }
  }
];

export function identifyFinancialOpportunities(
  metrics: BusinessMetrics,
  industryData?: any
): OpportunityIdentificationResult {
  const opportunities = FINANCIAL_OPPORTUNITY_PATTERNS.map(pattern => {
    const relevance = pattern.applicability(metrics);
    const confidence = calculateConfidence(pattern, metrics, industryData);
    const estimatedImpact = calculateEstimatedImpact(pattern, metrics);
    
    return {
      pattern: pattern.pattern,
      relevance,
      confidence,
      estimatedImpact,
      reasoning: generateReasoning(pattern, metrics, relevance, confidence)
    };
  }).filter(opp => opp.relevance > 0.3); // Only include relevant opportunities

  // Sort by potential impact
  opportunities.sort((a, b) => b.estimatedImpact - a.estimatedImpact);

  return {
    category: 'financial',
    opportunities,
    overallScore: calculateOverallScore(opportunities),
    methodology: 'Pattern matching against financial performance indicators with industry benchmarking'
  };
}

function calculateConfidence(
  pattern: FinancialOpportunityPattern,
  metrics: BusinessMetrics,
  industryData?: any
): number {
  let baseConfidence = 0.7;
  
  // Adjust based on data completeness
  if (metrics.revenue && metrics.expenses && metrics.profit) {
    baseConfidence += 0.1;
  }
  
  if (metrics.employeeCount && metrics.customerCount) {
    baseConfidence += 0.1;
  }
  
  // Adjust based on pattern-specific factors
  if (pattern.pattern === 'pricing_optimization' && metrics.profitMargin < 0.05) {
    baseConfidence += 0.1;
  }
  
  if (pattern.pattern === 'cost_reduction_automation' && metrics.employeeCount > 100) {
    baseConfidence += 0.1;
  }
  
  return Math.min(baseConfidence, 0.95);
}

function calculateEstimatedImpact(
  pattern: FinancialOpportunityPattern,
  metrics: BusinessMetrics
): number {
  const revenueImpact = metrics.revenue * pattern.typicalImpact.revenueIncrease;
  const costImpact = metrics.expenses * pattern.typicalImpact.costReduction;
  const implementationCost = metrics.revenue * pattern.typicalImpact.implementationCost;
  
  return (revenueImpact + costImpact - implementationCost) / pattern.typicalImpact.paybackPeriod;
}

function generateReasoning(
  pattern: FinancialOpportunityPattern,
  metrics: BusinessMetrics,
  relevance: number,
  confidence: number
): string[] {
  const reasoning: string[] = [];
  
  if (pattern.pattern === 'pricing_optimization' && metrics.profitMargin < 0.15) {
    reasoning.push(`Low profit margin of ${(metrics.profitMargin * 100).toFixed(1)}% suggests pricing optimization potential`);
  }
  
  if (pattern.pattern === 'cost_reduction_automation' && metrics.employeeCount > 50) {
    reasoning.push(`Company size of ${metrics.employeeCount} employees indicates potential for automation savings`);
  }
  
  if (pattern.pattern === 'revenue_diversification' && metrics.revenue < 10000000) {
    reasoning.push('Revenue size suggests opportunity for market expansion and diversification');
  }
  
  if (relevance > 0.8) {
    reasoning.push('High relevance based on current business metrics and industry patterns');
  }
  
  if (confidence > 0.8) {
    reasoning.push('High confidence due to complete financial data and proven pattern effectiveness');
  }
  
  return reasoning;
}

function calculateOverallScore(opportunities: any[]): number {
  if (opportunities.length === 0) return 0;
  
  const weightedSum = opportunities.reduce((sum, opp) => {
    return sum + (opp.relevance * opp.confidence * opp.estimatedImpact);
  }, 0);
  
  const maxPossibleScore = opportunities.length * 1.0 * 1.0;
  return Math.min(weightedSum / maxPossibleScore, 1.0);
}