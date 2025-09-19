/**
 * Enhanced Report Generator Service
 *
 * Provides high-level interface for generating comprehensive business reports
 * with AI analysis integration and tier-specific features.
 *
 * @author Backend API Developer
 * @version 1.0.0
 */

import { enhancedAnalysisEngine } from '@/lib/ai/enhanced-analysis-engine'
import type { AnalysisRequest, AnalysisResult } from '@/lib/ai/enhanced-analysis-engine'
import type { BusinessData, ProfessionalTierData } from '@/types/evaluation'

// Report Configuration Types
export interface ReportConfiguration {
  type: 'financial_analysis' | 'strategic_assessment' | 'market_position' | 'comprehensive' | 'custom'
  sections?: string[]
  analysisDepth: 'basic' | 'detailed' | 'comprehensive'
  includeScenarios?: boolean
  includeRiskAssessment?: boolean
  includeBenchmarks?: boolean // Enterprise only
  customPrompts?: string[] // Enterprise only
}

export interface ReportDeliveryOptions {
  method: 'download' | 'email' | 'storage' | 'api_response'
  format: 'pdf' | 'html' | 'json' | 'markdown'
  email?: string
  priority?: 'low' | 'medium' | 'high' | 'urgent'
}

export interface ReportGenerationOptions {
  useCache?: boolean
  realTimeUpdates?: boolean
  includeRawAnalysis?: boolean // Enterprise only
  timeout?: number
}

// Report Result Types
export interface EnhancedReport {
  id: string
  tier: string
  businessData: BusinessData | ProfessionalTierData
  configuration: ReportConfiguration
  analysis: {
    summary: ReportSummary
    detailed?: any
    insights: ReportInsights
    scenarios?: any
    risks?: string[]
  }
  metadata: ReportMetadata
  validation: ReportValidation
}

export interface ReportSummary {
  overallScore: number
  keyFindings: string[]
  recommendations: string[]
  confidenceLevel: 'low' | 'medium' | 'high' | 'very_high'
  executiveSummary: string
}

export interface ReportInsights {
  keyFindings: string[]
  recommendations: string[]
  riskFactors: string[]
  opportunities: string[]
  trends?: string[]
  benchmarks?: any // Enterprise only
}

export interface ReportMetadata {
  generatedAt: Date
  processingTime: number
  tokensUsed: number
  cacheHit: boolean
  qualityScore: number
  aiModelVersion: string
  tierLimitations?: string[]
}

export interface ReportValidation {
  isValid: boolean
  errors: string[]
  warnings: string[]
  completeness: number
  dataQuality: number
}

/**
 * Enhanced Report Generator
 * Main service class for generating comprehensive business reports
 */
export class EnhancedReportGenerator {
  private static instance: EnhancedReportGenerator
  private cache: Map<string, EnhancedReport> = new Map()
  private readonly cacheExpiryMs = 60 * 60 * 1000 // 1 hour

  private constructor() {}

  /**
   * Get singleton instance
   */
  public static getInstance(): EnhancedReportGenerator {
    if (!EnhancedReportGenerator.instance) {
      EnhancedReportGenerator.instance = new EnhancedReportGenerator()
    }
    return EnhancedReportGenerator.instance
  }

  /**
   * Generate enhanced business report
   */
  async generateReport(
    businessData: BusinessData | ProfessionalTierData,
    configuration: ReportConfiguration,
    tier: 'professional' | 'enterprise',
    userId: string,
    options: ReportGenerationOptions = {}
  ): Promise<EnhancedReport> {
    const startTime = Date.now()
    const reportId = this.generateReportId(businessData, configuration)

    try {
      // Check cache if enabled
      if (options.useCache) {
        const cachedReport = this.getCachedReport(reportId)
        if (cachedReport) {
          return cachedReport
        }
      }

      // Validate configuration for tier
      this.validateConfigurationForTier(configuration, tier)

      // Prepare AI analysis request
      const analysisRequest: AnalysisRequest = {
        tier,
        analysisType: this.mapConfigurationToAnalysisType(configuration),
        businessData,
        userId,
        priority: options.priority || 'medium',
        enableRealTime: options.realTimeUpdates || false,
        cacheKey: options.useCache ? reportId : undefined
      }

      // Generate AI analysis
      const analysisResult = await enhancedAnalysisEngine.analyze(analysisRequest)

      // Process and format the report
      const enhancedReport = await this.processAnalysisResult(
        analysisResult,
        businessData,
        configuration,
        tier,
        reportId,
        startTime
      )

      // Cache the report if enabled and quality is good
      if (options.useCache && enhancedReport.metadata.qualityScore > 70) {
        this.cacheReport(reportId, enhancedReport)
      }

      return enhancedReport

    } catch (error) {
      console.error('Enhanced report generation failed:', error)
      throw new Error(`Report generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Generate report summary only (faster, lighter)
   */
  async generateReportSummary(
    businessData: BusinessData | ProfessionalTierData,
    tier: 'professional' | 'enterprise',
    userId: string
  ): Promise<ReportSummary> {
    const summaryConfig: ReportConfiguration = {
      type: 'comprehensive',
      analysisDepth: 'basic',
      includeScenarios: false,
      includeRiskAssessment: true
    }

    const report = await this.generateReport(businessData, summaryConfig, tier, userId, {
      useCache: true,
      includeRawAnalysis: false
    })

    return report.analysis.summary
  }

  /**
   * Validate report exists and user has access
   */
  async validateReportAccess(reportId: string, userId: string, tier: string): Promise<boolean> {
    // Implementation would check database or cache for report ownership
    // For now, just check if report exists in cache
    const report = this.cache.get(reportId)
    return report !== undefined
  }

  /**
   * Get report status
   */
  async getReportStatus(reportId: string): Promise<{
    exists: boolean
    status: 'processing' | 'completed' | 'failed'
    progress?: number
  }> {
    const report = this.cache.get(reportId)
    return {
      exists: report !== undefined,
      status: report ? 'completed' : 'processing',
      progress: report ? 100 : undefined
    }
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear()
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): {
    size: number
    hitRate: number
    oldestEntry: Date | null
  } {
    const size = this.cache.size
    let oldestEntry: Date | null = null

    for (const report of this.cache.values()) {
      if (!oldestEntry || report.metadata.generatedAt < oldestEntry) {
        oldestEntry = report.metadata.generatedAt
      }
    }

    return {
      size,
      hitRate: 0, // Would need to track hits vs misses
      oldestEntry
    }
  }

  // Private Methods

  /**
   * Validate configuration is allowed for tier
   */
  private validateConfigurationForTier(config: ReportConfiguration, tier: string): void {
    if (tier !== 'enterprise') {
      if (config.includeBenchmarks) {
        throw new Error('Benchmarks are only available in Enterprise tier')
      }
      if (config.customPrompts && config.customPrompts.length > 0) {
        throw new Error('Custom prompts are only available in Enterprise tier')
      }
    }
  }

  /**
   * Map report configuration to AI analysis type
   */
  private mapConfigurationToAnalysisType(config: ReportConfiguration): string {
    const mapping = {
      'financial_analysis': 'financial_assessment',
      'strategic_assessment': 'strategic_analysis',
      'market_position': 'market_analysis',
      'comprehensive': 'comprehensive_analysis',
      'custom': 'custom_analysis'
    }
    return mapping[config.type] || 'comprehensive_analysis'
  }

  /**
   * Process AI analysis result into enhanced report
   */
  private async processAnalysisResult(
    analysisResult: AnalysisResult,
    businessData: BusinessData | ProfessionalTierData,
    configuration: ReportConfiguration,
    tier: string,
    reportId: string,
    startTime: number
  ): Promise<EnhancedReport> {
    const processingTime = Date.now() - startTime

    // Generate executive summary
    const executiveSummary = this.generateExecutiveSummary(
      analysisResult,
      businessData,
      tier
    )

    const report: EnhancedReport = {
      id: reportId,
      tier,
      businessData,
      configuration,
      analysis: {
        summary: {
          overallScore: Math.round(analysisResult.confidence),
          keyFindings: analysisResult.insights.keyFindings.slice(0, 5), // Top 5
          recommendations: analysisResult.insights.recommendations.slice(0, 3), // Top 3
          confidenceLevel: this.mapConfidenceLevel(analysisResult.confidence),
          executiveSummary
        },
        detailed: configuration.analysisDepth === 'comprehensive' ? analysisResult.analysisData : undefined,
        insights: analysisResult.insights,
        scenarios: analysisResult.analysisData.scenario_modeling || null,
        risks: analysisResult.insights.riskFactors
      },
      metadata: {
        generatedAt: new Date(),
        processingTime,
        tokensUsed: analysisResult.metadata.tokensUsed,
        cacheHit: analysisResult.metadata.cacheHit,
        qualityScore: Math.round(analysisResult.qualityScore),
        aiModelVersion: analysisResult.metadata.modelVersion,
        tierLimitations: this.getTierLimitations(tier)
      },
      validation: {
        isValid: analysisResult.validation.isValid,
        errors: analysisResult.validation.errors,
        warnings: analysisResult.validation.warnings,
        completeness: analysisResult.validation.completeness,
        dataQuality: Math.min(100, analysisResult.qualityScore)
      }
    }

    return report
  }

  /**
   * Generate executive summary
   */
  private generateExecutiveSummary(
    analysisResult: AnalysisResult,
    businessData: BusinessData | ProfessionalTierData,
    tier: string
  ): string {
    const businessName = (businessData as any).businessName || 'the business'
    const score = Math.round(analysisResult.confidence)
    const topFindings = analysisResult.insights.keyFindings.slice(0, 2)
    const topRecommendation = analysisResult.insights.recommendations[0]

    let summary = `This comprehensive analysis of ${businessName} reveals an overall business health score of ${score}/100. `

    if (topFindings.length > 0) {
      summary += `Key findings include: ${topFindings.join(' and ')}. `
    }

    if (topRecommendation) {
      summary += `Primary recommendation: ${topRecommendation}. `
    }

    if (tier === 'enterprise' && analysisResult.analysisData.strategic_value_score) {
      summary += `Strategic value assessment indicates ${analysisResult.analysisData.strategic_value_score}/100 potential. `
    }

    summary += 'This analysis provides actionable insights for informed decision-making and strategic planning.'

    return summary
  }

  /**
   * Map confidence score to level
   */
  private mapConfidenceLevel(confidence: number): 'low' | 'medium' | 'high' | 'very_high' {
    if (confidence >= 90) return 'very_high'
    if (confidence >= 70) return 'high'
    if (confidence >= 50) return 'medium'
    return 'low'
  }

  /**
   * Get tier limitations
   */
  private getTierLimitations(tier: string): string[] {
    const limitations: Record<string, string[]> = {
      'professional': [
        'Limited to 30 reports per month',
        'No custom analysis prompts',
        'No benchmark comparisons'
      ],
      'enterprise': []
    }

    return limitations[tier] || []
  }

  /**
   * Generate unique report ID
   */
  private generateReportId(businessData: any, configuration: ReportConfiguration): string {
    const keyData = {
      businessName: (businessData as any).businessName,
      industry: (businessData as any).industry,
      reportType: configuration.type,
      timestamp: Math.floor(Date.now() / (1000 * 60 * 15)) // 15-minute buckets for cache
    }

    const hash = btoa(JSON.stringify(keyData)).replace(/[+/=]/g, '_').substring(0, 16)
    return `report_${hash}_${Date.now()}`
  }

  /**
   * Get cached report
   */
  private getCachedReport(reportId: string): EnhancedReport | null {
    const report = this.cache.get(reportId)
    if (!report) return null

    // Check if cache has expired
    const ageMs = Date.now() - report.metadata.generatedAt.getTime()
    if (ageMs > this.cacheExpiryMs) {
      this.cache.delete(reportId)
      return null
    }

    return report
  }

  /**
   * Cache report
   */
  private cacheReport(reportId: string, report: EnhancedReport): void {
    this.cache.set(reportId, report)

    // Limit cache size
    if (this.cache.size > 100) {
      const oldestKey = Array.from(this.cache.keys())[0]
      this.cache.delete(oldestKey)
    }
  }
}

// Export singleton instance
export const enhancedReportGenerator = EnhancedReportGenerator.getInstance()

// Export types
export type {
  ReportConfiguration,
  ReportDeliveryOptions,
  ReportGenerationOptions,
  EnhancedReport,
  ReportSummary,
  ReportInsights,
  ReportMetadata,
  ReportValidation
}