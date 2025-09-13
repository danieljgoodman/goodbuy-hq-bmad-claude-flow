import { PremiumAccessService } from './PremiumAccessService'
import { evaluationStorage } from '../evaluation-storage'
import { progressStorage } from '../progress-storage'
import { valueImpactStorage } from '../value-impact-storage'

export interface ValueImpactCalculation {
  progressEntryId: string
  baselineValuation: number
  updatedValuation: number
  valuationIncrease: number
  impactPercentage: number
  confidenceScore: number
  roi: number
  timeToValue: number
}

export interface ROIAnalysis {
  totalInvestment: number
  totalValueGenerated: number
  overallROI: number
  averageTimeToValue: number
  impactByCategory: CategoryImpact[]
  topPerformingImprovements: ImprovementROI[]
  projectedFutureValue: number
}

export interface CategoryImpact {
  category: string
  totalInvestment: number
  totalValueGenerated: number
  roi: number
  improvementCount: number
  averageImpact: number
}

export interface ImprovementROI {
  title: string
  category: string
  investment: number
  valueGenerated: number
  roi: number
  completedAt: Date
  timeToValue: number
}

export class ValueImpactService {
  /**
   * Calculate value impact for a completed improvement
   */
  static async calculateValueImpact(
    userId: string,
    progressEntryId: string,
    baselineValuation: number
  ): Promise<ValueImpactCalculation> {
    // Check premium access
    const accessCheck = await PremiumAccessService.checkAIFeatureAccess(userId)
    if (!accessCheck.hasAccess) {
      throw new Error('Premium subscription required for value impact analysis')
    }

    try {
      // Get real progress entry from storage
      const progressEntry = progressStorage.get(progressEntryId)
      
      if (!progressEntry || progressEntry.userId !== userId) {
        throw new Error('Progress entry not found or access denied')
      }

      // AI-powered valuation calculation (simplified implementation)
      const updatedValuation = await this.calculateUpdatedValuation(
        progressEntry,
        baselineValuation
      )

      const valuationIncrease = updatedValuation - baselineValuation
      const impactPercentage = baselineValuation > 0 ? (valuationIncrease / baselineValuation) * 100 : 0

      // Calculate ROI
      const totalInvestment = progressEntry.timeInvested * 50 + progressEntry.moneyInvested // Assuming $50/hour
      const roi = totalInvestment > 0 ? (valuationIncrease / totalInvestment) * 100 : 0

      // Calculate time to value
      const timeToValue = progressEntry.completedAt
        ? Math.ceil((progressEntry.completedAt.getTime() - progressEntry.createdAt.getTime()) / (1000 * 60 * 60 * 24))
        : 0

      // Confidence score based on evidence quality and AI validation
      const confidenceScore = this.calculateConfidenceScore(progressEntry)

      const calculation: ValueImpactCalculation = {
        progressEntryId,
        baselineValuation,
        updatedValuation,
        valuationIncrease,
        impactPercentage,
        confidenceScore,
        roi,
        timeToValue
      }

      // Save to file storage
      const impactId = `impact_${Date.now()}_${userId}`
      valueImpactStorage.store({
        id: impactId,
        userId,
        progressEntryId,
        baselineValuation,
        updatedValuation,
        valuationIncrease,
        impactPercentage,
        confidenceScore,
        improvementCategory: progressEntry.improvementCategory,
        roi,
        timeToValue,
        calculatedAt: new Date(),
        createdAt: new Date()
      })

      return calculation
    } catch (error) {
      console.error('Error calculating value impact:', error)
      throw error
    }
  }

  /**
   * Get comprehensive ROI analysis for user
   */
  static async getROIAnalysis(userId: string): Promise<ROIAnalysis> {
    try {
      // Get real value impacts from storage
      const valueImpacts = valueImpactStorage.getByUserId(userId)
      
      // If no value impacts exist, return empty analysis
      if (valueImpacts.length === 0) {
        return {
          totalInvestment: 0,
          totalValueGenerated: 0,
          overallROI: 0,
          averageTimeToValue: 0,
          impactByCategory: [],
          topPerformingImprovements: [],
          projectedFutureValue: 0
        }
      }
      
      // Get corresponding progress entries
      const valueImpactsWithProgress = valueImpacts.map(impact => {
        const progressEntry = progressStorage.get(impact.progressEntryId)
        return {
          ...impact,
          progressEntry: progressEntry || {
            timeInvested: 0,
            moneyInvested: 0,
            completedAt: impact.calculatedAt,
            createdAt: impact.createdAt,
            step: { title: 'Unknown Step' }
          }
        }
      })

      const totalInvestment = valueImpactsWithProgress.reduce((sum, impact) => {
        const timeInvestment = impact.progressEntry.timeInvested * 50 // $50/hour
        return sum + timeInvestment + impact.progressEntry.moneyInvested
      }, 0)

      const totalValueGenerated = valueImpactsWithProgress.reduce((sum, impact) => 
        sum + impact.valuationIncrease, 0
      )

      const overallROI = totalInvestment > 0 ? (totalValueGenerated / totalInvestment) * 100 : 0

      const averageTimeToValue = valueImpactsWithProgress.length > 0
        ? valueImpactsWithProgress.reduce((sum, impact) => sum + impact.timeToValue, 0) / valueImpactsWithProgress.length
        : 0

      // Calculate impact by category
      const categoryMap = new Map<string, {
        totalInvestment: number
        totalValueGenerated: number
        count: number
      }>()

      valueImpactsWithProgress.forEach(impact => {
        const category = impact.improvementCategory
        const existing = categoryMap.get(category) || { totalInvestment: 0, totalValueGenerated: 0, count: 0 }
        
        const timeInvestment = impact.progressEntry.timeInvested * 50
        const investment = timeInvestment + impact.progressEntry.moneyInvested

        categoryMap.set(category, {
          totalInvestment: existing.totalInvestment + investment,
          totalValueGenerated: existing.totalValueGenerated + impact.valuationIncrease,
          count: existing.count + 1
        })
      })

      const impactByCategory: CategoryImpact[] = Array.from(categoryMap.entries()).map(([category, data]) => ({
        category,
        totalInvestment: data.totalInvestment,
        totalValueGenerated: data.totalValueGenerated,
        roi: data.totalInvestment > 0 ? (data.totalValueGenerated / data.totalInvestment) * 100 : 0,
        improvementCount: data.count,
        averageImpact: data.totalValueGenerated / data.count
      }))

      // Top performing improvements
      const topPerformingImprovements: ImprovementROI[] = valueImpactsWithProgress
        .map(impact => {
          const timeInvestment = impact.progressEntry.timeInvested * 50
          const investment = timeInvestment + impact.progressEntry.moneyInvested
          
          return {
            title: impact.progressEntry.step.title,
            category: impact.improvementCategory,
            investment,
            valueGenerated: impact.valuationIncrease,
            roi: investment > 0 ? (impact.valuationIncrease / investment) * 100 : 0,
            completedAt: impact.progressEntry.completedAt || impact.progressEntry.createdAt,
            timeToValue: impact.timeToValue
          }
        })
        .sort((a, b) => b.roi - a.roi)
        .slice(0, 10)

      // Project future value based on current trajectory
      const projectedFutureValue = this.calculateProjectedValue(valueImpactsWithProgress)

      return {
        totalInvestment,
        totalValueGenerated,
        overallROI,
        averageTimeToValue,
        impactByCategory,
        topPerformingImprovements,
        projectedFutureValue
      }
    } catch (error) {
      console.error('Error getting ROI analysis:', error)
      throw error
    }
  }

  /**
   * Get value impact timeline for visualization
   */
  static async getValueImpactTimeline(userId: string) {
    try {
      // Get real value impacts from storage
      const valueImpacts = valueImpactStorage.getByUserId(userId)
      
      // Get corresponding progress entries for each impact
      const valueImpactsWithDetails = valueImpacts.map(impact => {
        const progressEntry = progressStorage.get(impact.progressEntryId)
        return {
          ...impact,
          progressEntry: progressEntry || {
            step: { title: 'Unknown Step' },
            guide: { title: 'Unknown Guide' }
          }
        }
      })

      return valueImpactsWithDetails.map(impact => ({
        id: impact.id,
        date: impact.calculatedAt,
        title: impact.progressEntry.step.title,
        category: impact.improvementCategory,
        baselineValuation: impact.baselineValuation,
        updatedValuation: impact.updatedValuation,
        valuationIncrease: impact.valuationIncrease,
        impactPercentage: impact.impactPercentage,
        roi: impact.roi,
        confidenceScore: impact.confidenceScore,
        timeToValue: impact.timeToValue
      }))
    } catch (error) {
      console.error('Error getting value impact timeline:', error)
      throw error
    }
  }

  /**
   * Get comparison between before/after business valuations
   */
  static async getBeforeAfterComparison(userId: string, guideId?: string) {
    try {
      // Get real value impacts from storage
      let valueImpacts = valueImpactStorage.getByUserId(userId)
      
      // Filter by guide if specified
      if (guideId) {
        valueImpacts = valueImpacts.filter(impact => {
          const progressEntry = progressStorage.get(impact.progressEntryId)
          return progressEntry && progressEntry.guideId === guideId
        })
      }

      if (valueImpacts.length === 0) {
        return null
      }

      const latest = valueImpacts[0]
      const earliest = valueImpacts[valueImpacts.length - 1]

      return {
        beforeValuation: earliest.baselineValuation,
        afterValuation: latest.updatedValuation,
        totalIncrease: latest.updatedValuation - earliest.baselineValuation,
        totalIncreasePercentage: earliest.baselineValuation > 0 
          ? ((latest.updatedValuation - earliest.baselineValuation) / earliest.baselineValuation) * 100
          : 0,
        improvementsCount: valueImpacts.length,
        timespan: Math.ceil((latest.calculatedAt.getTime() - earliest.calculatedAt.getTime()) / (1000 * 60 * 60 * 24)),
        averageConfidenceScore: valueImpacts.reduce((sum, impact) => sum + impact.confidenceScore, 0) / valueImpacts.length
      }
    } catch (error) {
      console.error('Error getting before/after comparison:', error)
      throw error
    }
  }

  /**
   * Calculate updated valuation based on improvement (AI-powered in production)
   */
  private static async calculateUpdatedValuation(
    progressEntry: any,
    baselineValuation: number
  ): Promise<number> {
    // This is a simplified calculation. In production, this would use AI to analyze
    // the specific improvement and calculate its impact on business valuation
    
    const categoryMultipliers: Record<string, number> = {
      'revenue': 0.15,
      'efficiency': 0.08,
      'customer_satisfaction': 0.12,
      'cost_reduction': 0.10,
      'process_improvement': 0.06,
      'technology': 0.09,
      'marketing': 0.07,
      'sales': 0.13,
      'operations': 0.05,
      'finance': 0.08
    }

    const category = progressEntry.improvementCategory.toLowerCase().replace(' ', '_')
    const multiplier = categoryMultipliers[category] || 0.05

    // Factor in AI validation score
    const validationAdjustment = progressEntry.aiValidationScore || 0.5
    
    // Factor in time and money investment (higher investment = higher impact potential)
    const investmentFactor = Math.min((progressEntry.timeInvested + progressEntry.moneyInvested / 50) / 20, 2)

    const impactFactor = multiplier * validationAdjustment * investmentFactor
    const valuationIncrease = baselineValuation * impactFactor

    return baselineValuation + valuationIncrease
  }

  /**
   * Calculate confidence score for value impact
   */
  private static calculateConfidenceScore(progressEntry: any): number {
    let confidence = 0.3 // Base confidence

    // Factor in AI validation score
    if (progressEntry.aiValidationScore) {
      confidence += progressEntry.aiValidationScore * 0.4
    }

    // Factor in evidence quality
    const evidenceCount = progressEntry.evidence?.length || 0
    confidence += Math.min(evidenceCount * 0.1, 0.2)

    // Factor in manual validation
    if (progressEntry.manualValidation) {
      confidence += 0.1
    }

    return Math.min(confidence, 1.0)
  }

  /**
   * Calculate projected future value based on current trajectory
   */
  private static calculateProjectedValue(valueImpacts: any[]): number {
    if (valueImpacts.length < 2) return 0

    // Simple linear projection based on recent improvements
    const recentImpacts = valueImpacts.slice(0, 5) // Last 5 improvements
    const averageIncrease = recentImpacts.reduce((sum, impact) => sum + impact.valuationIncrease, 0) / recentImpacts.length

    // Project 6 months ahead assuming similar improvement rate
    return averageIncrease * 6
  }
}