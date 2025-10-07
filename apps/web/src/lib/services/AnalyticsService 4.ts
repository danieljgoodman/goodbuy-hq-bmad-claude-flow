import { PrismaClient } from '@prisma/client'
import { PremiumAccessService } from './PremiumAccessService'
import { StatisticalHelpers, DataPoint, TrendResult, ConfidenceInterval, SeasonalPattern } from '@/lib/utils/statistical-helpers'

const prisma = new PrismaClient()

// Simple in-memory cache for analytics calculations
const analyticsCache = new Map<string, { data: any; timestamp: number }>()
const ANALYTICS_CACHE_TTL = 15 * 60 * 1000 // 15 minutes

export interface AdvancedAnalytics {
  id: string
  userId: string
  analysisType: 'trend' | 'seasonal' | 'predictive' | 'cycle'
  timeRange: DateRange
  metrics: AnalyticsMetric[]
  trends: TrendAnalysisResult[]
  predictions: ValuationForecast[]
  confidenceIntervals: ConfidenceInterval[]
  seasonalityData?: SeasonalPattern[]
  dataQualityScore: number
  generatedAt: Date
}

export interface DateRange {
  start: Date
  end: Date
}

export interface AnalyticsMetric {
  name: string
  values: DataPoint[]
  currentValue: number
  change: number
  changePercentage: number
  trend: TrendResult
}

export interface TrendAnalysisResult {
  metric: string
  direction: 'increasing' | 'decreasing' | 'stable'
  strength: number // 0-1 scale
  confidenceScore: number
  statisticalSignificance: number
  projectedChange: number
  trendLine: DataPoint[]
}

export interface ValuationForecast {
  date: Date
  predictedValue: number
  lowerBound: number
  upperBound: number
  confidenceLevel: number
  modelAccuracy: number
}

export interface ModelPerformance {
  accuracy: number
  meanAbsoluteError: number
  rootMeanSquareError: number
  historicalPredictions: Array<{
    predicted: number
    actual: number
    date: Date
    accuracy: number
  }>
  lastUpdated: Date
}

export class AnalyticsService {

  /**
   * Get advanced trend analysis for a user
   */
  static async getAdvancedTrends(userId: string, timeRange?: DateRange): Promise<AdvancedAnalytics> {
    // Check premium access
    const accessCheck = await PremiumAccessService.checkAIFeatureAccess(userId)
    if (!accessCheck.hasAccess) {
      throw new Error('Premium subscription required for advanced analytics')
    }

    try {
      // Get historical business evaluations
      const evaluations = await this.getUserEvaluationsWithinRange(userId, timeRange)
      
      if (evaluations.length < 3) {
        throw new Error('Minimum 3 evaluations required for trend analysis')
      }

      // Get progress/value impact data
      const valueImpacts = await prisma.valueImpact.findMany({
        where: { 
          userId,
          calculatedAt: timeRange ? {
            gte: timeRange.start,
            lte: timeRange.end
          } : undefined
        },
        orderBy: { calculatedAt: 'asc' }
      })

      // Process different metrics
      const metrics = await this.calculateAdvancedMetrics(evaluations, valueImpacts)
      const trends = this.calculateTrendAnalysis(metrics)
      const predictions = await this.generatePredictions(userId, metrics)
      const seasonalityData = this.detectSeasonalPatterns(metrics)
      
      // Calculate overall data quality
      const dataQualityScore = this.calculateOverallDataQuality(metrics)

      return {
        id: `analytics_${userId}_${Date.now()}`,
        userId,
        analysisType: 'trend',
        timeRange: timeRange || { 
          start: new Date(evaluations[0].createdAt), 
          end: new Date(evaluations[evaluations.length - 1].createdAt) 
        },
        metrics,
        trends,
        predictions,
        confidenceIntervals: predictions.map(p => ({
          lower: p.lowerBound,
          upper: p.upperBound,
          level: p.confidenceLevel
        })),
        seasonalityData,
        dataQualityScore,
        generatedAt: new Date()
      }
    } catch (error) {
      console.error('Error generating advanced trends:', error)
      throw error
    }
  }

  /**
   * Generate valuation forecasts
   */
  static async generatePredictions(
    userId: string, 
    timeframeMonths: number = 6
  ): Promise<ValuationForecast[]> {
    try {
      // Get historical valuation data
      const evaluations = await this.getUserEvaluationsWithinRange(userId)
      const valuationData = this.extractValuationTimeSeries(evaluations)
      
      if (valuationData.length < 3) {
        throw new Error('Insufficient data for predictions')
      }

      // Generate forecasts using statistical methods
      const forecasts = StatisticalHelpers.forecast(valuationData, timeframeMonths)
      const modelAccuracy = await this.calculateModelAccuracy(userId, valuationData)

      return forecasts.map((forecast, index) => ({
        date: forecast.date!,
        predictedValue: forecast.y,
        ...StatisticalHelpers.calculateConfidenceInterval(valuationData, forecast.y, 0.95),
        confidenceLevel: 0.95,
        modelAccuracy
      }))
    } catch (error) {
      console.error('Error generating predictions:', error)
      throw error
    }
  }

  /**
   * Detect seasonal patterns in business data
   */
  static async getSeasonalityAnalysis(userId: string): Promise<SeasonalPattern[]> {
    try {
      const evaluations = await this.getUserEvaluationsWithinRange(userId)
      
      if (evaluations.length < 12) { // Need at least 12 evaluations for seasonal analysis
        throw new Error('Minimum 12 evaluations required for seasonality analysis')
      }

      const valuationData = this.extractValuationTimeSeries(evaluations)
      const seasonality = StatisticalHelpers.detectSeasonality(valuationData)
      
      return seasonality ? [seasonality] : []
    } catch (error) {
      console.error('Error analyzing seasonality:', error)
      throw error
    }
  }

  /**
   * Get model performance metrics
   */
  static async getModelPerformance(userId: string): Promise<ModelPerformance> {
    try {
      const evaluations = await this.getUserEvaluationsWithinRange(userId)
      const valuationData = this.extractValuationTimeSeries(evaluations)
      
      // Perform cross-validation to test model accuracy
      const { accuracy, mae, rmse, historicalPredictions } = 
        this.performCrossValidation(valuationData)

      return {
        accuracy,
        meanAbsoluteError: mae,
        rootMeanSquareError: rmse,
        historicalPredictions,
        lastUpdated: new Date()
      }
    } catch (error) {
      console.error('Error calculating model performance:', error)
      throw error
    }
  }

  /**
   * Get comprehensive analytics dashboard data
   */
  static async getAnalyticsDashboardData(userId: string) {
    try {
      const [
        advancedTrends,
        predictions,
        seasonality,
        modelPerformance
      ] = await Promise.all([
        this.getAdvancedTrends(userId),
        this.generatePredictions(userId),
        this.getSeasonalityAnalysis(userId).catch(() => []), // Might not have enough data
        this.getModelPerformance(userId)
      ])

      return {
        advancedTrends,
        predictions,
        seasonality,
        modelPerformance,
        summary: {
          totalEvaluations: advancedTrends.metrics[0]?.values.length || 0,
          dataQuality: advancedTrends.dataQualityScore,
          predictionAccuracy: modelPerformance.accuracy,
          hasSufficientData: advancedTrends.metrics[0]?.values.length >= 6
        }
      }
    } catch (error) {
      console.error('Error getting analytics dashboard data:', error)
      throw error
    }
  }

  /**
   * Private helper methods
   */

  private static async getUserEvaluationsWithinRange(
    userId: string, 
    timeRange?: DateRange
  ) {
    return await prisma.businessEvaluation.findMany({
      where: {
        userId,
        createdAt: timeRange ? {
          gte: timeRange.start,
          lte: timeRange.end
        } : undefined
      },
      orderBy: { createdAt: 'asc' }
    })
  }

  private static async calculateAdvancedMetrics(
    evaluations: any[],
    valueImpacts: any[]
  ): Promise<AnalyticsMetric[]> {
    const valuationData = this.extractValuationTimeSeries(evaluations)
    const healthScoreData = this.extractHealthScoreTimeSeries(evaluations)
    const valueImpactData = this.extractValueImpactTimeSeries(valueImpacts)

    const metrics: AnalyticsMetric[] = []

    // Business Valuation Metric
    if (valuationData.length > 0) {
      const trend = StatisticalHelpers.linearRegression(valuationData)
      const currentValue = valuationData[valuationData.length - 1].y
      const previousValue = valuationData.length > 1 ? valuationData[valuationData.length - 2].y : currentValue
      
      metrics.push({
        name: 'Business Valuation',
        values: valuationData,
        currentValue,
        change: currentValue - previousValue,
        changePercentage: previousValue > 0 ? ((currentValue - previousValue) / previousValue) * 100 : 0,
        trend
      })
    }

    // Health Score Metric
    if (healthScoreData.length > 0) {
      const trend = StatisticalHelpers.linearRegression(healthScoreData)
      const currentValue = healthScoreData[healthScoreData.length - 1].y
      const previousValue = healthScoreData.length > 1 ? healthScoreData[healthScoreData.length - 2].y : currentValue
      
      metrics.push({
        name: 'Business Health Score',
        values: healthScoreData,
        currentValue,
        change: currentValue - previousValue,
        changePercentage: previousValue > 0 ? ((currentValue - previousValue) / previousValue) * 100 : 0,
        trend
      })
    }

    // Value Impact Metric
    if (valueImpactData.length > 0) {
      const trend = StatisticalHelpers.linearRegression(valueImpactData)
      const currentValue = valueImpactData[valueImpactData.length - 1].y
      const previousValue = valueImpactData.length > 1 ? valueImpactData[valueImpactData.length - 2].y : currentValue
      
      metrics.push({
        name: 'Cumulative Value Impact',
        values: valueImpactData,
        currentValue,
        change: currentValue - previousValue,
        changePercentage: previousValue > 0 ? ((currentValue - previousValue) / previousValue) * 100 : 0,
        trend
      })
    }

    return metrics
  }

  private static calculateTrendAnalysis(metrics: AnalyticsMetric[]): TrendAnalysisResult[] {
    return metrics.map(metric => {
      const trendLine = this.generateTrendLine(metric.values, metric.trend)
      
      return {
        metric: metric.name,
        direction: metric.trend.direction,
        strength: metric.trend.strength,
        confidenceScore: metric.trend.confidence,
        statisticalSignificance: metric.trend.statisticalSignificance,
        projectedChange: this.calculateProjectedChange(metric.trend, 30), // 30 days
        trendLine
      }
    })
  }

  private static generateTrendLine(data: DataPoint[], trend: TrendResult): DataPoint[] {
    const minX = Math.min(...data.map(d => d.x))
    const maxX = Math.max(...data.map(d => d.x))
    
    return [
      { x: minX, y: trend.slope * minX + trend.intercept },
      { x: maxX, y: trend.slope * maxX + trend.intercept }
    ]
  }

  private static calculateProjectedChange(trend: TrendResult, days: number): number {
    return trend.slope * days
  }

  private static detectSeasonalPatterns(metrics: AnalyticsMetric[]): SeasonalPattern[] {
    const patterns: SeasonalPattern[] = []
    
    metrics.forEach(metric => {
      if (metric.values.length >= 12) { // Need at least a year of data
        const pattern = StatisticalHelpers.detectSeasonality(metric.values)
        if (pattern) {
          patterns.push(pattern)
        }
      }
    })

    return patterns
  }

  private static calculateOverallDataQuality(metrics: AnalyticsMetric[]): number {
    if (metrics.length === 0) return 0

    const qualityScores = metrics.map(metric => 
      StatisticalHelpers.calculateDataQuality(metric.values)
    )

    return qualityScores.reduce((sum, score) => sum + score, 0) / qualityScores.length
  }

  private static extractValuationTimeSeries(evaluations: any[]): DataPoint[] {
    return evaluations.map((evaluation, index) => ({
      x: index,
      y: this.extractValuationFromEvaluation(evaluation),
      date: new Date(evaluation.createdAt)
    }))
  }

  private static extractHealthScoreTimeSeries(evaluations: any[]): DataPoint[] {
    return evaluations
      .filter(e => e.healthScore != null)
      .map((evaluation, index) => ({
        x: index,
        y: evaluation.healthScore,
        date: new Date(evaluation.createdAt)
      }))
  }

  private static extractValueImpactTimeSeries(valueImpacts: any[]): DataPoint[] {
    let cumulativeValue = 0
    return valueImpacts.map((impact, index) => {
      cumulativeValue += impact.valuationIncrease
      return {
        x: index,
        y: cumulativeValue,
        date: new Date(impact.calculatedAt)
      }
    })
  }

  private static extractValuationFromEvaluation(evaluation: any): number {
    if (evaluation.valuations && typeof evaluation.valuations === 'object') {
      return evaluation.valuations.totalValuation || 
             evaluation.valuations.businessValue || 
             evaluation.valuations.estimatedValue || 
             evaluation.valuations.fairMarketValue || 
             500000
    }
    return 500000
  }

  private static async calculateModelAccuracy(userId: string, data: DataPoint[]): Promise<number> {
    // Simple historical accuracy calculation
    if (data.length < 4) return 0.5 // Default for insufficient data

    const { accuracy } = this.performCrossValidation(data)
    return accuracy
  }

  private static performCrossValidation(data: DataPoint[]) {
    if (data.length < 4) {
      return { accuracy: 0.5, mae: 0, rmse: 0, historicalPredictions: [] }
    }

    const historicalPredictions: Array<{
      predicted: number
      actual: number
      date: Date
      accuracy: number
    }> = []

    let totalError = 0
    let squaredErrors = 0
    let accuracies = 0

    // Use walk-forward validation
    for (let i = 3; i < data.length; i++) {
      const trainData = data.slice(0, i)
      const testPoint = data[i]
      
      const trend = StatisticalHelpers.linearRegression(trainData)
      const predicted = trend.slope * testPoint.x + trend.intercept
      const actual = testPoint.y
      
      const error = Math.abs(predicted - actual)
      const percentageError = actual > 0 ? error / actual : 1
      const accuracy = Math.max(0, 1 - percentageError)

      totalError += error
      squaredErrors += error * error
      accuracies += accuracy

      historicalPredictions.push({
        predicted,
        actual,
        date: testPoint.date || new Date(),
        accuracy
      })
    }

    const n = historicalPredictions.length
    const mae = totalError / n
    const rmse = Math.sqrt(squaredErrors / n)
    const avgAccuracy = accuracies / n

    return {
      accuracy: avgAccuracy,
      mae,
      rmse,
      historicalPredictions
    }
  }

}