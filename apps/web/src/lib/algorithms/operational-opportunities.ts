import { BusinessMetrics, OperationalOpportunityPattern, OpportunityIdentificationResult } from '@/types/impact-analysis';

export const OPERATIONAL_OPPORTUNITY_PATTERNS: OperationalOpportunityPattern[] = [
  {
    pattern: 'process_automation',
    indicators: ['manual_data_entry', 'repetitive_tasks', 'high_error_rates'],
    typicalImpact: {
      efficiencyGain: 0.30,
      costReduction: 0.15,
      timeReduction: 0.40,
      qualityImprovement: 0.25
    },
    difficulty: 'medium',
    applicability: (metrics) => {
      return metrics.employeeCount > 10 ? 0.8 : 0.4;
    }
  },
  {
    pattern: 'supply_chain_optimization',
    indicators: ['high_inventory_costs', 'long_lead_times', 'supplier_concentration'],
    typicalImpact: {
      efficiencyGain: 0.20,
      costReduction: 0.12,
      timeReduction: 0.25,
      qualityImprovement: 0.15
    },
    difficulty: 'high',
    applicability: (metrics) => {
      // More applicable to companies with physical products
      const estimatedInventoryCost = metrics.expenses * 0.25;
      return estimatedInventoryCost > metrics.revenue * 0.15 ? 0.9 : 0.3;
    }
  },
  {
    pattern: 'workforce_optimization',
    indicators: ['skill_gaps', 'low_productivity', 'high_turnover'],
    typicalImpact: {
      efficiencyGain: 0.25,
      costReduction: 0.10,
      timeReduction: 0.20,
      qualityImprovement: 0.30
    },
    difficulty: 'medium',
    applicability: (metrics) => {
      return metrics.employeeCount > 25 ? 0.85 : 0.5;
    }
  },
  {
    pattern: 'quality_management_system',
    indicators: ['customer_complaints', 'rework_costs', 'compliance_issues'],
    typicalImpact: {
      efficiencyGain: 0.15,
      costReduction: 0.08,
      timeReduction: 0.10,
      qualityImprovement: 0.40
    },
    difficulty: 'medium',
    applicability: (metrics) => {
      // More critical for larger operations
      return metrics.employeeCount > 50 ? 0.8 : 0.6;
    }
  },
  {
    pattern: 'digital_transformation',
    indicators: ['legacy_systems', 'data_silos', 'manual_reporting'],
    typicalImpact: {
      efficiencyGain: 0.35,
      costReduction: 0.18,
      timeReduction: 0.50,
      qualityImprovement: 0.20
    },
    difficulty: 'very_high',
    applicability: (metrics) => {
      // More applicable to traditional industries and larger companies
      return metrics.employeeCount > 100 ? 0.9 : 0.7;
    }
  },
  {
    pattern: 'lean_operations',
    indicators: ['waste_in_processes', 'overproduction', 'excess_inventory'],
    typicalImpact: {
      efficiencyGain: 0.22,
      costReduction: 0.14,
      timeReduction: 0.30,
      qualityImprovement: 0.18
    },
    difficulty: 'medium',
    applicability: (metrics) => {
      // More applicable to manufacturing and service companies
      return metrics.employeeCount > 20 ? 0.75 : 0.4;
    }
  },
  {
    pattern: 'customer_service_optimization',
    indicators: ['long_response_times', 'low_satisfaction_scores', 'high_support_costs'],
    typicalImpact: {
      efficiencyGain: 0.28,
      costReduction: 0.12,
      timeReduction: 0.35,
      qualityImprovement: 0.45
    },
    difficulty: 'medium',
    applicability: (metrics) => {
      // More applicable to customer-facing businesses
      return metrics.customerCount > 100 ? 0.8 : 0.5;
    }
  },
  {
    pattern: 'data_analytics_implementation',
    indicators: ['poor_decision_making', 'lack_of_insights', 'reactive_management'],
    typicalImpact: {
      efficiencyGain: 0.20,
      costReduction: 0.10,
      timeReduction: 0.25,
      qualityImprovement: 0.35
    },
    difficulty: 'high',
    applicability: (metrics) => {
      // More valuable for data-rich businesses
      return metrics.revenue > 1000000 ? 0.85 : 0.6;
    }
  }
];

export function identifyOperationalOpportunities(
  metrics: BusinessMetrics,
  industryData?: any
): OpportunityIdentificationResult {
  const opportunities = OPERATIONAL_OPPORTUNITY_PATTERNS.map(pattern => {
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
  }).filter(opp => opp.relevance > 0.3);

  // Sort by potential impact
  opportunities.sort((a, b) => b.estimatedImpact - a.estimatedImpact);

  return {
    category: 'operational',
    opportunities,
    overallScore: calculateOverallScore(opportunities),
    methodology: 'Operational efficiency pattern analysis with industry best practice benchmarking'
  };
}

function calculateConfidence(
  pattern: OperationalOpportunityPattern,
  metrics: BusinessMetrics,
  industryData?: any
): number {
  let baseConfidence = 0.75;
  
  // Adjust based on company size and data completeness
  if (metrics.employeeCount > 0) {
    baseConfidence += 0.05;
  }
  
  if (metrics.customerCount > 0) {
    baseConfidence += 0.05;
  }
  
  // Pattern-specific confidence adjustments
  switch (pattern.pattern) {
    case 'process_automation':
      if (metrics.employeeCount > 50) baseConfidence += 0.1;
      break;
    case 'supply_chain_optimization':
      if (metrics.expenses > metrics.revenue * 0.7) baseConfidence += 0.1;
      break;
    case 'digital_transformation':
      if (metrics.employeeCount > 100) baseConfidence += 0.1;
      break;
    case 'customer_service_optimization':
      if (metrics.customerCount > 1000) baseConfidence += 0.1;
      break;
  }
  
  return Math.min(baseConfidence, 0.95);
}

function calculateEstimatedImpact(
  pattern: OperationalOpportunityPattern,
  metrics: BusinessMetrics
): number {
  // Calculate impact based on cost savings and efficiency gains
  const costSavings = metrics.expenses * pattern.typicalImpact.costReduction;
  const efficiencyValue = (metrics.revenue / metrics.employeeCount) * pattern.typicalImpact.efficiencyGain;
  const qualityValue = metrics.revenue * 0.05 * pattern.typicalImpact.qualityImprovement; // Assume 5% revenue impact from quality
  
  // Implementation cost estimate (varies by difficulty)
  const difficultyMultiplier = {
    'low': 0.02,
    'medium': 0.05,
    'high': 0.10,
    'very_high': 0.20
  };
  
  const implementationCost = metrics.revenue * difficultyMultiplier[pattern.difficulty];
  
  return (costSavings + efficiencyValue + qualityValue - implementationCost);
}

function generateReasoning(
  pattern: OperationalOpportunityPattern,
  metrics: BusinessMetrics,
  relevance: number,
  confidence: number
): string[] {
  const reasoning: string[] = [];
  
  switch (pattern.pattern) {
    case 'process_automation':
      if (metrics.employeeCount > 50) {
        reasoning.push(`Company size of ${metrics.employeeCount} employees suggests significant automation potential`);
      }
      break;
    case 'supply_chain_optimization':
      if (metrics.expenses > metrics.revenue * 0.7) {
        reasoning.push('High expense ratio suggests supply chain inefficiencies');
      }
      break;
    case 'workforce_optimization':
      if (metrics.employeeCount > 25) {
        reasoning.push('Workforce size indicates potential for productivity improvements');
      }
      break;
    case 'digital_transformation':
      if (metrics.employeeCount > 100) {
        reasoning.push('Large organization likely has legacy systems requiring modernization');
      }
      break;
    case 'customer_service_optimization':
      if (metrics.customerCount > 1000) {
        reasoning.push(`Customer base of ${metrics.customerCount} suggests service optimization opportunities`);
      }
      break;
  }
  
  if (relevance > 0.8) {
    reasoning.push('High relevance based on operational complexity indicators');
  }
  
  if (confidence > 0.8) {
    reasoning.push('High confidence due to proven operational improvement patterns');
  }
  
  // Add difficulty-based reasoning
  const difficultyDescriptions = {
    'low': 'Low implementation difficulty enables quick wins',
    'medium': 'Moderate complexity with manageable implementation timeline',
    'high': 'Complex implementation requiring significant change management',
    'very_high': 'Strategic transformation requiring substantial investment and time'
  };
  
  reasoning.push(difficultyDescriptions[pattern.difficulty]);
  
  return reasoning;
}

function calculateOverallScore(opportunities: any[]): number {
  if (opportunities.length === 0) return 0;
  
  const weightedSum = opportunities.reduce((sum, opp) => {
    return sum + (opp.relevance * opp.confidence * (opp.estimatedImpact / 1000000)); // Normalize impact
  }, 0);
  
  return Math.min(weightedSum / opportunities.length, 1.0);
}