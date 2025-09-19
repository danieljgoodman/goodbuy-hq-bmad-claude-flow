/**
 * Web Worker for heavy Enterprise dashboard calculations
 * Handles Monte Carlo simulations, option pricing, and scenario analysis off the main thread
 */

// Define message types for type safety
interface MonteCarloParams {
  scenarios: any[];
  iterations: number;
  timeHorizon: number;
  volatility: number;
  riskFreeRate: number;
}

interface OptionPricingParams {
  spotPrice: number;
  strikePrice: number;
  timeToExpiry: number;
  volatility: number;
  riskFreeRate: number;
  dividendYield?: number;
}

interface ScenarioAnalysisParams {
  baseCase: any;
  scenarios: any[];
  correlations: number[][];
  confidenceLevel: number;
}

interface WorkerMessage {
  id: string;
  type: 'monte-carlo' | 'option-pricing' | 'scenario-analysis' | 'var-calculation';
  params: MonteCarloParams | OptionPricingParams | ScenarioAnalysisParams | any;
}

interface WorkerResponse {
  id: string;
  result: any;
  error?: string;
  progress?: number;
}

// Monte Carlo simulation for scenario analysis
function runMonteCarloSimulation(params: MonteCarloParams): any {
  const { scenarios, iterations, timeHorizon, volatility, riskFreeRate } = params;
  const results: number[] = [];
  const progressUpdateInterval = Math.max(1, Math.floor(iterations / 100));

  for (let i = 0; i < iterations; i++) {
    // Progress updates
    if (i % progressUpdateInterval === 0) {
      self.postMessage({
        id: 'progress',
        progress: (i / iterations) * 100
      } as WorkerResponse);
    }

    // Simulate random path for each scenario
    let totalValue = 0;
    let totalProbability = 0;

    scenarios.forEach((scenario: any) => {
      const probability = scenario.probability / 100;
      const revenueGrowth = scenario.revenueGrowth / 100;
      const marginImprovement = scenario.marginImprovement / 100;

      // Generate random walk
      let currentValue = 1; // Normalized starting value

      for (let t = 0; t < timeHorizon; t++) {
        // Geometric Brownian Motion simulation
        const dt = 1 / 12; // Monthly steps
        const randomShock = generateNormalRandom() * Math.sqrt(dt);
        const drift = (revenueGrowth + marginImprovement - 0.5 * volatility * volatility) * dt;
        const diffusion = volatility * randomShock;

        currentValue *= Math.exp(drift + diffusion);
      }

      // Weight by probability and add to total
      totalValue += currentValue * probability;
      totalProbability += probability;
    });

    // Normalize and store result
    results.push(totalValue / totalProbability);
  }

  // Calculate statistics
  results.sort((a, b) => a - b);

  const mean = results.reduce((sum, val) => sum + val, 0) / results.length;
  const variance = results.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / results.length;
  const standardDeviation = Math.sqrt(variance);

  // Percentiles
  const percentiles = {
    p5: results[Math.floor(results.length * 0.05)],
    p10: results[Math.floor(results.length * 0.10)],
    p25: results[Math.floor(results.length * 0.25)],
    p50: results[Math.floor(results.length * 0.50)],
    p75: results[Math.floor(results.length * 0.75)],
    p90: results[Math.floor(results.length * 0.90)],
    p95: results[Math.floor(results.length * 0.95)]
  };

  return {
    mean,
    standardDeviation,
    variance,
    percentiles,
    confidenceIntervals: {
      ci90: [percentiles.p5, percentiles.p95],
      ci80: [percentiles.p10, percentiles.p90],
      ci50: [percentiles.p25, percentiles.p75]
    },
    rawResults: results.slice(0, 1000) // Return sample for visualization
  };
}

// Black-Scholes option pricing with Greeks
function calculateOptionPrice(params: OptionPricingParams): any {
  const { spotPrice, strikePrice, timeToExpiry, volatility, riskFreeRate, dividendYield = 0 } = params;

  // Black-Scholes formula components
  const d1 = (Math.log(spotPrice / strikePrice) + (riskFreeRate - dividendYield + 0.5 * volatility * volatility) * timeToExpiry) / (volatility * Math.sqrt(timeToExpiry));
  const d2 = d1 - volatility * Math.sqrt(timeToExpiry);

  // Standard normal CDF approximation
  const N = (x: number) => 0.5 * (1 + erf(x / Math.sqrt(2)));

  // Call option price
  const callPrice = spotPrice * Math.exp(-dividendYield * timeToExpiry) * N(d1) - strikePrice * Math.exp(-riskFreeRate * timeToExpiry) * N(d2);

  // Put option price (put-call parity)
  const putPrice = callPrice - spotPrice * Math.exp(-dividendYield * timeToExpiry) + strikePrice * Math.exp(-riskFreeRate * timeToExpiry);

  // Greeks calculation
  const phi = (x: number) => Math.exp(-0.5 * x * x) / Math.sqrt(2 * Math.PI); // Standard normal PDF

  const delta = Math.exp(-dividendYield * timeToExpiry) * N(d1);
  const gamma = Math.exp(-dividendYield * timeToExpiry) * phi(d1) / (spotPrice * volatility * Math.sqrt(timeToExpiry));
  const theta = (-spotPrice * phi(d1) * volatility * Math.exp(-dividendYield * timeToExpiry) / (2 * Math.sqrt(timeToExpiry))
                 - riskFreeRate * strikePrice * Math.exp(-riskFreeRate * timeToExpiry) * N(d2)
                 + dividendYield * spotPrice * Math.exp(-dividendYield * timeToExpiry) * N(d1)) / 365;
  const vega = spotPrice * Math.exp(-dividendYield * timeToExpiry) * phi(d1) * Math.sqrt(timeToExpiry) / 100;
  const rho = strikePrice * timeToExpiry * Math.exp(-riskFreeRate * timeToExpiry) * N(d2) / 100;

  return {
    call: {
      price: callPrice,
      delta,
      gamma,
      theta,
      vega,
      rho
    },
    put: {
      price: putPrice,
      delta: delta - Math.exp(-dividendYield * timeToExpiry),
      gamma,
      theta: theta + riskFreeRate * strikePrice * Math.exp(-riskFreeRate * timeToExpiry) / 365,
      vega,
      rho: -strikePrice * timeToExpiry * Math.exp(-riskFreeRate * timeToExpiry) * N(-d2) / 100
    },
    impliedVolatility: volatility,
    timeDecay: theta,
    moneyness: spotPrice / strikePrice
  };
}

// Scenario analysis with correlation matrices
function performScenarioAnalysis(params: ScenarioAnalysisParams): any {
  const { baseCase, scenarios, correlations, confidenceLevel } = params;

  const numScenarios = scenarios.length;
  const results = [];

  // Monte Carlo with correlation
  const iterations = 10000;

  for (let i = 0; i < iterations; i++) {
    // Generate correlated random variables
    const randomVars = generateCorrelatedRandoms(numScenarios, correlations);

    let scenarioResult = { ...baseCase };
    let totalWeight = 0;

    scenarios.forEach((scenario: any, index: number) => {
      const probability = scenario.probability / 100;
      const randomComponent = randomVars[index];

      // Apply scenario impact based on random component
      if (randomComponent > 0) {
        scenarioResult.revenue = (scenarioResult.revenue || 0) + scenario.revenueGrowth * probability * randomComponent;
        scenarioResult.margin = (scenarioResult.margin || 0) + scenario.marginImprovement * probability * randomComponent;
        scenarioResult.valuation = (scenarioResult.valuation || 0) + scenario.valuationImpact * probability * randomComponent;
      }

      totalWeight += probability;
    });

    // Normalize by total weight
    if (totalWeight > 0) {
      scenarioResult.revenue = (scenarioResult.revenue || 0) / totalWeight;
      scenarioResult.margin = (scenarioResult.margin || 0) / totalWeight;
      scenarioResult.valuation = (scenarioResult.valuation || 0) / totalWeight;
    }

    results.push(scenarioResult);
  }

  // Calculate statistics for each metric
  const metrics = ['revenue', 'margin', 'valuation'];
  const statistics: any = {};

  metrics.forEach(metric => {
    const values = results.map(r => r[metric] || 0).sort((a, b) => a - b);
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;

    const lowerIndex = Math.floor(values.length * (1 - confidenceLevel) / 2);
    const upperIndex = Math.floor(values.length * (1 + confidenceLevel) / 2);

    statistics[metric] = {
      mean,
      standardDeviation: Math.sqrt(variance),
      confidenceInterval: [values[lowerIndex], values[upperIndex]],
      percentiles: {
        p5: values[Math.floor(values.length * 0.05)],
        p25: values[Math.floor(values.length * 0.25)],
        p50: values[Math.floor(values.length * 0.50)],
        p75: values[Math.floor(values.length * 0.75)],
        p95: values[Math.floor(values.length * 0.95)]
      }
    };
  });

  return {
    statistics,
    correlationMatrix: correlations,
    confidenceLevel,
    sampleResults: results.slice(0, 100)
  };
}

// Value at Risk calculation
function calculateVaR(scenarios: any[], confidenceLevel: number = 0.95): any {
  const returns = scenarios.map(s => s.revenueGrowth / 100);
  returns.sort((a, b) => a - b);

  const varIndex = Math.floor((1 - confidenceLevel) * returns.length);
  const var95 = returns[varIndex];
  const expectedShortfall = returns.slice(0, varIndex).reduce((sum, val) => sum + val, 0) / varIndex;

  return {
    valueAtRisk: var95,
    expectedShortfall,
    confidenceLevel,
    worstCase: returns[0],
    bestCase: returns[returns.length - 1]
  };
}

// Utility functions
function generateNormalRandom(): number {
  // Box-Muller transformation
  let u1 = 0, u2 = 0;
  while (u1 === 0) u1 = Math.random();
  while (u2 === 0) u2 = Math.random();
  return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
}

function generateCorrelatedRandoms(size: number, correlationMatrix: number[][]): number[] {
  // Cholesky decomposition for correlation
  const chol = choleskyDecomposition(correlationMatrix);
  const uncorrelated = Array(size).fill(0).map(() => generateNormalRandom());

  return chol.map(row =>
    row.reduce((sum, val, index) => sum + val * uncorrelated[index], 0)
  );
}

function choleskyDecomposition(matrix: number[][]): number[][] {
  const n = matrix.length;
  const L = Array(n).fill(0).map(() => Array(n).fill(0));

  for (let i = 0; i < n; i++) {
    for (let j = 0; j <= i; j++) {
      if (i === j) {
        let sum = 0;
        for (let k = 0; k < j; k++) {
          sum += L[j][k] * L[j][k];
        }
        L[j][j] = Math.sqrt(matrix[j][j] - sum);
      } else {
        let sum = 0;
        for (let k = 0; k < j; k++) {
          sum += L[i][k] * L[j][k];
        }
        L[i][j] = (matrix[i][j] - sum) / L[j][j];
      }
    }
  }

  return L;
}

function erf(x: number): number {
  // Approximation of error function
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

// Message handler
self.onmessage = function(e: MessageEvent<WorkerMessage>) {
  const { id, type, params } = e.data;

  try {
    let result: any;

    switch (type) {
      case 'monte-carlo':
        result = runMonteCarloSimulation(params as MonteCarloParams);
        break;

      case 'option-pricing':
        result = calculateOptionPrice(params as OptionPricingParams);
        break;

      case 'scenario-analysis':
        result = performScenarioAnalysis(params as ScenarioAnalysisParams);
        break;

      case 'var-calculation':
        result = calculateVaR(params.scenarios, params.confidenceLevel);
        break;

      default:
        throw new Error(`Unknown calculation type: ${type}`);
    }

    self.postMessage({
      id,
      result
    } as WorkerResponse);

  } catch (error) {
    self.postMessage({
      id,
      error: error instanceof Error ? error.message : 'Unknown error'
    } as WorkerResponse);
  }
};

// Export for TypeScript compilation
export {};