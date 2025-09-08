import { MarketBasedValuation, ComparableCompany, ValuationMultiple } from '@/types/valuation';

interface MarketValuationParams {
  annualRevenue: number;
  cashFlow: number;
  industry: string;
  businessAge: number;
  growthRate: number;
  customerCount: number;
  marketPosition: string;
}

export class MarketBasedValuationEngine {
  // Industry-specific revenue multiples based on market data
  private industryRevenueMultiples: Map<string, { min: number; median: number; max: number }> = new Map([
    ['technology', { min: 2.0, median: 4.5, max: 12.0 }],
    ['software', { min: 3.0, median: 6.0, max: 15.0 }],
    ['healthcare', { min: 1.5, median: 3.0, max: 8.0 }],
    ['finance', { min: 1.0, median: 2.5, max: 6.0 }],
    ['manufacturing', { min: 0.8, median: 1.5, max: 3.0 }],
    ['retail', { min: 0.5, median: 1.2, max: 2.5 }],
    ['services', { min: 1.0, median: 2.0, max: 4.0 }],
    ['real_estate', { min: 2.0, median: 4.0, max: 8.0 }],
    ['e_commerce', { min: 1.5, median: 3.0, max: 8.0 }],
  ]);

  // Industry-specific EBITDA multiples
  private industryEbitdaMultiples: Map<string, { min: number; median: number; max: number }> = new Map([
    ['technology', { min: 8.0, median: 15.0, max: 25.0 }],
    ['software', { min: 10.0, median: 20.0, max: 35.0 }],
    ['healthcare', { min: 6.0, median: 12.0, max: 20.0 }],
    ['finance', { min: 5.0, median: 10.0, max: 18.0 }],
    ['manufacturing', { min: 4.0, median: 8.0, max: 15.0 }],
    ['retail', { min: 3.0, median: 6.0, max: 12.0 }],
    ['services', { min: 4.0, median: 8.0, max: 15.0 }],
    ['real_estate', { min: 8.0, median: 15.0, max: 25.0 }],
    ['e_commerce', { min: 6.0, median: 12.0, max: 20.0 }],
  ]);

  calculateMarketBasedValuation(params: MarketValuationParams): MarketBasedValuation {
    const { annualRevenue, cashFlow, industry, businessAge, growthRate, customerCount, marketPosition } = params;
    
    // Generate comparable companies (in real implementation, this would come from a database)
    const comparableCompanies = this.generateComparableCompanies(params);
    
    // Calculate various valuation multiples
    const revenueMultiple = this.calculateRevenueMultiple(params);
    const ebitdaMultiple = this.calculateEbitdaMultiple(params);
    const earningsMultiple = this.calculateEarningsMultiple(params);
    
    // Create ValuationMultiple objects
    const multiples: ValuationMultiple[] = [
      {
        id: `revenue-multiple-${Date.now()}`,
        type: 'revenue',
        value: revenueMultiple.value,
        industryAverage: revenueMultiple.industryMedian,
        confidence: revenueMultiple.confidence,
        source: 'Industry Revenue Multiple Analysis',
      },
      {
        id: `ebitda-multiple-${Date.now() + 1}`,
        type: 'ebitda',
        value: ebitdaMultiple.value,
        industryAverage: ebitdaMultiple.industryMedian,
        confidence: ebitdaMultiple.confidence,
        source: 'Industry EBITDA Multiple Analysis',
      },
      {
        id: `earnings-multiple-${Date.now() + 2}`,
        type: 'earnings',
        value: earningsMultiple.value,
        industryAverage: earningsMultiple.industryMedian,
        confidence: earningsMultiple.confidence,
        source: 'Industry Earnings Multiple Analysis',
      },
    ];
    
    // Calculate valuations using different multiples
    const revenueValuation = annualRevenue * revenueMultiple.value;
    const ebitdaValuation = this.estimateEbitda(params) * ebitdaMultiple.value;
    const earningsValuation = Math.max(cashFlow, 0) * earningsMultiple.value;
    
    // Weight the different approaches
    const weightedValue = this.calculateWeightedValue({
      revenue: { value: revenueValuation, weight: 0.4 },
      ebitda: { value: ebitdaValuation, weight: 0.4 },
      earnings: { value: earningsValuation, weight: 0.2 },
    }, params);
    
    // Calculate overall confidence
    const confidence = this.calculateOverallConfidence(params, multiples);
    
    return {
      value: weightedValue,
      confidence,
      methodology: 'Market-Based Valuation using Comparable Company Analysis',
      comparableCompanies,
      multiples,
      breakdown: {
        revenueMultiple: revenueMultiple.value,
        ebitdaMultiple: ebitdaMultiple.value,
        earningsMultiple: earningsMultiple.value,
        weightedValue,
      },
    };
  }

  private generateComparableCompanies(params: MarketValuationParams): ComparableCompany[] {
    // In a real implementation, this would query a database of companies
    // For now, we'll generate representative comparable companies
    
    const industryMultiples = this.industryRevenueMultiples.get(params.industry.toLowerCase()) || 
                            this.industryRevenueMultiples.get('services')!;
    
    const comparables: ComparableCompany[] = [];
    
    // Generate 3-5 comparable companies
    for (let i = 0; i < 4; i++) {
      const revenueVariation = 0.5 + Math.random() * 2; // Revenue between 0.5x and 2.5x
      const multipleVariation = industryMultiples.min + Math.random() * (industryMultiples.max - industryMultiples.min);
      
      const revenue = params.annualRevenue * revenueVariation;
      const valuation = revenue * multipleVariation;
      
      comparables.push({
        id: `comp-${params.industry}-${i + 1}`,
        name: `${params.industry} Company ${i + 1}`,
        industry: params.industry,
        revenue,
        valuation,
        multiple: multipleVariation,
        similarityScore: 0.7 + Math.random() * 0.25, // 70-95% similarity
        adjustments: this.generateAdjustments(params),
      });
    }
    
    return comparables;
  }

  private generateAdjustments(params: MarketValuationParams): string[] {
    const adjustments: string[] = [];
    
    if (params.growthRate > 0.20) {
      adjustments.push('High growth rate premium applied');
    } else if (params.growthRate < 0) {
      adjustments.push('Negative growth discount applied');
    }
    
    if (params.businessAge < 3) {
      adjustments.push('Early-stage company discount');
    } else if (params.businessAge > 15) {
      adjustments.push('Mature company stability premium');
    }
    
    if (params.customerCount < 50) {
      adjustments.push('Customer concentration risk discount');
    }
    
    const marketPositionAdjustments = {
      leader: 'Market leadership premium',
      strong: 'Strong market position premium',
      average: 'Average market position',
      weak: 'Weak market position discount',
      struggling: 'Distressed company discount',
    };
    
    const adjustment = marketPositionAdjustments[params.marketPosition.toLowerCase() as keyof typeof marketPositionAdjustments];
    if (adjustment) {
      adjustments.push(adjustment);
    }
    
    return adjustments;
  }

  private calculateRevenueMultiple(params: MarketValuationParams): {
    value: number;
    confidence: number;
    industryMedian: number;
  } {
    const industryData = this.industryRevenueMultiples.get(params.industry.toLowerCase()) || 
                        this.industryRevenueMultiples.get('services')!;
    
    let baseMultiple = industryData.median;
    
    // Adjust for growth rate
    if (params.growthRate > 0.30) {
      baseMultiple *= 1.5; // High growth premium
    } else if (params.growthRate > 0.15) {
      baseMultiple *= 1.2; // Moderate growth premium
    } else if (params.growthRate < 0) {
      baseMultiple *= 0.6; // Declining business discount
    }
    
    // Adjust for business maturity
    if (params.businessAge < 2) {
      baseMultiple *= 0.8; // Early-stage discount
    } else if (params.businessAge > 10) {
      baseMultiple *= 1.1; // Mature business premium
    }
    
    // Adjust for market position
    const positionMultipliers = {
      leader: 1.3,
      strong: 1.15,
      average: 1.0,
      weak: 0.85,
      struggling: 0.6,
    };
    
    baseMultiple *= positionMultipliers[params.marketPosition.toLowerCase() as keyof typeof positionMultipliers] || 1.0;
    
    // Ensure multiple stays within reasonable bounds
    const finalMultiple = Math.max(industryData.min, Math.min(industryData.max, baseMultiple));
    
    // Calculate confidence based on data availability and business characteristics
    let confidence = 0.75; // Base confidence for market approach
    
    if (params.annualRevenue > 1000000) confidence += 0.10; // Higher confidence for larger revenues
    if (params.businessAge > 3) confidence += 0.05; // More data for established businesses
    if (params.customerCount > 100) confidence += 0.05; // Diversified customer base
    
    return {
      value: finalMultiple,
      confidence: Math.min(0.90, confidence),
      industryMedian: industryData.median,
    };
  }

  private calculateEbitdaMultiple(params: MarketValuationParams): {
    value: number;
    confidence: number;
    industryMedian: number;
  } {
    const industryData = this.industryEbitdaMultiples.get(params.industry.toLowerCase()) || 
                        this.industryEbitdaMultiples.get('services')!;
    
    let baseMultiple = industryData.median;
    
    // Similar adjustments as revenue multiple but typically higher values
    if (params.growthRate > 0.30) {
      baseMultiple *= 1.4;
    } else if (params.growthRate > 0.15) {
      baseMultiple *= 1.2;
    } else if (params.growthRate < 0) {
      baseMultiple *= 0.7;
    }
    
    // Business age adjustments
    if (params.businessAge < 2) {
      baseMultiple *= 0.85;
    } else if (params.businessAge > 10) {
      baseMultiple *= 1.1;
    }
    
    // Market position adjustments
    const positionMultipliers = {
      leader: 1.25,
      strong: 1.1,
      average: 1.0,
      weak: 0.9,
      struggling: 0.7,
    };
    
    baseMultiple *= positionMultipliers[params.marketPosition.toLowerCase() as keyof typeof positionMultipliers] || 1.0;
    
    const finalMultiple = Math.max(industryData.min, Math.min(industryData.max, baseMultiple));
    
    // EBITDA multiples are less reliable for small businesses
    let confidence = 0.70;
    if (params.cashFlow > 0) confidence += 0.10;
    if (params.annualRevenue > 5000000) confidence += 0.10;
    
    return {
      value: finalMultiple,
      confidence: Math.min(0.85, confidence),
      industryMedian: industryData.median,
    };
  }

  private calculateEarningsMultiple(params: MarketValuationParams): {
    value: number;
    confidence: number;
    industryMedian: number;
  } {
    // Earnings multiples are typically lower than EBITDA multiples
    const ebitdaData = this.industryEbitdaMultiples.get(params.industry.toLowerCase()) || 
                      this.industryEbitdaMultiples.get('services')!;
    
    // Convert EBITDA multiple to earnings multiple (typically 60-80% of EBITDA multiple)
    let baseMultiple = ebitdaData.median * 0.7;
    
    // Adjust for profitability
    if (params.cashFlow <= 0) {
      baseMultiple *= 0.5; // Heavy discount for unprofitable businesses
    }
    
    // Similar growth and position adjustments
    if (params.growthRate > 0.30) {
      baseMultiple *= 1.3;
    } else if (params.growthRate > 0.15) {
      baseMultiple *= 1.15;
    } else if (params.growthRate < 0) {
      baseMultiple *= 0.8;
    }
    
    const finalMultiple = Math.max(ebitdaData.min * 0.5, Math.min(ebitdaData.max * 0.8, baseMultiple));
    
    // Earnings multiples have lower confidence for cash flow negative businesses
    let confidence = params.cashFlow > 0 ? 0.75 : 0.50;
    if (params.businessAge > 5) confidence += 0.05;
    
    return {
      value: finalMultiple,
      confidence: Math.min(0.80, confidence),
      industryMedian: ebitdaData.median * 0.7,
    };
  }

  private estimateEbitda(params: MarketValuationParams): number {
    // Estimate EBITDA from cash flow and revenue
    // EBITDA is typically higher than cash flow due to working capital and capex differences
    
    if (params.cashFlow > 0) {
      // If profitable, EBITDA is typically 110-150% of cash flow
      return params.cashFlow * 1.25;
    } else {
      // For unprofitable businesses, estimate based on revenue and industry margins
      const industryMargins = {
        technology: 0.20,
        software: 0.25,
        healthcare: 0.15,
        finance: 0.30,
        manufacturing: 0.10,
        retail: 0.08,
        services: 0.12,
        real_estate: 0.40,
        e_commerce: 0.10,
      };
      
      const margin = industryMargins[params.industry.toLowerCase() as keyof typeof industryMargins] || 0.12;
      return Math.max(0, params.annualRevenue * margin);
    }
  }

  private calculateWeightedValue(
    valuations: {
      revenue: { value: number; weight: number };
      ebitda: { value: number; weight: number };
      earnings: { value: number; weight: number };
    },
    params: MarketValuationParams
  ): number {
    let totalWeight = 0;
    let weightedSum = 0;
    
    // Adjust weights based on business characteristics
    const { revenue, ebitda, earnings } = valuations;
    
    // If business is unprofitable, reduce earnings weight
    if (params.cashFlow <= 0) {
      earnings.weight *= 0.3;
      revenue.weight += 0.14; // Redistribute weight
      ebitda.weight += 0.14;
    }
    
    // For very young businesses, focus more on revenue
    if (params.businessAge < 2) {
      revenue.weight += 0.2;
      ebitda.weight -= 0.1;
      earnings.weight -= 0.1;
    }
    
    // Calculate weighted average
    [revenue, ebitda, earnings].forEach(({ value, weight }) => {
      if (value > 0 && !isNaN(value)) {
        weightedSum += value * weight;
        totalWeight += weight;
      }
    });
    
    return totalWeight > 0 ? weightedSum / totalWeight : 0;
  }

  private calculateOverallConfidence(params: MarketValuationParams, multiples: ValuationMultiple[]): number {
    // Average confidence from all multiples
    const averageMultipleConfidence = multiples.reduce((sum, m) => sum + m.confidence, 0) / multiples.length;
    
    let confidence = averageMultipleConfidence * 0.8; // Base confidence from multiples
    
    // Adjust for business characteristics
    if (params.annualRevenue > 5000000) confidence += 0.08; // Larger businesses more comparable
    if (params.businessAge > 5) confidence += 0.06; // More established businesses
    if (params.customerCount > 200) confidence += 0.04; // Diversified customer base
    
    // Industry adjustments - some industries have better comparable data
    const industryConfidenceBonus = {
      technology: 0.05,
      software: 0.08,
      retail: 0.03,
      manufacturing: 0.04,
      services: 0.02,
    };
    
    confidence += industryConfidenceBonus[params.industry.toLowerCase() as keyof typeof industryConfidenceBonus] || 0;
    
    return Math.min(0.90, Math.max(0.40, confidence));
  }
}