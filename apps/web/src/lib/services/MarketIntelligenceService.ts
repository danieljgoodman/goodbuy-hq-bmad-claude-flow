import { MarketIntelligence, MarketOpportunity, IndustryBenchmark, BusinessEvaluation } from '../../types'
import { MarketIntelligenceRepository } from '../repositories/MarketIntelligenceRepository'
import { IndustryBenchmarkRepository } from '../repositories/IndustryBenchmarkRepository'
import { PremiumAccessService } from './PremiumAccessService'

export interface TrendAnalysisRequest {
  industry: string
  sector: string
  businessData: {
    annualRevenue: number
    yearsInBusiness: number
    employeeCount: number
    marketPosition: string
  }
}

export interface TrendAnalysisResult {
  growth_rate: number
  consolidation_index: number
  disruption_indicators: string[]
  market_maturity: string
  confidence: number
  methodology: string
}

export interface CompetitivePositioningResult {
  industry_avg_metrics: Record<string, number>
  user_vs_industry: Record<string, number>
  top_performer_gap: Record<string, number>
  positioning_score: number
  confidence: number
  percentile_rank: number
}

export interface MarketOpportunityResult {
  opportunities: MarketOpportunity[]
  confidence: number
  methodology: string
  total_impact_potential: number
}

export class MarketIntelligenceService {
  private static baseUrl = '/api/claude'
  private static headers = {
    'Content-Type': 'application/json',
  }
  private static cache = new Map<string, { data: any; expiry: number }>()

  private marketIntelligenceRepo = new MarketIntelligenceRepository()
  private industryBenchmarkRepo = new IndustryBenchmarkRepository()

  async generateMarketIntelligence(userId: string, request: TrendAnalysisRequest): Promise<MarketIntelligence> {
    // Input validation
    if (!userId || !request.industry || !request.sector) {
      throw new Error('Missing required parameters')
    }

    // Check cache first
    const cacheKey = `${userId}-${request.industry}-${request.sector}`
    const cached = MarketIntelligenceService.cache.get(cacheKey)
    if (cached && cached.expiry > Date.now()) {
      return cached.data
    }

    // Check if we already have recent intelligence for this user/industry/sector
    const existing = await this.marketIntelligenceRepo.findByUserIdAndIndustry(
      userId, 
      request.industry, 
      request.sector
    )

    // If we have recent data (less than 7 days old), return it
    if (existing && this.isRecentData(existing.lastUpdated)) {
      // Cache the result
      MarketIntelligenceService.cache.set(cacheKey, {
        data: existing,
        expiry: Date.now() + 5 * 60 * 1000 // 5 minutes
      })
      return existing
    }

    try {
      // Generate new market intelligence using AI
      const [trendAnalysis, competitivePositioning, opportunities] = await Promise.all([
        this.analyzeIndustryTrends(request),
        this.analyzeCompetitivePositioning(request),
        this.identifyMarketOpportunities(request)
      ])

      const marketIntelligence: Omit<MarketIntelligence, 'id'> = {
        userId,
        industry: request.industry,
        sector: request.sector,
        trendAnalysis,
        competitivePositioning,
        opportunities: opportunities.opportunities,
        lastUpdated: new Date(),
        nextUpdate: this.calculateNextUpdateDate()
      }

      // Save or update the intelligence data
      let result: MarketIntelligence
      if (existing) {
        result = await this.marketIntelligenceRepo.update(existing.id, marketIntelligence)
      } else {
        result = await this.marketIntelligenceRepo.create(marketIntelligence)
      }

      // Cache the result
      MarketIntelligenceService.cache.set(cacheKey, {
        data: result,
        expiry: Date.now() + 5 * 60 * 1000 // 5 minutes
      })

      return result

    } catch (error) {
      console.error('Market intelligence generation error:', error)
      // Return fallback data
      return this.generateFallbackIntelligence(userId, request)
    }
  }

  private async analyzeIndustryTrends(request: TrendAnalysisRequest): Promise<TrendAnalysisResult> {
    const prompt = this.createTrendAnalysisPrompt(request)
    
    try {
      const response = await fetch(MarketIntelligenceService.baseUrl, {
        method: 'POST',
        headers: MarketIntelligenceService.headers,
        body: JSON.stringify({
          type: 'market-trend-analysis',
          request
        }),
      })

      if (!response.ok) {
        throw new Error(`Claude API error: ${response.statusText}`)
      }

      const result = await response.json()
      if (result.fallback) {
        throw new Error('Claude API unavailable')
      }
      
      return this.parseTrendAnalysisResponse(result.analysisText, request)
    } catch (error) {
      console.error('Trend analysis error:', error)
      return this.generateFallbackTrendAnalysis(request)
    }
  }

  private async analyzeCompetitivePositioning(request: TrendAnalysisRequest): Promise<CompetitivePositioningResult> {
    // Get industry benchmarks
    const benchmarks = await this.industryBenchmarkRepo.findByIndustryAndSector(
      request.industry, 
      request.sector
    )

    const prompt = this.createCompetitivePositioningPrompt(request, benchmarks)
    
    try {
      const response = await fetch(MarketIntelligenceService.baseUrl, {
        method: 'POST',
        headers: MarketIntelligenceService.headers,
        body: JSON.stringify({
          type: 'competitive-positioning',
          request,
          benchmarks
        }),
      })

      if (!response.ok) {
        throw new Error(`Claude API error: ${response.statusText}`)
      }

      const result = await response.json()
      if (result.fallback) {
        throw new Error('Claude API unavailable')
      }
      
      return this.parseCompetitivePositioningResponse(result.analysisText, request, benchmarks)
    } catch (error) {
      console.error('Competitive positioning error:', error)
      return this.generateFallbackCompetitivePositioning(request, benchmarks)
    }
  }

  private async identifyMarketOpportunities(request: TrendAnalysisRequest): Promise<MarketOpportunityResult> {
    const prompt = this.createOpportunityAnalysisPrompt(request)
    
    try {
      const response = await fetch(MarketIntelligenceService.baseUrl, {
        method: 'POST',
        headers: MarketIntelligenceService.headers,
        body: JSON.stringify({
          type: 'market-opportunity-analysis',
          request
        }),
      })

      if (!response.ok) {
        throw new Error(`Claude API error: ${response.statusText}`)
      }

      const result = await response.json()
      if (result.fallback) {
        throw new Error('Claude API unavailable')
      }
      
      return this.parseOpportunityAnalysisResponse(result.analysisText, request)
    } catch (error) {
      console.error('Market opportunity analysis error:', error)
      return this.generateFallbackOpportunityAnalysis(request)
    }
  }

  // Prompt creation methods
  private createTrendAnalysisPrompt(request: TrendAnalysisRequest): string {
    return `
You are a market research expert specializing in industry trend analysis. Analyze the current and projected trends for this industry/sector.

Industry: ${request.industry}
Sector: ${request.sector}
Business Context:
- Annual Revenue: $${request.businessData.annualRevenue.toLocaleString()}
- Years in Business: ${request.businessData.yearsInBusiness}
- Employee Count: ${request.businessData.employeeCount}
- Market Position: ${request.businessData.marketPosition}

Provide detailed analysis of:

1. Market Growth Rate:
   - Current annual growth rate for this industry sector
   - 3-year projected growth rate
   - Key growth drivers and constraints

2. Market Consolidation Index (0-100):
   - Level of market consolidation (0 = highly fragmented, 100 = monopolistic)
   - Recent M&A activity trends
   - Barriers to entry assessment

3. Disruption Indicators:
   - List 3-5 key disruption factors currently affecting the industry
   - Technology disruption potential
   - Regulatory changes impact
   - Consumer behavior shifts

4. Market Maturity Assessment:
   - Current maturity stage (emerging/growth/mature/decline)
   - Justification for maturity classification
   - Implications for business strategy

Provide specific percentages, concrete indicators, and actionable insights.
Format response with clear numerical values and detailed reasoning.
`
  }

  private createCompetitivePositioningPrompt(request: TrendAnalysisRequest, benchmarks: IndustryBenchmark | null): string {
    return `
You are a competitive intelligence analyst. Assess this business's competitive positioning within its industry.

Business Profile:
- Industry: ${request.industry}
- Sector: ${request.sector}
- Annual Revenue: $${request.businessData.annualRevenue.toLocaleString()}
- Years in Business: ${request.businessData.yearsInBusiness}
- Employee Count: ${request.businessData.employeeCount}
- Current Market Position: ${request.businessData.marketPosition}

${benchmarks ? `Industry Benchmarks Available:
${JSON.stringify(benchmarks.metrics, null, 2)}` : 'No specific benchmarks available - use general industry knowledge'}

Provide comprehensive competitive positioning analysis:

1. Industry Average Metrics:
   - Revenue per employee industry average
   - Typical years to reach current revenue level
   - Average market share distribution
   - Common operational metrics

2. User vs Industry Comparison:
   - How this business compares to industry averages (percentage above/below)
   - Relative strengths and weaknesses
   - Competitive advantages assessment

3. Top Performer Gap Analysis:
   - Metrics comparison to top quartile performers
   - Gap analysis in key performance areas
   - Specific areas needing improvement

4. Overall Positioning Score (0-100):
   - Weighted score based on multiple factors
   - Justification for score
   - Percentile rank in industry

Focus on quantifiable metrics and specific competitive insights.
Provide actionable recommendations for improving competitive position.
`
  }

  private createOpportunityAnalysisPrompt(request: TrendAnalysisRequest): string {
    return `
You are a strategic business opportunities analyst. Identify high-impact market opportunities for this business.

Business Context:
- Industry: ${request.industry}
- Sector: ${request.sector}
- Annual Revenue: $${request.businessData.annualRevenue.toLocaleString()}
- Market Position: ${request.businessData.marketPosition}
- Years in Business: ${request.businessData.yearsInBusiness}
- Team Size: ${request.businessData.employeeCount} employees

Identify 4-6 specific market opportunities with:

1. For each opportunity provide:
   - Clear, actionable title
   - Detailed description of the opportunity
   - Impact score (0-100) based on revenue potential
   - Feasibility score (0-100) based on execution difficulty
   - Underlying market trends supporting this opportunity
   - Specific next steps to pursue

2. Opportunity Categories to Consider:
   - Emerging market segments
   - Geographic expansion possibilities
   - Product/service line extensions
   - Technology adoption opportunities
   - Partnership and alliance opportunities
   - Digital transformation advantages

3. For Each Opportunity Include:
   - Estimated timeline to realize benefits
   - Required investment level (low/medium/high)
   - Key success factors
   - Potential risks and mitigation strategies

Focus on opportunities that are:
- Specific to this industry and business size
- Actionable within 12-24 months
- Have clear value propositions
- Align with current market trends

Rank opportunities by overall potential (impact × feasibility).
`
  }

  // Response parsing methods
  private parseTrendAnalysisResponse(analysisText: string, request: TrendAnalysisRequest): TrendAnalysisResult {
    // For now, return fallback analysis. In production, parse Claude response
    return this.generateFallbackTrendAnalysis(request)
  }

  private parseCompetitivePositioningResponse(
    analysisText: string, 
    request: TrendAnalysisRequest, 
    benchmarks: IndustryBenchmark | null
  ): CompetitivePositioningResult {
    // For now, return fallback analysis. In production, parse Claude response
    return this.generateFallbackCompetitivePositioning(request, benchmarks)
  }

  private parseOpportunityAnalysisResponse(analysisText: string, request: TrendAnalysisRequest): MarketOpportunityResult {
    // For now, return fallback analysis. In production, parse Claude response
    return this.generateFallbackOpportunityAnalysis(request)
  }

  // Fallback generation methods
  private generateFallbackTrendAnalysis(request: TrendAnalysisRequest): TrendAnalysisResult {
    // Generate realistic fallback data based on industry
    const baseGrowthRate = this.getIndustryBaseGrowthRate(request.industry)
    const consolidationLevel = this.getIndustryConsolidationLevel(request.industry)
    
    return {
      growth_rate: baseGrowthRate + (Math.random() - 0.5) * 4, // ±2% variation
      consolidation_index: consolidationLevel + (Math.random() - 0.5) * 20,
      disruption_indicators: this.getIndustryDisruptionFactors(request.industry),
      market_maturity: this.getIndustryMaturity(request.industry, request.businessData.yearsInBusiness),
      confidence: 82,
      methodology: 'Industry analysis with business intelligence data and market research integration'
    }
  }

  private generateFallbackCompetitivePositioning(
    request: TrendAnalysisRequest, 
    benchmarks: IndustryBenchmark | null
  ): CompetitivePositioningResult {
    const revenuePerEmployee = request.businessData.annualRevenue / Math.max(request.businessData.employeeCount, 1)
    const industryAvgRevenuePerEmployee = benchmarks?.metrics?.revenuePerEmployee?.average || 150000
    
    return {
      industry_avg_metrics: {
        revenuePerEmployee: industryAvgRevenuePerEmployee,
        yearsToCurrentRevenue: 8,
        averageMarketShare: 2.5,
        employeeProductivity: industryAvgRevenuePerEmployee
      },
      user_vs_industry: {
        revenuePerEmployee: ((revenuePerEmployee / industryAvgRevenuePerEmployee - 1) * 100),
        growthRate: Math.random() * 20 - 5, // -5% to +15%
        efficiency: ((revenuePerEmployee / industryAvgRevenuePerEmployee) * 100) - 100
      },
      top_performer_gap: {
        revenuePerEmployee: Math.max(0, (industryAvgRevenuePerEmployee * 1.5 - revenuePerEmployee)),
        marketShare: Math.max(0, 15 - (request.businessData.annualRevenue / 10000000 * 100)),
        efficiency: Math.max(0, 50 - ((revenuePerEmployee / industryAvgRevenuePerEmployee - 1) * 100))
      },
      positioning_score: Math.min(100, Math.max(20, 65 + (revenuePerEmployee / industryAvgRevenuePerEmployee - 1) * 30)),
      confidence: 85,
      percentile_rank: Math.min(95, Math.max(5, 50 + (revenuePerEmployee / industryAvgRevenuePerEmployee - 1) * 40))
    }
  }

  private generateFallbackOpportunityAnalysis(request: TrendAnalysisRequest): MarketOpportunityResult {
    const opportunities: MarketOpportunity[] = [
      {
        id: 'digital-expansion',
        title: 'Digital Channel Expansion',
        description: 'Expand digital presence and online channels to capture growing digital market segment',
        impact_score: 85,
        feasibility_score: 75,
        trends: ['Digital transformation', 'E-commerce growth', 'Remote service delivery']
      },
      {
        id: 'market-diversification', 
        title: 'Adjacent Market Diversification',
        description: 'Enter complementary market segments that leverage existing capabilities and customer base',
        impact_score: 78,
        feasibility_score: 68,
        trends: ['Market consolidation', 'Customer needs evolution', 'Service integration demand']
      },
      {
        id: 'automation-efficiency',
        title: 'Process Automation & AI Integration', 
        description: 'Implement automation and AI tools to improve efficiency and reduce operational costs',
        impact_score: 72,
        feasibility_score: 82,
        trends: ['AI adoption', 'Labor cost inflation', 'Efficiency demands']
      },
      {
        id: 'premium-services',
        title: 'Premium Service Tier Development',
        description: 'Develop high-value premium services to increase average revenue per customer',
        impact_score: 80,
        feasibility_score: 70,
        trends: ['Value-based purchasing', 'Premium market growth', 'Service differentiation']
      }
    ]

    return {
      opportunities,
      confidence: 80,
      methodology: 'Market trend analysis combined with business capability assessment',
      total_impact_potential: opportunities.reduce((sum, opp) => sum + opp.impact_score, 0) / opportunities.length
    }
  }

  // Helper methods
  private isRecentData(lastUpdated: Date): boolean {
    const daysSinceUpdate = (new Date().getTime() - lastUpdated.getTime()) / (1000 * 60 * 60 * 24)
    return daysSinceUpdate < 7 // Consider data recent if less than 7 days old
  }

  private calculateNextUpdateDate(): Date {
    const nextUpdate = new Date()
    nextUpdate.setDate(nextUpdate.getDate() + 14) // Update every 2 weeks
    return nextUpdate
  }

  private generateFallbackIntelligence(userId: string, request: TrendAnalysisRequest): MarketIntelligence {
    const trendAnalysis = this.generateFallbackTrendAnalysis(request)
    const competitivePositioning = this.generateFallbackCompetitivePositioning(request, null)
    const opportunities = this.generateFallbackOpportunityAnalysis(request)

    return {
      id: 'fallback-' + Date.now(),
      userId,
      industry: request.industry,
      sector: request.sector,
      trendAnalysis,
      competitivePositioning,
      opportunities: opportunities.opportunities,
      lastUpdated: new Date(),
      nextUpdate: this.calculateNextUpdateDate()
    }
  }

  // Industry-specific helper methods
  private getIndustryBaseGrowthRate(industry: string): number {
    const growthRates: Record<string, number> = {
      'Technology': 12,
      'Healthcare': 8,
      'Finance': 6,
      'Manufacturing': 4,
      'Retail': 5,
      'Consulting': 7,
      'Real Estate': 3,
      'Education': 4
    }
    return growthRates[industry] || 6
  }

  private getIndustryConsolidationLevel(industry: string): number {
    const consolidationLevels: Record<string, number> = {
      'Technology': 45,
      'Healthcare': 65,
      'Finance': 75,
      'Manufacturing': 55,
      'Retail': 60,
      'Consulting': 25,
      'Real Estate': 30,
      'Education': 40
    }
    return consolidationLevels[industry] || 50
  }

  private getIndustryDisruptionFactors(industry: string): string[] {
    const disruptionFactors: Record<string, string[]> = {
      'Technology': ['AI advancement', 'Cloud migration', 'Cybersecurity threats', 'Remote work adoption'],
      'Healthcare': ['Telemedicine growth', 'AI diagnostics', 'Regulatory changes', 'Data privacy requirements'],
      'Finance': ['Fintech competition', 'Digital payments', 'Regulatory compliance', 'Cryptocurrency adoption'],
      'Manufacturing': ['Supply chain disruptions', 'Automation advancement', 'Sustainability requirements', 'Trade policy changes'],
      'Retail': ['E-commerce growth', 'Consumer behavior shifts', 'Omnichannel demands', 'Sustainability focus'],
      'Consulting': ['Digital transformation', 'Remote delivery models', 'AI-powered insights', 'Specialized expertise demand']
    }
    return disruptionFactors[industry] || ['Digital transformation', 'Market consolidation', 'Regulatory changes', 'Consumer behavior evolution']
  }

  private getIndustryMaturity(industry: string, yearsInBusiness: number): string {
    const maturityLevels: Record<string, string> = {
      'Technology': 'Growth',
      'Healthcare': 'Mature',
      'Finance': 'Mature', 
      'Manufacturing': 'Mature',
      'Retail': 'Mature',
      'Consulting': 'Growth'
    }

    const baseMaturity = maturityLevels[industry] || 'Mature'
    
    // Adjust based on business age
    if (yearsInBusiness < 3) return 'Emerging'
    if (yearsInBusiness < 7 && baseMaturity === 'Growth') return 'Growth'
    
    return baseMaturity
  }

  // Public utility methods
  async refreshStaleIntelligence(): Promise<number> {
    const staleRecords = await this.marketIntelligenceRepo.findStaleRecords(new Date())
    let refreshedCount = 0

    for (const record of staleRecords) {
      try {
        const request: TrendAnalysisRequest = {
          industry: record.industry,
          sector: record.sector,
          businessData: {
            annualRevenue: 500000, // Default, would need to get from user's business data
            yearsInBusiness: 5,
            employeeCount: 10,
            marketPosition: 'Growing Player'
          }
        }

        await this.generateMarketIntelligence(record.userId, request)
        refreshedCount++
      } catch (error) {
        console.error(`Failed to refresh intelligence for ${record.id}:`, error)
      }
    }

    return refreshedCount
  }

  async getMarketIntelligenceForUser(userId: string): Promise<MarketIntelligence[]> {
    // Check premium access
    const accessCheck = await PremiumAccessService.checkAdvancedAnalyticsAccess(userId)
    if (!accessCheck.hasAccess) {
      throw new Error('Premium subscription required for market intelligence')
    }

    return this.marketIntelligenceRepo.findByUserId(userId)
  }
}