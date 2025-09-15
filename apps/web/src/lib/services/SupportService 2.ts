import { PrismaClient } from '@prisma/client'
import { PremiumAccessService } from './PremiumAccessService'
import { NotificationService } from './NotificationService'
import { EmailService } from './EmailService'

const prisma = new PrismaClient()

export interface SupportTicket {
  id: string
  userId: string
  priority: 'low' | 'medium' | 'high' | 'urgent'
  status: 'open' | 'in_progress' | 'resolved' | 'closed'
  category: 'technical' | 'billing' | 'feature' | 'onboarding'
  subject: string
  description: string
  assignedTo?: string
  createdAt: Date
  firstResponseAt?: Date
  resolvedAt?: Date
  satisfactionRating?: number
  slaTarget: Date
  escalated: boolean
  responses: SupportResponse[]
}

export interface SupportResponse {
  id: string
  ticketId: string
  fromUserId?: string
  fromSupport?: boolean
  message: string
  createdAt: Date
  attachments?: string[]
}

export interface SupportMetrics {
  userId: string
  subscriptionTier: string
  ticketCount: number
  averageResponseTime: number // hours
  averageResolutionTime: number // hours
  satisfactionScore: number // 1-5
  lastSupportContact: Date
  onboardingCompleted: boolean
  successScore: number // 1-10
}

export interface QueueStatus {
  userId: string
  position: number
  estimatedWaitTime: number // minutes
  isPremium: boolean
  processingType: 'evaluation' | 'report' | 'analysis'
}

export class SupportService {
  /**
   * Create new support ticket with appropriate priority
   */
  static async createSupportTicket(
    userId: string,
    ticketData: {
      category: 'technical' | 'billing' | 'feature' | 'onboarding'
      subject: string
      description: string
      priority?: 'low' | 'medium' | 'high' | 'urgent'
    }
  ): Promise<SupportTicket> {
    try {
      // Check user's subscription level for priority
      const accessCheck = await PremiumAccessService.checkAIFeatureAccess(userId)
      const isPremium = accessCheck.hasAccess

      // Auto-assign priority based on subscription and category
      const priority = this.determinePriority(ticketData.category, ticketData.priority, isPremium)
      
      // Calculate SLA target based on priority and subscription
      const slaTarget = this.calculateSLATarget(priority, isPremium)

      const ticket: SupportTicket = {
        id: `ticket_${userId}_${Date.now()}`,
        userId,
        priority,
        status: 'open',
        category: ticketData.category,
        subject: ticketData.subject,
        description: ticketData.description,
        createdAt: new Date(),
        slaTarget,
        escalated: false,
        responses: []
      }

      // Auto-assign to appropriate agent based on category and workload
      ticket.assignedTo = await this.assignToAgent(ticket.category, priority)

      // Send notifications
      await this.sendTicketNotifications(userId, ticket, isPremium)

      // In production, would save to database
      console.log('Created support ticket:', ticket.id)

      return ticket
    } catch (error) {
      console.error('Error creating support ticket:', error)
      throw error
    }
  }

  /**
   * Get user's support tickets
   */
  static async getUserTickets(
    userId: string,
    options: {
      status?: 'open' | 'in_progress' | 'resolved' | 'closed'
      limit?: number
      offset?: number
    } = {}
  ): Promise<{ tickets: SupportTicket[]; total: number }> {
    try {
      // Mock tickets - in production would query database
      const mockTickets: SupportTicket[] = [
        {
          id: 'ticket_001',
          userId,
          priority: 'high',
          status: 'in_progress',
          category: 'technical',
          subject: 'Issue with PDF report generation',
          description: 'Unable to generate professional reports, getting error message when clicking generate button.',
          assignedTo: 'agent_sarah',
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 4), // 4 hours ago
          firstResponseAt: new Date(Date.now() - 1000 * 60 * 60 * 3), // 3 hours ago
          slaTarget: new Date(Date.now() + 1000 * 60 * 60 * 20), // 20 hours from now
          escalated: false,
          responses: [
            {
              id: 'resp_001',
              ticketId: 'ticket_001',
              fromSupport: true,
              message: 'Hi! I\'ve received your report about PDF generation issues. I\'m looking into this right now and will have an update for you shortly.',
              createdAt: new Date(Date.now() - 1000 * 60 * 60 * 3)
            }
          ]
        },
        {
          id: 'ticket_002',
          userId,
          priority: 'medium',
          status: 'resolved',
          category: 'feature',
          subject: 'How to use benchmarking feature',
          description: 'Need help understanding the industry benchmarking dashboard and how to interpret the results.',
          assignedTo: 'agent_mike',
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2), // 2 days ago
          firstResponseAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2 + 1000 * 60 * 30), // 30 min after creation
          resolvedAt: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
          satisfactionRating: 5,
          slaTarget: new Date(Date.now() - 1000 * 60 * 60 * 22), // Was 22 hours from creation
          escalated: false,
          responses: [
            {
              id: 'resp_002',
              ticketId: 'ticket_002',
              fromSupport: true,
              message: 'I\'d be happy to walk you through the benchmarking features! The dashboard shows how you compare to industry standards...',
              createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2 + 1000 * 60 * 30)
            }
          ]
        }
      ]

      let filtered = mockTickets
      if (options.status) {
        filtered = filtered.filter(t => t.status === options.status)
      }

      const total = filtered.length
      const offset = options.offset || 0
      const limit = options.limit || 10
      const tickets = filtered.slice(offset, offset + limit)

      return { tickets, total }
    } catch (error) {
      console.error('Error getting user tickets:', error)
      throw error
    }
  }

  /**
   * Add response to support ticket
   */
  static async addTicketResponse(
    userId: string,
    ticketId: string,
    message: string
  ): Promise<SupportResponse> {
    try {
      const response: SupportResponse = {
        id: `resp_${ticketId}_${Date.now()}`,
        ticketId,
        fromUserId: userId,
        message,
        createdAt: new Date()
      }

      // In production, would save to database and notify assigned agent
      console.log('Added ticket response:', response.id)

      return response
    } catch (error) {
      console.error('Error adding ticket response:', error)
      throw error
    }
  }

  /**
   * Get queue status for user
   */
  static async getQueueStatus(
    userId: string,
    processingType: 'evaluation' | 'report' | 'analysis' = 'evaluation'
  ): Promise<QueueStatus> {
    try {
      const accessCheck = await PremiumAccessService.checkAIFeatureAccess(userId)
      const isPremium = accessCheck.hasAccess

      // Mock queue status - in production would check actual processing queues
      const basePosition = Math.floor(Math.random() * 20) + 1
      const position = isPremium ? Math.max(1, Math.floor(basePosition / 2)) : basePosition
      
      const baseWaitTime = processingType === 'evaluation' ? 5 : processingType === 'report' ? 15 : 10
      const estimatedWaitTime = isPremium ? baseWaitTime * 0.5 : baseWaitTime

      return {
        userId,
        position,
        estimatedWaitTime,
        isPremium,
        processingType
      }
    } catch (error) {
      console.error('Error getting queue status:', error)
      throw error
    }
  }

  /**
   * Get support metrics for user
   */
  static async getUserSupportMetrics(userId: string): Promise<SupportMetrics> {
    try {
      const accessCheck = await PremiumAccessService.checkAIFeatureAccess(userId)
      
      // Mock metrics - in production would calculate from actual data
      return {
        userId,
        subscriptionTier: accessCheck.hasAccess ? 'premium' : 'free',
        ticketCount: 3,
        averageResponseTime: accessCheck.hasAccess ? 1.2 : 8.5, // hours
        averageResolutionTime: accessCheck.hasAccess ? 6.3 : 24.8, // hours
        satisfactionScore: 4.7,
        lastSupportContact: new Date(Date.now() - 1000 * 60 * 60 * 4), // 4 hours ago
        onboardingCompleted: true,
        successScore: 8.2
      }
    } catch (error) {
      console.error('Error getting support metrics:', error)
      throw error
    }
  }

  /**
   * Submit satisfaction rating for resolved ticket
   */
  static async submitSatisfactionRating(
    userId: string,
    ticketId: string,
    rating: number,
    feedback?: string
  ): Promise<{ success: boolean }> {
    try {
      // Validate rating
      if (rating < 1 || rating > 5) {
        throw new Error('Rating must be between 1 and 5')
      }

      // In production, would update ticket record and track metrics
      console.log(`Satisfaction rating ${rating} submitted for ticket ${ticketId}`)
      
      return { success: true }
    } catch (error) {
      console.error('Error submitting satisfaction rating:', error)
      throw error
    }
  }

  /**
   * Get support analytics (admin only)
   */
  static async getSupportAnalytics(): Promise<{
    totalTickets: number
    averageResponseTime: { premium: number; standard: number }
    averageResolutionTime: { premium: number; standard: number }
    satisfactionScores: { premium: number; standard: number }
    slaCompliance: { premium: number; standard: number }
    ticketsByCategory: { [key: string]: number }
    agentWorkload: { [agentId: string]: number }
  }> {
    try {
      // Mock analytics - in production would calculate from actual data
      return {
        totalTickets: 156,
        averageResponseTime: {
          premium: 1.3, // hours
          standard: 9.2 // hours
        },
        averageResolutionTime: {
          premium: 8.7, // hours
          standard: 28.4 // hours
        },
        satisfactionScores: {
          premium: 4.6,
          standard: 3.9
        },
        slaCompliance: {
          premium: 0.96, // 96%
          standard: 0.78 // 78%
        },
        ticketsByCategory: {
          technical: 45,
          feature: 32,
          billing: 28,
          onboarding: 51
        },
        agentWorkload: {
          agent_sarah: 12,
          agent_mike: 8,
          agent_john: 15,
          agent_lisa: 10
        }
      }
    } catch (error) {
      console.error('Error getting support analytics:', error)
      throw error
    }
  }

  /**
   * Private helper methods
   */

  private static determinePriority(
    category: string,
    requestedPriority: string | undefined,
    isPremium: boolean
  ): 'low' | 'medium' | 'high' | 'urgent' {
    // Premium users get priority boost
    let basePriority: 'low' | 'medium' | 'high' | 'urgent'

    switch (category) {
      case 'billing':
        basePriority = 'high'
        break
      case 'technical':
        basePriority = 'medium'
        break
      case 'onboarding':
        basePriority = isPremium ? 'high' : 'medium'
        break
      default:
        basePriority = 'low'
    }

    // Use requested priority if higher than base
    const priorityLevels = { low: 1, medium: 2, high: 3, urgent: 4 }
    const requested = requestedPriority as keyof typeof priorityLevels
    
    if (requested && priorityLevels[requested] > priorityLevels[basePriority]) {
      basePriority = requested
    }

    // Premium users get one level boost (but not beyond urgent)
    if (isPremium && basePriority !== 'urgent') {
      const levels: ('low' | 'medium' | 'high' | 'urgent')[] = ['low', 'medium', 'high', 'urgent']
      const currentIndex = levels.indexOf(basePriority)
      if (currentIndex < levels.length - 1) {
        basePriority = levels[currentIndex + 1]
      }
    }

    return basePriority
  }

  private static calculateSLATarget(priority: string, isPremium: boolean): Date {
    const now = new Date()
    let hoursToAdd: number

    // Base SLA times
    switch (priority) {
      case 'urgent':
        hoursToAdd = isPremium ? 0.5 : 2
        break
      case 'high':
        hoursToAdd = isPremium ? 2 : 8
        break
      case 'medium':
        hoursToAdd = isPremium ? 4 : 24
        break
      default:
        hoursToAdd = isPremium ? 8 : 48
    }

    return new Date(now.getTime() + hoursToAdd * 60 * 60 * 1000)
  }

  private static async assignToAgent(category: string, priority: string): Promise<string> {
    // Mock agent assignment - in production would use workload balancing
    const agents = {
      technical: ['agent_sarah', 'agent_john'],
      billing: ['agent_mike'],
      feature: ['agent_sarah', 'agent_lisa'],
      onboarding: ['agent_lisa', 'agent_mike']
    }

    const categoryAgents = agents[category as keyof typeof agents] || ['agent_sarah']
    return categoryAgents[Math.floor(Math.random() * categoryAgents.length)]
  }

  private static async sendTicketNotifications(
    userId: string,
    ticket: SupportTicket,
    isPremium: boolean
  ): Promise<void> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { email: true, businessName: true }
      })

      if (!user?.email) return

      // Send in-app notification
      await NotificationService.createNotification(userId, {
        type: 'system',
        title: 'Support Ticket Created',
        message: `Your ${isPremium ? 'priority ' : ''}support ticket "${ticket.subject}" has been received. Ticket ID: ${ticket.id}`,
        actionUrl: '/support',
        actionLabel: 'View Ticket',
        priority: isPremium ? 'high' : 'medium'
      })

      // Send email notification
      const subject = `${isPremium ? '[PRIORITY] ' : ''}Support Ticket Created - ${ticket.id}`
      const message = `Your support ticket has been created and ${isPremium ? 'prioritized' : 'assigned'} to our team. Expected response time: ${this.getSLADescription(ticket.priority, isPremium)}.`

      await EmailService.sendNotificationEmail(user.email, subject, message, '/support')
    } catch (error) {
      console.error('Error sending ticket notifications:', error)
      // Don't throw - ticket creation should succeed even if notifications fail
    }
  }

  private static getSLADescription(priority: string, isPremium: boolean): string {
    const slaMap = {
      urgent: isPremium ? '30 minutes' : '2 hours',
      high: isPremium ? '2 hours' : '8 hours',
      medium: isPremium ? '4 hours' : '24 hours',
      low: isPremium ? '8 hours' : '48 hours'
    }
    return slaMap[priority as keyof typeof slaMap] || '24 hours'
  }
}