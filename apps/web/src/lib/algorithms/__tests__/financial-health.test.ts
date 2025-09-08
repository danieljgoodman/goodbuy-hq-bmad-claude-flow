import { describe, it, expect } from 'vitest'
import { FinancialHealthAnalyzer } from '../financial-health'
import type { BusinessData } from '@/types/evaluation'

describe('FinancialHealthAnalyzer', () => {
  const createMockBusinessData = (overrides: Partial<BusinessData> = {}): BusinessData => ({
    businessType: 'LLC',
    industryFocus: 'Technology',
    yearsInBusiness: 5,
    businessModel: 'SaaS',
    revenueModel: 'Subscription',
    annualRevenue: 1000000,
    monthlyRecurring: 80000,
    expenses: 800000,
    cashFlow: 150000,
    grossMargin: 75,
    customerCount: 500,
    employeeCount: 10,
    marketPosition: 'Growing',
    competitiveAdvantages: ['Technology', 'Customer Service'],
    primaryChannels: ['Online', 'Direct Sales'],
    assets: 500000,
    liabilities: 200000,
    ...overrides
  })

  describe('calculateFinancialHealth', () => {
    it('should calculate overall financial health score', () => {
      const businessData = createMockBusinessData()
      const analyzer = new FinancialHealthAnalyzer(businessData)
      
      const result = analyzer.calculateFinancialHealth()
      
      expect(result.dimension).toBe('financial')
      expect(result.score).toBeGreaterThan(0)
      expect(result.score).toBeLessThanOrEqual(100)
      expect(result.weight).toBe(0.35)
      expect(result.confidence).toBeGreaterThan(0)
      expect(result.components).toBeDefined()
      expect(result.components.length).toBeGreaterThan(0)
    })

    it('should return consistent scores for the same input', () => {
      const businessData = createMockBusinessData()
      const analyzer1 = new FinancialHealthAnalyzer(businessData)
      const analyzer2 = new FinancialHealthAnalyzer(businessData)
      
      const result1 = analyzer1.calculateFinancialHealth()
      const result2 = analyzer2.calculateFinancialHealth()
      
      expect(result1.score).toBe(result2.score)
      expect(result1.confidence).toBe(result2.confidence)
    })

    it('should have higher score for profitable businesses', () => {
      const profitableData = createMockBusinessData({
        annualRevenue: 1000000,
        expenses: 600000,
        grossMargin: 80
      })
      
      const unprofitableData = createMockBusinessData({
        annualRevenue: 500000,
        expenses: 800000,
        grossMargin: 30
      })
      
      const profitableAnalyzer = new FinancialHealthAnalyzer(profitableData)
      const unprofitableAnalyzer = new FinancialHealthAnalyzer(unprofitableData)
      
      const profitableResult = profitableAnalyzer.calculateFinancialHealth()
      const unprofitableResult = unprofitableAnalyzer.calculateFinancialHealth()
      
      expect(profitableResult.score).toBeGreaterThan(unprofitableResult.score)
    })

    it('should include all required components', () => {
      const businessData = createMockBusinessData()
      const analyzer = new FinancialHealthAnalyzer(businessData)
      
      const result = analyzer.calculateFinancialHealth()
      
      expect(result.components).toHaveLength(5)
      
      const componentNames = result.components.map(c => c.id)
      expect(componentNames).toContain('profitability')
      expect(componentNames).toContain('liquidity')
      expect(componentNames).toContain('financial-growth')
      expect(componentNames).toContain('efficiency')
      expect(componentNames).toContain('leverage')
    })

    it('should have proper component weights', () => {
      const businessData = createMockBusinessData()
      const analyzer = new FinancialHealthAnalyzer(businessData)
      
      const result = analyzer.calculateFinancialHealth()
      
      const totalWeight = result.components.reduce((sum, comp) => sum + comp.weight, 0)
      expect(totalWeight).toBeCloseTo(1.0, 2)
      
      // Check individual component weights
      result.components.forEach(comp => {
        expect(comp.weight).toBeGreaterThan(0)
        expect(comp.weight).toBeLessThanOrEqual(1)
      })
    })

    it('should generate appropriate insights', () => {
      const businessData = createMockBusinessData({
        annualRevenue: 2000000,
        expenses: 1200000,
        grossMargin: 85
      })
      
      const analyzer = new FinancialHealthAnalyzer(businessData)
      const result = analyzer.calculateFinancialHealth()
      
      expect(result.keyInsights).toBeDefined()
      expect(result.keyInsights.length).toBeGreaterThan(0)
      expect(result.keyInsights.some(insight => 
        insight.includes('profitability') || insight.includes('Strong')
      )).toBe(true)
    })

    it('should identify critical factors for poor performance', () => {
      const poorData = createMockBusinessData({
        annualRevenue: 100000,
        expenses: 200000,
        grossMargin: 15,
        cashFlow: -50000
      })
      
      const analyzer = new FinancialHealthAnalyzer(poorData)
      const result = analyzer.calculateFinancialHealth()
      
      expect(result.criticalFactors).toBeDefined()
      expect(result.score).toBeLessThan(60) // Should be low score
    })

    it('should handle edge cases gracefully', () => {
      const edgeCaseData = createMockBusinessData({
        annualRevenue: 0,
        expenses: 0,
        employeeCount: 0,
        assets: 0
      })
      
      const analyzer = new FinancialHealthAnalyzer(edgeCaseData)
      const result = analyzer.calculateFinancialHealth()
      
      expect(result.score).toBeGreaterThanOrEqual(0)
      expect(result.confidence).toBeLessThan(85) // Should have lower confidence
    })
  })

  describe('component calculations', () => {
    it('should calculate profitability component correctly', () => {
      const highProfitData = createMockBusinessData({
        annualRevenue: 1000000,
        expenses: 600000,
        grossMargin: 80
      })
      
      const analyzer = new FinancialHealthAnalyzer(highProfitData)
      const result = analyzer.calculateFinancialHealth()
      
      const profitabilityComponent = result.components.find(c => c.id === 'profitability')
      expect(profitabilityComponent).toBeDefined()
      expect(profitabilityComponent!.score).toBeGreaterThan(60)
      expect(profitabilityComponent!.impact).toBe('positive')
    })

    it('should calculate liquidity component correctly', () => {
      const highLiquidityData = createMockBusinessData({
        cashFlow: 200000,
        expenses: 600000 // 4 months of expenses in cash flow
      })
      
      const analyzer = new FinancialHealthAnalyzer(highLiquidityData)
      const result = analyzer.calculateFinancialHealth()
      
      const liquidityComponent = result.components.find(c => c.id === 'liquidity')
      expect(liquidityComponent).toBeDefined()
      expect(liquidityComponent!.score).toBeGreaterThan(50)
    })

    it('should calculate leverage component correctly', () => {
      const lowLeverageData = createMockBusinessData({
        assets: 1000000,
        liabilities: 200000 // 20% debt-to-asset ratio
      })
      
      const analyzer = new FinancialHealthAnalyzer(lowLeverageData)
      const result = analyzer.calculateFinancialHealth()
      
      const leverageComponent = result.components.find(c => c.id === 'leverage')
      expect(leverageComponent).toBeDefined()
      expect(leverageComponent!.score).toBeGreaterThan(70) // Good leverage ratio
      expect(leverageComponent!.impact).toBe('positive')
    })
  })

  describe('trend analysis', () => {
    it('should identify improving trends for strong financials', () => {
      const strongData = createMockBusinessData({
        annualRevenue: 2000000,
        expenses: 1200000,
        grossMargin: 85,
        cashFlow: 600000 // 6+ months of expenses
      })
      
      const analyzer = new FinancialHealthAnalyzer(strongData)
      const result = analyzer.calculateFinancialHealth()
      
      // Net margin should be 40% ((2000000 - 1200000) / 2000000) * 100
      // Cash flow ratio should be 6 (600000 / (1200000/12))
      expect(result.trendDirection).toBe('improving')
    })

    it('should identify declining trends for weak financials', () => {
      const weakData = createMockBusinessData({
        annualRevenue: 200000,
        expenses: 400000,
        grossMargin: 20,
        cashFlow: -50000
      })
      
      const analyzer = new FinancialHealthAnalyzer(weakData)
      const result = analyzer.calculateFinancialHealth()
      
      expect(result.trendDirection).toBe('declining')
    })
  })
})