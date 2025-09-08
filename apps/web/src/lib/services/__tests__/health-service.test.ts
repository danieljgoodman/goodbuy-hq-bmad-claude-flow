import { describe, it, expect, vi } from 'vitest'
import { HealthAnalysisService } from '../health-service'
import type { BusinessData } from '@/types/evaluation'

describe('HealthAnalysisService', () => {
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

  describe('calculateComprehensiveHealthScore', () => {
    it('should calculate comprehensive health score with all dimensions', async () => {
      const businessData = createMockBusinessData()
      const service = new HealthAnalysisService(businessData)
      
      const result = await service.calculateComprehensiveHealthScore()
      
      expect(result.id).toBeDefined()
      expect(result.overallScore).toBeGreaterThan(0)
      expect(result.overallScore).toBeLessThanOrEqual(100)
      expect(result.dimensions).toBeDefined()
      expect(result.dimensions.financial).toBeDefined()
      expect(result.dimensions.operational).toBeDefined()
      expect(result.dimensions.market).toBeDefined()
      expect(result.dimensions.growth).toBeDefined()
    })

    it('should have properly weighted overall score', async () => {
      const businessData = createMockBusinessData()
      const service = new HealthAnalysisService(businessData)
      
      const result = await service.calculateComprehensiveHealthScore()
      
      // Verify that overall score is weighted average of dimensions
      const expectedScore = Math.round(
        result.dimensions.financial.score * result.dimensions.financial.weight +
        result.dimensions.operational.score * result.dimensions.operational.weight +
        result.dimensions.market.score * result.dimensions.market.weight +
        result.dimensions.growth.score * result.dimensions.growth.weight
      )
      
      expect(result.overallScore).toBe(expectedScore)
    })

    it('should generate trend analysis', async () => {
      const businessData = createMockBusinessData()
      const service = new HealthAnalysisService(businessData)
      
      const result = await service.calculateComprehensiveHealthScore()
      
      expect(result.trendAnalysis).toBeDefined()
      expect(result.trendAnalysis.trendDirection).toMatch(/upward|stable|downward/)
      expect(result.trendAnalysis.historicalData).toBeDefined()
      expect(result.trendAnalysis.historicalData.length).toBeGreaterThan(0)
      expect(result.trendAnalysis.projectedScores).toBeDefined()
    })

    it('should generate predictive indicators', async () => {
      const businessData = createMockBusinessData()
      const service = new HealthAnalysisService(businessData)
      
      const result = await service.calculateComprehensiveHealthScore()
      
      expect(result.predictiveIndicators).toBeDefined()
      expect(result.predictiveIndicators.length).toBeGreaterThan(0)
      
      result.predictiveIndicators.forEach(indicator => {
        expect(indicator.name).toBeDefined()
        expect(indicator.category).toMatch(/leading|lagging|coincident/)
        expect(indicator.confidence).toBeGreaterThan(0)
        expect(indicator.confidence).toBeLessThanOrEqual(100)
      })
    })

    it('should generate improvement paths', async () => {
      const businessData = createMockBusinessData()
      const service = new HealthAnalysisService(businessData)
      
      const result = await service.calculateComprehensiveHealthScore()
      
      expect(result.improvementPaths).toBeDefined()
      
      result.improvementPaths.forEach(path => {
        expect(path.dimension).toBeDefined()
        expect(path.currentScore).toBeGreaterThanOrEqual(0)
        expect(path.targetScore).toBeGreaterThan(path.currentScore)
        expect(path.actions).toBeDefined()
        expect(path.actions.length).toBeGreaterThan(0)
      })
    })

    it('should generate health alerts for critical issues', async () => {
      const criticalData = createMockBusinessData({
        annualRevenue: 100000,
        expenses: 300000,
        cashFlow: -50000,
        grossMargin: 10
      })
      
      const service = new HealthAnalysisService(criticalData)
      const result = await service.calculateComprehensiveHealthScore()
      
      expect(result.alerts).toBeDefined()
      
      // Should have critical alerts for poor financial health
      const criticalAlerts = result.alerts.filter(alert => alert.severity === 'critical')
      expect(criticalAlerts.length).toBeGreaterThan(0)
    })

    it('should include industry benchmarks', async () => {
      const businessData = createMockBusinessData()
      const service = new HealthAnalysisService(businessData)
      
      const result = await service.calculateComprehensiveHealthScore()
      
      expect(result.industryBenchmarks).toBeDefined()
      expect(result.industryBenchmarks.length).toBeGreaterThan(0)
      
      result.industryBenchmarks.forEach(benchmark => {
        expect(benchmark.industry).toBeDefined()
        expect(benchmark.sampleSize).toBeGreaterThan(0)
        expect(benchmark.metrics).toBeDefined()
      })
    })

    it('should have valid timestamps', async () => {
      const businessData = createMockBusinessData()
      const service = new HealthAnalysisService(businessData)
      
      const result = await service.calculateComprehensiveHealthScore()
      
      expect(result.calculatedAt).toBeInstanceOf(Date)
      expect(result.validUntil).toBeInstanceOf(Date)
      expect(result.validUntil.getTime()).toBeGreaterThan(result.calculatedAt.getTime())
    })

    it('should generate methodology explanation', async () => {
      const businessData = createMockBusinessData()
      const service = new HealthAnalysisService(businessData)
      
      const result = await service.calculateComprehensiveHealthScore()
      
      expect(result.methodology).toBeDefined()
      expect(result.methodology.length).toBeGreaterThan(50)
      expect(result.methodology).toContain('Multi-dimensional')
    })

    it('should have confidence score within valid range', async () => {
      const businessData = createMockBusinessData()
      const service = new HealthAnalysisService(businessData)
      
      const result = await service.calculateComprehensiveHealthScore()
      
      expect(result.confidenceScore).toBeGreaterThanOrEqual(0)
      expect(result.confidenceScore).toBeLessThanOrEqual(100)
    })
  })

  describe('edge cases', () => {
    it('should handle minimal data gracefully', async () => {
      const minimalData = createMockBusinessData({
        annualRevenue: 0,
        expenses: 0,
        customerCount: 0,
        employeeCount: 0,
        assets: 0,
        liabilities: 0
      })
      
      const service = new HealthAnalysisService(minimalData)
      const result = await service.calculateComprehensiveHealthScore()
      
      expect(result.overallScore).toBeGreaterThanOrEqual(0)
      expect(result.confidenceScore).toBeLessThan(80) // Should have lower confidence
    })

    it('should handle extremely high values', async () => {
      const highValueData = createMockBusinessData({
        annualRevenue: 1000000000,
        expenses: 500000000,
        customerCount: 1000000,
        employeeCount: 10000,
        assets: 5000000000
      })
      
      const service = new HealthAnalysisService(highValueData)
      const result = await service.calculateComprehensiveHealthScore()
      
      expect(result.overallScore).toBeGreaterThanOrEqual(0)
      expect(result.overallScore).toBeLessThanOrEqual(100)
    })

    it('should handle new businesses with limited history', async () => {
      const newBusinessData = createMockBusinessData({
        yearsInBusiness: 0,
        annualRevenue: 50000,
        customerCount: 10
      })
      
      const service = new HealthAnalysisService(newBusinessData)
      const result = await service.calculateComprehensiveHealthScore()
      
      expect(result.overallScore).toBeGreaterThanOrEqual(0)
      expect(result.dimensions.growth.confidence).toBeLessThan(80) // Lower confidence for new business
    })
  })

  describe('performance', () => {
    it('should complete analysis within reasonable time', async () => {
      const businessData = createMockBusinessData()
      const service = new HealthAnalysisService(businessData)
      
      const startTime = Date.now()
      await service.calculateComprehensiveHealthScore()
      const endTime = Date.now()
      
      expect(endTime - startTime).toBeLessThan(5000) // Should complete within 5 seconds
    })
  })
})