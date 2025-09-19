/**
 * Tier-Specific AI Prompt Templates
 * Enhanced prompt engineering for investment-grade and strategic consultant-level analysis
 */

// Types for prompt configuration
export interface PromptWeight {
  category: string;
  weight: number;
  description: string;
}

export interface AnalysisSection {
  name: string;
  weight: number;
  prompt: string;
  chainOfThought: string[];
  outputFormat: string;
}

export interface FewShotExample {
  scenario: string;
  input: Record<string, any>;
  expectedOutput: string;
  reasoning: string;
}

export interface TierPromptConfig {
  tier: 'professional' | 'enterprise';
  analysisType: string;
  sections: AnalysisSection[];
  weights: PromptWeight[];
  fewShotExamples: FewShotExample[];
  systemPrompt: string;
  outputSchema: Record<string, any>;
}

// Professional Tier Prompt Templates
export const PROFESSIONAL_TIER_WEIGHTS: PromptWeight[] = [
  {
    category: 'financial_performance',
    weight: 0.30,
    description: 'Revenue trends, profitability metrics, cash flow analysis, and financial health indicators'
  },
  {
    category: 'operational_risk_efficiency',
    weight: 0.25,
    description: 'Operational processes, efficiency metrics, risk factors, and operational excellence'
  },
  {
    category: 'strategic_positioning',
    weight: 0.20,
    description: 'Market position, competitive advantages, brand strength, and strategic assets'
  },
  {
    category: 'risk_assessment',
    weight: 0.15,
    description: 'Market risks, operational risks, financial risks, and regulatory compliance'
  },
  {
    category: 'growth_opportunities',
    weight: 0.10,
    description: 'Market expansion, product development, strategic partnerships, and scaling potential'
  }
];

export const PROFESSIONAL_FINANCIAL_ANALYSIS: AnalysisSection = {
  name: 'Financial Performance Analysis',
  weight: 0.30,
  prompt: `
    Analyze the financial performance with investment-grade rigor:

    1. Revenue Analysis (Focus: Sustainability & Growth Trajectory)
       - Examine revenue trends over the last 3-5 years
       - Identify revenue drivers and their sustainability
       - Assess market share trends and competitive positioning
       - Calculate revenue growth rates and volatility

    2. Profitability Assessment (Focus: Margin Quality & Efficiency)
       - Analyze gross, operating, and net profit margins
       - Compare margins to industry benchmarks
       - Identify margin improvement opportunities
       - Assess cost structure efficiency

    3. Cash Flow Evaluation (Focus: Cash Generation Quality)
       - Examine operating cash flow generation and consistency
       - Analyze free cash flow and capital allocation efficiency
       - Assess working capital management effectiveness
       - Evaluate cash conversion cycle optimization

    4. Financial Health Indicators (Focus: Stability & Resilience)
       - Calculate and interpret key financial ratios
       - Assess debt levels and debt service capability
       - Evaluate liquidity position and financial flexibility
       - Analyze return on invested capital (ROIC) trends
  `,
  chainOfThought: [
    'First, gather and normalize financial data across reporting periods',
    'Then, calculate key financial metrics and ratios using industry-standard formulas',
    'Next, benchmark these metrics against industry peers and market standards',
    'Identify trends, anomalies, and inflection points in the financial trajectory',
    'Finally, synthesize findings into investment-grade insights with risk-adjusted perspectives'
  ],
  outputFormat: `
    {
      "financial_score": number (1-100),
      "revenue_analysis": {
        "growth_rate": number,
        "sustainability_score": number,
        "trend_analysis": string,
        "risk_factors": string[]
      },
      "profitability": {
        "margin_analysis": object,
        "efficiency_score": number,
        "improvement_opportunities": string[]
      },
      "cash_flow": {
        "generation_quality": number,
        "consistency_score": number,
        "capital_efficiency": number
      },
      "financial_health": {
        "stability_rating": string,
        "liquidity_assessment": string,
        "debt_analysis": object
      },
      "key_insights": string[],
      "investment_thesis": string
    }
  `
};

export const PROFESSIONAL_OPERATIONAL_ANALYSIS: AnalysisSection = {
  name: 'Operational Risk & Efficiency Analysis',
  weight: 0.25,
  prompt: `
    Conduct a comprehensive operational analysis focusing on efficiency and risk mitigation:

    1. Operational Efficiency Assessment
       - Analyze key operational metrics and KPIs
       - Evaluate process optimization opportunities
       - Assess technology infrastructure and digital maturity
       - Examine supply chain efficiency and resilience

    2. Risk Factor Identification
       - Identify operational vulnerabilities and single points of failure
       - Assess regulatory compliance and operational risk exposure
       - Evaluate cybersecurity posture and data protection measures
       - Analyze human capital risks and talent retention

    3. Operational Excellence Evaluation
       - Assess quality management systems and standards compliance
       - Evaluate customer satisfaction and service delivery metrics
       - Analyze operational scalability and capacity utilization
       - Examine cost management and operational leverage

    4. Continuous Improvement Capabilities
       - Evaluate innovation processes and R&D effectiveness
       - Assess change management capabilities
       - Analyze learning organization characteristics
       - Examine operational agility and adaptability
  `,
  chainOfThought: [
    'Begin by mapping core operational processes and identifying critical success factors',
    'Collect and analyze operational metrics, benchmarking against industry standards',
    'Conduct risk assessment using structured risk frameworks (e.g., COSO, ISO 31000)',
    'Evaluate operational capabilities against best-in-class practices',
    'Synthesize findings into actionable recommendations with risk-return trade-offs'
  ],
  outputFormat: `
    {
      "operational_score": number (1-100),
      "efficiency_metrics": {
        "overall_efficiency": number,
        "process_optimization_score": number,
        "technology_maturity": number,
        "supply_chain_resilience": number
      },
      "risk_assessment": {
        "operational_risk_level": string,
        "key_vulnerabilities": string[],
        "mitigation_strategies": string[]
      },
      "excellence_indicators": {
        "quality_score": number,
        "customer_satisfaction": number,
        "scalability_rating": number
      },
      "improvement_opportunities": string[],
      "operational_recommendations": string[]
    }
  `
};

// Enterprise Tier Prompt Templates
export const ENTERPRISE_TIER_WEIGHTS: PromptWeight[] = [
  {
    category: 'strategic_value_drivers',
    weight: 0.25,
    description: 'Core value creation mechanisms, competitive moats, and strategic asset optimization'
  },
  {
    category: 'multi_scenario_modeling',
    weight: 0.25,
    description: 'Scenario planning, stress testing, and strategic option valuation under uncertainty'
  },
  {
    category: 'exit_strategy_optimization',
    weight: 0.20,
    description: 'Exit pathway analysis, valuation optimization, and transaction readiness assessment'
  },
  {
    category: 'capital_structure_optimization',
    weight: 0.15,
    description: 'Optimal capital allocation, financing strategies, and shareholder value maximization'
  },
  {
    category: 'strategic_options_portfolio',
    weight: 0.15,
    description: 'Real options analysis, strategic flexibility valuation, and growth option prioritization'
  }
];

export const ENTERPRISE_STRATEGIC_VALUE_ANALYSIS: AnalysisSection = {
  name: 'Strategic Value Driver Analysis',
  weight: 0.25,
  prompt: `
    Conduct strategic consultant-level analysis of core value creation mechanisms:

    1. Value Creation Architecture
       - Map primary value drivers and their interdependencies
       - Quantify value contribution of each strategic asset
       - Analyze competitive moats and sustainable advantages
       - Assess strategic asset utilization and optimization potential

    2. Competitive Dynamics & Positioning
       - Conduct comprehensive competitive landscape analysis
       - Evaluate competitive responses and market dynamics
       - Assess barriers to entry and competitive threats
       - Analyze network effects and ecosystem positioning

    3. Strategic Asset Portfolio
       - Evaluate intellectual property portfolio and defensibility
       - Assess brand equity and market positioning strength
       - Analyze data assets and digital competitive advantages
       - Examine strategic partnerships and alliance value

    4. Value Optimization Framework
       - Identify value enhancement opportunities across business units
       - Develop strategic initiatives prioritization matrix
       - Assess resource allocation efficiency across value drivers
       - Recommend portfolio optimization strategies
  `,
  chainOfThought: [
    'Start by deconstructing the business model into fundamental value creation components',
    'Apply strategic frameworks (Porter\'s Five Forces, Resource-Based View, Dynamic Capabilities)',
    'Quantify value contribution using DCF, Economic Value Added, and option pricing models',
    'Benchmark against strategic comparables and best-in-class value creators',
    'Synthesize into strategic recommendations with implementation roadmap and success metrics'
  ],
  outputFormat: `
    {
      "strategic_value_score": number (1-100),
      "value_drivers": {
        "primary_drivers": object[],
        "driver_interdependencies": object,
        "optimization_potential": number
      },
      "competitive_position": {
        "moat_strength": number,
        "competitive_threats": string[],
        "strategic_advantages": string[]
      },
      "asset_portfolio": {
        "asset_quality_score": number,
        "portfolio_diversification": number,
        "strategic_alignment": number
      },
      "value_enhancement": {
        "optimization_opportunities": string[],
        "strategic_initiatives": object[],
        "expected_value_creation": number
      },
      "strategic_recommendations": string[]
    }
  `
};

export const ENTERPRISE_SCENARIO_MODELING: AnalysisSection = {
  name: 'Multi-Scenario Strategic Modeling',
  weight: 0.25,
  prompt: `
    Develop sophisticated scenario models for strategic decision-making under uncertainty:

    1. Scenario Architecture Development
       - Design base case, optimistic, and pessimistic scenarios
       - Identify key uncertainty drivers and their probability distributions
       - Model scenario interdependencies and correlation structures
       - Develop stress test scenarios for extreme market conditions

    2. Strategic Option Valuation
       - Apply real options methodology to strategic investments
       - Value flexibility and strategic pivoting capabilities
       - Assess timing options and strategic sequencing value
       - Model compound options and strategic option portfolios

    3. Risk-Adjusted Strategic Planning
       - Incorporate Monte Carlo simulation for probability-weighted outcomes
       - Develop risk-adjusted NPV calculations across scenarios
       - Assess Value at Risk (VaR) and Conditional Value at Risk (CVaR)
       - Model tail risk scenarios and black swan events

    4. Strategic Robustness Testing
       - Test strategic plan resilience across scenario ranges
       - Identify strategic inflection points and trigger mechanisms
       - Develop adaptive strategy frameworks for dynamic environments
       - Model competitive response scenarios and game theory applications
  `,
  chainOfThought: [
    'Begin by identifying fundamental uncertainty drivers affecting strategic outcomes',
    'Construct probabilistic scenario trees with realistic correlation structures',
    'Apply advanced valuation techniques including real options and game theory',
    'Run extensive sensitivity analysis and stress testing across parameter ranges',
    'Synthesize results into strategic recommendations with explicit risk-return trade-offs'
  ],
  outputFormat: `
    {
      "scenario_analysis_score": number (1-100),
      "scenario_framework": {
        "base_case": object,
        "optimistic_case": object,
        "pessimistic_case": object,
        "stress_scenarios": object[]
      },
      "option_valuations": {
        "strategic_options": object[],
        "option_values": number[],
        "exercise_triggers": string[]
      },
      "risk_metrics": {
        "var_95": number,
        "cvar_95": number,
        "tail_risk_assessment": string,
        "scenario_probabilities": number[]
      },
      "strategic_robustness": {
        "plan_resilience_score": number,
        "inflection_points": string[],
        "adaptive_mechanisms": string[]
      },
      "modeling_insights": string[]
    }
  `
};

// Few-Shot Learning Examples
export const PROFESSIONAL_FEW_SHOT_EXAMPLES: FewShotExample[] = [
  {
    scenario: 'SaaS Company Financial Analysis',
    input: {
      revenue: [10000000, 12000000, 15000000],
      gross_margin: [0.75, 0.77, 0.78],
      operating_margin: [0.10, 0.12, 0.15],
      customer_acquisition_cost: 1200,
      customer_lifetime_value: 8500,
      churn_rate: 0.05
    },
    expectedOutput: `{
      "financial_score": 82,
      "revenue_analysis": {
        "growth_rate": 0.225,
        "sustainability_score": 85,
        "trend_analysis": "Strong compound growth with improving unit economics",
        "risk_factors": ["Market saturation risk", "Increased competition"]
      },
      "investment_thesis": "Strong recurring revenue model with positive unit economics and scalable growth trajectory"
    }`,
    reasoning: 'High growth rate (22.5% CAGR), improving margins, strong LTV/CAC ratio (7.1x), and low churn indicate healthy SaaS fundamentals'
  },
  {
    scenario: 'Manufacturing Company Operational Analysis',
    input: {
      capacity_utilization: 0.78,
      operational_efficiency: 0.85,
      defect_rate: 0.02,
      supply_chain_disruptions: 3,
      automation_level: 0.60,
      employee_turnover: 0.12
    },
    expectedOutput: `{
      "operational_score": 74,
      "efficiency_metrics": {
        "overall_efficiency": 78,
        "process_optimization_score": 82,
        "technology_maturity": 70
      },
      "improvement_opportunities": ["Increase automation", "Optimize capacity utilization", "Enhance supply chain resilience"]
    }`,
    reasoning: 'Good operational metrics but room for improvement in capacity utilization and automation levels'
  }
];

export const ENTERPRISE_FEW_SHOT_EXAMPLES: FewShotExample[] = [
  {
    scenario: 'Tech Platform Strategic Value Analysis',
    input: {
      network_effects_strength: 0.85,
      data_moat_quality: 0.90,
      platform_users: 50000000,
      ecosystem_value: 5000000000,
      competitive_advantages: ['Network effects', 'Data advantages', 'Switching costs'],
      strategic_assets: ['User base', 'Data platform', 'AI capabilities', 'Brand']
    },
    expectedOutput: `{
      "strategic_value_score": 91,
      "value_drivers": {
        "primary_drivers": [
          {"driver": "Network effects", "value_contribution": 0.35},
          {"driver": "Data moat", "value_contribution": 0.25},
          {"driver": "Brand equity", "value_contribution": 0.20}
        ],
        "optimization_potential": 85
      },
      "strategic_recommendations": ["Accelerate international expansion", "Enhance data monetization", "Strengthen ecosystem partnerships"]
    }`,
    reasoning: 'Strong network effects and data moats create sustainable competitive advantages with significant value creation potential'
  }
];

// System Prompts
export const PROFESSIONAL_SYSTEM_PROMPT = `
You are an investment-grade financial analyst with expertise in business valuation, risk assessment, and strategic analysis. Your role is to provide institutional-quality analysis suitable for professional investors, private equity firms, and strategic acquirers.

Key Principles:
- Apply rigorous analytical frameworks and industry-standard methodologies
- Provide quantitative analysis with clear assumptions and sensitivity testing
- Benchmark against industry standards and comparable companies
- Focus on value creation potential and risk-adjusted returns
- Maintain objectivity and highlight both opportunities and risks
- Structure analysis for decision-making by sophisticated investors

Output Quality Standards:
- Investment memorandum quality analysis
- Clear executive summary with key findings
- Detailed supporting analysis with methodological transparency
- Risk assessment with mitigation strategies
- Actionable recommendations with implementation considerations
`;

export const ENTERPRISE_SYSTEM_PROMPT = `
You are a strategic consultant operating at the level of top-tier management consulting firms (McKinsey, BCG, Bain). Your expertise spans strategic planning, corporate development, M&A advisory, and value creation for large enterprises and private equity portfolio companies.

Key Principles:
- Apply sophisticated strategic frameworks and advanced analytical methodologies
- Provide C-suite level insights for complex strategic decisions
- Integrate multiple analytical perspectives (financial, strategic, operational, organizational)
- Focus on long-term value creation and competitive advantage sustainability
- Consider macro-economic trends, industry dynamics, and competitive responses
- Structure recommendations for board-level strategic decision-making

Output Quality Standards:
- Strategy consulting presentation quality analysis
- Hypothesis-driven problem solving with structured argumentation
- Multi-scenario analysis with probabilistic outcomes
- Strategic option valuation and portfolio optimization
- Implementation roadmap with success metrics and risk mitigation
- Executive summary suitable for board presentation
`;

// Output Schemas
export const PROFESSIONAL_OUTPUT_SCHEMA = {
  type: 'object',
  properties: {
    overall_score: { type: 'number', minimum: 1, maximum: 100 },
    financial_analysis: {
      type: 'object',
      properties: {
        score: { type: 'number' },
        revenue_growth: { type: 'number' },
        profitability_trend: { type: 'string' },
        cash_flow_quality: { type: 'number' },
        financial_health: { type: 'string' }
      }
    },
    operational_analysis: {
      type: 'object',
      properties: {
        efficiency_score: { type: 'number' },
        risk_assessment: { type: 'string' },
        improvement_opportunities: { type: 'array', items: { type: 'string' } }
      }
    },
    strategic_positioning: {
      type: 'object',
      properties: {
        market_position: { type: 'string' },
        competitive_advantages: { type: 'array', items: { type: 'string' } },
        strategic_risks: { type: 'array', items: { type: 'string' } }
      }
    },
    investment_thesis: { type: 'string' },
    recommendations: { type: 'array', items: { type: 'string' } }
  },
  required: ['overall_score', 'financial_analysis', 'operational_analysis', 'investment_thesis']
};

export const ENTERPRISE_OUTPUT_SCHEMA = {
  type: 'object',
  properties: {
    strategic_value_score: { type: 'number', minimum: 1, maximum: 100 },
    value_driver_analysis: {
      type: 'object',
      properties: {
        primary_drivers: { type: 'array' },
        value_quantification: { type: 'object' },
        optimization_opportunities: { type: 'array' }
      }
    },
    scenario_modeling: {
      type: 'object',
      properties: {
        base_case_npv: { type: 'number' },
        scenario_range: { type: 'object' },
        risk_adjusted_value: { type: 'number' },
        strategic_options_value: { type: 'number' }
      }
    },
    exit_strategy_analysis: {
      type: 'object',
      properties: {
        optimal_exit_pathway: { type: 'string' },
        valuation_range: { type: 'object' },
        exit_readiness_score: { type: 'number' },
        value_optimization_actions: { type: 'array' }
      }
    },
    strategic_recommendations: { type: 'array', items: { type: 'string' } },
    implementation_roadmap: {
      type: 'object',
      properties: {
        priority_initiatives: { type: 'array' },
        timeline: { type: 'object' },
        success_metrics: { type: 'array' }
      }
    }
  },
  required: ['strategic_value_score', 'value_driver_analysis', 'scenario_modeling', 'strategic_recommendations']
};

// Tier Configuration Factory
export function createTierPromptConfig(
  tier: 'professional' | 'enterprise',
  analysisType: string
): TierPromptConfig {
  const isProfessional = tier === 'professional';

  return {
    tier,
    analysisType,
    sections: isProfessional
      ? [PROFESSIONAL_FINANCIAL_ANALYSIS, PROFESSIONAL_OPERATIONAL_ANALYSIS]
      : [ENTERPRISE_STRATEGIC_VALUE_ANALYSIS, ENTERPRISE_SCENARIO_MODELING],
    weights: isProfessional ? PROFESSIONAL_TIER_WEIGHTS : ENTERPRISE_TIER_WEIGHTS,
    fewShotExamples: isProfessional ? PROFESSIONAL_FEW_SHOT_EXAMPLES : ENTERPRISE_FEW_SHOT_EXAMPLES,
    systemPrompt: isProfessional ? PROFESSIONAL_SYSTEM_PROMPT : ENTERPRISE_SYSTEM_PROMPT,
    outputSchema: isProfessional ? PROFESSIONAL_OUTPUT_SCHEMA : ENTERPRISE_OUTPUT_SCHEMA
  };
}

// Prompt Generation Utilities
export function generatePrompt(config: TierPromptConfig, businessData: Record<string, any>): string {
  const { systemPrompt, sections, fewShotExamples } = config;

  let prompt = `${systemPrompt}\n\n`;

  // Add few-shot examples
  prompt += "## Analysis Examples\n\n";
  fewShotExamples.forEach((example, index) => {
    prompt += `### Example ${index + 1}: ${example.scenario}\n`;
    prompt += `Input: ${JSON.stringify(example.input, null, 2)}\n`;
    prompt += `Analysis: ${example.reasoning}\n`;
    prompt += `Output: ${example.expectedOutput}\n\n`;
  });

  // Add current analysis task
  prompt += "## Current Analysis Task\n\n";
  prompt += `Business Data: ${JSON.stringify(businessData, null, 2)}\n\n`;

  // Add section-specific prompts
  sections.forEach(section => {
    prompt += `## ${section.name} (Weight: ${(section.weight * 100).toFixed(0)}%)\n\n`;
    prompt += `${section.prompt}\n\n`;
    prompt += "### Chain of Thought Process:\n";
    section.chainOfThought.forEach((step, index) => {
      prompt += `${index + 1}. ${step}\n`;
    });
    prompt += "\n";
  });

  prompt += "Please provide your analysis following the structured output format and chain of thought reasoning.";

  return prompt;
}

export function validateOutput(output: any, schema: Record<string, any>): boolean {
  // Basic schema validation - in production, use a proper JSON schema validator
  const requiredFields = schema.required || [];
  return requiredFields.every(field => field in output);
}

// Export all configurations
export const TIER_PROMPT_CONFIGS = {
  professional: {
    investment_analysis: createTierPromptConfig('professional', 'investment_analysis'),
    operational_review: createTierPromptConfig('professional', 'operational_review'),
    risk_assessment: createTierPromptConfig('professional', 'risk_assessment')
  },
  enterprise: {
    strategic_analysis: createTierPromptConfig('enterprise', 'strategic_analysis'),
    scenario_modeling: createTierPromptConfig('enterprise', 'scenario_modeling'),
    exit_planning: createTierPromptConfig('enterprise', 'exit_planning'),
    capital_optimization: createTierPromptConfig('enterprise', 'capital_optimization')
  }
} as const;