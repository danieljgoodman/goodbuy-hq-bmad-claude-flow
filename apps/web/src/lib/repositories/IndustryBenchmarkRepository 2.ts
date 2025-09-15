import { prisma } from '../prisma'
import { IndustryBenchmark } from '../../types'

export class IndustryBenchmarkRepository {
  async findByIndustryAndSector(industry: string, sector: string): Promise<IndustryBenchmark | null> {
    const record = await prisma.industryBenchmark.findUnique({
      where: {
        industry_sector: {
          industry,
          sector
        }
      }
    })

    if (!record) return null

    return {
      id: record.id,
      industry: record.industry,
      sector: record.sector,
      metrics: record.metrics as IndustryBenchmark['metrics'],
      sample_size: record.sampleSize,
      last_updated: record.lastUpdated
    }
  }

  async findByIndustry(industry: string): Promise<IndustryBenchmark[]> {
    const records = await prisma.industryBenchmark.findMany({
      where: { industry },
      orderBy: { lastUpdated: 'desc' }
    })

    return records.map(record => ({
      id: record.id,
      industry: record.industry,
      sector: record.sector,
      metrics: record.metrics as IndustryBenchmark['metrics'],
      sample_size: record.sampleSize,
      last_updated: record.lastUpdated
    }))
  }

  async create(benchmark: Omit<IndustryBenchmark, 'id'>): Promise<IndustryBenchmark> {
    const record = await prisma.industryBenchmark.create({
      data: {
        industry: benchmark.industry,
        sector: benchmark.sector,
        metrics: benchmark.metrics,
        sampleSize: benchmark.sample_size,
        lastUpdated: benchmark.last_updated
      }
    })

    return {
      id: record.id,
      industry: record.industry,
      sector: record.sector,
      metrics: record.metrics as IndustryBenchmark['metrics'],
      sample_size: record.sampleSize,
      last_updated: record.lastUpdated
    }
  }

  async update(id: string, updates: Partial<Omit<IndustryBenchmark, 'id'>>): Promise<IndustryBenchmark> {
    const updateData: any = {}
    
    if (updates.industry !== undefined) updateData.industry = updates.industry
    if (updates.sector !== undefined) updateData.sector = updates.sector
    if (updates.metrics !== undefined) updateData.metrics = updates.metrics
    if (updates.sample_size !== undefined) updateData.sampleSize = updates.sample_size
    if (updates.last_updated !== undefined) updateData.lastUpdated = updates.last_updated

    const record = await prisma.industryBenchmark.update({
      where: { id },
      data: updateData
    })

    return {
      id: record.id,
      industry: record.industry,
      sector: record.sector,
      metrics: record.metrics as IndustryBenchmark['metrics'],
      sample_size: record.sampleSize,
      last_updated: record.lastUpdated
    }
  }

  async delete(id: string): Promise<void> {
    await prisma.industryBenchmark.delete({
      where: { id }
    })
  }

  async findStale(cutoffDate: Date): Promise<IndustryBenchmark[]> {
    const records = await prisma.industryBenchmark.findMany({
      where: {
        lastUpdated: {
          lt: cutoffDate
        }
      },
      orderBy: { lastUpdated: 'asc' }
    })

    return records.map(record => ({
      id: record.id,
      industry: record.industry,
      sector: record.sector,
      metrics: record.metrics as IndustryBenchmark['metrics'],
      sample_size: record.sampleSize,
      last_updated: record.lastUpdated
    }))
  }

  async getAllIndustries(): Promise<string[]> {
    const industries = await prisma.industryBenchmark.findMany({
      select: { industry: true },
      distinct: ['industry']
    })

    return industries.map(i => i.industry)
  }

  async getSectorsByIndustry(industry: string): Promise<string[]> {
    const sectors = await prisma.industryBenchmark.findMany({
      where: { industry },
      select: { sector: true },
      distinct: ['sector']
    })

    return sectors.map(s => s.sector)
  }
}