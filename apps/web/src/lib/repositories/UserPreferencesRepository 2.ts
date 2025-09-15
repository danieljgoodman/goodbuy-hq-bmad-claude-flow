import { prisma } from '../prisma'
import { UserPreferences } from '../../types'

export class UserPreferencesRepository {
  async findByUserId(userId: string): Promise<UserPreferences | null> {
    const record = await prisma.userPreferences.findUnique({
      where: { userId }
    })

    if (!record) return null

    return {
      id: record.id,
      userId: record.userId,
      notifications: record.notifications as UserPreferences['notifications'],
      privacy: record.privacy as UserPreferences['privacy'],
      dashboard: record.dashboard as UserPreferences['dashboard'],
      updatedAt: record.updatedAt
    }
  }

  async create(preferences: Omit<UserPreferences, 'id' | 'updatedAt'>): Promise<UserPreferences> {
    const record = await prisma.userPreferences.create({
      data: {
        userId: preferences.userId,
        notifications: preferences.notifications,
        privacy: preferences.privacy,
        dashboard: preferences.dashboard
      }
    })

    return {
      id: record.id,
      userId: record.userId,
      notifications: record.notifications as UserPreferences['notifications'],
      privacy: record.privacy as UserPreferences['privacy'],
      dashboard: record.dashboard as UserPreferences['dashboard'],
      updatedAt: record.updatedAt
    }
  }

  async update(userId: string, updates: Partial<Omit<UserPreferences, 'id' | 'userId' | 'updatedAt'>>): Promise<UserPreferences> {
    const record = await prisma.userPreferences.update({
      where: { userId },
      data: updates
    })

    return {
      id: record.id,
      userId: record.userId,
      notifications: record.notifications as UserPreferences['notifications'],
      privacy: record.privacy as UserPreferences['privacy'],
      dashboard: record.dashboard as UserPreferences['dashboard'],
      updatedAt: record.updatedAt
    }
  }

  async upsert(preferences: Omit<UserPreferences, 'id' | 'updatedAt'>): Promise<UserPreferences> {
    const record = await prisma.userPreferences.upsert({
      where: { userId: preferences.userId },
      update: {
        notifications: preferences.notifications,
        privacy: preferences.privacy,
        dashboard: preferences.dashboard
      },
      create: {
        userId: preferences.userId,
        notifications: preferences.notifications,
        privacy: preferences.privacy,
        dashboard: preferences.dashboard
      }
    })

    return {
      id: record.id,
      userId: record.userId,
      notifications: record.notifications as UserPreferences['notifications'],
      privacy: record.privacy as UserPreferences['privacy'],
      dashboard: record.dashboard as UserPreferences['dashboard'],
      updatedAt: record.updatedAt
    }
  }

  async updateNotifications(userId: string, notifications: UserPreferences['notifications']): Promise<UserPreferences> {
    const record = await prisma.userPreferences.update({
      where: { userId },
      data: { notifications }
    })

    return {
      id: record.id,
      userId: record.userId,
      notifications: record.notifications as UserPreferences['notifications'],
      privacy: record.privacy as UserPreferences['privacy'],
      dashboard: record.dashboard as UserPreferences['dashboard'],
      updatedAt: record.updatedAt
    }
  }

  async updatePrivacy(userId: string, privacy: UserPreferences['privacy']): Promise<UserPreferences> {
    const record = await prisma.userPreferences.update({
      where: { userId },
      data: { privacy }
    })

    return {
      id: record.id,
      userId: record.userId,
      notifications: record.notifications as UserPreferences['notifications'],
      privacy: record.privacy as UserPreferences['privacy'],
      dashboard: record.dashboard as UserPreferences['dashboard'],
      updatedAt: record.updatedAt
    }
  }

  async updateDashboard(userId: string, dashboard: UserPreferences['dashboard']): Promise<UserPreferences> {
    const record = await prisma.userPreferences.update({
      where: { userId },
      data: { dashboard }
    })

    return {
      id: record.id,
      userId: record.userId,
      notifications: record.notifications as UserPreferences['notifications'],
      privacy: record.privacy as UserPreferences['privacy'],
      dashboard: record.dashboard as UserPreferences['dashboard'],
      updatedAt: record.updatedAt
    }
  }

  async delete(userId: string): Promise<void> {
    await prisma.userPreferences.delete({
      where: { userId }
    })
  }

  // Get default preferences for new users
  static getDefaultPreferences(userId: string): Omit<UserPreferences, 'id' | 'updatedAt'> {
    return {
      userId,
      notifications: {
        email_updates: true,
        platform_alerts: true,
        market_intelligence: true,
        improvement_reminders: true,
        billing_updates: true
      },
      privacy: {
        data_sharing_analytics: false,
        data_sharing_marketing: false,
        public_profile: false
      },
      dashboard: {
        default_view: 'dashboard',
        chart_preferences: {}
      }
    }
  }
}