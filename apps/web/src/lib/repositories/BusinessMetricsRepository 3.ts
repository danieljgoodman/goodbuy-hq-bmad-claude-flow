import { PrismaClient } from '@prisma/client'
import { BusinessMetrics } from '@/types'

export class BusinessMetricsRepository {
  private prisma: PrismaClient

  constructor(prisma: PrismaClient) {
    this.prisma = prisma
  }

  async createBusinessMetrics(data: Omit<BusinessMetrics, 'id' | 'createdAt' | 'updatedAt'>): Promise<BusinessMetrics> {
    const result = await this.prisma.businessMetrics.create({
      data: {
        userId: data.userId,
        period: data.period,
        metrics: data.metrics,
        industryBenchmarks: data.industry_benchmarks,
        goals: data.goals,
        improvementsImplemented: data.improvements_implemented,
        calculatedAt: data.calculatedAt
      }
    })

    return this.mapToBusinessMetrics(result)
  }

  async getBusinessMetricsByUserId(userId: string, limit?: number): Promise<BusinessMetrics[]> {
    const results = await this.prisma.businessMetrics.findMany({
      where: { userId },
      orderBy: { period: 'desc' },
      take: limit || 12
    })

    return results.map(this.mapToBusinessMetrics)
  }

  async getBusinessMetricsByPeriod(
    userId: string,
    startDate: Date,
    endDate: Date
  ): Promise<BusinessMetrics[]> {
    const results = await this.prisma.businessMetrics.findMany({
      where: {
        userId,
        period: {
          gte: startDate,
          lte: endDate
        }
      },
      orderBy: { period: 'asc' }
    })

    return results.map(this.mapToBusinessMetrics)
  }

  async getLatestBusinessMetrics(userId: string): Promise<BusinessMetrics | null> {
    const result = await this.prisma.businessMetrics.findFirst({
      where: { userId },
      orderBy: { period: 'desc' }
    })

    return result ? this.mapToBusinessMetrics(result) : null
  }

  async updateBusinessMetrics(
    id: string,
    updates: Partial<Omit<BusinessMetrics, 'id' | 'userId' | 'createdAt' | 'updatedAt'>>
  ): Promise<BusinessMetrics> {
    const result = await this.prisma.businessMetrics.update({
      where: { id },
      data: {
        ...(updates.period && { period: updates.period }),
        ...(updates.metrics && { metrics: updates.metrics }),
        ...(updates.industry_benchmarks && { industryBenchmarks: updates.industry_benchmarks }),
        ...(updates.goals && { goals: updates.goals }),
        ...(updates.improvements_implemented && { improvementsImplemented: updates.improvements_implemented }),
        ...(updates.calculatedAt && { calculatedAt: updates.calculatedAt })
      }
    })

    return this.mapToBusinessMetrics(result)
  }

  async deleteBusinessMetrics(id: string): Promise<void> {
    await this.prisma.businessMetrics.delete({
      where: { id }
    })
  }

  async getMetricTrend(
    userId: string,
    metricName: string,
    periods: number = 12
  ): Promise<{ period: Date; value: number }[]> {
    const results = await this.prisma.businessMetrics.findMany({
      where: { userId },
      orderBy: { period: 'desc' },
      take: periods
    })

    return results
      .map(result => {
        const metrics = result.metrics as Record<string, number>
        return {
          period: result.period,
          value: metrics[metricName] || 0
        }
      })
      .reverse() // Show chronological order
  }

  async getPerformanceComparison(
    userId: string,
    metricNames: string[]
  ): Promise<{
    current: Record<string, number>
    previous: Record<string, number>
    industry: Record<string, number>
    goals: Record<string, number>
  }> {
    const results = await this.prisma.businessMetrics.findMany({
      where: { userId },
      orderBy: { period: 'desc' },
      take: 2
    })

    if (results.length === 0) {
      return {
        current: {},
        previous: {},
        industry: {},
        goals: {}
      }
    }

    const current = results[0]
    const previous = results[1]

    const currentMetrics = current.metrics as Record<string, number>
    const previousMetrics = previous?.metrics as Record<string, number> || {}
    const industryBenchmarks = current.industryBenchmarks as Record<string, number>
    const goals = current.goals as Record<string, number>

    return {
      current: this.extractMetrics(currentMetrics, metricNames),
      previous: this.extractMetrics(previousMetrics, metricNames),
      industry: this.extractMetrics(industryBenchmarks, metricNames),
      goals: this.extractMetrics(goals, metricNames)
    }
  }

  private extractMetrics(source: Record<string, number>, metricNames: string[]): Record<string, number> {
    const result: Record<string, number> = {}
    metricNames.forEach(name => {
      result[name] = source[name] || 0
    })
    return result
  }

  private mapToBusinessMetrics(data: any): BusinessMetrics {
    return {
      id: data.id,
      userId: data.userId,
      period: data.period,
      metrics: data.metrics,
      industry_benchmarks: data.industryBenchmarks,
      goals: data.goals,
      improvements_implemented: data.improvementsImplemented,
      calculatedAt: data.calculatedAt
    }
  }
}