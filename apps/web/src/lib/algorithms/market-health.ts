import type { HealthDimension, HealthComponent } from '@/types/health-analysis'
import type { BusinessData } from '@/types/evaluation'

export class MarketHealthAnalyzer {
  private businessData: BusinessData

  constructor(businessData: BusinessData) {
    this.businessData = businessData
  }

  calculateMarketHealth(): HealthDimension {
    const components = this.calculateComponents()
    const overallScore = this.calculateWeightedScore(components)
    
    return {
      id: 'market-health',
      dimension: 'market',
      score: overallScore,
      weight: 0.2, // 20% weight in overall health score
      confidence: this.calculateConfidence(components),
      components,
      benchmarkComparison: this.getBenchmarkComparison(),
      trendDirection: this.analyzeTrendDirection(),
      keyInsights: this.generateKeyInsights(components),
      criticalFactors: this.identifyCriticalFactors(components)
    }
  }

  private calculateComponents(): HealthComponent[] {
    const components: HealthComponent[] = []

    // Market position strength
    components.push(this.calculateMarketPositionComponent())
    
    // Competitive advantage sustainability
    components.push(this.calculateCompetitiveAdvantageComponent())
    
    // Customer base strength
    components.push(this.calculateCustomerBaseComponent())
    
    // Channel effectiveness
    components.push(this.calculateChannelEffectivenessComponent())
    
    // Market penetration
    components.push(this.calculateMarketPenetrationComponent())

    return components
  }

  private calculateMarketPositionComponent(): HealthComponent {
    const positionScore = this.scoreMarketPosition()
    
    return {
      id: 'market-position',
      name: 'Market Position',
      category: 'Competitive Standing',
      score: positionScore,
      weight: 0.3,
      value: positionScore,
      benchmarkValue: 65,
      impact: positionScore > 65 ? 'positive' : 'negative',
      description: 'Competitive position within target market',
      improvementPotential: Math.max(0, 85 - positionScore)
    }
  }

  private calculateCompetitiveAdvantageComponent(): HealthComponent {
    const advantageScore = this.scoreCompetitiveAdvantages()
    
    return {
      id: 'competitive-advantage',
      name: 'Competitive Advantage',
      category: 'Market Differentiation',
      score: advantageScore,
      weight: 0.25,
      value: advantageScore,
      benchmarkValue: 70,
      impact: advantageScore > 70 ? 'positive' : 'neutral',
      description: 'Strength and sustainability of competitive advantages',
      improvementPotential: Math.max(0, 90 - advantageScore)
    }
  }

  private calculateCustomerBaseComponent(): HealthComponent {
    const customerScore = this.scoreCustomerBase()
    
    return {
      id: 'customer-base',
      name: 'Customer Base Strength',
      category: 'Market Reach',
      score: customerScore,
      weight: 0.2,
      value: this.businessData.customerCount,
      benchmarkValue: this.getIndustryBenchmark('customer_count'),
      impact: this.businessData.customerCount > this.getIndustryBenchmark('customer_count') ? 'positive' : 'negative',
      description: 'Size and quality of customer base',
      improvementPotential: Math.max(0, 80 - customerScore)
    }
  }

  private calculateChannelEffectivenessComponent(): HealthComponent {
    const channelScore = this.scoreChannelEffectiveness()
    
    return {
      id: 'channel-effectiveness',
      name: 'Channel Effectiveness',
      category: 'Market Access',
      score: channelScore,
      weight: 0.15,
      value: channelScore,
      benchmarkValue: 70,
      impact: channelScore > 70 ? 'positive' : 'neutral',
      description: 'Effectiveness of sales and distribution channels',
      improvementPotential: Math.max(0, 85 - channelScore)
    }
  }

  private calculateMarketPenetrationComponent(): HealthComponent {
    const penetrationScore = this.scoreMarketPenetration()
    
    return {
      id: 'market-penetration',
      name: 'Market Penetration',
      category: 'Market Share',
      score: penetrationScore,
      weight: 0.1,
      value: penetrationScore,
      benchmarkValue: 60,
      impact: penetrationScore > 60 ? 'positive' : 'neutral',
      description: 'Market share and penetration depth',
      improvementPotential: Math.max(0, 80 - penetrationScore)
    }
  }

  private scoreMarketPosition(): number {
    let score = 40 // Base score

    const position = this.businessData.marketPosition.toLowerCase()
    
    if (position.includes('leader') || position.includes('dominant')) {
      score = 90
    } else if (position.includes('strong') || position.includes('established')) {
      score = 75
    } else if (position.includes('competitive') || position.includes('growing')) {
      score = 65
    } else if (position.includes('emerging') || position.includes('developing')) {
      score = 55
    } else if (position.includes('niche') || position.includes('specialized')) {
      score = 70
    }

    // Adjust for years in business
    if (this.businessData.yearsInBusiness > 10) score += 10
    else if (this.businessData.yearsInBusiness > 5) score += 5

    return Math.min(100, score)
  }

  private scoreCompetitiveAdvantages(): number {
    const advantageCount = this.businessData.competitiveAdvantages.length
    let score = Math.min(80, advantageCount * 15) // Up to 80 points for multiple advantages

    // Quality bonus based on advantage types
    const advantages = this.businessData.competitiveAdvantages.join(' ').toLowerCase()
    
    if (advantages.includes('proprietary') || advantages.includes('patent')) {
      score += 10
    }
    if (advantages.includes('brand') || advantages.includes('reputation')) {
      score += 8
    }
    if (advantages.includes('technology') || advantages.includes('innovation')) {
      score += 7
    }
    if (advantages.includes('cost') || advantages.includes('price')) {
      score += 5
    }

    return Math.min(100, score)
  }

  private scoreCustomerBase(): number {
    const customerCount = this.businessData.customerCount
    const benchmark = this.getIndustryBenchmark('customer_count')
    
    if (customerCount === 0) return 20

    const ratio = customerCount / benchmark
    
    if (ratio >= 2.0) return 90
    if (ratio >= 1.5) return 80
    if (ratio >= 1.0) return 70
    if (ratio >= 0.7) return 60
    if (ratio >= 0.5) return 45
    if (ratio >= 0.3) return 30
    return 20
  }

  private scoreChannelEffectiveness(): number {
    const channelCount = this.businessData.primaryChannels.length
    let score = Math.min(60, channelCount * 12) // Base score from channel diversity

    const channels = this.businessData.primaryChannels.join(' ').toLowerCase()
    
    // Channel quality bonuses
    if (channels.includes('online') || channels.includes('digital')) {
      score += 15
    }
    if (channels.includes('direct') || channels.includes('b2b')) {
      score += 12
    }
    if (channels.includes('partner') || channels.includes('distributor')) {
      score += 10
    }
    if (channels.includes('retail') || channels.includes('storefront')) {
      score += 8
    }

    return Math.min(100, score)
  }

  private scoreMarketPenetration(): number {
    let score = 50 // Base score

    // Estimate penetration based on business maturity and position
    if (this.businessData.yearsInBusiness > 15) score += 20
    else if (this.businessData.yearsInBusiness > 10) score += 15
    else if (this.businessData.yearsInBusiness > 5) score += 10

    // Customer base relative to market size (estimated)
    const revenueIndicator = this.businessData.annualRevenue
    if (revenueIndicator > 10000000) score += 15
    else if (revenueIndicator > 5000000) score += 10
    else if (revenueIndicator > 1000000) score += 5

    return Math.min(100, score)
  }

  private calculateWeightedScore(components: HealthComponent[]): number {
    const totalWeight = components.reduce((sum, comp) => sum + comp.weight, 0)
    const weightedSum = components.reduce((sum, comp) => sum + (comp.score * comp.weight), 0)
    return Math.round(weightedSum / totalWeight)
  }

  private calculateConfidence(components: HealthComponent[]): number {
    let confidence = 75 // Base confidence

    // Market data is often less precise than financial data
    if (this.businessData.customerCount === 0) confidence -= 15
    if (this.businessData.competitiveAdvantages.length === 0) confidence -= 10
    if (this.businessData.primaryChannels.length === 0) confidence -= 10

    return Math.max(45, confidence)
  }

  private getBenchmarkComparison() {
    return {
      industryAverage: 64,
      percentile: 58,
      quartile: 2
    }
  }

  private analyzeTrendDirection(): 'improving' | 'stable' | 'declining' {
    const positionScore = this.scoreMarketPosition()
    const advantageScore = this.scoreCompetitiveAdvantages()
    
    if (positionScore > 80 && advantageScore > 75) return 'improving'
    if (positionScore < 50 || advantageScore < 40) return 'declining'
    return 'stable'
  }

  private generateKeyInsights(components: HealthComponent[]): string[] {
    const insights: string[] = []

    const positionComp = components.find(c => c.id === 'market-position')
    if (positionComp && positionComp.score > 80) {
      insights.push('Strong market position provides competitive stability')
    }

    if (this.businessData.competitiveAdvantages.length > 3) {
      insights.push('Multiple competitive advantages create market differentiation')
    }

    const channelComp = components.find(c => c.id === 'channel-effectiveness')
    if (channelComp && channelComp.score > 75) {
      insights.push('Diverse channel strategy enhances market reach')
    }

    if (this.businessData.customerCount > this.getIndustryBenchmark('customer_count') * 1.5) {
      insights.push('Large customer base indicates strong market acceptance')
    }

    return insights
  }

  private identifyCriticalFactors(components: HealthComponent[]): string[] {
    const critical: string[] = []

    components.forEach(comp => {
      if (comp.score < 45 && comp.weight > 0.15) {
        critical.push(`${comp.name}: Market positioning needs strengthening`)
      }
    })

    if (this.businessData.competitiveAdvantages.length < 2) {
      critical.push('Limited competitive advantages may impact market sustainability')
    }

    return critical
  }

  private getIndustryBenchmark(metric: string): number {
    const benchmarks: { [key: string]: number } = {
      'customer_count': 500,
      'market_share': 3,
      'channel_effectiveness': 70,
      'brand_strength': 65
    }

    return benchmarks[metric] || 0
  }
}