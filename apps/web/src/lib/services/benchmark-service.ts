import type { IndustryBenchmark } from '@/types/health-analysis'
import type { BusinessData } from '@/types/evaluation'

export class BenchmarkingService {
  private businessData: BusinessData

  constructor(businessData: BusinessData) {
    this.businessData = businessData
  }

  async getIndustryBenchmarks(): Promise<IndustryBenchmark[]> {
    // In a real implementation, this would fetch from external APIs
    // For now, we'll provide comprehensive mock data based on industry standards
    
    const companySize = this.determineCompanySize()
    const industry = this.normalizeIndustry(this.businessData.industryFocus)
    
    return [
      await this.getPrimaryIndustryBenchmark(industry, companySize),
      await this.getGeneralBusinessBenchmark(companySize),
      await this.getSectorSpecificBenchmark(industry, companySize)
    ]
  }

  async getBenchmarkComparison(dimension: string, score: number): Promise<{
    percentile: number
    quartile: number
    industryAverage: number
    interpretation: string
  }> {
    const benchmarks = await this.getIndustryBenchmarks()
    const primaryBenchmark = benchmarks[0]
    
    const dimensionMetrics = primaryBenchmark.metrics[dimension]
    if (!dimensionMetrics) {
      return {
        percentile: 50,
        quartile: 2,
        industryAverage: 65,
        interpretation: 'Industry benchmark data not available for this dimension'
      }
    }

    const percentile = this.calculatePercentile(score, dimensionMetrics.percentiles)
    const quartile = this.determineQuartile(percentile)
    
    return {
      percentile,
      quartile,
      industryAverage: dimensionMetrics.average,
      interpretation: this.generateInterpretation(percentile, score, dimensionMetrics.average)
    }
  }

  async getDetailedBenchmarkAnalysis(healthScore: any): Promise<{
    overallRanking: number
    dimensionRankings: { [dimension: string]: number }
    peerComparison: string
    improvementOpportunities: string[]
    competitiveStrengths: string[]
  }> {
    const benchmarks = await this.getIndustryBenchmarks()
    const primaryBenchmark = benchmarks[0]

    const overallRanking = this.calculatePercentile(
      healthScore.overallScore, 
      primaryBenchmark.metrics.overall_health?.percentiles || { 50: 65 }
    )

    const dimensionRankings: { [dimension: string]: number } = {}
    Object.entries(healthScore.dimensions).forEach(([dim, data]: [string, any]) => {
      const dimMetrics = primaryBenchmark.metrics[`${dim}_health`]
      if (dimMetrics) {
        dimensionRankings[dim] = this.calculatePercentile(data.score, dimMetrics.percentiles)
      }
    })

    return {
      overallRanking,
      dimensionRankings,
      peerComparison: this.generatePeerComparison(overallRanking, healthScore.overallScore),
      improvementOpportunities: this.identifyImprovementOpportunities(dimensionRankings),
      competitiveStrengths: this.identifyCompetitiveStrengths(dimensionRankings)
    }
  }

  private async getPrimaryIndustryBenchmark(industry: string, companySize: string): Promise<IndustryBenchmark> {
    const benchmarkData = this.getIndustrySpecificData(industry, companySize)
    
    return {
      id: `benchmark-${industry}-${companySize}`,
      industry,
      sector: this.getSectorFromIndustry(industry),
      companySize: companySize as 'small' | 'medium' | 'large',
      geography: 'US',
      metrics: benchmarkData,
      sampleSize: this.getSampleSize(industry, companySize),
      dataDate: new Date(),
      source: 'Industry Research Aggregation'
    }
  }

  private async getGeneralBusinessBenchmark(companySize: string): Promise<IndustryBenchmark> {
    return {
      id: `benchmark-general-${companySize}`,
      industry: 'General Business',
      sector: 'Cross-Industry',
      companySize: companySize as 'small' | 'medium' | 'large',
      geography: 'US',
      metrics: this.getGeneralBenchmarkData(companySize),
      sampleSize: 5000,
      dataDate: new Date(),
      source: 'General Business Statistics'
    }
  }

  private async getSectorSpecificBenchmark(industry: string, companySize: string): Promise<IndustryBenchmark> {
    const sector = this.getSectorFromIndustry(industry)
    
    return {
      id: `benchmark-sector-${sector}-${companySize}`,
      industry,
      sector,
      companySize: companySize as 'small' | 'medium' | 'large',
      geography: 'US',
      metrics: this.getSectorSpecificData(sector, companySize),
      sampleSize: this.getSampleSize(sector, companySize),
      dataDate: new Date(),
      source: 'Sector Analysis Reports'
    }
  }

  private getIndustrySpecificData(industry: string, companySize: string): { [key: string]: any } {
    // Industry-specific benchmark data
    const industryMultipliers = this.getIndustryMultipliers(industry)
    const sizeMultipliers = this.getSizeMultipliers(companySize)
    
    return {
      overall_health: this.generateMetricData(68 * industryMultipliers.overall, 12),
      financial_health: this.generateMetricData(70 * industryMultipliers.financial, 15),
      operational_health: this.generateMetricData(66 * industryMultipliers.operational, 13),
      market_health: this.generateMetricData(64 * industryMultipliers.market, 16),
      growth_health: this.generateMetricData(62 * industryMultipliers.growth, 18),
      
      // Specific financial metrics
      net_margin: this.generateMetricData(12 * industryMultipliers.financial, 8),
      revenue_per_employee: this.generateMetricData(180000 * sizeMultipliers.productivity, 60000),
      current_ratio: this.generateMetricData(2.1 * industryMultipliers.financial, 0.8),
      asset_turnover: this.generateMetricData(1.4 * industryMultipliers.operational, 0.6),
      
      // Operational metrics
      productivity_index: this.generateMetricData(75 * industryMultipliers.operational, 20),
      efficiency_score: this.generateMetricData(72 * industryMultipliers.operational, 18),
      
      // Market metrics
      market_position_strength: this.generateMetricData(65 * industryMultipliers.market, 22),
      competitive_advantage_index: this.generateMetricData(68 * industryMultipliers.market, 25),
      
      // Growth metrics
      scalability_index: this.generateMetricData(70 * industryMultipliers.growth, 20),
      growth_potential_score: this.generateMetricData(65 * industryMultipliers.growth, 22)
    }
  }

  private generateMetricData(average: number, stdDev: number) {
    return {
      average: Math.round(average * 100) / 100,
      median: Math.round((average * 1.02) * 100) / 100, // Slightly higher than average
      percentiles: {
        10: Math.round((average - 1.28 * stdDev) * 100) / 100,
        25: Math.round((average - 0.67 * stdDev) * 100) / 100,
        50: Math.round((average * 1.02) * 100) / 100,
        75: Math.round((average + 0.67 * stdDev) * 100) / 100,
        90: Math.round((average + 1.28 * stdDev) * 100) / 100
      },
      standardDeviation: stdDev
    }
  }

  private getIndustryMultipliers(industry: string): {
    overall: number
    financial: number
    operational: number
    market: number
    growth: number
  } {
    const multipliers: { [key: string]: any } = {
      'technology': { overall: 1.15, financial: 1.1, operational: 1.2, market: 1.1, growth: 1.3 },
      'software': { overall: 1.2, financial: 1.15, operational: 1.25, market: 1.15, growth: 1.35 },
      'saas': { overall: 1.25, financial: 1.2, operational: 1.3, market: 1.2, growth: 1.4 },
      'healthcare': { overall: 1.05, financial: 1.0, operational: 0.95, market: 1.1, growth: 1.1 },
      'fintech': { overall: 1.1, financial: 1.2, operational: 1.15, market: 1.05, growth: 1.2 },
      'manufacturing': { overall: 0.95, financial: 0.9, operational: 1.1, market: 0.9, growth: 0.85 },
      'retail': { overall: 0.9, financial: 0.85, operational: 0.95, market: 1.05, growth: 0.9 },
      'services': { overall: 1.0, financial: 0.95, operational: 1.05, market: 1.0, growth: 1.0 },
      'consulting': { overall: 1.1, financial: 1.05, operational: 1.15, market: 1.1, growth: 1.1 },
      'ecommerce': { overall: 1.05, financial: 1.0, operational: 1.1, market: 1.15, growth: 1.25 }
    }
    
    const normalized = industry.toLowerCase()
    return multipliers[normalized] || { overall: 1.0, financial: 1.0, operational: 1.0, market: 1.0, growth: 1.0 }
  }

  private getSizeMultipliers(companySize: string): {
    productivity: number
    efficiency: number
    resources: number
  } {
    const multipliers = {
      'small': { productivity: 0.85, efficiency: 0.9, resources: 0.8 },
      'medium': { productivity: 1.0, efficiency: 1.0, resources: 1.0 },
      'large': { productivity: 1.15, efficiency: 1.1, resources: 1.2 }
    }
    
    return multipliers[companySize as keyof typeof multipliers] || multipliers.medium
  }

  private getGeneralBenchmarkData(companySize: string) {
    const sizeMultipliers = this.getSizeMultipliers(companySize)
    
    return {
      overall_health: this.generateMetricData(65, 15),
      financial_health: this.generateMetricData(68, 16),
      operational_health: this.generateMetricData(64, 14),
      market_health: this.generateMetricData(62, 17),
      growth_health: this.generateMetricData(60, 19),
      revenue_per_employee: this.generateMetricData(150000 * sizeMultipliers.productivity, 50000)
    }
  }

  private getSectorSpecificData(sector: string, companySize: string) {
    // Simplified sector data - would be more comprehensive in real implementation
    return this.getGeneralBenchmarkData(companySize)
  }

  private determineCompanySize(): string {
    const revenue = this.businessData.annualRevenue
    const employees = this.businessData.employeeCount
    
    if (revenue > 50000000 || employees > 500) return 'large'
    if (revenue > 10000000 || employees > 50) return 'medium'
    return 'small'
  }

  private normalizeIndustry(industry: string): string {
    const normalized = industry.toLowerCase()
    
    // Map various industry descriptions to standard categories
    if (normalized.includes('tech') || normalized.includes('software') || normalized.includes('saas')) {
      if (normalized.includes('saas')) return 'saas'
      if (normalized.includes('software')) return 'software'
      return 'technology'
    }
    
    if (normalized.includes('health') || normalized.includes('medical')) return 'healthcare'
    if (normalized.includes('fin') && normalized.includes('tech')) return 'fintech'
    if (normalized.includes('manufact')) return 'manufacturing'
    if (normalized.includes('retail') || normalized.includes('ecommerce')) return 'retail'
    if (normalized.includes('consult')) return 'consulting'
    if (normalized.includes('service')) return 'services'
    
    return normalized
  }

  private getSectorFromIndustry(industry: string): string {
    const sectorMap: { [key: string]: string } = {
      'technology': 'Information Technology',
      'software': 'Information Technology',
      'saas': 'Information Technology',
      'healthcare': 'Healthcare',
      'fintech': 'Financial Services',
      'manufacturing': 'Manufacturing',
      'retail': 'Consumer Discretionary',
      'consulting': 'Professional Services',
      'services': 'Professional Services'
    }
    
    return sectorMap[industry] || 'General Business'
  }

  private getSampleSize(category: string, companySize: string): number {
    const baseSizes: { [key: string]: number } = {
      'technology': 800,
      'software': 600,
      'healthcare': 1200,
      'manufacturing': 1500,
      'retail': 2000,
      'services': 1000
    }
    
    const sizeMultiplier = companySize === 'large' ? 0.6 : companySize === 'medium' ? 0.8 : 1.0
    return Math.round((baseSizes[category] || 500) * sizeMultiplier)
  }

  private calculatePercentile(score: number, percentiles: { [key: number]: number }): number {
    const sortedPercentiles = Object.entries(percentiles)
      .map(([p, v]) => ({ percentile: parseInt(p), value: v }))
      .sort((a, b) => a.percentile - b.percentile)

    for (let i = 0; i < sortedPercentiles.length; i++) {
      if (score <= sortedPercentiles[i].value) {
        if (i === 0) return sortedPercentiles[i].percentile
        
        // Interpolate between percentiles
        const lower = sortedPercentiles[i - 1]
        const upper = sortedPercentiles[i]
        const ratio = (score - lower.value) / (upper.value - lower.value)
        return Math.round(lower.percentile + ratio * (upper.percentile - lower.percentile))
      }
    }
    
    return sortedPercentiles[sortedPercentiles.length - 1].percentile
  }

  private determineQuartile(percentile: number): number {
    if (percentile <= 25) return 1
    if (percentile <= 50) return 2
    if (percentile <= 75) return 3
    return 4
  }

  private generateInterpretation(percentile: number, score: number, average: number): string {
    const quartile = this.determineQuartile(percentile)
    const vs_average = score > average ? 'above' : score < average ? 'below' : 'at'
    
    const interpretations: { [key: number]: string } = {
      1: `Below industry standards (${percentile}th percentile). Significant improvement opportunities exist.`,
      2: `Below average performance (${percentile}th percentile). Focus on key improvement areas.`,
      3: `Above average performance (${percentile}th percentile). Good positioning with room for optimization.`,
      4: `Top quartile performance (${percentile}th percentile). Industry-leading position.`
    }
    
    return `${interpretations[quartile]} Your score of ${score} is ${vs_average} the industry average of ${average}.`
  }

  private generatePeerComparison(ranking: number, score: number): string {
    if (ranking >= 90) return `Exceptional performance - you outperform 90% of peers in your industry`
    if (ranking >= 75) return `Strong performance - you outperform 75% of industry peers`
    if (ranking >= 60) return `Above average - you outperform 60% of similar businesses`
    if (ranking >= 40) return `Average performance - comparable to industry median`
    return `Below average - significant opportunity for improvement vs industry peers`
  }

  private identifyImprovementOpportunities(rankings: { [dimension: string]: number }): string[] {
    const opportunities: string[] = []
    
    Object.entries(rankings).forEach(([dimension, ranking]) => {
      if (ranking < 40) {
        opportunities.push(`${dimension.charAt(0).toUpperCase() + dimension.slice(1)} dimension requires immediate attention (${ranking}th percentile)`)
      } else if (ranking < 60) {
        opportunities.push(`${dimension.charAt(0).toUpperCase() + dimension.slice(1)} has room for improvement (${ranking}th percentile)`)
      }
    })
    
    return opportunities
  }

  private identifyCompetitiveStrengths(rankings: { [dimension: string]: number }): string[] {
    const strengths: string[] = []
    
    Object.entries(rankings).forEach(([dimension, ranking]) => {
      if (ranking >= 80) {
        strengths.push(`${dimension.charAt(0).toUpperCase() + dimension.slice(1)} is a competitive strength (${ranking}th percentile)`)
      } else if (ranking >= 65) {
        strengths.push(`${dimension.charAt(0).toUpperCase() + dimension.slice(1)} performs well vs peers (${ranking}th percentile)`)
      }
    })
    
    return strengths
  }
}