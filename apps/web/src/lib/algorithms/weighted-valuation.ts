import { AssetBasedValuationEngine } from './asset-based';
import { IncomeBasedValuationEngine } from './income-based';
import { MarketBasedValuationEngine } from './market-based';
import { BusinessEvaluation, RiskFactor } from '@/types/valuation';

interface BusinessData {
  annualRevenue: number;
  monthlyRecurring: number;
  expenses: number;
  cashFlow: number;
  assets: {
    tangible: number;
    intangible: number;
    inventory: number;
    equipment: number;
    realEstate: number;
  };
  liabilities: {
    shortTerm: number;
    longTerm: number;
    contingent: number;
  };
  customerCount: number;
  marketPosition: string;
  industry: string;
  businessAge: number;
  growthRate: number;
}

export class WeightedValuationEngine {
  private assetEngine = new AssetBasedValuationEngine();
  private incomeEngine = new IncomeBasedValuationEngine();
  private marketEngine = new MarketBasedValuationEngine();

  // Industry-specific weighting preferences
  private industryWeights: Map<string, { asset: number; income: number; market: number }> = new Map([
    ['manufacturing', { asset: 0.5, income: 0.3, market: 0.2 }], // Asset-heavy
    ['real_estate', { asset: 0.6, income: 0.2, market: 0.2 }], // Asset-heavy
    ['technology', { asset: 0.1, income: 0.5, market: 0.4 }], // Income/Market focused
    ['software', { asset: 0.1, income: 0.4, market: 0.5 }], // Market focused
    ['healthcare', { asset: 0.3, income: 0.4, market: 0.3 }], // Balanced
    ['finance', { asset: 0.2, income: 0.4, market: 0.4 }], // Income/Market
    ['retail', { asset: 0.4, income: 0.3, market: 0.3 }], // Asset-focused
    ['services', { asset: 0.2, income: 0.5, market: 0.3 }], // Income-focused
    ['e_commerce', { asset: 0.2, income: 0.4, market: 0.4 }], // Income/Market
  ]);

  async calculateWeightedValuation(
    businessData: BusinessData,
    userId: string
  ): Promise<BusinessEvaluation> {
    const startTime = Date.now();
    
    try {
      // Run all three methodologies in parallel for speed
      const [assetValuation, incomeValuation, marketValuation] = await Promise.all([
        this.calculateAssetBasedValuation(businessData),
        this.calculateIncomeBasedValuation(businessData),
        this.calculateMarketBasedValuation(businessData),
      ]);

      // Calculate methodology weights
      const weights = this.calculateMethodologyWeights(businessData, {
        asset: assetValuation.confidence,
        income: incomeValuation.confidence,
        market: marketValuation.confidence,
      });

      // Calculate weighted final valuation
      const weightedValue = 
        (assetValuation.value * weights.asset) +
        (incomeValuation.value * weights.income) +
        (marketValuation.value * weights.market);

      // Calculate valuation range (±20% based on confidence)
      const overallConfidence = this.calculateOverallConfidence({
        asset: assetValuation.confidence,
        income: incomeValuation.confidence,
        market: marketValuation.confidence,
      }, weights);

      const rangePercentage = (1 - overallConfidence) * 0.4; // Max 40% range for low confidence
      const range = {
        min: weightedValue * (1 - rangePercentage),
        max: weightedValue * (1 + rangePercentage),
      };

      // Calculate confidence factors
      const confidenceFactors = this.calculateConfidenceFactors(businessData);

      // Identify risk factors
      const riskFactors = this.identifyRiskFactors(businessData);

      const processingTime = Date.now() - startTime;

      return {
        id: `eval-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        userId,
        businessData,
        valuations: {
          assetBased: {
            value: assetValuation.value,
            confidence: assetValuation.confidence,
            methodology: assetValuation.methodology,
            assumptions: assetValuation.assumptions,
            adjustments: assetValuation.adjustments,
          },
          incomeBased: {
            value: incomeValuation.value,
            confidence: incomeValuation.confidence,
            methodology: incomeValuation.methodology,
            discountRate: incomeValuation.discountRate,
            growthAssumptions: incomeValuation.growthAssumptions,
            terminalValue: incomeValuation.terminalValue,
          },
          marketBased: {
            value: marketValuation.value,
            confidence: marketValuation.confidence,
            methodology: marketValuation.methodology,
            comparableCompanies: marketValuation.comparableCompanies,
            multiples: marketValuation.multiples,
          },
          weighted: {
            value: weightedValue,
            range,
            confidence: overallConfidence,
            weights,
            methodology: 'Weighted Multi-Methodology Valuation',
          },
        },
        confidenceFactors,
        riskFactors,
        processingTime,
        status: 'completed',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    } catch (error) {
      return {
        id: `eval-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        userId,
        businessData,
        valuations: {
          assetBased: { value: 0, confidence: 0, methodology: '', assumptions: [], adjustments: [] },
          incomeBased: { value: 0, confidence: 0, methodology: '', discountRate: 0, growthAssumptions: [], terminalValue: 0 },
          marketBased: { value: 0, confidence: 0, methodology: '', comparableCompanies: [], multiples: [] },
          weighted: { value: 0, range: { min: 0, max: 0 }, confidence: 0, weights: { asset: 0, income: 0, market: 0 }, methodology: 'Failed' },
        },
        confidenceFactors: { dataQuality: 0, industryReliability: 0, businessStability: 0, marketConditions: 0, overall: 0 },
        riskFactors: [],
        processingTime: Date.now() - startTime,
        status: 'failed',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    }
  }

  private async calculateAssetBasedValuation(businessData: BusinessData) {
    return this.assetEngine.calculateAssetBasedValuation({
      assets: businessData.assets,
      liabilities: businessData.liabilities,
      industry: businessData.industry,
      businessAge: businessData.businessAge,
      marketConditions: 3.0, // Default market conditions (1-5 scale)
    });
  }

  private async calculateIncomeBasedValuation(businessData: BusinessData) {
    return this.incomeEngine.calculateIncomeBasedValuation({
      financials: {
        annualRevenue: businessData.annualRevenue,
        monthlyRecurring: businessData.monthlyRecurring,
        expenses: businessData.expenses,
        cashFlow: businessData.cashFlow,
        growthRate: businessData.growthRate,
      },
      industry: businessData.industry,
      businessAge: businessData.businessAge,
      marketPosition: businessData.marketPosition,
      customerCount: businessData.customerCount,
    });
  }

  private async calculateMarketBasedValuation(businessData: BusinessData) {
    return this.marketEngine.calculateMarketBasedValuation({
      annualRevenue: businessData.annualRevenue,
      cashFlow: businessData.cashFlow,
      industry: businessData.industry,
      businessAge: businessData.businessAge,
      growthRate: businessData.growthRate,
      customerCount: businessData.customerCount,
      marketPosition: businessData.marketPosition,
    });
  }

  private calculateMethodologyWeights(
    businessData: BusinessData,
    confidences: { asset: number; income: number; market: number }
  ): { asset: number; income: number; market: number } {
    // Start with industry-specific base weights
    const baseWeights = this.industryWeights.get(businessData.industry.toLowerCase()) || 
                       { asset: 0.3, income: 0.4, market: 0.3 };

    // Adjust weights based on confidence scores
    let { asset, income, market } = baseWeights;

    // Boost weights for higher confidence methodologies
    const confidenceBoost = 0.3;
    const avgConfidence = (confidences.asset + confidences.income + confidences.market) / 3;

    if (confidences.asset > avgConfidence) {
      asset += (confidences.asset - avgConfidence) * confidenceBoost;
    }
    if (confidences.income > avgConfidence) {
      income += (confidences.income - avgConfidence) * confidenceBoost;
    }
    if (confidences.market > avgConfidence) {
      market += (confidences.market - avgConfidence) * confidenceBoost;
    }

    // Adjust based on business characteristics
    const totalAssets = Object.values(businessData.assets).reduce((sum, val) => sum + val, 0);
    const assetIntensity = totalAssets / Math.max(businessData.annualRevenue, 1);

    if (assetIntensity > 2.0) {
      // Asset-heavy business - increase asset weighting
      asset += 0.2;
      income -= 0.1;
      market -= 0.1;
    } else if (assetIntensity < 0.5) {
      // Asset-light business - decrease asset weighting
      asset -= 0.15;
      income += 0.08;
      market += 0.07;
    }

    // For unprofitable businesses, reduce income weighting
    if (businessData.cashFlow <= 0) {
      income *= 0.7;
      asset += 0.15;
      market += 0.15;
    }

    // For very young businesses, reduce income weighting
    if (businessData.businessAge < 2) {
      income *= 0.8;
      asset += 0.1;
      market += 0.1;
    }

    // Normalize weights to sum to 1
    const total = asset + income + market;
    return {
      asset: asset / total,
      income: income / total,
      market: market / total,
    };
  }

  private calculateOverallConfidence(
    confidences: { asset: number; income: number; market: number },
    weights: { asset: number; income: number; market: number }
  ): number {
    // Weighted average of individual confidences
    const weightedConfidence = 
      (confidences.asset * weights.asset) +
      (confidences.income * weights.income) +
      (confidences.market * weights.market);

    // Boost confidence if all methodologies agree (within 30%)
    const values = [confidences.asset, confidences.income, confidences.market];
    const avgConfidence = values.reduce((sum, val) => sum + val, 0) / values.length;
    const maxDeviation = Math.max(...values.map(val => Math.abs(val - avgConfidence)));

    if (maxDeviation < 0.15) {
      return Math.min(0.95, weightedConfidence + 0.1); // Boost for agreement
    }

    return weightedConfidence;
  }

  private calculateConfidenceFactors(businessData: BusinessData) {
    const factors = {
      dataQuality: this.assessDataQuality(businessData),
      industryReliability: this.assessIndustryReliability(businessData.industry),
      businessStability: this.assessBusinessStability(businessData),
      marketConditions: 0.75, // Default market conditions factor
      overall: 0,
    };

    factors.overall = (
      factors.dataQuality * 0.3 +
      factors.industryReliability * 0.2 +
      factors.businessStability * 0.3 +
      factors.marketConditions * 0.2
    );

    return factors;
  }

  private assessDataQuality(businessData: BusinessData): number {
    let quality = 0.5; // Base quality score

    // Check for completeness of financial data
    if (businessData.annualRevenue > 0) quality += 0.15;
    if (businessData.cashFlow !== 0) quality += 0.1; // Even negative is better than missing
    if (businessData.expenses > 0) quality += 0.1;

    // Check for asset data completeness
    const totalAssets = Object.values(businessData.assets).reduce((sum, val) => sum + val, 0);
    if (totalAssets > 0) quality += 0.1;

    // Check for customer data
    if (businessData.customerCount > 0) quality += 0.05;

    // Check for growth data
    if (businessData.growthRate !== 0) quality += 0.05;

    // Penalize for obviously inconsistent data
    if (businessData.cashFlow > businessData.annualRevenue) quality -= 0.2;
    if (businessData.expenses > businessData.annualRevenue * 2) quality -= 0.1;

    return Math.max(0.1, Math.min(0.95, quality));
  }

  private assessIndustryReliability(industry: string): number {
    const industryReliability = {
      manufacturing: 0.85, // Well-established valuation methods
      real_estate: 0.90, // Asset-based, transparent market
      healthcare: 0.80, // Regulated, predictable
      finance: 0.75, // Complex but established
      technology: 0.70, // Volatile but data available
      software: 0.65, // High growth variance
      retail: 0.75, // Established but cyclical
      services: 0.70, // Wide variance
      e_commerce: 0.60, // Relatively new, volatile
    };

    return industryReliability[industry.toLowerCase() as keyof typeof industryReliability] || 0.65;
  }

  private assessBusinessStability(businessData: BusinessData): number {
    let stability = 0.5; // Base stability

    // Age stability
    if (businessData.businessAge > 10) stability += 0.2;
    else if (businessData.businessAge > 5) stability += 0.15;
    else if (businessData.businessAge > 2) stability += 0.1;
    else stability -= 0.1; // Young business penalty

    // Profitability stability
    if (businessData.cashFlow > 0) {
      const cashFlowMargin = businessData.cashFlow / businessData.annualRevenue;
      if (cashFlowMargin > 0.20) stability += 0.15;
      else if (cashFlowMargin > 0.10) stability += 0.10;
      else stability += 0.05;
    } else {
      stability -= 0.15; // Unprofitable penalty
    }

    // Customer diversification
    if (businessData.customerCount > 500) stability += 0.1;
    else if (businessData.customerCount > 100) stability += 0.05;
    else if (businessData.customerCount < 10) stability -= 0.1;

    // Revenue size (larger = more stable)
    if (businessData.annualRevenue > 10000000) stability += 0.1;
    else if (businessData.annualRevenue > 1000000) stability += 0.05;

    return Math.max(0.1, Math.min(0.95, stability));
  }

  private identifyRiskFactors(businessData: BusinessData): RiskFactor[] {
    const riskFactors: RiskFactor[] = [];

    // Financial risks
    if (businessData.cashFlow < 0) {
      riskFactors.push({
        id: `risk-negative-cashflow-${Date.now()}`,
        category: 'financial',
        factor: 'Negative Cash Flow',
        impact: 'high',
        likelihood: 1.0,
        description: 'Business is currently cash flow negative, indicating potential financial distress',
        mitigation: ['Improve operational efficiency', 'Reduce expenses', 'Increase revenue'],
      });
    }

    // Operational risks
    if (businessData.businessAge < 2) {
      riskFactors.push({
        id: `risk-early-stage-${Date.now()}`,
        category: 'operational',
        factor: 'Early Stage Business',
        impact: 'medium',
        likelihood: 0.8,
        description: 'Young businesses have higher failure rates and less predictable performance',
        mitigation: ['Establish strong management team', 'Build cash reserves', 'Focus on customer retention'],
      });
    }

    if (businessData.customerCount < 20) {
      riskFactors.push({
        id: `risk-customer-concentration-${Date.now()}`,
        category: 'operational',
        factor: 'Customer Concentration',
        impact: 'medium',
        likelihood: 0.7,
        description: 'Heavy reliance on small number of customers creates revenue vulnerability',
        mitigation: ['Diversify customer base', 'Develop customer retention programs', 'Create contractual protections'],
      });
    }

    // Market risks
    const volatileIndustries = ['technology', 'software', 'e_commerce', 'retail'];
    if (volatileIndustries.includes(businessData.industry.toLowerCase())) {
      riskFactors.push({
        id: `risk-market-volatility-${Date.now()}`,
        category: 'market',
        factor: 'Market Volatility',
        impact: 'medium',
        likelihood: 0.6,
        description: `${businessData.industry} industry is subject to rapid changes and volatility`,
        mitigation: ['Monitor market trends', 'Maintain flexibility', 'Build competitive moats'],
      });
    }

    // Debt/liability risks
    const totalLiabilities = Object.values(businessData.liabilities).reduce((sum, val) => sum + val, 0);
    const debtToRevenue = totalLiabilities / Math.max(businessData.annualRevenue, 1);
    
    if (debtToRevenue > 1.0) {
      riskFactors.push({
        id: `risk-high-debt-${Date.now()}`,
        category: 'financial',
        factor: 'High Debt Load',
        impact: 'high',
        likelihood: 0.8,
        description: 'Debt levels are high relative to revenue, creating financial leverage risk',
        mitigation: ['Reduce debt levels', 'Negotiate better terms', 'Improve cash flow'],
      });
    }

    return riskFactors;
  }
}