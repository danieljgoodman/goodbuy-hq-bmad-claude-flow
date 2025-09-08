import { describe, it, expect, beforeEach } from 'vitest';
import { AssetBasedValuationEngine } from '@/lib/algorithms/asset-based';
import { IncomeBasedValuationEngine } from '@/lib/algorithms/income-based';
import { MarketBasedValuationEngine } from '@/lib/algorithms/market-based';
import { WeightedValuationEngine } from '@/lib/algorithms/weighted-valuation';

describe('Multi-Methodology Valuation Engine', () => {
  let assetEngine: AssetBasedValuationEngine;
  let incomeEngine: IncomeBasedValuationEngine;
  let marketEngine: MarketBasedValuationEngine;
  let weightedEngine: WeightedValuationEngine;

  const mockBusinessData = {
    annualRevenue: 5000000,
    monthlyRecurring: 100000,
    expenses: 4000000,
    cashFlow: 1000000,
    assets: {
      tangible: 2000000,
      intangible: 500000,
      inventory: 300000,
      equipment: 800000,
      realEstate: 1500000,
    },
    liabilities: {
      shortTerm: 500000,
      longTerm: 1000000,
      contingent: 100000,
    },
    customerCount: 150,
    marketPosition: 'average' as const,
    industry: 'technology',
    businessAge: 5,
    growthRate: 0.15,
  };

  beforeEach(() => {
    assetEngine = new AssetBasedValuationEngine();
    incomeEngine = new IncomeBasedValuationEngine();
    marketEngine = new MarketBasedValuationEngine();
    weightedEngine = new WeightedValuationEngine();
  });

  describe('Asset-Based Valuation', () => {
    it('should calculate asset-based valuation correctly', () => {
      const result = assetEngine.calculateAssetBasedValuation({
        assets: mockBusinessData.assets,
        liabilities: mockBusinessData.liabilities,
        industry: mockBusinessData.industry,
        businessAge: mockBusinessData.businessAge,
        marketConditions: 3.0,
      });

      expect(result.value).toBeGreaterThan(0);
      expect(result.confidence).toBeGreaterThan(0);
      expect(result.confidence).toBeLessThanOrEqual(1);
      expect(result.methodology).toContain('Asset-Based');
      expect(result.assumptions).toBeInstanceOf(Array);
      expect(result.adjustments).toBeInstanceOf(Array);
    });

    it('should handle different industries correctly', () => {
      const manufacturingResult = assetEngine.calculateAssetBasedValuation({
        assets: mockBusinessData.assets,
        liabilities: mockBusinessData.liabilities,
        industry: 'manufacturing',
        businessAge: mockBusinessData.businessAge,
        marketConditions: 3.0,
      });

      const serviceResult = assetEngine.calculateAssetBasedValuation({
        assets: mockBusinessData.assets,
        liabilities: mockBusinessData.liabilities,
        industry: 'services',
        businessAge: mockBusinessData.businessAge,
        marketConditions: 3.0,
      });

      // Manufacturing should typically have higher asset-based valuations
      expect(manufacturingResult.value).toBeGreaterThan(serviceResult.value);
    });

    it('should apply depreciation based on business age', () => {
      const youngBusinessResult = assetEngine.calculateAssetBasedValuation({
        assets: mockBusinessData.assets,
        liabilities: mockBusinessData.liabilities,
        industry: mockBusinessData.industry,
        businessAge: 1,
        marketConditions: 3.0,
      });

      const oldBusinessResult = assetEngine.calculateAssetBasedValuation({
        assets: mockBusinessData.assets,
        liabilities: mockBusinessData.liabilities,
        industry: mockBusinessData.industry,
        businessAge: 15,
        marketConditions: 3.0,
      });

      // Younger business should have higher asset values due to less depreciation
      expect(youngBusinessResult.value).toBeGreaterThan(oldBusinessResult.value);
    });

    it('should handle negative net worth correctly', () => {
      const highLiabilityData = {
        ...mockBusinessData.assets,
      };
      
      const result = assetEngine.calculateAssetBasedValuation({
        assets: highLiabilityData,
        liabilities: {
          shortTerm: 10000000, // Very high liabilities
          longTerm: 5000000,
          contingent: 1000000,
        },
        industry: mockBusinessData.industry,
        businessAge: mockBusinessData.businessAge,
        marketConditions: 3.0,
      });

      // Should handle negative scenarios gracefully
      expect(result.value).toBeGreaterThanOrEqual(0);
      expect(result.confidence).toBeLessThan(0.8); // Lower confidence for distressed situations
    });
  });

  describe('Income-Based Valuation', () => {
    it('should calculate DCF valuation correctly', () => {
      const result = incomeEngine.calculateIncomeBasedValuation({
        financials: {
          annualRevenue: mockBusinessData.annualRevenue,
          monthlyRecurring: mockBusinessData.monthlyRecurring,
          expenses: mockBusinessData.expenses,
          cashFlow: mockBusinessData.cashFlow,
          growthRate: mockBusinessData.growthRate,
        },
        industry: mockBusinessData.industry,
        businessAge: mockBusinessData.businessAge,
        marketPosition: mockBusinessData.marketPosition,
        customerCount: mockBusinessData.customerCount,
      });

      expect(result.value).toBeGreaterThan(0);
      expect(result.confidence).toBeGreaterThan(0);
      expect(result.discountRate).toBeGreaterThan(0);
      expect(result.discountRate).toBeLessThan(0.5); // Reasonable discount rate
      expect(result.growthAssumptions).toHaveLength(5); // 5-year projection
      expect(result.terminalValue).toBeGreaterThan(0);
    });

    it('should handle different growth rates appropriately', () => {
      const highGrowthResult = incomeEngine.calculateIncomeBasedValuation({
        financials: {
          ...mockBusinessData,
          growthRate: 0.40, // High growth
        },
        industry: mockBusinessData.industry,
        businessAge: mockBusinessData.businessAge,
        marketPosition: mockBusinessData.marketPosition,
        customerCount: mockBusinessData.customerCount,
      });

      const lowGrowthResult = incomeEngine.calculateIncomeBasedValuation({
        financials: {
          ...mockBusinessData,
          growthRate: 0.05, // Low growth
        },
        industry: mockBusinessData.industry,
        businessAge: mockBusinessData.businessAge,
        marketPosition: mockBusinessData.marketPosition,
        customerCount: mockBusinessData.customerCount,
      });

      expect(highGrowthResult.value).toBeGreaterThan(lowGrowthResult.value);
    });

    it('should handle negative cash flow scenarios', () => {
      const result = incomeEngine.calculateIncomeBasedValuation({
        financials: {
          ...mockBusinessData,
          cashFlow: -500000, // Negative cash flow
        },
        industry: mockBusinessData.industry,
        businessAge: mockBusinessData.businessAge,
        marketPosition: mockBusinessData.marketPosition,
        customerCount: mockBusinessData.customerCount,
      });

      expect(result.value).toBeGreaterThan(0); // Should still estimate value
      expect(result.confidence).toBeLessThan(0.7); // Lower confidence for unprofitable businesses
    });

    it('should calculate reasonable discount rates', () => {
      const techResult = incomeEngine.calculateIncomeBasedValuation({
        financials: mockBusinessData,
        industry: 'technology',
        businessAge: 2, // Young tech company
        marketPosition: 'weak',
        customerCount: 20,
      });

      const healthcareResult = incomeEngine.calculateIncomeBasedValuation({
        financials: mockBusinessData,
        industry: 'healthcare',
        businessAge: 10, // Mature healthcare company
        marketPosition: 'leader',
        customerCount: 500,
      });

      // Tech startup should have higher discount rate than mature healthcare
      expect(techResult.discountRate).toBeGreaterThan(healthcareResult.discountRate);
    });
  });

  describe('Market-Based Valuation', () => {
    it('should calculate market-based valuation correctly', () => {
      const result = marketEngine.calculateMarketBasedValuation({
        annualRevenue: mockBusinessData.annualRevenue,
        cashFlow: mockBusinessData.cashFlow,
        industry: mockBusinessData.industry,
        businessAge: mockBusinessData.businessAge,
        growthRate: mockBusinessData.growthRate,
        customerCount: mockBusinessData.customerCount,
        marketPosition: mockBusinessData.marketPosition,
      });

      expect(result.value).toBeGreaterThan(0);
      expect(result.confidence).toBeGreaterThan(0);
      expect(result.comparableCompanies).toHaveLength(4); // Should generate 4 comparables
      expect(result.multiples).toHaveLength(3); // Revenue, EBITDA, and earnings multiples
    });

    it('should generate appropriate multiples for different industries', () => {
      const techResult = marketEngine.calculateMarketBasedValuation({
        ...mockBusinessData,
        industry: 'technology',
      });

      const retailResult = marketEngine.calculateMarketBasedValuation({
        ...mockBusinessData,
        industry: 'retail',
      });

      // Tech should typically have higher multiples than retail
      const techRevenueMultiple = techResult.multiples.find(m => m.type === 'revenue')?.value || 0;
      const retailRevenueMultiple = retailResult.multiples.find(m => m.type === 'revenue')?.value || 0;
      
      expect(techRevenueMultiple).toBeGreaterThan(retailRevenueMultiple);
    });

    it('should adjust for market position correctly', () => {
      const leaderResult = marketEngine.calculateMarketBasedValuation({
        ...mockBusinessData,
        marketPosition: 'leader',
      });

      const strugglingResult = marketEngine.calculateMarketBasedValuation({
        ...mockBusinessData,
        marketPosition: 'struggling',
      });

      expect(leaderResult.value).toBeGreaterThan(strugglingResult.value);
    });
  });

  describe('Weighted Valuation Engine', () => {
    it('should calculate weighted valuation correctly', async () => {
      const result = await weightedEngine.calculateWeightedValuation(
        mockBusinessData,
        'test-user-id'
      );

      expect(result.id).toBeTruthy();
      expect(result.userId).toBe('test-user-id');
      expect(result.status).toBe('completed');
      expect(result.valuations.weighted.value).toBeGreaterThan(0);
      expect(result.valuations.weighted.confidence).toBeGreaterThan(0);
      expect(result.valuations.weighted.confidence).toBeLessThanOrEqual(1);

      // Check that all three methodologies were calculated
      expect(result.valuations.assetBased.value).toBeGreaterThan(0);
      expect(result.valuations.incomeBased.value).toBeGreaterThan(0);
      expect(result.valuations.marketBased.value).toBeGreaterThan(0);

      // Weights should sum to 1
      const weights = result.valuations.weighted.weights;
      const weightSum = weights.asset + weights.income + weights.market;
      expect(Math.abs(weightSum - 1.0)).toBeLessThan(0.001); // Allow for floating point precision

      // Should have risk factors and confidence factors
      expect(result.confidenceFactors).toBeTruthy();
      expect(result.riskFactors).toBeInstanceOf(Array);
    });

    it('should process within 3 seconds', async () => {
      const startTime = Date.now();
      
      const result = await weightedEngine.calculateWeightedValuation(
        mockBusinessData,
        'test-user-id'
      );
      
      const endTime = Date.now();
      const processingTime = endTime - startTime;

      expect(processingTime).toBeLessThan(3000); // Sub-3-second requirement
      expect(result.processingTime).toBeLessThan(3000);
    });

    it('should adjust weights based on industry', async () => {
      const manufacturingResult = await weightedEngine.calculateWeightedValuation(
        { ...mockBusinessData, industry: 'manufacturing' },
        'test-user-id'
      );

      const technologyResult = await weightedEngine.calculateWeightedValuation(
        { ...mockBusinessData, industry: 'technology' },
        'test-user-id'
      );

      // Manufacturing should have higher asset weighting
      expect(manufacturingResult.valuations.weighted.weights.asset)
        .toBeGreaterThan(technologyResult.valuations.weighted.weights.asset);

      // Technology should have higher income/market weighting
      expect(technologyResult.valuations.weighted.weights.income + technologyResult.valuations.weighted.weights.market)
        .toBeGreaterThan(manufacturingResult.valuations.weighted.weights.income + manufacturingResult.valuations.weighted.weights.market);
    });

    it('should identify risk factors correctly', async () => {
      // Test with risky business profile
      const riskyBusiness = {
        ...mockBusinessData,
        businessAge: 0.5, // Very young
        cashFlow: -100000, // Negative cash flow
        customerCount: 5, // Customer concentration risk
      };

      const result = await weightedEngine.calculateWeightedValuation(
        riskyBusiness,
        'test-user-id'
      );

      expect(result.riskFactors.length).toBeGreaterThan(0);
      
      // Should identify specific risk factors
      const riskCategories = result.riskFactors.map(r => r.factor);
      expect(riskCategories).toContain('Negative Cash Flow');
      expect(riskCategories).toContain('Early Stage Business');
      expect(riskCategories).toContain('Customer Concentration');
    });

    it('should calculate confidence factors appropriately', async () => {
      // Test with high-quality data
      const qualityBusiness = {
        ...mockBusinessData,
        businessAge: 10, // Mature
        cashFlow: 2000000, // Profitable
        customerCount: 500, // Diversified
      };

      const result = await weightedEngine.calculateWeightedValuation(
        qualityBusiness,
        'test-user-id'
      );

      expect(result.confidenceFactors.businessStability).toBeGreaterThan(0.7);
      expect(result.confidenceFactors.dataQuality).toBeGreaterThan(0.7);
      expect(result.confidenceFactors.overall).toBeGreaterThan(0.6);
    });
  });

  describe('Performance and Edge Cases', () => {
    it('should handle zero values gracefully', async () => {
      const zeroValueBusiness = {
        ...mockBusinessData,
        annualRevenue: 0,
        cashFlow: 0,
        assets: {
          tangible: 0,
          intangible: 0,
          inventory: 0,
          equipment: 0,
          realEstate: 0,
        },
      };

      const result = await weightedEngine.calculateWeightedValuation(
        zeroValueBusiness,
        'test-user-id'
      );

      expect(result.status).toBe('completed');
      expect(result.valuations.weighted.value).toBeGreaterThanOrEqual(0);
    });

    it('should handle very large values', async () => {
      const largeBusiness = {
        ...mockBusinessData,
        annualRevenue: 1000000000, // $1B revenue
        cashFlow: 200000000, // $200M cash flow
        assets: {
          tangible: 500000000,
          intangible: 300000000,
          inventory: 100000000,
          equipment: 200000000,
          realEstate: 400000000,
        },
      };

      const result = await weightedEngine.calculateWeightedValuation(
        largeBusiness,
        'test-user-id'
      );

      expect(result.status).toBe('completed');
      expect(result.valuations.weighted.value).toBeGreaterThan(largeBusiness.annualRevenue);
      expect(result.processingTime).toBeLessThan(3000);
    });

    it('should maintain consistency across multiple runs', async () => {
      const results = await Promise.all([
        weightedEngine.calculateWeightedValuation(mockBusinessData, 'test-user-1'),
        weightedEngine.calculateWeightedValuation(mockBusinessData, 'test-user-2'),
        weightedEngine.calculateWeightedValuation(mockBusinessData, 'test-user-3'),
      ]);

      // All results should be very similar (within 1% variance)
      const values = results.map(r => r.valuations.weighted.value);
      const avgValue = values.reduce((sum, val) => sum + val, 0) / values.length;
      
      values.forEach(value => {
        const variance = Math.abs(value - avgValue) / avgValue;
        expect(variance).toBeLessThan(0.01); // Less than 1% variance
      });
    });
  });
});