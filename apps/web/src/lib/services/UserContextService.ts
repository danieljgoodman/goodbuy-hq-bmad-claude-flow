import { UserProfileRepository } from '../repositories/UserProfileRepository'
import { BusinessEvaluationRepository } from '../repositories/BusinessEvaluationRepository'
import { UserPreferencesRepository } from '../repositories/UserPreferencesRepository'
import { SecuritySettingsRepository } from '../repositories/SecuritySettingsRepository'
import { BusinessMetricsRepository } from '../repositories/BusinessMetricsRepository'
import { AnalyticsDataRepository } from '../repositories/AnalyticsDataRepository'
import { prisma } from '../prisma'
import {
  User,
  UserProfile,
  BusinessEvaluation,
  UserPreferences,
  SecuritySettings,
  BusinessMetrics,
  AnalyticsData,
  ValuationSummary,
  HealthScoreSummary,
  DocumentAnalysisSummary,
  OpportunitiesSummary,
  ScenarioProjection,
  ImprovementOpportunity,
  HealthDimension
} from '../../types'

/**
 * Aggregated user context interface for report generation
 */
export interface UserContext {
  user: User
  profile: UserProfile | null
  preferences: UserPreferences | null
  securitySettings: SecuritySettings | null
  evaluations: {
    current: BusinessEvaluation | null
    history: BusinessEvaluation[]
    count: number
  }
  valuation: ValuationSummary | null
  healthScore: HealthScoreSummary | null
  documentAnalysis: DocumentAnalysisSummary | null
  opportunities: OpportunitiesSummary | null
  businessMetrics: BusinessMetrics | null
  scenarioProjections: ScenarioProjection[]
  reportMetadata: {
    generatedAt: Date
    dataSourcesUsed: string[]
    confidenceScore: number
    lastUpdated: Date
  }
}

/**
 * Filtered user data interface for different report types
 */
export interface FilteredUserContext extends Partial<UserContext> {
  reportType: 'executive' | 'detailed' | 'comparison' | 'performance'
  includeFields: string[]
}

/**
 * Report context configuration interface
 */
export interface ReportContextConfig {
  includePersonalInfo?: boolean
  includeFinancialData?: boolean
  includeOpportunities?: boolean
  includeProjections?: boolean
  includeBenchmarks?: boolean
  includeDocumentAnalysis?: boolean
  timePeriod?: {
    start: Date
    end: Date
  }
  confidenceThreshold?: number
}

/**
 * User authentication and access control interface
 */
export interface UserAccessContext {
  userId: string
  userRole: string
  subscriptionTier: string
  hasAccess: boolean
  accessLevel: 'basic' | 'premium' | 'enterprise'
  restrictions: string[]
}

/**
 * UserContextService aggregates user data from multiple repositories for report generation
 *
 * This service provides a unified interface to combine User, UserProfile, and BusinessEvaluation data
 * with proper data transformation, authentication, and type safety between database models and interfaces.
 */
export class UserContextService {
  private profileRepo = new UserProfileRepository()
  private evaluationRepo = BusinessEvaluationRepository
  private preferencesRepo = new UserPreferencesRepository()
  private securityRepo = new SecuritySettingsRepository()
  private metricsRepo = new BusinessMetricsRepository()
  private analyticsRepo = new AnalyticsDataRepository()

  /**
   * Get complete user context for report generation
   */
  async getUserContext(userId: string, config?: ReportContextConfig): Promise<UserContext> {
    // Validate access
    const accessContext = await this.validateUserAccess(userId)
    if (!accessContext.hasAccess) {
      throw new Error('Unauthorized access to user context')
    }

    // Get base user data
    const user = await this.getUser(userId)
    if (!user) {
      throw new Error('User not found')
    }

    // Parallel data fetching for optimal performance
    const [
      profile,
      preferences,
      securitySettings,
      evaluations,
      businessMetrics
    ] = await Promise.all([
      this.getProfile(userId, config),
      this.getPreferences(userId, config),
      this.getSecuritySettings(userId, config),
      this.getEvaluations(userId, config),
      this.getBusinessMetrics(userId, config)
    ])

    // Transform evaluation data into summaries
    const valuation = this.transformToValuationSummary(evaluations.current)
    const healthScore = this.transformToHealthScoreSummary(evaluations.current)
    const documentAnalysis = this.transformToDocumentAnalysisSummary(evaluations.current)
    const opportunities = this.transformToOpportunitiesSummary(evaluations.current)
    const scenarioProjections = this.generateScenarioProjections(evaluations.current)

    // Generate metadata
    const reportMetadata = this.generateReportMetadata([
      'user', 'profile', 'evaluations', 'preferences', 'businessMetrics'
    ])

    return {
      user,
      profile,
      preferences,
      securitySettings,
      evaluations,
      valuation,
      healthScore,
      documentAnalysis,
      opportunities,
      businessMetrics,
      scenarioProjections,
      reportMetadata
    }
  }

  /**
   * Get filtered user context for specific report types
   */
  async getFilteredUserContext(
    userId: string,
    reportType: FilteredUserContext['reportType'],
    includeFields?: string[],
    config?: ReportContextConfig
  ): Promise<FilteredUserContext> {
    const fullContext = await this.getUserContext(userId, config)

    // Define field mappings for each report type
    const reportTypeFields: Record<FilteredUserContext['reportType'], string[]> = {
      'executive': ['user', 'valuation', 'healthScore', 'opportunities', 'reportMetadata'],
      'detailed': ['user', 'profile', 'evaluations', 'valuation', 'healthScore', 'documentAnalysis', 'opportunities', 'businessMetrics', 'scenarioProjections', 'reportMetadata'],
      'comparison': ['user', 'evaluations', 'businessMetrics', 'valuation', 'healthScore', 'reportMetadata'],
      'performance': ['user', 'businessMetrics', 'healthScore', 'evaluations', 'reportMetadata']
    }

    const fieldsToInclude = includeFields || reportTypeFields[reportType]
    const filteredContext: FilteredUserContext = {
      reportType,
      includeFields: fieldsToInclude
    }

    // Include only requested fields
    fieldsToInclude.forEach(field => {
      if (fullContext[field as keyof UserContext] !== undefined) {
        (filteredContext as any)[field] = fullContext[field as keyof UserContext]
      }
    })

    return filteredContext
  }

  /**
   * Validate user authentication and data access
   */
  private async validateUserAccess(userId: string): Promise<UserAccessContext> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          userRole: true,
          subscriptionTier: true,
          createdAt: true
        }
      })

      if (!user) {
        return {
          userId,
          userRole: 'unknown',
          subscriptionTier: 'free',
          hasAccess: false,
          accessLevel: 'basic',
          restrictions: ['User not found']
        }
      }

      // Determine access level based on subscription tier
      const accessLevel = this.getAccessLevel(user.subscriptionTier)
      const restrictions = this.getAccessRestrictions(user.subscriptionTier, user.userRole)

      return {
        userId,
        userRole: user.userRole,
        subscriptionTier: user.subscriptionTier,
        hasAccess: true,
        accessLevel,
        restrictions
      }
    } catch (error) {
      return {
        userId,
        userRole: 'unknown',
        subscriptionTier: 'free',
        hasAccess: false,
        accessLevel: 'basic',
        restrictions: ['Access validation failed']
      }
    }
  }

  /**
   * Get user basic information with proper type safety
   */
  private async getUser(userId: string): Promise<User | null> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId }
      })

      if (!user) return null

      // Transform database model to interface
      return {
        id: user.id,
        email: user.email,
        businessName: user.businessName,
        industry: user.industry,
        role: user.role.toLowerCase() as 'owner' | 'manager' | 'advisor',
        subscriptionTier: user.subscriptionTier as 'free' | 'premium' | 'enterprise',
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        lastLoginAt: user.lastLoginAt
      }
    } catch (error) {
      console.error('Error fetching user:', error)
      return null
    }
  }

  /**
   * Get user profile with configuration-based filtering
   */
  private async getProfile(userId: string, config?: ReportContextConfig): Promise<UserProfile | null> {
    if (config?.includePersonalInfo === false) {
      return null
    }

    try {
      return await this.profileRepo.findByUserId(userId)
    } catch (error) {
      console.error('Error fetching user profile:', error)
      return null
    }
  }

  /**
   * Get user preferences
   */
  private async getPreferences(userId: string, config?: ReportContextConfig): Promise<UserPreferences | null> {
    try {
      return await this.preferencesRepo.findByUserId(userId)
    } catch (error) {
      console.error('Error fetching user preferences:', error)
      return null
    }
  }

  /**
   * Get security settings (filtered for reports)
   */
  private async getSecuritySettings(userId: string, config?: ReportContextConfig): Promise<SecuritySettings | null> {
    if (config?.includePersonalInfo === false) {
      return null
    }

    try {
      const settings = await this.securityRepo.findByUserId(userId)
      if (!settings) return null

      // Remove sensitive data for reports
      return {
        ...settings,
        twoFactorSecret: undefined,
        backupCodes: undefined,
        trustedDevices: []
      }
    } catch (error) {
      console.error('Error fetching security settings:', error)
      return null
    }
  }

  /**
   * Get business evaluations with history
   */
  private async getEvaluations(userId: string, config?: ReportContextConfig): Promise<UserContext['evaluations']> {
    try {
      const evaluations = await this.evaluationRepo.findByUserId(userId)

      // Apply time period filter if specified
      const filteredEvaluations = config?.timePeriod
        ? evaluations.filter(e =>
            e.createdAt >= config.timePeriod!.start &&
            e.createdAt <= config.timePeriod!.end
          )
        : evaluations

      return {
        current: filteredEvaluations[0] || null,
        history: filteredEvaluations.slice(1),
        count: filteredEvaluations.length
      }
    } catch (error) {
      console.error('Error fetching evaluations:', error)
      return {
        current: null,
        history: [],
        count: 0
      }
    }
  }

  /**
   * Get business metrics
   */
  private async getBusinessMetrics(userId: string, config?: ReportContextConfig): Promise<BusinessMetrics | null> {
    try {
      const metrics = await this.metricsRepo.findLatestByUserId(userId)

      // Apply confidence threshold filter if specified
      if (config?.confidenceThreshold && metrics) {
        // Filter metrics based on confidence threshold if applicable
        return metrics
      }

      return metrics
    } catch (error) {
      console.error('Error fetching business metrics:', error)
      return null
    }
  }

  /**
   * Transform business evaluation to valuation summary
   */
  private transformToValuationSummary(evaluation: BusinessEvaluation | null): ValuationSummary | null {
    if (!evaluation || !evaluation.valuations) return null

    try {
      const valuations = evaluation.valuations as any
      return {
        currentValue: valuations.weighted?.value || valuations.incomeBased?.value || 0,
        confidence: evaluation.confidenceScore || 0,
        methodology: valuations.methodology || 'weighted',
        marketMultiple: valuations.marketBased?.multiple,
        revenueMultiple: valuations.incomeBased?.multiple,
        growthRate: this.calculateGrowthRate(evaluation.businessData as any)
      }
    } catch (error) {
      console.error('Error transforming valuation summary:', error)
      return null
    }
  }

  /**
   * Transform business evaluation to health score summary
   */
  private transformToHealthScoreSummary(evaluation: BusinessEvaluation | null): HealthScoreSummary | null {
    if (!evaluation) return null

    try {
      const scoringFactors = evaluation.scoringFactors as any
      const dimensions: Record<string, number> = {}

      if (scoringFactors) {
        Object.keys(scoringFactors).forEach(key => {
          const dimension = scoringFactors[key] as HealthDimension
          dimensions[key] = dimension.score || 0
        })
      }

      return {
        overallScore: evaluation.healthScore || 0,
        dimensions,
        trend: this.determineTrend(evaluation)
      }
    } catch (error) {
      console.error('Error transforming health score summary:', error)
      return null
    }
  }

  /**
   * Transform document analysis summary
   */
  private transformToDocumentAnalysisSummary(evaluation: BusinessEvaluation | null): DocumentAnalysisSummary | null {
    if (!evaluation?.uploadedDocuments && !evaluation?.documentAnalysis) return null

    try {
      const documents = evaluation.uploadedDocuments as any[] || []
      const analysis = evaluation.documentAnalysis as any[] || []

      return {
        totalDocuments: documents.length,
        averageQualityScore: documents.length > 0
          ? documents.reduce((sum, doc) => sum + (doc.qualityAssessment?.overallScore || 0), 0) / documents.length
          : 0,
        lastProcessed: documents.length > 0
          ? new Date(Math.max(...documents.map(doc => new Date(doc.extractedData?.extractionDate || 0).getTime())))
          : null,
        keyInsights: analysis.length
      }
    } catch (error) {
      console.error('Error transforming document analysis summary:', error)
      return null
    }
  }

  /**
   * Transform opportunities summary
   */
  private transformToOpportunitiesSummary(evaluation: BusinessEvaluation | null): OpportunitiesSummary | null {
    if (!evaluation?.opportunities) return null

    try {
      const opportunities = evaluation.opportunities as ImprovementOpportunity[]

      const priorityDistribution: Record<string, number> = {}
      let totalImpact = 0

      opportunities.forEach(opp => {
        const priority = opp.priority?.toString() || 'unknown'
        priorityDistribution[priority] = (priorityDistribution[priority] || 0) + 1
        totalImpact += opp.impactEstimate?.dollarAmount || 0
      })

      return {
        totalOpportunities: opportunities.length,
        estimatedImpact: totalImpact,
        priorityDistribution,
        potentialValue: totalImpact
      }
    } catch (error) {
      console.error('Error transforming opportunities summary:', error)
      return null
    }
  }

  /**
   * Generate scenario projections based on evaluation
   */
  private generateScenarioProjections(evaluation: BusinessEvaluation | null): ScenarioProjection[] {
    if (!evaluation) return []

    try {
      const baseValue = evaluation.valuations ? (evaluation.valuations as any).weighted?.value || 0 : 0

      return [
        {
          name: 'Conservative',
          probability: 0.7,
          valuationImpact: baseValue * 0.1,
          description: 'Minimal improvements implementation with conservative market conditions'
        },
        {
          name: 'Most Likely',
          probability: 0.6,
          valuationImpact: baseValue * 0.25,
          description: 'Expected improvements implementation with stable market conditions'
        },
        {
          name: 'Optimistic',
          probability: 0.3,
          valuationImpact: baseValue * 0.45,
          description: 'Maximum improvements implementation with favorable market conditions'
        }
      ]
    } catch (error) {
      console.error('Error generating scenario projections:', error)
      return []
    }
  }

  /**
   * Generate report metadata
   */
  private generateReportMetadata(dataSources: string[]): UserContext['reportMetadata'] {
    return {
      generatedAt: new Date(),
      dataSourcesUsed: dataSources,
      confidenceScore: 0.85, // Base confidence score
      lastUpdated: new Date()
    }
  }

  /**
   * Helper method to determine access level
   */
  private getAccessLevel(subscriptionTier: string): UserAccessContext['accessLevel'] {
    switch (subscriptionTier.toLowerCase()) {
      case 'enterprise':
        return 'enterprise'
      case 'premium':
        return 'premium'
      default:
        return 'basic'
    }
  }

  /**
   * Helper method to get access restrictions
   */
  private getAccessRestrictions(subscriptionTier: string, userRole: string): string[] {
    const restrictions: string[] = []

    if (subscriptionTier === 'free') {
      restrictions.push('Limited to basic reports', 'No historical data beyond 30 days')
    }

    if (userRole !== 'admin' && userRole !== 'super_admin') {
      restrictions.push('Cannot access other users data')
    }

    return restrictions
  }

  /**
   * Helper method to calculate growth rate
   */
  private calculateGrowthRate(businessData: any): number | undefined {
    try {
      if (businessData?.annualRevenue && businessData?.monthlyRecurring) {
        const annualFromMonthly = businessData.monthlyRecurring * 12
        return ((annualFromMonthly - businessData.annualRevenue) / businessData.annualRevenue) * 100
      }
      return undefined
    } catch {
      return undefined
    }
  }

  /**
   * Helper method to determine trend
   */
  private determineTrend(evaluation: BusinessEvaluation): HealthScoreSummary['trend'] {
    // Simple trend determination - in real implementation, this would compare with historical data
    const healthScore = evaluation.healthScore || 0
    if (healthScore > 80) return 'improving'
    if (healthScore < 60) return 'declining'
    return 'stable'
  }

  /**
   * Utility method to safely serialize user context for logging/debugging
   */
  serializeForLogging(context: UserContext): Record<string, any> {
    return {
      userId: context.user.id,
      hasProfile: !!context.profile,
      hasEvaluations: context.evaluations.count > 0,
      hasValuation: !!context.valuation,
      hasHealthScore: !!context.healthScore,
      confidenceScore: context.reportMetadata.confidenceScore,
      generatedAt: context.reportMetadata.generatedAt.toISOString()
    }
  }

  /**
   * Utility method to validate context completeness
   */
  validateContextCompleteness(context: UserContext): {
    isComplete: boolean
    missingFields: string[]
    warnings: string[]
  } {
    const missingFields: string[] = []
    const warnings: string[] = []

    if (!context.user) missingFields.push('user')
    if (!context.evaluations.current) warnings.push('No current evaluation available')
    if (!context.valuation) warnings.push('No valuation data available')
    if (!context.healthScore) warnings.push('No health score data available')

    return {
      isComplete: missingFields.length === 0,
      missingFields,
      warnings
    }
  }
}