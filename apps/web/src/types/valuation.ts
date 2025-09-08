export interface IndustryAdjustment {
  id: string;
  industry: string;
  adjustmentType: 'multiple' | 'discount' | 'premium';
  factor: number;
  reason: string;
  confidence: number;
  source: string;
}

export interface ComparableCompany {
  id: string;
  name: string;
  industry: string;
  revenue: number;
  valuation: number;
  multiple: number;
  similarityScore: number;
  adjustments: string[];
}

export interface ValuationMultiple {
  id: string;
  type: 'revenue' | 'ebitda' | 'earnings' | 'book';
  value: number;
  industryAverage: number;
  confidence: number;
  source: string;
}

export interface RiskFactor {
  id: string;
  category: 'financial' | 'operational' | 'market' | 'regulatory';
  factor: string;
  impact: 'low' | 'medium' | 'high';
  likelihood: number;
  description: string;
  mitigation: string[];
}

export interface BusinessEvaluation {
  id: string;
  userId: string;
  businessData: {
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
  };
  valuations: {
    assetBased: {
      value: number;
      confidence: number;
      methodology: string;
      assumptions: string[];
      adjustments: IndustryAdjustment[];
    };
    incomeBased: {
      value: number;
      confidence: number;
      methodology: string;
      discountRate: number;
      growthAssumptions: number[];
      terminalValue: number;
    };
    marketBased: {
      value: number;
      confidence: number;
      methodology: string;
      comparableCompanies: ComparableCompany[];
      multiples: ValuationMultiple[];
    };
    weighted: {
      value: number;
      range: { min: number; max: number };
      confidence: number;
      weights: { asset: number; income: number; market: number };
      methodology: string;
    };
  };
  confidenceFactors: {
    dataQuality: number;
    industryReliability: number;
    businessStability: number;
    marketConditions: number;
    overall: number;
  };
  riskFactors: RiskFactor[];
  processingTime: number;
  status: 'processing' | 'completed' | 'failed';
  createdAt: Date;
  updatedAt: Date;
}

export interface AssetBasedValuation {
  value: number;
  confidence: number;
  methodology: string;
  assumptions: string[];
  adjustments: IndustryAdjustment[];
  breakdown: {
    tangibleAssets: number;
    intangibleAssets: number;
    inventory: number;
    equipment: number;
    realEstate: number;
    totalAssets: number;
    totalLiabilities: number;
    netBookValue: number;
    marketAdjustments: number;
  };
}

export interface IncomeBasedValuation {
  value: number;
  confidence: number;
  methodology: string;
  discountRate: number;
  growthAssumptions: number[];
  terminalValue: number;
  breakdown: {
    projectedCashFlows: number[];
    presentValues: number[];
    terminalValuePresent: number;
    totalValue: number;
  };
}

export interface MarketBasedValuation {
  value: number;
  confidence: number;
  methodology: string;
  comparableCompanies: ComparableCompany[];
  multiples: ValuationMultiple[];
  breakdown: {
    revenueMultiple: number;
    ebitdaMultiple: number;
    earningsMultiple: number;
    weightedValue: number;
  };
}