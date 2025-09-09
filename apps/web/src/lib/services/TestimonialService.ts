import { PrismaClient } from '@prisma/client'
import { EmailService } from './EmailService'
import { NotificationService } from './NotificationService'

const prisma = new PrismaClient()

export interface Testimonial {
  id: string
  userId: string
  requestedAt: Date
  submittedAt: Date | null
  approvedAt: Date | null
  publishedAt: Date | null
  status: 'requested' | 'submitted' | 'approved' | 'published' | 'declined'
  content: string
  authorName: string
  authorTitle: string
  companyName: string
  improvementData: {
    beforeValuation: number
    afterValuation: number
    improvementPercentage: number
    timeFrame: string
  }
  permissions: {
    useCompanyName: boolean
    useRealName: boolean
    useQuantifiedData: boolean
  }
  platformsShared: string[]
  moderationNotes?: string
}

export interface TestimonialRequest {
  id: string
  userId: string
  requestedAt: Date
  triggerType: 'significant_improvement' | 'milestone_reached' | 'manual_request'
  improvementData: {
    beforeValuation: number
    afterValuation: number
    improvementPercentage: number
    timeFrame: string
  }
  status: 'pending' | 'responded' | 'expired'
  expiresAt: Date
  remindersSent: number
}

export interface CaseStudy {
  id: string
  basedOnTestimonialId: string
  title: string
  industry: string
  businessType: string
  challengeDescription: string
  solutionImplemented: string
  resultsAchieved: {
    quantifiedMetrics: { [key: string]: any }
    timeframe: string
    roi: number
  }
  testimonialQuote: string
  authorAttribution: string
  anonymized: boolean
  publishedAt: Date
  status: 'draft' | 'published' | 'archived'
}

export class TestimonialService {
  /**
   * Send testimonial request to qualifying users
   */
  static async sendTestimonialRequest(
    userId: string,
    improvementData: TestimonialRequest['improvementData'],
    triggerType: TestimonialRequest['triggerType'] = 'significant_improvement'
  ): Promise<TestimonialRequest> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { email: true, businessName: true }
      })

      if (!user?.email) {
        throw new Error('User not found or no email')
      }

      // Check if user already has a pending testimonial request
      const existingRequest = await this.getExistingRequest(userId)
      if (existingRequest) {
        throw new Error('User already has a pending testimonial request')
      }

      const request: TestimonialRequest = {
        id: `req_${userId}_${Date.now()}`,
        userId,
        requestedAt: new Date(),
        triggerType,
        improvementData,
        status: 'pending',
        expiresAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days
        remindersSent: 0
      }

      // Send email request
      await this.sendTestimonialEmail(user.email, user.businessName || 'there', request)

      // Send in-app notification
      await NotificationService.createNotification(userId, {
        type: 'system',
        title: '🌟 Share Your Success Story!',
        message: `Your business has improved by ${improvementData.improvementPercentage.toFixed(1)}%! We'd love to hear about your experience.`,
        actionUrl: '/testimonial/submit',
        actionLabel: 'Share Testimonial',
        priority: 'medium'
      })

      // In production, would save to database
      console.log('Testimonial request sent:', request.id)

      return request
    } catch (error) {
      console.error('Error sending testimonial request:', error)
      throw error
    }
  }

  /**
   * Submit testimonial from user
   */
  static async submitTestimonial(
    userId: string,
    testimonialData: {
      content: string
      authorName: string
      authorTitle: string
      companyName: string
      permissions: Testimonial['permissions']
    }
  ): Promise<Testimonial> {
    try {
      const request = await this.getExistingRequest(userId)
      if (!request) {
        throw new Error('No testimonial request found for user')
      }

      const testimonial: Testimonial = {
        id: `testimonial_${userId}_${Date.now()}`,
        userId,
        requestedAt: request.requestedAt,
        submittedAt: new Date(),
        approvedAt: null,
        publishedAt: null,
        status: 'submitted',
        content: testimonialData.content,
        authorName: testimonialData.authorName,
        authorTitle: testimonialData.authorTitle,
        companyName: testimonialData.companyName,
        improvementData: request.improvementData,
        permissions: testimonialData.permissions,
        platformsShared: []
      }

      // Update request status
      request.status = 'responded'

      // Notify admin about new testimonial submission
      await this.notifyAdminOfSubmission(testimonial)

      // Thank user for submission
      await NotificationService.createNotification(userId, {
        type: 'system',
        title: 'Thank You for Your Testimonial!',
        message: 'Your testimonial has been submitted and is under review. We appreciate you sharing your success story!',
        actionUrl: '/dashboard',
        actionLabel: 'View Dashboard',
        priority: 'low'
      })

      // In production, would save to database
      console.log('Testimonial submitted:', testimonial.id)

      return testimonial
    } catch (error) {
      console.error('Error submitting testimonial:', error)
      throw error
    }
  }

  /**
   * Approve testimonial for publication
   */
  static async approveTestimonial(
    testimonialId: string,
    moderationNotes?: string
  ): Promise<Testimonial> {
    try {
      // Mock testimonial retrieval - in production would query database
      const testimonial = await this.getTestimonialById(testimonialId)
      if (!testimonial) {
        throw new Error('Testimonial not found')
      }

      testimonial.status = 'approved'
      testimonial.approvedAt = new Date()
      testimonial.moderationNotes = moderationNotes

      // Notify user of approval
      await NotificationService.createNotification(testimonial.userId, {
        type: 'system',
        title: '✅ Your Testimonial is Approved!',
        message: 'Your testimonial has been approved and will be featured on our platform. Thank you for sharing your success!',
        actionUrl: '/testimonials',
        actionLabel: 'View Testimonial',
        priority: 'medium'
      })

      // In production, would update database
      console.log('Testimonial approved:', testimonialId)

      return testimonial
    } catch (error) {
      console.error('Error approving testimonial:', error)
      throw error
    }
  }

  /**
   * Publish approved testimonial
   */
  static async publishTestimonial(
    testimonialId: string,
    platforms: string[] = ['website']
  ): Promise<Testimonial> {
    try {
      const testimonial = await this.getTestimonialById(testimonialId)
      if (!testimonial || testimonial.status !== 'approved') {
        throw new Error('Testimonial not found or not approved')
      }

      testimonial.status = 'published'
      testimonial.publishedAt = new Date()
      testimonial.platformsShared = platforms

      // Generate case study if appropriate
      if (testimonial.permissions.useQuantifiedData) {
        await this.generateCaseStudy(testimonial)
      }

      // In production, would update database and trigger publication workflow
      console.log('Testimonial published:', testimonialId, 'on platforms:', platforms)

      return testimonial
    } catch (error) {
      console.error('Error publishing testimonial:', error)
      throw error
    }
  }

  /**
   * Generate case study from testimonial
   */
  static async generateCaseStudy(testimonial: Testimonial): Promise<CaseStudy> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: testimonial.userId },
        select: { businessType: true, industry: true }
      })

      const caseStudy: CaseStudy = {
        id: `case_${testimonial.id}`,
        basedOnTestimonialId: testimonial.id,
        title: this.generateCaseStudyTitle(testimonial),
        industry: user?.industry || 'Business Services',
        businessType: user?.businessType || 'SME',
        challengeDescription: this.extractChallenge(testimonial.content),
        solutionImplemented: 'Comprehensive business evaluation and implementation of AI-powered recommendations',
        resultsAchieved: {
          quantifiedMetrics: {
            valuationIncrease: testimonial.improvementData.afterValuation - testimonial.improvementData.beforeValuation,
            improvementPercentage: testimonial.improvementData.improvementPercentage,
            timeframe: testimonial.improvementData.timeFrame
          },
          timeframe: testimonial.improvementData.timeFrame,
          roi: this.calculateROI(testimonial)
        },
        testimonialQuote: testimonial.content,
        authorAttribution: this.createAttribution(testimonial),
        anonymized: !testimonial.permissions.useRealName || !testimonial.permissions.useCompanyName,
        publishedAt: new Date(),
        status: 'published'
      }

      // In production, would save to database
      console.log('Case study generated:', caseStudy.id)

      return caseStudy
    } catch (error) {
      console.error('Error generating case study:', error)
      throw error
    }
  }

  /**
   * Get all testimonials with filtering
   */
  static async getTestimonials(filters: {
    status?: Testimonial['status']
    limit?: number
    offset?: number
  } = {}): Promise<{ testimonials: Testimonial[]; total: number }> {
    try {
      // Mock testimonials - in production would query database
      const mockTestimonials: Testimonial[] = [
        {
          id: 'testimonial_001',
          userId: 'user_123',
          requestedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 14),
          submittedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10),
          approvedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5),
          publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3),
          status: 'published',
          content: 'GoodBuy HQ helped us identify key areas for improvement in our business. Within 6 months, we saw a 35% increase in our business valuation through targeted operational improvements.',
          authorName: 'Sarah Johnson',
          authorTitle: 'CEO',
          companyName: 'Johnson & Associates',
          improvementData: {
            beforeValuation: 500000,
            afterValuation: 675000,
            improvementPercentage: 35,
            timeFrame: '6 months'
          },
          permissions: {
            useCompanyName: true,
            useRealName: true,
            useQuantifiedData: true
          },
          platformsShared: ['website', 'social_media']
        },
        {
          id: 'testimonial_002',
          userId: 'user_456',
          requestedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7),
          submittedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3),
          approvedAt: null,
          publishedAt: null,
          status: 'submitted',
          content: 'The detailed analytics and implementation guides were game-changers for our business. We implemented the recommended changes and saw immediate improvements in our efficiency and profitability.',
          authorName: 'Michael Chen',
          authorTitle: 'Founder',
          companyName: 'TechStart Solutions',
          improvementData: {
            beforeValuation: 250000,
            afterValuation: 312500,
            improvementPercentage: 25,
            timeFrame: '4 months'
          },
          permissions: {
            useCompanyName: false,
            useRealName: true,
            useQuantifiedData: true
          },
          platformsShared: []
        }
      ]

      let filtered = mockTestimonials
      if (filters.status) {
        filtered = filtered.filter(t => t.status === filters.status)
      }

      const total = filtered.length
      const offset = filters.offset || 0
      const limit = filters.limit || 10
      const testimonials = filtered.slice(offset, offset + limit)

      return { testimonials, total }
    } catch (error) {
      console.error('Error fetching testimonials:', error)
      throw error
    }
  }

  /**
   * Get case studies with filtering
   */
  static async getCaseStudies(filters: {
    industry?: string
    limit?: number
    offset?: number
  } = {}): Promise<{ caseStudies: CaseStudy[]; total: number }> {
    try {
      // Mock case studies - in production would query database
      const mockCaseStudies: CaseStudy[] = [
        {
          id: 'case_testimonial_001',
          basedOnTestimonialId: 'testimonial_001',
          title: 'Consulting Firm Achieves 35% Valuation Increase',
          industry: 'Professional Services',
          businessType: 'Consulting',
          challengeDescription: 'Business seeking systematic approach to identify growth opportunities and operational improvements',
          solutionImplemented: 'Comprehensive business evaluation with AI-powered recommendations and implementation tracking',
          resultsAchieved: {
            quantifiedMetrics: {
              valuationIncrease: 175000,
              improvementPercentage: 35,
              timeframe: '6 months'
            },
            timeframe: '6 months',
            roi: 5.8
          },
          testimonialQuote: 'GoodBuy HQ helped us identify key areas for improvement in our business. Within 6 months, we saw a 35% increase in our business valuation through targeted operational improvements.',
          authorAttribution: 'Sarah Johnson, CEO, Johnson & Associates',
          anonymized: false,
          publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3),
          status: 'published'
        }
      ]

      let filtered = mockCaseStudies
      if (filters.industry) {
        filtered = filtered.filter(cs => cs.industry.toLowerCase().includes(filters.industry!.toLowerCase()))
      }

      const total = filtered.length
      const offset = filters.offset || 0
      const limit = filters.limit || 10
      const caseStudies = filtered.slice(offset, offset + limit)

      return { caseStudies, total }
    } catch (error) {
      console.error('Error fetching case studies:', error)
      throw error
    }
  }

  /**
   * Send testimonial reminder
   */
  static async sendTestimonialReminder(requestId: string): Promise<void> {
    try {
      const request = await this.getRequestById(requestId)
      if (!request || request.status !== 'pending') {
        return
      }

      const user = await prisma.user.findUnique({
        where: { id: request.userId },
        select: { email: true, businessName: true }
      })

      if (user?.email) {
        await this.sendTestimonialReminderEmail(user.email, user.businessName || 'there', request)
        request.remindersSent++
        
        // In production, would update database
        console.log('Testimonial reminder sent for request:', requestId)
      }
    } catch (error) {
      console.error('Error sending testimonial reminder:', error)
    }
  }

  /**
   * Private helper methods
   */

  private static async getExistingRequest(userId: string): Promise<TestimonialRequest | null> {
    // Mock request retrieval - in production would query database
    return null // No existing request
  }

  private static async getTestimonialById(testimonialId: string): Promise<Testimonial | null> {
    // Mock testimonial retrieval - in production would query database
    const { testimonials } = await this.getTestimonials()
    return testimonials.find(t => t.id === testimonialId) || null
  }

  private static async getRequestById(requestId: string): Promise<TestimonialRequest | null> {
    // Mock request retrieval - in production would query database
    return null
  }

  private static async sendTestimonialEmail(
    email: string,
    businessName: string,
    request: TestimonialRequest
  ): Promise<void> {
    const subject = '🌟 Share Your Success Story - Your Business Has Improved!'
    const message = `
      <h2>Congratulations, ${businessName}!</h2>
      <p>We're thrilled to see that your business has improved by <strong>${request.improvementData.improvementPercentage.toFixed(1)}%</strong> in just ${request.improvementData.timeFrame}!</p>
      
      <p>Your success story could inspire and help other business owners. Would you consider sharing a brief testimonial about your experience with GoodBuy HQ?</p>
      
      <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3>Your Improvement Summary:</h3>
        <ul>
          <li><strong>Valuation Increase:</strong> ${((request.improvementData.afterValuation - request.improvementData.beforeValuation) / 1000).toFixed(0)}K</li>
          <li><strong>Improvement:</strong> ${request.improvementData.improvementPercentage.toFixed(1)}%</li>
          <li><strong>Timeframe:</strong> ${request.improvementData.timeFrame}</li>
        </ul>
      </div>
      
      <p>Your testimonial helps us:</p>
      <ul>
        <li>Showcase the real impact of our platform</li>
        <li>Help other business owners make informed decisions</li>
        <li>Continuously improve our services</li>
      </ul>
      
      <p>You'll have full control over what information is shared and how it's attributed.</p>
    `
    
    await EmailService.sendNotificationEmail(email, subject, message, '/testimonial/submit')
  }

  private static async sendTestimonialReminderEmail(
    email: string,
    businessName: string,
    request: TestimonialRequest
  ): Promise<void> {
    const subject = 'Friendly Reminder: Share Your Success Story'
    const message = `
      <h2>Hi ${businessName},</h2>
      <p>Just a friendly reminder about sharing your success story with GoodBuy HQ.</p>
      
      <p>Your ${request.improvementData.improvementPercentage.toFixed(1)}% business improvement is remarkable, and your experience could really help other business owners!</p>
      
      <p>It only takes a few minutes to share your testimonial, and you have full control over what's shared.</p>
    `
    
    await EmailService.sendNotificationEmail(email, subject, message, '/testimonial/submit')
  }

  private static async notifyAdminOfSubmission(testimonial: Testimonial): Promise<void> {
    // In production, would notify admin users
    console.log('New testimonial submission requiring review:', testimonial.id)
  }

  private static generateCaseStudyTitle(testimonial: Testimonial): string {
    const improvement = testimonial.improvementData.improvementPercentage.toFixed(0)
    const industry = testimonial.companyName.includes('Tech') ? 'Technology' :
                     testimonial.companyName.includes('Consulting') ? 'Consulting' :
                     'Business Services'
    
    return `${industry} Company Achieves ${improvement}% Valuation Increase`
  }

  private static extractChallenge(content: string): string {
    // Simple extraction - in production would use NLP
    if (content.includes('identify')) {
      return 'Business seeking systematic approach to identify growth opportunities and operational improvements'
    }
    if (content.includes('efficiency')) {
      return 'Business looking to improve operational efficiency and profitability'
    }
    return 'Business seeking growth and improvement strategies'
  }

  private static calculateROI(testimonial: Testimonial): number {
    const improvement = testimonial.improvementData.afterValuation - testimonial.improvementData.beforeValuation
    const estimatedCost = 5000 // Mock platform cost
    return improvement / estimatedCost
  }

  private static createAttribution(testimonial: Testimonial): string {
    const name = testimonial.permissions.useRealName ? testimonial.authorName : 'Business Owner'
    const title = testimonial.authorTitle
    const company = testimonial.permissions.useCompanyName ? testimonial.companyName : 'SME Business'
    
    return `${name}, ${title}, ${company}`
  }
}