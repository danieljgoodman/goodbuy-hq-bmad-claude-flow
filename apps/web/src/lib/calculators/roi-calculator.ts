import { ROICalculationInputs, ROICalculationResults } from '@/types/impact-analysis';

export class ROICalculator {
  
  static calculateROI(inputs: ROICalculationInputs): ROICalculationResults {
    const { initialInvestment, annualBenefits, implementationCosts, maintenanceCosts, discountRate, timeHorizon, riskFactor } = inputs;
    
    // Calculate Net Present Value (NPV)
    const npv = this.calculateNPV(initialInvestment, annualBenefits, implementationCosts, maintenanceCosts, discountRate, timeHorizon);
    
    // Calculate Internal Rate of Return (IRR)
    const irr = this.calculateIRR(initialInvestment, annualBenefits, implementationCosts, maintenanceCosts, timeHorizon);
    
    // Calculate Payback Period
    const paybackPeriod = this.calculatePaybackPeriod(initialInvestment, annualBenefits, implementationCosts, maintenanceCosts);
    
    // Calculate simple ROI
    const totalBenefits = annualBenefits.reduce((sum, benefit) => sum + benefit, 0);
    const totalCosts = initialInvestment + implementationCosts.reduce((sum, cost) => sum + cost, 0) + maintenanceCosts.reduce((sum, cost) => sum + cost, 0);
    const roi = ((totalBenefits - totalCosts) / totalCosts) * 100;
    
    // Calculate risk-adjusted ROI
    const riskAdjustedROI = roi * (1 - riskFactor);
    
    // Calculate break-even point
    const breakEvenPoint = this.calculateBreakEvenPoint(totalCosts, annualBenefits);
    
    // Calculate total return
    const totalReturn = totalBenefits - totalCosts;
    
    // Calculate confidence based on input quality and assumptions
    const confidence = this.calculateConfidence(inputs);
    
    return {
      npv,
      irr,
      paybackPeriod,
      roi,
      riskAdjustedROI,
      breakEvenPoint,
      totalReturn,
      confidence
    };
  }
  
  private static calculateNPV(
    initialInvestment: number,
    annualBenefits: number[],
    implementationCosts: number[],
    maintenanceCosts: number[],
    discountRate: number,
    timeHorizon: number
  ): number {
    let npv = -initialInvestment;
    
    for (let year = 0; year < timeHorizon; year++) {
      const yearlyBenefit = annualBenefits[year] || annualBenefits[annualBenefits.length - 1] || 0;
      const yearlyImplementationCost = implementationCosts[year] || 0;
      const yearlyMaintenanceCost = maintenanceCosts[year] || maintenanceCosts[maintenanceCosts.length - 1] || 0;
      
      const netCashFlow = yearlyBenefit - yearlyImplementationCost - yearlyMaintenanceCost;
      const presentValue = netCashFlow / Math.pow(1 + discountRate, year + 1);
      
      npv += presentValue;
    }
    
    return npv;
  }
  
  private static calculateIRR(
    initialInvestment: number,
    annualBenefits: number[],
    implementationCosts: number[],
    maintenanceCosts: number[],
    timeHorizon: number
  ): number {
    // Use Newton-Raphson method to find IRR
    let rate = 0.1; // Initial guess
    const maxIterations = 100;
    const tolerance = 0.0001;
    
    for (let i = 0; i < maxIterations; i++) {
      const { npv, derivative } = this.calculateNPVAndDerivative(
        initialInvestment, annualBenefits, implementationCosts, maintenanceCosts, rate, timeHorizon
      );
      
      if (Math.abs(npv) < tolerance) {
        return rate;
      }
      
      if (Math.abs(derivative) < tolerance) {
        break; // Avoid division by zero
      }
      
      rate = rate - npv / derivative;
    }
    
    return rate;
  }
  
  private static calculateNPVAndDerivative(
    initialInvestment: number,
    annualBenefits: number[],
    implementationCosts: number[],
    maintenanceCosts: number[],
    rate: number,
    timeHorizon: number
  ): { npv: number; derivative: number } {
    let npv = -initialInvestment;
    let derivative = 0;
    
    for (let year = 0; year < timeHorizon; year++) {
      const yearlyBenefit = annualBenefits[year] || annualBenefits[annualBenefits.length - 1] || 0;
      const yearlyImplementationCost = implementationCosts[year] || 0;
      const yearlyMaintenanceCost = maintenanceCosts[year] || maintenanceCosts[maintenanceCosts.length - 1] || 0;
      
      const netCashFlow = yearlyBenefit - yearlyImplementationCost - yearlyMaintenanceCost;
      const discountFactor = Math.pow(1 + rate, year + 1);
      
      npv += netCashFlow / discountFactor;
      derivative -= (year + 1) * netCashFlow / (discountFactor * (1 + rate));
    }
    
    return { npv, derivative };
  }
  
  private static calculatePaybackPeriod(
    initialInvestment: number,
    annualBenefits: number[],
    implementationCosts: number[],
    maintenanceCosts: number[]
  ): number {
    let cumulativeNetFlow = -initialInvestment;
    
    for (let year = 0; year < annualBenefits.length; year++) {
      const yearlyBenefit = annualBenefits[year];
      const yearlyImplementationCost = implementationCosts[year] || 0;
      const yearlyMaintenanceCost = maintenanceCosts[year] || maintenanceCosts[maintenanceCosts.length - 1] || 0;
      
      const netCashFlow = yearlyBenefit - yearlyImplementationCost - yearlyMaintenanceCost;
      cumulativeNetFlow += netCashFlow;
      
      if (cumulativeNetFlow >= 0) {
        // Linear interpolation for more precise payback period
        const previousCumulative = cumulativeNetFlow - netCashFlow;
        const fraction = Math.abs(previousCumulative) / netCashFlow;
        return year + fraction;
      }
    }
    
    return -1; // Payback period not achieved within timeframe
  }
  
  private static calculateBreakEvenPoint(totalCosts: number, annualBenefits: number[]): number {
    const avgAnnualBenefit = annualBenefits.reduce((sum, benefit) => sum + benefit, 0) / annualBenefits.length;
    
    if (avgAnnualBenefit <= 0) {
      return -1; // Never breaks even
    }
    
    return totalCosts / avgAnnualBenefit;
  }
  
  private static calculateConfidence(inputs: ROICalculationInputs): number {
    let confidence = 0.8; // Base confidence
    
    // Adjust based on data quality
    if (inputs.annualBenefits.length >= 3) confidence += 0.05;
    if (inputs.timeHorizon >= 3) confidence += 0.05;
    if (inputs.riskFactor < 0.3) confidence += 0.05;
    if (inputs.discountRate > 0 && inputs.discountRate < 0.2) confidence += 0.05;
    
    return Math.min(confidence, 0.95);
  }
  
  // Additional utility methods for sensitivity analysis
  static performSensitivityAnalysis(
    baseInputs: ROICalculationInputs,
    sensitivityRanges: { [key: string]: { min: number; max: number } }
  ): { variable: string; impactOnROI: number }[] {
    const baseResults = this.calculateROI(baseInputs);
    const sensitivityResults: { variable: string; impactOnROI: number }[] = [];
    
    Object.entries(sensitivityRanges).forEach(([variable, range]) => {
      // Test with minimum value
      const minInputs = { ...baseInputs };
      this.adjustInputVariable(minInputs, variable, range.min);
      const minResults = this.calculateROI(minInputs);
      
      // Test with maximum value
      const maxInputs = { ...baseInputs };
      this.adjustInputVariable(maxInputs, variable, range.max);
      const maxResults = this.calculateROI(maxInputs);
      
      // Calculate impact on ROI
      const impactRange = Math.abs(maxResults.roi - minResults.roi);
      sensitivityResults.push({
        variable,
        impactOnROI: impactRange
      });
    });
    
    // Sort by impact (highest impact first)
    return sensitivityResults.sort((a, b) => b.impactOnROI - a.impactOnROI);
  }
  
  private static adjustInputVariable(inputs: ROICalculationInputs, variable: string, value: number): void {
    switch (variable) {
      case 'initialInvestment':
        inputs.initialInvestment = value;
        break;
      case 'discountRate':
        inputs.discountRate = value;
        break;
      case 'riskFactor':
        inputs.riskFactor = value;
        break;
      case 'annualBenefits':
        inputs.annualBenefits = inputs.annualBenefits.map(benefit => benefit * value);
        break;
      default:
        console.warn(`Unknown variable for sensitivity analysis: ${variable}`);
    }
  }
  
  // Monte Carlo simulation for risk assessment
  static runMonteCarloSimulation(
    inputs: ROICalculationInputs,
    variableRanges: { [key: string]: { min: number; max: number; distribution: 'normal' | 'uniform' } },
    iterations: number = 1000
  ): {
    meanROI: number;
    medianROI: number;
    standardDeviation: number;
    confidenceInterval: { lower: number; upper: number };
    probabilityOfPositiveROI: number;
  } {
    const results: number[] = [];
    
    for (let i = 0; i < iterations; i++) {
      const simulationInputs = { ...inputs };
      
      // Apply random variations based on defined ranges
      Object.entries(variableRanges).forEach(([variable, range]) => {
        const randomValue = this.generateRandomValue(range.min, range.max, range.distribution);
        this.adjustInputVariable(simulationInputs, variable, randomValue);
      });
      
      const result = this.calculateROI(simulationInputs);
      results.push(result.roi);
    }
    
    // Calculate statistics
    results.sort((a, b) => a - b);
    const meanROI = results.reduce((sum, roi) => sum + roi, 0) / results.length;
    const medianROI = results[Math.floor(results.length / 2)];
    
    const variance = results.reduce((sum, roi) => sum + Math.pow(roi - meanROI, 2), 0) / results.length;
    const standardDeviation = Math.sqrt(variance);
    
    const confidenceLevel = 0.95;
    const lowerIndex = Math.floor(results.length * (1 - confidenceLevel) / 2);
    const upperIndex = Math.floor(results.length * (1 + confidenceLevel) / 2);
    
    const probabilityOfPositiveROI = results.filter(roi => roi > 0).length / results.length;
    
    return {
      meanROI,
      medianROI,
      standardDeviation,
      confidenceInterval: {
        lower: results[lowerIndex],
        upper: results[upperIndex]
      },
      probabilityOfPositiveROI
    };
  }
  
  private static generateRandomValue(min: number, max: number, distribution: 'normal' | 'uniform'): number {
    if (distribution === 'uniform') {
      return min + Math.random() * (max - min);
    } else {
      // Box-Muller transform for normal distribution
      const u1 = Math.random();
      const u2 = Math.random();
      const z0 = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
      
      const mean = (min + max) / 2;
      const stdDev = (max - min) / 6; // Assume 99.7% of values fall within range
      
      return Math.max(min, Math.min(max, mean + z0 * stdDev));
    }
  }
}