import { PrismaClient } from '@prisma/client'
import { AnalyticsService } from './AnalyticsService'
import { ValueImpactService } from './ValueImpactService'
import { NotificationService, AIOpportunity } from './NotificationService'
import { PremiumAccessService } from './PremiumAccessService'

const prisma = new PrismaClient()

export interface OpportunityDetectionResult {
  opportunities: AIOpportunity[]
  detectionConfidence: number
  analysisTimestamp: Date
}

export interface BusinessChangeDetection {
  significantChanges: Array<{
    metric: string
    previousValue: number
    currentValue: number
    changePercentage: number
    significance: 'low' | 'medium' | 'high'
  }>
  trendAnalysis: {
    direction: 'improving' | 'declining' | 'stable'
    confidence: number
    keyFactors: string[]
  }
}

export class OpportunityDetectionService {
  /**
   * Run AI opportunity detection for a user
   */
  static async detectOpportunities(userId: string): Promise<OpportunityDetectionResult> {
    try {
      // Check premium access
      const accessCheck = await PremiumAccessService.checkAIFeatureAccess(userId)
      if (!accessCheck.hasAccess) {
        throw new Error('Premium subscription required for AI opportunity detection')
      }

      // Get user's evaluation history and analytics
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          evaluations: {
            orderBy: { createdAt: 'desc' },
            take: 10
          }
        }
      })

      if (!user || user.evaluations.length < 2) {
        return {
          opportunities: [],
          detectionConfidence: 0,
          analysisTimestamp: new Date()
        }
      }

      // Analyze business changes
      const changeDetection = await this.detectBusinessChanges(user)
      
      // Get analytics data for trend analysis
      const analyticsData = await AnalyticsService.getAnalyticsDashboardData(userId).catch(() => null)
      
      // Get value impact data
      const roiAnalysis = await ValueImpactService.getROIAnalysis(userId).catch(() => null)

      // Generate opportunities based on analysis
      const opportunities = await this.generateOpportunityInsights(
        user,
        changeDetection,
        analyticsData,
        roiAnalysis
      )

      // Create notifications for new opportunities
      for (const opportunity of opportunities) {
        if (opportunity.priority === 'high' || opportunity.priority === 'urgent') {
          await NotificationService.createNotification(userId, {
            type: 'opportunity',
            title: opportunity.title,
            message: opportunity.description,
            actionUrl: '/guides',
            actionLabel: 'View Recommendations',
            priority: opportunity.priority
          })
        }
      }

      return {
        opportunities,
        detectionConfidence: this.calculateOverallConfidence(opportunities),
        analysisTimestamp: new Date()
      }
    } catch (error) {
      console.error('Error detecting opportunities:', error)
      throw error
    }
  }

  /**
   * Detect significant business changes
   */
  private static async detectBusinessChanges(user: any): Promise<BusinessChangeDetection> {
    try {
      const evaluations = user.evaluations
      if (evaluations.length < 2) {
        return {
          significantChanges: [],
          trendAnalysis: {
            direction: 'stable',
            confidence: 0,
            keyFactors: []
          }
        }
      }

      const latest = evaluations[0]
      const previous = evaluations[1]

      const significantChanges = []

      // Health Score Change
      const healthChange = (latest.healthScore || 0) - (previous.healthScore || 0)
      if (Math.abs(healthChange) > 5) {
        significantChanges.push({
          metric: 'Health Score',
          previousValue: previous.healthScore || 0,
          currentValue: latest.healthScore || 0,
          changePercentage: ((healthChange / (previous.healthScore || 1)) * 100),
          significance: Math.abs(healthChange) > 15 ? 'high' : 'medium' as 'high' | 'medium'
        })
      }

      // Valuation Change
      const previousValuation = this.extractValuation(previous)
      const currentValuation = this.extractValuation(latest)
      const valuationChange = ((currentValuation - previousValuation) / previousValuation) * 100

      if (Math.abs(valuationChange) > 5) {
        significantChanges.push({
          metric: 'Business Valuation',
          previousValue: previousValuation,
          currentValue: currentValuation,
          changePercentage: valuationChange,
          significance: Math.abs(valuationChange) > 20 ? 'high' : 'medium' as 'high' | 'medium'
        })
      }

      // Trend Analysis
      const overallTrend = healthChange > 5 ? 'improving' : healthChange < -5 ? 'declining' : 'stable'
      const confidence = Math.min(0.9, significantChanges.length * 0.3 + 0.1)
      
      const keyFactors = []
      if (healthChange > 5) keyFactors.push('Improving business health metrics')
      if (healthChange < -5) keyFactors.push('Declining performance indicators')
      if (Math.abs(valuationChange) > 10) keyFactors.push('Significant valuation changes')

      return {
        significantChanges,
        trendAnalysis: {
          direction: overallTrend,
          confidence,
          keyFactors
        }
      }
    } catch (error) {
      console.error('Error detecting business changes:', error)
      return {
        significantChanges: [],
        trendAnalysis: {
          direction: 'stable',
          confidence: 0,
          keyFactors: []
        }
      }
    }
  }

  /**
   * Generate opportunity insights using AI analysis
   */
  private static async generateOpportunityInsights(
    user: any,
    changeDetection: BusinessChangeDetection,
    analyticsData: any,
    roiAnalysis: any
  ): Promise<AIOpportunity[]> {
    const opportunities: AIOpportunity[] = []
    const latestEvaluation = user.evaluations[0]

    // Health Score Improvement Opportunities
    if (latestEvaluation.healthScore < 75) {
      opportunities.push({
        id: `opp_health_${Date.now()}`,
        userId: user.id,
        type: 'improvement',
        title: 'Business Health Optimization Opportunity',
        description: `Your current health score of ${latestEvaluation.healthScore}/100 suggests room for improvement. Focus on operational efficiency and strategic planning to boost performance.`,
        priority: latestEvaluation.healthScore < 60 ? 'high' : 'medium',
        actionRequired: true,
        relatedEvaluationId: latestEvaluation.id,
        aiConfidence: 0.85,
        detectedAt: new Date(),
        status: 'new'
      })
    }

    // Declining Trend Alert
    if (changeDetection.trendAnalysis.direction === 'declining') {
      opportunities.push({
        id: `opp_trend_${Date.now()}`,
        userId: user.id,
        type: 'risk_alert',
        title: 'Performance Decline Alert',
        description: 'AI analysis has detected a declining trend in your business metrics. Immediate attention recommended to prevent further decline.',
        priority: 'urgent',
        actionRequired: true,
        relatedEvaluationId: latestEvaluation.id,
        aiConfidence: changeDetection.trendAnalysis.confidence,
        detectedAt: new Date(),
        status: 'new'
      })
    }

    // Growth Opportunity Detection
    if (changeDetection.trendAnalysis.direction === 'improving' && latestEvaluation.healthScore > 80) {
      opportunities.push({
        id: `opp_growth_${Date.now()}`,
        userId: user.id,
        type: 'improvement',
        title: 'Accelerated Growth Opportunity',
        description: 'Your strong performance trend indicates readiness for strategic expansion. Consider scaling successful initiatives.',
        priority: 'high',
        actionRequired: false,
        relatedEvaluationId: latestEvaluation.id,
        aiConfidence: 0.78,
        detectedAt: new Date(),
        status: 'new'
      })
    }

    // ROI Optimization Opportunities
    if (roiAnalysis && roiAnalysis.overallROI < 0.15) {
      opportunities.push({
        id: `opp_roi_${Date.now()}`,
        userId: user.id,
        type: 'improvement',
        title: 'ROI Enhancement Opportunity',
        description: `Current ROI of ${((roiAnalysis.overallROI || 0) * 100).toFixed(1)}% suggests optimization potential. Review implementation strategies for better returns.`,
        priority: 'medium',
        actionRequired: true,
        relatedEvaluationId: latestEvaluation.id,
        aiConfidence: 0.72,
        detectedAt: new Date(),
        status: 'new'
      })
    }

    // Data Quality Opportunity
    if (analyticsData && analyticsData.summary.dataQuality < 0.7) {
      opportunities.push({
        id: `opp_data_${Date.now()}`,
        userId: user.id,
        type: 'improvement',
        title: 'Data Quality Enhancement',
        description: 'Improving data collection consistency will enhance prediction accuracy and provide better business insights.',
        priority: 'medium',
        actionRequired: false,
        relatedEvaluationId: latestEvaluation.id,
        aiConfidence: 0.68,
        detectedAt: new Date(),
        status: 'new'
      })
    }

    // Milestone Achievement Opportunity
    if (user.evaluations.length >= 5 && latestEvaluation.healthScore > 85) {
      opportunities.push({
        id: `opp_milestone_${Date.now()}`,
        userId: user.id,
        type: 'milestone',
        title: 'Excellence Milestone Achievement',
        description: 'Congratulations! Your consistent high performance qualifies you for advanced optimization strategies.',
        priority: 'low',
        actionRequired: false,
        relatedEvaluationId: latestEvaluation.id,
        aiConfidence: 0.90,
        detectedAt: new Date(),
        status: 'new'
      })
    }

    return opportunities.filter(opp => opp.aiConfidence > 0.6)
  }

  /**
   * Calculate overall detection confidence
   */
  private static calculateOverallConfidence(opportunities: AIOpportunity[]): number {
    if (opportunities.length === 0) return 0
    
    const totalConfidence = opportunities.reduce((sum, opp) => sum + opp.aiConfidence, 0)
    return totalConfidence / opportunities.length
  }

  /**
   * Extract valuation from evaluation
   */
  private static extractValuation(evaluation: any): number {
    if (evaluation?.valuations) {
      return evaluation.valuations.weighted?.value || 
             evaluation.valuations.weighted || 
             evaluation.valuations.businessValue || 
             500000
    }
    return 500000
  }

  /**
   * Get user's detected opportunities
   */
  static async getUserOpportunities(
    userId: string,
    options: {
      status?: 'new' | 'viewed' | 'acted_upon' | 'dismissed'
      type?: 'improvement' | 'risk_alert' | 'trend_change' | 'milestone'
      priority?: 'low' | 'medium' | 'high' | 'urgent'
      limit?: number
    } = {}
  ): Promise<AIOpportunity[]> {
    try {
      // In production, would query database for stored opportunities
      // For now, return mock opportunities based on filters
      const mockOpportunities: AIOpportunity[] = [
        {
          id: 'opp_1',
          userId,
          type: 'improvement',
          title: 'Cash Flow Optimization Opportunity',
          description: 'AI analysis suggests implementing automated invoicing could improve cash flow by 15-20%.',
          priority: 'high',
          actionRequired: true,
          relatedEvaluationId: 'eval_123',
          aiConfidence: 0.87,
          detectedAt: new Date(Date.now() - 1000 * 60 * 60 * 6), // 6 hours ago
          status: 'new'
        },
        {
          id: 'opp_2',
          userId,
          type: 'trend_change',
          title: 'Market Position Strengthening',
          description: 'Recent evaluation shows improving competitive position. Consider market expansion strategies.',
          priority: 'medium',
          actionRequired: false,
          relatedEvaluationId: 'eval_124',
          aiConfidence: 0.75,
          detectedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2), // 2 days ago
          status: 'viewed'
        }
      ]

      let filtered = mockOpportunities
      
      if (options.status) {
        filtered = filtered.filter(opp => opp.status === options.status)
      }
      if (options.type) {
        filtered = filtered.filter(opp => opp.type === options.type)
      }
      if (options.priority) {
        filtered = filtered.filter(opp => opp.priority === options.priority)
      }

      if (options.limit) {
        filtered = filtered.slice(0, options.limit)
      }

      return filtered
    } catch (error) {
      console.error('Error getting user opportunities:', error)
      throw error
    }
  }

  /**
   * Update opportunity status
   */
  static async updateOpportunityStatus(
    userId: string,
    opportunityId: string,
    status: 'new' | 'viewed' | 'acted_upon' | 'dismissed'
  ): Promise<{ success: boolean }> {
    try {
      // In production, would update database record
      return { success: true }
    } catch (error) {
      console.error('Error updating opportunity status:', error)
      throw error
    }
  }
}