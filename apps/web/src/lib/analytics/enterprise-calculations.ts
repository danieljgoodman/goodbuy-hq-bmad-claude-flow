// Enterprise Analytics Calculations
// Professional-grade financial calculations for strategic decision making

import type {
  EnterpriseMetrics,
  PortfolioAllocation,
  RiskMetric,
  BenchmarkComparison,
  ScenarioResult
} from '@/types/enterprise-dashboard';

export class EnterpriseAnalytics {
  /**
   * Calculate comprehensive portfolio metrics
   */
  static calculatePortfolioMetrics(allocations: PortfolioAllocation[]): EnterpriseMetrics {
    const totalValue = allocations.reduce((sum, allocation) => sum + allocation.totalValue, 0);
    const weightedReturns = allocations.reduce((sum, allocation) => {
      const weight = allocation.totalValue / totalValue;
      return sum + (allocation.performance * weight);
    }, 0);

    const diversificationIndex = this.calculateDiversificationIndex(allocations);
    const riskScore = this.calculateRiskScore(allocations);
    const liquidityRatio = this.calculateLiquidityRatio(allocations);

    return {
      totalInvestmentValue: totalValue,
      portfolioGrowthRate: weightedReturns,
      riskAssessmentScore: riskScore,
      diversificationIndex,
      liquidityRatio,
      performanceVsMarket: 0, // To be calculated with benchmark
      expectedAnnualReturn: this.calculateExpectedReturn(allocations),
      volatilityIndex: this.calculateVolatility(allocations)
    };
  }

  /**
   * Calculate diversification index using Herfindahl-Hirschman Index
   */
  private static calculateDiversificationIndex(allocations: PortfolioAllocation[]): number {
    const totalValue = allocations.reduce((sum, allocation) => sum + allocation.totalValue, 0);
    const hhi = allocations.reduce((sum, allocation) => {
      const weight = allocation.totalValue / totalValue;
      return sum + Math.pow(weight, 2);
    }, 0);

    // Convert to diversification index (1 - HHI, scaled to 0-100)
    return Math.round((1 - hhi) * 100);
  }

  /**
   * Calculate aggregate risk score
   */
  private static calculateRiskScore(allocations: PortfolioAllocation[]): number {
    const totalValue = allocations.reduce((sum, allocation) => sum + allocation.totalValue, 0);
    const riskMapping = { low: 1, medium: 2, high: 3 };

    const weightedRisk = allocations.reduce((sum, allocation) => {
      const weight = allocation.totalValue / totalValue;
      const riskValue = riskMapping[allocation.riskLevel];
      return sum + (riskValue * weight);
    }, 0);

    // Scale to 0-100 (lower is better)
    return Math.round((weightedRisk / 3) * 100);
  }

  /**
   * Calculate liquidity ratio
   */
  private static calculateLiquidityRatio(allocations: PortfolioAllocation[]): number {
    const liquidAssetClasses = ['cash', 'government-bonds', 'large-cap-stocks'];
    const totalValue = allocations.reduce((sum, allocation) => sum + allocation.totalValue, 0);
    const liquidValue = allocations
      .filter(allocation => liquidAssetClasses.includes(allocation.assetClass.toLowerCase()))
      .reduce((sum, allocation) => sum + allocation.totalValue, 0);

    return Math.round((liquidValue / totalValue) * 100);
  }

  /**
   * Calculate expected annual return
   */
  private static calculateExpectedReturn(allocations: PortfolioAllocation[]): number {
    const totalValue = allocations.reduce((sum, allocation) => sum + allocation.totalValue, 0);
    const expectedReturns = {
      'stocks': 0.10,
      'bonds': 0.04,
      'real-estate': 0.08,
      'commodities': 0.06,
      'cash': 0.02,
      'crypto': 0.15,
      'alternatives': 0.12
    };

    return allocations.reduce((sum, allocation) => {
      const weight = allocation.totalValue / totalValue;
      const assetClass = allocation.assetClass.toLowerCase();
      const expectedReturn = expectedReturns[assetClass as keyof typeof expectedReturns] || 0.07;
      return sum + (expectedReturn * weight);
    }, 0);
  }

  /**
   * Calculate portfolio volatility
   */
  private static calculateVolatility(allocations: PortfolioAllocation[]): number {
    const volatilityMapping = { low: 5, medium: 15, high: 25 };
    const totalValue = allocations.reduce((sum, allocation) => sum + allocation.totalValue, 0);

    const weightedVolatility = allocations.reduce((sum, allocation) => {
      const weight = allocation.totalValue / totalValue;
      const volatility = volatilityMapping[allocation.riskLevel];
      return sum + Math.pow(volatility * weight, 2);
    }, 0);

    return Math.round(Math.sqrt(weightedVolatility));
  }

  /**
   * Calculate performance vs benchmark
   */
  static calculateBenchmarkComparison(
    portfolioReturn: number,
    benchmarkReturn: number,
    returns: number[]
  ): BenchmarkComparison {
    const outperformance = portfolioReturn - benchmarkReturn;
    const trackingError = this.calculateTrackingError(returns, benchmarkReturn);
    const informationRatio = trackingError !== 0 ? outperformance / trackingError : 0;

    return {
      benchmarkName: 'S&P 500',
      portfolioReturn,
      benchmarkReturn,
      outperformance,
      trackingError,
      informationRatio,
      period: '1Y'
    };
  }

  /**
   * Calculate tracking error
   */
  private static calculateTrackingError(returns: number[], benchmarkReturn: number): number {
    const mean = returns.reduce((sum, ret) => sum + ret, 0) / returns.length;
    const variance = returns.reduce((sum, ret) => {
      return sum + Math.pow(ret - benchmarkReturn, 2);
    }, 0) / returns.length;

    return Math.sqrt(variance) * Math.sqrt(252); // Annualized
  }

  /**
   * Monte Carlo scenario analysis
   */
  static runScenarioAnalysis(
    allocations: PortfolioAllocation[],
    timeHorizon: number = 1,
    simulations: number = 10000
  ): ScenarioResult[] {
    const scenarios = [
      { name: 'Bull Market', marketReturn: 0.20, probability: 0.15 },
      { name: 'Normal Market', marketReturn: 0.10, probability: 0.70 },
      { name: 'Bear Market', marketReturn: -0.15, probability: 0.15 }
    ];

    return scenarios.map(scenario => {
      const results = this.runMonteCarloSimulation(
        allocations,
        scenario.marketReturn,
        timeHorizon,
        simulations
      );

      return {
        scenario: scenario.name,
        probability: scenario.probability,
        expectedReturn: results.mean,
        worstCase: results.percentile5,
        bestCase: results.percentile95,
        varAtRisk: results.var95,
        description: this.getScenarioDescription(scenario.name)
      };
    });
  }

  /**
   * Monte Carlo simulation
   */
  private static runMonteCarloSimulation(
    allocations: PortfolioAllocation[],
    marketReturn: number,
    timeHorizon: number,
    simulations: number
  ) {
    const results: number[] = [];
    const totalValue = allocations.reduce((sum, allocation) => sum + allocation.totalValue, 0);

    for (let i = 0; i < simulations; i++) {
      let portfolioValue = totalValue;

      for (let year = 0; year < timeHorizon; year++) {
        const yearReturn = allocations.reduce((sum, allocation) => {
          const weight = allocation.totalValue / totalValue;
          const beta = this.getAssetClassBeta(allocation.assetClass);
          const assetReturn = marketReturn * beta + (Math.random() - 0.5) * 0.1;
          return sum + (assetReturn * weight);
        }, 0);

        portfolioValue *= (1 + yearReturn);
      }

      results.push((portfolioValue - totalValue) / totalValue);
    }

    results.sort((a, b) => a - b);

    return {
      mean: results.reduce((sum, val) => sum + val, 0) / results.length,
      percentile5: results[Math.floor(results.length * 0.05)],
      percentile95: results[Math.floor(results.length * 0.95)],
      var95: results[Math.floor(results.length * 0.05)]
    };
  }

  /**
   * Get asset class beta (sensitivity to market)
   */
  private static getAssetClassBeta(assetClass: string): number {
    const betas: Record<string, number> = {
      'large-cap-stocks': 1.0,
      'small-cap-stocks': 1.2,
      'international-stocks': 0.8,
      'government-bonds': 0.1,
      'corporate-bonds': 0.3,
      'real-estate': 0.6,
      'commodities': 0.4,
      'cash': 0.0,
      'crypto': 2.0,
      'alternatives': 0.5
    };

    return betas[assetClass.toLowerCase()] || 1.0;
  }

  /**
   * Get scenario description
   */
  private static getScenarioDescription(scenario: string): string {
    const descriptions: Record<string, string> = {
      'Bull Market': 'Strong economic growth, low interest rates, high investor confidence',
      'Normal Market': 'Steady economic growth, moderate interest rates, stable markets',
      'Bear Market': 'Economic recession, high volatility, declining asset prices'
    };

    return descriptions[scenario] || 'Market scenario analysis';
  }

  /**
   * Calculate Value at Risk (VaR)
   */
  static calculateVaR(
    returns: number[],
    confidence: number = 0.95,
    timeHorizon: number = 1
  ): number {
    const sortedReturns = [...returns].sort((a, b) => a - b);
    const index = Math.floor((1 - confidence) * sortedReturns.length);
    const var95 = sortedReturns[index];

    return var95 * Math.sqrt(timeHorizon);
  }

  /**
   * Calculate Conditional Value at Risk (CVaR)
   */
  static calculateCVaR(
    returns: number[],
    confidence: number = 0.95
  ): number {
    const sortedReturns = [...returns].sort((a, b) => a - b);
    const cutoff = Math.floor((1 - confidence) * sortedReturns.length);
    const tailReturns = sortedReturns.slice(0, cutoff);

    return tailReturns.reduce((sum, ret) => sum + ret, 0) / tailReturns.length;
  }

  /**
   * Calculate Sharpe ratio
   */
  static calculateSharpeRatio(
    portfolioReturn: number,
    riskFreeRate: number,
    volatility: number
  ): number {
    return volatility !== 0 ? (portfolioReturn - riskFreeRate) / volatility : 0;
  }

  /**
   * Calculate maximum drawdown
   */
  static calculateMaxDrawdown(prices: number[]): number {
    let maxDrawdown = 0;
    let peak = prices[0];

    for (const price of prices) {
      if (price > peak) {
        peak = price;
      }
      const drawdown = (peak - price) / peak;
      maxDrawdown = Math.max(maxDrawdown, drawdown);
    }

    return maxDrawdown;
  }
}