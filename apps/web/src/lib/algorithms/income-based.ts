import { IncomeBasedValuation } from '@/types/valuation';

interface BusinessFinancials {
  annualRevenue: number;
  monthlyRecurring: number;
  expenses: number;
  cashFlow: number;
  growthRate: number;
}

interface IncomeValuationParams {
  financials: BusinessFinancials;
  industry: string;
  businessAge: number;
  marketPosition: string;
  customerCount: number;
}

export class IncomeBasedValuationEngine {
  private industryRiskPremiums: Map<string, number> = new Map([
    ['technology', 0.12], // Higher risk, higher return expectation
    ['healthcare', 0.08], // Regulated, lower risk
    ['finance', 0.10], // Moderate risk
    ['manufacturing', 0.09], // Industrial risk
    ['retail', 0.11], // Consumer discretionary risk
    ['services', 0.10], // Service industry risk
    ['real_estate', 0.07], // Asset-backed, lower risk
  ]);

  private readonly RISK_FREE_RATE = 0.045; // Current 10-year Treasury
  private readonly MARKET_RISK_PREMIUM = 0.06; // Historical equity risk premium
  private readonly TERMINAL_GROWTH_RATE = 0.025; // Long-term GDP growth assumption

  calculateIncomeBasedValuation(params: IncomeValuationParams): IncomeBasedValuation {
    const { financials, industry, businessAge, marketPosition, customerCount } = params;
    
    // Calculate discount rate (WACC approximation)
    const discountRate = this.calculateDiscountRate(industry, businessAge, marketPosition);
    
    // Project future cash flows
    const { projectedCashFlows, growthAssumptions } = this.projectCashFlows(financials, businessAge);
    
    // Calculate present values of projected cash flows
    const presentValues = this.calculatePresentValues(projectedCashFlows, discountRate);
    
    // Calculate terminal value
    const terminalValue = this.calculateTerminalValue(
      projectedCashFlows[projectedCashFlows.length - 1],
      discountRate
    );
    
    // Present value of terminal value
    const terminalValuePresent = terminalValue / Math.pow(1 + discountRate, projectedCashFlows.length);
    
    // Total enterprise value
    const totalValue = presentValues.reduce((sum, pv) => sum + pv, 0) + terminalValuePresent;
    
    // Calculate confidence score
    const confidence = this.calculateConfidence(params, projectedCashFlows, discountRate);
    
    return {
      value: totalValue,
      confidence,
      methodology: 'Discounted Cash Flow (DCF) with Terminal Value',
      discountRate,
      growthAssumptions,
      terminalValue,
      breakdown: {
        projectedCashFlows,
        presentValues,
        terminalValuePresent,
        totalValue,
      },
    };
  }

  private calculateDiscountRate(industry: string, businessAge: number, marketPosition: string): number {
    // Start with risk-free rate
    let discountRate = this.RISK_FREE_RATE;
    
    // Add market risk premium
    discountRate += this.MARKET_RISK_PREMIUM;
    
    // Add industry-specific risk premium
    const industryRisk = this.industryRiskPremiums.get(industry.toLowerCase()) || 0.10;
    discountRate += industryRisk;
    
    // Adjust for business age (younger = riskier)
    if (businessAge < 2) discountRate += 0.03; // Startup premium
    else if (businessAge < 5) discountRate += 0.02; // Young company premium
    else if (businessAge > 15) discountRate -= 0.01; // Mature company discount
    
    // Adjust for market position
    const positionAdjustments = {
      leader: -0.02,
      strong: -0.01,
      average: 0,
      weak: 0.02,
      struggling: 0.04,
    };
    
    const positionAdjustment = positionAdjustments[marketPosition.toLowerCase() as keyof typeof positionAdjustments] || 0;
    discountRate += positionAdjustment;
    
    return Math.max(0.05, Math.min(0.25, discountRate)); // Cap between 5% and 25%
  }

  private projectCashFlows(financials: BusinessFinancials, businessAge: number): {
    projectedCashFlows: number[];
    growthAssumptions: number[];
  } {
    const projectionYears = 5;
    const projectedCashFlows: number[] = [];
    const growthAssumptions: number[] = [];
    
    // Base cash flow (current year)
    let currentCashFlow = financials.cashFlow;
    
    // If cash flow is negative or very low, estimate from revenue and margins
    if (currentCashFlow < financials.annualRevenue * 0.05) {
      currentCashFlow = this.estimateCashFlowFromRevenue(financials);
    }
    
    // Calculate growth rate decay over time
    let currentGrowthRate = Math.min(financials.growthRate, 0.50); // Cap at 50%
    
    for (let year = 1; year <= projectionYears; year++) {
      // Decay growth rate over time (normalize towards long-term growth)
      const growthDecayFactor = this.calculateGrowthDecay(year, businessAge, currentGrowthRate);
      const adjustedGrowthRate = currentGrowthRate * growthDecayFactor;
      
      growthAssumptions.push(adjustedGrowthRate);
      
      // Project cash flow for this year
      currentCashFlow = currentCashFlow * (1 + adjustedGrowthRate);
      projectedCashFlows.push(currentCashFlow);
      
      // Update growth rate for next iteration
      currentGrowthRate = adjustedGrowthRate;
    }
    
    return { projectedCashFlows, growthAssumptions };
  }

  private estimateCashFlowFromRevenue(financials: BusinessFinancials): number {
    // Estimate cash flow margin based on business model
    let estimatedMargin = 0.15; // Default 15% cash flow margin
    
    // Adjust for recurring revenue (higher margins)
    if (financials.monthlyRecurring > 0) {
      const recurringRatio = (financials.monthlyRecurring * 12) / financials.annualRevenue;
      estimatedMargin += recurringRatio * 0.10; // Up to 10% bonus for recurring revenue
    }
    
    // Calculate estimated cash flow
    const estimatedCashFlow = financials.annualRevenue * estimatedMargin;
    
    // Use the higher of actual or estimated cash flow
    return Math.max(financials.cashFlow, estimatedCashFlow);
  }

  private calculateGrowthDecay(year: number, businessAge: number, initialGrowth: number): number {
    // Mature businesses have more stable, lower growth
    const maturityFactor = businessAge > 10 ? 0.8 : 1.0;
    
    // Growth decay function: rapid early decay, then stabilization
    let decayFactor: number;
    
    if (initialGrowth > 0.30) {
      // High growth businesses decay faster
      decayFactor = Math.pow(0.75, year - 1);
    } else if (initialGrowth > 0.15) {
      // Moderate growth businesses decay moderately
      decayFactor = Math.pow(0.85, year - 1);
    } else {
      // Low growth businesses decay slowly
      decayFactor = Math.pow(0.95, year - 1);
    }
    
    // Ensure we don't go below terminal growth rate
    const terminalRatio = this.TERMINAL_GROWTH_RATE / Math.max(initialGrowth, 0.01);
    decayFactor = Math.max(decayFactor, terminalRatio);
    
    return decayFactor * maturityFactor;
  }

  private calculatePresentValues(cashFlows: number[], discountRate: number): number[] {
    return cashFlows.map((cashFlow, index) => {
      const year = index + 1;
      return cashFlow / Math.pow(1 + discountRate, year);
    });
  }

  private calculateTerminalValue(finalYearCashFlow: number, discountRate: number): number {
    // Terminal value using perpetual growth model
    // Terminal Value = Final Year Cash Flow × (1 + Terminal Growth) / (Discount Rate - Terminal Growth)
    const terminalCashFlow = finalYearCashFlow * (1 + this.TERMINAL_GROWTH_RATE);
    return terminalCashFlow / (discountRate - this.TERMINAL_GROWTH_RATE);
  }

  private calculateConfidence(
    params: IncomeValuationParams,
    projectedCashFlows: number[],
    discountRate: number
  ): number {
    let confidence = 0.75; // Base confidence for income-based approach
    
    // Higher confidence for profitable businesses
    if (params.financials.cashFlow > 0) {
      confidence += 0.10;
    } else {
      confidence -= 0.15; // Penalty for negative cash flow
    }
    
    // Higher confidence for recurring revenue models
    if (params.financials.monthlyRecurring > 0) {
      const recurringRatio = (params.financials.monthlyRecurring * 12) / params.financials.annualRevenue;
      confidence += recurringRatio * 0.15; // Up to 15% bonus
    }
    
    // Higher confidence for mature businesses
    if (params.businessAge > 5) {
      confidence += 0.10;
    } else if (params.businessAge < 2) {
      confidence -= 0.10; // Penalty for very young businesses
    }
    
    // Adjust for customer concentration risk
    if (params.customerCount > 100) {
      confidence += 0.05; // Diversified customer base
    } else if (params.customerCount < 10) {
      confidence -= 0.10; // Customer concentration risk
    }
    
    // Adjust for market position
    const positionBonus = {
      leader: 0.10,
      strong: 0.05,
      average: 0,
      weak: -0.05,
      struggling: -0.15,
    };
    
    confidence += positionBonus[params.marketPosition.toLowerCase() as keyof typeof positionBonus] || 0;
    
    // Lower confidence for very high discount rates (indicates high risk)
    if (discountRate > 0.20) {
      confidence -= 0.10;
    } else if (discountRate < 0.10) {
      confidence += 0.05;
    }
    
    return Math.min(0.95, Math.max(0.25, confidence));
  }

  // Alternative valuation using earnings multiples
  calculateEarningsMultipleValuation(
    params: IncomeValuationParams,
    industryMultiple: number = 10
  ): {
    value: number;
    confidence: number;
    multiple: number;
  } {
    const earnings = Math.max(params.financials.cashFlow, 0);
    
    // Adjust multiple based on business characteristics
    let adjustedMultiple = industryMultiple;
    
    // Adjust for growth
    if (params.financials.growthRate > 0.30) {
      adjustedMultiple *= 1.5; // High growth premium
    } else if (params.financials.growthRate > 0.15) {
      adjustedMultiple *= 1.2; // Moderate growth premium
    } else if (params.financials.growthRate < 0) {
      adjustedMultiple *= 0.6; // Declining business discount
    }
    
    // Adjust for recurring revenue
    if (params.financials.monthlyRecurring > 0) {
      const recurringRatio = (params.financials.monthlyRecurring * 12) / params.financials.annualRevenue;
      adjustedMultiple *= (1 + recurringRatio * 0.5); // Recurring revenue premium
    }
    
    const value = earnings * adjustedMultiple;
    const confidence = earnings > 0 ? 0.70 : 0.40; // Lower confidence for zero earnings
    
    return {
      value,
      confidence,
      multiple: adjustedMultiple,
    };
  }
}