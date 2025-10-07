import { prisma } from '../prisma'
import { MarketAlert } from '../../types'

export class MarketAlertRepository {
  async findByUserId(userId: string, includeExpired = false): Promise<MarketAlert[]> {
    const whereClause: any = { userId, dismissed: false }
    
    if (!includeExpired) {
      whereClause.OR = [
        { expiresAt: null },
        { expiresAt: { gt: new Date() } }
      ]
    }

    const records = await prisma.marketAlert.findMany({
      where: whereClause,
      orderBy: [
        { severity: 'desc' },
        { createdAt: 'desc' }
      ]
    })

    return records.map(record => ({
      id: record.id,
      userId: record.userId,
      title: record.title,
      description: record.description,
      severity: record.severity.toLowerCase() as MarketAlert['severity'],
      category: record.category.toLowerCase() as MarketAlert['category'],
      triggerData: record.triggerData as Record<string, any>,
      actionable: record.actionable,
      dismissed: record.dismissed,
      createdAt: record.createdAt,
      expiresAt: record.expiresAt || undefined
    }))
  }

  async create(alert: Omit<MarketAlert, 'id'>): Promise<MarketAlert> {
    const record = await prisma.marketAlert.create({
      data: {
        userId: alert.userId,
        title: alert.title,
        description: alert.description,
        severity: alert.severity.toUpperCase() as any,
        category: alert.category.toUpperCase() as any,
        triggerData: alert.triggerData,
        actionable: alert.actionable,
        dismissed: alert.dismissed,
        expiresAt: alert.expiresAt || null
      }
    })

    return {
      id: record.id,
      userId: record.userId,
      title: record.title,
      description: record.description,
      severity: record.severity.toLowerCase() as MarketAlert['severity'],
      category: record.category.toLowerCase() as MarketAlert['category'],
      triggerData: record.triggerData as Record<string, any>,
      actionable: record.actionable,
      dismissed: record.dismissed,
      createdAt: record.createdAt,
      expiresAt: record.expiresAt || undefined
    }
  }

  async dismiss(id: string): Promise<void> {
    await prisma.marketAlert.update({
      where: { id },
      data: { dismissed: true }
    })
  }

  async markAsRead(id: string): Promise<void> {
    await prisma.marketAlert.update({
      where: { id },
      data: { actionable: false }
    })
  }

  async deleteExpired(): Promise<number> {
    const result = await prisma.marketAlert.deleteMany({
      where: {
        expiresAt: {
          lt: new Date()
        }
      }
    })

    return result.count
  }

  async findBySeverity(userId: string, severity: MarketAlert['severity']): Promise<MarketAlert[]> {
    const records = await prisma.marketAlert.findMany({
      where: {
        userId,
        severity: severity.toUpperCase() as any,
        dismissed: false
      },
      orderBy: { createdAt: 'desc' }
    })

    return records.map(record => ({
      id: record.id,
      userId: record.userId,
      title: record.title,
      description: record.description,
      severity: record.severity.toLowerCase() as MarketAlert['severity'],
      category: record.category.toLowerCase() as MarketAlert['category'],
      triggerData: record.triggerData as Record<string, any>,
      actionable: record.actionable,
      dismissed: record.dismissed,
      createdAt: record.createdAt,
      expiresAt: record.expiresAt || undefined
    }))
  }

  async findByCategory(userId: string, category: MarketAlert['category']): Promise<MarketAlert[]> {
    const records = await prisma.marketAlert.findMany({
      where: {
        userId,
        category: category.toUpperCase() as any,
        dismissed: false
      },
      orderBy: { createdAt: 'desc' }
    })

    return records.map(record => ({
      id: record.id,
      userId: record.userId,
      title: record.title,
      description: record.description,
      severity: record.severity.toLowerCase() as MarketAlert['severity'],
      category: record.category.toLowerCase() as MarketAlert['category'],
      triggerData: record.triggerData as Record<string, any>,
      actionable: record.actionable,
      dismissed: record.dismissed,
      createdAt: record.createdAt,
      expiresAt: record.expiresAt || undefined
    }))
  }

  async getActiveAlertsCount(userId: string): Promise<number> {
    return prisma.marketAlert.count({
      where: {
        userId,
        dismissed: false,
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: new Date() } }
        ]
      }
    })
  }
}