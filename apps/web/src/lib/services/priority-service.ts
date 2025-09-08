import { 
  PriorityMatrix, 
  PriorityCalculationCriteria, 
  PriorityScore, 
  ImprovementOpportunity, 
  OpportunityRanking, 
  ImplementationSequence, 
  PriorityTier 
} from '@/types/opportunities';
import { BusinessMetrics } from '@/types/impact-analysis';

export interface PriorityAnalysisResults {
  matrix: PriorityMatrix;
  rankings: OpportunityRanking[];
  tiers: PriorityTier[];
  sequence: ImplementationSequence[];
  recommendations: string[];
  totalValue: number;
}

export class PriorityService {
  
  async calculatePriorityMatrix(
    evaluationId: string,
    opportunities: ImprovementOpportunity[],
    businessMetrics: BusinessMetrics,
    customCriteria?: Partial<PriorityCalculationCriteria>
  ): Promise<PriorityAnalysisResults> {
    
    // Create default criteria or merge with custom
    const criteria = this.createDefaultCriteria(businessMetrics, customCriteria);
    
    // Calculate scores for each opportunity
    const rankings = opportunities.map(opportunity => 
      this.calculateOpportunityRanking(opportunity, criteria, businessMetrics)
    );
    
    // Sort by total score (highest first)
    rankings.sort((a, b) => b.score - a.score);
    
    // Assign ranks
    rankings.forEach((ranking, index) => {
      ranking.rank = index + 1;
    });
    
    // Create priority tiers
    const tiers = this.createPriorityTiers(rankings, opportunities);
    
    // Generate implementation sequence
    const sequence = this.generateImplementationSequence(rankings, opportunities, businessMetrics);
    
    // Calculate total potential value
    const totalValue = this.calculateTotalPotentialValue(opportunities);
    
    // Generate recommendations
    const recommendations = this.generatePriorityRecommendations(rankings, tiers, sequence, businessMetrics);
    
    // Create priority matrix
    const matrix: PriorityMatrix = {
      id: `matrix_${evaluationId}_${Date.now()}`,
      evaluationId,
      opportunities: rankings,
      criteria: {
        impact: { weight: criteria.impact.weight, description: 'Financial and strategic impact potential' },
        effort: { weight: criteria.effort.weight, description: 'Implementation complexity and resource requirements' },
        timeline: { weight: criteria.timing.weight, description: 'Urgency and market timing factors' },
        risk: { weight: criteria.risk.weight, description: 'Implementation and market risks' },
        strategic: { weight: criteria.impact.metrics.strategicValue, description: 'Alignment with strategic objectives' }
      },
      methodology: 'Multi-criteria decision analysis with weighted scoring across impact, effort, timing, risk, and strategic alignment dimensions',
      recommendedSequence: sequence,
      totalPotentialValue: totalValue,
      priorityTiers: tiers,
      calculatedAt: new Date()
    };
    
    return {
      matrix,
      rankings,
      tiers,
      sequence,
      recommendations,
      totalValue
    };
  }
  
  private createDefaultCriteria(
    businessMetrics: BusinessMetrics,
    customCriteria?: Partial<PriorityCalculationCriteria>
  ): PriorityCalculationCriteria {
    
    // Adjust default weights based on business context
    let impactWeight = 0.35;
    let effortWeight = 0.25;
    let riskWeight = 0.20;
    let timingWeight = 0.20;
    
    // Adjust weights based on business characteristics
    if (businessMetrics.profit < 0) {
      // Cash-strapped businesses prioritize quick wins
      effortWeight += 0.05;
      timingWeight += 0.05;
      impactWeight -= 0.10;
    }
    
    if (businessMetrics.employeeCount < 25) {
      // Small businesses have limited implementation capacity
      effortWeight += 0.05;
      riskWeight += 0.05;
      impactWeight -= 0.10;
    }
    
    const defaultCriteria: PriorityCalculationCriteria = {
      impact: {
        weight: customCriteria?.impact?.weight ?? impactWeight,
        metrics: {
          revenueImpact: customCriteria?.impact?.metrics?.revenueImpact ?? 0.4,
          costImpact: customCriteria?.impact?.metrics?.costImpact ?? 0.3,
          strategicValue: customCriteria?.impact?.metrics?.strategicValue ?? 0.3
        }
      },
      effort: {
        weight: customCriteria?.effort?.weight ?? effortWeight,
        metrics: {
          complexity: customCriteria?.effort?.metrics?.complexity ?? 0.4,
          resourceRequirement: customCriteria?.effort?.metrics?.resourceRequirement ?? 0.35,
          timeRequirement: customCriteria?.effort?.metrics?.timeRequirement ?? 0.25
        }
      },
      risk: {
        weight: customCriteria?.risk?.weight ?? riskWeight,
        metrics: {
          implementationRisk: customCriteria?.risk?.metrics?.implementationRisk ?? 0.4,
          marketRisk: customCriteria?.risk?.metrics?.marketRisk ?? 0.35,
          financialRisk: customCriteria?.risk?.metrics?.financialRisk ?? 0.25
        }
      },
      timing: {
        weight: customCriteria?.timing?.weight ?? timingWeight,
        metrics: {
          urgency: customCriteria?.timing?.metrics?.urgency ?? 0.4,
          marketWindow: customCriteria?.timing?.metrics?.marketWindow ?? 0.3,
          competitiveThreat: customCriteria?.timing?.metrics?.competitiveThreat ?? 0.3
        }
      }
    };
    
    return defaultCriteria;
  }
  
  private calculateOpportunityRanking(
    opportunity: ImprovementOpportunity,
    criteria: PriorityCalculationCriteria,
    businessMetrics: BusinessMetrics
  ): OpportunityRanking {
    
    // Calculate impact score
    const impactScore = this.calculateImpactScore(opportunity, criteria.impact, businessMetrics);
    
    // Calculate effort score (lower effort = higher score)
    const effortScore = this.calculateEffortScore(opportunity, criteria.effort);
    
    // Calculate timing score
    const timelineScore = this.calculateTimingScore(opportunity, criteria.timing, businessMetrics);
    
    // Calculate risk score (lower risk = higher score)
    const riskScore = this.calculateRiskScore(opportunity, criteria.risk);
    
    // Calculate strategic score
    const strategicScore = this.calculateStrategicScore(opportunity, businessMetrics);
    
    // Calculate total weighted score
    const totalScore = (
      impactScore * criteria.impact.weight +
      effortScore * criteria.effort.weight +
      timelineScore * criteria.timing.weight +
      riskScore * criteria.risk.weight +
      strategicScore * 0.1 // Strategic alignment bonus
    );
    
    return {
      opportunityId: opportunity.id,
      rank: 0, // Will be assigned later
      score: totalScore,
      impactScore,
      effortScore,
      timelineScore,
      riskScore,
      strategicScore
    };
  }
  
  private calculateImpactScore(
    opportunity: ImprovementOpportunity,
    impactCriteria: PriorityCalculationCriteria['impact'],
    businessMetrics: BusinessMetrics
  ): number {
    const revenueImpact = opportunity.impactEstimate.revenueIncrease.amount;
    const costImpact = opportunity.impactEstimate.costReduction.amount;
    const totalImpact = revenueImpact + costImpact;
    
    // Normalize impact relative to business size
    const revenueNormalizedImpact = businessMetrics.revenue > 0 ? totalImpact / businessMetrics.revenue : 0;
    
    // Score components (0-100 scale)
    const revenueScore = Math.min(100, revenueNormalizedImpact * 500); // 20% of revenue = 100 points
    const absoluteScore = Math.min(100, totalImpact / 100000); // $100k = 100 points
    const roiScore = Math.min(100, opportunity.impactEstimate.roi.percentage * 2); // 50% ROI = 100 points
    
    // Weighted component score
    const componentScore = (
      revenueScore * impactCriteria.metrics.revenueImpact +
      absoluteScore * impactCriteria.metrics.costImpact +
      roiScore * impactCriteria.metrics.strategicValue
    );
    
    return Math.min(100, componentScore);
  }
  
  private calculateEffortScore(
    opportunity: ImprovementOpportunity,
    effortCriteria: PriorityCalculationCriteria['effort']
  ): number {
    // Convert difficulty to effort score (inverse relationship)
    const difficultyScores = {
      'low': 90,
      'medium': 70,
      'high': 45,
      'very_high': 20
    };
    
    const complexityScore = difficultyScores[opportunity.implementationRequirements.difficulty];
    
    // Resource requirement score (based on investment relative to typical amounts)
    const investmentAmount = opportunity.implementationRequirements.investmentRequired;
    const resourceScore = Math.max(20, 100 - (investmentAmount / 50000 * 20)); // $50k reduces by 20 points
    
    // Timeline score (shorter is better for effort)
    const timelineEstimate = opportunity.implementationRequirements.timelineEstimate;
    const timelineScore = this.parseTimelineToScore(timelineEstimate);
    
    // Weighted component score
    const componentScore = (
      complexityScore * effortCriteria.metrics.complexity +
      resourceScore * effortCriteria.metrics.resourceRequirement +
      timelineScore * effortCriteria.metrics.timeRequirement
    );
    
    return Math.min(100, componentScore);
  }
  
  private calculateTimingScore(
    opportunity: ImprovementOpportunity,
    timingCriteria: PriorityCalculationCriteria['timing'],
    businessMetrics: BusinessMetrics
  ): number {
    // Urgency based on business condition
    let urgencyScore = 50; // Base urgency
    
    if (businessMetrics.profit < 0) {
      urgencyScore += 30; // Cash flow issues increase urgency
    }
    
    if (opportunity.category === 'financial') {
      urgencyScore += 20; // Financial improvements often urgent
    }
    
    // Market window assessment
    let marketScore = 60; // Default market timing
    
    if (opportunity.marketTrends.some(trend => trend.includes('digital') || trend.includes('automation'))) {
      marketScore += 20; // Riding technology trends
    }
    
    if (opportunity.category === 'strategic') {
      marketScore += 15; // Strategic moves often time-sensitive
    }
    
    // Competitive threat assessment
    let competitiveScore = 50; // Default competitive pressure
    
    if (opportunity.category === 'marketing' || opportunity.category === 'strategic') {
      competitiveScore += 25; // Higher competitive relevance
    }
    
    // Normalize scores
    urgencyScore = Math.min(100, urgencyScore);
    marketScore = Math.min(100, marketScore);
    competitiveScore = Math.min(100, competitiveScore);
    
    // Weighted component score
    const componentScore = (
      urgencyScore * timingCriteria.metrics.urgency +
      marketScore * timingCriteria.metrics.marketWindow +
      competitiveScore * timingCriteria.metrics.competitiveThreat
    );
    
    return Math.min(100, componentScore);
  }
  
  private calculateRiskScore(
    opportunity: ImprovementOpportunity,
    riskCriteria: PriorityCalculationCriteria['risk']
  ): number {
    // Implementation risk (inverse of confidence)
    const implementationScore = opportunity.confidence * 100;
    
    // Market risk based on category and trends
    let marketScore = 70; // Base market stability
    
    if (opportunity.category === 'marketing') {
      marketScore -= 20; // Marketing outcomes more variable
    } else if (opportunity.category === 'strategic') {
      marketScore -= 15; // Strategic initiatives face market changes
    } else if (opportunity.category === 'financial') {
      marketScore += 10; // Financial improvements more predictable
    }
    
    // Financial risk based on investment size and ROI confidence
    const investmentRatio = opportunity.implementationRequirements.investmentRequired / 100000; // Normalize to $100k
    const financialScore = Math.max(30, 90 - (investmentRatio * 15)); // Higher investment = higher risk
    
    // Adjust for ROI confidence
    const roiConfidence = opportunity.impactEstimate.revenueIncrease.confidence;
    const adjustedFinancialScore = financialScore * roiConfidence;
    
    // Normalize scores
    const normalizedMarketScore = Math.max(0, Math.min(100, marketScore));
    const normalizedFinancialScore = Math.max(0, Math.min(100, adjustedFinancialScore));
    
    // Weighted component score
    const componentScore = (
      implementationScore * riskCriteria.metrics.implementationRisk +
      normalizedMarketScore * riskCriteria.metrics.marketRisk +
      normalizedFinancialScore * riskCriteria.metrics.financialRisk
    );
    
    return Math.min(100, componentScore);
  }
  
  private calculateStrategicScore(
    opportunity: ImprovementOpportunity,
    businessMetrics: BusinessMetrics
  ): number {
    let strategicScore = 50; // Base strategic value
    
    // Category-based strategic value
    if (opportunity.category === 'strategic') {
      strategicScore += 30;
    } else if (opportunity.category === 'operational') {
      strategicScore += 15;
    } else if (opportunity.category === 'financial') {
      strategicScore += 10;
    }
    
    // Industry relevance bonus
    strategicScore += opportunity.industryRelevance * 20;
    
    // Long-term vs short-term orientation
    const timelineEstimate = opportunity.implementationRequirements.timelineEstimate;
    if (timelineEstimate.includes('month') && !timelineEstimate.includes('12')) {
      strategicScore -= 10; // Short-term initiatives less strategic
    } else if (timelineEstimate.includes('year') || timelineEstimate.includes('18')) {
      strategicScore += 15; // Long-term initiatives more strategic
    }
    
    return Math.min(100, strategicScore);
  }
  
  private parseTimelineToScore(timeline: string): number {
    // Convert timeline string to effort score (shorter timeline = higher score)
    const lowerTimeline = timeline.toLowerCase();
    
    if (lowerTimeline.includes('week')) {
      return 90;
    } else if (lowerTimeline.includes('2-3 month') || lowerTimeline.includes('1-2 month')) {
      return 80;
    } else if (lowerTimeline.includes('3-6 month') || lowerTimeline.includes('4-8 month')) {
      return 60;
    } else if (lowerTimeline.includes('6-12 month') || lowerTimeline.includes('9-18 month')) {
      return 40;
    } else {
      return 30; // Very long timeline
    }
  }
  
  private createPriorityTiers(
    rankings: OpportunityRanking[],
    opportunities: ImprovementOpportunity[]
  ): PriorityTier[] {
    const tiers: PriorityTier[] = [];
    const totalOpportunities = rankings.length;
    
    // High priority: Top 30% or score > 75
    const highPriorityCount = Math.max(1, Math.ceil(totalOpportunities * 0.3));
    const highPriorityOpportunities = rankings
      .slice(0, highPriorityCount)
      .filter(r => r.score > 75);
    
    // Medium priority: Next 40% or score 50-75
    const mediumPriorityStart = highPriorityOpportunities.length;
    const mediumPriorityCount = Math.max(1, Math.ceil(totalOpportunities * 0.4));
    const mediumPriorityOpportunities = rankings
      .slice(mediumPriorityStart, mediumPriorityStart + mediumPriorityCount)
      .filter(r => r.score >= 50);
    
    // Low priority: Remaining opportunities or score < 50
    const lowPriorityOpportunities = rankings.filter(r => 
      !highPriorityOpportunities.includes(r) && !mediumPriorityOpportunities.includes(r)
    );
    
    // Calculate tier values
    const highValue = this.calculateTierValue(highPriorityOpportunities, opportunities);
    const mediumValue = this.calculateTierValue(mediumPriorityOpportunities, opportunities);
    const lowValue = this.calculateTierValue(lowPriorityOpportunities, opportunities);
    
    tiers.push({
      tier: 'high',
      opportunities: highPriorityOpportunities.map(r => r.opportunityId),
      totalValue: highValue,
      description: 'High-impact, low-effort opportunities with immediate implementation potential'
    });
    
    tiers.push({
      tier: 'medium',
      opportunities: mediumPriorityOpportunities.map(r => r.opportunityId),
      totalValue: mediumValue,
      description: 'Moderate-impact opportunities requiring balanced effort and timing considerations'
    });
    
    tiers.push({
      tier: 'low',
      opportunities: lowPriorityOpportunities.map(r => r.opportunityId),
      totalValue: lowValue,
      description: 'Lower-priority opportunities for future consideration or resource availability'
    });
    
    return tiers;
  }
  
  private calculateTierValue(
    tierRankings: OpportunityRanking[],
    allOpportunities: ImprovementOpportunity[]
  ): number {
    return tierRankings.reduce((sum, ranking) => {
      const opportunity = allOpportunities.find(opp => opp.id === ranking.opportunityId);
      if (opportunity) {
        return sum + opportunity.impactEstimate.revenueIncrease.amount + opportunity.impactEstimate.costReduction.amount;
      }
      return sum;
    }, 0);
  }
  
  private generateImplementationSequence(
    rankings: OpportunityRanking[],
    opportunities: ImprovementOpportunity[],
    businessMetrics: BusinessMetrics
  ): ImplementationSequence[] {
    const sequence: ImplementationSequence[] = [];
    const sortedOpportunities = rankings.map(r => 
      opportunities.find(opp => opp.id === r.opportunityId)!
    ).filter(Boolean);
    
    // Phase 1: Quick wins (high impact, low effort, short timeline)
    const quickWins = sortedOpportunities.filter(opp => 
      opp.implementationRequirements.difficulty === 'low' || 
      opp.implementationRequirements.difficulty === 'medium'
    ).slice(0, 3);
    
    if (quickWins.length > 0) {
      sequence.push({
        phase: 1,
        opportunities: quickWins.map(opp => opp.id),
        duration: '3-6 months',
        dependencies: [],
        expectedValue: quickWins.reduce((sum, opp) => sum + opp.impactEstimate.revenueIncrease.amount + opp.impactEstimate.costReduction.amount, 0)
      });
    }
    
    // Phase 2: Medium complexity initiatives
    const mediumComplexity = sortedOpportunities.filter(opp => 
      opp.implementationRequirements.difficulty === 'medium' || 
      opp.implementationRequirements.difficulty === 'high'
    ).filter(opp => !quickWins.includes(opp)).slice(0, 2);
    
    if (mediumComplexity.length > 0) {
      sequence.push({
        phase: 2,
        opportunities: mediumComplexity.map(opp => opp.id),
        duration: '6-12 months',
        dependencies: quickWins.map(opp => opp.id),
        expectedValue: mediumComplexity.reduce((sum, opp) => sum + opp.impactEstimate.revenueIncrease.amount + opp.impactEstimate.costReduction.amount, 0)
      });
    }
    
    // Phase 3: Strategic/complex initiatives
    const strategicInitiatives = sortedOpportunities.filter(opp => 
      opp.category === 'strategic' || 
      opp.implementationRequirements.difficulty === 'very_high'
    ).filter(opp => !quickWins.includes(opp) && !mediumComplexity.includes(opp)).slice(0, 2);
    
    if (strategicInitiatives.length > 0) {
      sequence.push({
        phase: 3,
        opportunities: strategicInitiatives.map(opp => opp.id),
        duration: '12-24 months',
        dependencies: [...quickWins.map(opp => opp.id), ...mediumComplexity.map(opp => opp.id)],
        expectedValue: strategicInitiatives.reduce((sum, opp) => sum + opp.impactEstimate.revenueIncrease.amount + opp.impactEstimate.costReduction.amount, 0)
      });
    }
    
    return sequence;
  }
  
  private calculateTotalPotentialValue(opportunities: ImprovementOpportunity[]): number {
    return opportunities.reduce((sum, opp) => 
      sum + opp.impactEstimate.revenueIncrease.amount + opp.impactEstimate.costReduction.amount, 0
    );
  }
  
  private generatePriorityRecommendations(
    rankings: OpportunityRanking[],
    tiers: PriorityTier[],
    sequence: ImplementationSequence[],
    businessMetrics: BusinessMetrics
  ): string[] {
    const recommendations: string[] = [];
    
    // Overall priority strategy
    const highTier = tiers.find(t => t.tier === 'high');
    if (highTier && highTier.opportunities.length > 0) {
      recommendations.push(`Focus on ${highTier.opportunities.length} high-priority opportunities with potential value of $${highTier.totalValue.toLocaleString()}`);
    }
    
    // Business condition-specific recommendations
    if (businessMetrics.profit < 0) {
      recommendations.push('Prioritize cash flow positive initiatives due to current financial constraints');
    } else if (businessMetrics.profitMargin < 0.1) {
      recommendations.push('Focus on profit margin improvement opportunities to strengthen financial position');
    }
    
    // Resource capacity recommendations
    if (businessMetrics.employeeCount < 25) {
      recommendations.push('Consider phased implementation due to limited organizational capacity');
    } else if (businessMetrics.employeeCount > 100) {
      recommendations.push('Leverage organizational scale to implement multiple opportunities in parallel');
    }
    
    // Sequencing recommendations
    if (sequence.length > 0) {
      recommendations.push(`Follow phased implementation approach starting with ${sequence[0].opportunities.length} quick-win opportunities`);
    }
    
    // Risk-based recommendations
    const highRiskOpportunities = rankings.filter(r => r.riskScore < 60).length;
    if (highRiskOpportunities > rankings.length * 0.3) {
      recommendations.push('Consider additional risk mitigation strategies given portfolio risk profile');
    }
    
    // Strategic alignment recommendations
    const strategicOpportunities = rankings.filter(r => r.strategicScore > 70).length;
    if (strategicOpportunities > 0) {
      recommendations.push(`${strategicOpportunities} opportunities offer strong strategic alignment for long-term value creation`);
    }
    
    return recommendations;
  }
}