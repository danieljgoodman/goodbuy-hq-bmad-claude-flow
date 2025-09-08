import { BusinessMetrics, StrategicOpportunityPattern, OpportunityIdentificationResult } from '@/types/impact-analysis';

export const STRATEGIC_OPPORTUNITY_PATTERNS: StrategicOpportunityPattern[] = [
  {
    pattern: 'market_expansion',
    indicators: ['single_market_focus', 'untapped_geographies', 'scalable_business_model'],
    typicalImpact: {
      competitiveAdvantage: 0.30,
      marketPosition: 0.40,
      longTermValue: 0.50,
      riskReduction: 0.20
    },
    difficulty: 'very_high',
    applicability: (metrics) => {
      // More applicable to successful businesses with growth potential
      return metrics.profit > 0 && metrics.revenue > 500000 ? 0.8 : 0.3;
    }
  },
  {
    pattern: 'vertical_integration',
    indicators: ['supplier_dependencies', 'margin_pressure', 'control_opportunities'],
    typicalImpact: {
      competitiveAdvantage: 0.40,
      marketPosition: 0.25,
      longTermValue: 0.35,
      riskReduction: 0.30
    },
    difficulty: 'very_high',
    applicability: (metrics) => {
      // More applicable to established businesses with scale
      return metrics.revenue > 5000000 && metrics.employeeCount > 50 ? 0.7 : 0.2;
    }
  },
  {
    pattern: 'digital_transformation',
    indicators: ['legacy_infrastructure', 'digital_disruption_risk', 'customer_expectations'],
    typicalImpact: {
      competitiveAdvantage: 0.45,
      marketPosition: 0.35,
      longTermValue: 0.60,
      riskReduction: 0.40
    },
    difficulty: 'high',
    applicability: (metrics) => {
      // Critical for traditional businesses
      return metrics.employeeCount > 25 ? 0.9 : 0.6;
    }
  },
  {
    pattern: 'innovation_program',
    indicators: ['stagnant_product_line', 'competitive_pressure', 'customer_needs_evolution'],
    typicalImpact: {
      competitiveAdvantage: 0.50,
      marketPosition: 0.30,
      longTermValue: 0.45,
      riskReduction: 0.25
    },
    difficulty: 'high',
    applicability: (metrics) => {
      // More valuable for established businesses
      return metrics.revenue > 1000000 ? 0.8 : 0.5;
    }
  },
  {
    pattern: 'strategic_partnerships',
    indicators: ['resource_constraints', 'complementary_capabilities', 'market_access_needs'],
    typicalImpact: {
      competitiveAdvantage: 0.35,
      marketPosition: 0.45,
      longTermValue: 0.40,
      riskReduction: 0.30
    },
    difficulty: 'medium',
    applicability: (metrics) => {
      // Valuable across business sizes
      return 0.75;
    }
  },
  {
    pattern: 'sustainability_initiative',
    indicators: ['environmental_impact', 'regulatory_pressure', 'consumer_demands'],
    typicalImpact: {
      competitiveAdvantage: 0.25,
      marketPosition: 0.30,
      longTermValue: 0.55,
      riskReduction: 0.35
    },
    difficulty: 'medium',
    applicability: (metrics) => {
      // More applicable to larger operations
      return metrics.employeeCount > 50 ? 0.8 : 0.5;
    }
  },
  {
    pattern: 'talent_strategy',
    indicators: ['skill_shortages', 'talent_competition', 'organizational_capabilities'],
    typicalImpact: {
      competitiveAdvantage: 0.40,
      marketPosition: 0.20,
      longTermValue: 0.50,
      riskReduction: 0.35
    },
    difficulty: 'medium',
    applicability: (metrics) => {
      // More critical for knowledge-based businesses
      return metrics.employeeCount > 10 ? 0.85 : 0.4;
    }
  },
  {
    pattern: 'risk_diversification',
    indicators: ['concentration_risk', 'single_points_of_failure', 'market_volatility'],
    typicalImpact: {
      competitiveAdvantage: 0.20,
      marketPosition: 0.15,
      longTermValue: 0.40,
      riskReduction: 0.60
    },
    difficulty: 'high',
    applicability: (metrics) => {
      // More important for businesses with concentrated risks
      return metrics.revenue > 1000000 ? 0.8 : 0.5;
    }
  },
  {
    pattern: 'ecosystem_development',
    indicators: ['platform_opportunities', 'network_effects', 'stakeholder_engagement'],
    typicalImpact: {
      competitiveAdvantage: 0.55,
      marketPosition: 0.50,
      longTermValue: 0.70,
      riskReduction: 0.25
    },
    difficulty: 'very_high',
    applicability: (metrics) => {
      // More applicable to larger businesses with platform potential
      return metrics.customerCount > 5000 && metrics.revenue > 5000000 ? 0.7 : 0.3;
    }
  },
  {
    pattern: 'organizational_agility',
    indicators: ['slow_decision_making', 'bureaucratic_processes', 'change_resistance'],
    typicalImpact: {
      competitiveAdvantage: 0.35,
      marketPosition: 0.25,
      longTermValue: 0.45,
      riskReduction: 0.40
    },
    difficulty: 'high',
    applicability: (metrics) => {
      // More critical for larger organizations
      return metrics.employeeCount > 50 ? 0.9 : 0.4;
    }
  }
];

export function identifyStrategicOpportunities(
  metrics: BusinessMetrics,
  industryData?: any
): OpportunityIdentificationResult {
  const opportunities = STRATEGIC_OPPORTUNITY_PATTERNS.map(pattern => {
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
    category: 'strategic',
    opportunities,
    overallScore: calculateOverallScore(opportunities),
    methodology: 'Strategic pattern analysis focused on long-term competitive advantage and risk mitigation'
  };
}

function calculateConfidence(
  pattern: StrategicOpportunityPattern,
  metrics: BusinessMetrics,
  industryData?: any
): number {
  let baseConfidence = 0.65; // Lower base confidence for strategic initiatives
  
  // Adjust based on business maturity indicators
  if (metrics.profit > 0) {
    baseConfidence += 0.1; // Profitable businesses have more strategic options
  }
  
  if (metrics.revenue > 1000000) {
    baseConfidence += 0.1; // Scale enables more strategic initiatives
  }
  
  // Pattern-specific confidence adjustments
  switch (pattern.pattern) {
    case 'market_expansion':
      if (metrics.profit > 0 && metrics.revenue > 1000000) baseConfidence += 0.1;
      break;
    case 'vertical_integration':
      if (metrics.revenue > 5000000) baseConfidence += 0.1;
      break;
    case 'digital_transformation':
      if (metrics.employeeCount > 50) baseConfidence += 0.1;
      break;
    case 'innovation_program':
      if (metrics.revenue > 2000000) baseConfidence += 0.1;
      break;
    case 'talent_strategy':
      if (metrics.employeeCount > 25) baseConfidence += 0.1;
      break;
    case 'organizational_agility':
      if (metrics.employeeCount > 100) baseConfidence += 0.1;
      break;
  }
  
  // Industry context boost
  if (industryData) {
    baseConfidence += 0.05;
  }
  
  return Math.min(baseConfidence, 0.9); // Cap strategic confidence lower than operational
}

function calculateEstimatedImpact(
  pattern: StrategicOpportunityPattern,
  metrics: BusinessMetrics
): number {
  // Strategic impact is harder to quantify but often has larger long-term effects
  const baseValue = metrics.revenue;
  
  // Calculate long-term value creation potential
  const longTermMultiplier = pattern.typicalImpact.longTermValue;
  const competitiveAdvantageMultiplier = pattern.typicalImpact.competitiveAdvantage;
  const marketPositionMultiplier = pattern.typicalImpact.marketPosition;
  const riskReductionValue = baseValue * 0.1 * pattern.typicalImpact.riskReduction;
  
  // Estimated strategic value (more speculative than operational improvements)
  const strategicValue = baseValue * (longTermMultiplier * 0.3 + competitiveAdvantageMultiplier * 0.2 + marketPositionMultiplier * 0.2);
  
  // Implementation cost based on difficulty (strategic initiatives are expensive)
  const difficultyMultiplier = {
    'low': 0.05,
    'medium': 0.10,
    'high': 0.20,
    'very_high': 0.35
  };
  
  const implementationCost = baseValue * difficultyMultiplier[pattern.difficulty];
  
  // Strategic initiatives have longer payback periods, so we discount the value
  const discountedValue = (strategicValue + riskReductionValue - implementationCost) * 0.6;
  
  return Math.max(discountedValue, 0); // Ensure non-negative impact
}

function generateReasoning(
  pattern: StrategicOpportunityPattern,
  metrics: BusinessMetrics,
  relevance: number,
  confidence: number
): string[] {
  const reasoning: string[] = [];
  
  switch (pattern.pattern) {
    case 'market_expansion':
      if (metrics.profit > 0 && metrics.revenue > 500000) {
        reasoning.push('Profitable operations provide foundation for geographic or market expansion');
      }
      break;
    case 'vertical_integration':
      if (metrics.revenue > 5000000) {
        reasoning.push('Revenue scale supports vertical integration opportunities');
      }
      break;
    case 'digital_transformation':
      if (metrics.employeeCount > 50) {
        reasoning.push('Organization size indicates need for digital infrastructure modernization');
      }
      break;
    case 'innovation_program':
      if (metrics.revenue > 1000000) {
        reasoning.push('Revenue base supports R&D investment for innovation initiatives');
      }
      break;
    case 'strategic_partnerships':
      reasoning.push('Partnerships can accelerate growth while sharing risks and resources');
      break;
    case 'sustainability_initiative':
      if (metrics.employeeCount > 50) {
        reasoning.push('Organization size creates sustainability impact and stakeholder expectations');
      }
      break;
    case 'talent_strategy':
      if (metrics.employeeCount > 25) {
        reasoning.push(`Workforce of ${metrics.employeeCount} employees requires strategic talent management`);
      }
      break;
    case 'risk_diversification':
      if (metrics.revenue > 1000000) {
        reasoning.push('Revenue concentration creates diversification opportunities');
      }
      break;
    case 'ecosystem_development':
      if (metrics.customerCount > 5000) {
        reasoning.push('Large customer base provides platform ecosystem foundation');
      }
      break;
    case 'organizational_agility':
      if (metrics.employeeCount > 100) {
        reasoning.push('Large organization typically faces agility challenges requiring strategic attention');
      }
      break;
  }
  
  // Add strategic context
  if (metrics.profit > 0) {
    reasoning.push('Profitable operations enable strategic investment and long-term planning');
  }
  
  if (relevance > 0.7) {
    reasoning.push('High strategic relevance based on business characteristics and market position');
  }
  
  if (confidence > 0.7) {
    reasoning.push('Strategic confidence supported by business maturity and implementation capacity');
  }
  
  // Add difficulty and timeline context
  const difficultyDescriptions = {
    'low': 'Low complexity strategic initiative with manageable implementation',
    'medium': 'Moderate strategic complexity requiring dedicated leadership attention',
    'high': 'Complex strategic transformation requiring significant organizational commitment',
    'very_high': 'Major strategic initiative requiring substantial resources and multi-year timeline'
  };
  
  reasoning.push(difficultyDescriptions[pattern.difficulty]);
  
  // Add long-term value context
  const longTermValue = pattern.typicalImpact.longTermValue;
  if (longTermValue > 0.5) {
    reasoning.push('High long-term value creation potential justifies strategic investment');
  } else if (longTermValue > 0.3) {
    reasoning.push('Moderate long-term value with strategic positioning benefits');
  }
  
  return reasoning;
}

function calculateOverallScore(opportunities: any[]): number {
  if (opportunities.length === 0) return 0;
  
  // Strategic opportunities are weighted differently - focus on long-term value
  const weightedSum = opportunities.reduce((sum, opp) => {
    const strategicWeight = opp.pattern.includes('innovation') || opp.pattern.includes('ecosystem') ? 1.2 : 1.0;
    return sum + (opp.relevance * opp.confidence * strategicWeight * (opp.estimatedImpact / 5000000)); // Higher normalization for strategic
  }, 0);
  
  return Math.min(weightedSum / opportunities.length, 1.0);
}