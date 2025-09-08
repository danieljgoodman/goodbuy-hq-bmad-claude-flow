import { 
  ROICalculationInputs, 
  ROICalculationResults, 
  ScenarioModelingInputs, 
  ScenarioModelingResults,
  BusinessMetrics,
  ImpactAnalysis,
  BenchmarkData,
  MarketFactor,
  RiskAssessment
} from '@/types/impact-analysis';
import { ImprovementOpportunity } from '@/types/opportunities';
import { ROICalculator } from '@/lib/calculators/roi-calculator';
import { ScenarioModeler } from '@/lib/calculators/scenario-modeler';
import { SensitivityAnalyzer, SensitivityAnalysisResults } from '@/lib/calculators/sensitivity-analyzer';

export interface ComprehensiveImpactAnalysis {
  opportunityId: string;
  roiAnalysis: ROICalculationResults;
  scenarioAnalysis: ScenarioModelingResults;
  sensitivityAnalysis: SensitivityAnalysisResults;
  riskAssessment: RiskAssessment[];
  benchmarkComparison: BenchmarkData;
  marketFactors: MarketFactor[];
  confidenceLevel: number;
  methodology: string;
  assumptions: string[];
  analysisDate: Date;
}

export class ImpactService {
  
  async performComprehensiveImpactAnalysis(
    opportunity: ImprovementOpportunity,
    businessMetrics: BusinessMetrics,
    marketData?: any
  ): Promise<ComprehensiveImpactAnalysis> {
    
    // Create base ROI calculation inputs
    const roiInputs = this.createROIInputs(opportunity, businessMetrics);
    
    // Perform ROI analysis
    const roiAnalysis = ROICalculator.calculateROI(roiInputs);
    
    // Create scenario modeling inputs
    const scenarioInputs = this.createScenarioInputs(roiInputs, opportunity.category);
    
    // Perform scenario analysis
    const scenarioAnalysis = ScenarioModeler.generateScenarios(scenarioInputs);
    
    // Create variable ranges for sensitivity analysis
    const variableRanges = this.createVariableRanges(opportunity.category);
    
    // Perform sensitivity analysis
    const sensitivityAnalysis = SensitivityAnalyzer.performSensitivityAnalysis(roiInputs, variableRanges);
    
    // Assess risks
    const riskAssessment = this.assessRisks(opportunity, scenarioAnalysis, sensitivityAnalysis);
    
    // Get benchmark comparison
    const benchmarkComparison = this.getBenchmarkComparison(opportunity, businessMetrics, marketData);
    
    // Identify market factors
    const marketFactors = this.identifyMarketFactors(opportunity, marketData);
    
    // Calculate overall confidence level
    const confidenceLevel = this.calculateConfidenceLevel(
      roiAnalysis,
      scenarioAnalysis,
      sensitivityAnalysis,
      opportunity.confidence
    );
    
    // Generate methodology description and assumptions
    const { methodology, assumptions } = this.generateMethodologyAndAssumptions(opportunity, roiInputs);
    
    return {
      opportunityId: opportunity.id,
      roiAnalysis,
      scenarioAnalysis,
      sensitivityAnalysis,
      riskAssessment,
      benchmarkComparison,
      marketFactors,
      confidenceLevel,
      methodology,
      assumptions,
      analysisDate: new Date()
    };
  }
  
  private createROIInputs(opportunity: ImprovementOpportunity, businessMetrics: BusinessMetrics): ROICalculationInputs {
    const timeHorizon = 3; // 3-year analysis
    const discountRate = 0.10; // 10% discount rate
    
    // Extract values from opportunity impact estimate
    const annualRevenueBenefit = opportunity.impactEstimate.revenueIncrease.amount;
    const annualCostSavings = opportunity.impactEstimate.costReduction.amount;
    const initialInvestment = opportunity.implementationRequirements.investmentRequired;
    
    // Create annual benefits array
    const annualBenefits: number[] = [];
    for (let year = 0; year < timeHorizon; year++) {
      // Assume benefits ramp up over time
      const rampMultiplier = Math.min(1, (year + 1) * 0.7);
      annualBenefits.push((annualRevenueBenefit + annualCostSavings) * rampMultiplier);
    }
    
    // Create implementation costs array
    const implementationCosts: number[] = [];
    const totalImplementationCost = initialInvestment * 0.3; // 30% additional implementation costs
    implementationCosts.push(totalImplementationCost * 0.7); // 70% in year 1
    implementationCosts.push(totalImplementationCost * 0.3); // 30% in year 2
    implementationCosts.push(0); // No additional implementation in year 3
    
    // Create maintenance costs array
    const annualMaintenanceCost = (annualRevenueBenefit + annualCostSavings) * 0.1; // 10% of benefits
    const maintenanceCosts: number[] = Array(timeHorizon).fill(annualMaintenanceCost);
    
    return {
      initialInvestment,
      annualBenefits,
      implementationCosts,
      maintenanceCosts,
      discountRate,
      timeHorizon,
      riskFactor: this.calculateRiskFactor(opportunity)
    };
  }
  
  private createScenarioInputs(roiInputs: ROICalculationInputs, category: string): ScenarioModelingInputs {
    // Create variable ranges based on opportunity category
    const variableRanges = ScenarioModeler.createStandardVariableRanges(category);
    
    // Define correlations
    const correlations = [
      { variable1: 'annualBenefits', variable2: 'implementationCosts', correlation: 0.3 },
      { variable1: 'riskFactor', variable2: 'annualBenefits', correlation: -0.4 }
    ];
    
    return {
      baseCase: roiInputs,
      variableRanges,
      correlations
    };
  }
  
  private createVariableRanges(category: string): { [key: string]: { min: number; max: number } } {
    const baseRanges = {
      annualBenefits: { min: 0.6, max: 1.4 },
      implementationCosts: { min: 0.8, max: 1.5 },
      maintenanceCosts: { min: 0.9, max: 1.2 },
      discountRate: { min: 0.05, max: 0.15 },
      riskFactor: { min: 0.1, max: 0.5 },
      timeHorizon: { min: 2, max: 5 }
    };
    
    // Adjust ranges based on category
    switch (category) {
      case 'financial':
        baseRanges.annualBenefits = { min: 0.8, max: 1.2 }; // More predictable
        break;
      case 'strategic':
        baseRanges.annualBenefits = { min: 0.5, max: 2.0 }; // More variable
        baseRanges.timeHorizon = { min: 3, max: 7 }; // Longer timeframe
        break;
      case 'marketing':
        baseRanges.annualBenefits = { min: 0.4, max: 2.5 }; // Highly variable
        break;
      case 'operational':
        baseRanges.implementationCosts = { min: 0.9, max: 1.3 }; // More predictable costs
        break;
    }
    
    return baseRanges;
  }
  
  private calculateRiskFactor(opportunity: ImprovementOpportunity): number {
    let riskFactor = 0.2; // Base risk
    
    // Adjust based on difficulty
    switch (opportunity.implementationRequirements.difficulty) {
      case 'low':
        riskFactor += 0.05;
        break;
      case 'medium':
        riskFactor += 0.1;
        break;
      case 'high':
        riskFactor += 0.2;
        break;
      case 'very_high':
        riskFactor += 0.3;
        break;
    }
    
    // Adjust based on confidence
    riskFactor += (1 - opportunity.confidence) * 0.2;
    
    // Adjust based on category
    switch (opportunity.category) {
      case 'strategic':
        riskFactor += 0.1; // Strategic initiatives are riskier
        break;
      case 'marketing':
        riskFactor += 0.15; // Marketing has variable outcomes
        break;
      case 'financial':
        riskFactor -= 0.05; // Financial improvements more predictable
        break;
    }
    
    return Math.max(0.1, Math.min(0.5, riskFactor));
  }
  
  private assessRisks(
    opportunity: ImprovementOpportunity,
    scenarioAnalysis: ScenarioModelingResults,
    sensitivityAnalysis: SensitivityAnalysisResults
  ): RiskAssessment[] {
    const risks: RiskAssessment[] = [];
    
    // Implementation risk
    if (opportunity.implementationRequirements.difficulty === 'very_high') {
      risks.push({
        risk: 'Implementation Complexity',
        probability: 0.4,
        impact: 0.6,
        mitigation: 'Phased implementation approach with expert consultation',
        riskScore: 0.24
      });
    }
    
    // Benefit realization risk
    if (scenarioAnalysis.probability.positiveROI < 0.7) {
      risks.push({
        risk: 'Benefit Realization',
        probability: 1 - scenarioAnalysis.probability.positiveROI,
        impact: 0.8,
        mitigation: 'Conservative benefit estimates with milestone validation',
        riskScore: (1 - scenarioAnalysis.probability.positiveROI) * 0.8
      });
    }
    
    // Market risk
    if (opportunity.category === 'marketing' || opportunity.category === 'strategic') {
      risks.push({
        risk: 'Market Conditions',
        probability: 0.3,
        impact: 0.5,
        mitigation: 'Market monitoring and adaptive strategy',
        riskScore: 0.15
      });
    }
    
    // Technology risk for digital initiatives
    if (opportunity.title.toLowerCase().includes('digital') || opportunity.title.toLowerCase().includes('automation')) {
      risks.push({
        risk: 'Technology Implementation',
        probability: 0.25,
        impact: 0.7,
        mitigation: 'Proof of concept and vendor evaluation',
        riskScore: 0.175
      });
    }
    
    // Sort by risk score (highest first)
    return risks.sort((a, b) => b.riskScore - a.riskScore);
  }
  
  private getBenchmarkComparison(
    opportunity: ImprovementOpportunity,
    businessMetrics: BusinessMetrics,
    marketData?: any
  ): BenchmarkData {
    // This would typically fetch real industry benchmark data
    // For now, we'll create representative benchmark data
    
    const metric = `${opportunity.category}_improvement_roi`;
    const companyROI = opportunity.impactEstimate.roi.percentage;
    
    // Industry benchmarks (would come from external data sources)
    const industryAverage = this.getIndustryAverageROI(opportunity.category);
    const topQuartile = industryAverage * 1.5;
    const bottomQuartile = industryAverage * 0.6;
    
    // Calculate percentile rank
    let percentileRank: number;
    if (companyROI >= topQuartile) {
      percentileRank = 90 + ((companyROI - topQuartile) / topQuartile) * 10;
    } else if (companyROI >= industryAverage) {
      percentileRank = 50 + ((companyROI - industryAverage) / (topQuartile - industryAverage)) * 40;
    } else if (companyROI >= bottomQuartile) {
      percentileRank = 25 + ((companyROI - bottomQuartile) / (industryAverage - bottomQuartile)) * 25;
    } else {
      percentileRank = (companyROI / bottomQuartile) * 25;
    }
    
    return {
      industry: 'General Business', // Would be determined from business data
      metric,
      industryAverage,
      topQuartile,
      companyValue: companyROI,
      percentileRank: Math.max(0, Math.min(100, percentileRank))
    };
  }
  
  private getIndustryAverageROI(category: string): number {
    // Industry average ROI by category (would come from research data)
    const averages = {
      financial: 25,
      operational: 30,
      marketing: 35,
      strategic: 20,
      technology: 40,
      hr: 18
    };
    
    return averages[category as keyof typeof averages] || 25;
  }
  
  private identifyMarketFactors(opportunity: ImprovementOpportunity, marketData?: any): MarketFactor[] {
    const factors: MarketFactor[] = [];
    
    // Economic factors
    factors.push({
      factor: 'Economic Conditions',
      impact: 'neutral',
      magnitude: 0.1,
      description: 'Current economic conditions are stable with moderate growth outlook'
    });
    
    // Technology trends
    if (opportunity.title.toLowerCase().includes('digital') || opportunity.title.toLowerCase().includes('automation')) {
      factors.push({
        factor: 'Digital Transformation Trend',
        impact: 'positive',
        magnitude: 0.2,
        description: 'Strong market trend toward digital transformation supporting implementation success'
      });
    }
    
    // Competitive pressure
    if (opportunity.category === 'strategic' || opportunity.category === 'marketing') {
      factors.push({
        factor: 'Competitive Pressure',
        impact: 'positive',
        magnitude: 0.15,
        description: 'Increasing competitive pressure makes this improvement strategically important'
      });
    }
    
    // Regulatory environment
    if (opportunity.category === 'operational' || opportunity.category === 'financial') {
      factors.push({
        factor: 'Regulatory Environment',
        impact: 'neutral',
        magnitude: 0.05,
        description: 'Stable regulatory environment with moderate compliance requirements'
      });
    }
    
    return factors;
  }
  
  private calculateConfidenceLevel(
    roiAnalysis: ROICalculationResults,
    scenarioAnalysis: ScenarioModelingResults,
    sensitivityAnalysis: SensitivityAnalysisResults,
    opportunityConfidence: number
  ): number {
    let confidence = opportunityConfidence; // Start with opportunity identification confidence
    
    // Adjust based on ROI analysis confidence
    confidence = (confidence + roiAnalysis.confidence) / 2;
    
    // Adjust based on scenario probability of positive ROI
    confidence = (confidence + scenarioAnalysis.probability.positiveROI) / 2;
    
    // Adjust based on sensitivity robustness
    confidence = (confidence + sensitivityAnalysis.robustnessScore) / 2;
    
    // Penalize if there are critical risk factors
    if (sensitivityAnalysis.riskAssessment.highRiskFactors.length > 2) {
      confidence *= 0.9;
    }
    
    return Math.max(0.1, Math.min(0.95, confidence));
  }
  
  private generateMethodologyAndAssumptions(
    opportunity: ImprovementOpportunity,
    roiInputs: ROICalculationInputs
  ): { methodology: string; assumptions: string[] } {
    const methodology = `Comprehensive impact analysis using discounted cash flow (DCF) methodology with scenario modeling and sensitivity analysis. 
    Base case ROI calculated over ${roiInputs.timeHorizon} years with ${(roiInputs.discountRate * 100).toFixed(1)}% discount rate. 
    Monte Carlo simulation performed across ${opportunity.category} improvement patterns with industry benchmarking.`;
    
    const assumptions = [
      `Annual benefits ramp up over ${roiInputs.timeHorizon} years as implementation matures`,
      `Implementation costs distributed across first 2 years with 70/30 split`,
      `Maintenance costs estimated at 10% of annual benefits`,
      `Risk factor of ${(roiInputs.riskFactor * 100).toFixed(1)}% applied based on implementation difficulty and market conditions`,
      'Benefits maintain constant value in real terms over analysis period',
      'No significant changes in competitive landscape or regulatory environment',
      'Organization has necessary capabilities and resources for implementation',
      'Market conditions remain stable throughout implementation period'
    ];
    
    return { methodology, assumptions };
  }
  
  // Utility methods for creating impact analyses from opportunities
  async createImpactAnalysisRecord(
    comprehensiveAnalysis: ComprehensiveImpactAnalysis
  ): Promise<ImpactAnalysis> {
    return {
      id: `impact_${comprehensiveAnalysis.opportunityId}_${Date.now()}`,
      opportunityId: comprehensiveAnalysis.opportunityId,
      methodology: comprehensiveAnalysis.methodology,
      assumptions: comprehensiveAnalysis.assumptions,
      scenarios: {
        conservative: this.convertToScenarioProjection(comprehensiveAnalysis.scenarioAnalysis.conservative),
        realistic: this.convertToScenarioProjection(comprehensiveAnalysis.scenarioAnalysis.realistic),
        optimistic: this.convertToScenarioProjection(comprehensiveAnalysis.scenarioAnalysis.optimistic)
      },
      sensitivityAnalysis: comprehensiveAnalysis.sensitivityAnalysis.factors,
      benchmarkComparison: comprehensiveAnalysis.benchmarkComparison,
      marketConditions: comprehensiveAnalysis.marketFactors,
      riskFactors: comprehensiveAnalysis.riskAssessment,
      confidenceLevel: comprehensiveAnalysis.confidenceLevel,
      analysisDate: comprehensiveAnalysis.analysisDate
    };
  }
  
  private convertToScenarioProjection(roiResult: ROICalculationResults): any {
    return {
      revenueImpact: roiResult.totalReturn * 0.6, // Assume 60% revenue impact
      costImpact: roiResult.totalReturn * 0.4,    // Assume 40% cost impact
      timeline: `${Math.round(roiResult.paybackPeriod)} months payback`,
      probability: roiResult.confidence,
      keyAssumptions: ['Based on DCF analysis', 'Risk-adjusted returns', 'Industry benchmarked']
    };
  }
}