import { SensitivityFactor, ROICalculationInputs } from '@/types/impact-analysis';
import { ROICalculator } from './roi-calculator';

export interface SensitivityAnalysisResults {
  factors: SensitivityFactor[];
  criticalVariables: string[];
  robustnessScore: number;
  riskAssessment: {
    highRiskFactors: string[];
    mediumRiskFactors: string[];
    lowRiskFactors: string[];
  };
  recommendations: string[];
}

export class SensitivityAnalyzer {
  
  static performSensitivityAnalysis(
    baseInputs: ROICalculationInputs,
    variableRanges: { [key: string]: { min: number; max: number } }
  ): SensitivityAnalysisResults {
    const baseROI = ROICalculator.calculateROI(baseInputs);
    const factors: SensitivityFactor[] = [];
    
    // Analyze each variable
    Object.entries(variableRanges).forEach(([variable, range]) => {
      const factor = this.analyzeSingleVariable(baseInputs, variable, range);
      if (factor) {
        factors.push(factor);
      }
    });
    
    // Sort factors by impact magnitude
    factors.sort((a, b) => Math.max(Math.abs(b.impactOnROI.high), Math.abs(b.impactOnROI.low)) - 
                         Math.max(Math.abs(a.impactOnROI.high), Math.abs(a.impactOnROI.low)));
    
    // Identify critical variables (top 30% by impact)
    const criticalThreshold = factors.length * 0.3;
    const criticalVariables = factors.slice(0, Math.ceil(criticalThreshold)).map(f => f.variable);
    
    // Calculate robustness score (how stable is the ROI across variations)
    const robustnessScore = this.calculateRobustnessScore(factors);
    
    // Perform risk assessment
    const riskAssessment = this.assessRisk(factors);
    
    // Generate recommendations
    const recommendations = this.generateRecommendations(factors, criticalVariables, robustnessScore);
    
    return {
      factors,
      criticalVariables,
      robustnessScore,
      riskAssessment,
      recommendations
    };
  }
  
  private static analyzeSingleVariable(
    baseInputs: ROICalculationInputs,
    variable: string,
    range: { min: number; max: number }
  ): SensitivityFactor | null {
    const baseROI = ROICalculator.calculateROI(baseInputs).roi;
    
    // Test with minimum value
    const minInputs = this.adjustVariable(baseInputs, variable, range.min);
    if (!minInputs) return null;
    
    const minROI = ROICalculator.calculateROI(minInputs).roi;
    
    // Test with maximum value
    const maxInputs = this.adjustVariable(baseInputs, variable, range.max);
    if (!maxInputs) return null;
    
    const maxROI = ROICalculator.calculateROI(maxInputs).roi;
    
    return {
      variable,
      baseValue: this.getBaseValue(baseInputs, variable),
      lowValue: range.min,
      highValue: range.max,
      impactOnROI: {
        low: minROI - baseROI,
        high: maxROI - baseROI
      }
    };
  }
  
  private static adjustVariable(
    baseInputs: ROICalculationInputs,
    variable: string,
    value: number
  ): ROICalculationInputs | null {
    const adjustedInputs = { ...baseInputs };
    
    switch (variable) {
      case 'initialInvestment':
        adjustedInputs.initialInvestment = value;
        break;
      case 'annualBenefits':
        adjustedInputs.annualBenefits = baseInputs.annualBenefits.map(benefit => benefit * value);
        break;
      case 'implementationCosts':
        adjustedInputs.implementationCosts = baseInputs.implementationCosts.map(cost => cost * value);
        break;
      case 'maintenanceCosts':
        adjustedInputs.maintenanceCosts = baseInputs.maintenanceCosts.map(cost => cost * value);
        break;
      case 'discountRate':
        adjustedInputs.discountRate = value;
        break;
      case 'timeHorizon':
        adjustedInputs.timeHorizon = Math.max(1, Math.round(value));
        break;
      case 'riskFactor':
        adjustedInputs.riskFactor = Math.max(0, Math.min(1, value));
        break;
      default:
        console.warn(`Unknown variable for sensitivity analysis: ${variable}`);
        return null;
    }
    
    return adjustedInputs;
  }
  
  private static getBaseValue(inputs: ROICalculationInputs, variable: string): number {
    switch (variable) {
      case 'initialInvestment':
        return inputs.initialInvestment;
      case 'annualBenefits':
        return inputs.annualBenefits.reduce((sum, benefit) => sum + benefit, 0) / inputs.annualBenefits.length;
      case 'implementationCosts':
        return inputs.implementationCosts.reduce((sum, cost) => sum + cost, 0);
      case 'maintenanceCosts':
        return inputs.maintenanceCosts.reduce((sum, cost) => sum + cost, 0) / inputs.maintenanceCosts.length;
      case 'discountRate':
        return inputs.discountRate;
      case 'timeHorizon':
        return inputs.timeHorizon;
      case 'riskFactor':
        return inputs.riskFactor;
      default:
        return 0;
    }
  }
  
  private static calculateRobustnessScore(factors: SensitivityFactor[]): number {
    if (factors.length === 0) return 1;
    
    // Calculate average volatility
    const totalVolatility = factors.reduce((sum, factor) => {
      const volatility = Math.max(Math.abs(factor.impactOnROI.high), Math.abs(factor.impactOnROI.low));
      return sum + volatility;
    }, 0);
    
    const avgVolatility = totalVolatility / factors.length;
    
    // Convert to robustness score (lower volatility = higher robustness)
    // Scale so that 0% volatility = 1.0 robustness, 100% volatility = 0.0 robustness
    return Math.max(0, Math.min(1, 1 - (avgVolatility / 100)));
  }
  
  private static assessRisk(factors: SensitivityFactor[]): {
    highRiskFactors: string[];
    mediumRiskFactors: string[];
    lowRiskFactors: string[];
  } {
    const highRisk: string[] = [];
    const mediumRisk: string[] = [];
    const lowRisk: string[] = [];
    
    factors.forEach(factor => {
      const maxImpact = Math.max(Math.abs(factor.impactOnROI.high), Math.abs(factor.impactOnROI.low));
      
      if (maxImpact > 50) { // >50% ROI swing
        highRisk.push(factor.variable);
      } else if (maxImpact > 20) { // >20% ROI swing
        mediumRisk.push(factor.variable);
      } else {
        lowRisk.push(factor.variable);
      }
    });
    
    return {
      highRiskFactors: highRisk,
      mediumRiskFactors: mediumRisk,
      lowRiskFactors: lowRisk
    };
  }
  
  private static generateRecommendations(
    factors: SensitivityFactor[],
    criticalVariables: string[],
    robustnessScore: number
  ): string[] {
    const recommendations: string[] = [];
    
    // Robustness-based recommendations
    if (robustnessScore < 0.3) {
      recommendations.push('HIGH PRIORITY: Project shows high sensitivity to input variations. Consider additional risk mitigation strategies.');
    } else if (robustnessScore < 0.6) {
      recommendations.push('MEDIUM PRIORITY: Project has moderate sensitivity. Monitor key variables closely during implementation.');
    } else {
      recommendations.push('LOW RISK: Project shows good robustness to input variations.');
    }
    
    // Critical variable recommendations
    if (criticalVariables.length > 0) {
      recommendations.push(`Focus monitoring and control on critical variables: ${criticalVariables.join(', ')}`);
    }
    
    // Specific variable recommendations
    factors.slice(0, 3).forEach(factor => { // Top 3 most sensitive
      const maxImpact = Math.max(Math.abs(factor.impactOnROI.high), Math.abs(factor.impactOnROI.low));
      
      if (factor.variable === 'annualBenefits' && maxImpact > 30) {
        recommendations.push('Consider conservative benefit estimates and implement milestone-based validation.');
      } else if (factor.variable === 'implementationCosts' && maxImpact > 25) {
        recommendations.push('Establish detailed cost controls and contingency planning for implementation.');
      } else if (factor.variable === 'timeHorizon' && maxImpact > 20) {
        recommendations.push('Develop phased implementation approach to reduce timeline risks.');
      } else if (factor.variable === 'discountRate' && maxImpact > 15) {
        recommendations.push('Consider multiple discount rate scenarios in final decision making.');
      }
    });
    
    return recommendations;
  }
  
  // Advanced sensitivity analysis with interaction effects
  static performInteractionAnalysis(
    baseInputs: ROICalculationInputs,
    variablePairs: { var1: string; var2: string }[],
    variableRanges: { [key: string]: { min: number; max: number } }
  ): {
    interactions: {
      variables: string[];
      independentEffect: number;
      combinedEffect: number;
      interactionEffect: number;
    }[];
    significantInteractions: string[][];
  } {
    const baseROI = ROICalculator.calculateROI(baseInputs).roi;
    const interactions: any[] = [];
    
    variablePairs.forEach(pair => {
      const { var1, var2 } = pair;
      
      if (!variableRanges[var1] || !variableRanges[var2]) return;
      
      // Test var1 alone
      const var1OnlyInputs = this.adjustVariable(baseInputs, var1, variableRanges[var1].max);
      const var1Effect = var1OnlyInputs ? ROICalculator.calculateROI(var1OnlyInputs).roi - baseROI : 0;
      
      // Test var2 alone
      const var2OnlyInputs = this.adjustVariable(baseInputs, var2, variableRanges[var2].max);
      const var2Effect = var2OnlyInputs ? ROICalculator.calculateROI(var2OnlyInputs).roi - baseROI : 0;
      
      // Test both together
      let combinedInputs = this.adjustVariable(baseInputs, var1, variableRanges[var1].max);
      if (combinedInputs) {
        combinedInputs = this.adjustVariable(combinedInputs, var2, variableRanges[var2].max);
      }
      const combinedEffect = combinedInputs ? ROICalculator.calculateROI(combinedInputs).roi - baseROI : 0;
      
      // Calculate interaction effect
      const independentEffect = var1Effect + var2Effect;
      const interactionEffect = combinedEffect - independentEffect;
      
      interactions.push({
        variables: [var1, var2],
        independentEffect,
        combinedEffect,
        interactionEffect: Math.abs(interactionEffect)
      });
    });
    
    // Identify significant interactions (>10% additional impact)
    const significantInteractions = interactions
      .filter(interaction => Math.abs(interaction.interactionEffect) > 10)
      .sort((a, b) => b.interactionEffect - a.interactionEffect)
      .map(interaction => interaction.variables);
    
    return {
      interactions,
      significantInteractions
    };
  }
  
  // Tornado diagram data generation
  static generateTornadoDiagramData(factors: SensitivityFactor[]): {
    variable: string;
    lowImpact: number;
    highImpact: number;
    range: number;
    label: string;
  }[] {
    return factors
      .map(factor => ({
        variable: factor.variable,
        lowImpact: factor.impactOnROI.low,
        highImpact: factor.impactOnROI.high,
        range: Math.abs(factor.impactOnROI.high - factor.impactOnROI.low),
        label: this.getVariableLabel(factor.variable)
      }))
      .sort((a, b) => b.range - a.range);
  }
  
  private static getVariableLabel(variable: string): string {
    const labelMap: { [key: string]: string } = {
      'annualBenefits': 'Annual Benefits',
      'initialInvestment': 'Initial Investment',
      'implementationCosts': 'Implementation Costs',
      'maintenanceCosts': 'Maintenance Costs',
      'discountRate': 'Discount Rate',
      'timeHorizon': 'Time Horizon',
      'riskFactor': 'Risk Factor'
    };
    
    return labelMap[variable] || variable.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
  }
  
  // Break-even analysis for sensitive variables
  static findBreakEvenPoints(
    baseInputs: ROICalculationInputs,
    sensitiveVariables: string[]
  ): { variable: string; breakEvenValue: number; currentValue: number }[] {
    const results: { variable: string; breakEvenValue: number; currentValue: number }[] = [];
    
    sensitiveVariables.forEach(variable => {
      const currentValue = this.getBaseValue(baseInputs, variable);
      const breakEvenValue = this.findBreakEvenValue(baseInputs, variable);
      
      if (breakEvenValue !== null) {
        results.push({
          variable,
          breakEvenValue,
          currentValue
        });
      }
    });
    
    return results;
  }
  
  private static findBreakEvenValue(
    baseInputs: ROICalculationInputs,
    variable: string
  ): number | null {
    // Use binary search to find break-even point (ROI = 0)
    let low = 0;
    let high = this.getBaseValue(baseInputs, variable) * 10; // Start with 10x current value
    const tolerance = 0.01;
    const maxIterations = 50;
    
    for (let i = 0; i < maxIterations; i++) {
      const mid = (low + high) / 2;
      const testInputs = this.adjustVariable(baseInputs, variable, mid);
      
      if (!testInputs) return null;
      
      const roi = ROICalculator.calculateROI(testInputs).roi;
      
      if (Math.abs(roi) < tolerance) {
        return mid;
      }
      
      if (roi > 0) {
        high = mid;
      } else {
        low = mid;
      }
    }
    
    return (low + high) / 2;
  }
}