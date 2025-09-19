import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { OptionPricingEngine } from '../option-valuation';
import type { OptionValuation } from '@/types/enterprise-dashboard';

describe('OptionPricingEngine', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset the spare random for Box-Muller
    (OptionPricingEngine as any).spareRandom = null;
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  describe('Black-Scholes Calculation', () => {
    it('calculates call option value correctly', () => {
      const result = OptionPricingEngine.calculateBlackScholes(
        100, // spotPrice
        100, // strikePrice
        1,   // timeToExpiry
        0.05, // riskFreeRate
        0.2,  // volatility
        'call'
      );

      expect(result).toBeGreaterThan(0);
      expect(result).toBeLessThan(100); // Should be reasonable
      expect(typeof result).toBe('number');
      expect(isFinite(result)).toBe(true);
    });

    it('calculates put option value correctly', () => {
      const result = OptionPricingEngine.calculateBlackScholes(
        100, // spotPrice
        100, // strikePrice
        1,   // timeToExpiry
        0.05, // riskFreeRate
        0.2,  // volatility
        'put'
      );

      expect(result).toBeGreaterThan(0);
      expect(result).toBeLessThan(100);
      expect(typeof result).toBe('number');
      expect(isFinite(result)).toBe(true);
    });

    it('handles in-the-money call options', () => {
      const result = OptionPricingEngine.calculateBlackScholes(
        120, // spotPrice (ITM)
        100, // strikePrice
        1,   // timeToExpiry
        0.05, // riskFreeRate
        0.2,  // volatility
        'call'
      );

      expect(result).toBeGreaterThan(20); // Should be > intrinsic value
      expect(result).toBeLessThan(120);
    });

    it('handles out-of-the-money call options', () => {
      const result = OptionPricingEngine.calculateBlackScholes(
        80,  // spotPrice (OTM)
        100, // strikePrice
        1,   // timeToExpiry
        0.05, // riskFreeRate
        0.2,  // volatility
        'call'
      );

      expect(result).toBeGreaterThan(0); // Should have time value
      expect(result).toBeLessThan(20);   // But less than if ITM
    });

    it('handles edge case: zero time to expiration', () => {
      const result = OptionPricingEngine.calculateBlackScholes(
        120, // spotPrice
        100, // strikePrice
        0.001, // timeToExpiry (very small)
        0.05, // riskFreeRate
        0.2,  // volatility
        'call'
      );

      expect(result).toBeCloseTo(20, 0); // Should approach intrinsic value
    });

    it('handles edge case: very high volatility', () => {
      const result = OptionPricingEngine.calculateBlackScholes(
        100, // spotPrice
        100, // strikePrice
        1,   // timeToExpiry
        0.05, // riskFreeRate
        2.0,  // volatility (very high)
        'call'
      );

      expect(result).toBeGreaterThan(0);
      expect(isFinite(result)).toBe(true);
    });

    it('satisfies put-call parity', () => {
      const S = 100, K = 100, T = 1, r = 0.05, v = 0.2;

      const callValue = OptionPricingEngine.calculateBlackScholes(S, K, T, r, v, 'call');
      const putValue = OptionPricingEngine.calculateBlackScholes(S, K, T, r, v, 'put');

      // Put-call parity: C - P = S - K*e^(-r*T)
      const parity = callValue - putValue;
      const expectedParity = S - K * Math.exp(-r * T);

      expect(parity).toBeCloseTo(expectedParity, 2);
    });
  });

  describe('Greeks Calculation', () => {
    it('calculates all Greeks correctly', () => {
      const greeks = OptionPricingEngine.calculateGreeks(
        100, // spotPrice
        100, // strikePrice
        1,   // timeToExpiry
        0.05, // riskFreeRate
        0.2,  // volatility
        'call'
      );

      expect(greeks).toHaveProperty('delta');
      expect(greeks).toHaveProperty('gamma');
      expect(greeks).toHaveProperty('theta');
      expect(greeks).toHaveProperty('vega');
      expect(greeks).toHaveProperty('rho');

      // Delta should be between 0 and 1 for call options
      expect(greeks.delta).toBeGreaterThan(0);
      expect(greeks.delta).toBeLessThan(1);

      // Gamma should be positive
      expect(greeks.gamma).toBeGreaterThan(0);

      // Theta should be negative for long options
      expect(greeks.theta).toBeLessThan(0);

      // Vega should be positive
      expect(greeks.vega).toBeGreaterThan(0);

      // Rho should be positive for call options
      expect(greeks.rho).toBeGreaterThan(0);
    });

    it('calculates delta correctly for put options', () => {
      const greeks = OptionPricingEngine.calculateGreeks(
        100, // spotPrice
        100, // strikePrice
        1,   // timeToExpiry
        0.05, // riskFreeRate
        0.2,  // volatility
        'put'
      );

      // Delta should be between -1 and 0 for put options
      expect(greeks.delta).toBeLessThan(0);
      expect(greeks.delta).toBeGreaterThan(-1);

      // Rho should be negative for put options
      expect(greeks.rho).toBeLessThan(0);
    });

    it('handles at-the-money options', () => {
      const greeks = OptionPricingEngine.calculateGreeks(
        100, // spotPrice = strikePrice
        100, // strikePrice
        1,   // timeToExpiry
        0.05, // riskFreeRate
        0.2,  // volatility
        'call'
      );

      // At-the-money call should have delta around 0.5 (allow for some variance)
      expect(greeks.delta).toBeGreaterThan(0.4);
      expect(greeks.delta).toBeLessThan(0.8);

      // Gamma should be at maximum for ATM options
      expect(greeks.gamma).toBeGreaterThan(0);
    });
  });

  describe('Implied Volatility Calculation', () => {
    it('calculates implied volatility correctly', () => {
      // First calculate a theoretical option price
      const theoreticalPrice = OptionPricingEngine.calculateBlackScholes(
        100, 100, 1, 0.05, 0.25, 'call'
      );

      // Then find the implied volatility
      const impliedVol = OptionPricingEngine.calculateImpliedVolatility(
        theoreticalPrice,
        100, // spotPrice
        100, // strikePrice
        1,   // timeToExpiry
        0.05, // riskFreeRate
        'call'
      );

      expect(impliedVol).toBeCloseTo(0.25, 2);
    });

    it('handles convergence for different option prices', () => {
      const impliedVol = OptionPricingEngine.calculateImpliedVolatility(
        15,   // marketPrice
        100,  // spotPrice
        100,  // strikePrice
        1,    // timeToExpiry
        0.05, // riskFreeRate
        'call'
      );

      expect(impliedVol).toBeGreaterThan(0);
      expect(impliedVol).toBeLessThan(2); // Should be reasonable
    });

    it('handles edge case: very low option price', () => {
      const impliedVol = OptionPricingEngine.calculateImpliedVolatility(
        0.01, // Very low price
        100,  // spotPrice
        100,  // strikePrice
        1,    // timeToExpiry
        0.05, // riskFreeRate
        'call'
      );

      expect(impliedVol).toBeGreaterThan(0);
      expect(isFinite(impliedVol)).toBe(true);
    });
  });

  describe('Complete Valuation', () => {
    it('provides comprehensive option analysis', () => {
      const valuation = OptionPricingEngine.getCompleteValuation(
        'TEST_OPTION',
        120, // spotPrice
        100, // strikePrice
        new Date('2025-12-31'),
        0.05, // riskFreeRate
        0.25, // volatility
        'call'
      );

      expect(valuation).toHaveProperty('symbol', 'TEST_OPTION');
      expect(valuation).toHaveProperty('type', 'call');
      expect(valuation).toHaveProperty('blackScholesValue');
      expect(valuation).toHaveProperty('delta');
      expect(valuation).toHaveProperty('gamma');
      expect(valuation).toHaveProperty('theta');
      expect(valuation).toHaveProperty('vega');
      expect(valuation).toHaveProperty('rho');
      expect(valuation).toHaveProperty('intrinsicValue');
      expect(valuation).toHaveProperty('timeValue');

      // Intrinsic value should be max(S-K, 0) for call
      expect(valuation.intrinsicValue).toBe(20);

      // Time value should be option value - intrinsic value
      expect(valuation.timeValue).toBe(
        valuation.blackScholesValue - valuation.intrinsicValue
      );
    });

    it('calculates put option valuation correctly', () => {
      const valuation = OptionPricingEngine.getCompleteValuation(
        'TEST_PUT',
        80,  // spotPrice
        100, // strikePrice
        new Date('2025-12-31'),
        0.05, // riskFreeRate
        0.25, // volatility
        'put'
      );

      expect(valuation.type).toBe('put');
      expect(valuation.intrinsicValue).toBe(20); // max(K-S, 0) = max(100-80, 0)
      expect(valuation.blackScholesValue).toBeGreaterThan(20);
    });
  });

  describe('Binomial Model', () => {
    it('calculates European option correctly', () => {
      const result = OptionPricingEngine.calculateBinomial(
        100, // spotPrice
        100, // strikePrice
        1,   // timeToExpiry
        0.05, // riskFreeRate
        0.2,  // volatility
        50,   // steps
        'call',
        'european'
      );

      expect(result).toBeGreaterThan(0);
      expect(isFinite(result)).toBe(true);

      // Should be close to Black-Scholes for European options
      const blackScholes = OptionPricingEngine.calculateBlackScholes(
        100, 100, 1, 0.05, 0.2, 'call'
      );
      expect(Math.abs(result - blackScholes)).toBeLessThan(2);
    });

    it('calculates American option correctly', () => {
      const result = OptionPricingEngine.calculateBinomial(
        100, // spotPrice
        100, // strikePrice
        1,   // timeToExpiry
        0.05, // riskFreeRate
        0.2,  // volatility
        50,   // steps
        'call',
        'american'
      );

      expect(result).toBeGreaterThan(0);
      expect(isFinite(result)).toBe(true);

      // American call should be >= European call (early exercise premium)
      const european = OptionPricingEngine.calculateBinomial(
        100, 100, 1, 0.05, 0.2, 50, 'call', 'european'
      );
      expect(result).toBeGreaterThanOrEqual(european);
    });

    it('handles different step counts', () => {
      const steps10 = OptionPricingEngine.calculateBinomial(
        100, 100, 1, 0.05, 0.2, 10, 'call', 'european'
      );
      const steps100 = OptionPricingEngine.calculateBinomial(
        100, 100, 1, 0.05, 0.2, 100, 'call', 'european'
      );

      expect(steps10).toBeGreaterThan(0);
      expect(steps100).toBeGreaterThan(0);

      // More steps should converge closer to Black-Scholes
      const blackScholes = OptionPricingEngine.calculateBlackScholes(
        100, 100, 1, 0.05, 0.2, 'call'
      );
      expect(Math.abs(steps100 - blackScholes)).toBeLessThan(
        Math.abs(steps10 - blackScholes)
      );
    });
  });

  describe('Monte Carlo Simulation', () => {
    it('provides simulation results with confidence intervals', () => {
      const result = OptionPricingEngine.calculateMonteCarlo(
        100, // spotPrice
        100, // strikePrice
        1,   // timeToExpiry
        0.05, // riskFreeRate
        0.2,  // volatility
        10000, // numSimulations
        'call'
      );

      expect(result).toHaveProperty('value');
      expect(result).toHaveProperty('standardError');
      expect(result).toHaveProperty('confidenceInterval');

      expect(result.value).toBeGreaterThan(0);
      expect(result.standardError).toBeGreaterThan(0);
      expect(Array.isArray(result.confidenceInterval)).toBe(true);
      expect(result.confidenceInterval).toHaveLength(2);
      expect(result.confidenceInterval[0]).toBeLessThan(result.confidenceInterval[1]);

      // Value should be within confidence interval
      expect(result.value).toBeGreaterThan(result.confidenceInterval[0]);
      expect(result.value).toBeLessThan(result.confidenceInterval[1]);
    });

    it('converges to Black-Scholes with many simulations', () => {
      const monteCarlo = OptionPricingEngine.calculateMonteCarlo(
        100, 100, 1, 0.05, 0.2, 100000, 'call'
      );

      const blackScholes = OptionPricingEngine.calculateBlackScholes(
        100, 100, 1, 0.05, 0.2, 'call'
      );

      // Should be within 2 standard errors
      const tolerance = 2 * monteCarlo.standardError;
      expect(Math.abs(monteCarlo.value - blackScholes)).toBeLessThan(tolerance);
    });

    it('handles put options correctly', () => {
      const result = OptionPricingEngine.calculateMonteCarlo(
        80,  // spotPrice
        100, // strikePrice
        1,   // timeToExpiry
        0.05, // riskFreeRate
        0.2,  // volatility
        10000,
        'put'
      );

      expect(result.value).toBeGreaterThan(0);
      expect(result.value).toBeGreaterThan(20); // Should be > intrinsic value
    });
  });

  describe('Portfolio Analysis', () => {
    it('analyzes options portfolio correctly', () => {
      const options: OptionValuation[] = [
        {
          symbol: 'OPTION1',
          type: 'call',
          strikePrice: 100,
          currentPrice: 110,
          expirationDate: new Date('2025-12-31'),
          impliedVolatility: 0.25,
          blackScholesValue: 15,
          delta: 0.6,
          gamma: 0.02,
          theta: -5,
          vega: 20,
          rho: 10,
          intrinsicValue: 10,
          timeValue: 5,
          profitLoss: 5
        },
        {
          symbol: 'OPTION2',
          type: 'put',
          strikePrice: 90,
          currentPrice: 110,
          expirationDate: new Date('2025-12-31'),
          impliedVolatility: 0.3,
          blackScholesValue: 3,
          delta: -0.15,
          gamma: 0.01,
          theta: -2,
          vega: 8,
          rho: -3,
          intrinsicValue: 0,
          timeValue: 3,
          profitLoss: -2
        }
      ];

      const portfolio = OptionPricingEngine.analyzeOptionsPortfolio(options);

      expect(portfolio).toHaveProperty('totalValue', 18);
      expect(portfolio.totalDelta).toBeCloseTo(0.45, 2);
      expect(portfolio).toHaveProperty('totalGamma', 0.03);
      expect(portfolio).toHaveProperty('totalTheta', -7);
      expect(portfolio).toHaveProperty('totalVega', 28);
      expect(portfolio).toHaveProperty('totalRho', 7);
      expect(portfolio).toHaveProperty('riskMetrics');

      expect(portfolio.riskMetrics).toHaveProperty('maxLoss');
      expect(portfolio.riskMetrics).toHaveProperty('maxGain');
      expect(portfolio.riskMetrics).toHaveProperty('breakeven');
      expect(Array.isArray(portfolio.riskMetrics.breakeven)).toBe(true);
    });

    it('handles empty portfolio', () => {
      const portfolio = OptionPricingEngine.analyzeOptionsPortfolio([]);

      expect(portfolio.totalValue).toBe(0);
      expect(portfolio.totalDelta).toBe(0);
      expect(portfolio.totalGamma).toBe(0);
      expect(portfolio.totalTheta).toBe(0);
      expect(portfolio.totalVega).toBe(0);
      expect(portfolio.totalRho).toBe(0);
    });

    it('calculates portfolio risk metrics correctly', () => {
      const options: OptionValuation[] = [
        {
          symbol: 'HIGH_RISK',
          type: 'call',
          strikePrice: 200,
          currentPrice: 100,
          expirationDate: new Date('2025-01-01'),
          impliedVolatility: 0.8,
          blackScholesValue: 5,
          delta: 0.1,
          gamma: 0.001,
          theta: -15,
          vega: 40,
          rho: 2,
          intrinsicValue: 0,
          timeValue: 5,
          profitLoss: -10
        }
      ];

      const portfolio = OptionPricingEngine.analyzeOptionsPortfolio(options);

      expect(portfolio.riskMetrics.maxLoss).toBe(5); // Maximum loss is the premium paid
      expect(portfolio.riskMetrics.breakeven[0]).toBe(205); // Strike + premium
    });
  });

  describe('Mathematical Functions', () => {
    it('calculates normal CDF correctly', () => {
      // Test known values
      const cdf0 = (OptionPricingEngine as any).normalCDF(0);
      expect(cdf0).toBeCloseTo(0.5, 3);

      const cdf1 = (OptionPricingEngine as any).normalCDF(1);
      expect(cdf1).toBeCloseTo(0.8413, 3);

      const cdfNeg1 = (OptionPricingEngine as any).normalCDF(-1);
      expect(cdfNeg1).toBeCloseTo(0.1587, 3);
    });

    it('calculates normal PDF correctly', () => {
      const pdf0 = (OptionPricingEngine as any).normalPDF(0);
      expect(pdf0).toBeCloseTo(0.3989, 3);

      const pdf1 = (OptionPricingEngine as any).normalPDF(1);
      expect(pdf1).toBeCloseTo(0.2420, 3);
    });

    it('calculates error function correctly', () => {
      const erf0 = (OptionPricingEngine as any).erf(0);
      expect(erf0).toBeCloseTo(0, 3);

      const erf1 = (OptionPricingEngine as any).erf(1);
      expect(erf1).toBeCloseTo(0.8427, 3);

      const erfNeg1 = (OptionPricingEngine as any).erf(-1);
      expect(erfNeg1).toBeCloseTo(-0.8427, 3);
    });

    it('generates normal random variables correctly', () => {
      const samples: number[] = [];
      for (let i = 0; i < 1000; i++) {
        samples.push((OptionPricingEngine as any).generateRandomNormal());
      }

      // Check basic properties of normal distribution
      const mean = samples.reduce((sum, x) => sum + x, 0) / samples.length;
      const variance = samples.reduce((sum, x) => sum + (x - mean) ** 2, 0) / samples.length;

      expect(Math.abs(mean)).toBeLessThan(0.1); // Should be close to 0
      expect(Math.abs(variance - 1)).toBeLessThan(0.2); // Should be close to 1
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('handles zero volatility gracefully', () => {
      const result = OptionPricingEngine.calculateBlackScholes(
        120, 100, 1, 0.05, 0.0001, 'call' // Very low volatility
      );

      expect(isFinite(result)).toBe(true);
      expect(result).toBeCloseTo(20, 0); // Should approach intrinsic value
    });

    it('handles negative time to expiration', () => {
      const result = OptionPricingEngine.calculateBlackScholes(
        120, 100, -0.1, 0.05, 0.2, 'call'
      );

      // Should handle gracefully, possibly return intrinsic value
      expect(isFinite(result)).toBe(true);
    });

    it('handles extreme strike prices', () => {
      const veryOTM = OptionPricingEngine.calculateBlackScholes(
        100, 1000, 1, 0.05, 0.2, 'call'
      );
      expect(veryOTM).toBeCloseTo(0, 1);

      const veryITM = OptionPricingEngine.calculateBlackScholes(
        1000, 100, 1, 0.05, 0.2, 'call'
      );
      expect(veryITM).toBeCloseTo(900, 0);
    });

    it('handles zero interest rates', () => {
      const result = OptionPricingEngine.calculateBlackScholes(
        100, 100, 1, 0, 0.2, 'call'
      );

      expect(result).toBeGreaterThan(0);
      expect(isFinite(result)).toBe(true);
    });

    it('handles very short time periods in binomial model', () => {
      const result = OptionPricingEngine.calculateBinomial(
        100, 100, 0.01, 0.05, 0.2, 10, 'call', 'american'
      );

      expect(result).toBeGreaterThan(0);
      expect(isFinite(result)).toBe(true);
    });

    it('handles division by zero in Greeks calculations', () => {
      const greeks = OptionPricingEngine.calculateGreeks(
        100, 100, 0.001, 0.05, 0.001, 'call'
      );

      expect(isFinite(greeks.delta)).toBe(true);
      expect(isFinite(greeks.gamma)).toBe(true);
      expect(isFinite(greeks.theta)).toBe(true);
      expect(isFinite(greeks.vega)).toBe(true);
      expect(isFinite(greeks.rho)).toBe(true);
    });
  });

  describe('Performance Tests', () => {
    it('calculates Black-Scholes efficiently', () => {
      const startTime = performance.now();

      for (let i = 0; i < 1000; i++) {
        OptionPricingEngine.calculateBlackScholes(
          100 + i * 0.1, 100, 1, 0.05, 0.2, 'call'
        );
      }

      const endTime = performance.now();
      const duration = endTime - startTime;

      // Should complete 1000 calculations in reasonable time
      expect(duration).toBeLessThan(100); // 100ms
    });

    it('calculates Greeks efficiently', () => {
      const startTime = performance.now();

      for (let i = 0; i < 500; i++) {
        OptionPricingEngine.calculateGreeks(
          100 + i * 0.1, 100, 1, 0.05, 0.2, 'call'
        );
      }

      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(200); // 200ms
    });

    it('handles large portfolio analysis efficiently', () => {
      const largePortfolio: OptionValuation[] = Array.from({ length: 100 }, (_, i) => ({
        symbol: `OPTION_${i}`,
        type: i % 2 === 0 ? 'call' : 'put',
        strikePrice: 100 + i,
        currentPrice: 105,
        expirationDate: new Date('2025-12-31'),
        impliedVolatility: 0.2 + i * 0.001,
        blackScholesValue: 5 + i * 0.1,
        delta: 0.5 + i * 0.001,
        gamma: 0.02,
        theta: -5,
        vega: 20,
        rho: 10,
        intrinsicValue: Math.max(0, (i % 2 === 0 ? 105 - (100 + i) : (100 + i) - 105)),
        timeValue: 5,
        profitLoss: i * 0.1
      }));

      const startTime = performance.now();
      const result = OptionPricingEngine.analyzeOptionsPortfolio(largePortfolio);
      const endTime = performance.now();

      expect(endTime - startTime).toBeLessThan(50); // 50ms
      expect(result.totalValue).toBeGreaterThan(0);
      expect(result.riskMetrics.breakeven.length).toBe(100);
    });
  });

  describe('Data Validation and Consistency', () => {
    it('ensures option values are non-negative', () => {
      const callValue = OptionPricingEngine.calculateBlackScholes(
        50, 100, 1, 0.05, 0.2, 'call'
      );
      const putValue = OptionPricingEngine.calculateBlackScholes(
        150, 100, 1, 0.05, 0.2, 'put'
      );

      expect(callValue).toBeGreaterThanOrEqual(0);
      expect(putValue).toBeGreaterThanOrEqual(0);
    });

    it('validates intrinsic value calculations', () => {
      const callIntrinsic = (OptionPricingEngine as any).calculateIntrinsicValue(120, 100, 'call');
      const putIntrinsic = (OptionPricingEngine as any).calculateIntrinsicValue(80, 100, 'put');

      expect(callIntrinsic).toBe(20);
      expect(putIntrinsic).toBe(20);

      const otmCallIntrinsic = (OptionPricingEngine as any).calculateIntrinsicValue(80, 100, 'call');
      const otmPutIntrinsic = (OptionPricingEngine as any).calculateIntrinsicValue(120, 100, 'put');

      expect(otmCallIntrinsic).toBe(0);
      expect(otmPutIntrinsic).toBe(0);
    });

    it('ensures time value is non-negative', () => {
      const valuation = OptionPricingEngine.getCompleteValuation(
        'TEST',
        120, 100,
        new Date('2025-12-31'),
        0.05, 0.2, 'call'
      );

      expect(valuation.timeValue).toBeGreaterThanOrEqual(0);
      expect(valuation.blackScholesValue).toBeGreaterThanOrEqual(valuation.intrinsicValue);
    });

    it('validates moneyness consistency', () => {
      // Deep ITM call should have high delta
      const deepITMGreeks = OptionPricingEngine.calculateGreeks(
        150, 100, 1, 0.05, 0.2, 'call'
      );
      expect(deepITMGreeks.delta).toBeGreaterThan(0.8);

      // Deep OTM call should have low delta
      const deepOTMGreeks = OptionPricingEngine.calculateGreeks(
        50, 100, 1, 0.05, 0.2, 'call'
      );
      expect(deepOTMGreeks.delta).toBeLessThan(0.2);
    });
  });
});