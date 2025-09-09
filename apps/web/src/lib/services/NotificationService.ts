import { PrismaClient } from '@prisma/client'
import { EmailService } from './EmailService'
import { PremiumAccessService } from './PremiumAccessService'

const prisma = new PrismaClient()

export interface NotificationPreferences {
  userId: string
  emailNotifications: {
    opportunities: boolean
    reminders: boolean
    reports: boolean
    milestones: boolean
  }
  frequency: 'immediate' | 'daily' | 'weekly' | 'monthly'
  reminderCadence: 'daily' | 'weekly' | 'bi-weekly'
  quietHours: { start: string; end: string }
  updatedAt: Date
}

export interface AIOpportunity {
  id: string
  userId: string
  type: 'improvement' | 'risk_alert' | 'trend_change' | 'milestone'
  title: string
  description: string
  priority: 'low' | 'medium' | 'high' | 'urgent'
  actionRequired: boolean
  relatedEvaluationId?: string
  aiConfidence: number
  detectedAt: Date
  status: 'new' | 'viewed' | 'acted_upon' | 'dismissed'
}

export interface InAppNotification {
  id: string
  userId: string
  type: 'opportunity' | 'reminder' | 'milestone' | 'report' | 'system'
  title: string
  message: string
  actionUrl?: string
  actionLabel?: string
  priority: 'low' | 'medium' | 'high' | 'urgent'
  isRead: boolean
  createdAt: Date
  readAt?: Date
  expiresAt?: Date
}

export interface NotificationDelivery {
  id: string
  notificationId: string
  channel: 'email' | 'in_app' | 'push'
  status: 'sent' | 'delivered' | 'opened' | 'clicked' | 'failed'
  sentAt: Date
  deliveredAt?: Date
  openedAt?: Date
  clickedAt?: Date
  failureReason?: string
}

export class NotificationService {
  /**
   * Get user notification preferences
   */
  static async getNotificationPreferences(userId: string): Promise<NotificationPreferences> {
    try {
      // For now, return default preferences - in production would be stored in database
      return {
        userId,
        emailNotifications: {
          opportunities: true,
          reminders: true,
          reports: true,
          milestones: true
        },
        frequency: 'daily',
        reminderCadence: 'weekly',
        quietHours: { start: '22:00', end: '08:00' },
        updatedAt: new Date()
      }
    } catch (error) {
      console.error('Error getting notification preferences:', error)
      throw error
    }
  }

  /**
   * Update user notification preferences
   */
  static async updateNotificationPreferences(
    userId: string,
    preferences: Partial<NotificationPreferences>
  ): Promise<NotificationPreferences> {
    try {
      // In production, would update database record
      const current = await this.getNotificationPreferences(userId)
      
      const updated: NotificationPreferences = {
        ...current,
        ...preferences,
        userId,
        updatedAt: new Date()
      }

      return updated
    } catch (error) {
      console.error('Error updating notification preferences:', error)
      throw error
    }
  }

  /**
   * Get in-app notifications for user
   */
  static async getInAppNotifications(
    userId: string,
    options: {
      page?: number
      limit?: number
      unreadOnly?: boolean
      type?: string
    } = {}
  ): Promise<{
    notifications: InAppNotification[]
    total: number
    unreadCount: number
  }> {
    try {
      // Mock data - in production would query database
      const mockNotifications: InAppNotification[] = [
        {
          id: 'notif_1',
          userId,
          type: 'opportunity',
          title: 'New Improvement Opportunity Detected',
          message: 'AI analysis has identified potential operational efficiency improvements based on your latest evaluation.',
          actionUrl: '/guides',
          actionLabel: 'View Recommendations',
          priority: 'high',
          isRead: false,
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
        },
        {
          id: 'notif_2',
          userId,
          type: 'reminder',
          title: 'Implementation Step Reminder',
          message: 'You have 3 pending implementation steps from your current improvement plan.',
          actionUrl: '/guides',
          actionLabel: 'Continue Implementation',
          priority: 'medium',
          isRead: false,
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
        },
        {
          id: 'notif_3',
          userId,
          type: 'milestone',
          title: 'Milestone Achievement!',
          message: 'Congratulations! You\'ve completed 75% of your current improvement initiatives.',
          actionUrl: '/analytics',
          actionLabel: 'View Progress',
          priority: 'medium',
          isRead: true,
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3), // 3 days ago
          readAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2)
        }
      ]

      const { page = 1, limit = 10, unreadOnly = false, type } = options
      
      let filtered = mockNotifications
      if (unreadOnly) {
        filtered = filtered.filter(n => !n.isRead)
      }
      if (type) {
        filtered = filtered.filter(n => n.type === type)
      }

      const start = (page - 1) * limit
      const end = start + limit
      const paginatedNotifications = filtered.slice(start, end)

      return {
        notifications: paginatedNotifications,
        total: filtered.length,
        unreadCount: mockNotifications.filter(n => !n.isRead).length
      }
    } catch (error) {
      console.error('Error getting in-app notifications:', error)
      throw error
    }
  }

  /**
   * Mark notifications as read
   */
  static async markNotificationsAsRead(
    userId: string,
    notificationIds: string[]
  ): Promise<{ success: boolean; markedCount: number }> {
    try {
      // In production, would update database records
      return {
        success: true,
        markedCount: notificationIds.length
      }
    } catch (error) {
      console.error('Error marking notifications as read:', error)
      throw error
    }
  }

  /**
   * Create and send notification
   */
  static async createNotification(
    userId: string,
    notification: Omit<InAppNotification, 'id' | 'userId' | 'isRead' | 'createdAt'>
  ): Promise<InAppNotification> {
    try {
      const newNotification: InAppNotification = {
        id: `notif_${userId}_${Date.now()}`,
        userId,
        isRead: false,
        createdAt: new Date(),
        ...notification
      }

      // Check if user has premium access for email notifications
      const accessCheck = await PremiumAccessService.checkAIFeatureAccess(userId)
      
      if (accessCheck.hasAccess) {
        // Send email if user preferences allow it
        const preferences = await this.getNotificationPreferences(userId)
        if (this.shouldSendEmailNotification(notification.type, preferences)) {
          await this.sendEmailNotification(userId, newNotification)
        }
      }

      return newNotification
    } catch (error) {
      console.error('Error creating notification:', error)
      throw error
    }
  }

  /**
   * Send email notification
   */
  private static async sendEmailNotification(
    userId: string,
    notification: InAppNotification
  ): Promise<void> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId }
      })

      if (!user || !user.email) {
        console.error('User not found or no email address')
        return
      }

      await EmailService.sendNotificationEmail(
        user.email,
        notification.title,
        notification.message,
        notification.actionUrl || ''
      )
    } catch (error) {
      console.error('Error sending email notification:', error)
      // Don't throw error - notification should still be created even if email fails
    }
  }

  /**
   * Check if email notification should be sent based on preferences
   */
  private static shouldSendEmailNotification(
    notificationType: string,
    preferences: NotificationPreferences
  ): boolean {
    // Check quiet hours
    const now = new Date()
    const currentTime = now.toTimeString().slice(0, 5) // HH:MM format
    const quietStart = preferences.quietHours.start
    const quietEnd = preferences.quietHours.end
    
    if (currentTime >= quietStart || currentTime <= quietEnd) {
      return false
    }

    // Check notification type preferences
    switch (notificationType) {
      case 'opportunity':
        return preferences.emailNotifications.opportunities
      case 'reminder':
        return preferences.emailNotifications.reminders
      case 'report':
        return preferences.emailNotifications.reports
      case 'milestone':
        return preferences.emailNotifications.milestones
      default:
        return true
    }
  }

  /**
   * Get notification analytics
   */
  static async getNotificationAnalytics(userId: string): Promise<{
    totalSent: number
    deliveryRate: number
    openRate: number
    clickRate: number
    topNotificationTypes: Array<{
      type: string
      count: number
      engagementRate: number
    }>
    recentActivity: Array<{
      date: string
      sent: number
      opened: number
      clicked: number
    }>
  }> {
    try {
      // Mock analytics data - in production would query actual delivery records
      return {
        totalSent: 24,
        deliveryRate: 0.96,
        openRate: 0.72,
        clickRate: 0.34,
        topNotificationTypes: [
          { type: 'opportunities', count: 12, engagementRate: 0.85 },
          { type: 'reminders', count: 8, engagementRate: 0.62 },
          { type: 'milestones', count: 4, engagementRate: 0.95 }
        ],
        recentActivity: [
          { date: '2025-09-09', sent: 3, opened: 2, clicked: 1 },
          { date: '2025-09-08', sent: 2, opened: 2, clicked: 0 },
          { date: '2025-09-07', sent: 4, opened: 3, clicked: 2 },
          { date: '2025-09-06', sent: 1, opened: 1, clicked: 1 }
        ]
      }
    } catch (error) {
      console.error('Error getting notification analytics:', error)
      throw error
    }
  }

  /**
   * Submit feedback on notification relevance
   */
  static async submitNotificationFeedback(
    userId: string,
    notificationId: string,
    feedback: {
      rating: 1 | 2 | 3 | 4 | 5
      relevance: 'very_relevant' | 'relevant' | 'neutral' | 'irrelevant' | 'very_irrelevant'
      comments?: string
    }
  ): Promise<{ success: boolean }> {
    try {
      // In production, would store feedback in database for ML improvement
      return { success: true }
    } catch (error) {
      console.error('Error submitting notification feedback:', error)
      throw error
    }
  }
}