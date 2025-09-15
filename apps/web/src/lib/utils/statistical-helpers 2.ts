export interface DataPoint {
  x: number // timestamp or index
  y: number // value
  date?: Date
}

export interface TrendResult {
  slope: number
  intercept: number
  rSquared: number
  confidence: number
  direction: 'increasing' | 'decreasing' | 'stable'
  strength: number // 0-1
  statisticalSignificance: number // 0-1
}

export interface ConfidenceInterval {
  lower: number
  upper: number
  level: number // confidence level (e.g., 0.95 for 95%)
}

export interface MovingAverageResult {
  values: number[]
  period: number
}

export interface SeasonalPattern {
  period: number // length of cycle (e.g., 12 for monthly data)
  amplitude: number
  phase: number
  strength: number // how strong the seasonal pattern is
}

export class StatisticalHelpers {
  /**
   * Calculate linear regression for trend analysis
   */
  static linearRegression(data: DataPoint[]): TrendResult {
    if (data.length < 2) {
      return {
        slope: 0,
        intercept: 0,
        rSquared: 0,
        confidence: 0,
        direction: 'stable',
        strength: 0,
        statisticalSignificance: 0
      }
    }

    const n = data.length
    const sumX = data.reduce((sum, point) => sum + point.x, 0)
    const sumY = data.reduce((sum, point) => sum + point.y, 0)
    const sumXY = data.reduce((sum, point) => sum + (point.x * point.y), 0)
    const sumXX = data.reduce((sum, point) => sum + (point.x * point.x), 0)
    const sumYY = data.reduce((sum, point) => sum + (point.y * point.y), 0)

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX)
    const intercept = (sumY - slope * sumX) / n

    // Calculate R-squared
    const yMean = sumY / n
    const totalSumSquares = data.reduce((sum, point) => sum + Math.pow(point.y - yMean, 2), 0)
    const residualSumSquares = data.reduce((sum, point) => {
      const predicted = slope * point.x + intercept
      return sum + Math.pow(point.y - predicted, 2)
    }, 0)
    
    const rSquared = totalSumSquares > 0 ? 1 - (residualSumSquares / totalSumSquares) : 0

    // Determine direction and strength
    const direction: 'increasing' | 'decreasing' | 'stable' = 
      Math.abs(slope) < 0.01 ? 'stable' : slope > 0 ? 'increasing' : 'decreasing'
    
    const strength = Math.min(Math.abs(rSquared), 1)
    const statisticalSignificance = this.calculateTStatistic(data, slope, intercept)
    const confidence = Math.min(rSquared * statisticalSignificance, 1)

    return {
      slope,
      intercept,
      rSquared,
      confidence,
      direction,
      strength,
      statisticalSignificance
    }
  }

  /**
   * Calculate moving average
   */
  static movingAverage(data: number[], period: number): MovingAverageResult {
    if (period <= 0 || period > data.length) {
      return { values: [...data], period }
    }

    const values: number[] = []
    for (let i = 0; i < data.length; i++) {
      if (i < period - 1) {
        values.push(data[i]) // Not enough data points yet, use original value
      } else {
        const sum = data.slice(i - period + 1, i + 1).reduce((acc, val) => acc + val, 0)
        values.push(sum / period)
      }
    }

    return { values, period }
  }

  /**
   * Calculate exponential moving average
   */
  static exponentialMovingAverage(data: number[], alpha: number = 0.3): number[] {
    if (data.length === 0) return []
    
    const ema = [data[0]]
    for (let i = 1; i < data.length; i++) {
      ema.push(alpha * data[i] + (1 - alpha) * ema[i - 1])
    }
    
    return ema
  }

  /**
   * Calculate confidence intervals for predictions
   */
  static calculateConfidenceInterval(
    data: DataPoint[],
    prediction: number,
    confidenceLevel: number = 0.95
  ): ConfidenceInterval {
    if (data.length < 3) {
      // Not enough data for meaningful confidence interval
      const margin = prediction * 0.2 // 20% margin as fallback
      return {
        lower: prediction - margin,
        upper: prediction + margin,
        level: confidenceLevel
      }
    }

    const trend = this.linearRegression(data)
    const residuals = data.map(point => {
      const predicted = trend.slope * point.x + trend.intercept
      return Math.pow(point.y - predicted, 2)
    })

    const mse = residuals.reduce((sum, r) => sum + r, 0) / (data.length - 2) // degrees of freedom
    const standardError = Math.sqrt(mse)

    // T-value for confidence level (simplified - using normal approximation)
    const tValue = this.getTValueForConfidence(confidenceLevel, data.length - 2)
    const margin = tValue * standardError

    return {
      lower: prediction - margin,
      upper: prediction + margin,
      level: confidenceLevel
    }
  }

  /**
   * Detect seasonal patterns in data
   */
  static detectSeasonality(data: DataPoint[], expectedPeriod?: number): SeasonalPattern | null {
    if (data.length < 12) return null // Need at least one full cycle

    // If no expected period provided, try common business cycles
    const periodsToTest = expectedPeriod ? [expectedPeriod] : [3, 4, 6, 12] // quarterly, seasonal, semi-annual, annual
    
    let bestPattern: SeasonalPattern | null = null
    let bestScore = 0

    for (const period of periodsToTest) {
      if (data.length < period * 2) continue // Need at least 2 full cycles

      const pattern = this.analyzeSeasonalPattern(data, period)
      if (pattern.strength > bestScore) {
        bestScore = pattern.strength
        bestPattern = pattern
      }
    }

    return bestScore > 0.3 ? bestPattern : null // Only return if reasonably strong pattern
  }

  /**
   * Analyze seasonal pattern for a specific period
   */
  private static analyzeSeasonalPattern(data: DataPoint[], period: number): SeasonalPattern {
    // Group data by position in cycle
    const cycles: number[][] = Array(period).fill(null).map(() => [])
    
    data.forEach((point, index) => {
      const positionInCycle = index % period
      cycles[positionInCycle].push(point.y)
    })

    // Calculate average for each position
    const seasonalMeans = cycles.map(cycle => 
      cycle.length > 0 ? cycle.reduce((sum, val) => sum + val, 0) / cycle.length : 0
    )

    // Calculate overall mean
    const overallMean = data.reduce((sum, point) => sum + point.y, 0) / data.length

    // Calculate seasonal indices and amplitude
    const seasonalIndices = seasonalMeans.map(mean => mean / overallMean)
    const amplitude = Math.max(...seasonalIndices) - Math.min(...seasonalIndices)
    
    // Calculate strength of seasonal pattern (variance explained by seasonality)
    const totalVariance = data.reduce((sum, point) => sum + Math.pow(point.y - overallMean, 2), 0)
    const seasonalVariance = data.reduce((sum, point, index) => {
      const expectedSeasonal = seasonalMeans[index % period]
      return sum + Math.pow(expectedSeasonal - overallMean, 2)
    }, 0)

    const strength = totalVariance > 0 ? seasonalVariance / totalVariance : 0

    // Find phase (peak position in cycle)
    const peakIndex = seasonalIndices.indexOf(Math.max(...seasonalIndices))
    const phase = peakIndex / period

    return {
      period,
      amplitude,
      phase,
      strength: Math.min(strength, 1)
    }
  }

  /**
   * Calculate forecast using linear regression
   */
  static forecast(data: DataPoint[], periods: number): DataPoint[] {
    const trend = this.linearRegression(data)
    const lastX = data.length > 0 ? Math.max(...data.map(d => d.x)) : 0
    const forecasts: DataPoint[] = []

    for (let i = 1; i <= periods; i++) {
      const x = lastX + i
      const y = trend.slope * x + trend.intercept
      
      forecasts.push({
        x,
        y: Math.max(y, 0), // Ensure non-negative forecasts for business valuations
        date: new Date(Date.now() + i * 30 * 24 * 60 * 60 * 1000) // Approximate monthly intervals
      })
    }

    return forecasts
  }

  /**
   * Calculate data quality score
   */
  static calculateDataQuality(data: DataPoint[]): number {
    if (data.length < 2) return 0

    // Factors: completeness, consistency, recency
    const completeness = Math.min(data.length / 6, 1) // Favor 6+ data points
    
    // Consistency - look for outliers
    const values = data.map(d => d.y)
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length
    const stdDev = Math.sqrt(values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length)
    const outliers = values.filter(val => Math.abs(val - mean) > 2 * stdDev).length
    const consistency = 1 - (outliers / values.length)

    // Recency - favor more recent data
    const now = Date.now()
    const avgAge = data.reduce((sum, point) => {
      const age = point.date ? (now - point.date.getTime()) / (1000 * 60 * 60 * 24) : 0 // age in days
      return sum + age
    }, 0) / data.length

    const recency = Math.max(0, 1 - avgAge / 365) // Degrade after 1 year

    return (completeness * 0.4 + consistency * 0.4 + recency * 0.2)
  }

  /**
   * Calculate T-statistic for regression slope
   */
  private static calculateTStatistic(data: DataPoint[], slope: number, intercept: number): number {
    if (data.length < 3) return 0

    // Calculate standard error of slope
    const n = data.length
    const sumX = data.reduce((sum, point) => sum + point.x, 0)
    const sumXX = data.reduce((sum, point) => sum + (point.x * point.x), 0)
    
    const residualSumSquares = data.reduce((sum, point) => {
      const predicted = slope * point.x + intercept
      return sum + Math.pow(point.y - predicted, 2)
    }, 0)

    const mse = residualSumSquares / (n - 2)
    const sxx = sumXX - (sumX * sumX) / n
    const standardError = Math.sqrt(mse / sxx)

    const tStat = Math.abs(slope / standardError)
    
    // Convert t-statistic to p-value approximation (simplified)
    return Math.min(tStat / 3, 1) // Rough approximation: t > 3 is highly significant
  }

  /**
   * Get T-value for confidence level (simplified lookup)
   */
  private static getTValueForConfidence(confidenceLevel: number, degreesOfFreedom: number): number {
    // Simplified t-value lookup table
    const alpha = 1 - confidenceLevel
    
    if (alpha <= 0.01) return 2.576 // 99% confidence
    if (alpha <= 0.05) return 1.96  // 95% confidence
    if (alpha <= 0.1) return 1.645  // 90% confidence
    return 1.28 // 80% confidence
  }
}