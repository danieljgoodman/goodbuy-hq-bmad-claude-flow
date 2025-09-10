import { prisma } from '../prisma'
import { MarketIntelligence, MarketAlert } from '../../types'

export class MarketIntelligenceRepository {
  async findByUserId(userId: string): Promise<MarketIntelligence[]> {
    if (!userId) {
      throw new Error('userId is required')
    }

    const records = await prisma.marketIntelligence.findMany({
      where: { userId },
      orderBy: { lastUpdated: 'desc' },
      take: 50 // Limit results for performance
    })

    return records.map(record => ({
      id: record.id,
      userId: record.userId,
      industry: record.industry,
      sector: record.sector,
      trendAnalysis: record.trendAnalysis as MarketIntelligence['trendAnalysis'],
      competitivePositioning: record.competitivePositioning as MarketIntelligence['competitivePositioning'],
      opportunities: record.opportunities as MarketIntelligence['opportunities'],
      lastUpdated: record.lastUpdated,
      nextUpdate: record.nextUpdate
    }))
  }

  async findByUserIdAndIndustry(userId: string, industry: string, sector: string): Promise<MarketIntelligence | null> {
    const record = await prisma.marketIntelligence.findUnique({
      where: {
        userId_industry_sector: {
          userId,
          industry,
          sector
        }
      }
    })

    if (!record) return null

    return {
      id: record.id,
      userId: record.userId,
      industry: record.industry,
      sector: record.sector,
      trendAnalysis: record.trendAnalysis as MarketIntelligence['trendAnalysis'],
      competitivePositioning: record.competitivePositioning as MarketIntelligence['competitivePositioning'],
      opportunities: record.opportunities as MarketIntelligence['opportunities'],
      lastUpdated: record.lastUpdated,
      nextUpdate: record.nextUpdate
    }
  }

  async create(marketIntelligence: Omit<MarketIntelligence, 'id'>): Promise<MarketIntelligence> {
    const record = await prisma.marketIntelligence.create({
      data: {
        userId: marketIntelligence.userId,
        industry: marketIntelligence.industry,
        sector: marketIntelligence.sector,
        trendAnalysis: marketIntelligence.trendAnalysis,
        competitivePositioning: marketIntelligence.competitivePositioning,
        opportunities: marketIntelligence.opportunities,
        lastUpdated: marketIntelligence.lastUpdated,
        nextUpdate: marketIntelligence.nextUpdate
      }
    })

    return {
      id: record.id,
      userId: record.userId,
      industry: record.industry,
      sector: record.sector,
      trendAnalysis: record.trendAnalysis as MarketIntelligence['trendAnalysis'],
      competitivePositioning: record.competitivePositioning as MarketIntelligence['competitivePositioning'],
      opportunities: record.opportunities as MarketIntelligence['opportunities'],
      lastUpdated: record.lastUpdated,
      nextUpdate: record.nextUpdate
    }
  }

  async update(id: string, updates: Partial<Omit<MarketIntelligence, 'id' | 'userId'>>): Promise<MarketIntelligence> {
    const record = await prisma.marketIntelligence.update({
      where: { id },
      data: updates
    })

    return {
      id: record.id,
      userId: record.userId,
      industry: record.industry,
      sector: record.sector,
      trendAnalysis: record.trendAnalysis as MarketIntelligence['trendAnalysis'],
      competitivePositioning: record.competitivePositioning as MarketIntelligence['competitivePositioning'],
      opportunities: record.opportunities as MarketIntelligence['opportunities'],
      lastUpdated: record.lastUpdated,
      nextUpdate: record.nextUpdate
    }
  }

  async delete(id: string): Promise<void> {
    await prisma.marketIntelligence.delete({
      where: { id }
    })
  }

  async findStaleRecords(cutoffDate: Date): Promise<MarketIntelligence[]> {
    const records = await prisma.marketIntelligence.findMany({
      where: {
        nextUpdate: {
          lte: cutoffDate
        }
      },
      orderBy: { nextUpdate: 'asc' }
    })

    return records.map(record => ({
      id: record.id,
      userId: record.userId,
      industry: record.industry,
      sector: record.sector,
      trendAnalysis: record.trendAnalysis as MarketIntelligence['trendAnalysis'],
      competitivePositioning: record.competitivePositioning as MarketIntelligence['competitivePositioning'],
      opportunities: record.opportunities as MarketIntelligence['opportunities'],
      lastUpdated: record.lastUpdated,
      nextUpdate: record.nextUpdate
    }))
  }
}