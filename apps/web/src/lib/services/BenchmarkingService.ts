import { PrismaClient } from '@prisma/client'
import { PremiumAccessService } from './PremiumAccessService'
import { AnalyticsService } from './AnalyticsService'

const prisma = new PrismaClient()

export interface IndustryBenchmark {
  id: string
  industryCode: string
  industryName: string
  benchmarkType: 'health_score' | 'valuation' | 'growth' | 'risk'
  metric: string
  percentile25: number
  percentile50: number // median
  percentile75: number
  average: number
  sampleSize: number
  lastUpdated: Date
  confidenceLevel: number
}

export interface PeerComparison {
  userId: string
  peerGroupId: string
  businessCharacteristics: {
    industry: string
    revenueRange: string
    employeeRange: string
    region?: string
  }
  optedIntoSharing: boolean
  anonymizedId: string
  lastComparisonUpdate: Date
}

export interface CompetitivePosition {
  userId: string
  industryRanking: {
    healthScore: number // percentile
    valuation: number
    growth: number
    risk: number
  }
  strengths: string[]
  weaknesses: string[]
  opportunities: string[]
  threats: string[]
  competitiveAdvantages: string[]
  improvementAreas: string[]
}

export interface BenchmarkComparison {
  userMetric: number
  industryBenchmark: IndustryBenchmark
  percentileRanking: number
  performanceLevel: 'top_quartile' | 'above_average' | 'below_average' | 'bottom_quartile'
  gapAnalysis: {
    differenceFromMedian: number
    differenceFromTop25: number
    improvementPotential: number
  }
}

export interface MarketTrendData {
  industryCode: string
  trendIndicators: {
    growthRate: number
    marketSize: number
    competitionLevel: 'low' | 'medium' | 'high'
    marketMaturity: 'emerging' | 'growth' | 'mature' | 'declining'
  }
  economicContext: {
    gdpGrowth: number
    inflationRate: number
    marketSentiment: 'positive' | 'neutral' | 'negative'
  }
  lastUpdated: Date
}

export class BenchmarkingService {
  /**
   * Get industry benchmarks for a specific industry
   */
  static async getIndustryBenchmarks(
    industryCode: string,
    userId: string
  ): Promise<IndustryBenchmark[]> {
    try {
      // Check premium access
      const accessCheck = await PremiumAccessService.checkAIFeatureAccess(userId)
      if (!accessCheck.hasAccess) {
        throw new Error('Premium subscription required for industry benchmarking')
      }

      // Mock industry benchmarks - in production would aggregate real user data
      const mockBenchmarks: IndustryBenchmark[] = [
        {
          id: 'bench_health_tech',
          industryCode,
          industryName: this.getIndustryName(industryCode),
          benchmarkType: 'health_score',
          metric: 'Overall Business Health Score',
          percentile25: 65,
          percentile50: 75,
          percentile75: 85,
          average: 74.2,
          sampleSize: 247,
          lastUpdated: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7), // 7 days ago
          confidenceLevel: 0.95
        },
        {
          id: 'bench_val_tech',
          industryCode,
          industryName: this.getIndustryName(industryCode),
          benchmarkType: 'valuation',
          metric: 'Business Valuation Multiple',
          percentile25: 2.8,
          percentile50: 4.2,
          percentile75: 6.5,
          average: 4.8,
          sampleSize: 189,
          lastUpdated: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7),
          confidenceLevel: 0.92
        },
        {
          id: 'bench_growth_tech',
          industryCode,
          industryName: this.getIndustryName(industryCode),
          benchmarkType: 'growth',
          metric: 'Revenue Growth Rate (%)',
          percentile25: 8.5,
          percentile50: 15.2,
          percentile75: 28.7,
          average: 18.9,
          sampleSize: 203,
          lastUpdated: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7),
          confidenceLevel: 0.94
        },
        {
          id: 'bench_risk_tech',
          industryCode,
          industryName: this.getIndustryName(industryCode),
          benchmarkType: 'risk',
          metric: 'Risk Assessment Score',
          percentile25: 2.1,
          percentile50: 3.2,
          percentile75: 4.8,
          average: 3.4,
          sampleSize: 176,
          lastUpdated: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7),
          confidenceLevel: 0.89
        }
      ]

      return mockBenchmarks
    } catch (error) {
      console.error('Error getting industry benchmarks:', error)
      throw error
    }
  }

  /**
   * Compare user metrics against industry benchmarks
   */
  static async compareWithBenchmarks(
    userId: string,
    industryCode: string
  ): Promise<BenchmarkComparison[]> {
    try {
      // Get user's latest evaluation data
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          evaluations: {
            orderBy: { createdAt: 'desc' },
            take: 1
          }
        }
      })

      if (!user || user.evaluations.length === 0) {
        throw new Error('No evaluation data available for comparison')
      }

      const latestEvaluation = user.evaluations[0]
      const benchmarks = await this.getIndustryBenchmarks(industryCode, userId)

      const comparisons: BenchmarkComparison[] = []

      for (const benchmark of benchmarks) {
        let userMetric: number

        // Extract relevant user metric
        switch (benchmark.benchmarkType) {
          case 'health_score':
            userMetric = latestEvaluation.healthScore || 0
            break
          case 'valuation':
            userMetric = this.extractValuationMultiple(latestEvaluation)
            break
          case 'growth':
            userMetric = this.calculateGrowthRate(user.evaluations)
            break
          case 'risk':
            userMetric = this.calculateRiskScore(latestEvaluation)
            break
          default:
            continue
        }

        const percentileRanking = this.calculatePercentile(
          userMetric,
          benchmark.percentile25,
          benchmark.percentile50,
          benchmark.percentile75
        )

        const performanceLevel = this.getPerformanceLevel(percentileRanking)

        const gapAnalysis = {
          differenceFromMedian: userMetric - benchmark.percentile50,
          differenceFromTop25: userMetric - benchmark.percentile75,
          improvementPotential: Math.max(0, benchmark.percentile75 - userMetric)
        }

        comparisons.push({
          userMetric,
          industryBenchmark: benchmark,
          percentileRanking,
          performanceLevel,
          gapAnalysis
        })
      }

      return comparisons
    } catch (error) {
      console.error('Error comparing with benchmarks:', error)
      throw error
    }
  }

  /**
   * Get competitive position analysis
   */
  static async getCompetitivePosition(
    userId: string,
    industryCode: string
  ): Promise<CompetitivePosition> {
    try {
      const comparisons = await this.compareWithBenchmarks(userId, industryCode)
      
      const industryRanking = {
        healthScore: comparisons.find(c => c.industryBenchmark.benchmarkType === 'health_score')?.percentileRanking || 50,
        valuation: comparisons.find(c => c.industryBenchmark.benchmarkType === 'valuation')?.percentileRanking || 50,
        growth: comparisons.find(c => c.industryBenchmark.benchmarkType === 'growth')?.percentileRanking || 50,
        risk: 100 - (comparisons.find(c => c.industryBenchmark.benchmarkType === 'risk')?.percentileRanking || 50)
      }

      // Generate SWOT analysis based on benchmarks
      const strengths = this.identifyStrengths(comparisons)
      const weaknesses = this.identifyWeaknesses(comparisons)
      const opportunities = this.identifyOpportunities(comparisons, industryCode)
      const threats = this.identifyThreats(comparisons, industryCode)

      const competitiveAdvantages = strengths.filter(s => 
        comparisons.some(c => c.performanceLevel === 'top_quartile')
      )

      const improvementAreas = weaknesses.concat(
        comparisons
          .filter(c => c.performanceLevel === 'bottom_quartile')
          .map(c => `Improve ${c.industryBenchmark.metric}`)
      )

      return {
        userId,
        industryRanking,
        strengths,
        weaknesses,
        opportunities,
        threats,
        competitiveAdvantages,
        improvementAreas
      }
    } catch (error) {
      console.error('Error getting competitive position:', error)
      throw error
    }
  }

  /**
   * Get peer group comparison data
   */
  static async getPeerGroupComparison(userId: string): Promise<{
    userOptedIn: boolean
    peerGroup: {
      id: string
      characteristics: any
      memberCount: number
      averageMetrics: any
    } | null
    comparison: any | null
  }> {
    try {
      // Mock peer comparison data - in production would match real peers
      return {
        userOptedIn: true,
        peerGroup: {
          id: 'peer_tech_small',
          characteristics: {
            industry: 'Technology',
            revenueRange: '$1M-$5M',
            employeeRange: '10-50',
            region: 'North America'
          },
          memberCount: 47,
          averageMetrics: {
            healthScore: 78.3,
            valuationMultiple: 4.6,
            growthRate: 22.1
          }
        },
        comparison: {
          healthScore: { user: 82, peer: 78.3, percentile: 72 },
          valuation: { user: 3.8, peer: 4.6, percentile: 38 },
          growth: { user: 19.5, peer: 22.1, percentile: 43 }
        }
      }
    } catch (error) {
      console.error('Error getting peer group comparison:', error)
      throw error
    }
  }

  /**
   * Get market trend data for industry
   */
  static async getMarketTrends(industryCode: string): Promise<MarketTrendData> {
    try {
      // Mock market trend data - in production would integrate with market data APIs
      return {
        industryCode,
        trendIndicators: {
          growthRate: 12.8,
          marketSize: 2.4e12, // $2.4 trillion
          competitionLevel: 'high',
          marketMaturity: 'growth'
        },
        economicContext: {
          gdpGrowth: 2.3,
          inflationRate: 3.1,
          marketSentiment: 'positive'
        },
        lastUpdated: new Date()
      }
    } catch (error) {
      console.error('Error getting market trends:', error)
      throw error
    }
  }

  /**
   * Opt user into peer comparison data sharing
   */
  static async optIntoPeerSharing(
    userId: string,
    consent: boolean
  ): Promise<{ success: boolean; anonymizedId?: string }> {
    try {
      if (consent) {
        const anonymizedId = `anon_${Buffer.from(userId).toString('base64').slice(0, 8)}_${Date.now()}`
        
        // In production, would store consent and create anonymized profile
        return {
          success: true,
          anonymizedId
        }
      } else {
        // Remove user from peer sharing
        return { success: true }
      }
    } catch (error) {
      console.error('Error updating peer sharing consent:', error)
      throw error
    }
  }

  /**
   * Generate AI insights based on benchmark comparison
   */
  static async generateBenchmarkInsights(
    userId: string,
    industryCode: string
  ): Promise<{
    insights: string[]
    recommendations: string[]
    priorityActions: string[]
  }> {
    try {
      const position = await this.getCompetitivePosition(userId, industryCode)
      const comparisons = await this.compareWithBenchmarks(userId, industryCode)

      const insights = []
      const recommendations = []
      const priorityActions = []

      // Generate insights based on performance
      const topQuartileMetrics = comparisons.filter(c => c.performanceLevel === 'top_quartile')
      const bottomQuartileMetrics = comparisons.filter(c => c.performanceLevel === 'bottom_quartile')

      if (topQuartileMetrics.length > 0) {
        insights.push(`You're performing in the top quartile for ${topQuartileMetrics.map(m => m.industryBenchmark.metric.toLowerCase()).join(', ')}`)
      }

      if (bottomQuartileMetrics.length > 0) {
        insights.push(`Focus needed on ${bottomQuartileMetrics.map(m => m.industryBenchmark.metric.toLowerCase()).join(', ')} to reach industry standards`)
        
        bottomQuartileMetrics.forEach(metric => {
          recommendations.push(`Improve ${metric.industryBenchmark.metric} by ${metric.gapAnalysis.improvementPotential.toFixed(1)} to reach top quartile`)
          priorityActions.push(`Develop action plan for ${metric.industryBenchmark.metric} improvement`)
        })
      }

      // Add general insights
      if (position.industryRanking.healthScore > 75) {
        insights.push('Your overall business health is above industry average, positioning you well for growth')
      }

      if (position.industryRanking.growth < 25) {
        recommendations.push('Consider growth acceleration strategies to match industry growth rates')
        priorityActions.push('Review and optimize your growth strategy')
      }

      return {
        insights: insights.length > 0 ? insights : ['Your business shows competitive potential in key areas'],
        recommendations: recommendations.length > 0 ? recommendations : ['Continue monitoring performance against industry benchmarks'],
        priorityActions: priorityActions.length > 0 ? priorityActions : ['Regular benchmark reviews to maintain competitive position']
      }
    } catch (error) {
      console.error('Error generating benchmark insights:', error)
      throw error
    }
  }

  /**
   * Private helper methods
   */

  private static getIndustryName(code: string): string {
    const industries: Record<string, string> = {
      'tech': 'Technology',
      'healthcare': 'Healthcare',
      'finance': 'Financial Services',
      'retail': 'Retail',
      'manufacturing': 'Manufacturing',
      'services': 'Professional Services'
    }
    return industries[code] || 'General Business'
  }

  private static extractValuationMultiple(evaluation: any): number {
    const valuation = evaluation.valuations?.weighted?.value || evaluation.valuations?.businessValue || 500000
    const revenue = evaluation.businessData?.annualRevenue || 100000
    return revenue > 0 ? valuation / revenue : 5.0
  }

  private static calculateGrowthRate(evaluations: any[]): number {
    if (evaluations.length < 2) return 15.0 // Default growth rate
    
    // Mock calculation - in production would calculate from historical data
    return 18.5
  }

  private static calculateRiskScore(evaluation: any): number {
    // Mock risk calculation based on health score
    const healthScore = evaluation.healthScore || 75
    return Math.max(1, 5 - (healthScore / 20))
  }

  private static calculatePercentile(value: number, p25: number, p50: number, p75: number): number {
    if (value <= p25) return (value / p25) * 25
    if (value <= p50) return 25 + ((value - p25) / (p50 - p25)) * 25
    if (value <= p75) return 50 + ((value - p50) / (p75 - p50)) * 25
    return Math.min(100, 75 + ((value - p75) / (p75 * 0.5)) * 25)
  }

  private static getPerformanceLevel(percentile: number): 'top_quartile' | 'above_average' | 'below_average' | 'bottom_quartile' {
    if (percentile >= 75) return 'top_quartile'
    if (percentile >= 50) return 'above_average'
    if (percentile >= 25) return 'below_average'
    return 'bottom_quartile'
  }

  private static identifyStrengths(comparisons: BenchmarkComparison[]): string[] {
    return comparisons
      .filter(c => c.performanceLevel === 'top_quartile' || c.performanceLevel === 'above_average')
      .map(c => `Strong ${c.industryBenchmark.metric} performance`)
  }

  private static identifyWeaknesses(comparisons: BenchmarkComparison[]): string[] {
    return comparisons
      .filter(c => c.performanceLevel === 'bottom_quartile' || c.performanceLevel === 'below_average')
      .map(c => `Below-average ${c.industryBenchmark.metric}`)
  }

  private static identifyOpportunities(comparisons: BenchmarkComparison[], industryCode: string): string[] {
    const opportunities = []
    
    const weakAreas = comparisons.filter(c => c.performanceLevel === 'bottom_quartile')
    if (weakAreas.length > 0) {
      opportunities.push('Significant improvement potential in underperforming areas')
    }

    opportunities.push('Market growth opportunities in expanding industry')
    opportunities.push('Leverage top-quartile strengths for competitive advantage')

    return opportunities
  }

  private static identifyThreats(comparisons: BenchmarkComparison[], industryCode: string): string[] {
    const threats = []

    if (comparisons.some(c => c.performanceLevel === 'bottom_quartile')) {
      threats.push('Competitive disadvantage in key performance areas')
    }

    threats.push('Increasing industry competition and market saturation')
    threats.push('Economic factors affecting industry performance')

    return threats
  }
}