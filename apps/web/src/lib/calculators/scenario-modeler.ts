import { ScenarioModelingInputs, ScenarioModelingResults, ROICalculationInputs } from '@/types/impact-analysis';
import { ROICalculator } from './roi-calculator';

export class ScenarioModeler {
  
  static generateScenarios(inputs: ScenarioModelingInputs): ScenarioModelingResults {
    const { baseCase, variableRanges, correlations } = inputs;
    
    // Generate conservative scenario (pessimistic)
    const conservativeInputs = this.generateConservativeScenario(baseCase, variableRanges);
    const conservative = ROICalculator.calculateROI(conservativeInputs);
    
    // Generate realistic scenario (base case)
    const realistic = ROICalculator.calculateROI(baseCase);
    
    // Generate optimistic scenario
    const optimisticInputs = this.generateOptimisticScenario(baseCase, variableRanges);
    const optimistic = ROICalculator.calculateROI(optimisticInputs);
    
    // Calculate probability assessments
    const probability = this.calculateProbabilities(conservative, realistic, optimistic);
    
    // Perform sensitivity analysis
    const sensitivityRanking = this.performSensitivityRanking(baseCase, variableRanges);
    
    return {
      conservative,
      realistic,
      optimistic,
      probability,
      sensitivityRanking
    };
  }
  
  private static generateConservativeScenario(
    baseCase: ROICalculationInputs,
    variableRanges: { variable: string; min: number; max: number; distribution: 'normal' | 'uniform' | 'triangular' }[]
  ): ROICalculationInputs {
    const conservativeInputs = { ...baseCase };
    
    variableRanges.forEach(range => {
      const pessimisticValue = this.getPessimisticValue(range);
      this.adjustScenarioVariable(conservativeInputs, range.variable, pessimisticValue);
    });
    
    return conservativeInputs;
  }
  
  private static generateOptimisticScenario(
    baseCase: ROICalculationInputs,
    variableRanges: { variable: string; min: number; max: number; distribution: 'normal' | 'uniform' | 'triangular' }[]
  ): ROICalculationInputs {
    const optimisticInputs = { ...baseCase };
    
    variableRanges.forEach(range => {
      const optimisticValue = this.getOptimisticValue(range);
      this.adjustScenarioVariable(optimisticInputs, range.variable, optimisticValue);
    });
    
    return optimisticInputs;
  }
  
  private static getPessimisticValue(range: { variable: string; min: number; max: number; distribution: string }): number {
    // For conservative scenarios, use values that negatively impact ROI
    switch (range.variable) {
      case 'annualBenefits':
      case 'revenueIncrease':
        return range.min; // Lower benefits
      case 'initialInvestment':
      case 'implementationCosts':
      case 'maintenanceCosts':
        return range.max; // Higher costs
      case 'timeHorizon':
        return range.min; // Shorter timeframe
      case 'discountRate':
        return range.max; // Higher discount rate
      case 'riskFactor':
        return range.max; // Higher risk
      default:
        return range.min;
    }
  }
  
  private static getOptimisticValue(range: { variable: string; min: number; max: number; distribution: string }): number {
    // For optimistic scenarios, use values that positively impact ROI
    switch (range.variable) {
      case 'annualBenefits':
      case 'revenueIncrease':
        return range.max; // Higher benefits
      case 'initialInvestment':
      case 'implementationCosts':
      case 'maintenanceCosts':
        return range.min; // Lower costs
      case 'timeHorizon':
        return range.max; // Longer timeframe
      case 'discountRate':
        return range.min; // Lower discount rate
      case 'riskFactor':
        return range.min; // Lower risk
      default:
        return range.max;
    }
  }
  
  private static adjustScenarioVariable(inputs: ROICalculationInputs, variable: string, value: number): void {
    switch (variable) {
      case 'initialInvestment':
        inputs.initialInvestment = value;
        break;
      case 'annualBenefits':
        inputs.annualBenefits = inputs.annualBenefits.map(benefit => benefit * value);
        break;
      case 'implementationCosts':
        inputs.implementationCosts = inputs.implementationCosts.map(cost => cost * value);
        break;
      case 'maintenanceCosts':
        inputs.maintenanceCosts = inputs.maintenanceCosts.map(cost => cost * value);
        break;
      case 'discountRate':
        inputs.discountRate = value;
        break;
      case 'timeHorizon':
        inputs.timeHorizon = Math.round(value);
        break;
      case 'riskFactor':
        inputs.riskFactor = value;
        break;
      default:
        console.warn(`Unknown variable for scenario adjustment: ${variable}`);
    }
  }
  
  private static calculateProbabilities(
    conservative: any,
    realistic: any,
    optimistic: any
  ): {
    positiveROI: number;
    breakEven: number;
    targetReturn: number;
  } {
    // Simple probability estimation based on scenario outcomes
    let positiveROIScenarios = 0;
    let breakEvenScenarios = 0;
    let targetReturnScenarios = 0;
    
    const scenarios = [conservative, realistic, optimistic];
    const targetReturn = 15; // 15% ROI target
    
    scenarios.forEach(scenario => {
      if (scenario.roi > 0) positiveROIScenarios++;
      if (scenario.roi >= -5 && scenario.roi <= 5) breakEvenScenarios++; // Break-even range
      if (scenario.roi >= targetReturn) targetReturnScenarios++;
    });
    
    return {
      positiveROI: positiveROIScenarios / scenarios.length,
      breakEven: breakEvenScenarios / scenarios.length,
      targetReturn: targetReturnScenarios / scenarios.length
    };
  }
  
  private static performSensitivityRanking(
    baseCase: ROICalculationInputs,
    variableRanges: { variable: string; min: number; max: number; distribution: string }[]
  ): { variable: string; impactOnROI: number }[] {
    const baseROI = ROICalculator.calculateROI(baseCase).roi;
    const sensitivityResults: { variable: string; impactOnROI: number }[] = [];
    
    variableRanges.forEach(range => {
      // Test with minimum value
      const minInputs = { ...baseCase };
      this.adjustScenarioVariable(minInputs, range.variable, range.min);
      const minROI = ROICalculator.calculateROI(minInputs).roi;
      
      // Test with maximum value
      const maxInputs = { ...baseCase };
      this.adjustScenarioVariable(maxInputs, range.variable, range.max);
      const maxROI = ROICalculator.calculateROI(maxInputs).roi;
      
      // Calculate sensitivity (maximum deviation from base case)
      const sensitivity = Math.max(
        Math.abs(minROI - baseROI),
        Math.abs(maxROI - baseROI)
      );
      
      sensitivityResults.push({
        variable: range.variable,
        impactOnROI: sensitivity
      });
    });
    
    // Sort by impact (highest sensitivity first)
    return sensitivityResults.sort((a, b) => b.impactOnROI - a.impactOnROI);
  }
  
  // Advanced scenario modeling with correlations
  static generateCorrelatedScenarios(
    inputs: ScenarioModelingInputs,
    numberOfScenarios: number = 1000
  ): {
    scenarios: any[];
    statistics: {
      meanROI: number;
      medianROI: number;
      standardDeviation: number;
      percentiles: { [key: number]: number };
    };
  } {
    const scenarios: any[] = [];
    const { baseCase, variableRanges, correlations = [] } = inputs;
    
    for (let i = 0; i < numberOfScenarios; i++) {
      const scenarioInputs = { ...baseCase };
      const randomValues: { [variable: string]: number } = {};
      
      // Generate base random values
      variableRanges.forEach(range => {
        randomValues[range.variable] = this.generateRandomValue(range);
      });
      
      // Apply correlations
      correlations.forEach(correlation => {
        const baseValue = randomValues[correlation.variable1];
        if (baseValue !== undefined && randomValues[correlation.variable2] !== undefined) {
          // Simple correlation adjustment
          const adjustment = (baseValue - 0.5) * correlation.correlation;
          randomValues[correlation.variable2] += adjustment;
          
          // Ensure values stay within range
          const range = variableRanges.find(r => r.variable === correlation.variable2);
          if (range) {
            randomValues[correlation.variable2] = Math.max(
              range.min,
              Math.min(range.max, randomValues[correlation.variable2])
            );
          }
        }
      });
      
      // Apply random values to scenario inputs
      Object.entries(randomValues).forEach(([variable, value]) => {
        this.adjustScenarioVariable(scenarioInputs, variable, value);
      });
      
      // Calculate ROI for this scenario
      const scenarioResult = ROICalculator.calculateROI(scenarioInputs);
      scenarios.push(scenarioResult);
    }
    
    // Calculate statistics
    const roiValues = scenarios.map(s => s.roi).sort((a, b) => a - b);
    const meanROI = roiValues.reduce((sum, roi) => sum + roi, 0) / roiValues.length;
    const medianROI = roiValues[Math.floor(roiValues.length / 2)];
    
    const variance = roiValues.reduce((sum, roi) => sum + Math.pow(roi - meanROI, 2), 0) / roiValues.length;
    const standardDeviation = Math.sqrt(variance);
    
    // Calculate percentiles
    const percentiles: { [key: number]: number } = {};
    [5, 10, 25, 50, 75, 90, 95].forEach(p => {
      const index = Math.floor((p / 100) * roiValues.length);
      percentiles[p] = roiValues[index];
    });
    
    return {
      scenarios,
      statistics: {
        meanROI,
        medianROI,
        standardDeviation,
        percentiles
      }
    };
  }
  
  private static generateRandomValue(range: { variable: string; min: number; max: number; distribution: string }): number {
    const { min, max, distribution } = range;
    
    switch (distribution) {
      case 'uniform':
        return min + Math.random() * (max - min);
      
      case 'normal':
        // Box-Muller transform for normal distribution
        const u1 = Math.random();
        const u2 = Math.random();
        const z0 = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
        
        const mean = (min + max) / 2;
        const stdDev = (max - min) / 6; // 99.7% of values within range
        
        return Math.max(min, Math.min(max, mean + z0 * stdDev));
      
      case 'triangular':
        const mode = (min + max) / 2; // Assume mode is at midpoint
        const u = Math.random();
        
        if (u < (mode - min) / (max - min)) {
          return min + Math.sqrt(u * (max - min) * (mode - min));
        } else {
          return max - Math.sqrt((1 - u) * (max - min) * (max - mode));
        }
      
      default:
        console.warn(`Unknown distribution: ${distribution}, using uniform`);
        return min + Math.random() * (max - min);
    }
  }
  
  // Utility method to create standard variable ranges for common opportunity types
  static createStandardVariableRanges(opportunityType: string): { variable: string; min: number; max: number; distribution: 'normal' | 'uniform' | 'triangular' }[] {
    const baseRanges = [
      { variable: 'annualBenefits', min: 0.7, max: 1.3, distribution: 'normal' as const },
      { variable: 'implementationCosts', min: 0.8, max: 1.5, distribution: 'triangular' as const },
      { variable: 'maintenanceCosts', min: 0.9, max: 1.2, distribution: 'uniform' as const },
      { variable: 'discountRate', min: 0.05, max: 0.15, distribution: 'uniform' as const },
      { variable: 'riskFactor', min: 0.1, max: 0.4, distribution: 'triangular' as const }
    ];
    
    // Adjust ranges based on opportunity type
    switch (opportunityType) {
      case 'digital_transformation':
        return baseRanges.map(range => ({
          ...range,
          min: range.variable === 'implementationCosts' ? 1.0 : range.min,
          max: range.variable === 'implementationCosts' ? 2.0 : range.max
        }));
      
      case 'process_automation':
        return baseRanges.map(range => ({
          ...range,
          min: range.variable === 'annualBenefits' ? 0.8 : range.min,
          max: range.variable === 'annualBenefits' ? 1.5 : range.max
        }));
      
      case 'marketing_optimization':
        return baseRanges.map(range => ({
          ...range,
          min: range.variable === 'annualBenefits' ? 0.6 : range.min,
          max: range.variable === 'annualBenefits' ? 2.0 : range.max
        }));
      
      default:
        return baseRanges;
    }
  }
}