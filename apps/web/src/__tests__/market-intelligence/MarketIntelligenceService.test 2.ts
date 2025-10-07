import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { MarketIntelligenceService, TrendAnalysisRequest } from '../../lib/services/MarketIntelligenceService'
import { MarketIntelligenceRepository } from '../../lib/repositories/MarketIntelligenceRepository'
import { IndustryBenchmarkRepository } from '../../lib/repositories/IndustryBenchmarkRepository'

// Mock the repositories
vi.mock('../../lib/repositories/MarketIntelligenceRepository')
vi.mock('../../lib/repositories/IndustryBenchmarkRepository')

// Mock fetch globally
global.fetch = vi.fn()

describe('MarketIntelligenceService', () => {
  let service: MarketIntelligenceService
  let mockMarketRepo: vi.Mocked<MarketIntelligenceRepository>
  let mockBenchmarkRepo: vi.Mocked<IndustryBenchmarkRepository>

  const mockRequest: TrendAnalysisRequest = {
    industry: 'Technology',
    sector: 'Software',
    businessData: {
      annualRevenue: 1000000,
      yearsInBusiness: 5,
      employeeCount: 20,
      marketPosition: 'Growing Player'
    }
  }

  beforeEach(() => {
    vi.clearAllMocks()
    service = new MarketIntelligenceService()
    
    // Setup mocked methods
    mockMarketRepo = {
      findByUserIdAndIndustry: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      findStaleRecords: vi.fn(),
      findByUserId: vi.fn()
    } as any

    mockBenchmarkRepo = {
      findByIndustryAndSector: vi.fn()
    } as any

    // Replace the repository instances
    service['marketIntelligenceRepo'] = mockMarketRepo
    service['industryBenchmarkRepo'] = mockBenchmarkRepo
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('generateMarketIntelligence', () => {
    it('should return existing recent intelligence data', async () => {
      const existingIntelligence = {
        id: 'test-id',
        userId: 'user-123',
        industry: 'Technology',
        sector: 'Software',
        trendAnalysis: { growth_rate: 10 },
        competitivePositioning: { positioning_score: 75 },
        opportunities: [],
        lastUpdated: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
        nextUpdate: new Date(Date.now() + 9 * 24 * 60 * 60 * 1000)
      }

      mockMarketRepo.findByUserIdAndIndustry.mockResolvedValue(existingIntelligence as any)

      const result = await service.generateMarketIntelligence('user-123', mockRequest)

      expect(result).toEqual(existingIntelligence)
      expect(mockMarketRepo.findByUserIdAndIndustry).toHaveBeenCalledWith(
        'user-123',
        'Technology',
        'Software'
      )
    })

    it('should generate new intelligence when none exists', async () => {
      mockMarketRepo.findByUserIdAndIndustry.mockResolvedValue(null)
      
      const mockCreatedIntelligence = {
        id: 'new-id',
        userId: 'user-123',
        industry: 'Technology',
        sector: 'Software',
        trendAnalysis: { growth_rate: 12 },
        competitivePositioning: { positioning_score: 80 },
        opportunities: [],
        lastUpdated: new Date(),
        nextUpdate: new Date()
      }
      
      mockMarketRepo.create.mockResolvedValue(mockCreatedIntelligence as any)
      mockBenchmarkRepo.findByIndustryAndSector.mockResolvedValue(null)

      // Mock successful Claude API responses
      ;(fetch as any).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ analysisText: 'mock analysis', fallback: false })
      })

      const result = await service.generateMarketIntelligence('user-123', mockRequest)

      expect(mockMarketRepo.create).toHaveBeenCalled()
      expect(result.industry).toBe('Technology')
      expect(result.sector).toBe('Software')
    })

    it('should update existing stale intelligence', async () => {
      const staleIntelligence = {
        id: 'stale-id',
        userId: 'user-123',
        industry: 'Technology',
        sector: 'Software',
        trendAnalysis: { growth_rate: 8 },
        competitivePositioning: { positioning_score: 70 },
        opportunities: [],
        lastUpdated: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // 10 days ago
        nextUpdate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
      }

      const updatedIntelligence = { ...staleIntelligence, lastUpdated: new Date() }

      mockMarketRepo.findByUserIdAndIndustry.mockResolvedValue(staleIntelligence as any)
      mockMarketRepo.update.mockResolvedValue(updatedIntelligence as any)
      mockBenchmarkRepo.findByIndustryAndSector.mockResolvedValue(null)

      // Mock successful Claude API responses
      ;(fetch as any).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ analysisText: 'mock analysis', fallback: false })
      })

      const result = await service.generateMarketIntelligence('user-123', mockRequest)

      expect(mockMarketRepo.update).toHaveBeenCalledWith('stale-id', expect.any(Object))
    })

    it('should handle Claude API failures gracefully', async () => {
      mockMarketRepo.findByUserIdAndIndustry.mockResolvedValue(null)
      mockBenchmarkRepo.findByIndustryAndSector.mockResolvedValue(null)

      // Mock failed Claude API response
      ;(fetch as any).mockResolvedValue({
        ok: false,
        statusText: 'Internal Server Error'
      })

      const result = await service.generateMarketIntelligence('user-123', mockRequest)

      // Should return fallback intelligence
      expect(result.id).toContain('fallback-')
      expect(result.trendAnalysis.methodology).toContain('business intelligence data')
    })

    it('should handle network errors gracefully', async () => {
      mockMarketRepo.findByUserIdAndIndustry.mockResolvedValue(null)
      mockBenchmarkRepo.findByIndustryAndSector.mockResolvedValue(null)

      // Mock network error
      ;(fetch as any).mockRejectedValue(new Error('Network error'))

      const result = await service.generateMarketIntelligence('user-123', mockRequest)

      // Should return fallback intelligence
      expect(result.id).toContain('fallback-')
      expect(result.trendAnalysis.confidence).toBe(82)
    })
  })

  describe('refreshStaleIntelligence', () => {
    it('should refresh all stale records', async () => {
      const staleRecords = [
        {
          id: 'stale-1',
          userId: 'user-1',
          industry: 'Technology',
          sector: 'Software',
          lastUpdated: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000)
        },
        {
          id: 'stale-2', 
          userId: 'user-2',
          industry: 'Healthcare',
          sector: 'Biotech',
          lastUpdated: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000)
        }
      ]

      mockMarketRepo.findStaleRecords.mockResolvedValue(staleRecords as any)
      mockMarketRepo.update.mockResolvedValue({} as any)
      mockBenchmarkRepo.findByIndustryAndSector.mockResolvedValue(null)

      ;(fetch as any).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ analysisText: 'mock analysis', fallback: false })
      })

      const refreshedCount = await service.refreshStaleIntelligence()

      expect(refreshedCount).toBe(2)
      expect(mockMarketRepo.findStaleRecords).toHaveBeenCalled()
    })

    it('should handle partial failures when refreshing', async () => {
      const staleRecords = [
        { id: 'stale-1', userId: 'user-1', industry: 'Technology', sector: 'Software' },
        { id: 'stale-2', userId: 'user-2', industry: 'Healthcare', sector: 'Biotech' }
      ]

      mockMarketRepo.findStaleRecords.mockResolvedValue(staleRecords as any)
      mockMarketRepo.update
        .mockResolvedValueOnce({} as any)  // First succeeds
        .mockRejectedValueOnce(new Error('Database error'))  // Second fails

      mockBenchmarkRepo.findByIndustryAndSector.mockResolvedValue(null)

      ;(fetch as any).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ analysisText: 'mock analysis', fallback: false })
      })

      const refreshedCount = await service.refreshStaleIntelligence()

      expect(refreshedCount).toBe(1) // Only one should succeed
    })
  })

  describe('getMarketIntelligenceForUser', () => {
    it('should retrieve all intelligence for a user', async () => {
      const userIntelligence = [
        { id: '1', userId: 'user-123', industry: 'Technology', sector: 'Software' },
        { id: '2', userId: 'user-123', industry: 'Healthcare', sector: 'Biotech' }
      ]

      mockMarketRepo.findByUserId.mockResolvedValue(userIntelligence as any)

      const result = await service.getMarketIntelligenceForUser('user-123')

      expect(result).toEqual(userIntelligence)
      expect(mockMarketRepo.findByUserId).toHaveBeenCalledWith('user-123')
    })
  })

  describe('fallback data generation', () => {
    it('should generate appropriate fallback trend analysis', () => {
      const result = service['generateFallbackTrendAnalysis'](mockRequest)

      expect(result.growth_rate).toBeTypeOf('number')
      expect(result.consolidation_index).toBeTypeOf('number')
      expect(result.disruption_indicators).toBeInstanceOf(Array)
      expect(result.market_maturity).toBeTypeOf('string')
      expect(result.confidence).toBe(82)
      expect(result.methodology).toContain('business intelligence data')
    })

    it('should generate industry-specific disruption factors', () => {
      const techRequest = { ...mockRequest, industry: 'Technology' }
      const healthcareRequest = { ...mockRequest, industry: 'Healthcare' }

      const techFactors = service['getIndustryDisruptionFactors']('Technology')
      const healthcareFactors = service['getIndustryDisruptionFactors']('Healthcare')

      expect(techFactors).toContain('AI advancement')
      expect(healthcareFactors).toContain('Telemedicine growth')
      expect(techFactors).not.toEqual(healthcareFactors)
    })

    it('should calculate appropriate positioning scores', () => {
      const highRevenueRequest = {
        ...mockRequest,
        businessData: { ...mockRequest.businessData, annualRevenue: 5000000, employeeCount: 20 }
      }

      const result = service['generateFallbackCompetitivePositioning'](highRevenueRequest, null)

      expect(result.positioning_score).toBeGreaterThan(70)
      expect(result.percentile_rank).toBeGreaterThan(50)
      expect(result.user_vs_industry.revenuePerEmployee).toBeGreaterThan(0)
    })
  })

  describe('data validation', () => {
    it('should validate recent data correctly', () => {
      const recentDate = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000) // 5 days ago
      const oldDate = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000) // 10 days ago

      expect(service['isRecentData'](recentDate)).toBe(true)
      expect(service['isRecentData'](oldDate)).toBe(false)
    })

    it('should calculate next update date correctly', () => {
      const nextUpdate = service['calculateNextUpdateDate']()
      const expectedDate = new Date()
      expectedDate.setDate(expectedDate.getDate() + 14)

      const timeDiff = Math.abs(nextUpdate.getTime() - expectedDate.getTime())
      expect(timeDiff).toBeLessThan(1000) // Within 1 second
    })
  })
})