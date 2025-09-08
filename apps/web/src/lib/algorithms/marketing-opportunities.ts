import { BusinessMetrics, MarketingOpportunityPattern, OpportunityIdentificationResult } from '@/types/impact-analysis';

export const MARKETING_OPPORTUNITY_PATTERNS: MarketingOpportunityPattern[] = [
  {
    pattern: 'digital_marketing_optimization',
    indicators: ['low_online_presence', 'poor_conversion_rates', 'limited_digital_channels'],
    typicalImpact: {
      customerAcquisition: 0.35,
      conversionImprovement: 0.25,
      brandValueIncrease: 0.20,
      marketShareGrowth: 0.15
    },
    difficulty: 'medium',
    applicability: (metrics) => {
      // More applicable to smaller companies with limited digital presence
      return metrics.customerCount < 10000 ? 0.85 : 0.6;
    }
  },
  {
    pattern: 'customer_retention_program',
    indicators: ['high_churn_rate', 'low_repeat_purchases', 'poor_customer_loyalty'],
    typicalImpact: {
      customerAcquisition: 0.10,
      conversionImprovement: 0.30,
      brandValueIncrease: 0.25,
      marketShareGrowth: 0.12
    },
    difficulty: 'medium',
    applicability: (metrics) => {
      // More valuable for businesses with established customer base
      return metrics.customerCount > 500 ? 0.9 : 0.4;
    }
  },
  {
    pattern: 'content_marketing_strategy',
    indicators: ['low_brand_awareness', 'limited_thought_leadership', 'poor_seo_performance'],
    typicalImpact: {
      customerAcquisition: 0.30,
      conversionImprovement: 0.20,
      brandValueIncrease: 0.40,
      marketShareGrowth: 0.18
    },
    difficulty: 'medium',
    applicability: (metrics) => {
      // Valuable across all business sizes but different approaches
      return 0.8;
    }
  },
  {
    pattern: 'customer_segmentation_personalization',
    indicators: ['one_size_fits_all_approach', 'poor_targeting', 'low_engagement_rates'],
    typicalImpact: {
      customerAcquisition: 0.25,
      conversionImprovement: 0.35,
      brandValueIncrease: 0.15,
      marketShareGrowth: 0.20
    },
    difficulty: 'high',
    applicability: (metrics) => {
      // More valuable with larger customer datasets
      return metrics.customerCount > 1000 ? 0.85 : 0.5;
    }
  },
  {
    pattern: 'social_media_marketing',
    indicators: ['limited_social_presence', 'low_engagement_rates', 'missed_viral_opportunities'],
    typicalImpact: {
      customerAcquisition: 0.40,
      conversionImprovement: 0.15,
      brandValueIncrease: 0.35,
      marketShareGrowth: 0.22
    },
    difficulty: 'low',
    applicability: (metrics) => {
      // More applicable to B2C and younger demographics
      return metrics.customerCount > 100 ? 0.8 : 0.6;
    }
  },
  {
    pattern: 'referral_program',
    indicators: ['low_word_of_mouth', 'high_acquisition_costs', 'satisfied_customers'],
    typicalImpact: {
      customerAcquisition: 0.50,
      conversionImprovement: 0.20,
      brandValueIncrease: 0.30,
      marketShareGrowth: 0.25
    },
    difficulty: 'low',
    applicability: (metrics) => {
      // Works well for businesses with happy customers
      return metrics.customerCount > 200 ? 0.9 : 0.5;
    }
  },
  {
    pattern: 'partnership_marketing',
    indicators: ['isolated_market_approach', 'limited_distribution', 'untapped_synergies'],
    typicalImpact: {
      customerAcquisition: 0.45,
      conversionImprovement: 0.25,
      brandValueIncrease: 0.20,
      marketShareGrowth: 0.35
    },
    difficulty: 'high',
    applicability: (metrics) => {
      // More valuable for established businesses
      return metrics.revenue > 1000000 ? 0.8 : 0.4;
    }
  },
  {
    pattern: 'marketing_automation',
    indicators: ['manual_marketing_processes', 'inconsistent_messaging', 'poor_lead_nurturing'],
    typicalImpact: {
      customerAcquisition: 0.20,
      conversionImprovement: 0.40,
      brandValueIncrease: 0.15,
      marketShareGrowth: 0.15
    },
    difficulty: 'medium',
    applicability: (metrics) => {
      // More valuable for companies with multiple marketing channels
      return metrics.employeeCount > 20 ? 0.85 : 0.5;
    }
  },
  {
    pattern: 'customer_experience_optimization',
    indicators: ['poor_customer_journey', 'friction_points', 'low_satisfaction_scores'],
    typicalImpact: {
      customerAcquisition: 0.15,
      conversionImprovement: 0.50,
      brandValueIncrease: 0.35,
      marketShareGrowth: 0.20
    },
    difficulty: 'high',
    applicability: (metrics) => {
      // Valuable across all business types
      return 0.85;
    }
  },
  {
    pattern: 'data_driven_marketing',
    indicators: ['gut_feeling_decisions', 'lack_of_analytics', 'poor_campaign_measurement'],
    typicalImpact: {
      customerAcquisition: 0.30,
      conversionImprovement: 0.35,
      brandValueIncrease: 0.20,
      marketShareGrowth: 0.25
    },
    difficulty: 'high',
    applicability: (metrics) => {
      // More valuable for companies with sufficient data volume
      return metrics.customerCount > 1000 ? 0.9 : 0.6;
    }
  }
];

export function identifyMarketingOpportunities(
  metrics: BusinessMetrics,
  industryData?: any
): OpportunityIdentificationResult {
  const opportunities = MARKETING_OPPORTUNITY_PATTERNS.map(pattern => {
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
    category: 'marketing',
    opportunities,
    overallScore: calculateOverallScore(opportunities),
    methodology: 'Marketing effectiveness pattern analysis with customer acquisition and retention focus'
  };
}

function calculateConfidence(
  pattern: MarketingOpportunityPattern,
  metrics: BusinessMetrics,
  industryData?: any
): number {
  let baseConfidence = 0.7;
  
  // Adjust based on customer data availability
  if (metrics.customerCount > 0) {
    baseConfidence += 0.1;
  }
  
  // Pattern-specific confidence adjustments
  switch (pattern.pattern) {
    case 'digital_marketing_optimization':
      if (metrics.customerCount < 5000) baseConfidence += 0.1;
      break;
    case 'customer_retention_program':
      if (metrics.customerCount > 500) baseConfidence += 0.1;
      break;
    case 'customer_segmentation_personalization':
      if (metrics.customerCount > 1000) baseConfidence += 0.1;
      break;
    case 'referral_program':
      if (metrics.customerCount > 200 && metrics.profit > 0) baseConfidence += 0.15;
      break;
    case 'data_driven_marketing':
      if (metrics.customerCount > 1000) baseConfidence += 0.1;
      break;
  }
  
  // Industry data availability boost
  if (industryData) {
    baseConfidence += 0.05;
  }
  
  return Math.min(baseConfidence, 0.95);
}

function calculateEstimatedImpact(
  pattern: MarketingOpportunityPattern,
  metrics: BusinessMetrics
): number {
  // Estimate customer lifetime value
  const avgRevenuePerCustomer = metrics.customerCount > 0 ? metrics.revenue / metrics.customerCount : 1000;
  
  // Calculate potential revenue increase from new customers
  const newCustomers = metrics.customerCount * pattern.typicalImpact.customerAcquisition;
  const newCustomerValue = newCustomers * avgRevenuePerCustomer;
  
  // Calculate revenue increase from conversion improvements
  const conversionValue = metrics.revenue * pattern.typicalImpact.conversionImprovement;
  
  // Calculate brand value impact (harder to quantify, use conservative estimate)
  const brandValue = metrics.revenue * 0.1 * pattern.typicalImpact.brandValueIncrease;
  
  // Implementation cost based on difficulty
  const difficultyMultiplier = {
    'low': 0.02,
    'medium': 0.05,
    'high': 0.10,
    'very_high': 0.20
  };
  
  const implementationCost = metrics.revenue * difficultyMultiplier[pattern.difficulty];
  
  return newCustomerValue + conversionValue + brandValue - implementationCost;
}

function generateReasoning(
  pattern: MarketingOpportunityPattern,
  metrics: BusinessMetrics,
  relevance: number,
  confidence: number
): string[] {
  const reasoning: string[] = [];
  
  switch (pattern.pattern) {
    case 'digital_marketing_optimization':
      if (metrics.customerCount < 10000) {
        reasoning.push('Smaller customer base suggests significant digital growth potential');
      }
      break;
    case 'customer_retention_program':
      if (metrics.customerCount > 500) {
        reasoning.push(`Customer base of ${metrics.customerCount} provides retention program foundation`);
      }
      break;
    case 'customer_segmentation_personalization':
      if (metrics.customerCount > 1000) {
        reasoning.push('Large customer dataset enables effective segmentation strategies');
      }
      break;
    case 'referral_program':
      if (metrics.customerCount > 200) {
        reasoning.push('Established customer base provides referral program potential');
      }
      break;
    case 'partnership_marketing':
      if (metrics.revenue > 1000000) {
        reasoning.push('Revenue scale makes partnership opportunities more viable');
      }
      break;
    case 'data_driven_marketing':
      if (metrics.customerCount > 1000) {
        reasoning.push('Sufficient data volume enables advanced analytics implementation');
      }
      break;
  }
  
  // Add revenue potential reasoning
  const revenuePerCustomer = metrics.customerCount > 0 ? metrics.revenue / metrics.customerCount : 0;
  if (revenuePerCustomer > 0) {
    reasoning.push(`Average revenue per customer of $${revenuePerCustomer.toFixed(0)} supports marketing investment ROI`);
  }
  
  if (relevance > 0.8) {
    reasoning.push('High relevance based on business characteristics and market conditions');
  }
  
  if (confidence > 0.8) {
    reasoning.push('High confidence due to proven marketing pattern effectiveness');
  }
  
  // Add difficulty context
  const difficultyDescriptions = {
    'low': 'Low implementation barrier enables quick marketing wins',
    'medium': 'Moderate complexity with reasonable implementation timeline',
    'high': 'Strategic marketing initiative requiring dedicated resources',
    'very_high': 'Major marketing transformation requiring significant investment'
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