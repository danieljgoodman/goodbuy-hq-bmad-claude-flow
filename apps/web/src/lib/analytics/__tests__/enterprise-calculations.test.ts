import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { EnterpriseAnalytics } from '../enterprise-calculations';
import type {
  EnterpriseMetrics,
  PortfolioAllocation,
  BenchmarkComparison,
  ScenarioResult
} from '@/types/enterprise-dashboard';

describe('EnterpriseAnalytics', () => {
  let mockAllocations: PortfolioAllocation[];

  beforeEach(() => {
    vi.clearAllMocks();

    mockAllocations = [
      {
        assetClass: 'Large-Cap Stocks',
        allocation: 40,
        totalValue: 40000000,
        performance: 0.12,
        riskLevel: 'medium' as const
      },
      {
        assetClass: 'Government Bonds',
        allocation: 30,
        totalValue: 30000000,
        performance: 0.04,
        riskLevel: 'low' as const
      },
      {
        assetClass: 'Real Estate',
        allocation: 20,
        totalValue: 20000000,
        performance: 0.08,
        riskLevel: 'medium' as const
      },
      {
        assetClass: 'Alternatives',
        allocation: 10,
        totalValue: 10000000,
        performance: 0.15,
        riskLevel: 'high' as const
      }
    ];
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  describe('Portfolio Metrics Calculation', () => {
    it('calculates total portfolio value correctly', () => {
      const metrics = EnterpriseAnalytics.calculatePortfolioMetrics(mockAllocations);

      expect(metrics.totalInvestmentValue).toBe(100000000);
    });

    it('calculates weighted returns correctly', () => {
      const metrics = EnterpriseAnalytics.calculatePortfolioMetrics(mockAllocations);

      // Weighted return = (40% * 12%) + (30% * 4%) + (20% * 8%) + (10% * 15%)
      // = 4.8% + 1.2% + 1.6% + 1.5% = 9.1%
      expect(metrics.portfolioGrowthRate).toBeCloseTo(0.091, 3);
    });

    it('calculates diversification index using HHI', () => {
      const metrics = EnterpriseAnalytics.calculatePortfolioMetrics(mockAllocations);

      // HHI = (0.4)² + (0.3)² + (0.2)² + (0.1)² = 0.16 + 0.09 + 0.04 + 0.01 = 0.30
      // Diversification Index = (1 - 0.30) * 100 = 70
      expect(metrics.diversificationIndex).toBe(70);
    });

    it('calculates risk score appropriately', () => {
      const metrics = EnterpriseAnalytics.calculatePortfolioMetrics(mockAllocations);

      // Risk mapping: low=1, medium=2, high=3
      // Weighted risk = (40% * 2) + (30% * 1) + (20% * 2) + (10% * 3)
      // = 0.8 + 0.3 + 0.4 + 0.3 = 1.8
      // Scaled: (1.8 / 3) * 100 = 60
      expect(metrics.riskAssessmentScore).toBe(60);
    });

    it('calculates liquidity ratio correctly', () => {
      const metrics = EnterpriseAnalytics.calculatePortfolioMetrics(mockAllocations);

      // Liquid assets: Government Bonds (30M) + Large-Cap Stocks (40M) = 70M
      // Liquidity ratio = 70M / 100M = 70%
      expect(metrics.liquidityRatio).toBe(70);
    });

    it('calculates expected annual return based on asset classes', () => {
      const metrics = EnterpriseAnalytics.calculatePortfolioMetrics(mockAllocations);

      expect(metrics.expectedAnnualReturn).toBeGreaterThan(0.05);
      expect(metrics.expectedAnnualReturn).toBeLessThan(0.15);
    });

    it('calculates volatility index from risk levels', () => {
      const metrics = EnterpriseAnalytics.calculatePortfolioMetrics(mockAllocations);

      expect(metrics.volatilityIndex).toBeGreaterThan(0);
      expect(metrics.volatilityIndex).toBeLessThan(30);
    });
  });

  describe('Diversification Analysis', () => {
    it('handles perfectly diversified portfolio', () => {
      const equalAllocations: PortfolioAllocation[] = [
        { assetClass: 'Stocks', allocation: 25, totalValue: 25000000, performance: 0.1, riskLevel: 'medium' },
        { assetClass: 'Bonds', allocation: 25, totalValue: 25000000, performance: 0.05, riskLevel: 'low' },
        { assetClass: 'Real Estate', allocation: 25, totalValue: 25000000, performance: 0.08, riskLevel: 'medium' },
        { assetClass: 'Commodities', allocation: 25, totalValue: 25000000, performance: 0.06, riskLevel: 'high' }
      ];

      const metrics = EnterpriseAnalytics.calculatePortfolioMetrics(equalAllocations);

      // HHI = 4 * (0.25)² = 4 * 0.0625 = 0.25
      // Diversification = (1 - 0.25) * 100 = 75
      expect(metrics.diversificationIndex).toBe(75);
    });

    it('handles concentrated portfolio', () => {
      const concentratedAllocations: PortfolioAllocation[] = [
        { assetClass: 'Stocks', allocation: 90, totalValue: 90000000, performance: 0.1, riskLevel: 'medium' },
        { assetClass: 'Cash', allocation: 10, totalValue: 10000000, performance: 0.02, riskLevel: 'low' }
      ];

      const metrics = EnterpriseAnalytics.calculatePortfolioMetrics(concentratedAllocations);

      // HHI = (0.9)² + (0.1)² = 0.81 + 0.01 = 0.82
      // Diversification = (1 - 0.82) * 100 = 18
      expect(metrics.diversificationIndex).toBe(18);
    });

    it('handles single asset portfolio', () => {
      const singleAsset: PortfolioAllocation[] = [
        { assetClass: 'Stocks', allocation: 100, totalValue: 100000000, performance: 0.1, riskLevel: 'medium' }
      ];

      const metrics = EnterpriseAnalytics.calculatePortfolioMetrics(singleAsset);

      // HHI = (1.0)² = 1.0
      // Diversification = (1 - 1.0) * 100 = 0
      expect(metrics.diversificationIndex).toBe(0);
    });
  });

  describe('Benchmark Comparison', () => {
    it('calculates benchmark outperformance correctly', () => {
      const portfolioReturn = 0.12;
      const benchmarkReturn = 0.10;
      const returns = [0.11, 0.13, 0.09, 0.14, 0.08];

      const comparison = EnterpriseAnalytics.calculateBenchmarkComparison(
        portfolioReturn,
        benchmarkReturn,
        returns
      );

      expect(comparison.portfolioReturn).toBe(0.12);
      expect(comparison.benchmarkReturn).toBe(0.10);
      expect(comparison.outperformance).toBeCloseTo(0.02, 2);
      expect(comparison.benchmarkName).toBe('S&P 500');
      expect(comparison.period).toBe('1Y');
    });

    it('calculates tracking error correctly', () => {
      const portfolioReturn = 0.10;
      const benchmarkReturn = 0.10;
      const returns = [0.08, 0.12, 0.09, 0.11, 0.10]; // Some deviation from benchmark

      const comparison = EnterpriseAnalytics.calculateBenchmarkComparison(
        portfolioReturn,
        benchmarkReturn,
        returns
      );

      expect(comparison.trackingError).toBeGreaterThan(0);
      expect(isFinite(comparison.informationRatio)).toBe(true);
    });

    it('handles zero tracking error', () => {
      const portfolioReturn = 0.10;
      const benchmarkReturn = 0.10;
      const returns = [0.10, 0.10, 0.10, 0.10, 0.10]; // Perfect tracking

      const comparison = EnterpriseAnalytics.calculateBenchmarkComparison(
        portfolioReturn,
        benchmarkReturn,
        returns
      );

      expect(comparison.outperformance).toBe(0);
      expect(comparison.informationRatio).toBe(0);
    });

    it('calculates information ratio when tracking error exists', () => {
      const portfolioReturn = 0.12;
      const benchmarkReturn = 0.10;
      const returns = [0.11, 0.13, 0.09, 0.14, 0.10];

      const comparison = EnterpriseAnalytics.calculateBenchmarkComparison(
        portfolioReturn,
        benchmarkReturn,
        returns
      );

      expect(comparison.informationRatio).toBeGreaterThan(0);
      expect(isFinite(comparison.informationRatio)).toBe(true);
    });
  });

  describe('Scenario Analysis', () => {
    it('runs Monte Carlo scenario analysis', () => {
      const scenarios = EnterpriseAnalytics.runScenarioAnalysis(mockAllocations, 1, 1000);

      expect(scenarios).toHaveLength(3); // Bull, Normal, Bear
      expect(scenarios[0].scenario).toBe('Bull Market');
      expect(scenarios[1].scenario).toBe('Normal Market');
      expect(scenarios[2].scenario).toBe('Bear Market');

      scenarios.forEach(scenario => {
        expect(scenario.probability).toBeGreaterThan(0);
        expect(scenario.probability).toBeLessThanOrEqual(1);
        expect(typeof scenario.expectedReturn).toBe('number');
        expect(typeof scenario.worstCase).toBe('number');
        expect(typeof scenario.bestCase).toBe('number');
        expect(scenario.worstCase).toBeLessThan(scenario.bestCase);
      });
    });

    it('provides scenario descriptions', () => {
      const scenarios = EnterpriseAnalytics.runScenarioAnalysis(mockAllocations);

      expect(scenarios[0].description).toContain('Strong economic growth');
      expect(scenarios[1].description).toContain('Steady economic growth');
      expect(scenarios[2].description).toContain('Economic recession');
    });

    it('handles different time horizons', () => {
      const oneYear = EnterpriseAnalytics.runScenarioAnalysis(mockAllocations, 1);
      const fiveYear = EnterpriseAnalytics.runScenarioAnalysis(mockAllocations, 5);

      expect(oneYear).toHaveLength(3);
      expect(fiveYear).toHaveLength(3);

      // Five-year scenarios should generally have wider ranges
      expect(Math.abs(fiveYear[0].bestCase - fiveYear[0].worstCase))
        .toBeGreaterThan(Math.abs(oneYear[0].bestCase - oneYear[0].worstCase));
    });

    it('assigns appropriate probabilities to scenarios', () => {
      const scenarios = EnterpriseAnalytics.runScenarioAnalysis(mockAllocations);

      const totalProbability = scenarios.reduce((sum, s) => sum + s.probability, 0);
      expect(totalProbability).toBeCloseTo(1.0, 2);

      // Normal market should have highest probability
      const normalScenario = scenarios.find(s => s.scenario === 'Normal Market');
      expect(normalScenario!.probability).toBe(0.70);
    });
  });

  describe('Risk Metrics', () => {
    it('calculates Value at Risk correctly', () => {
      const returns = [-0.15, -0.08, -0.03, 0.02, 0.05, 0.08, 0.12, 0.15, 0.18, 0.22];

      const var95 = EnterpriseAnalytics.calculateVaR(returns, 0.95);

      expect(var95).toBeLessThan(0); // VaR should be negative (loss)
      expect(var95).toBeGreaterThan(-0.20);
    });

    it('calculates Conditional Value at Risk correctly', () => {
      const returns = [-0.20, -0.15, -0.10, -0.05, 0.00, 0.05, 0.10, 0.15, 0.20, 0.25];

      const cvar95 = EnterpriseAnalytics.calculateCVaR(returns, 0.95);

      expect(cvar95).toBeLessThan(0); // CVaR should be negative

      const var95 = EnterpriseAnalytics.calculateVaR(returns, 0.95);
      expect(cvar95).toBeLessThan(var95); // CVaR should be worse than VaR
    });

    it('calculates Sharpe ratio correctly', () => {
      const portfolioReturn = 0.12;
      const riskFreeRate = 0.03;
      const volatility = 0.15;

      const sharpe = EnterpriseAnalytics.calculateSharpeRatio(portfolioReturn, riskFreeRate, volatility);

      expect(sharpe).toBeCloseTo(0.6, 1); // (0.12 - 0.03) / 0.15 = 0.6
    });

    it('handles zero volatility in Sharpe ratio', () => {
      const sharpe = EnterpriseAnalytics.calculateSharpeRatio(0.05, 0.03, 0);

      expect(sharpe).toBe(0);
    });

    it('calculates maximum drawdown correctly', () => {
      const prices = [100, 110, 105, 120, 115, 90, 95, 105, 100, 110];

      const maxDrawdown = EnterpriseAnalytics.calculateMaxDrawdown(prices);

      // Max was 120, min after that was 90, so drawdown = (120-90)/120 = 25%
      expect(maxDrawdown).toBeCloseTo(0.25, 2);
    });

    it('handles monotonically increasing prices', () => {
      const prices = [100, 105, 110, 115, 120];

      const maxDrawdown = EnterpriseAnalytics.calculateMaxDrawdown(prices);

      expect(maxDrawdown).toBe(0); // No drawdown
    });

    it('handles single price point', () => {
      const prices = [100];

      const maxDrawdown = EnterpriseAnalytics.calculateMaxDrawdown(prices);

      expect(maxDrawdown).toBe(0);
    });
  });

  describe('Asset Class Beta Mapping', () => {
    it('assigns appropriate betas to asset classes', () => {
      const getBeta = (EnterpriseAnalytics as any).getAssetClassBeta;

      expect(getBeta('large-cap-stocks')).toBe(1.0);
      expect(getBeta('small-cap-stocks')).toBe(1.2);
      expect(getBeta('government-bonds')).toBe(0.1);
      expect(getBeta('cash')).toBe(0.0);
      expect(getBeta('crypto')).toBe(2.0);
      expect(getBeta('unknown-asset')).toBe(1.0); // Default
    });

    it('handles case insensitive asset class names', () => {
      const getBeta = (EnterpriseAnalytics as any).getAssetClassBeta;

      expect(getBeta('LARGE-CAP-STOCKS')).toBe(1.0);
      expect(getBeta('Large-Cap-Stocks')).toBe(1.0);
      expect(getBeta('large-cap-stocks')).toBe(1.0);
    });
  });

  describe('Performance Tests', () => {
    it('calculates portfolio metrics efficiently for large portfolios', () => {
      const largePortfolio: PortfolioAllocation[] = Array.from({ length: 100 }, (_, i) => ({
        assetClass: `Asset_${i}`,
        allocation: 1,
        totalValue: 1000000,
        performance: 0.05 + (i * 0.001),
        riskLevel: ['low', 'medium', 'high'][i % 3] as 'low' | 'medium' | 'high'
      }));

      const startTime = performance.now();
      const metrics = EnterpriseAnalytics.calculatePortfolioMetrics(largePortfolio);
      const endTime = performance.now();

      expect(endTime - startTime).toBeLessThan(50); // Should complete quickly
      expect(metrics.totalInvestmentValue).toBe(100000000);
    });

    it('runs scenario analysis efficiently', () => {
      const startTime = performance.now();
      const scenarios = EnterpriseAnalytics.runScenarioAnalysis(mockAllocations, 5, 10000);
      const endTime = performance.now();

      expect(endTime - startTime).toBeLessThan(200); // Should complete reasonably quickly
      expect(scenarios).toHaveLength(3);
    });

    it('calculates risk metrics efficiently for large datasets', () => {
      const largeReturns = Array.from({ length: 10000 }, () => (Math.random() - 0.5) * 0.4);

      const startTime = performance.now();
      const var95 = EnterpriseAnalytics.calculateVaR(largeReturns);
      const cvar95 = EnterpriseAnalytics.calculateCVaR(largeReturns);
      const endTime = performance.now();

      expect(endTime - startTime).toBeLessThan(100);
      expect(typeof var95).toBe('number');
      expect(typeof cvar95).toBe('number');
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('handles empty portfolio gracefully', () => {
      const metrics = EnterpriseAnalytics.calculatePortfolioMetrics([]);

      expect(metrics.totalInvestmentValue).toBe(0);
      expect(metrics.portfolioGrowthRate).toBe(0);
      expect(metrics.diversificationIndex).toBe(0);
      expect(metrics.riskAssessmentScore).toBe(0);
      expect(metrics.liquidityRatio).toBe(0);
    });

    it('handles single asset portfolio', () => {
      const singleAsset: PortfolioAllocation[] = [{
        assetClass: 'Stocks',
        allocation: 100,
        totalValue: 100000000,
        performance: 0.1,
        riskLevel: 'medium'
      }];

      const metrics = EnterpriseAnalytics.calculatePortfolioMetrics(singleAsset);

      expect(metrics.totalInvestmentValue).toBe(100000000);
      expect(metrics.portfolioGrowthRate).toBe(0.1);
      expect(metrics.diversificationIndex).toBe(0); // No diversification
    });

    it('handles zero total value portfolio', () => {
      const zeroValuePortfolio: PortfolioAllocation[] = [{
        assetClass: 'Stocks',
        allocation: 100,
        totalValue: 0,
        performance: 0.1,
        riskLevel: 'medium'
      }];

      const metrics = EnterpriseAnalytics.calculatePortfolioMetrics(zeroValuePortfolio);

      expect(metrics.totalInvestmentValue).toBe(0);
      expect(isFinite(metrics.portfolioGrowthRate)).toBe(true);
    });

    it('handles negative returns in risk calculations', () => {
      const negativeReturns = [-0.3, -0.2, -0.1, -0.05, -0.02];

      const var95 = EnterpriseAnalytics.calculateVaR(negativeReturns);
      const cvar95 = EnterpriseAnalytics.calculateCVaR(negativeReturns);

      expect(var95).toBeLessThan(0);
      expect(cvar95).toBeLessThan(0);
      expect(cvar95).toBeLessThan(var95);
    });

    it('handles extreme volatility values', () => {
      const extremeReturns = [-0.9, -0.5, 0.0, 0.5, 0.9];

      const var95 = EnterpriseAnalytics.calculateVaR(extremeReturns);
      const sharpe = EnterpriseAnalytics.calculateSharpeRatio(0.1, 0.03, 0.8);

      expect(isFinite(var95)).toBe(true);
      expect(isFinite(sharpe)).toBe(true);
    });
  });

  describe('Data Validation', () => {
    it('ensures diversification index is between 0 and 100', () => {
      const metrics = EnterpriseAnalytics.calculatePortfolioMetrics(mockAllocations);

      expect(metrics.diversificationIndex).toBeGreaterThanOrEqual(0);
      expect(metrics.diversificationIndex).toBeLessThanOrEqual(100);
    });

    it('ensures risk score is between 0 and 100', () => {
      const metrics = EnterpriseAnalytics.calculatePortfolioMetrics(mockAllocations);

      expect(metrics.riskAssessmentScore).toBeGreaterThanOrEqual(0);
      expect(metrics.riskAssessmentScore).toBeLessThanOrEqual(100);
    });

    it('ensures liquidity ratio is between 0 and 100', () => {
      const metrics = EnterpriseAnalytics.calculatePortfolioMetrics(mockAllocations);

      expect(metrics.liquidityRatio).toBeGreaterThanOrEqual(0);
      expect(metrics.liquidityRatio).toBeLessThanOrEqual(100);
    });

    it('validates scenario probabilities sum to 1', () => {
      const scenarios = EnterpriseAnalytics.runScenarioAnalysis(mockAllocations);

      const totalProbability = scenarios.reduce((sum, s) => sum + s.probability, 0);
      expect(totalProbability).toBeCloseTo(1.0, 2);
    });

    it('ensures expected returns are reasonable', () => {
      const metrics = EnterpriseAnalytics.calculatePortfolioMetrics(mockAllocations);

      expect(metrics.expectedAnnualReturn).toBeGreaterThan(-0.5); // -50% minimum
      expect(metrics.expectedAnnualReturn).toBeLessThan(0.5);     // 50% maximum
    });
  });

  describe('Mathematical Consistency', () => {
    it('ensures VaR is less severe than CVaR', () => {
      const returns = [-0.2, -0.15, -0.1, -0.05, 0, 0.05, 0.1, 0.15, 0.2, 0.25];

      const var95 = EnterpriseAnalytics.calculateVaR(returns, 0.95);
      const cvar95 = EnterpriseAnalytics.calculateCVaR(returns, 0.95);

      expect(cvar95).toBeLessThanOrEqual(var95); // CVaR should be worse (more negative)
    });

    it('validates Sharpe ratio calculation', () => {
      const portfolioReturn = 0.15;
      const riskFreeRate = 0.05;
      const volatility = 0.20;

      const sharpe = EnterpriseAnalytics.calculateSharpeRatio(portfolioReturn, riskFreeRate, volatility);

      // Manual calculation: (0.15 - 0.05) / 0.20 = 0.5
      expect(sharpe).toBeCloseTo(0.5, 3);
    });

    it('ensures maximum drawdown is between 0 and 1', () => {
      const prices = [100, 80, 120, 60, 140];

      const maxDrawdown = EnterpriseAnalytics.calculateMaxDrawdown(prices);

      expect(maxDrawdown).toBeGreaterThanOrEqual(0);
      expect(maxDrawdown).toBeLessThanOrEqual(1);
    });

    it('validates portfolio return calculation consistency', () => {
      const metrics = EnterpriseAnalytics.calculatePortfolioMetrics(mockAllocations);

      // Manual calculation of weighted return
      const manualReturn = mockAllocations.reduce((sum, allocation) => {
        const weight = allocation.totalValue / 100000000;
        return sum + (allocation.performance * weight);
      }, 0);

      expect(metrics.portfolioGrowthRate).toBeCloseTo(manualReturn, 6);
    });
  });

  describe('Asset Class Mapping', () => {
    it('correctly identifies liquid asset classes', () => {
      const liquidPortfolio: PortfolioAllocation[] = [
        { assetClass: 'Cash', allocation: 20, totalValue: 20000000, performance: 0.02, riskLevel: 'low' },
        { assetClass: 'Government-Bonds', allocation: 30, totalValue: 30000000, performance: 0.04, riskLevel: 'low' },
        { assetClass: 'Large-Cap-Stocks', allocation: 50, totalValue: 50000000, performance: 0.10, riskLevel: 'medium' }
      ];

      const metrics = EnterpriseAnalytics.calculatePortfolioMetrics(liquidPortfolio);

      // All assets should be considered liquid
      expect(metrics.liquidityRatio).toBe(100);
    });

    it('correctly identifies illiquid asset classes', () => {
      const illiquidPortfolio: PortfolioAllocation[] = [
        { assetClass: 'Private Equity', allocation: 40, totalValue: 40000000, performance: 0.15, riskLevel: 'high' },
        { assetClass: 'Real Estate', allocation: 30, totalValue: 30000000, performance: 0.08, riskLevel: 'medium' },
        { assetClass: 'Commodities', allocation: 30, totalValue: 30000000, performance: 0.06, riskLevel: 'medium' }
      ];

      const metrics = EnterpriseAnalytics.calculatePortfolioMetrics(illiquidPortfolio);

      // No liquid assets
      expect(metrics.liquidityRatio).toBe(0);
    });

    it('handles mixed liquidity portfolio', () => {
      const mixedPortfolio: PortfolioAllocation[] = [
        { assetClass: 'Cash', allocation: 25, totalValue: 25000000, performance: 0.02, riskLevel: 'low' },
        { assetClass: 'Private Equity', allocation: 25, totalValue: 25000000, performance: 0.15, riskLevel: 'high' },
        { assetClass: 'Government-Bonds', allocation: 25, totalValue: 25000000, performance: 0.04, riskLevel: 'low' },
        { assetClass: 'Real Estate', allocation: 25, totalValue: 25000000, performance: 0.08, riskLevel: 'medium' }
      ];

      const metrics = EnterpriseAnalytics.calculatePortfolioMetrics(mixedPortfolio);

      // 50% liquid (Cash + Government-Bonds)
      expect(metrics.liquidityRatio).toBe(50);
    });
  });
});