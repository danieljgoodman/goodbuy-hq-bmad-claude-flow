import { PrismaClient } from '@prisma/client'
import { EmailService } from './EmailService'
import { NotificationService } from './NotificationService'

const prisma = new PrismaClient()

export interface NPSResponse {
  id: string
  userId: string
  score: number // 0-10
  comment?: string
  surveyType: 'onboarding' | 'milestone' | 'periodic' | 'exit'
  submittedAt: Date
  followUpRequired: boolean
}

export interface FeedbackSurvey {
  id: string
  userId: string
  surveyType: 'satisfaction' | 'feature_request' | 'bug_report' | 'general'
  questions: SurveyQuestion[]
  responses: SurveyResponse[]
  status: 'sent' | 'in_progress' | 'completed' | 'abandoned'
  sentAt: Date
  completedAt?: Date
  remindersSent: number
}

export interface SurveyQuestion {
  id: string
  type: 'rating' | 'text' | 'multiple_choice' | 'boolean'
  question: string
  options?: string[]
  required: boolean
}

export interface SurveyResponse {
  questionId: string
  response: string | number | boolean
}

export interface FeedbackAnalytics {
  period: 'week' | 'month' | 'quarter' | 'year'
  npsScore: number
  npsDistribution: {
    promoters: number // 9-10
    passives: number // 7-8
    detractors: number // 0-6
  }
  satisfactionTrends: {
    date: Date
    averageScore: number
    responseCount: number
  }[]
  commonFeedback: {
    theme: string
    count: number
    sentiment: 'positive' | 'neutral' | 'negative'
    examples: string[]
  }[]
  featureRequests: {
    feature: string
    requestCount: number
    priority: 'low' | 'medium' | 'high'
  }[]
}

export class FeedbackService {
  /**
   * Submit NPS score and feedback
   */
  static async submitNPSScore(
    userId: string,
    score: number,
    comment?: string,
    surveyType: NPSResponse['surveyType'] = 'periodic'
  ): Promise<NPSResponse> {
    try {
      if (score < 0 || score > 10) {
        throw new Error('NPS score must be between 0 and 10')
      }

      const response: NPSResponse = {
        id: `nps_${userId}_${Date.now()}`,
        userId,
        score,
        comment,
        surveyType,
        submittedAt: new Date(),
        followUpRequired: this.determineFollowUpRequired(score, comment)
      }

      // Schedule follow-up for detractors (0-6) or specific comments
      if (response.followUpRequired) {
        await this.scheduleNPSFollowUp(userId, response)
      }

      // Thank user for feedback
      await NotificationService.createNotification(userId, {
        type: 'system',
        title: 'Thank You for Your Feedback!',
        message: 'Your feedback helps us improve GoodBuy HQ. We appreciate you taking the time to share your thoughts.',
        actionUrl: '/dashboard',
        actionLabel: 'Return to Dashboard',
        priority: 'low'
      })

      // In production, would save to database
      console.log('NPS score submitted:', response.id)

      return response
    } catch (error) {
      console.error('Error submitting NPS score:', error)
      throw error
    }
  }

  /**
   * Create and send feedback survey
   */
  static async createFeedbackSurvey(
    userId: string,
    surveyType: FeedbackSurvey['surveyType']
  ): Promise<FeedbackSurvey> {
    try {
      const questions = this.generateSurveyQuestions(surveyType)
      
      const survey: FeedbackSurvey = {
        id: `survey_${userId}_${Date.now()}`,
        userId,
        surveyType,
        questions,
        responses: [],
        status: 'sent',
        sentAt: new Date(),
        remindersSent: 0
      }

      // Send survey notification
      await this.sendSurveyNotification(userId, survey)

      // In production, would save to database
      console.log('Feedback survey created:', survey.id)

      return survey
    } catch (error) {
      console.error('Error creating feedback survey:', error)
      throw error
    }
  }

  /**
   * Submit feedback survey responses
   */
  static async submitSurveyResponses(
    surveyId: string,
    responses: SurveyResponse[]
  ): Promise<FeedbackSurvey> {
    try {
      // Mock survey retrieval - in production would query database
      const survey = await this.getSurveyById(surveyId)
      if (!survey) {
        throw new Error('Survey not found')
      }

      survey.responses = responses
      survey.status = 'completed'
      survey.completedAt = new Date()

      // Analyze responses for follow-up actions
      await this.analyzeSurveyResponses(survey)

      // Thank user for completing survey
      await NotificationService.createNotification(survey.userId, {
        type: 'system',
        title: 'Survey Completed - Thank You!',
        message: 'Thank you for completing our survey. Your feedback is valuable and helps us improve our platform.',
        actionUrl: '/dashboard',
        actionLabel: 'Return to Dashboard',
        priority: 'low'
      })

      // In production, would update database
      console.log('Survey completed:', surveyId)

      return survey
    } catch (error) {
      console.error('Error submitting survey responses:', error)
      throw error
    }
  }

  /**
   * Get feedback analytics for admin dashboard
   */
  static async getFeedbackAnalytics(
    period: FeedbackAnalytics['period'] = 'month'
  ): Promise<FeedbackAnalytics> {
    try {
      // Mock analytics - in production would query database and calculate
      const analytics: FeedbackAnalytics = {
        period,
        npsScore: this.calculateNPSScore(),
        npsDistribution: {
          promoters: 45, // 45% promoters (9-10)
          passives: 35,  // 35% passives (7-8)
          detractors: 20 // 20% detractors (0-6)
        },
        satisfactionTrends: this.generateSatisfactionTrends(period),
        commonFeedback: [
          {
            theme: 'Ease of Use',
            count: 23,
            sentiment: 'positive',
            examples: [
              'The platform is intuitive and easy to navigate',
              'Love how simple it is to complete evaluations'
            ]
          },
          {
            theme: 'Report Quality',
            count: 18,
            sentiment: 'positive',
            examples: [
              'The PDF reports are professional and detailed',
              'Great insights in the recommendations'
            ]
          },
          {
            theme: 'Response Time',
            count: 12,
            sentiment: 'negative',
            examples: [
              'Support takes too long to respond',
              'Evaluations sometimes take longer than expected'
            ]
          },
          {
            theme: 'Feature Requests',
            count: 15,
            sentiment: 'neutral',
            examples: [
              'Would like mobile app',
              'More industry-specific templates needed'
            ]
          }
        ],
        featureRequests: [
          {
            feature: 'Mobile Application',
            requestCount: 28,
            priority: 'high'
          },
          {
            feature: 'Industry-Specific Templates',
            requestCount: 19,
            priority: 'medium'
          },
          {
            feature: 'Real-time Collaboration',
            requestCount: 14,
            priority: 'medium'
          },
          {
            feature: 'Advanced Export Options',
            requestCount: 8,
            priority: 'low'
          }
        ]
      }

      return analytics
    } catch (error) {
      console.error('Error getting feedback analytics:', error)
      throw error
    }
  }

  /**
   * Get user's feedback history
   */
  static async getUserFeedbackHistory(
    userId: string,
    limit: number = 10
  ): Promise<{
    npsResponses: NPSResponse[]
    surveys: FeedbackSurvey[]
  }> {
    try {
      // Mock user feedback history - in production would query database
      const npsResponses: NPSResponse[] = [
        {
          id: `nps_${userId}_1`,
          userId,
          score: 9,
          comment: 'Great platform, really helped improve our business!',
          surveyType: 'milestone',
          submittedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30),
          followUpRequired: false
        },
        {
          id: `nps_${userId}_2`,
          userId,
          score: 8,
          surveyType: 'periodic',
          submittedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 60),
          followUpRequired: false
        }
      ]

      const surveys: FeedbackSurvey[] = [
        {
          id: `survey_${userId}_1`,
          userId,
          surveyType: 'satisfaction',
          questions: this.generateSurveyQuestions('satisfaction'),
          responses: [
            { questionId: 'q1', response: 4 },
            { questionId: 'q2', response: 'Very satisfied with the analytics features' }
          ],
          status: 'completed',
          sentAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 15),
          completedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 13),
          remindersSent: 1
        }
      ]

      return {
        npsResponses: npsResponses.slice(0, limit),
        surveys: surveys.slice(0, limit)
      }
    } catch (error) {
      console.error('Error getting user feedback history:', error)
      throw error
    }
  }

  /**
   * Send NPS survey to user
   */
  static async sendNPSSurvey(
    userId: string,
    surveyType: NPSResponse['surveyType'] = 'periodic',
    triggerEvent?: string
  ): Promise<void> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { email: true, businessName: true }
      })

      if (!user?.email) {
        return
      }

      // Send email NPS survey
      await this.sendNPSEmail(user.email, user.businessName || 'there', surveyType, triggerEvent)

      // Send in-app notification
      await NotificationService.createNotification(userId, {
        type: 'feedback',
        title: 'How are we doing?',
        message: 'We\'d love your feedback! Please take a moment to rate your experience with GoodBuy HQ.',
        actionUrl: '/feedback/nps',
        actionLabel: 'Provide Feedback',
        priority: 'low'
      })

      console.log('NPS survey sent to user:', userId)
    } catch (error) {
      console.error('Error sending NPS survey:', error)
    }
  }

  /**
   * Process feedback for sentiment analysis and categorization
   */
  static async processFeedbackSentiment(feedbackText: string): Promise<{
    sentiment: 'positive' | 'neutral' | 'negative'
    confidence: number
    themes: string[]
    actionRequired: boolean
  }> {
    try {
      // Mock sentiment analysis - in production would use AI/ML service
      const sentiment = this.analyzeSentiment(feedbackText)
      const themes = this.extractThemes(feedbackText)
      const actionRequired = sentiment === 'negative' || themes.includes('bug') || themes.includes('issue')

      return {
        sentiment,
        confidence: 0.85,
        themes,
        actionRequired
      }
    } catch (error) {
      console.error('Error processing feedback sentiment:', error)
      return {
        sentiment: 'neutral',
        confidence: 0,
        themes: [],
        actionRequired: false
      }
    }
  }

  /**
   * Private helper methods
   */

  private static determineFollowUpRequired(score: number, comment?: string): boolean {
    // Detractors (0-6) always need follow-up
    if (score <= 6) return true
    
    // Comments with negative keywords need follow-up
    if (comment) {
      const negativeKeywords = ['problem', 'issue', 'bug', 'slow', 'difficult', 'frustrated', 'disappointed']
      const lowerComment = comment.toLowerCase()
      return negativeKeywords.some(keyword => lowerComment.includes(keyword))
    }
    
    return false
  }

  private static async scheduleNPSFollowUp(userId: string, response: NPSResponse): Promise<void> {
    // Schedule follow-up outreach for detractors
    setTimeout(async () => {
      await NotificationService.createNotification(userId, {
        type: 'support',
        title: 'We\'d Like to Help',
        message: 'Thank you for your feedback. Our team would like to address your concerns and improve your experience.',
        actionUrl: '/support',
        actionLabel: 'Contact Support',
        priority: 'high'
      })
    }, 24 * 60 * 60 * 1000) // 24 hours delay
  }

  private static generateSurveyQuestions(surveyType: FeedbackSurvey['surveyType']): SurveyQuestion[] {
    const baseQuestions = [
      {
        id: 'q1',
        type: 'rating' as const,
        question: 'How satisfied are you with GoodBuy HQ overall?',
        required: true
      },
      {
        id: 'q2',
        type: 'text' as const,
        question: 'What do you like most about GoodBuy HQ?',
        required: false
      }
    ]

    switch (surveyType) {
      case 'satisfaction':
        return [
          ...baseQuestions,
          {
            id: 'q3',
            type: 'rating' as const,
            question: 'How easy is it to use our platform?',
            required: true
          },
          {
            id: 'q4',
            type: 'rating' as const,
            question: 'How valuable are the insights we provide?',
            required: true
          }
        ]
      
      case 'feature_request':
        return [
          {
            id: 'q1',
            type: 'text' as const,
            question: 'What new feature would you like to see added?',
            required: true
          },
          {
            id: 'q2',
            type: 'multiple_choice' as const,
            question: 'How important is this feature to you?',
            options: ['Critical', 'Very Important', 'Somewhat Important', 'Nice to Have'],
            required: true
          }
        ]
      
      case 'bug_report':
        return [
          {
            id: 'q1',
            type: 'text' as const,
            question: 'Please describe the issue you encountered:',
            required: true
          },
          {
            id: 'q2',
            type: 'multiple_choice' as const,
            question: 'How frequently does this issue occur?',
            options: ['Every time', 'Often', 'Sometimes', 'Rarely'],
            required: true
          }
        ]
      
      default:
        return baseQuestions
    }
  }

  private static async getSurveyById(surveyId: string): Promise<FeedbackSurvey | null> {
    // Mock survey retrieval - in production would query database
    return {
      id: surveyId,
      userId: 'user_123',
      surveyType: 'satisfaction',
      questions: this.generateSurveyQuestions('satisfaction'),
      responses: [],
      status: 'in_progress',
      sentAt: new Date(),
      remindersSent: 0
    }
  }

  private static async analyzeSurveyResponses(survey: FeedbackSurvey): Promise<void> {
    // Analyze responses for patterns and trigger actions
    const lowSatisfactionResponses = survey.responses.filter(
      r => typeof r.response === 'number' && r.response <= 2
    )

    if (lowSatisfactionResponses.length > 0) {
      // Trigger customer success outreach
      await NotificationService.createNotification(survey.userId, {
        type: 'support',
        title: 'Let Us Help Improve Your Experience',
        message: 'We noticed some areas where we can improve. Our customer success team would like to connect with you.',
        actionUrl: '/support',
        actionLabel: 'Get Help',
        priority: 'high'
      })
    }
  }

  private static async sendSurveyNotification(userId: string, survey: FeedbackSurvey): Promise<void> {
    const surveyTypeLabels = {
      satisfaction: 'Satisfaction Survey',
      feature_request: 'Feature Request',
      bug_report: 'Bug Report',
      general: 'Feedback Survey'
    }

    await NotificationService.createNotification(userId, {
      type: 'feedback',
      title: `New ${surveyTypeLabels[survey.surveyType]}`,
      message: 'We\'d appreciate your feedback to help us improve GoodBuy HQ.',
      actionUrl: `/surveys/${survey.id}`,
      actionLabel: 'Complete Survey',
      priority: 'low'
    })
  }

  private static calculateNPSScore(): number {
    // Mock NPS calculation - in production would calculate from real data
    const promoters = 45 // %
    const detractors = 20 // %
    return promoters - detractors // NPS = % promoters - % detractors
  }

  private static generateSatisfactionTrends(period: FeedbackAnalytics['period']) {
    const trends = []
    const days = period === 'week' ? 7 : period === 'month' ? 30 : period === 'quarter' ? 90 : 365
    
    for (let i = days; i >= 0; i--) {
      trends.push({
        date: new Date(Date.now() - i * 24 * 60 * 60 * 1000),
        averageScore: 4.2 + Math.random() * 0.6, // 4.2-4.8 range
        responseCount: Math.floor(Math.random() * 20) + 5 // 5-25 responses
      })
    }
    
    return trends
  }

  private static async sendNPSEmail(
    email: string,
    businessName: string,
    surveyType: NPSResponse['surveyType'],
    triggerEvent?: string
  ): Promise<void> {
    const subject = 'How likely are you to recommend GoodBuy HQ?'
    const message = `
      <h2>Hi ${businessName},</h2>
      ${triggerEvent ? `<p>Following your recent ${triggerEvent}, we'd love to get your feedback.</p>` : ''}
      
      <p>We're always working to improve GoodBuy HQ, and your opinion matters to us.</p>
      
      <p><strong>On a scale of 0-10, how likely are you to recommend GoodBuy HQ to a colleague or friend?</strong></p>
      
      <div style="text-align: center; margin: 30px 0;">
        <p style="font-size: 12px; color: #666;">Not likely at all&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Extremely likely</p>
        <div style="display: inline-block; background: #f8f9fa; padding: 10px; border-radius: 8px;">
          ${Array.from({ length: 11 }, (_, i) => 
            `<a href="/feedback/nps?score=${i}" style="display: inline-block; width: 30px; height: 30px; line-height: 30px; margin: 2px; background: #007bff; color: white; text-decoration: none; border-radius: 4px; font-weight: bold;">${i}</a>`
          ).join('')}
        </div>
      </div>
      
      <p>This will only take a moment, and we truly appreciate your feedback!</p>
    `
    
    await EmailService.sendNotificationEmail(email, subject, message, '/feedback/nps')
  }

  private static analyzeSentiment(text: string): 'positive' | 'neutral' | 'negative' {
    // Simple keyword-based sentiment analysis - in production would use ML
    const positiveWords = ['great', 'excellent', 'amazing', 'love', 'perfect', 'helpful', 'fantastic']
    const negativeWords = ['terrible', 'awful', 'hate', 'horrible', 'useless', 'frustrated', 'disappointed']
    
    const lowerText = text.toLowerCase()
    const positiveCount = positiveWords.filter(word => lowerText.includes(word)).length
    const negativeCount = negativeWords.filter(word => lowerText.includes(word)).length
    
    if (positiveCount > negativeCount) return 'positive'
    if (negativeCount > positiveCount) return 'negative'
    return 'neutral'
  }

  private static extractThemes(text: string): string[] {
    // Simple keyword extraction - in production would use NLP
    const themes = []
    const lowerText = text.toLowerCase()
    
    if (lowerText.includes('report') || lowerText.includes('pdf')) themes.push('reports')
    if (lowerText.includes('support') || lowerText.includes('help')) themes.push('support')
    if (lowerText.includes('slow') || lowerText.includes('performance')) themes.push('performance')
    if (lowerText.includes('bug') || lowerText.includes('error') || lowerText.includes('issue')) themes.push('bugs')
    if (lowerText.includes('feature') || lowerText.includes('functionality')) themes.push('features')
    if (lowerText.includes('interface') || lowerText.includes('design')) themes.push('ui/ux')
    
    return themes
  }
}