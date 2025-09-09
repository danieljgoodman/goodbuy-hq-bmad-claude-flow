import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export interface SuccessMetrics {
  id: string
  userId: string
  baselineValuation: number
  currentValuation: number
  valuationImprovement: number
  improvementPercentage: number
  implementationCompletionRate: number
  engagementScore: number
  timeToValue: number // days from signup to first significant improvement
  totalTimeInvested: number // hours
  roi: number
  npsScore: number
  lastCalculated: Date
}

export interface PlatformMetrics {
  totalUsers: number
  activeUsers: number
  premiumUsers: number
  averageValuationImprovement: number
  averageImplementationRate: number
  averageEngagementScore: number
  averageNPS: number
  conversionRate: number
  retentionRate: number
  averageTimeToValue: number
  totalValueCreated: number
}

export interface UserSuccessJourney {
  userId: string
  signupDate: Date
  firstEvaluationDate?: Date
  firstImprovementDate?: Date
  premiumUpgradeDate?: Date
  milestones: SuccessMilestone[]
  currentStage: 'onboarding' | 'engaged' | 'improving' | 'advocate' | 'churned'
  riskLevel: 'low' | 'medium' | 'high'
}

export interface SuccessMilestone {
  id: string
  userId: string
  milestoneType: 'first_evaluation' | 'first_improvement' | 'significant_improvement' | 'premium_upgrade' | 'advocate'
  achievedAt: Date
  valuationAtTime: number
  improvementFromBaseline: number
  description: string
}

export class SuccessTrackingService {
  /**
   * Calculate comprehensive success metrics for a user
   */
  static async calculateUserSuccessMetrics(userId: string): Promise<SuccessMetrics> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          evaluations: {
            orderBy: { createdAt: 'asc' }
          },
          progressTracking: true
        }
      })

      if (!user || user.evaluations.length === 0) {
        throw new Error('Insufficient data to calculate success metrics')
      }

      const firstEvaluation = user.evaluations[0]
      const latestEvaluation = user.evaluations[user.evaluations.length - 1]
      
      const baselineValuation = this.extractValuation(firstEvaluation)
      const currentValuation = this.extractValuation(latestEvaluation)
      const valuationImprovement = currentValuation - baselineValuation
      const improvementPercentage = (valuationImprovement / baselineValuation) * 100

      // Calculate implementation completion rate
      const implementationRate = await this.calculateImplementationRate(userId)
      
      // Calculate engagement score (0-10)
      const engagementScore = await this.calculateEngagementScore(userId)
      
      // Calculate time to value (days until first 10% improvement)
      const timeToValue = await this.calculateTimeToValue(userId)
      
      // Estimate time invested (mock calculation)
      const totalTimeInvested = user.evaluations.length * 2 + (implementationRate * 20)
      
      // Calculate ROI (improvement value / time invested)
      const roi = valuationImprovement / Math.max(totalTimeInvested, 1)
      
      // Get or calculate NPS score
      const npsScore = await this.getUserNPSScore(userId)

      const metrics: SuccessMetrics = {
        id: `metrics_${userId}_${Date.now()}`,
        userId,
        baselineValuation,
        currentValuation,
        valuationImprovement,
        improvementPercentage,
        implementationCompletionRate: implementationRate,
        engagementScore,
        timeToValue,
        totalTimeInvested,
        roi,
        npsScore,
        lastCalculated: new Date()
      }

      return metrics
    } catch (error) {
      console.error('Error calculating user success metrics:', error)
      throw error
    }
  }

  /**
   * Get platform-wide success metrics for admin dashboard
   */
  static async getPlatformSuccessMetrics(): Promise<PlatformMetrics> {
    try {
      const totalUsers = await prisma.user.count()
      const activeUsers = await this.getActiveUserCount()
      const premiumUsers = await this.getPremiumUserCount()

      // Calculate aggregate metrics across all users
      const allUserMetrics = await this.getAllUserMetrics()
      
      const averageValuationImprovement = this.calculateAverage(
        allUserMetrics.map(m => m.valuationImprovement)
      )
      
      const averageImplementationRate = this.calculateAverage(
        allUserMetrics.map(m => m.implementationCompletionRate)
      )
      
      const averageEngagementScore = this.calculateAverage(
        allUserMetrics.map(m => m.engagementScore)
      )
      
      const averageNPS = this.calculateAverage(
        allUserMetrics.map(m => m.npsScore).filter(score => score > 0)
      )

      const conversionRate = totalUsers > 0 ? (premiumUsers / totalUsers) * 100 : 0
      const retentionRate = await this.calculateRetentionRate()
      
      const averageTimeToValue = this.calculateAverage(
        allUserMetrics.map(m => m.timeToValue).filter(ttv => ttv > 0)
      )
      
      const totalValueCreated = allUserMetrics.reduce((sum, m) => sum + m.valuationImprovement, 0)

      return {
        totalUsers,
        activeUsers,
        premiumUsers,
        averageValuationImprovement,
        averageImplementationRate,
        averageEngagementScore,
        averageNPS,
        conversionRate,
        retentionRate,
        averageTimeToValue,
        totalValueCreated
      }
    } catch (error) {
      console.error('Error calculating platform success metrics:', error)
      throw error
    }
  }

  /**
   * Get user's success journey and milestones
   */
  static async getUserSuccessJourney(userId: string): Promise<UserSuccessJourney> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          evaluations: {
            orderBy: { createdAt: 'asc' }
          }
        }
      })

      if (!user) {
        throw new Error('User not found')
      }

      const milestones = await this.identifyUserMilestones(userId, user.evaluations)
      const currentStage = this.determineUserStage(user, milestones)
      const riskLevel = await this.assessUserRiskLevel(userId, milestones)

      return {
        userId,
        signupDate: user.createdAt,
        firstEvaluationDate: user.evaluations[0]?.createdAt,
        firstImprovementDate: milestones.find(m => m.milestoneType === 'first_improvement')?.achievedAt,
        premiumUpgradeDate: user.premiumSubscriptionDate,
        milestones,
        currentStage,
        riskLevel
      }
    } catch (error) {
      console.error('Error getting user success journey:', error)
      throw error
    }
  }

  /**
   * Identify users ready for testimonial requests
   */
  static async identifyTestimonialCandidates(): Promise<{
    userId: string
    improvementPercentage: number
    currentValuation: number
    timeFrame: string
  }[]> {
    try {
      const allUsers = await prisma.user.findMany({
        include: {
          evaluations: {
            orderBy: { createdAt: 'asc' }
          }
        }
      })

      const candidates = []

      for (const user of allUsers) {
        if (user.evaluations.length < 2) continue

        const metrics = await this.calculateUserSuccessMetrics(user.id)
        
        // Criteria for testimonial request: >20% improvement
        if (metrics.improvementPercentage >= 20) {
          const timeFrame = this.calculateTimeFrame(
            user.evaluations[0].createdAt,
            user.evaluations[user.evaluations.length - 1].createdAt
          )

          candidates.push({
            userId: user.id,
            improvementPercentage: metrics.improvementPercentage,
            currentValuation: metrics.currentValuation,
            timeFrame
          })
        }
      }

      // Sort by improvement percentage (highest first)
      return candidates.sort((a, b) => b.improvementPercentage - a.improvementPercentage)
    } catch (error) {
      console.error('Error identifying testimonial candidates:', error)
      throw error
    }
  }

  /**
   * Record a success milestone for a user
   */
  static async recordMilestone(
    userId: string,
    milestoneType: SuccessMilestone['milestoneType'],
    valuationAtTime: number,
    description: string
  ): Promise<SuccessMilestone> {
    try {
      const baselineValuation = await this.getBaselineValuation(userId)
      const improvementFromBaseline = valuationAtTime - baselineValuation

      const milestone: SuccessMilestone = {
        id: `milestone_${userId}_${milestoneType}_${Date.now()}`,
        userId,
        milestoneType,
        achievedAt: new Date(),
        valuationAtTime,
        improvementFromBaseline,
        description
      }

      // In production, would save to database
      console.log('Milestone recorded:', milestone.id)
      
      return milestone
    } catch (error) {
      console.error('Error recording milestone:', error)
      throw error
    }
  }

  /**
   * Private helper methods
   */

  private static extractValuation(evaluation: any): number {
    // Extract valuation from evaluation data
    return evaluation.valuation || evaluation.overallScore * 10000 || 100000
  }

  private static async calculateImplementationRate(userId: string): Promise<number> {
    try {
      const progress = await prisma.progressTracking.findMany({
        where: { userId }
      })

      if (progress.length === 0) return 0

      const totalActions = progress.reduce((sum, p) => sum + (p.totalActionItems || 0), 0)
      const completedActions = progress.reduce((sum, p) => sum + (p.completedActionItems || 0), 0)

      return totalActions > 0 ? (completedActions / totalActions) * 100 : 0
    } catch (error) {
      return 0
    }
  }

  private static async calculateEngagementScore(userId: string): Promise<number> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          evaluations: true
        }
      })

      if (!user) return 0

      let score = 0
      
      // Evaluation frequency (0-3 points)
      const evaluationCount = user.evaluations.length
      score += Math.min(evaluationCount * 0.5, 3)
      
      // Recent activity (0-2 points)
      const daysSinceLastActivity = Math.floor(
        (Date.now() - user.lastLoginAt.getTime()) / (1000 * 60 * 60 * 24)
      )
      score += daysSinceLastActivity < 7 ? 2 : daysSinceLastActivity < 30 ? 1 : 0
      
      // Premium subscription (0-2 points)
      score += user.premiumSubscriptionDate ? 2 : 0
      
      // Progress tracking usage (0-3 points)
      const progressRecords = await prisma.progressTracking.count({
        where: { userId }
      })
      score += Math.min(progressRecords * 0.3, 3)

      return Math.min(score, 10)
    } catch (error) {
      return 0
    }
  }

  private static async calculateTimeToValue(userId: string): Promise<number> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          evaluations: {
            orderBy: { createdAt: 'asc' }
          }
        }
      })

      if (!user || user.evaluations.length < 2) return 0

      const signupDate = user.createdAt
      const baselineValuation = this.extractValuation(user.evaluations[0])

      // Find first evaluation with >10% improvement
      for (const evaluation of user.evaluations.slice(1)) {
        const currentValuation = this.extractValuation(evaluation)
        const improvement = ((currentValuation - baselineValuation) / baselineValuation) * 100
        
        if (improvement >= 10) {
          const daysToValue = Math.floor(
            (evaluation.createdAt.getTime() - signupDate.getTime()) / (1000 * 60 * 60 * 24)
          )
          return daysToValue
        }
      }

      return 0
    } catch (error) {
      return 0
    }
  }

  private static async getUserNPSScore(userId: string): Promise<number> {
    // Mock NPS score - in production would query feedback database
    return Math.floor(Math.random() * 11) // 0-10 scale
  }

  private static async getActiveUserCount(): Promise<number> {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    return await prisma.user.count({
      where: {
        lastLoginAt: {
          gte: thirtyDaysAgo
        }
      }
    })
  }

  private static async getPremiumUserCount(): Promise<number> {
    return await prisma.user.count({
      where: {
        premiumSubscriptionDate: {
          not: null
        }
      }
    })
  }

  private static async getAllUserMetrics(): Promise<SuccessMetrics[]> {
    // Mock implementation - in production would query all users
    const users = await prisma.user.findMany({
      include: { evaluations: true }
    })

    const metrics: SuccessMetrics[] = []
    
    for (const user of users.slice(0, 100)) { // Limit for performance
      try {
        if (user.evaluations.length >= 2) {
          const userMetrics = await this.calculateUserSuccessMetrics(user.id)
          metrics.push(userMetrics)
        }
      } catch (error) {
        // Skip users with insufficient data
        continue
      }
    }

    return metrics
  }

  private static calculateAverage(numbers: number[]): number {
    if (numbers.length === 0) return 0
    return numbers.reduce((sum, num) => sum + num, 0) / numbers.length
  }

  private static async calculateRetentionRate(): Promise<number> {
    // Mock retention calculation - in production would analyze cohorts
    return 78.5 // 78.5% retention rate
  }

  private static async identifyUserMilestones(userId: string, evaluations: any[]): Promise<SuccessMilestone[]> {
    const milestones: SuccessMilestone[] = []

    if (evaluations.length === 0) return milestones

    const baselineValuation = this.extractValuation(evaluations[0])

    // First evaluation milestone
    milestones.push({
      id: `milestone_${userId}_first_evaluation`,
      userId,
      milestoneType: 'first_evaluation',
      achievedAt: evaluations[0].createdAt,
      valuationAtTime: baselineValuation,
      improvementFromBaseline: 0,
      description: 'Completed first business evaluation'
    })

    // Look for improvement milestones
    for (let i = 1; i < evaluations.length; i++) {
      const currentValuation = this.extractValuation(evaluations[i])
      const improvement = ((currentValuation - baselineValuation) / baselineValuation) * 100

      if (improvement >= 10 && !milestones.find(m => m.milestoneType === 'first_improvement')) {
        milestones.push({
          id: `milestone_${userId}_first_improvement`,
          userId,
          milestoneType: 'first_improvement',
          achievedAt: evaluations[i].createdAt,
          valuationAtTime: currentValuation,
          improvementFromBaseline: currentValuation - baselineValuation,
          description: `Achieved first significant improvement: ${improvement.toFixed(1)}%`
        })
      }

      if (improvement >= 25 && !milestones.find(m => m.milestoneType === 'significant_improvement')) {
        milestones.push({
          id: `milestone_${userId}_significant_improvement`,
          userId,
          milestoneType: 'significant_improvement',
          achievedAt: evaluations[i].createdAt,
          valuationAtTime: currentValuation,
          improvementFromBaseline: currentValuation - baselineValuation,
          description: `Achieved significant improvement: ${improvement.toFixed(1)}%`
        })
      }
    }

    return milestones.sort((a, b) => a.achievedAt.getTime() - b.achievedAt.getTime())
  }

  private static determineUserStage(user: any, milestones: SuccessMilestone[]): UserSuccessJourney['currentStage'] {
    if (milestones.length === 0) return 'onboarding'
    
    const hasImprovement = milestones.some(m => m.milestoneType === 'first_improvement')
    const hasSignificantImprovement = milestones.some(m => m.milestoneType === 'significant_improvement')
    const isPremium = user.premiumSubscriptionDate !== null

    const daysSinceLastLogin = Math.floor(
      (Date.now() - user.lastLoginAt.getTime()) / (1000 * 60 * 60 * 24)
    )

    if (daysSinceLastLogin > 30) return 'churned'
    if (hasSignificantImprovement && isPremium) return 'advocate'
    if (hasImprovement) return 'improving'
    if (milestones.length > 0) return 'engaged'
    
    return 'onboarding'
  }

  private static async assessUserRiskLevel(userId: string, milestones: SuccessMilestone[]): Promise<UserSuccessJourney['riskLevel']> {
    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (!user) return 'high'

    const daysSinceSignup = Math.floor(
      (Date.now() - user.createdAt.getTime()) / (1000 * 60 * 60 * 24)
    )
    
    const daysSinceLastLogin = Math.floor(
      (Date.now() - user.lastLoginAt.getTime()) / (1000 * 60 * 60 * 24)
    )

    // High risk indicators
    if (daysSinceLastLogin > 14) return 'high'
    if (daysSinceSignup > 30 && milestones.length === 0) return 'high'
    
    // Medium risk indicators
    if (daysSinceLastLogin > 7) return 'medium'
    if (daysSinceSignup > 14 && milestones.length < 2) return 'medium'
    
    return 'low'
  }

  private static async getBaselineValuation(userId: string): Promise<number> {
    const firstEvaluation = await prisma.businessEvaluation.findFirst({
      where: { userId },
      orderBy: { createdAt: 'asc' }
    })

    return firstEvaluation ? this.extractValuation(firstEvaluation) : 100000
  }

  private static calculateTimeFrame(startDate: Date, endDate: Date): string {
    const diffInDays = Math.floor(
      (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
    )

    if (diffInDays < 30) return `${diffInDays} days`
    if (diffInDays < 90) return `${Math.floor(diffInDays / 30)} months`
    if (diffInDays < 365) return `${Math.floor(diffInDays / 30)} months`
    
    return `${Math.floor(diffInDays / 365)} year${Math.floor(diffInDays / 365) > 1 ? 's' : ''}`
  }
}