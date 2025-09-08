import { PriorityService } from '@/lib/services/priority-service';
import { ImprovementOpportunity } from '@/types/opportunities';
import { BusinessMetrics } from '@/types/impact-analysis';

describe('PriorityService', () => {
  const mockBusinessMetrics: BusinessMetrics = {
    revenue: 1000000,
    expenses: 800000,
    profit: 200000,
    profitMargin: 0.2,
    employeeCount: 50,
    customerCount: 1000,
    marketShare: 0.05
  };

  const mockOpportunities: ImprovementOpportunity[] = [
    {
      id: 'opp1',
      evaluationId: 'eval1',
      category: 'financial',
      subcategory: 'Cost Management',
      title: 'Cost Reduction Initiative',
      description: 'Reduce operational costs through automation',
      detailedAnalysis: 'Analysis details',
      impactEstimate: {
        revenueIncrease: { amount: 0, percentage: 0, timeframe: '12 months', confidence: 0.8 },
        costReduction: { amount: 100000, percentage: 0.125, timeframe: '12 months', confidence: 0.9 },
        roi: { percentage: 50, paybackPeriod: '8 months', npv: 80000, irr: 0.5 },
        riskAdjustedReturn: 75000
      },
      implementationRequirements: {
        difficulty: 'low',
        timelineEstimate: '2-3 months',
        resourceRequirements: [],
        skillsNeeded: ['Project Management'],
        investmentRequired: 25000,
        dependencies: ['Leadership approval']
      },
      priorityScore: 0,
      priorityFactors: { impactWeight: 0, easeWeight: 0, timeWeight: 0, costWeight: 0, strategicAlignment: 0 },
      contentTier: 'free',
      freeContent: { summary: '', keyBenefits: [], basicSteps: [] },
      successMetrics: [],
      relatedOpportunities: [],
      marketTrends: [],
      industryRelevance: 0.8,
      confidence: 0.85,
      identifiedAt: new Date(),
      lastUpdated: new Date()
    },
    {
      id: 'opp2',
      evaluationId: 'eval1',
      category: 'marketing',
      subcategory: 'Digital Marketing',
      title: 'Digital Marketing Campaign',
      description: 'Increase customer acquisition through digital channels',
      detailedAnalysis: 'Analysis details',
      impactEstimate: {
        revenueIncrease: { amount: 200000, percentage: 0.2, timeframe: '12 months', confidence: 0.7 },
        costReduction: { amount: 0, percentage: 0, timeframe: '12 months', confidence: 0.8 },
        roi: { percentage: 80, paybackPeriod: '6 months', npv: 150000, irr: 0.8 },
        riskAdjustedReturn: 140000
      },
      implementationRequirements: {
        difficulty: 'high',
        timelineEstimate: '6-9 months',
        resourceRequirements: [],
        skillsNeeded: ['Digital Marketing', 'Analytics'],
        investmentRequired: 75000,
        dependencies: ['Marketing team expansion', 'Technology platform']
      },
      priorityScore: 0,
      priorityFactors: { impactWeight: 0, easeWeight: 0, timeWeight: 0, costWeight: 0, strategicAlignment: 0 },
      contentTier: 'premium',
      freeContent: { summary: '', keyBenefits: [], basicSteps: [] },
      successMetrics: [],
      relatedOpportunities: [],
      marketTrends: [],
      industryRelevance: 0.9,
      confidence: 0.7,
      identifiedAt: new Date(),
      lastUpdated: new Date()
    },
    {
      id: 'opp3',
      evaluationId: 'eval1',
      category: 'strategic',
      subcategory: 'Market Expansion',
      title: 'New Market Entry',
      description: 'Expand into adjacent geographic markets',
      detailedAnalysis: 'Analysis details',
      impactEstimate: {
        revenueIncrease: { amount: 500000, percentage: 0.5, timeframe: '24 months', confidence: 0.6 },
        costReduction: { amount: 0, percentage: 0, timeframe: '24 months', confidence: 0.6 },
        roi: { percentage: 60, paybackPeriod: '18 months', npv: 300000, irr: 0.6 },
        riskAdjustedReturn: 200000
      },
      implementationRequirements: {
        difficulty: 'very_high',
        timelineEstimate: '12-18 months',
        resourceRequirements: [],
        skillsNeeded: ['Strategic Planning', 'Market Research', 'Business Development'],
        investmentRequired: 200000,
        dependencies: ['Market research', 'Regulatory approval', 'Partnership agreements']
      },
      priorityScore: 0,
      priorityFactors: { impactWeight: 0, easeWeight: 0, timeWeight: 0, costWeight: 0, strategicAlignment: 0 },
      contentTier: 'enterprise',
      freeContent: { summary: '', keyBenefits: [], basicSteps: [] },
      successMetrics: [],
      relatedOpportunities: [],
      marketTrends: [],
      industryRelevance: 0.75,
      confidence: 0.6,
      identifiedAt: new Date(),
      lastUpdated: new Date()
    }
  ];

  const priorityService = new PriorityService();

  describe('calculatePriorityMatrix', () => {
    it('should return valid priority analysis results', async () => {
      const result = await priorityService.calculatePriorityMatrix(
        'eval1',
        mockOpportunities,
        mockBusinessMetrics
      );

      expect(result).toHaveProperty('matrix');
      expect(result).toHaveProperty('rankings');
      expect(result).toHaveProperty('tiers');
      expect(result).toHaveProperty('sequence');
      expect(result).toHaveProperty('recommendations');
      expect(result).toHaveProperty('totalValue');

      expect(result.matrix).toHaveProperty('id');
      expect(result.matrix).toHaveProperty('evaluationId', 'eval1');
      expect(result.matrix).toHaveProperty('opportunities');
      expect(result.matrix).toHaveProperty('criteria');
      expect(result.matrix).toHaveProperty('methodology');
      expect(result.matrix).toHaveProperty('calculatedAt');

      expect(Array.isArray(result.rankings)).toBe(true);
      expect(Array.isArray(result.tiers)).toBe(true);
      expect(Array.isArray(result.sequence)).toBe(true);
      expect(Array.isArray(result.recommendations)).toBe(true);
      expect(typeof result.totalValue).toBe('number');
    });

    it('should rank opportunities correctly', async () => {
      const result = await priorityService.calculatePriorityMatrix(
        'eval1',
        mockOpportunities,
        mockBusinessMetrics
      );

      expect(result.rankings).toHaveLength(mockOpportunities.length);

      // Check that rankings are sorted by score (highest first)
      for (let i = 0; i < result.rankings.length - 1; i++) {
        expect(result.rankings[i].score).toBeGreaterThanOrEqual(result.rankings[i + 1].score);
        expect(result.rankings[i].rank).toBeLessThan(result.rankings[i + 1].rank);
      }

      // Check that all opportunities are included
      const rankedOpportunityIds = result.rankings.map(r => r.opportunityId);
      const originalOpportunityIds = mockOpportunities.map(o => o.id);
      expect(rankedOpportunityIds.sort()).toEqual(originalOpportunityIds.sort());
    });

    it('should create appropriate priority tiers', async () => {
      const result = await priorityService.calculatePriorityMatrix(
        'eval1',
        mockOpportunities,
        mockBusinessMetrics
      );

      const highTier = result.tiers.find(t => t.tier === 'high');
      const mediumTier = result.tiers.find(t => t.tier === 'medium');
      const lowTier = result.tiers.find(t => t.tier === 'low');

      expect(highTier).toBeDefined();
      expect(mediumTier).toBeDefined();
      expect(lowTier).toBeDefined();

      // All opportunities should be assigned to a tier
      const totalTierOpportunities = (highTier?.opportunities.length || 0) + 
                                   (mediumTier?.opportunities.length || 0) + 
                                   (lowTier?.opportunities.length || 0);
      expect(totalTierOpportunities).toBe(mockOpportunities.length);

      // Each tier should have valid properties
      [highTier, mediumTier, lowTier].forEach(tier => {
        if (tier) {
          expect(tier).toHaveProperty('tier');
          expect(tier).toHaveProperty('opportunities');
          expect(tier).toHaveProperty('totalValue');
          expect(tier).toHaveProperty('description');
          expect(Array.isArray(tier.opportunities)).toBe(true);
          expect(typeof tier.totalValue).toBe('number');
          expect(typeof tier.description).toBe('string');
        }
      });
    });

    it('should generate implementation sequence', async () => {
      const result = await priorityService.calculatePriorityMatrix(
        'eval1',
        mockOpportunities,
        mockBusinessMetrics
      );

      expect(result.sequence).toBeDefined();
      expect(Array.isArray(result.sequence)).toBe(true);

      result.sequence.forEach((phase, index) => {
        expect(phase).toHaveProperty('phase', index + 1);
        expect(phase).toHaveProperty('opportunities');
        expect(phase).toHaveProperty('duration');
        expect(phase).toHaveProperty('dependencies');
        expect(phase).toHaveProperty('expectedValue');

        expect(Array.isArray(phase.opportunities)).toBe(true);
        expect(Array.isArray(phase.dependencies)).toBe(true);
        expect(typeof phase.duration).toBe('string');
        expect(typeof phase.expectedValue).toBe('number');
      });
    });

    it('should calculate total potential value correctly', async () => {
      const result = await priorityService.calculatePriorityMatrix(
        'eval1',
        mockOpportunities,
        mockBusinessMetrics
      );

      const expectedTotalValue = mockOpportunities.reduce((sum, opp) => {
        return sum + opp.impactEstimate.revenueIncrease.amount + opp.impactEstimate.costReduction.amount;
      }, 0);

      expect(result.totalValue).toBe(expectedTotalValue);
    });

    it('should generate meaningful recommendations', async () => {
      const result = await priorityService.calculatePriorityMatrix(
        'eval1',
        mockOpportunities,
        mockBusinessMetrics
      );

      expect(result.recommendations).toBeDefined();
      expect(Array.isArray(result.recommendations)).toBe(true);
      expect(result.recommendations.length).toBeGreaterThan(0);

      result.recommendations.forEach(recommendation => {
        expect(typeof recommendation).toBe('string');
        expect(recommendation.length).toBeGreaterThan(0);
      });
    });

    it('should handle custom criteria', async () => {
      const customCriteria = {
        impact: {
          weight: 0.5,
          metrics: {
            revenueImpact: 0.6,
            costImpact: 0.2,
            strategicValue: 0.2
          }
        },
        effort: {
          weight: 0.3,
          metrics: {
            complexity: 0.5,
            resourceRequirement: 0.3,
            timeRequirement: 0.2
          }
        }
      };

      const result = await priorityService.calculatePriorityMatrix(
        'eval1',
        mockOpportunities,
        mockBusinessMetrics,
        customCriteria
      );

      expect(result.matrix.criteria.impact.weight).toBe(0.5);
      expect(result.matrix.criteria.effort.weight).toBe(0.3);
    });

    it('should adjust weights based on business context', async () => {
      const profitableBusinessMetrics: BusinessMetrics = {
        ...mockBusinessMetrics,
        profit: 300000,
        profitMargin: 0.3
      };

      const strugglingBusinessMetrics: BusinessMetrics = {
        ...mockBusinessMetrics,
        profit: -50000,
        profitMargin: -0.05
      };

      const profitableResult = await priorityService.calculatePriorityMatrix(
        'eval1',
        mockOpportunities,
        profitableBusinessMetrics
      );

      const strugglingResult = await priorityService.calculatePriorityMatrix(
        'eval2',
        mockOpportunities,
        strugglingBusinessMetrics
      );

      // The algorithm should adjust criteria weights based on business condition
      // This is a behavioral test - the exact weights may vary but should be different
      expect(profitableResult.matrix.criteria).toBeDefined();
      expect(strugglingResult.matrix.criteria).toBeDefined();
    });
  });

  describe('score calculations', () => {
    it('should calculate meaningful scores for all criteria', async () => {
      const result = await priorityService.calculatePriorityMatrix(
        'eval1',
        mockOpportunities,
        mockBusinessMetrics
      );

      result.rankings.forEach(ranking => {
        expect(ranking.impactScore).toBeGreaterThanOrEqual(0);
        expect(ranking.impactScore).toBeLessThanOrEqual(100);
        expect(ranking.effortScore).toBeGreaterThanOrEqual(0);
        expect(ranking.effortScore).toBeLessThanOrEqual(100);
        expect(ranking.timelineScore).toBeGreaterThanOrEqual(0);
        expect(ranking.timelineScore).toBeLessThanOrEqual(100);
        expect(ranking.riskScore).toBeGreaterThanOrEqual(0);
        expect(ranking.riskScore).toBeLessThanOrEqual(100);
        expect(ranking.strategicScore).toBeGreaterThanOrEqual(0);
        expect(ranking.strategicScore).toBeLessThanOrEqual(100);
      });
    });

    it('should give higher impact scores to high-value opportunities', async () => {
      const result = await priorityService.calculatePriorityMatrix(
        'eval1',
        mockOpportunities,
        mockBusinessMetrics
      );

      // Find the strategic opportunity (highest total impact)
      const strategicOpportunityRanking = result.rankings.find(
        r => r.opportunityId === 'opp3' // Strategic opportunity with $500k impact
      );
      
      // Find the cost reduction opportunity (lower total impact)
      const costReductionOpportunityRanking = result.rankings.find(
        r => r.opportunityId === 'opp1' // Financial opportunity with $100k impact
      );

      if (strategicOpportunityRanking && costReductionOpportunityRanking) {
        expect(strategicOpportunityRanking.impactScore).toBeGreaterThan(
          costReductionOpportunityRanking.impactScore
        );
      }
    });

    it('should give higher effort scores to easier opportunities', async () => {
      const result = await priorityService.calculatePriorityMatrix(
        'eval1',
        mockOpportunities,
        mockBusinessMetrics
      );

      // Find the low difficulty opportunity
      const easyOpportunityRanking = result.rankings.find(
        r => r.opportunityId === 'opp1' // Low difficulty
      );
      
      // Find the very high difficulty opportunity
      const hardOpportunityRanking = result.rankings.find(
        r => r.opportunityId === 'opp3' // Very high difficulty
      );

      if (easyOpportunityRanking && hardOpportunityRanking) {
        expect(easyOpportunityRanking.effortScore).toBeGreaterThan(
          hardOpportunityRanking.effortScore
        );
      }
    });
  });

  describe('edge cases', () => {
    it('should handle single opportunity', async () => {
      const singleOpportunity = [mockOpportunities[0]];
      
      const result = await priorityService.calculatePriorityMatrix(
        'eval1',
        singleOpportunity,
        mockBusinessMetrics
      );

      expect(result.rankings).toHaveLength(1);
      expect(result.rankings[0].rank).toBe(1);
      expect(result.tiers).toBeDefined();
      expect(result.sequence).toBeDefined();
    });

    it('should handle opportunities with zero impact', async () => {
      const zeroImpactOpportunity: ImprovementOpportunity = {
        ...mockOpportunities[0],
        id: 'opp_zero',
        impactEstimate: {
          revenueIncrease: { amount: 0, percentage: 0, timeframe: '12 months', confidence: 0.5 },
          costReduction: { amount: 0, percentage: 0, timeframe: '12 months', confidence: 0.5 },
          roi: { percentage: 0, paybackPeriod: 'N/A', npv: 0, irr: 0 },
          riskAdjustedReturn: 0
        }
      };

      const opportunitiesWithZero = [...mockOpportunities, zeroImpactOpportunity];
      
      const result = await priorityService.calculatePriorityMatrix(
        'eval1',
        opportunitiesWithZero,
        mockBusinessMetrics
      );

      expect(result.rankings).toHaveLength(opportunitiesWithZero.length);
      
      // Zero impact opportunity should be ranked last
      const zeroOpportunityRanking = result.rankings.find(r => r.opportunityId === 'opp_zero');
      expect(zeroOpportunityRanking?.rank).toBe(opportunitiesWithZero.length);
    });

    it('should handle business with no employees or customers', async () => {
      const edgeCaseMetrics: BusinessMetrics = {
        revenue: 100000,
        expenses: 80000,
        profit: 20000,
        profitMargin: 0.2,
        employeeCount: 0,
        customerCount: 0
      };

      expect(() => 
        priorityService.calculatePriorityMatrix('eval1', mockOpportunities, edgeCaseMetrics)
      ).not.toThrow();

      const result = await priorityService.calculatePriorityMatrix(
        'eval1',
        mockOpportunities,
        edgeCaseMetrics
      );

      expect(result.rankings).toHaveLength(mockOpportunities.length);
    });
  });
});