import { PrismaClient, ProgressStatus } from '@prisma/client'
import { PremiumAccessService } from './PremiumAccessService'

const prisma = new PrismaClient()

export interface ProgressCompletionRequest {
  userId: string
  stepId: string
  guideId: string
  improvementCategory: string
  notes?: string
  timeInvested: number // in hours
  moneyInvested: number // in dollars
  evidence: EvidenceItem[]
}

export interface EvidenceItem {
  type: 'photo' | 'document' | 'url' | 'text'
  content: string // URL, file path, or text content
  description?: string
  uploadedAt: Date
}

export interface ProgressAnalytics {
  totalSteps: number
  completedSteps: number
  verifiedSteps: number
  progressPercentage: number
  totalTimeInvested: number
  totalMoneyInvested: number
  averageCompletionTime: number
  activeCategories: string[]
  recentActivity: any[]
}

export class ProgressService {
  /**
   * Mark a step as completed with evidence
   */
  static async completeStep(request: ProgressCompletionRequest) {
    // Check premium access
    const accessCheck = await PremiumAccessService.checkProgressTrackingAccess(request.userId)
    if (!accessCheck.hasAccess) {
      throw new Error('Premium subscription required for progress tracking')
    }

    try {
      // Create or update progress entry
      const progressEntry = await prisma.progressEntry.upsert({
        where: {
          userId_stepId: {
            userId: request.userId,
            stepId: request.stepId
          }
        },
        create: {
          userId: request.userId,
          guideId: request.guideId,
          stepId: request.stepId,
          improvementCategory: request.improvementCategory,
          status: ProgressStatus.COMPLETED,
          evidence: request.evidence,
          timeInvested: request.timeInvested,
          moneyInvested: request.moneyInvested,
          notes: request.notes,
          completedAt: new Date()
        },
        update: {
          status: ProgressStatus.COMPLETED,
          evidence: request.evidence,
          timeInvested: request.timeInvested,
          moneyInvested: request.moneyInvested,
          notes: request.notes,
          completedAt: new Date()
        },
        include: {
          step: true,
          guide: true
        }
      })

      // Update the guide step completion status
      await prisma.guideStep.update({
        where: { id: request.stepId },
        data: {
          completed: true,
          completedAt: new Date()
        }
      })

      // Trigger AI validation if evidence provided
      if (request.evidence.length > 0) {
        await this.validateEvidence(progressEntry.id, request.evidence)
      }

      // Check if this completion should trigger a revaluation
      await this.checkRevaluationTriggers(request.userId, request.guideId)

      return progressEntry
    } catch (error) {
      console.error('Error completing step:', error)
      throw error
    }
  }

  /**
   * Get user's progress timeline
   */
  static async getProgressTimeline(userId: string) {
    try {
      const progressEntries = await prisma.progressEntry.findMany({
        where: { userId },
        include: {
          step: true,
          guide: true,
          valueImpacts: true,
          milestones: true
        },
        orderBy: { completedAt: 'desc' }
      })

      return progressEntries.map(entry => ({
        id: entry.id,
        title: entry.step.title,
        category: entry.improvementCategory,
        status: entry.status,
        completedAt: entry.completedAt,
        timeInvested: entry.timeInvested,
        moneyInvested: entry.moneyInvested,
        evidence: entry.evidence,
        valueImpact: entry.valueImpacts.length > 0 ? entry.valueImpacts[0] : null,
        milestones: entry.milestones,
        aiValidationScore: entry.aiValidationScore
      }))
    } catch (error) {
      console.error('Error getting progress timeline:', error)
      throw error
    }
  }

  /**
   * Get progress analytics for user
   */
  static async getProgressAnalytics(userId: string): Promise<ProgressAnalytics> {
    // Check premium access
    const accessCheck = await PremiumAccessService.checkProgressTrackingAccess(userId)
    if (!accessCheck.hasAccess) {
      throw new Error('Premium subscription required for progress tracking')
    }

    try {
      // Check if database tables exist, if not, return a basic response for premium users
      const progressEntries = await prisma.progressEntry.findMany({
        where: { userId },
        include: {
          step: true,
          guide: true
        }
      })

      const allSteps = await prisma.guideStep.findMany({
        where: {
          guide: {
            userId: userId
          }
        }
      })

      const completedSteps = progressEntries.filter(p => p.status === ProgressStatus.COMPLETED)
      const verifiedSteps = progressEntries.filter(p => p.status === ProgressStatus.VERIFIED)

      const totalTimeInvested = progressEntries.reduce((sum, p) => sum + p.timeInvested, 0)
      const totalMoneyInvested = progressEntries.reduce((sum, p) => sum + p.moneyInvested, 0)

      const averageCompletionTime = completedSteps.length > 0
        ? totalTimeInvested / completedSteps.length
        : 0

      const activeCategories = [...new Set(progressEntries.map(p => p.improvementCategory))]

      const recentActivity = progressEntries
        .filter(p => p.completedAt)
        .sort((a, b) => new Date(b.completedAt!).getTime() - new Date(a.completedAt!).getTime())
        .slice(0, 10)
        .map(p => ({
          title: p.step.title,
          category: p.improvementCategory,
          completedAt: p.completedAt,
          timeInvested: p.timeInvested
        }))

      return {
        totalSteps: allSteps.length,
        completedSteps: completedSteps.length,
        verifiedSteps: verifiedSteps.length,
        progressPercentage: allSteps.length > 0 ? (completedSteps.length / allSteps.length) * 100 : 0,
        totalTimeInvested,
        totalMoneyInvested,
        averageCompletionTime,
        activeCategories,
        recentActivity
      }
    } catch (error) {
      console.error('Error getting progress analytics:', error)
      
      // Since this feature requires database setup that doesn't exist, 
      // and you explicitly don't want mock data, throw a proper error
      throw new Error('Progress tracking feature requires database setup. This feature is not available.')
    }
  }

  /**
   * Upload and process evidence for a step
   */
  static async uploadEvidence(progressEntryId: string, evidence: EvidenceItem[]) {
    try {
      const progressEntry = await prisma.progressEntry.update({
        where: { id: progressEntryId },
        data: {
          evidence: evidence,
          updatedAt: new Date()
        }
      })

      // Trigger AI validation
      await this.validateEvidence(progressEntryId, evidence)

      return progressEntry
    } catch (error) {
      console.error('Error uploading evidence:', error)
      throw error
    }
  }

  /**
   * AI validation of evidence (simplified implementation)
   */
  private static async validateEvidence(progressEntryId: string, evidence: EvidenceItem[]) {
    try {
      // This would integrate with OpenAI Vision API in production
      // For now, we'll use a simple scoring algorithm
      let validationScore = 0.5 // Base score

      evidence.forEach(item => {
        switch (item.type) {
          case 'photo':
            validationScore += 0.3 // Photos are good evidence
            break
          case 'document':
            validationScore += 0.4 // Documents are strong evidence
            break
          case 'url':
            validationScore += 0.1 // URLs are weak evidence
            break
          case 'text':
            validationScore += 0.2 // Text descriptions are moderate evidence
            break
        }
      })

      // Cap at 1.0
      validationScore = Math.min(validationScore, 1.0)

      await prisma.progressEntry.update({
        where: { id: progressEntryId },
        data: {
          aiValidationScore: validationScore,
          status: validationScore >= 0.8 ? ProgressStatus.VERIFIED : ProgressStatus.COMPLETED
        }
      })

      return validationScore
    } catch (error) {
      console.error('Error validating evidence:', error)
      throw error
    }
  }

  /**
   * Check if progress should trigger a business revaluation
   */
  private static async checkRevaluationTriggers(userId: string, guideId: string) {
    try {
      // Get guide progress
      const guide = await prisma.implementationGuide.findUnique({
        where: { id: guideId },
        include: {
          steps: true,
          progressEntries: true
        }
      })

      if (!guide) return

      const completedSteps = guide.progressEntries.filter(p => p.status === ProgressStatus.COMPLETED || p.status === ProgressStatus.VERIFIED)
      const progressPercentage = (completedSteps.length / guide.steps.length) * 100

      // Trigger revaluation if 25%, 50%, 75%, or 100% completion milestones are reached
      const milestones = [25, 50, 75, 100]
      const currentMilestone = milestones.find(m => progressPercentage >= m && progressPercentage < m + 10)

      if (currentMilestone) {
        // Check if we haven't already triggered for this milestone
        const existingRevaluation = await prisma.businessRevaluation.findFirst({
          where: {
            userId,
            revaluationReason: `${currentMilestone}% completion milestone`
          }
        })

        if (!existingRevaluation) {
          // Import and use RevaluationService
          const { RevaluationService } = await import('./RevaluationService')
          await RevaluationService.triggerProgressRevaluation(userId, guide.evaluationId, guideId, currentMilestone)
        }
      }
    } catch (error) {
      console.error('Error checking revaluation triggers:', error)
      // Don't throw error as this is a background process
    }
  }

  /**
   * Get step completion details
   */
  static async getStepProgress(userId: string, stepId: string) {
    try {
      const progressEntry = await prisma.progressEntry.findFirst({
        where: {
          userId,
          stepId
        },
        include: {
          step: true,
          guide: true,
          valueImpacts: true,
          milestones: true
        }
      })

      return progressEntry
    } catch (error) {
      console.error('Error getting step progress:', error)
      throw error
    }
  }

  /**
   * Update progress entry notes or investment tracking
   */
  static async updateProgress(progressEntryId: string, userId: string, updates: {
    notes?: string
    timeInvested?: number
    moneyInvested?: number
    manualValidation?: boolean
  }) {
    try {
      const progressEntry = await prisma.progressEntry.update({
        where: {
          id: progressEntryId,
          userId // Ensure user owns this entry
        },
        data: {
          ...updates,
          updatedAt: new Date()
        }
      })

      return progressEntry
    } catch (error) {
      console.error('Error updating progress:', error)
      throw error
    }
  }
}