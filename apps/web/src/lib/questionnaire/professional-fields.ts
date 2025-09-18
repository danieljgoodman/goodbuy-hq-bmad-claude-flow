// Professional Tier Field Definitions with Business Methodology Explanations
// Provides comprehensive field metadata for the Professional questionnaire

import type {
  ProfessionalQuestionnaireField,
  ProfessionalQuestionnaireSection,
  BusinessMethodology
} from '../../types/professional-questionnaire'

// Business methodology explanations for Professional tier concepts
export const BUSINESS_METHODOLOGIES: Record<string, BusinessMethodology> = {
  threeYearFinancialHistory: {
    concept: "3-Year Financial Performance Analysis",
    definition: "Historical financial data over three years provides insight into business stability, growth trends, and cyclical patterns that impact valuation.",
    importance: "Demonstrates business trajectory and helps predict future performance. Lenders and buyers analyze 3-year trends to assess risk and growth potential.",
    calculation: "Year-over-year comparison of revenue, profit, and cash flow with trend analysis and compound annual growth rate (CAGR) calculations.",
    industryBenchmarks: {
      poor: -10,
      average: 5,
      good: 15,
      excellent: 25
    },
    improvementStrategies: [
      "Focus on consistent revenue growth",
      "Improve profit margins through cost optimization",
      "Stabilize cash flow through better collection practices",
      "Diversify revenue streams to reduce volatility"
    ],
    relatedMetrics: ["Revenue Growth Rate", "Profit Margin Trend", "Cash Flow Stability", "EBITDA Growth"]
  },

  customerConcentrationRisk: {
    concept: "Customer Concentration Risk Analysis",
    definition: "The degree to which a business depends on a small number of customers for its revenue. High concentration increases business risk and reduces valuation.",
    importance: "Critical risk factor in business valuation. Businesses overly dependent on few customers face higher risk of revenue loss and reduced marketability.",
    calculation: "Percentage of total revenue from largest customer and top 5 customers. Industry standard considers >20% from one customer as high risk.",
    industryBenchmarks: {
      poor: 50, // >50% from top customer
      average: 25,
      good: 15,
      excellent: 10
    },
    improvementStrategies: [
      "Diversify customer base through targeted marketing",
      "Develop smaller customer segments",
      "Create customer acquisition programs",
      "Implement customer retention strategies"
    ],
    relatedMetrics: ["Customer Acquisition Cost", "Customer Lifetime Value", "Customer Retention Rate"]
  },

  competitiveAdvantageAssessment: {
    concept: "Sustainable Competitive Advantage Evaluation",
    definition: "Analysis of unique strengths that differentiate a business from competitors and create barriers to entry, directly impacting long-term profitability.",
    importance: "Determines pricing power, market defensibility, and sustainable profit margins. Strong competitive advantages justify higher valuation multiples.",
    calculation: "Qualitative assessment of differentiation strength, market position, and competitive moats using Porter's Five Forces framework.",
    industryBenchmarks: {
      poor: 1, // Weak differentiation
      average: 2,
      good: 3,
      excellent: 4 // Dominant market position
    },
    improvementStrategies: [
      "Develop proprietary technology or processes",
      "Build strong brand recognition",
      "Secure exclusive supplier relationships",
      "Create high customer switching costs"
    ],
    relatedMetrics: ["Market Share", "Pricing Power", "Customer Loyalty", "Brand Strength"]
  },

  keyPersonDependency: {
    concept: "Key Person Risk and Management Depth",
    definition: "Assessment of business dependence on specific individuals, particularly owners or key managers. High dependency reduces business transferability and value.",
    importance: "Major factor in business salability and risk assessment. Buyers seek businesses that can operate independently of current ownership.",
    calculation: "Evaluation of owner time commitment, management team depth, documented processes, and operational independence.",
    industryBenchmarks: {
      poor: 4, // Critical dependency
      average: 3,
      good: 2,
      excellent: 1 // Minimal dependency
    },
    improvementStrategies: [
      "Develop strong management team",
      "Document all business processes",
      "Cross-train key personnel",
      "Reduce owner operational involvement"
    ],
    relatedMetrics: ["Management Team Strength", "Process Documentation", "Operational Independence"]
  },

  scalabilityAssessment: {
    concept: "Business Scalability and Growth Potential",
    definition: "Evaluation of the business's ability to grow revenue without proportional increases in costs, indicating profit leverage and growth potential.",
    importance: "Highly scalable businesses command premium valuations due to their ability to generate exponential returns on incremental investment.",
    calculation: "Analysis of variable vs. fixed cost structure, operational leverage, and growth capacity constraints.",
    industryBenchmarks: {
      poor: 1, // Limited scalability
      average: 2,
      good: 3,
      excellent: 4 // Exceptional scalability
    },
    improvementStrategies: [
      "Automate key business processes",
      "Develop recurring revenue models",
      "Create scalable delivery systems",
      "Build technology platforms"
    ],
    relatedMetrics: ["Operating Leverage", "Marginal Cost Structure", "Growth Investment Requirements"]
  }
}

// Section 1: Financial Performance Fields (13 fields)
export const FINANCIAL_PERFORMANCE_FIELDS: readonly ProfessionalQuestionnaireField[] = [
  {
    id: 'revenueYear1',
    name: 'revenueYear1',
    label: 'Revenue (Year 1 - Most Recent)',
    type: 'currency',
    placeholder: '$500,000',
    helpText: 'Total revenue from the most recent completed fiscal year',
    methodologyExplanation: 'Year 1 revenue establishes the baseline for trend analysis and represents current business performance level.',
    validationRules: {
      required: true,
      min: 0
    },
    businessImpact: {
      category: 'valuation',
      weight: 0.9,
      description: 'Current revenue directly impacts business valuation using revenue multiples'
    }
  },
  {
    id: 'revenueYear2',
    name: 'revenueYear2',
    label: 'Revenue (Year 2)',
    type: 'currency',
    placeholder: '$450,000',
    helpText: 'Total revenue from the second most recent fiscal year',
    methodologyExplanation: 'Year 2 revenue enables growth rate calculation and trend identification for more accurate valuation.',
    validationRules: {
      required: true,
      min: 0
    },
    businessImpact: {
      category: 'growth',
      weight: 0.7,
      description: 'Historical revenue shows business trajectory and helps predict future performance'
    }
  },
  {
    id: 'revenueYear3',
    name: 'revenueYear3',
    label: 'Revenue (Year 3 - Oldest)',
    type: 'currency',
    placeholder: '$400,000',
    helpText: 'Total revenue from the third most recent fiscal year',
    methodologyExplanation: 'Three-year revenue history provides comprehensive trend analysis and establishes business stability patterns.',
    validationRules: {
      required: true,
      min: 0
    },
    businessImpact: {
      category: 'risk',
      weight: 0.5,
      description: 'Longer history reduces uncertainty in valuation models and risk assessment'
    }
  },
  {
    id: 'profitYear1',
    name: 'profitYear1',
    label: 'Net Profit (Year 1)',
    type: 'currency',
    placeholder: '$75,000',
    helpText: 'Net profit after all expenses for the most recent year',
    methodologyExplanation: 'Current year profit margin indicates operational efficiency and profitability sustainability.',
    validationRules: {
      required: true
    },
    businessImpact: {
      category: 'valuation',
      weight: 0.8,
      description: 'Profit margins directly impact earnings-based valuation methods'
    }
  },
  {
    id: 'profitYear2',
    name: 'profitYear2',
    label: 'Net Profit (Year 2)',
    type: 'currency',
    placeholder: '$65,000',
    helpText: 'Net profit after all expenses for year 2',
    methodologyExplanation: 'Historical profit trends show operational improvements and margin expansion potential.',
    validationRules: {
      required: true
    },
    businessImpact: {
      category: 'efficiency',
      weight: 0.6,
      description: 'Profit trend analysis helps predict future earning capacity'
    }
  },
  {
    id: 'profitYear3',
    name: 'profitYear3',
    label: 'Net Profit (Year 3)',
    type: 'currency',
    placeholder: '$55,000',
    helpText: 'Net profit after all expenses for year 3',
    methodologyExplanation: 'Three-year profit history establishes baseline profitability and identifies improvement patterns.',
    validationRules: {
      required: true
    },
    businessImpact: {
      category: 'growth',
      weight: 0.4,
      description: 'Long-term profitability trends indicate sustainable business model'
    }
  },
  {
    id: 'cashFlowYear1',
    name: 'cashFlowYear1',
    label: 'Operating Cash Flow (Year 1)',
    type: 'currency',
    placeholder: '$85,000',
    helpText: 'Cash generated from operations in the most recent year',
    methodologyExplanation: 'Operating cash flow shows the business\'s ability to generate cash from core operations, critical for debt service and growth funding.',
    validationRules: {
      required: true
    },
    businessImpact: {
      category: 'risk',
      weight: 0.8,
      description: 'Strong cash flow reduces financial risk and supports higher valuations'
    }
  },
  {
    id: 'cashFlowYear2',
    name: 'cashFlowYear2',
    label: 'Operating Cash Flow (Year 2)',
    type: 'currency',
    placeholder: '$75,000',
    helpText: 'Cash generated from operations in year 2',
    methodologyExplanation: 'Historical cash flow patterns help predict future cash generation and identify working capital trends.',
    validationRules: {
      required: true
    },
    businessImpact: {
      category: 'efficiency',
      weight: 0.6,
      description: 'Cash flow trends indicate operational efficiency improvements'
    }
  },
  {
    id: 'cashFlowYear3',
    name: 'cashFlowYear3',
    label: 'Operating Cash Flow (Year 3)',
    type: 'currency',
    placeholder: '$65,000',
    helpText: 'Cash generated from operations in year 3',
    methodologyExplanation: 'Three-year cash flow history establishes cash generation stability and supports financial projections.',
    validationRules: {
      required: true
    },
    businessImpact: {
      category: 'valuation',
      weight: 0.4,
      description: 'Consistent cash flow supports discounted cash flow valuation methods'
    }
  },
  {
    id: 'ebitdaMargin',
    name: 'ebitdaMargin',
    label: 'EBITDA Margin (%)',
    type: 'percentage',
    placeholder: '15',
    helpText: 'Earnings before Interest, Taxes, Depreciation, and Amortization as % of revenue',
    methodologyExplanation: 'EBITDA margin shows operational profitability excluding capital structure and accounting decisions, enabling better peer comparisons.',
    validationRules: {
      required: true,
      min: 0,
      max: 100
    },
    businessImpact: {
      category: 'efficiency',
      weight: 0.7,
      description: 'Higher EBITDA margins indicate strong operational efficiency and pricing power'
    }
  },
  {
    id: 'returnOnEquity',
    name: 'returnOnEquity',
    label: 'Return on Equity (%)',
    type: 'percentage',
    placeholder: '18',
    helpText: 'Net income as a percentage of shareholder equity',
    methodologyExplanation: 'ROE measures how effectively the business generates profits from shareholders\' investments, indicating management effectiveness.',
    validationRules: {
      required: true,
      min: 0
    },
    businessImpact: {
      category: 'efficiency',
      weight: 0.6,
      description: 'High ROE indicates efficient use of capital and strong management performance'
    }
  },
  {
    id: 'returnOnAssets',
    name: 'returnOnAssets',
    label: 'Return on Assets (%)',
    type: 'percentage',
    placeholder: '12',
    helpText: 'Net income as a percentage of total assets',
    methodologyExplanation: 'ROA measures how efficiently the business uses its assets to generate profits, indicating operational effectiveness.',
    validationRules: {
      required: true,
      min: 0
    },
    businessImpact: {
      category: 'efficiency',
      weight: 0.5,
      description: 'Strong ROA indicates effective asset utilization and operational management'
    }
  },
  {
    id: 'totalDebt',
    name: 'totalDebt',
    label: 'Total Debt',
    type: 'currency',
    placeholder: '$150,000',
    helpText: 'Sum of all short-term and long-term debt obligations',
    methodologyExplanation: 'Total debt affects business risk profile and cash flow requirements, impacting valuation through increased financial risk.',
    validationRules: {
      required: true,
      min: 0
    },
    businessImpact: {
      category: 'risk',
      weight: 0.6,
      description: 'Lower debt levels reduce financial risk and support higher valuation multiples'
    }
  },
  {
    id: 'workingCapitalRatio',
    name: 'workingCapitalRatio',
    label: 'Working Capital Ratio',
    type: 'number',
    placeholder: '1.5',
    helpText: 'Current assets divided by current liabilities',
    methodologyExplanation: 'Working capital ratio measures short-term liquidity and operational efficiency, indicating the business\'s ability to meet obligations.',
    validationRules: {
      required: true,
      min: 0
    },
    businessImpact: {
      category: 'risk',
      weight: 0.4,
      description: 'Strong working capital position reduces operational risk and supports business stability'
    }
  }
] as const

// Section 2: Customer & Risk Analysis Fields (10 fields)
export const CUSTOMER_RISK_ANALYSIS_FIELDS: readonly ProfessionalQuestionnaireField[] = [
  {
    id: 'largestCustomerRevenue',
    name: 'largestCustomerRevenue',
    label: 'Revenue from Largest Customer',
    type: 'currency',
    placeholder: '$50,000',
    helpText: 'Annual revenue generated from your single largest customer',
    methodologyExplanation: 'Customer concentration analysis identifies dependency risk. High concentration from one customer increases business risk and reduces valuation.',
    validationRules: {
      required: true,
      min: 0
    },
    businessImpact: {
      category: 'risk',
      weight: 0.8,
      description: 'Lower customer concentration reduces business risk and improves valuation'
    }
  },
  {
    id: 'top5CustomerRevenue',
    name: 'top5CustomerRevenue',
    label: 'Revenue from Top 5 Customers',
    type: 'currency',
    placeholder: '$150,000',
    helpText: 'Combined annual revenue from your five largest customers',
    methodologyExplanation: 'Top 5 customer analysis provides broader view of customer concentration risk and revenue stability.',
    validationRules: {
      required: true,
      min: 0
    },
    businessImpact: {
      category: 'risk',
      weight: 0.7,
      description: 'Diversified customer base reduces revenue volatility and business risk'
    }
  },
  {
    id: 'customerConcentrationRisk',
    name: 'customerConcentrationRisk',
    label: 'Customer Concentration Risk Level',
    type: 'select',
    helpText: 'Overall assessment of your dependence on key customers',
    methodologyExplanation: 'Risk assessment combining concentration percentages with customer relationship quality and contract terms.',
    validationRules: {
      required: true
    },
    options: [
      { value: 'low', label: 'Low Risk', description: 'Well-diversified customer base, no single customer >10% of revenue' },
      { value: 'medium', label: 'Medium Risk', description: 'Some concentration, largest customer 10-20% of revenue' },
      { value: 'high', label: 'High Risk', description: 'Significant concentration, largest customer >20% of revenue' }
    ],
    businessImpact: {
      category: 'risk',
      weight: 0.9,
      description: 'Customer concentration is a primary risk factor in business valuation'
    }
  },
  {
    id: 'averageCustomerTenure',
    name: 'averageCustomerTenure',
    label: 'Average Customer Tenure (Years)',
    type: 'number',
    placeholder: '3.5',
    helpText: 'Average length of time customers remain with your business',
    methodologyExplanation: 'Customer tenure indicates relationship stability and predicts future revenue predictability, reducing business risk.',
    validationRules: {
      required: true,
      min: 0
    },
    businessImpact: {
      category: 'valuation',
      weight: 0.6,
      description: 'Longer customer tenure indicates strong relationships and predictable revenue'
    }
  },
  {
    id: 'customerRetentionRate',
    name: 'customerRetentionRate',
    label: 'Customer Retention Rate (%)',
    type: 'percentage',
    placeholder: '85',
    helpText: 'Percentage of customers who continue business with you year over year',
    methodologyExplanation: 'Retention rate measures customer satisfaction and loyalty, directly impacting revenue predictability and growth efficiency.',
    validationRules: {
      required: true,
      min: 0,
      max: 100
    },
    businessImpact: {
      category: 'growth',
      weight: 0.8,
      description: 'High retention rates reduce acquisition costs and increase customer lifetime value'
    }
  },
  {
    id: 'customerSatisfactionScore',
    name: 'customerSatisfactionScore',
    label: 'Customer Satisfaction Score (1-10)',
    type: 'number',
    placeholder: '8',
    helpText: 'Average customer satisfaction rating from surveys or feedback',
    methodologyExplanation: 'Customer satisfaction scores predict retention, referrals, and pricing power, indicating sustainable competitive advantages.',
    validationRules: {
      required: true,
      min: 1,
      max: 10
    },
    businessImpact: {
      category: 'strategic',
      weight: 0.5,
      description: 'Higher satisfaction scores support premium pricing and reduce customer churn'
    }
  },
  {
    id: 'averageContractLength',
    name: 'averageContractLength',
    label: 'Average Contract Length (Months)',
    type: 'number',
    placeholder: '12',
    helpText: 'Average duration of customer contracts or agreements',
    methodologyExplanation: 'Contract length indicates revenue predictability and customer commitment, reducing business risk and supporting higher valuations.',
    validationRules: {
      required: true,
      min: 0
    },
    businessImpact: {
      category: 'risk',
      weight: 0.7,
      description: 'Longer contracts provide revenue predictability and reduce customer acquisition frequency'
    }
  },
  {
    id: 'contractRenewalRate',
    name: 'contractRenewalRate',
    label: 'Contract Renewal Rate (%)',
    type: 'percentage',
    placeholder: '90',
    helpText: 'Percentage of contracts that are renewed upon expiration',
    methodologyExplanation: 'Renewal rates indicate customer satisfaction and business stickiness, predicting future revenue retention.',
    validationRules: {
      required: true,
      min: 0,
      max: 100
    },
    businessImpact: {
      category: 'valuation',
      weight: 0.8,
      description: 'High renewal rates indicate strong customer relationships and predictable revenue'
    }
  },
  {
    id: 'recurringRevenuePercentage',
    name: 'recurringRevenuePercentage',
    label: 'Recurring Revenue Percentage (%)',
    type: 'percentage',
    placeholder: '70',
    helpText: 'Percentage of total revenue that is recurring or subscription-based',
    methodologyExplanation: 'Recurring revenue provides predictable cash flow and reduces business risk, commanding higher valuation multiples.',
    validationRules: {
      required: true,
      min: 0,
      max: 100
    },
    businessImpact: {
      category: 'valuation',
      weight: 0.9,
      description: 'Higher recurring revenue percentages justify premium valuation multiples'
    }
  },
  {
    id: 'seasonalityImpact',
    name: 'seasonalityImpact',
    label: 'Seasonality Impact Level',
    type: 'select',
    helpText: 'How much seasonal factors affect your business performance',
    methodologyExplanation: 'Seasonality analysis helps predict cash flow patterns and identify working capital requirements throughout the year.',
    validationRules: {
      required: true
    },
    options: [
      { value: 'low', label: 'Low Seasonality', description: 'Revenue varies <20% between peak and trough periods' },
      { value: 'medium', label: 'Medium Seasonality', description: 'Revenue varies 20-50% between peak and trough periods' },
      { value: 'high', label: 'High Seasonality', description: 'Revenue varies >50% between peak and trough periods' }
    ],
    businessImpact: {
      category: 'risk',
      weight: 0.5,
      description: 'Lower seasonality reduces cash flow volatility and business risk'
    }
  }
] as const

// Section 3: Competitive & Market Position Fields (9 fields)
export const COMPETITIVE_MARKET_FIELDS: readonly ProfessionalQuestionnaireField[] = [
  {
    id: 'marketSharePercentage',
    name: 'marketSharePercentage',
    label: 'Market Share (%)',
    type: 'percentage',
    placeholder: '5',
    helpText: 'Your estimated percentage of the total addressable market',
    methodologyExplanation: 'Market share indicates competitive position and growth potential. Higher market share often correlates with pricing power and economies of scale.',
    validationRules: {
      required: true,
      min: 0,
      max: 100
    },
    businessImpact: {
      category: 'strategic',
      weight: 0.7,
      description: 'Higher market share indicates competitive strength and pricing power'
    }
  },
  {
    id: 'primaryCompetitors',
    name: 'primaryCompetitors',
    label: 'Primary Competitors',
    type: 'array',
    placeholder: 'Enter competitor names',
    helpText: 'List your 3-5 main competitors',
    methodologyExplanation: 'Competitor analysis helps assess competitive intensity and identify market positioning relative to established players.',
    validationRules: {
      required: true
    },
    businessImpact: {
      category: 'strategic',
      weight: 0.5,
      description: 'Understanding competitive landscape helps assess market positioning and threats'
    }
  },
  {
    id: 'competitiveAdvantageStrength',
    name: 'competitiveAdvantageStrength',
    label: 'Competitive Advantage Strength',
    type: 'select',
    helpText: 'Overall strength of your competitive differentiation',
    methodologyExplanation: 'Competitive advantage assessment determines sustainable profit margins and pricing power, directly impacting long-term valuation.',
    validationRules: {
      required: true
    },
    options: [
      { value: 'weak', label: 'Weak', description: 'Limited differentiation, primarily compete on price' },
      { value: 'moderate', label: 'Moderate', description: 'Some differentiation, occasional pricing power' },
      { value: 'strong', label: 'Strong', description: 'Clear differentiation, consistent pricing power' },
      { value: 'dominant', label: 'Dominant', description: 'Unique market position, strong pricing power' }
    ],
    businessImpact: {
      category: 'valuation',
      weight: 0.9,
      description: 'Strong competitive advantages justify higher valuation multiples'
    }
  },
  {
    id: 'marketGrowthRateAnnual',
    name: 'marketGrowthRateAnnual',
    label: 'Market Growth Rate (% Annual)',
    type: 'percentage',
    placeholder: '8',
    helpText: 'Annual growth rate of your total addressable market',
    methodologyExplanation: 'Market growth rate indicates future opportunity and helps predict potential business growth without market share gains.',
    validationRules: {
      required: true,
      min: -100,
      max: 1000
    },
    businessImpact: {
      category: 'growth',
      weight: 0.8,
      description: 'Higher market growth rates provide more expansion opportunities'
    }
  },
  {
    id: 'scalabilityRating',
    name: 'scalabilityRating',
    label: 'Business Scalability Rating',
    type: 'select',
    helpText: 'Your business\'s ability to grow without proportional cost increases',
    methodologyExplanation: 'Scalability assessment determines profit leverage potential and growth efficiency, key factors in growth-stage valuations.',
    validationRules: {
      required: true
    },
    options: [
      { value: 'limited', label: 'Limited Scalability', description: 'Growth requires proportional resource increases' },
      { value: 'moderate', label: 'Moderate Scalability', description: 'Some operational leverage, manageable growth constraints' },
      { value: 'high', label: 'High Scalability', description: 'Strong operational leverage, few growth constraints' },
      { value: 'exceptional', label: 'Exceptional Scalability', description: 'Exponential growth potential with minimal additional costs' }
    ],
    businessImpact: {
      category: 'valuation',
      weight: 0.8,
      description: 'Higher scalability supports premium valuation multiples'
    }
  },
  {
    id: 'barrierToEntryLevel',
    name: 'barrierToEntryLevel',
    label: 'Barriers to Entry Level',
    type: 'select',
    helpText: 'Difficulty for new competitors to enter your market',
    methodologyExplanation: 'Barriers to entry protect market position and sustain competitive advantages, supporting long-term profitability.',
    validationRules: {
      required: true
    },
    options: [
      { value: 'low', label: 'Low Barriers', description: 'Easy for new competitors to enter market' },
      { value: 'medium', label: 'Medium Barriers', description: 'Some obstacles to new competition' },
      { value: 'high', label: 'High Barriers', description: 'Significant challenges for new market entrants' }
    ],
    businessImpact: {
      category: 'risk',
      weight: 0.7,
      description: 'Higher barriers to entry protect market position and pricing power'
    }
  },
  {
    id: 'competitiveThreats',
    name: 'competitiveThreats',
    label: 'Key Competitive Threats',
    type: 'array',
    placeholder: 'Enter competitive threats',
    helpText: 'List your 1-3 most significant competitive threats',
    methodologyExplanation: 'Threat identification helps assess business risk and develop defensive strategies to protect market position.',
    validationRules: {
      required: true
    },
    businessImpact: {
      category: 'risk',
      weight: 0.6,
      description: 'Identified threats help develop risk mitigation strategies'
    }
  },
  {
    id: 'technologyAdvantage',
    name: 'technologyAdvantage',
    label: 'Technology Advantage Position',
    type: 'select',
    helpText: 'Your technology position relative to competitors',
    methodologyExplanation: 'Technology position indicates future competitiveness and adaptation capability in evolving markets.',
    validationRules: {
      required: true
    },
    options: [
      { value: 'lagging', label: 'Technology Lagging', description: 'Behind competitors in technology adoption' },
      { value: 'parity', label: 'Technology Parity', description: 'Similar technology capabilities as competitors' },
      { value: 'leading', label: 'Technology Leading', description: 'Ahead of competitors in technology capabilities' },
      { value: 'breakthrough', label: 'Breakthrough Technology', description: 'Proprietary technology advantages' }
    ],
    businessImpact: {
      category: 'strategic',
      weight: 0.6,
      description: 'Technology advantages support competitive differentiation and efficiency'
    }
  },
  {
    id: 'intellectualPropertyValue',
    name: 'intellectualPropertyValue',
    label: 'Intellectual Property Value',
    type: 'select',
    helpText: 'Value and strength of your intellectual property portfolio',
    methodologyExplanation: 'Intellectual property provides competitive protection and can represent significant intangible asset value.',
    validationRules: {
      required: true
    },
    options: [
      { value: 'none', label: 'No IP', description: 'No significant intellectual property assets' },
      { value: 'limited', label: 'Limited IP', description: 'Some trademarks or basic proprietary processes' },
      { value: 'moderate', label: 'Moderate IP', description: 'Valuable patents, trademarks, or trade secrets' },
      { value: 'significant', label: 'Significant IP', description: 'Strong IP portfolio with competitive protection' }
    ],
    businessImpact: {
      category: 'valuation',
      weight: 0.5,
      description: 'Strong IP portfolios add intangible asset value and competitive protection'
    }
  }
] as const

// Section 4: Operational & Strategic Dependencies Fields (7 fields)
export const OPERATIONAL_STRATEGIC_FIELDS: readonly ProfessionalQuestionnaireField[] = [
  {
    id: 'ownerTimeCommitment',
    name: 'ownerTimeCommitment',
    label: 'Owner Time Commitment (Hours/Week)',
    type: 'number',
    placeholder: '50',
    helpText: 'Average hours per week the owner spends in the business',
    methodologyExplanation: 'Owner time commitment indicates business dependency on key personnel, affecting transferability and risk assessment.',
    validationRules: {
      required: true,
      min: 0,
      max: 168
    },
    businessImpact: {
      category: 'risk',
      weight: 0.8,
      description: 'Lower owner dependency increases business transferability and reduces buyer risk'
    }
  },
  {
    id: 'keyPersonRisk',
    name: 'keyPersonRisk',
    label: 'Key Person Risk Level',
    type: 'select',
    helpText: 'Risk level if key personnel were unavailable',
    methodologyExplanation: 'Key person risk assessment determines business continuity risk and impacts buyer confidence in independent operations.',
    validationRules: {
      required: true
    },
    options: [
      { value: 'low', label: 'Low Risk', description: 'Business operates independently, strong management team' },
      { value: 'medium', label: 'Medium Risk', description: 'Some dependency on key people, adequate backup plans' },
      { value: 'high', label: 'High Risk', description: 'Significant dependency on key personnel' },
      { value: 'critical', label: 'Critical Risk', description: 'Business cannot operate without key people' }
    ],
    businessImpact: {
      category: 'risk',
      weight: 0.9,
      description: 'Lower key person risk increases business value and marketability'
    }
  },
  {
    id: 'managementDepthRating',
    name: 'managementDepthRating',
    label: 'Management Team Depth',
    type: 'select',
    helpText: 'Strength and depth of your management team',
    methodologyExplanation: 'Management depth indicates organizational capability and reduces dependence on any single individual.',
    validationRules: {
      required: true
    },
    options: [
      { value: 'shallow', label: 'Shallow Management', description: 'Owner handles most management decisions' },
      { value: 'adequate', label: 'Adequate Management', description: 'Basic management structure in place' },
      { value: 'strong', label: 'Strong Management', description: 'Experienced management team with clear roles' },
      { value: 'exceptional', label: 'Exceptional Management', description: 'World-class management team with proven track record' }
    ],
    businessImpact: {
      category: 'strategic',
      weight: 0.7,
      description: 'Strong management teams support growth and reduce operational risk'
    }
  },
  {
    id: 'supplierConcentrationRisk',
    name: 'supplierConcentrationRisk',
    label: 'Supplier Concentration Risk',
    type: 'select',
    helpText: 'Risk level from dependence on key suppliers',
    methodologyExplanation: 'Supplier concentration risk assesses supply chain vulnerability and operational continuity threats.',
    validationRules: {
      required: true
    },
    options: [
      { value: 'low', label: 'Low Risk', description: 'Multiple suppliers, no single-source dependencies' },
      { value: 'medium', label: 'Medium Risk', description: 'Some supplier concentration, alternative sources available' },
      { value: 'high', label: 'High Risk', description: 'Heavy dependence on few suppliers, limited alternatives' }
    ],
    businessImpact: {
      category: 'risk',
      weight: 0.6,
      description: 'Diversified supplier base reduces operational risk and supply chain disruption'
    }
  },
  {
    id: 'operationalComplexity',
    name: 'operationalComplexity',
    label: 'Operational Complexity Level',
    type: 'select',
    helpText: 'Complexity of your business operations',
    methodologyExplanation: 'Operational complexity affects management requirements, scalability, and transfer difficulty to new ownership.',
    validationRules: {
      required: true
    },
    options: [
      { value: 'simple', label: 'Simple Operations', description: 'Straightforward processes, easy to understand and manage' },
      { value: 'moderate', label: 'Moderate Complexity', description: 'Some complexity, manageable with good systems' },
      { value: 'complex', label: 'Complex Operations', description: 'Multiple processes, requires experienced management' },
      { value: 'very_complex', label: 'Very Complex', description: 'Highly complex operations requiring specialized expertise' }
    ],
    businessImpact: {
      category: 'risk',
      weight: 0.5,
      description: 'Simpler operations are easier to transfer and manage, reducing buyer risk'
    }
  },
  {
    id: 'strategicPlanningHorizon',
    name: 'strategicPlanningHorizon',
    label: 'Strategic Planning Horizon',
    type: 'select',
    helpText: 'How far ahead your business plans strategically',
    methodologyExplanation: 'Strategic planning horizon indicates management sophistication and future readiness, supporting sustainable growth.',
    validationRules: {
      required: true
    },
    options: [
      { value: 'none', label: 'No Formal Planning', description: 'Reactive management, no formal strategic planning' },
      { value: 'short_term', label: 'Short-term (1 year)', description: 'Annual planning and budgeting' },
      { value: 'medium_term', label: 'Medium-term (2-3 years)', description: 'Multi-year strategic planning' },
      { value: 'long_term', label: 'Long-term (5+ years)', description: 'Comprehensive long-term strategic planning' }
    ],
    businessImpact: {
      category: 'strategic',
      weight: 0.6,
      description: 'Strategic planning demonstrates management sophistication and future focus'
    }
  },
  {
    id: 'businessModelAdaptability',
    name: 'businessModelAdaptability',
    label: 'Business Model Adaptability',
    type: 'select',
    helpText: 'Ability to adapt business model to market changes',
    methodologyExplanation: 'Business model adaptability indicates resilience and ability to respond to market changes, reducing future risk.',
    validationRules: {
      required: true
    },
    options: [
      { value: 'rigid', label: 'Rigid Model', description: 'Difficult to change, locked into current approach' },
      { value: 'limited', label: 'Limited Flexibility', description: 'Some ability to adapt with significant effort' },
      { value: 'flexible', label: 'Flexible Model', description: 'Can adapt to market changes with reasonable effort' },
      { value: 'highly_adaptable', label: 'Highly Adaptable', description: 'Quickly adapts to market opportunities and threats' }
    ],
    businessImpact: {
      category: 'strategic',
      weight: 0.7,
      description: 'Adaptable business models better survive market disruptions and capitalize on opportunities'
    }
  }
] as const

// Section 5: Value Enhancement Potential Fields (5 fields)
export const VALUE_ENHANCEMENT_FIELDS: readonly ProfessionalQuestionnaireField[] = [
  {
    id: 'growthInvestmentCapacity',
    name: 'growthInvestmentCapacity',
    label: 'Growth Investment Capacity',
    type: 'currency',
    placeholder: '$50,000',
    helpText: 'Available capital for growth investments and improvements',
    methodologyExplanation: 'Investment capacity determines ability to fund growth initiatives and business improvements that drive value creation.',
    validationRules: {
      required: true,
      min: 0
    },
    businessImpact: {
      category: 'growth',
      weight: 0.8,
      description: 'Investment capacity enables value-creating improvements and growth initiatives'
    }
  },
  {
    id: 'marketExpansionOpportunities',
    name: 'marketExpansionOpportunities',
    label: 'Market Expansion Opportunities',
    type: 'array',
    placeholder: 'Enter expansion opportunities',
    helpText: 'List potential market expansion opportunities (up to 5)',
    methodologyExplanation: 'Market expansion opportunities indicate growth potential and scalability, supporting higher valuation multiples.',
    validationRules: {
      required: false
    },
    businessImpact: {
      category: 'growth',
      weight: 0.7,
      description: 'Clear expansion opportunities support growth projections and valuation premiums'
    }
  },
  {
    id: 'improvementImplementationTimeline',
    name: 'improvementImplementationTimeline',
    label: 'Improvement Implementation Timeline',
    type: 'select',
    helpText: 'Typical timeline to implement business improvements',
    methodologyExplanation: 'Implementation timeline indicates organizational agility and speed of value realization from improvements.',
    validationRules: {
      required: true
    },
    options: [
      { value: 'immediate', label: 'Immediate (0-1 month)', description: 'Can implement improvements very quickly' },
      { value: '3_months', label: '3 Months', description: 'Typical implementation within a quarter' },
      { value: '6_months', label: '6 Months', description: 'Implementation requires 6 months' },
      { value: '12_months', label: '12 Months', description: 'Major improvements take up to a year' },
      { value: 'longer', label: 'Longer than 12 Months', description: 'Complex improvements require extended timelines' }
    ],
    businessImpact: {
      category: 'efficiency',
      weight: 0.6,
      description: 'Faster implementation enables quicker value realization and return on investment'
    }
  },
  {
    id: 'organizationalChangeCapacity',
    name: 'organizationalChangeCapacity',
    label: 'Organizational Change Capacity',
    type: 'select',
    helpText: 'Organization\'s ability to handle and implement changes',
    methodologyExplanation: 'Change capacity indicates ability to execute improvement initiatives and adapt to market opportunities.',
    validationRules: {
      required: true
    },
    options: [
      { value: 'limited', label: 'Limited Capacity', description: 'Struggles with change, prefers status quo' },
      { value: 'moderate', label: 'Moderate Capacity', description: 'Can handle incremental changes with support' },
      { value: 'strong', label: 'Strong Capacity', description: 'Embraces change and implements improvements effectively' },
      { value: 'exceptional', label: 'Exceptional Capacity', description: 'Thrives on change and continuous improvement' }
    ],
    businessImpact: {
      category: 'strategic',
      weight: 0.7,
      description: 'Strong change capacity enables continuous improvement and adaptation to opportunities'
    }
  },
  {
    id: 'valueCreationPotential',
    name: 'valueCreationPotential',
    label: 'Overall Value Creation Potential',
    type: 'select',
    helpText: 'Overall potential to create additional business value',
    methodologyExplanation: 'Value creation potential summarizes improvement opportunities and business enhancement possibilities.',
    validationRules: {
      required: true
    },
    options: [
      { value: 'low', label: 'Low Potential', description: 'Limited opportunities for significant value improvements' },
      { value: 'moderate', label: 'Moderate Potential', description: 'Some clear opportunities for value enhancement' },
      { value: 'high', label: 'High Potential', description: 'Multiple significant value creation opportunities' },
      { value: 'exceptional', label: 'Exceptional Potential', description: 'Transformational value creation opportunities' }
    ],
    businessImpact: {
      category: 'valuation',
      weight: 0.9,
      description: 'High value creation potential supports premium valuations and buyer interest'
    }
  }
] as const

// Complete section definitions
export const PROFESSIONAL_QUESTIONNAIRE_SECTIONS: readonly ProfessionalQuestionnaireSection[] = [
  {
    id: 'financialPerformance',
    title: 'Financial Performance Analysis',
    description: 'Comprehensive 3-year financial history and advanced ratio analysis',
    methodology: BUSINESS_METHODOLOGIES.threeYearFinancialHistory.definition,
    fields: FINANCIAL_PERFORMANCE_FIELDS,
    estimatedTimeMinutes: 8,
    requiredFields: 13,
    totalFields: 13
  },
  {
    id: 'customerRiskAnalysis',
    title: 'Customer & Risk Analysis',
    description: 'Customer concentration, retention metrics, and revenue quality assessment',
    methodology: BUSINESS_METHODOLOGIES.customerConcentrationRisk.definition,
    fields: CUSTOMER_RISK_ANALYSIS_FIELDS,
    estimatedTimeMinutes: 6,
    requiredFields: 10,
    totalFields: 10
  },
  {
    id: 'competitiveMarket',
    title: 'Competitive & Market Position',
    description: 'Market position analysis, competitive advantages, and growth scalability',
    methodology: BUSINESS_METHODOLOGIES.competitiveAdvantageAssessment.definition,
    fields: COMPETITIVE_MARKET_FIELDS,
    estimatedTimeMinutes: 5,
    requiredFields: 9,
    totalFields: 9
  },
  {
    id: 'operationalStrategic',
    title: 'Operational & Strategic Dependencies',
    description: 'Key person risks, management depth, and strategic planning assessment',
    methodology: BUSINESS_METHODOLOGIES.keyPersonDependency.definition,
    fields: OPERATIONAL_STRATEGIC_FIELDS,
    estimatedTimeMinutes: 4,
    requiredFields: 7,
    totalFields: 7
  },
  {
    id: 'valueEnhancement',
    title: 'Value Enhancement Potential',
    description: 'Growth capacity, improvement timeline, and value creation opportunities',
    methodology: BUSINESS_METHODOLOGIES.scalabilityAssessment.definition,
    fields: VALUE_ENHANCEMENT_FIELDS,
    estimatedTimeMinutes: 3,
    requiredFields: 5,
    totalFields: 5
  }
] as const

// Export field count summary
export const PROFESSIONAL_QUESTIONNAIRE_FIELD_SUMMARY = {
  sections: PROFESSIONAL_QUESTIONNAIRE_SECTIONS.length,
  totalFields: PROFESSIONAL_QUESTIONNAIRE_SECTIONS.reduce((sum, section) => sum + section.totalFields, 0),
  requiredFields: PROFESSIONAL_QUESTIONNAIRE_SECTIONS.reduce((sum, section) => sum + section.requiredFields, 0),
  estimatedTotalTimeMinutes: PROFESSIONAL_QUESTIONNAIRE_SECTIONS.reduce((sum, section) => sum + section.estimatedTimeMinutes, 0)
} as const