// Financial Option Valuation
// Advanced option pricing models for Enterprise investment analysis

import type { OptionValuation } from '@/types/enterprise-dashboard';

export class OptionPricingEngine {
  /**
   * Black-Scholes option pricing model
   */
  static calculateBlackScholes(
    spotPrice: number,
    strikePrice: number,
    timeToExpiry: number,
    riskFreeRate: number,
    volatility: number,
    optionType: 'call' | 'put' = 'call'
  ): number {
    const d1 = this.calculateD1(spotPrice, strikePrice, timeToExpiry, riskFreeRate, volatility);
    const d2 = d1 - volatility * Math.sqrt(timeToExpiry);

    if (optionType === 'call') {
      return (
        spotPrice * this.normalCDF(d1) -
        strikePrice * Math.exp(-riskFreeRate * timeToExpiry) * this.normalCDF(d2)
      );
    } else {
      return (
        strikePrice * Math.exp(-riskFreeRate * timeToExpiry) * this.normalCDF(-d2) -
        spotPrice * this.normalCDF(-d1)
      );
    }
  }

  /**
   * Calculate option Greeks
   */
  static calculateGreeks(
    spotPrice: number,
    strikePrice: number,
    timeToExpiry: number,
    riskFreeRate: number,
    volatility: number,
    optionType: 'call' | 'put' = 'call'
  ) {
    const d1 = this.calculateD1(spotPrice, strikePrice, timeToExpiry, riskFreeRate, volatility);
    const d2 = d1 - volatility * Math.sqrt(timeToExpiry);

    const delta = this.calculateDelta(d1, optionType);
    const gamma = this.calculateGamma(spotPrice, d1, volatility, timeToExpiry);
    const theta = this.calculateTheta(spotPrice, strikePrice, d1, d2, timeToExpiry, riskFreeRate, volatility, optionType);
    const vega = this.calculateVega(spotPrice, d1, timeToExpiry);
    const rho = this.calculateRho(strikePrice, d2, timeToExpiry, riskFreeRate, optionType);

    return { delta, gamma, theta, vega, rho };
  }

  /**
   * Calculate d1 parameter for Black-Scholes
   */
  private static calculateD1(
    spotPrice: number,
    strikePrice: number,
    timeToExpiry: number,
    riskFreeRate: number,
    volatility: number
  ): number {
    return (
      (Math.log(spotPrice / strikePrice) + (riskFreeRate + 0.5 * volatility * volatility) * timeToExpiry) /
      (volatility * Math.sqrt(timeToExpiry))
    );
  }

  /**
   * Calculate Delta (price sensitivity)
   */
  private static calculateDelta(d1: number, optionType: 'call' | 'put'): number {
    if (optionType === 'call') {
      return this.normalCDF(d1);
    } else {
      return this.normalCDF(d1) - 1;
    }
  }

  /**
   * Calculate Gamma (delta sensitivity)
   */
  private static calculateGamma(
    spotPrice: number,
    d1: number,
    volatility: number,
    timeToExpiry: number
  ): number {
    return this.normalPDF(d1) / (spotPrice * volatility * Math.sqrt(timeToExpiry));
  }

  /**
   * Calculate Theta (time decay)
   */
  private static calculateTheta(
    spotPrice: number,
    strikePrice: number,
    d1: number,
    d2: number,
    timeToExpiry: number,
    riskFreeRate: number,
    volatility: number,
    optionType: 'call' | 'put'
  ): number {
    const term1 = -(spotPrice * this.normalPDF(d1) * volatility) / (2 * Math.sqrt(timeToExpiry));

    if (optionType === 'call') {
      const term2 = riskFreeRate * strikePrice * Math.exp(-riskFreeRate * timeToExpiry) * this.normalCDF(d2);
      return (term1 - term2) / 365; // Daily theta
    } else {
      const term2 = riskFreeRate * strikePrice * Math.exp(-riskFreeRate * timeToExpiry) * this.normalCDF(-d2);
      return (term1 + term2) / 365; // Daily theta
    }
  }

  /**
   * Calculate Vega (volatility sensitivity)
   */
  private static calculateVega(spotPrice: number, d1: number, timeToExpiry: number): number {
    return (spotPrice * this.normalPDF(d1) * Math.sqrt(timeToExpiry)) / 100; // Per 1% change in volatility
  }

  /**
   * Calculate Rho (interest rate sensitivity)
   */
  private static calculateRho(
    strikePrice: number,
    d2: number,
    timeToExpiry: number,
    riskFreeRate: number,
    optionType: 'call' | 'put'
  ): number {
    if (optionType === 'call') {
      return (strikePrice * timeToExpiry * Math.exp(-riskFreeRate * timeToExpiry) * this.normalCDF(d2)) / 100;
    } else {
      return (-strikePrice * timeToExpiry * Math.exp(-riskFreeRate * timeToExpiry) * this.normalCDF(-d2)) / 100;
    }
  }

  /**
   * Calculate implied volatility using Newton-Raphson method
   */
  static calculateImpliedVolatility(
    marketPrice: number,
    spotPrice: number,
    strikePrice: number,
    timeToExpiry: number,
    riskFreeRate: number,
    optionType: 'call' | 'put' = 'call',
    tolerance: number = 0.0001,
    maxIterations: number = 100
  ): number {
    let volatility = 0.5; // Initial guess

    for (let i = 0; i < maxIterations; i++) {
      const price = this.calculateBlackScholes(spotPrice, strikePrice, timeToExpiry, riskFreeRate, volatility, optionType);
      const vega = this.calculateVega(spotPrice, this.calculateD1(spotPrice, strikePrice, timeToExpiry, riskFreeRate, volatility), timeToExpiry);

      const priceDiff = price - marketPrice;

      if (Math.abs(priceDiff) < tolerance) {
        return volatility;
      }

      if (vega === 0) {
        break;
      }

      volatility = volatility - priceDiff / (vega * 100); // Adjust for vega scale

      // Ensure volatility stays positive
      volatility = Math.max(volatility, 0.001);
    }

    return volatility;
  }

  /**
   * Calculate complete option valuation
   */
  static getCompleteValuation(
    symbol: string,
    spotPrice: number,
    strikePrice: number,
    expirationDate: Date,
    riskFreeRate: number,
    volatility: number,
    optionType: 'call' | 'put' = 'call'
  ): OptionValuation {
    const now = new Date();
    const timeToExpiry = (expirationDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24 * 365);

    const blackScholesValue = this.calculateBlackScholes(
      spotPrice,
      strikePrice,
      timeToExpiry,
      riskFreeRate,
      volatility,
      optionType
    );

    const greeks = this.calculateGreeks(
      spotPrice,
      strikePrice,
      timeToExpiry,
      riskFreeRate,
      volatility,
      optionType
    );

    const intrinsicValue = this.calculateIntrinsicValue(spotPrice, strikePrice, optionType);
    const timeValue = blackScholesValue - intrinsicValue;

    return {
      symbol,
      type: optionType,
      strikePrice,
      currentPrice: spotPrice,
      expirationDate,
      impliedVolatility: volatility,
      blackScholesValue,
      delta: greeks.delta,
      gamma: greeks.gamma,
      theta: greeks.theta,
      vega: greeks.vega,
      rho: greeks.rho,
      intrinsicValue,
      timeValue,
      profitLoss: blackScholesValue - strikePrice // Simplified P&L
    };
  }

  /**
   * Calculate intrinsic value
   */
  private static calculateIntrinsicValue(
    spotPrice: number,
    strikePrice: number,
    optionType: 'call' | 'put'
  ): number {
    if (optionType === 'call') {
      return Math.max(0, spotPrice - strikePrice);
    } else {
      return Math.max(0, strikePrice - spotPrice);
    }
  }

  /**
   * Binomial option pricing model (American options)
   */
  static calculateBinomial(
    spotPrice: number,
    strikePrice: number,
    timeToExpiry: number,
    riskFreeRate: number,
    volatility: number,
    steps: number,
    optionType: 'call' | 'put' = 'call',
    exerciseType: 'european' | 'american' = 'american'
  ): number {
    const dt = timeToExpiry / steps;
    const u = Math.exp(volatility * Math.sqrt(dt));
    const d = 1 / u;
    const p = (Math.exp(riskFreeRate * dt) - d) / (u - d);

    // Initialize asset prices at expiration
    const assetPrices: number[] = [];
    for (let i = 0; i <= steps; i++) {
      assetPrices[i] = spotPrice * Math.pow(u, steps - i) * Math.pow(d, i);
    }

    // Initialize option values at expiration
    const optionValues: number[] = [];
    for (let i = 0; i <= steps; i++) {
      if (optionType === 'call') {
        optionValues[i] = Math.max(0, assetPrices[i] - strikePrice);
      } else {
        optionValues[i] = Math.max(0, strikePrice - assetPrices[i]);
      }
    }

    // Work backwards through the tree
    for (let step = steps - 1; step >= 0; step--) {
      for (let i = 0; i <= step; i++) {
        // Calculate discounted expected value
        const holdValue = Math.exp(-riskFreeRate * dt) * (p * optionValues[i] + (1 - p) * optionValues[i + 1]);

        if (exerciseType === 'american') {
          // For American options, compare with immediate exercise value
          const currentPrice = spotPrice * Math.pow(u, step - i) * Math.pow(d, i);
          const exerciseValue = optionType === 'call'
            ? Math.max(0, currentPrice - strikePrice)
            : Math.max(0, strikePrice - currentPrice);

          optionValues[i] = Math.max(holdValue, exerciseValue);
        } else {
          optionValues[i] = holdValue;
        }
      }
    }

    return optionValues[0];
  }

  /**
   * Normal cumulative distribution function
   */
  private static normalCDF(x: number): number {
    return 0.5 * (1 + this.erf(x / Math.sqrt(2)));
  }

  /**
   * Normal probability density function
   */
  private static normalPDF(x: number): number {
    return Math.exp(-0.5 * x * x) / Math.sqrt(2 * Math.PI);
  }

  /**
   * Error function approximation
   */
  private static erf(x: number): number {
    // Abramowitz and Stegun approximation
    const a1 =  0.254829592;
    const a2 = -0.284496736;
    const a3 =  1.421413741;
    const a4 = -1.453152027;
    const a5 =  1.061405429;
    const p  =  0.3275911;

    const sign = x >= 0 ? 1 : -1;
    x = Math.abs(x);

    const t = 1.0 / (1.0 + p * x);
    const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);

    return sign * y;
  }

  /**
   * Monte Carlo option pricing simulation
   */
  static calculateMonteCarlo(
    spotPrice: number,
    strikePrice: number,
    timeToExpiry: number,
    riskFreeRate: number,
    volatility: number,
    numSimulations: number = 100000,
    optionType: 'call' | 'put' = 'call'
  ): { value: number; standardError: number; confidenceInterval: [number, number] } {
    const dt = timeToExpiry / 252; // Daily time steps
    const drift = riskFreeRate - 0.5 * volatility * volatility;

    let payoffSum = 0;
    let payoffSumSquared = 0;

    for (let i = 0; i < numSimulations; i++) {
      let currentPrice = spotPrice;

      // Simulate price path (simplified single-step for European options)
      const randomNormal = this.generateRandomNormal();
      const priceAtExpiry = spotPrice * Math.exp(
        drift * timeToExpiry + volatility * Math.sqrt(timeToExpiry) * randomNormal
      );

      // Calculate payoff
      let payoff = 0;
      if (optionType === 'call') {
        payoff = Math.max(0, priceAtExpiry - strikePrice);
      } else {
        payoff = Math.max(0, strikePrice - priceAtExpiry);
      }

      // Discount to present value
      const discountedPayoff = payoff * Math.exp(-riskFreeRate * timeToExpiry);

      payoffSum += discountedPayoff;
      payoffSumSquared += discountedPayoff * discountedPayoff;
    }

    const optionValue = payoffSum / numSimulations;
    const variance = (payoffSumSquared / numSimulations) - (optionValue * optionValue);
    const standardError = Math.sqrt(variance / numSimulations);

    // 95% confidence interval
    const confidenceInterval: [number, number] = [
      optionValue - 1.96 * standardError,
      optionValue + 1.96 * standardError
    ];

    return {
      value: optionValue,
      standardError,
      confidenceInterval
    };
  }

  /**
   * Generate random normal distribution value (Box-Muller transform)
   */
  private static generateRandomNormal(): number {
    if (this.spareRandom !== null) {
      const tmp = this.spareRandom;
      this.spareRandom = null;
      return tmp;
    }

    const u1 = Math.random();
    const u2 = Math.random();

    const mag = Math.sqrt(-2.0 * Math.log(u1));
    const z0 = mag * Math.cos(2.0 * Math.PI * u2);
    const z1 = mag * Math.sin(2.0 * Math.PI * u2);

    this.spareRandom = z1;
    return z0;
  }

  private static spareRandom: number | null = null;

  /**
   * Portfolio options analysis
   */
  static analyzeOptionsPortfolio(options: OptionValuation[]): {
    totalValue: number;
    totalDelta: number;
    totalGamma: number;
    totalTheta: number;
    totalVega: number;
    totalRho: number;
    riskMetrics: {
      maxLoss: number;
      maxGain: number;
      breakeven: number[];
    };
  } {
    const totalValue = options.reduce((sum, option) => sum + option.blackScholesValue, 0);
    const totalDelta = options.reduce((sum, option) => sum + option.delta, 0);
    const totalGamma = options.reduce((sum, option) => sum + option.gamma, 0);
    const totalTheta = options.reduce((sum, option) => sum + option.theta, 0);
    const totalVega = options.reduce((sum, option) => sum + option.vega, 0);
    const totalRho = options.reduce((sum, option) => sum + option.rho, 0);

    // Simplified risk calculation
    const maxLoss = options.reduce((sum, option) => {
      return sum + (option.type === 'call' ? option.blackScholesValue : option.strikePrice);
    }, 0);

    const maxGain = options.reduce((sum, option) => {
      return sum + (option.type === 'call' ? Infinity : option.blackScholesValue);
    }, 0);

    // Simplified breakeven calculation
    const breakeven = options.map(option => {
      if (option.type === 'call') {
        return option.strikePrice + option.blackScholesValue;
      } else {
        return option.strikePrice - option.blackScholesValue;
      }
    });

    return {
      totalValue,
      totalDelta,
      totalGamma,
      totalTheta,
      totalVega,
      totalRho,
      riskMetrics: {
        maxLoss: maxLoss === Infinity ? 0 : maxLoss,
        maxGain: maxGain === Infinity ? 0 : maxGain,
        breakeven
      }
    };
  }
}