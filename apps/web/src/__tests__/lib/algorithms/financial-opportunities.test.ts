import { identifyFinancialOpportunities, FINANCIAL_OPPORTUNITY_PATTERNS } from '@/lib/algorithms/financial-opportunities';
import { BusinessMetrics } from '@/types/impact-analysis';

describe('Financial Opportunities Algorithm', () => {
  const mockBusinessMetrics: BusinessMetrics = {
    revenue: 1000000,
    expenses: 800000,
    profit: 200000,
    profitMargin: 0.2,
    employeeCount: 50,
    customerCount: 1000,
    marketShare: 0.05
  };

  describe('identifyFinancialOpportunities', () => {
    it('should return financial opportunities with valid structure', () => {
      const result = identifyFinancialOpportunities(mockBusinessMetrics);
      
      expect(result).toHaveProperty('category', 'financial');
      expect(result).toHaveProperty('opportunities');
      expect(result).toHaveProperty('overallScore');
      expect(result).toHaveProperty('methodology');
      expect(Array.isArray(result.opportunities)).toBe(true);
    });

    it('should filter opportunities with low relevance', () => {
      const result = identifyFinancialOpportunities(mockBusinessMetrics);
      
      // All returned opportunities should have relevance > 0.3
      result.opportunities.forEach(opportunity => {
        expect(opportunity.relevance).toBeGreaterThan(0.3);
      });
    });

    it('should sort opportunities by estimated impact', () => {
      const result = identifyFinancialOpportunities(mockBusinessMetrics);
      
      if (result.opportunities.length > 1) {
        for (let i = 0; i < result.opportunities.length - 1; i++) {
          expect(result.opportunities[i].estimatedImpact).toBeGreaterThanOrEqual(
            result.opportunities[i + 1].estimatedImpact
          );
        }
      }
    });

    it('should identify pricing optimization for low margin businesses', () => {
      const lowMarginMetrics: BusinessMetrics = {
        ...mockBusinessMetrics,
        profitMargin: 0.05,
        profit: 50000
      };

      const result = identifyFinancialOpportunities(lowMarginMetrics);
      const pricingOpportunity = result.opportunities.find(
        opp => opp.pattern === 'pricing_optimization'
      );
      
      expect(pricingOpportunity).toBeDefined();
      expect(pricingOpportunity?.relevance).toBeGreaterThan(0.7);
    });

    it('should identify automation opportunities for large companies', () => {
      const largeCompanyMetrics: BusinessMetrics = {
        ...mockBusinessMetrics,
        employeeCount: 200,
        revenue: 5000000,
        expenses: 4000000
      };

      const result = identifyFinancialOpportunities(largeCompanyMetrics);
      const automationOpportunity = result.opportunities.find(
        opp => opp.pattern === 'cost_reduction_automation'
      );
      
      expect(automationOpportunity).toBeDefined();
      if (automationOpportunity) {
        expect(automationOpportunity.confidence).toBeGreaterThan(0.7);
      }
    });

    it('should handle edge cases gracefully', () => {
      const edgeCaseMetrics: BusinessMetrics = {
        revenue: 0,
        expenses: 0,
        profit: 0,
        profitMargin: 0,
        employeeCount: 0,
        customerCount: 0
      };

      expect(() => identifyFinancialOpportunities(edgeCaseMetrics)).not.toThrow();
      const result = identifyFinancialOpportunities(edgeCaseMetrics);
      expect(result.opportunities).toBeDefined();
    });
  });

  describe('FINANCIAL_OPPORTUNITY_PATTERNS', () => {
    it('should have valid pattern structures', () => {
      FINANCIAL_OPPORTUNITY_PATTERNS.forEach(pattern => {
        expect(pattern).toHaveProperty('pattern');
        expect(pattern).toHaveProperty('indicators');
        expect(pattern).toHaveProperty('typicalImpact');
        expect(pattern).toHaveProperty('difficulty');
        expect(pattern).toHaveProperty('applicability');
        
        expect(typeof pattern.applicability).toBe('function');
        expect(Array.isArray(pattern.indicators)).toBe(true);
        expect(['low', 'medium', 'high', 'very_high']).toContain(pattern.difficulty);
      });
    });

    it('should have consistent impact structure', () => {
      FINANCIAL_OPPORTUNITY_PATTERNS.forEach(pattern => {
        const impact = pattern.typicalImpact;
        expect(impact).toHaveProperty('revenueIncrease');
        expect(impact).toHaveProperty('costReduction');
        expect(impact).toHaveProperty('implementationCost');
        expect(impact).toHaveProperty('paybackPeriod');
        
        expect(typeof impact.revenueIncrease).toBe('number');
        expect(typeof impact.costReduction).toBe('number');
        expect(typeof impact.implementationCost).toBe('number');
        expect(typeof impact.paybackPeriod).toBe('number');
      });
    });

    it('should return valid applicability scores', () => {
      FINANCIAL_OPPORTUNITY_PATTERNS.forEach(pattern => {
        const score = pattern.applicability(mockBusinessMetrics);
        expect(score).toBeGreaterThanOrEqual(0);
        expect(score).toBeLessThanOrEqual(1);
      });
    });
  });

  describe('opportunity confidence calculation', () => {
    it('should return higher confidence for complete data', () => {
      const completeMetrics: BusinessMetrics = {
        revenue: 1000000,
        expenses: 800000,
        profit: 200000,
        profitMargin: 0.2,
        employeeCount: 50,
        customerCount: 1000,
        marketShare: 0.05
      };

      const incompleteMetrics: BusinessMetrics = {
        revenue: 1000000,
        expenses: 800000,
        profit: 200000,
        profitMargin: 0.2,
        employeeCount: 0,
        customerCount: 0
      };

      const completeResult = identifyFinancialOpportunities(completeMetrics);
      const incompleteResult = identifyFinancialOpportunities(incompleteMetrics);

      if (completeResult.opportunities.length > 0 && incompleteResult.opportunities.length > 0) {
        // Find common opportunity types to compare
        const completeOpp = completeResult.opportunities[0];
        const incompleteOpp = incompleteResult.opportunities.find(
          opp => opp.pattern === completeOpp.pattern
        );

        if (incompleteOpp) {
          expect(completeOpp.confidence).toBeGreaterThanOrEqual(incompleteOpp.confidence);
        }
      }
    });
  });

  describe('impact calculation', () => {
    it('should calculate positive impact for valid opportunities', () => {
      const result = identifyFinancialOpportunities(mockBusinessMetrics);
      
      result.opportunities.forEach(opportunity => {
        expect(opportunity.estimatedImpact).toBeGreaterThan(0);
      });
    });

    it('should scale impact with business size', () => {
      const smallMetrics: BusinessMetrics = {
        ...mockBusinessMetrics,
        revenue: 100000,
        expenses: 80000
      };

      const largeMetrics: BusinessMetrics = {
        ...mockBusinessMetrics,
        revenue: 10000000,
        expenses: 8000000
      };

      const smallResult = identifyFinancialOpportunities(smallMetrics);
      const largeResult = identifyFinancialOpportunities(largeMetrics);

      // Find common opportunities to compare
      if (smallResult.opportunities.length > 0 && largeResult.opportunities.length > 0) {
        const smallOpp = smallResult.opportunities[0];
        const largeOpp = largeResult.opportunities.find(
          opp => opp.pattern === smallOpp.pattern
        );

        if (largeOpp) {
          expect(largeOpp.estimatedImpact).toBeGreaterThan(smallOpp.estimatedImpact);
        }
      }
    });
  });
});