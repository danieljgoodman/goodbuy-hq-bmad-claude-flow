import { PrismaClient } from '@prisma/client'
import { NotificationService } from './NotificationService'
import { EmailService } from './EmailService'
import { PremiumAccessService } from './PremiumAccessService'

const prisma = new PrismaClient()

export interface SmartReminder {
  id: string
  userId: string
  type: 'implementation_step' | 'evaluation_due' | 'progress_update' | 'milestone_review'
  title: string
  description: string
  relatedItemId: string // guide ID, step ID, etc.
  relatedItemType: 'guide' | 'step' | 'evaluation' | 'progress_entry'
  dueDate?: Date
  priority: 'low' | 'medium' | 'high'
  frequency: 'once' | 'daily' | 'weekly' | 'bi-weekly' | 'monthly'
  isActive: boolean
  lastSent?: Date
  nextScheduled?: Date
  completionUrl: string
  createdAt: Date
  completedAt?: Date
}

export interface ReminderStats {
  totalActive: number
  completionRate: number
  avgResponseTime: number // hours
  reminderEffectiveness: {
    daily: number
    weekly: number
    biweekly: number
  }
}

export class ReminderService {
  /**
   * Create smart reminder for implementation step
   */
  static async createImplementationReminder(
    userId: string,
    guideId: string,
    stepId: string,
    stepTitle: string,
    stepDescription: string
  ): Promise<SmartReminder> {
    try {
      // Check if user has premium access
      const accessCheck = await PremiumAccessService.checkAIFeatureAccess(userId)
      if (!accessCheck.hasAccess) {
        throw new Error('Premium subscription required for smart reminders')
      }

      // Get user's reminder preferences
      const preferences = await NotificationService.getNotificationPreferences(userId)
      
      const reminder: SmartReminder = {
        id: `reminder_${userId}_${stepId}_${Date.now()}`,
        userId,
        type: 'implementation_step',
        title: `Complete: ${stepTitle}`,
        description: `Don't forget to complete this implementation step: ${stepDescription}`,
        relatedItemId: stepId,
        relatedItemType: 'step',
        priority: 'medium',
        frequency: preferences.reminderCadence === 'daily' ? 'daily' : 'weekly',
        isActive: true,
        completionUrl: `/guides/${guideId}`,
        createdAt: new Date(),
        nextScheduled: this.calculateNextScheduledTime(preferences.reminderCadence)
      }

      // In production, would save to database
      console.log('Created implementation reminder:', reminder.id)

      return reminder
    } catch (error) {
      console.error('Error creating implementation reminder:', error)
      throw error
    }
  }

  /**
   * Create evaluation due reminder
   */
  static async createEvaluationReminder(
    userId: string,
    lastEvaluationDate: Date
  ): Promise<SmartReminder> {
    try {
      // Suggest evaluation every 30 days
      const daysSinceLastEvaluation = Math.floor(
        (Date.now() - lastEvaluationDate.getTime()) / (1000 * 60 * 60 * 24)
      )

      if (daysSinceLastEvaluation < 25) {
        throw new Error('Too early for evaluation reminder')
      }

      const reminder: SmartReminder = {
        id: `reminder_eval_${userId}_${Date.now()}`,
        userId,
        type: 'evaluation_due',
        title: 'Time for Your Monthly Business Evaluation',
        description: `It's been ${daysSinceLastEvaluation} days since your last evaluation. Regular evaluations help track your progress and identify new opportunities.`,
        relatedItemId: 'evaluation',
        relatedItemType: 'evaluation',
        priority: daysSinceLastEvaluation > 35 ? 'high' : 'medium',
        frequency: 'once',
        isActive: true,
        completionUrl: '/onboarding',
        createdAt: new Date(),
        nextScheduled: new Date()
      }

      return reminder
    } catch (error) {
      console.error('Error creating evaluation reminder:', error)
      throw error
    }
  }

  /**
   * Get active reminders for user
   */
  static async getUserReminders(
    userId: string,
    options: {
      type?: 'implementation_step' | 'evaluation_due' | 'progress_update' | 'milestone_review'
      activeOnly?: boolean
      limit?: number
    } = {}
  ): Promise<SmartReminder[]> {
    try {
      // Mock reminders - in production would query database
      const mockReminders: SmartReminder[] = [
        {
          id: 'reminder_1',
          userId,
          type: 'implementation_step',
          title: 'Complete: Set up automated invoicing',
          description: 'Implement automated invoicing system to improve cash flow - this step can increase efficiency by 25%.',
          relatedItemId: 'step_invoice_auto',
          relatedItemType: 'step',
          priority: 'high',
          frequency: 'weekly',
          isActive: true,
          completionUrl: '/guides/cash-flow-optimization',
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3), // 3 days ago
          nextScheduled: new Date(Date.now() + 1000 * 60 * 60 * 24 * 4) // 4 days from now
        },
        {
          id: 'reminder_2',
          userId,
          type: 'progress_update',
          title: 'Update Progress: Digital Marketing Initiative',
          description: 'Share your progress on the digital marketing strategy implementation.',
          relatedItemId: 'progress_marketing',
          relatedItemType: 'progress_entry',
          priority: 'medium',
          frequency: 'bi-weekly',
          isActive: true,
          completionUrl: '/progress',
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7), // 1 week ago
          nextScheduled: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7) // 1 week from now
        },
        {
          id: 'reminder_3',
          userId,
          type: 'evaluation_due',
          title: 'Monthly Business Evaluation Due',
          description: 'It\'s time for your monthly business health evaluation to track progress and identify new opportunities.',
          relatedItemId: 'evaluation',
          relatedItemType: 'evaluation',
          priority: 'medium',
          frequency: 'once',
          isActive: true,
          completionUrl: '/onboarding',
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 1), // 1 day ago
          nextScheduled: new Date()
        }
      ]

      let filtered = mockReminders

      if (options.type) {
        filtered = filtered.filter(r => r.type === options.type)
      }

      if (options.activeOnly !== false) {
        filtered = filtered.filter(r => r.isActive && !r.completedAt)
      }

      if (options.limit) {
        filtered = filtered.slice(0, options.limit)
      }

      return filtered.sort((a, b) => {
        // Sort by priority (high first) then by next scheduled date
        const priorityOrder = { high: 3, medium: 2, low: 1 }
        if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
          return priorityOrder[b.priority] - priorityOrder[a.priority]
        }
        return (a.nextScheduled?.getTime() || 0) - (b.nextScheduled?.getTime() || 0)
      })
    } catch (error) {
      console.error('Error getting user reminders:', error)
      throw error
    }
  }

  /**
   * Send due reminders
   */
  static async sendDueReminders(userId: string): Promise<{
    sent: number
    failed: number
    reminders: SmartReminder[]
  }> {
    try {
      const reminders = await this.getUserReminders(userId, { activeOnly: true })
      const dueReminders = reminders.filter(r => 
        r.nextScheduled && r.nextScheduled <= new Date()
      )

      let sent = 0
      let failed = 0

      for (const reminder of dueReminders) {
        try {
          // Create in-app notification
          await NotificationService.createNotification(userId, {
            type: 'reminder',
            title: reminder.title,
            message: reminder.description,
            actionUrl: reminder.completionUrl,
            actionLabel: this.getActionLabel(reminder.type),
            priority: reminder.priority
          })

          // Send email if it's high priority or user preferences allow
          if (reminder.priority === 'high') {
            const user = await prisma.user.findUnique({
              where: { id: userId },
              select: { email: true }
            })

            if (user?.email) {
              await EmailService.sendReminderEmail(
                user.email,
                reminder.title,
                reminder.description,
                reminder.completionUrl
              )
            }
          }

          // Update next scheduled time
          reminder.nextScheduled = this.calculateNextScheduledTime(reminder.frequency, new Date())
          reminder.lastSent = new Date()

          sent++
        } catch (error) {
          console.error(`Failed to send reminder ${reminder.id}:`, error)
          failed++
        }
      }

      return {
        sent,
        failed,
        reminders: dueReminders
      }
    } catch (error) {
      console.error('Error sending due reminders:', error)
      throw error
    }
  }

  /**
   * Mark reminder as completed
   */
  static async completeReminder(
    userId: string,
    reminderId: string
  ): Promise<{ success: boolean }> {
    try {
      // In production, would update database record
      console.log(`Marking reminder ${reminderId} as completed for user ${userId}`)
      
      return { success: true }
    } catch (error) {
      console.error('Error completing reminder:', error)
      throw error
    }
  }

  /**
   * Snooze reminder
   */
  static async snoozeReminder(
    userId: string,
    reminderId: string,
    snoozeUntil: Date
  ): Promise<{ success: boolean }> {
    try {
      // In production, would update next scheduled time
      console.log(`Snoozing reminder ${reminderId} until ${snoozeUntil}`)
      
      return { success: true }
    } catch (error) {
      console.error('Error snoozing reminder:', error)
      throw error
    }
  }

  /**
   * Get reminder statistics
   */
  static async getReminderStats(userId: string): Promise<ReminderStats> {
    try {
      // Mock stats - in production would calculate from database
      return {
        totalActive: 5,
        completionRate: 0.68, // 68% of reminders lead to action
        avgResponseTime: 18.5, // 18.5 hours average response time
        reminderEffectiveness: {
          daily: 0.45,
          weekly: 0.72,
          biweekly: 0.58
        }
      }
    } catch (error) {
      console.error('Error getting reminder stats:', error)
      throw error
    }
  }

  /**
   * Update reminder preferences
   */
  static async updateReminderPreferences(
    userId: string,
    preferences: {
      frequency?: 'daily' | 'weekly' | 'bi-weekly'
      quietHours?: { start: string; end: string }
      types?: {
        implementation: boolean
        evaluation: boolean
        progress: boolean
        milestones: boolean
      }
    }
  ): Promise<{ success: boolean }> {
    try {
      // In production, would update user preferences
      console.log('Updating reminder preferences for user:', userId)
      
      return { success: true }
    } catch (error) {
      console.error('Error updating reminder preferences:', error)
      throw error
    }
  }

  /**
   * Calculate next scheduled time based on frequency
   */
  private static calculateNextScheduledTime(
    frequency: 'once' | 'daily' | 'weekly' | 'bi-weekly' | 'monthly',
    fromDate: Date = new Date()
  ): Date {
    const next = new Date(fromDate)

    switch (frequency) {
      case 'once':
        return next
      case 'daily':
        next.setDate(next.getDate() + 1)
        break
      case 'weekly':
        next.setDate(next.getDate() + 7)
        break
      case 'bi-weekly':
        next.setDate(next.getDate() + 14)
        break
      case 'monthly':
        next.setMonth(next.getMonth() + 1)
        break
    }

    return next
  }

  /**
   * Get appropriate action label for reminder type
   */
  private static getActionLabel(type: string): string {
    switch (type) {
      case 'implementation_step':
        return 'Complete Step'
      case 'evaluation_due':
        return 'Start Evaluation'
      case 'progress_update':
        return 'Update Progress'
      case 'milestone_review':
        return 'Review Milestone'
      default:
        return 'Take Action'
    }
  }

  /**
   * Detect incomplete implementation steps and create reminders
   */
  static async detectIncompleteSteps(userId: string): Promise<{
    detected: number
    remindersCreated: number
  }> {
    try {
      // In production, would analyze user's guides and progress to find incomplete steps
      // For now, simulate detection
      const incompleteSteps = [
        {
          guideId: 'guide_cash_flow',
          stepId: 'step_invoice_auto',
          title: 'Set up automated invoicing',
          description: 'Implement automated invoicing system'
        },
        {
          guideId: 'guide_marketing',
          stepId: 'step_social_media',
          title: 'Launch social media campaign',
          description: 'Execute digital marketing strategy'
        }
      ]

      let remindersCreated = 0

      for (const step of incompleteSteps) {
        try {
          await this.createImplementationReminder(
            userId,
            step.guideId,
            step.stepId,
            step.title,
            step.description
          )
          remindersCreated++
        } catch (error) {
          console.error('Failed to create reminder for step:', step.stepId, error)
        }
      }

      return {
        detected: incompleteSteps.length,
        remindersCreated
      }
    } catch (error) {
      console.error('Error detecting incomplete steps:', error)
      throw error
    }
  }
}