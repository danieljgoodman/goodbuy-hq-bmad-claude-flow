import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { MarketIntelligenceRepository } from '../../lib/repositories/MarketIntelligenceRepository'
import { MarketIntelligence } from '../../types'

// Mock Prisma
const mockPrisma = {
  marketIntelligence: {
    findMany: vi.fn(),
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  }
}

vi.mock('../../lib/prisma', () => ({
  prisma: mockPrisma
}))

describe('MarketIntelligenceRepository', () => {
  let repository: MarketIntelligenceRepository

  const mockMarketIntelligence = {
    id: 'test-id',
    userId: 'user-123',
    industry: 'Technology',
    sector: 'Software',
    trendAnalysis: {
      growth_rate: 10,
      consolidation_index: 45,
      disruption_indicators: ['AI advancement', 'Cloud migration'],
      market_maturity: 'Growth'
    },
    competitivePositioning: {
      positioning_score: 75,
      industry_avg_metrics: { revenuePerEmployee: 150000 },
      user_vs_industry: { revenuePerEmployee: 10 },
      top_performer_gap: { revenuePerEmployee: 75000 }
    },
    opportunities: [
      {
        id: 'opp-1',
        title: 'Digital Expansion',
        description: 'Expand digital presence',
        impact_score: 85,
        feasibility_score: 75,
        trends: ['Digital transformation']
      }
    ],
    lastUpdated: new Date('2024-01-15'),
    nextUpdate: new Date('2024-01-29'),
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-15')
  }

  beforeEach(() => {
    vi.clearAllMocks()
    repository = new MarketIntelligenceRepository()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('findByUserId', () => {
    it('should return market intelligence records for a user', async () => {
      mockPrisma.marketIntelligence.findMany.mockResolvedValue([mockMarketIntelligence])

      const result = await repository.findByUserId('user-123')

      expect(mockPrisma.marketIntelligence.findMany).toHaveBeenCalledWith({
        where: { userId: 'user-123' },
        orderBy: { lastUpdated: 'desc' }
      })
      expect(result).toHaveLength(1)
      expect(result[0].id).toBe('test-id')
      expect(result[0].trendAnalysis.growth_rate).toBe(10)
    })

    it('should return empty array when no records found', async () => {
      mockPrisma.marketIntelligence.findMany.mockResolvedValue([])

      const result = await repository.findByUserId('user-456')

      expect(result).toEqual([])
    })
  })

  describe('findByUserIdAndIndustry', () => {
    it('should return specific intelligence record', async () => {
      mockPrisma.marketIntelligence.findUnique.mockResolvedValue(mockMarketIntelligence)

      const result = await repository.findByUserIdAndIndustry('user-123', 'Technology', 'Software')

      expect(mockPrisma.marketIntelligence.findUnique).toHaveBeenCalledWith({
        where: {
          userId_industry_sector: {
            userId: 'user-123',
            industry: 'Technology',
            sector: 'Software'
          }
        }
      })
      expect(result?.id).toBe('test-id')
      expect(result?.industry).toBe('Technology')
    })

    it('should return null when record not found', async () => {
      mockPrisma.marketIntelligence.findUnique.mockResolvedValue(null)

      const result = await repository.findByUserIdAndIndustry('user-123', 'Healthcare', 'Biotech')

      expect(result).toBeNull()
    })
  })

  describe('create', () => {
    it('should create new market intelligence record', async () => {
      const createData = {
        userId: 'user-123',
        industry: 'Technology',
        sector: 'Software',
        trendAnalysis: mockMarketIntelligence.trendAnalysis,
        competitivePositioning: mockMarketIntelligence.competitivePositioning,
        opportunities: mockMarketIntelligence.opportunities,
        lastUpdated: new Date(),
        nextUpdate: new Date()
      }

      mockPrisma.marketIntelligence.create.mockResolvedValue({
        id: 'new-id',
        ...createData,
        createdAt: new Date(),
        updatedAt: new Date()
      })

      const result = await repository.create(createData)

      expect(mockPrisma.marketIntelligence.create).toHaveBeenCalledWith({
        data: createData
      })
      expect(result.id).toBe('new-id')
      expect(result.userId).toBe('user-123')
    })
  })

  describe('update', () => {
    it('should update existing market intelligence record', async () => {
      const updates = {
        trendAnalysis: { ...mockMarketIntelligence.trendAnalysis, growth_rate: 12 },
        lastUpdated: new Date()
      }

      mockPrisma.marketIntelligence.update.mockResolvedValue({
        ...mockMarketIntelligence,
        ...updates
      })

      const result = await repository.update('test-id', updates)

      expect(mockPrisma.marketIntelligence.update).toHaveBeenCalledWith({
        where: { id: 'test-id' },
        data: updates
      })
      expect(result.trendAnalysis.growth_rate).toBe(12)
    })
  })

  describe('delete', () => {
    it('should delete market intelligence record', async () => {
      mockPrisma.marketIntelligence.delete.mockResolvedValue(mockMarketIntelligence)

      await repository.delete('test-id')

      expect(mockPrisma.marketIntelligence.delete).toHaveBeenCalledWith({
        where: { id: 'test-id' }
      })
    })
  })

  describe('findStaleRecords', () => {
    it('should return records needing updates', async () => {
      const cutoffDate = new Date()
      const staleRecord = {
        ...mockMarketIntelligence,
        nextUpdate: new Date(Date.now() - 24 * 60 * 60 * 1000) // Yesterday
      }

      mockPrisma.marketIntelligence.findMany.mockResolvedValue([staleRecord])

      const result = await repository.findStaleRecords(cutoffDate)

      expect(mockPrisma.marketIntelligence.findMany).toHaveBeenCalledWith({
        where: {
          nextUpdate: {
            lte: cutoffDate
          }
        },
        orderBy: { nextUpdate: 'asc' }
      })
      expect(result).toHaveLength(1)
      expect(result[0].id).toBe('test-id')
    })

    it('should return empty array when no stale records', async () => {
      mockPrisma.marketIntelligence.findMany.mockResolvedValue([])

      const result = await repository.findStaleRecords(new Date())

      expect(result).toEqual([])
    })
  })

  describe('data transformation', () => {
    it('should properly transform JSON fields', async () => {
      mockPrisma.marketIntelligence.findUnique.mockResolvedValue(mockMarketIntelligence)

      const result = await repository.findByUserIdAndIndustry('user-123', 'Technology', 'Software')

      expect(result?.trendAnalysis).toEqual(mockMarketIntelligence.trendAnalysis)
      expect(result?.competitivePositioning).toEqual(mockMarketIntelligence.competitivePositioning)
      expect(result?.opportunities).toEqual(mockMarketIntelligence.opportunities)
    })

    it('should handle date transformations correctly', async () => {
      mockPrisma.marketIntelligence.findUnique.mockResolvedValue(mockMarketIntelligence)

      const result = await repository.findByUserIdAndIndustry('user-123', 'Technology', 'Software')

      expect(result?.lastUpdated).toBeInstanceOf(Date)
      expect(result?.nextUpdate).toBeInstanceOf(Date)
    })
  })

  describe('error handling', () => {
    it('should propagate database errors', async () => {
      const dbError = new Error('Database connection failed')
      mockPrisma.marketIntelligence.findMany.mockRejectedValue(dbError)

      await expect(repository.findByUserId('user-123')).rejects.toThrow('Database connection failed')
    })

    it('should handle constraint violations on create', async () => {
      const constraintError = new Error('Unique constraint violation')
      mockPrisma.marketIntelligence.create.mockRejectedValue(constraintError)

      const createData = {
        userId: 'user-123',
        industry: 'Technology',
        sector: 'Software',
        trendAnalysis: {},
        competitivePositioning: {},
        opportunities: [],
        lastUpdated: new Date(),
        nextUpdate: new Date()
      }

      await expect(repository.create(createData)).rejects.toThrow('Unique constraint violation')
    })
  })
})