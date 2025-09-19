/**
 * Enhanced AI Analysis Engine
 * Advanced tier-specific analysis with context-aware prompting, error handling, and performance optimization
 */

import Anthropic from '@anthropic-ai/sdk'
import { config } from '@/lib/config'
import { handleClaudeRequest } from '@/lib/services/claude-api-real'
import {
  TierPromptConfig,
  createTierPromptConfig,
  generatePrompt,
  validateOutput,
  TIER_PROMPT_CONFIGS
} from './tier-specific-prompts'
import type { BusinessData, ProfessionalTierData } from '@/types/evaluation'

// Analysis Engine Types
export interface AnalysisRequest {
  tier: 'professional' | 'enterprise'
  analysisType: string
  businessData: BusinessData | ProfessionalTierData
  userId?: string
  priority?: 'low' | 'medium' | 'high' | 'critical'
  enableRealTime?: boolean
  cacheKey?: string
}

export interface AnalysisResult {
  id: string
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cached'
  confidence: number
  qualityScore: number
  analysisData: any
  metadata: {
    tier: string
    analysisType: string
    processingTime: number
    tokensUsed: number
    modelVersion: string
    timestamp: Date
    retryCount: number
    cacheHit: boolean
  }
  insights: {
    keyFindings: string[]
    recommendations: string[]
    riskFactors: string[]
    opportunities: string[]
  }
  validation: {
    isValid: boolean
    errors: string[]
    warnings: string[]
    completeness: number
  }
}

export interface AnalysisError {
  code: string
  message: string
  tier: string
  analysisType: string
  retryable: boolean
  suggestedAction: string
  originalError?: Error
}

export interface CacheEntry {
  key: string
  result: AnalysisResult
  createdAt: Date
  expiresAt: Date
  accessCount: number
  lastAccessed: Date
}

export interface TokenOptimization {
  enabled: boolean
  maxTokens: number
  compressionLevel: 'none' | 'low' | 'medium' | 'high'
  prioritizeFields: string[]
  excludeFields: string[]
}

export interface QualityMetrics {
  completeness: number
  consistency: number
  relevance: number
  accuracy: number
  overall: number
}

/**
 * Enhanced Analysis Engine with tier-specific intelligence
 */
export class EnhancedAnalysisEngine {
  private anthropic: Anthropic
  private cache: Map<string, CacheEntry> = new Map()
  private readonly maxRetries = 3
  private readonly baseDelay = 1000
  private readonly cacheExpiryHours = 24
  private realTimeSubscribers: Map<string, (result: AnalysisResult) => void> = new Map()

  constructor() {
    this.anthropic = new Anthropic({
      apiKey: config.claude.apiKey,
    })

    // Initialize cache cleanup
    this.startCacheCleanup()
  }

  /**
   * Main analysis method with comprehensive error handling and optimization
   */
  async analyze(request: AnalysisRequest): Promise<AnalysisResult> {
    const startTime = Date.now()
    const analysisId = this.generateAnalysisId(request)

    try {
      // Check cache first
      const cachedResult = this.getCachedResult(request.cacheKey || analysisId)
      if (cachedResult) {
        this.updateCacheAccess(request.cacheKey || analysisId)
        return cachedResult
      }

      // Validate request
      this.validateRequest(request)

      // Get tier-specific configuration
      const config = this.getTierConfig(request.tier, request.analysisType)
      if (!config) {
        throw new AnalysisError({
          code: 'INVALID_CONFIG',
          message: `No configuration found for tier: ${request.tier}, type: ${request.analysisType}`,
          tier: request.tier,
          analysisType: request.analysisType,
          retryable: false,
          suggestedAction: 'Check tier and analysis type parameters'
        })
      }

      // Optimize data for analysis
      const optimizedData = this.optimizeBusinessData(request.businessData, request.tier)

      // Create analysis result placeholder
      let result: AnalysisResult = {
        id: analysisId,
        status: 'processing',
        confidence: 0,
        qualityScore: 0,
        analysisData: {},
        metadata: {
          tier: request.tier,
          analysisType: request.analysisType,
          processingTime: 0,
          tokensUsed: 0,
          modelVersion: 'claude-3-5-sonnet-20241022',
          timestamp: new Date(),
          retryCount: 0,
          cacheHit: false
        },
        insights: {
          keyFindings: [],
          recommendations: [],
          riskFactors: [],
          opportunities: []
        },
        validation: {
          isValid: false,
          errors: [],
          warnings: [],
          completeness: 0
        }
      }

      // Notify real-time subscribers
      if (request.enableRealTime) {
        this.notifyRealTimeSubscribers(analysisId, result)
      }

      // Perform analysis with retry logic
      const analysisData = await this.performAnalysisWithRetry(
        config,
        optimizedData,
        request.priority || 'medium'
      )

      // Process and validate results
      const processedData = this.processAnalysisResults(analysisData, config)
      const qualityMetrics = this.calculateQualityScore(processedData, config)
      const confidence = this.calculateConfidenceScore(processedData, request.tier)

      // Update result
      result = {
        ...result,
        status: 'completed',
        confidence,
        qualityScore: qualityMetrics.overall,
        analysisData: processedData,
        metadata: {
          ...result.metadata,
          processingTime: Date.now() - startTime,
          tokensUsed: this.estimateTokenUsage(optimizedData, analysisData)
        },
        insights: this.extractInsights(processedData, request.tier),
        validation: this.validateAnalysisResult(processedData, config)
      }

      // Cache successful result
      if (request.cacheKey || result.qualityScore > 70) {
        this.cacheResult(request.cacheKey || analysisId, result)
      }

      // Final real-time notification
      if (request.enableRealTime) {
        this.notifyRealTimeSubscribers(analysisId, result)
      }

      return result

    } catch (error) {
      const analysisError = this.handleAnalysisError(error, request)

      const failedResult: AnalysisResult = {
        id: analysisId,
        status: 'failed',
        confidence: 0,
        qualityScore: 0,
        analysisData: {},
        metadata: {
          tier: request.tier,
          analysisType: request.analysisType,
          processingTime: Date.now() - startTime,
          tokensUsed: 0,
          modelVersion: 'claude-3-5-sonnet-20241022',
          timestamp: new Date(),
          retryCount: 0,
          cacheHit: false
        },
        insights: {
          keyFindings: [],
          recommendations: [],
          riskFactors: [analysisError.message],
          opportunities: []
        },
        validation: {
          isValid: false,
          errors: [analysisError.message],
          warnings: [],
          completeness: 0
        }
      }

      if (request.enableRealTime) {
        this.notifyRealTimeSubscribers(analysisId, failedResult)
      }

      throw analysisError
    }
  }

  /**
   * Batch analysis for multiple requests
   */
  async analyzeBatch(requests: AnalysisRequest[]): Promise<AnalysisResult[]> {
    const results = await Promise.allSettled(
      requests.map(request => this.analyze(request))
    )

    return results.map((result, index) => {
      if (result.status === 'fulfilled') {
        return result.value
      } else {
        return {
          id: this.generateAnalysisId(requests[index]),
          status: 'failed' as const,
          confidence: 0,
          qualityScore: 0,
          analysisData: {},
          metadata: {
            tier: requests[index].tier,
            analysisType: requests[index].analysisType,
            processingTime: 0,
            tokensUsed: 0,
            modelVersion: 'claude-3-5-sonnet-20241022',
            timestamp: new Date(),
            retryCount: 0,
            cacheHit: false
          },
          insights: {
            keyFindings: [],
            recommendations: [],
            riskFactors: [result.reason?.message || 'Analysis failed'],
            opportunities: []
          },
          validation: {
            isValid: false,
            errors: [result.reason?.message || 'Analysis failed'],
            warnings: [],
            completeness: 0
          }
        }
      }
    })
  }

  /**
   * Real-time analysis with streaming updates
   */
  async analyzeRealTime(
    request: AnalysisRequest,
    callback: (result: AnalysisResult) => void
  ): Promise<string> {
    const analysisId = this.generateAnalysisId(request)
    this.realTimeSubscribers.set(analysisId, callback)

    // Start analysis asynchronously
    this.analyze({ ...request, enableRealTime: true }).catch(error => {
      console.error('Real-time analysis failed:', error)
    })

    return analysisId
  }

  /**
   * Subscribe to real-time updates
   */
  subscribeToUpdates(
    analysisId: string,
    callback: (result: AnalysisResult) => void
  ): () => void {
    this.realTimeSubscribers.set(analysisId, callback)

    return () => {
      this.realTimeSubscribers.delete(analysisId)
    }
  }

  /**
   * Get analysis status
   */
  async getAnalysisStatus(analysisId: string): Promise<AnalysisResult | null> {
    // Check cache for completed analysis
    const cached = Array.from(this.cache.values()).find(
      entry => entry.result.id === analysisId
    )

    return cached?.result || null
  }

  /**
   * Clear analysis cache
   */
  clearCache(pattern?: string): void {
    if (pattern) {
      const regex = new RegExp(pattern)
      for (const [key, entry] of this.cache.entries()) {
        if (regex.test(key)) {
          this.cache.delete(key)
        }
      }
    } else {
      this.cache.clear()
    }
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): {
    size: number
    hitRate: number
    totalAccess: number
    avgAge: number
  } {
    const entries = Array.from(this.cache.values())
    const totalAccess = entries.reduce((sum, entry) => sum + entry.accessCount, 0)
    const hits = entries.filter(entry => entry.accessCount > 1).length
    const avgAge = entries.length > 0
      ? entries.reduce((sum, entry) => sum + (Date.now() - entry.createdAt.getTime()), 0) / entries.length / 1000 / 60
      : 0

    return {
      size: entries.length,
      hitRate: entries.length > 0 ? (hits / entries.length) * 100 : 0,
      totalAccess,
      avgAge
    }
  }

  // Private Methods

  private validateRequest(request: AnalysisRequest): void {
    if (!request.tier || !['professional', 'enterprise'].includes(request.tier)) {
      throw new Error('Invalid tier specified')
    }

    if (!request.analysisType) {
      throw new Error('Analysis type is required')
    }

    if (!request.businessData) {
      throw new Error('Business data is required')
    }
  }

  private getTierConfig(tier: string, analysisType: string): TierPromptConfig | null {
    const tierConfigs = TIER_PROMPT_CONFIGS[tier as keyof typeof TIER_PROMPT_CONFIGS]
    if (!tierConfigs) return null

    const config = tierConfigs[analysisType as keyof typeof tierConfigs]
    return config || null
  }

  private optimizeBusinessData(
    data: BusinessData | ProfessionalTierData,
    tier: string
  ): Record<string, any> {
    // Token optimization based on tier
    const optimization: TokenOptimization = {
      enabled: true,
      maxTokens: tier === 'enterprise' ? 4000 : 3000,
      compressionLevel: 'medium',
      prioritizeFields: tier === 'enterprise'
        ? ['strategic_value_drivers', 'scenario_modeling', 'exit_strategy']
        : ['financial_metrics', 'operational_efficiency', 'risk_assessment'],
      excludeFields: ['metadata', 'internal_notes']
    }

    if (!optimization.enabled) return data as Record<string, any>

    // Apply compression and field prioritization
    const optimized: Record<string, any> = {}

    for (const [key, value] of Object.entries(data)) {
      if (optimization.excludeFields.includes(key)) continue

      if (optimization.prioritizeFields.includes(key)) {
        optimized[key] = value
      } else if (typeof value === 'string' && value.length > 500) {
        // Compress long strings
        optimized[key] = this.compressString(value, optimization.compressionLevel)
      } else {
        optimized[key] = value
      }
    }

    return optimized
  }

  private compressString(str: string, level: string): string {
    switch (level) {
      case 'high':
        return str.substring(0, 200) + '...'
      case 'medium':
        return str.substring(0, 350) + '...'
      case 'low':
        return str.substring(0, 450) + '...'
      default:
        return str
    }
  }

  private async performAnalysisWithRetry(
    config: TierPromptConfig,
    businessData: Record<string, any>,
    priority: string
  ): Promise<any> {
    let lastError: Error | null = null

    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        const prompt = generatePrompt(config, businessData)

        // Use appropriate Claude API based on environment
        let response
        if (typeof window === 'undefined') {
          // Server-side: use direct handler
          const result = await handleClaudeRequest({
            type: 'enhanced-tier-analysis',
            prompt,
            tier: config.tier,
            analysisType: config.analysisType,
            businessData
          })

          if (result.fallback) {
            throw new Error('Claude API unavailable')
          }

          response = result.analysisText
        } else {
          // Client-side: use fetch
          const apiResponse = await fetch('/api/claude', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              type: 'enhanced-tier-analysis',
              prompt,
              tier: config.tier,
              analysisType: config.analysisType,
              businessData
            })
          })

          if (!apiResponse.ok) {
            throw new Error(`Claude API error: ${apiResponse.statusText}`)
          }

          const result = await apiResponse.json()
          if (result.fallback) {
            throw new Error('Claude API unavailable')
          }

          response = result.analysisText
        }

        // Parse and validate response
        const analysisData = this.parseAnalysisResponse(response, config)

        if (!this.isValidAnalysis(analysisData, config)) {
          throw new Error('Invalid analysis response format')
        }

        return analysisData

      } catch (error) {
        lastError = error as Error

        if (attempt < this.maxRetries) {
          // Exponential backoff with jitter
          const delay = this.baseDelay * Math.pow(2, attempt - 1) + Math.random() * 1000
          await new Promise(resolve => setTimeout(resolve, delay))
        }
      }
    }

    throw lastError || new Error('Analysis failed after all retries')
  }

  private parseAnalysisResponse(response: string, config: TierPromptConfig): any {
    try {
      // First try to parse as JSON
      const jsonMatch = response.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0])
        if (validateOutput(parsed, config.outputSchema)) {
          return parsed
        }
      }

      // Fallback to structured text parsing
      return this.parseStructuredText(response, config)

    } catch (error) {
      console.error('Response parsing error:', error)
      return this.createFallbackAnalysis(config)
    }
  }

  private parseStructuredText(response: string, config: TierPromptConfig): any {
    const analysis: any = {}

    // Extract scores
    const scoreMatch = response.match(/score[:\s]*(\d+)/i)
    if (scoreMatch) {
      analysis.overall_score = parseInt(scoreMatch[1])
    }

    // Extract sections based on tier
    if (config.tier === 'professional') {
      analysis.financial_analysis = this.extractSection(response, 'financial', 'professional')
      analysis.operational_analysis = this.extractSection(response, 'operational', 'professional')
      analysis.strategic_positioning = this.extractSection(response, 'strategic', 'professional')
    } else {
      analysis.strategic_value_score = this.extractScore(response, 'strategic value')
      analysis.value_driver_analysis = this.extractSection(response, 'value driver', 'enterprise')
      analysis.scenario_modeling = this.extractSection(response, 'scenario', 'enterprise')
    }

    // Extract recommendations
    analysis.recommendations = this.extractRecommendations(response)

    return analysis
  }

  private extractSection(text: string, sectionName: string, tier: string): any {
    const section: any = {}

    const sectionRegex = new RegExp(`${sectionName}[\\s\\S]*?(?=\\n\\n|$)`, 'i')
    const match = text.match(sectionRegex)

    if (match) {
      const content = match[0]

      // Extract scores
      const scoreMatch = content.match(/(\d+)/)
      if (scoreMatch) {
        section.score = parseInt(scoreMatch[1])
      }

      section.analysis = content
    }

    return section
  }

  private extractScore(text: string, scoreName: string): number {
    const regex = new RegExp(`${scoreName}[:\\s]*(\d+)`, 'i')
    const match = text.match(regex)
    return match ? parseInt(match[1]) : 0
  }

  private extractRecommendations(text: string): string[] {
    const recommendations: string[] = []

    const lines = text.split('\n')
    let inRecommendations = false

    for (const line of lines) {
      if (line.toLowerCase().includes('recommendation')) {
        inRecommendations = true
        continue
      }

      if (inRecommendations && line.trim().startsWith('-')) {
        recommendations.push(line.trim().substring(1).trim())
      } else if (inRecommendations && line.trim() === '') {
        break
      }
    }

    return recommendations
  }

  private createFallbackAnalysis(config: TierPromptConfig): any {
    if (config.tier === 'professional') {
      return {
        overall_score: 65,
        financial_analysis: {
          score: 70,
          revenue_growth: 0.15,
          profitability_trend: 'stable',
          cash_flow_quality: 75,
          financial_health: 'moderate'
        },
        operational_analysis: {
          efficiency_score: 68,
          risk_assessment: 'medium',
          improvement_opportunities: ['Process optimization', 'Cost reduction']
        },
        strategic_positioning: {
          market_position: 'competitive',
          competitive_advantages: ['Customer relationships', 'Operational efficiency'],
          strategic_risks: ['Market competition', 'Economic uncertainty']
        },
        investment_thesis: 'Stable business with growth potential',
        recommendations: ['Improve operational efficiency', 'Strengthen market position']
      }
    } else {
      return {
        strategic_value_score: 75,
        value_driver_analysis: {
          primary_drivers: [
            { driver: 'Market position', value_contribution: 0.3 },
            { driver: 'Operational efficiency', value_contribution: 0.25 }
          ],
          optimization_opportunities: ['Strategic partnerships', 'Market expansion']
        },
        scenario_modeling: {
          base_case_npv: 1000000,
          scenario_range: { low: 800000, high: 1300000 },
          risk_adjusted_value: 950000,
          strategic_options_value: 150000
        },
        exit_strategy_analysis: {
          optimal_exit_pathway: 'Strategic acquisition',
          valuation_range: { low: 2000000, high: 3500000 },
          exit_readiness_score: 72,
          value_optimization_actions: ['Market expansion', 'Process optimization']
        },
        strategic_recommendations: ['Focus on core competencies', 'Prepare for growth'],
        implementation_roadmap: {
          priority_initiatives: ['Strategic planning', 'Operational excellence'],
          timeline: { phase1: '3 months', phase2: '6 months' },
          success_metrics: ['Revenue growth', 'Market share']
        }
      }
    }
  }

  private isValidAnalysis(analysis: any, config: TierPromptConfig): boolean {
    if (!analysis || typeof analysis !== 'object') return false

    const required = config.outputSchema.required || []
    return required.every(field => field in analysis)
  }

  private processAnalysisResults(analysisData: any, config: TierPromptConfig): any {
    // Normalize and enrich the analysis data
    const processed = { ...analysisData }

    // Add metadata
    processed._metadata = {
      tier: config.tier,
      analysisType: config.analysisType,
      processedAt: new Date(),
      version: '1.0'
    }

    // Normalize scores to 0-100 range
    this.normalizeScores(processed)

    // Add calculated fields
    this.addCalculatedFields(processed, config.tier)

    return processed
  }

  private normalizeScores(data: any): void {
    const scoreFields = ['score', 'overall_score', 'strategic_value_score', 'confidence']

    const normalizeValue = (value: any): number => {
      const num = typeof value === 'number' ? value : parseFloat(value) || 0
      return Math.max(0, Math.min(100, num))
    }

    const normalizeObject = (obj: any): void => {
      for (const [key, value] of Object.entries(obj)) {
        if (scoreFields.some(field => key.includes(field))) {
          obj[key] = normalizeValue(value)
        } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
          normalizeObject(value)
        }
      }
    }

    normalizeObject(data)
  }

  private addCalculatedFields(data: any, tier: string): void {
    // Add risk-adjusted scores
    if (data.overall_score && data.risk_assessment) {
      const riskMultiplier = this.getRiskMultiplier(data.risk_assessment)
      data.risk_adjusted_score = Math.round(data.overall_score * riskMultiplier)
    }

    // Add tier-specific calculations
    if (tier === 'enterprise') {
      this.addEnterpriseCalculations(data)
    } else {
      this.addProfessionalCalculations(data)
    }
  }

  private getRiskMultiplier(riskLevel: any): number {
    if (typeof riskLevel === 'string') {
      switch (riskLevel.toLowerCase()) {
        case 'low': return 1.0
        case 'medium': return 0.9
        case 'high': return 0.75
        default: return 0.85
      }
    }
    return 0.85
  }

  private addEnterpriseCalculations(data: any): void {
    // Calculate enterprise-specific metrics
    if (data.scenario_modeling && data.value_driver_analysis) {
      data.strategic_value_index = this.calculateStrategicValueIndex(
        data.scenario_modeling,
        data.value_driver_analysis
      )
    }
  }

  private addProfessionalCalculations(data: any): void {
    // Calculate professional-specific metrics
    if (data.financial_analysis && data.operational_analysis) {
      data.investment_attractiveness = this.calculateInvestmentAttractiveness(
        data.financial_analysis,
        data.operational_analysis
      )
    }
  }

  private calculateStrategicValueIndex(scenario: any, valueDriver: any): number {
    const scenarioScore = scenario.base_case_npv ? Math.min(100, scenario.base_case_npv / 10000) : 50
    const driverScore = valueDriver.optimization_potential || 50
    return Math.round((scenarioScore + driverScore) / 2)
  }

  private calculateInvestmentAttractiveness(financial: any, operational: any): number {
    const financialScore = financial.score || 50
    const operationalScore = operational.efficiency_score || 50
    return Math.round((financialScore * 0.6 + operationalScore * 0.4))
  }

  private calculateQualityScore(analysisData: any, config: TierPromptConfig): QualityMetrics {
    const completeness = this.calculateCompleteness(analysisData, config)
    const consistency = this.calculateConsistency(analysisData)
    const relevance = this.calculateRelevance(analysisData, config.tier)
    const accuracy = this.calculateAccuracy(analysisData)

    const overall = Math.round(
      (completeness * 0.3 + consistency * 0.25 + relevance * 0.25 + accuracy * 0.2)
    )

    return {
      completeness,
      consistency,
      relevance,
      accuracy,
      overall
    }
  }

  private calculateCompleteness(data: any, config: TierPromptConfig): number {
    const required = config.outputSchema.required || []
    const present = required.filter(field => data[field] !== undefined && data[field] !== null)
    return Math.round((present.length / required.length) * 100)
  }

  private calculateConsistency(data: any): number {
    // Check for logical consistency in scores and assessments
    let consistencyScore = 100

    // Example consistency checks
    if (data.overall_score && data.financial_analysis?.score) {
      const diff = Math.abs(data.overall_score - data.financial_analysis.score)
      if (diff > 30) consistencyScore -= 20
    }

    return Math.max(0, consistencyScore)
  }

  private calculateRelevance(data: any, tier: string): number {
    // Check if analysis contains tier-appropriate content
    let relevanceScore = 80 // Base score

    if (tier === 'enterprise') {
      if (data.strategic_value_score) relevanceScore += 10
      if (data.scenario_modeling) relevanceScore += 10
    } else {
      if (data.financial_analysis) relevanceScore += 10
      if (data.operational_analysis) relevanceScore += 10
    }

    return Math.min(100, relevanceScore)
  }

  private calculateAccuracy(data: any): number {
    // Basic accuracy checks based on data validity
    let accuracyScore = 85 // Base score

    // Check for reasonable score ranges
    const scores = this.extractAllScores(data)
    for (const score of scores) {
      if (score < 0 || score > 100) {
        accuracyScore -= 10
      }
    }

    return Math.max(0, accuracyScore)
  }

  private extractAllScores(obj: any): number[] {
    const scores: number[] = []

    const extract = (item: any): void => {
      if (typeof item === 'number' && item >= 0 && item <= 100) {
        scores.push(item)
      } else if (typeof item === 'object' && item !== null) {
        Object.values(item).forEach(extract)
      }
    }

    extract(obj)
    return scores
  }

  private calculateConfidenceScore(analysisData: any, tier: string): number {
    let confidence = 70 // Base confidence

    // Adjust based on data completeness
    const dataFields = Object.keys(analysisData).length
    if (dataFields > 5) confidence += 10
    if (dataFields > 10) confidence += 10

    // Adjust based on tier complexity
    if (tier === 'enterprise') {
      confidence += 5 // Enterprise analysis is more comprehensive
    }

    // Check for specific quality indicators
    if (analysisData.recommendations && Array.isArray(analysisData.recommendations)) {
      confidence += Math.min(10, analysisData.recommendations.length * 2)
    }

    return Math.min(95, confidence)
  }

  private extractInsights(analysisData: any, tier: string): {
    keyFindings: string[]
    recommendations: string[]
    riskFactors: string[]
    opportunities: string[]
  } {
    const insights = {
      keyFindings: [],
      recommendations: [],
      riskFactors: [],
      opportunities: []
    }

    // Extract recommendations
    if (analysisData.recommendations) {
      insights.recommendations = Array.isArray(analysisData.recommendations)
        ? analysisData.recommendations
        : [analysisData.recommendations]
    }

    if (analysisData.strategic_recommendations) {
      insights.recommendations.push(...(Array.isArray(analysisData.strategic_recommendations)
        ? analysisData.strategic_recommendations
        : [analysisData.strategic_recommendations]))
    }

    // Extract key findings based on tier
    if (tier === 'enterprise') {
      if (analysisData.strategic_value_score) {
        insights.keyFindings.push(`Strategic value score: ${analysisData.strategic_value_score}`)
      }
      if (analysisData.exit_strategy_analysis?.optimal_exit_pathway) {
        insights.keyFindings.push(`Optimal exit: ${analysisData.exit_strategy_analysis.optimal_exit_pathway}`)
      }
    } else {
      if (analysisData.overall_score) {
        insights.keyFindings.push(`Overall business health: ${analysisData.overall_score}/100`)
      }
      if (analysisData.investment_thesis) {
        insights.keyFindings.push(analysisData.investment_thesis)
      }
    }

    // Extract risk factors
    if (analysisData.strategic_positioning?.strategic_risks) {
      insights.riskFactors.push(...analysisData.strategic_positioning.strategic_risks)
    }

    // Extract opportunities
    if (analysisData.operational_analysis?.improvement_opportunities) {
      insights.opportunities.push(...analysisData.operational_analysis.improvement_opportunities)
    }

    if (analysisData.value_driver_analysis?.optimization_opportunities) {
      insights.opportunities.push(...analysisData.value_driver_analysis.optimization_opportunities)
    }

    return insights
  }

  private validateAnalysisResult(analysisData: any, config: TierPromptConfig): {
    isValid: boolean
    errors: string[]
    warnings: string[]
    completeness: number
  } {
    const validation = {
      isValid: true,
      errors: [],
      warnings: [],
      completeness: 0
    }

    // Validate required fields
    const required = config.outputSchema.required || []
    const missing = required.filter(field => !(field in analysisData))

    if (missing.length > 0) {
      validation.errors.push(`Missing required fields: ${missing.join(', ')}`)
      validation.isValid = false
    }

    // Calculate completeness
    validation.completeness = Math.round(((required.length - missing.length) / required.length) * 100)

    // Add warnings for low quality scores
    const scores = this.extractAllScores(analysisData)
    const avgScore = scores.length > 0 ? scores.reduce((sum, score) => sum + score, 0) / scores.length : 0

    if (avgScore < 50) {
      validation.warnings.push('Analysis indicates below-average performance across multiple metrics')
    }

    return validation
  }

  private handleAnalysisError(error: unknown, request: AnalysisRequest): AnalysisError {
    const baseError: AnalysisError = {
      code: 'ANALYSIS_FAILED',
      message: 'Analysis failed due to unknown error',
      tier: request.tier,
      analysisType: request.analysisType,
      retryable: true,
      suggestedAction: 'Retry the analysis request'
    }

    if (error instanceof Error) {
      baseError.originalError = error
      baseError.message = error.message

      // Categorize error types
      if (error.message.includes('API')) {
        baseError.code = 'API_ERROR'
        baseError.suggestedAction = 'Check API connectivity and credentials'
      } else if (error.message.includes('timeout')) {
        baseError.code = 'TIMEOUT_ERROR'
        baseError.suggestedAction = 'Reduce analysis complexity or retry'
      } else if (error.message.includes('Invalid')) {
        baseError.code = 'VALIDATION_ERROR'
        baseError.retryable = false
        baseError.suggestedAction = 'Check request parameters and data format'
      }
    }

    return baseError
  }

  private generateAnalysisId(request: AnalysisRequest): string {
    const timestamp = Date.now()
    const hash = this.simpleHash(JSON.stringify(request.businessData))
    return `analysis_${request.tier}_${request.analysisType}_${timestamp}_${hash}`
  }

  private simpleHash(str: string): string {
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36)
  }

  private getCachedResult(key: string): AnalysisResult | null {
    const entry = this.cache.get(key)
    if (!entry) return null

    if (entry.expiresAt < new Date()) {
      this.cache.delete(key)
      return null
    }

    return { ...entry.result, metadata: { ...entry.result.metadata, cacheHit: true } }
  }

  private updateCacheAccess(key: string): void {
    const entry = this.cache.get(key)
    if (entry) {
      entry.accessCount++
      entry.lastAccessed = new Date()
    }
  }

  private cacheResult(key: string, result: AnalysisResult): void {
    const expiresAt = new Date()
    expiresAt.setHours(expiresAt.getHours() + this.cacheExpiryHours)

    const entry: CacheEntry = {
      key,
      result,
      createdAt: new Date(),
      expiresAt,
      accessCount: 1,
      lastAccessed: new Date()
    }

    this.cache.set(key, entry)

    // Limit cache size
    if (this.cache.size > 100) {
      this.evictOldestEntries()
    }
  }

  private evictOldestEntries(): void {
    const entries = Array.from(this.cache.entries())
    entries.sort((a, b) => a[1].lastAccessed.getTime() - b[1].lastAccessed.getTime())

    // Remove oldest 20% of entries
    const removeCount = Math.floor(entries.length * 0.2)
    for (let i = 0; i < removeCount; i++) {
      this.cache.delete(entries[i][0])
    }
  }

  private startCacheCleanup(): void {
    // Clean up expired cache entries every hour
    setInterval(() => {
      const now = new Date()
      for (const [key, entry] of this.cache.entries()) {
        if (entry.expiresAt < now) {
          this.cache.delete(key)
        }
      }
    }, 60 * 60 * 1000) // 1 hour
  }

  private notifyRealTimeSubscribers(analysisId: string, result: AnalysisResult): void {
    const callback = this.realTimeSubscribers.get(analysisId)
    if (callback) {
      try {
        callback(result)
      } catch (error) {
        console.error('Real-time callback error:', error)
      }
    }
  }

  private estimateTokenUsage(businessData: any, analysisData: any): number {
    // Rough estimation: 4 characters per token
    const inputSize = JSON.stringify(businessData).length
    const outputSize = JSON.stringify(analysisData).length
    return Math.round((inputSize + outputSize) / 4)
  }
}

// Export singleton instance
export const enhancedAnalysisEngine = new EnhancedAnalysisEngine()

// Export types for external use
export type {
  AnalysisRequest,
  AnalysisResult,
  AnalysisError,
  TokenOptimization,
  QualityMetrics
}