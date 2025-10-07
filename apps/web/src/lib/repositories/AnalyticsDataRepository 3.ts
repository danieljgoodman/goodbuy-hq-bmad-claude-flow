import { PrismaClient } from '@prisma/client'
import { AnalyticsData } from '@/types'
import { BaseRepository } from './BaseRepository'

export class AnalyticsDataRepository extends BaseRepository<AnalyticsData, Omit<AnalyticsData, 'id'>, Partial<AnalyticsData>> {
  protected tableName = 'analyticsData'
  private prisma: PrismaClient

  constructor(prisma: PrismaClient) {
    super()
    this.prisma = prisma
  }

  async createAnalyticsData(data: Omit<AnalyticsData, 'id'>): Promise<AnalyticsData> {
    this.validateRequired(data.userId, 'userId')
    this.validateRequired(data.metric, 'metric')
    if (typeof data.value !== 'number' || !isFinite(data.value)) {
      throw new Error('Value must be a finite number')
    }
    const result = await this.prisma.analyticsData.create({
      data: {
        userId: data.userId,
        metric: data.metric,
        value: data.value,
        timestamp: data.timestamp,
        metadata: data.metadata,
        category: data.category.toUpperCase() as any,
        tags: data.tags
      }
    })

    return this.mapToAnalyticsData(result)
  }

  async getAnalyticsDataByUserId(
    userId: string,
    options?: {
      category?: string
      metric?: string
      startDate?: Date
      endDate?: Date
      limit?: number
    }
  ): Promise<AnalyticsData[]> {
    this.validateRequired(userId, 'userId')
    
    // Enforce limits for performance
    const limit = Math.min(options?.limit || 1000, 10000) // Max 10k records
    
    const where: any = { userId }

    if (options?.category) {
      where.category = options.category.toUpperCase()
    }
    if (options?.metric) {
      where.metric = options.metric
    }
    if (options?.startDate || options?.endDate) {
      where.timestamp = {}
      if (options.startDate) where.timestamp.gte = options.startDate
      if (options.endDate) where.timestamp.lte = options.endDate
    }

    const results = await this.prisma.analyticsData.findMany({
      where,
      orderBy: { timestamp: 'desc' },
      take: options?.limit || 100
    })

    return results.map(this.mapToAnalyticsData)
  }

  async getAnalyticsDataByMetric(
    userId: string,
    metric: string,
    timeRange: { start: Date; end: Date }
  ): Promise<AnalyticsData[]> {
    const results = await this.prisma.analyticsData.findMany({
      where: {
        userId,
        metric,
        timestamp: {
          gte: timeRange.start,
          lte: timeRange.end
        }
      },
      orderBy: { timestamp: 'asc' }
    })

    return results.map(this.mapToAnalyticsData)
  }

  async getTimeSeriesData(
    userId: string,
    metrics: string[],
    timeRange: { start: Date; end: Date }
  ): Promise<Record<string, AnalyticsData[]>> {
    const results = await this.prisma.analyticsData.findMany({
      where: {
        userId,
        metric: { in: metrics },
        timestamp: {
          gte: timeRange.start,
          lte: timeRange.end
        }
      },
      orderBy: { timestamp: 'asc' }
    })

    const grouped = results.reduce((acc, item) => {
      const data = this.mapToAnalyticsData(item)
      if (!acc[data.metric]) acc[data.metric] = []
      acc[data.metric].push(data)
      return acc
    }, {} as Record<string, AnalyticsData[]>)

    return grouped
  }

  async deleteAnalyticsData(id: string): Promise<void> {
    await this.prisma.analyticsData.delete({
      where: { id }
    })
  }

  async bulkCreateAnalyticsData(data: Omit<AnalyticsData, 'id' | 'createdAt' | 'updatedAt'>[]): Promise<number> {
    const result = await this.prisma.analyticsData.createMany({
      data: data.map(item => ({
        userId: item.userId,
        metric: item.metric,
        value: item.value,
        timestamp: item.timestamp,
        metadata: item.metadata,
        category: item.category.toUpperCase() as any,
        tags: item.tags
      }))
    })

    return result.count
  }

  private mapToAnalyticsData(data: any): AnalyticsData {
    return {
      id: data.id,
      userId: data.userId,
      metric: data.metric,
      value: data.value,
      timestamp: data.timestamp,
      metadata: data.metadata,
      category: data.category.toLowerCase() as any,
      tags: data.tags
    }
  }
}