import type { BusinessHealthScore, TrendAnalysis, PredictiveIndicator, ImprovementPath, HealthAlert } from '@/types/health-analysis'
import type { BusinessData } from '@/types/evaluation'
import { FinancialHealthAnalyzer } from '@/lib/algorithms/financial-health'
import { OperationalHealthAnalyzer } from '@/lib/algorithms/operational-health'
import { MarketHealthAnalyzer } from '@/lib/algorithms/market-health'
import { GrowthHealthAnalyzer } from '@/lib/algorithms/growth-health'

export class HealthAnalysisService {
  private businessData: BusinessData

  constructor(businessData: BusinessData) {
    this.businessData = businessData
  }

  async calculateComprehensiveHealthScore(): Promise<BusinessHealthScore> {
    // Calculate all dimensions
    const financial = new FinancialHealthAnalyzer(this.businessData).calculateFinancialHealth()
    const operational = new OperationalHealthAnalyzer(this.businessData).calculateOperationalHealth()
    const market = new MarketHealthAnalyzer(this.businessData).calculateMarketHealth()
    const growth = new GrowthHealthAnalyzer(this.businessData).calculateGrowthHealth()

    // Calculate overall score
    const overallScore = this.calculateOverallScore(financial, operational, market, growth)
    
    // Generate additional analysis components
    const trendAnalysis = this.generateTrendAnalysis(financial, operational, market, growth)
    const predictiveIndicators = this.generatePredictiveIndicators(financial, operational, market, growth)
    const improvementPaths = this.generateImprovementPaths(financial, operational, market, growth)
    const alerts = this.generateHealthAlerts(financial, operational, market, growth)

    const healthScore: BusinessHealthScore = {
      id: `health-${Date.now()}`,
      evaluationId: 'temp-evaluation-id', // This would come from the evaluation
      overallScore,
      dimensions: {
        financial,
        operational,
        market,
        growth
      },
      industryBenchmarks: await this.getIndustryBenchmarks(),
      trendAnalysis,
      predictiveIndicators,
      improvementPaths,
      alerts,
      calculatedAt: new Date(),
      validUntil: new Date(Date.now() + 24 * 60 * 60 * 1000), // Valid for 24 hours
      methodology: this.generateMethodologyExplanation(),
      confidenceScore: this.calculateOverallConfidence(financial, operational, market, growth)
    }

    return healthScore
  }

  private calculateOverallScore(financial: any, operational: any, market: any, growth: any): number {
    const weightedSum = (
      financial.score * financial.weight +
      operational.score * operational.weight +
      market.score * market.weight +
      growth.score * growth.weight
    )
    
    return Math.round(weightedSum)
  }

  private calculateOverallConfidence(financial: any, operational: any, market: any, growth: any): number {
    const weightedConfidence = (
      financial.confidence * financial.weight +
      operational.confidence * operational.weight +
      market.confidence * market.weight +
      growth.confidence * growth.weight
    )
    
    return Math.round(weightedConfidence)
  }

  private generateTrendAnalysis(financial: any, operational: any, market: any, growth: any): TrendAnalysis {
    return {
      id: `trend-${Date.now()}`,
      healthScoreId: `health-${Date.now()}`,
      timeframe: '12 months',
      historicalData: this.generateHistoricalData(),
      trendDirection: this.analyzeTrendDirection(financial, operational, market, growth),
      changeRate: this.calculateChangeRate(financial, operational, market, growth),
      seasonality: [],
      volatility: this.calculateVolatility(),
      projectedScores: this.generateProjections(financial, operational, market, growth),
      keyTrendDrivers: this.identifyTrendDrivers(financial, operational, market, growth)
    }
  }

  private generatePredictiveIndicators(financial: any, operational: any, market: any, growth: any): PredictiveIndicator[] {
    const indicators: PredictiveIndicator[] = []

    // Financial predictive indicators
    indicators.push({
      id: 'cash-flow-trend',
      name: 'Cash Flow Trend',
      category: 'leading',
      currentValue: this.businessData.cashFlow,
      predictedValue: this.businessData.cashFlow * 1.1, // Simple projection
      confidence: financial.confidence,
      timeHorizon: '6 months',
      significance: 'high',
      description: 'Projected cash flow based on current trends',
      actionable: true
    })

    // Operational predictive indicators
    indicators.push({
      id: 'efficiency-trend',
      name: 'Operational Efficiency',
      category: 'coincident',
      currentValue: operational.score,
      predictedValue: operational.score + 5, // Slight improvement expected
      confidence: operational.confidence,
      timeHorizon: '3 months',
      significance: 'medium',
      description: 'Expected operational efficiency improvements',
      actionable: true
    })

    // Market indicators
    indicators.push({
      id: 'market-position',
      name: 'Market Position Strength',
      category: 'lagging',
      currentValue: market.score,
      predictedValue: market.score,
      confidence: market.confidence,
      timeHorizon: '12 months',
      significance: 'medium',
      description: 'Market position stability indicator',
      actionable: false
    })

    // Growth indicators
    indicators.push({
      id: 'growth-potential',
      name: 'Growth Potential Realization',
      category: 'leading',
      currentValue: growth.score,
      predictedValue: growth.score * 1.15,
      confidence: growth.confidence,
      timeHorizon: '9 months',
      significance: 'high',
      description: 'Potential for growth realization',
      actionable: true
    })

    return indicators
  }

  private generateImprovementPaths(financial: any, operational: any, market: any, growth: any): ImprovementPath[] {
    const paths: ImprovementPath[] = []

    // Find lowest scoring dimensions for improvement focus
    const dimensions = [
      { name: 'financial', data: financial },
      { name: 'operational', data: operational },
      { name: 'market', data: market },
      { name: 'growth', data: growth }
    ].sort((a, b) => a.data.score - b.data.score)

    dimensions.forEach((dim, index) => {
      if (dim.data.score < 75) { // Only create paths for dimensions that need improvement
        paths.push({
          id: `improvement-${dim.name}`,
          dimension: dim.name,
          currentScore: dim.data.score,
          targetScore: Math.min(85, dim.data.score + 20),
          improvementPotential: Math.min(85, dim.data.score + 20) - dim.data.score,
          timeframe: index === 0 ? '3-6 months' : index === 1 ? '6-9 months' : '9-12 months',
          actions: this.generateImprovementActions(dim.name, dim.data),
          requiredResources: this.generateRequiredResources(dim.name),
          riskFactors: this.generateRiskFactors(dim.name),
          successMetrics: this.generateSuccessMetrics(dim.name)
        })
      }
    })

    return paths
  }

  private generateHealthAlerts(financial: any, operational: any, market: any, growth: any): HealthAlert[] {
    const alerts: HealthAlert[] = []

    // Critical score alerts
    if (financial.score < 40) {
      alerts.push({
        id: `alert-financial-${Date.now()}`,
        severity: 'critical',
        type: 'score_decline',
        message: 'Financial health score is critically low and requires immediate attention',
        affectedDimensions: ['financial'],
        recommendations: [
          'Review cash flow management immediately',
          'Analyze cost structure for reduction opportunities',
          'Consider emergency financing options if needed'
        ],
        createdAt: new Date()
      })
    }

    if (operational.score < 45) {
      alerts.push({
        id: `alert-operational-${Date.now()}`,
        severity: 'high',
        type: 'score_decline',
        message: 'Operational efficiency is below industry standards',
        affectedDimensions: ['operational'],
        recommendations: [
          'Implement process optimization initiatives',
          'Review resource allocation and productivity metrics',
          'Consider automation opportunities'
        ],
        createdAt: new Date()
      })
    }

    return alerts
  }

  private generateHistoricalData() {
    // In a real implementation, this would fetch actual historical data
    const data = []
    const baseDate = new Date()
    baseDate.setMonth(baseDate.getMonth() - 12)

    for (let i = 0; i < 12; i++) {
      const date = new Date(baseDate)
      date.setMonth(date.getMonth() + i)
      
      data.push({
        date,
        overallScore: 65 + Math.random() * 20, // Simulated historical data
        dimensions: {
          financial: 60 + Math.random() * 25,
          operational: 65 + Math.random() * 20,
          market: 60 + Math.random() * 20,
          growth: 55 + Math.random() * 25
        },
        contextualFactors: ['Market conditions', 'Seasonal variations']
      })
    }

    return data
  }

  private analyzeTrendDirection(financial: any, operational: any, market: any, growth: any): 'upward' | 'stable' | 'downward' {
    const improvements = [financial, operational, market, growth].filter(d => d.trendDirection === 'improving').length
    const declines = [financial, operational, market, growth].filter(d => d.trendDirection === 'declining').length

    if (improvements > declines) return 'upward'
    if (declines > improvements) return 'downward'
    return 'stable'
  }

  private calculateChangeRate(financial: any, operational: any, market: any, growth: any): number {
    // Simplified change rate calculation
    const overallScore = this.calculateOverallScore(financial, operational, market, growth)
    const historicalAverage = 65 // Would be calculated from actual historical data
    
    return ((overallScore - historicalAverage) / historicalAverage) * 100
  }

  private calculateVolatility(): number {
    // Simplified volatility calculation
    return 8.5 // Would be calculated from actual historical variance
  }

  private generateProjections(financial: any, operational: any, market: any, growth: any) {
    const currentScore = this.calculateOverallScore(financial, operational, market, growth)
    const projections = []
    
    for (let i = 1; i <= 6; i++) {
      const date = new Date()
      date.setMonth(date.getMonth() + i)
      
      projections.push({
        date,
        projectedScore: Math.max(0, Math.min(100, currentScore + (i * 2) + (Math.random() * 10 - 5))),
        confidence: Math.max(40, 85 - (i * 8)),
        scenario: i <= 2 ? 'conservative' as const : i <= 4 ? 'realistic' as const : 'optimistic' as const
      })
    }
    
    return projections
  }

  private identifyTrendDrivers(financial: any, operational: any, market: any, growth: any): string[] {
    const drivers = []
    
    if (financial.trendDirection === 'improving') drivers.push('Improving financial performance')
    if (operational.score > 75) drivers.push('Strong operational efficiency')
    if (market.score > 70) drivers.push('Solid market position')
    if (growth.score > 70) drivers.push('High growth potential')
    
    return drivers
  }

  private generateImprovementActions(dimension: string, data: any) {
    const actions: any[] = []
    
    // Get the lowest scoring components for targeted improvement
    const lowComponents = data.components
      .filter((c: any) => c.score < 60)
      .sort((a: any, b: any) => a.score - b.score)
      .slice(0, 3)

    lowComponents.forEach((comp: any, index: number) => {
      actions.push({
        id: `action-${dimension}-${index}`,
        title: `Improve ${comp.name}`,
        description: comp.description,
        priority: index + 1,
        effort: comp.score < 40 ? 'high' as const : comp.score < 60 ? 'medium' as const : 'low' as const,
        impact: comp.weight > 0.2 ? 'high' as const : comp.weight > 0.1 ? 'medium' as const : 'low' as const,
        timeframe: comp.score < 40 ? '1-3 months' : '3-6 months',
        dependencies: []
      })
    })
    
    return actions
  }

  private generateRequiredResources(dimension: string) {
    const resources = []
    
    switch (dimension) {
      case 'financial':
        resources.push(
          { type: 'financial' as const, description: 'Working capital improvement', amount: 50000, unit: 'USD' },
          { type: 'human' as const, description: 'Financial analyst', amount: 1, unit: 'FTE' }
        )
        break
      case 'operational':
        resources.push(
          { type: 'human' as const, description: 'Process improvement specialist', amount: 0.5, unit: 'FTE' },
          { type: 'technical' as const, description: 'Process automation tools', amount: 25000, unit: 'USD' }
        )
        break
      case 'market':
        resources.push(
          { type: 'financial' as const, description: 'Marketing budget', amount: 30000, unit: 'USD' },
          { type: 'human' as const, description: 'Marketing specialist', amount: 1, unit: 'FTE' }
        )
        break
      case 'growth':
        resources.push(
          { type: 'financial' as const, description: 'Growth investment', amount: 100000, unit: 'USD' },
          { type: 'human' as const, description: 'Business development', amount: 1, unit: 'FTE' }
        )
        break
    }
    
    return resources
  }

  private generateRiskFactors(dimension: string): string[] {
    const risks: { [key: string]: string[] } = {
      financial: [
        'Cash flow volatility during improvement period',
        'Investment requirements may strain resources',
        'Market conditions could impact financial improvements'
      ],
      operational: [
        'Process changes may temporarily reduce efficiency',
        'Employee resistance to new procedures',
        'Technology implementation risks'
      ],
      market: [
        'Competitive response to market initiatives',
        'Market conditions may change',
        'Customer acquisition costs may be higher than expected'
      ],
      growth: [
        'Resource allocation challenges',
        'Market saturation risks',
        'Scaling operational capabilities'
      ]
    }
    
    return risks[dimension] || []
  }

  private generateSuccessMetrics(dimension: string): string[] {
    const metrics: { [key: string]: string[] } = {
      financial: [
        'Cash flow improvement of 15%',
        'Profit margin increase of 5 percentage points',
        'Working capital optimization'
      ],
      operational: [
        'Process efficiency improvement of 20%',
        'Cost reduction of 10%',
        'Employee productivity increase'
      ],
      market: [
        'Market share increase of 2%',
        'Customer acquisition improvement',
        'Brand recognition enhancement'
      ],
      growth: [
        'Revenue growth of 25%',
        'Market expansion success',
        'Scalability metrics improvement'
      ]
    }
    
    return metrics[dimension] || []
  }

  private async getIndustryBenchmarks() {
    // In a real implementation, this would fetch from external APIs
    return [
      {
        id: 'benchmark-1',
        industry: this.businessData.industryFocus,
        sector: 'General',
        companySize: this.getCompanySize(),
        geography: 'US',
        metrics: {
          'overall_health': {
            average: 68,
            median: 70,
            percentiles: { 25: 55, 50: 70, 75: 82, 90: 90 },
            standardDeviation: 15
          }
        },
        sampleSize: 500,
        dataDate: new Date(),
        source: 'Industry Research'
      }
    ]
  }

  private getCompanySize(): 'small' | 'medium' | 'large' {
    if (this.businessData.annualRevenue > 50000000) return 'large'
    if (this.businessData.annualRevenue > 10000000) return 'medium'
    return 'small'
  }

  private generateMethodologyExplanation(): string {
    return `Multi-dimensional health analysis evaluating financial stability (35%), operational efficiency (25%), market position (20%), and growth potential (20%). Each dimension includes weighted component analysis with industry benchmarking and confidence scoring. Scores are calculated using proprietary algorithms considering business model, industry factors, and performance metrics relative to peer benchmarks.`
  }
}