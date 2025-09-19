/**
 * Section Completion Tracking and Validation System
 * Comprehensive tracking for Enterprise questionnaire progress
 */

import {
  validateSectionInRealTime,
  validateBusinessRules,
  ENTERPRISE_QUESTIONNAIRE_FIELD_COUNTS,
  SectionValidationResult
} from '@/lib/validations/enterprise-questionnaire'
import {
  EnterpriseTierData,
  validateEnterpriseTierData
} from '@/lib/validations/enterprise-tier'

/**
 * Section completion status
 */
export interface SectionCompletionStatus {
  sectionId: string
  sectionName: string
  tier: 'professional' | 'enterprise'
  isCompleted: boolean
  isValid: boolean
  completionPercentage: number
  fieldsCompleted: number
  totalFields: number
  requiredFieldsCompleted: number
  totalRequiredFields: number
  validationErrors: string[]
  validationWarnings: string[]
  lastUpdated: Date
  timeSpent: number
  dependencies: string[]
  dependenciesMet: boolean
  isBlocked: boolean
  blockingReasons: string[]
}

/**
 * Overall completion summary
 */
export interface CompletionSummary {
  overallProgress: number
  sectionsCompleted: number
  totalSections: number
  professionalProgress: number
  enterpriseProgress: number
  fieldsCompleted: number
  totalFields: number
  validationStatus: 'valid' | 'warning' | 'error' | 'incomplete'
  estimatedTimeRemaining: number
  readinessScore: number
  recommendations: string[]
  criticalIssues: string[]
}

/**
 * Section dependencies configuration
 */
const SECTION_DEPENDENCIES: Record<string, string[]> = {
  'financial-performance': [], // No dependencies
  'customer-risk': ['financial-performance'],
  'competitive-market': ['financial-performance'],
  'operational-strategic': ['financial-performance'],
  'value-enhancement': ['financial-performance', 'customer-risk', 'competitive-market'],
  'strategic-value-drivers': ['competitive-market', 'operational-strategic'],
  'operational-scalability': ['operational-strategic', 'value-enhancement'],
  'financial-optimization': ['financial-performance', 'customer-risk'],
  'strategic-scenario-planning': ['value-enhancement', 'strategic-value-drivers'],
  'multi-year-projections': ['financial-optimization', 'strategic-scenario-planning']
}

/**
 * Required field percentages for completion
 */
const COMPLETION_THRESHOLDS = {
  professional: 85, // 85% of fields required for professional sections
  enterprise: 90,   // 90% of fields required for enterprise sections
  overall: 80       // 80% overall completion required
} as const

/**
 * Section completion tracker class
 */
export class SectionCompletionTracker {
  private sectionStatuses: Map<string, SectionCompletionStatus> = new Map()
  private completionHistory: Array<{
    sectionId: string
    timestamp: Date
    action: 'started' | 'updated' | 'completed' | 'reset'
    fieldsCompleted: number
  }> = []

  /**
   * Initialize tracker with section data
   */
  initialize(sectionsData: Record<string, any>, timeSpentData?: Record<string, number>): void {
    this.sectionStatuses.clear()

    for (const sectionId of Object.keys(SECTION_DEPENDENCIES)) {
      const sectionData = sectionsData[sectionId] || {}
      const timeSpent = timeSpentData?.[sectionId] || 0

      const status = this.calculateSectionStatus(sectionId, sectionData, timeSpent)
      this.sectionStatuses.set(sectionId, status)
    }

    this.updateDependencies()
  }

  /**
   * Update specific section
   */
  updateSection(sectionId: string, sectionData: any, timeSpent: number = 0): SectionCompletionStatus {
    const status = this.calculateSectionStatus(sectionId, sectionData, timeSpent)
    this.sectionStatuses.set(sectionId, status)

    // Record history
    this.completionHistory.push({
      sectionId,
      timestamp: new Date(),
      action: status.isCompleted ? 'completed' : 'updated',
      fieldsCompleted: status.fieldsCompleted
    })

    // Update dependencies
    this.updateDependencies()

    return status
  }

  /**
   * Calculate section completion status
   */
  private calculateSectionStatus(
    sectionId: string,
    sectionData: any,
    timeSpent: number
  ): SectionCompletionStatus {
    const tier = this.getSectionTier(sectionId)
    const totalFields = ENTERPRISE_QUESTIONNAIRE_FIELD_COUNTS[sectionId as keyof typeof ENTERPRISE_QUESTIONNAIRE_FIELD_COUNTS] || 0

    // Validate section data
    const validationResult = validateSectionInRealTime(sectionId, sectionData)

    // Count completed fields
    const fieldsCompleted = this.countCompletedFields(sectionData)
    const completionPercentage = totalFields > 0 ? (fieldsCompleted / totalFields) * 100 : 0

    // Determine completion threshold
    const threshold = tier === 'professional'
      ? COMPLETION_THRESHOLDS.professional
      : COMPLETION_THRESHOLDS.enterprise

    const isCompleted = completionPercentage >= threshold && validationResult.isValid

    // Calculate required fields (assuming 70% are required)
    const totalRequiredFields = Math.ceil(totalFields * 0.7)
    const requiredFieldsCompleted = Math.min(fieldsCompleted, totalRequiredFields)

    return {
      sectionId,
      sectionName: this.getSectionName(sectionId),
      tier,
      isCompleted,
      isValid: validationResult.isValid,
      completionPercentage,
      fieldsCompleted,
      totalFields,
      requiredFieldsCompleted,
      totalRequiredFields,
      validationErrors: validationResult.errors,
      validationWarnings: validationResult.warnings,
      lastUpdated: new Date(),
      timeSpent,
      dependencies: SECTION_DEPENDENCIES[sectionId] || [],
      dependenciesMet: false, // Will be calculated in updateDependencies
      isBlocked: false,       // Will be calculated in updateDependencies
      blockingReasons: []     // Will be calculated in updateDependencies
    }
  }

  /**
   * Update dependency status for all sections
   */
  private updateDependencies(): void {
    for (const [sectionId, status] of this.sectionStatuses) {
      const dependencies = SECTION_DEPENDENCIES[sectionId] || []
      const dependenciesMet = dependencies.every(depId => {
        const depStatus = this.sectionStatuses.get(depId)
        return depStatus?.isCompleted || false
      })

      const blockingReasons: string[] = []
      if (!dependenciesMet) {
        const incompleteDeps = dependencies.filter(depId => {
          const depStatus = this.sectionStatuses.get(depId)
          return !depStatus?.isCompleted
        })
        blockingReasons.push(
          `Requires completion of: ${incompleteDeps.map(id => this.getSectionName(id)).join(', ')}`
        )
      }

      // Update status
      status.dependenciesMet = dependenciesMet
      status.isBlocked = !dependenciesMet
      status.blockingReasons = blockingReasons
    }
  }

  /**
   * Get completion summary
   */
  getCompletionSummary(): CompletionSummary {
    const statuses = Array.from(this.sectionStatuses.values())
    const completedSections = statuses.filter(s => s.isCompleted).length
    const totalSections = statuses.length

    const professionalSections = statuses.filter(s => s.tier === 'professional')
    const enterpriseSections = statuses.filter(s => s.tier === 'enterprise')

    const professionalCompleted = professionalSections.filter(s => s.isCompleted).length
    const enterpriseCompleted = enterpriseSections.filter(s => s.isCompleted).length

    const professionalProgress = professionalSections.length > 0
      ? (professionalCompleted / professionalSections.length) * 100
      : 0

    const enterpriseProgress = enterpriseSections.length > 0
      ? (enterpriseCompleted / enterpriseSections.length) * 100
      : 0

    const overallProgress = totalSections > 0
      ? (completedSections / totalSections) * 100
      : 0

    const fieldsCompleted = statuses.reduce((sum, s) => sum + s.fieldsCompleted, 0)
    const totalFields = statuses.reduce((sum, s) => sum + s.totalFields, 0)

    // Determine validation status
    const hasErrors = statuses.some(s => s.validationErrors.length > 0)
    const hasWarnings = statuses.some(s => s.validationWarnings.length > 0)
    const isIncomplete = overallProgress < 100

    let validationStatus: 'valid' | 'warning' | 'error' | 'incomplete'
    if (hasErrors) {
      validationStatus = 'error'
    } else if (isIncomplete) {
      validationStatus = 'incomplete'
    } else if (hasWarnings) {
      validationStatus = 'warning'
    } else {
      validationStatus = 'valid'
    }

    // Calculate estimated time remaining
    const averageTimePerField = this.calculateAverageTimePerField()
    const remainingFields = totalFields - fieldsCompleted
    const estimatedTimeRemaining = remainingFields * averageTimePerField

    // Calculate readiness score
    const readinessScore = this.calculateReadinessScore(statuses, overallProgress)

    // Generate recommendations
    const recommendations = this.generateRecommendations(statuses)

    // Identify critical issues
    const criticalIssues = this.identifyCriticalIssues(statuses)

    return {
      overallProgress,
      sectionsCompleted: completedSections,
      totalSections,
      professionalProgress,
      enterpriseProgress,
      fieldsCompleted,
      totalFields,
      validationStatus,
      estimatedTimeRemaining,
      readinessScore,
      recommendations,
      criticalIssues
    }
  }

  /**
   * Get section status by ID
   */
  getSectionStatus(sectionId: string): SectionCompletionStatus | undefined {
    return this.sectionStatuses.get(sectionId)
  }

  /**
   * Get all section statuses
   */
  getAllSectionStatuses(): SectionCompletionStatus[] {
    return Array.from(this.sectionStatuses.values())
  }

  /**
   * Get next recommended section
   */
  getNextRecommendedSection(): string | null {
    const statuses = Array.from(this.sectionStatuses.values())

    // Find first incomplete section with met dependencies
    const nextSection = statuses.find(s =>
      !s.isCompleted &&
      s.dependenciesMet &&
      !s.isBlocked
    )

    return nextSection?.sectionId || null
  }

  /**
   * Get blocked sections
   */
  getBlockedSections(): SectionCompletionStatus[] {
    return Array.from(this.sectionStatuses.values()).filter(s => s.isBlocked)
  }

  /**
   * Export completion report
   */
  exportCompletionReport(): {
    summary: CompletionSummary
    sections: SectionCompletionStatus[]
    history: typeof this.completionHistory
    generatedAt: Date
  } {
    return {
      summary: this.getCompletionSummary(),
      sections: this.getAllSectionStatuses(),
      history: [...this.completionHistory],
      generatedAt: new Date()
    }
  }

  /**
   * Utility methods
   */
  private getSectionTier(sectionId: string): 'professional' | 'enterprise' {
    const professionalSections = [
      'financial-performance',
      'customer-risk',
      'competitive-market',
      'operational-strategic',
      'value-enhancement'
    ]
    return professionalSections.includes(sectionId) ? 'professional' : 'enterprise'
  }

  private getSectionName(sectionId: string): string {
    const names: Record<string, string> = {
      'financial-performance': 'Financial Performance',
      'customer-risk': 'Customer & Risk Analysis',
      'competitive-market': 'Competitive & Market Position',
      'operational-strategic': 'Operational & Strategic',
      'value-enhancement': 'Value Enhancement',
      'strategic-value-drivers': 'Strategic Value Drivers',
      'operational-scalability': 'Operational Scalability',
      'financial-optimization': 'Financial Optimization',
      'strategic-scenario-planning': 'Strategic Scenario Planning',
      'multi-year-projections': 'Multi-Year Projections'
    }
    return names[sectionId] || sectionId
  }

  private countCompletedFields(sectionData: any): number {
    if (!sectionData || typeof sectionData !== 'object') return 0

    let count = 0
    const countValue = (value: any): void => {
      if (value !== null && value !== undefined && value !== '') {
        if (Array.isArray(value)) {
          if (value.length > 0) count++
        } else if (typeof value === 'object') {
          Object.values(value).forEach(countValue)
        } else {
          count++
        }
      }
    }

    Object.values(sectionData).forEach(countValue)
    return count
  }

  private calculateAverageTimePerField(): number {
    if (this.completionHistory.length === 0) return 120 // Default 2 minutes per field

    const timeData = this.completionHistory
      .filter(h => h.action === 'completed')
      .map(h => h.fieldsCompleted)

    if (timeData.length === 0) return 120

    const totalTime = Array.from(this.sectionStatuses.values())
      .reduce((sum, s) => sum + s.timeSpent, 0)
    const totalFields = timeData.reduce((sum, fields) => sum + fields, 0)

    return totalFields > 0 ? totalTime / totalFields : 120
  }

  private calculateReadinessScore(
    statuses: SectionCompletionStatus[],
    overallProgress: number
  ): number {
    let score = overallProgress * 0.6 // 60% weight for completion

    // Add validation score (20% weight)
    const validSections = statuses.filter(s => s.isValid).length
    const validationScore = (validSections / statuses.length) * 100
    score += validationScore * 0.2

    // Add dependency score (10% weight)
    const unblocked = statuses.filter(s => !s.isBlocked).length
    const dependencyScore = (unblocked / statuses.length) * 100
    score += dependencyScore * 0.1

    // Add quality score (10% weight)
    const highQuality = statuses.filter(s =>
      s.completionPercentage >= 90 && s.validationErrors.length === 0
    ).length
    const qualityScore = (highQuality / statuses.length) * 100
    score += qualityScore * 0.1

    return Math.round(Math.min(100, Math.max(0, score)))
  }

  private generateRecommendations(statuses: SectionCompletionStatus[]): string[] {
    const recommendations: string[] = []

    // Check for blocked sections
    const blocked = statuses.filter(s => s.isBlocked)
    if (blocked.length > 0) {
      recommendations.push(
        `Complete dependencies for ${blocked.length} blocked section(s): ${
          blocked.map(s => s.sectionName).join(', ')
        }`
      )
    }

    // Check for validation errors
    const withErrors = statuses.filter(s => s.validationErrors.length > 0)
    if (withErrors.length > 0) {
      recommendations.push(
        `Resolve validation errors in ${withErrors.length} section(s)`
      )
    }

    // Check for low completion sections
    const lowCompletion = statuses.filter(s =>
      s.completionPercentage < 50 && !s.isBlocked
    )
    if (lowCompletion.length > 0) {
      recommendations.push(
        `Focus on completing ${lowCompletion[0].sectionName} (${Math.round(lowCompletion[0].completionPercentage)}% complete)`
      )
    }

    // Professional vs Enterprise balance
    const professionalComplete = statuses.filter(s =>
      s.tier === 'professional' && s.isCompleted
    ).length
    const enterpriseComplete = statuses.filter(s =>
      s.tier === 'enterprise' && s.isCompleted
    ).length

    if (professionalComplete < 5 && enterpriseComplete > 0) {
      recommendations.push('Complete all Professional tier sections before focusing on Enterprise features')
    }

    return recommendations
  }

  private identifyCriticalIssues(statuses: SectionCompletionStatus[]): string[] {
    const issues: string[] = []

    // Critical validation errors
    const criticalErrors = statuses.filter(s =>
      s.validationErrors.some(e =>
        e.includes('required') ||
        e.includes('inconsistent') ||
        e.includes('failed')
      )
    )

    if (criticalErrors.length > 0) {
      issues.push(`Critical validation errors in ${criticalErrors.length} section(s)`)
    }

    // Dependency chains
    const longChains = statuses.filter(s => s.dependencies.length > 3)
    if (longChains.length > 0) {
      issues.push('Complex dependency chains may slow progress')
    }

    // Time concerns
    const averageTime = this.calculateAverageTimePerField()
    if (averageTime > 300) { // More than 5 minutes per field
      issues.push('Completion time per field is above average - consider simplifying responses')
    }

    return issues
  }
}

/**
 * Utility functions
 */
export const createSectionCompletionTracker = (): SectionCompletionTracker => {
  return new SectionCompletionTracker()
}

export const getSectionDependencies = (sectionId: string): string[] => {
  return SECTION_DEPENDENCIES[sectionId] || []
}

export const getCompletionThreshold = (tier: 'professional' | 'enterprise'): number => {
  return COMPLETION_THRESHOLDS[tier]
}

/**
 * Type exports
 */
export type {
  SectionCompletionStatus,
  CompletionSummary
}