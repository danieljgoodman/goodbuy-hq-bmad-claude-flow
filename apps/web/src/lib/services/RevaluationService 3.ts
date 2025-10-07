import { PrismaClient } from '@prisma/client'
import { ValueImpactService } from './ValueImpactService'

const prisma = new PrismaClient()

export interface RevaluationRequest {
  userId: string
  originalEvaluationId: string
  triggeredByProgress: boolean
  progressMilestone?: number
  guideId?: string
  reason?: string
}

export interface RevaluationResult {
  id: string
  baselineValuation: number
  updatedValuation: number
  valuationChange: number
  changePercentage: number
  confidenceScore: number
  improvementsIncluded: string[]
  calculationMethod: string
  revaluationReason: string
}

export class RevaluationService {
  /**
   * Trigger automatic revaluation based on progress milestones
   */
  static async triggerProgressRevaluation(
    userId: string,
    originalEvaluationId: string,
    guideId: string,
    milestone: number
  ): Promise<RevaluationResult> {
    try {
      const request: RevaluationRequest = {
        userId,
        originalEvaluationId,
        triggeredByProgress: true,
        progressMilestone: milestone,
        guideId,
        reason: `${milestone}% completion milestone reached`
      }

      return await this.performRevaluation(request)
    } catch (error) {
      console.error('Error triggering progress revaluation:', error)
      throw error
    }
  }

  /**
   * Trigger manual revaluation
   */
  static async triggerManualRevaluation(
    userId: string,
    originalEvaluationId: string,
    reason: string
  ): Promise<RevaluationResult> {
    try {
      const request: RevaluationRequest = {
        userId,
        originalEvaluationId,
        triggeredByProgress: false,
        reason
      }

      return await this.performRevaluation(request)
    } catch (error) {
      console.error('Error triggering manual revaluation:', error)
      throw error
    }
  }

  /**
   * Perform the actual business revaluation
   */
  private static async performRevaluation(request: RevaluationRequest): Promise<RevaluationResult> {
    try {
      // Get original evaluation
      const originalEvaluation = await prisma.businessEvaluation.findUnique({
        where: { id: request.originalEvaluationId },
        include: {
          implementationGuides: {
            include: {
              progressEntries: {
                where: { status: { in: ['COMPLETED', 'VERIFIED'] } },
                include: {
                  step: true,
                  valueImpacts: true
                }
              }
            }
          }
        }
      })

      if (!originalEvaluation || originalEvaluation.userId !== request.userId) {
        throw new Error('Original evaluation not found or access denied')
      }

      // Get baseline valuation from original evaluation
      const baselineValuation = this.extractBaselineValuation(originalEvaluation)

      // Calculate new valuation based on completed improvements
      const { updatedValuation, confidenceScore, improvementsIncluded } = 
        await this.calculateUpdatedBusinessValuation(originalEvaluation, request)

      const valuationChange = updatedValuation - baselineValuation
      const changePercentage = baselineValuation > 0 ? (valuationChange / baselineValuation) * 100 : 0

      // Save revaluation result
      const revaluation = await prisma.businessRevaluation.create({
        data: {
          userId: request.userId,
          originalEvaluationId: request.originalEvaluationId,
          triggeredByProgress: request.triggeredByProgress,
          baselineValuation,
          updatedValuation,
          valuationChange,
          changePercentage,
          confidenceScore,
          improvementsIncluded,
          calculationMethod: 'AI_IMPACT_ANALYSIS_V1',
          revaluationReason: request.reason || 'Manual revaluation requested'
        }
      })

      return {
        id: revaluation.id,
        baselineValuation,
        updatedValuation,
        valuationChange,
        changePercentage,
        confidenceScore,
        improvementsIncluded,
        calculationMethod: revaluation.calculationMethod,
        revaluationReason: revaluation.revaluationReason
      }
    } catch (error) {
      console.error('Error performing revaluation:', error)
      throw error
    }
  }

  /**
   * Get revaluation history for user
   */
  static async getRevaluationHistory(userId: string) {
    try {
      const revaluations = await prisma.businessRevaluation.findMany({
        where: { userId },
        include: {
          originalEvaluation: true
        },
        orderBy: { createdAt: 'desc' }
      })

      return revaluations.map(revaluation => ({
        id: revaluation.id,
        date: revaluation.createdAt,
        baselineValuation: revaluation.baselineValuation,
        updatedValuation: revaluation.updatedValuation,
        valuationChange: revaluation.valuationChange,
        changePercentage: revaluation.changePercentage,
        confidenceScore: revaluation.confidenceScore,
        reason: revaluation.revaluationReason,
        improvementsCount: revaluation.improvementsIncluded.length,
        triggeredByProgress: revaluation.triggeredByProgress
      }))
    } catch (error) {
      console.error('Error getting revaluation history:', error)
      throw error
    }
  }

  /**
   * Get current business valuation (most recent)
   */
  static async getCurrentValuation(userId: string) {
    try {
      const latestRevaluation = await prisma.businessRevaluation.findFirst({
        where: { userId },
        orderBy: { createdAt: 'desc' }
      })

      if (latestRevaluation) {
        return {
          valuation: latestRevaluation.updatedValuation,
          confidence: latestRevaluation.confidenceScore,
          lastUpdated: latestRevaluation.createdAt,
          changeFromBaseline: latestRevaluation.valuationChange,
          changePercentage: latestRevaluation.changePercentage
        }
      }

      // Fall back to original evaluation if no revaluations exist
      const originalEvaluation = await prisma.businessEvaluation.findFirst({
        where: { userId },
        orderBy: { createdAt: 'desc' }
      })

      if (originalEvaluation) {
        const baselineValuation = this.extractBaselineValuation(originalEvaluation)
        return {
          valuation: baselineValuation,
          confidence: originalEvaluation.confidenceScore || 0.7,
          lastUpdated: originalEvaluation.createdAt,
          changeFromBaseline: 0,
          changePercentage: 0
        }
      }

      return null
    } catch (error) {
      console.error('Error getting current valuation:', error)
      throw error
    }
  }

  /**
   * Calculate projected valuation based on planned improvements
   */
  static async getProjectedValuation(userId: string, guideId?: string) {
    try {
      // Get current valuation
      const currentValuation = await this.getCurrentValuation(userId)
      if (!currentValuation) {
        throw new Error('No baseline valuation found')
      }

      // Get pending improvements (not yet completed)
      let whereClause: any = { 
        userId,
        status: 'NOT_STARTED' 
      }
      
      if (guideId) {
        whereClause.guideId = guideId
      }

      const pendingImprovements = await prisma.progressEntry.findMany({
        where: whereClause,
        include: {
          step: true,
          guide: true
        }
      })

      // Estimate potential impact of pending improvements
      let projectedIncrease = 0
      const categoryMultipliers: Record<string, number> = {
        'revenue': 0.12,
        'efficiency': 0.06,
        'customer_satisfaction': 0.09,
        'cost_reduction': 0.08,
        'process_improvement': 0.04,
        'technology': 0.07,
        'marketing': 0.05,
        'sales': 0.10,
        'operations': 0.03,
        'finance': 0.06
      }

      pendingImprovements.forEach(improvement => {
        const category = improvement.improvementCategory.toLowerCase().replace(' ', '_')
        const multiplier = categoryMultipliers[category] || 0.03
        
        // Discount for uncertainty (50% confidence in projections)
        const projectedImpact = currentValuation.valuation * multiplier * 0.5
        projectedIncrease += projectedImpact
      })

      return {
        currentValuation: currentValuation.valuation,
        projectedValuation: currentValuation.valuation + projectedIncrease,
        projectedIncrease,
        projectedIncreasePercentage: (projectedIncrease / currentValuation.valuation) * 100,
        pendingImprovementsCount: pendingImprovements.length,
        confidenceScore: 0.5, // Lower confidence for projections
        projectionBasis: 'Pending improvements analysis'
      }
    } catch (error) {
      console.error('Error getting projected valuation:', error)
      throw error
    }
  }

  /**
   * Extract baseline valuation from business evaluation
   */
  private static extractBaselineValuation(evaluation: any): number {
    // Extract valuation from the business evaluation data
    // This assumes the valuation is stored in the valuations JSON field
    if (evaluation.valuations && typeof evaluation.valuations === 'object') {
      // Try different possible fields where valuation might be stored
      return evaluation.valuations.totalValuation || 
             evaluation.valuations.businessValue || 
             evaluation.valuations.estimatedValue || 
             evaluation.valuations.fairMarketValue || 
             500000 // Default fallback
    }
    
    return 500000 // Default fallback if no valuation found
  }

  /**
   * Calculate updated business valuation based on improvements
   */
  private static async calculateUpdatedBusinessValuation(
    originalEvaluation: any,
    request: RevaluationRequest
  ) {
    const baselineValuation = this.extractBaselineValuation(originalEvaluation)
    let totalImpact = 0
    const improvementsIncluded: string[] = []
    let totalConfidence = 0
    let confidenceCount = 0

    // Process each completed improvement
    for (const guide of originalEvaluation.implementationGuides) {
      for (const progressEntry of guide.progressEntries) {
        // Calculate impact for this improvement
        try {
          const impactCalculation = await ValueImpactService.calculateValueImpact(
            request.userId,
            progressEntry.id,
            baselineValuation + totalImpact // Compound the impacts
          )

          totalImpact += impactCalculation.valuationIncrease
          improvementsIncluded.push(progressEntry.id)
          
          totalConfidence += impactCalculation.confidenceScore
          confidenceCount++
        } catch (error) {
          console.error(`Error calculating impact for progress entry ${progressEntry.id}:`, error)
          // Continue with other improvements even if one fails
        }
      }
    }

    const updatedValuation = baselineValuation + totalImpact
    const confidenceScore = confidenceCount > 0 ? totalConfidence / confidenceCount : 0.5

    return {
      updatedValuation,
      confidenceScore,
      improvementsIncluded
    }
  }
}