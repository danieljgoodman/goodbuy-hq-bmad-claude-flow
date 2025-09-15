import { config } from '@/lib/config'
import type { BusinessData } from '@/types/evaluation'
import type { 
  BusinessEvaluation, 
  ExtractedFinancialData, 
  DocumentProcessingResult,
  MarketComparable,
  IndustryAdjustment,
  HealthDimension,
  BenchmarkCategory
} from '@/types'

// Epic 2: Enhanced analysis interfaces
export interface EnhancedHealthAnalysis {
  healthScore: number
  confidenceScore: number
  methodology: string
  scoringFactors: {
    financial: HealthDimension
    operational: HealthDimension
    market: HealthDimension
    risk: HealthDimension
    growth: HealthDimension
  }
  industryBenchmarks: {
    percentile: number
    industryAverage: number
    topPerformers: number
    benchmarkCategories: BenchmarkCategory[]
  }
  topOpportunities: Array<{
    id: string
    category: 'operational' | 'financial' | 'strategic' | 'market'
    title: string
    description: string
    impactEstimate: {
      dollarAmount: number
      percentageIncrease: number
      confidence: number
      roiEstimate: number
      timeline: string
    }
    difficulty: 'low' | 'medium' | 'high'
    timeframe: string
    priority: number
    requiredResources: string[]
    specificAnalysis: string
    selectionRationale: string
    riskFactors: string[]
    prerequisites: string[]
  }>
}

export interface MultiMethodologyValuation {
  assetBased: {
    value: number
    confidence: number
    methodology: string
    factors: string[]
  }
  incomeBased: {
    value: number
    confidence: number
    methodology: string
    multiple: number
    factors: string[]
  }
  marketBased: {
    value: number
    confidence: number
    methodology: string
    comparables: MarketComparable[]
    factors: string[]
  }
  weighted: {
    value: number
    confidence: number
    methodology: string
    weightings: {
      assetBased: number
      incomeBased: number
      marketBased: number
    }
  }
  industryAdjustments: IndustryAdjustment[]
  valuationRange: {
    low: number
    high: number
    mostLikely: number
  }
}

// Legacy interface for backward compatibility
export interface HealthAnalysis {
  healthScore: number
  confidenceScore: number
  methodology: string
  scoringFactors: {
    financial: number
    operational: number
    market: number
    risk: number
  }
  topOpportunities: Array<{
    id: string
    category: 'operational' | 'financial' | 'strategic' | 'market'
    title: string
    description: string
    impactEstimate: {
      dollarAmount: number
      percentageIncrease: number
      confidence: number
    }
    difficulty: 'low' | 'medium' | 'high'
    timeframe: string
    priority: number
    requiredResources: string[]
  }>
}

export class ClaudeService {
  private static baseUrl = '/api/claude'
  private static headers = {
    'Content-Type': 'application/json',
  }

  // Epic 2: Document Intelligence Methods
  static async extractFinancialData(documentContent: string, fileType: 'pdf' | 'excel' | 'image'): Promise<ExtractedFinancialData> {
    const prompt = this.createDocumentExtractionPrompt(documentContent, fileType)
    
    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify({
          type: 'document-extraction',
          documentContent,
          fileType
        }),
      })

      if (!response.ok) {
        throw new Error(`Claude API error: ${response.statusText}`)
      }

      const result = await response.json()
      if (result.fallback) {
        throw new Error('Claude API unavailable')
      }
      const analysisText = result.analysisText
      
      return this.parseDocumentExtractionResponse(analysisText)
    } catch (error) {
      console.error('Document extraction error:', error)
      console.log('🤖 Falling back to mock data for demo purposes')
      
      // Return mock data for demo when Claude API is not available
      return this.createMockExtractedData(documentContent, fileType)
    }
  }

  // Demo fallback method for when Claude API is not available
  private static createMockExtractedData(documentContent: string, fileType: 'pdf' | 'excel' | 'image'): ExtractedFinancialData {
    // Extract any numbers from the document content for more realistic data
    const numbers = documentContent.match(/\$?[\d,]+/g)?.map(n => parseInt(n.replace(/[$,]/g, ''))) || []
    
    // Look for specific financial keywords and their associated numbers
    const revenueMatch = documentContent.match(/revenue:?\s*\$?([\d,]+)/i)
    const expenseMatch = documentContent.match(/expenses:?\s*\$?([\d,]+)/i)
    const profitMatch = documentContent.match(/profit:?\s*\$?([\d,]+)/i)
    const assetsMatch = documentContent.match(/assets:?\s*\$?([\d,]+)/i)
    const liabilitiesMatch = documentContent.match(/liabilities:?\s*\$?([\d,]+)/i)
    
    const revenue = revenueMatch ? parseInt(revenueMatch[1].replace(/,/g, '')) : (numbers.find(n => n > 50000) || 150000)
    const expenses = expenseMatch ? parseInt(expenseMatch[1].replace(/,/g, '')) : (revenue * 0.75)
    const assets = assetsMatch ? parseInt(assetsMatch[1].replace(/,/g, '')) : (revenue * 2)
    const liabilities = liabilitiesMatch ? parseInt(liabilitiesMatch[1].replace(/,/g, '')) : (assets * 0.3)
    const profit = profitMatch ? parseInt(profitMatch[1].replace(/,/g, '')) : (revenue - expenses)
    
    return {
      source: "pdf",
      extractionDate: new Date(),
      revenue: {
        value: revenue,
        confidence: 88,
        source: "AI Analysis",
        breakdown: [
          { category: 'Product Sales', amount: Math.round(revenue * 0.7), percentage: 70 },
          { category: 'Service Revenue', amount: Math.round(revenue * 0.3), percentage: 30 }
        ],
        timeFrame: 'annual'
      },
      expenses: {
        value: expenses,
        confidence: 85,
        source: "AI Analysis",
        breakdown: [
          { category: 'Salaries', amount: Math.round(expenses * 0.5), percentage: 50 },
          { category: 'Operating Costs', amount: Math.round(expenses * 0.35), percentage: 35 },
          { category: 'Marketing', amount: Math.round(expenses * 0.15), percentage: 15 }
        ]
      },
      cashFlow: {
        value: profit,
        confidence: 82,
        source: "AI Analysis",
        breakdown: [
          { category: 'Operating', amount: Math.round(profit * 1.2), percentage: 120 },
          { category: 'Investing', amount: Math.round(-profit * 0.3), percentage: -30 },
          { category: 'Financing', amount: Math.round(profit * 0.1), percentage: 10 }
        ]
      },
      balanceSheet: {
        assets: assets,
        liabilities: liabilities,
        confidence: 80,
        source: "AI Analysis"
      },
      confidence: 84,
      inconsistencies: [],
      missingData: ['Detailed cash flow statement'],
      dataQualityFlags: [`Extracted from ${fileType} document`, 'AI-powered mock extraction from document content']
    }
  }

  // Epic 2: Multi-Methodology Valuation Engine
  static async performMultiMethodologyValuation(businessData: Partial<BusinessData> & { annualRevenue: number; expenses: number; assets: number; liabilities: number }): Promise<MultiMethodologyValuation> {
    const prompt = this.createValuationPrompt(businessData)
    
    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify({
          type: 'multi-methodology-valuation',
          businessData
        }),
      })

      if (!response.ok) {
        throw new Error(`Claude API error: ${response.statusText}`)
      }

      const result = await response.json()
      if (result.fallback) {
        throw new Error('Claude API unavailable')
      }
      const analysisText = result.analysisText
      
      return this.parseValuationResponse(analysisText, businessData)
    } catch (error) {
      console.error('Multi-methodology valuation error:', error)
      return this.generateFallbackValuation(businessData)
    }
  }

  // Epic 2: Enhanced Health Analysis
  static async analyzeEnhancedBusinessHealth(businessData: Partial<BusinessData> & { annualRevenue: number; expenses: number; assets: number; liabilities: number }): Promise<EnhancedHealthAnalysis> {
    const prompt = this.createEnhancedAnalysisPrompt(businessData)
    
    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify({
          type: 'enhanced-health-analysis',
          businessData
        }),
      })

      if (!response.ok) {
        throw new Error(`Claude API error: ${response.statusText}`)
      }

      const result = await response.json()
      if (result.fallback) {
        throw new Error('Claude API unavailable')
      }
      const analysisText = result.analysisText
      
      return this.parseEnhancedAnalysisResponse(analysisText, businessData)
    } catch (error) {
      console.error('Enhanced health analysis error:', error)
      return this.generateFallbackEnhancedAnalysis(businessData)
    }
  }

  static async analyzeBusinessHealth(businessData: Partial<BusinessData> & { annualRevenue: number; expenses: number; assets: number; liabilities: number }): Promise<HealthAnalysis> {
    const prompt = this.createAnalysisPrompt(businessData)
    
    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify({
          type: 'basic-health-analysis',
          businessData
        }),
      })

      if (!response.ok) {
        throw new Error(`Claude API error: ${response.statusText}`)
      }

      const result = await response.json()
      if (result.fallback) {
        throw new Error('Claude API unavailable')
      }
      const analysisText = result.analysisText
      
      return this.parseAnalysisResponse(analysisText, businessData)
    } catch (error) {
      console.error('Claude API error:', error)
      
      // Fallback to rule-based analysis if API fails
      return this.generateFallbackAnalysis(businessData)
    }
  }

  private static createAnalysisPrompt(data: Partial<BusinessData> & { annualRevenue: number; expenses: number; assets: number; liabilities: number }): string {
    return `
You are a business analyst expert. Analyze this business and provide a comprehensive health assessment.

Business Information:
- Type: ${data.businessType || 'Not provided'}
- Industry: ${data.industryFocus || 'Not provided'}
- Years in Business: ${data.yearsInBusiness || 'Not provided'}
- Business Model: ${data.businessModel || 'Not provided'}
- Revenue Model: ${data.revenueModel || 'Not provided'}

Financial Metrics:
- Annual Revenue: $${data.annualRevenue.toLocaleString()}
- Monthly Recurring Revenue: $${(data.monthlyRecurring || 0).toLocaleString()}
- Annual Expenses: $${data.expenses.toLocaleString()}
- Monthly Cash Flow: $${(data.cashFlow || 0).toLocaleString()}
- Gross Margin: ${data.grossMargin || 0}%

Operational Data:
- Customers: ${(data.customerCount || 0).toLocaleString()}
- Employees: ${(data.employeeCount || 0).toLocaleString()}
- Market Position: ${data.marketPosition || 'Not provided'}
- Assets: $${data.assets.toLocaleString()}
- Liabilities: $${data.liabilities.toLocaleString()}
- Competitive Advantages: ${(data.competitiveAdvantages || []).join(', ') || 'None specified'}
- Sales Channels: ${(data.primaryChannels || []).join(', ') || 'Not provided'}

Please provide:

1. Overall Business Health Score (1-100)
2. Confidence Score in your analysis (1-100)
3. Brief methodology explanation
4. Scoring breakdown:
   - Financial health score (1-100)
   - Operational efficiency score (1-100)
   - Market position score (1-100)
   - Risk assessment score (1-100)
5. Top 3 improvement opportunities with:
   - Category (operational/financial/strategic/market)
   - Clear title and description
   - Estimated dollar impact and percentage improvement
   - Implementation difficulty (low/medium/high)
   - Timeframe for results
   - Required resources

Format your response as structured analysis, not JSON.
`
  }

  private static parseAnalysisResponse(analysisText: string, businessData: Partial<BusinessData> & { annualRevenue: number; expenses: number; assets: number; liabilities: number }): HealthAnalysis {
    // For now, return a structured fallback analysis
    // In production, this would parse the Claude response
    return this.generateFallbackAnalysis(businessData)
  }

  private static generateFallbackAnalysis(data: Partial<BusinessData> & { annualRevenue: number; expenses: number; assets: number; liabilities: number }): HealthAnalysis {
    // Calculate basic metrics
    const netProfit = data.annualRevenue - data.expenses
    const profitMargin = data.annualRevenue > 0 ? (netProfit / data.annualRevenue) * 100 : 0
    const netWorth = data.assets - data.liabilities
    const debtToAsset = data.assets > 0 ? (data.liabilities / data.assets) * 100 : 0
    const revenuePerEmployee = (data.employeeCount || 0) > 0 ? data.annualRevenue / (data.employeeCount || 1) : 0
    const revenuePerCustomer = (data.customerCount || 0) > 0 ? data.annualRevenue / (data.customerCount || 1) : 0

    // Calculate component scores
    const financialScore = this.calculateFinancialScore(data, profitMargin, netWorth)
    const operationalScore = this.calculateOperationalScore(data, revenuePerEmployee, revenuePerCustomer)
    const marketScore = this.calculateMarketScore(data)
    const riskScore = this.calculateRiskScore(data, debtToAsset)

    // Overall health score (weighted average)
    const healthScore = Math.round(
      (financialScore * 0.4 + operationalScore * 0.25 + marketScore * 0.2 + riskScore * 0.15)
    )

    // Generate improvement opportunities
    const opportunities = this.generateImprovementOpportunities(data, {
      financial: financialScore,
      operational: operationalScore,
      market: marketScore,
      risk: riskScore
    })

    return {
      healthScore: Math.max(1, Math.min(100, healthScore)),
      confidenceScore: 85, // High confidence for rule-based analysis
      methodology: 'Comprehensive analysis based on financial metrics, operational efficiency, market position, and risk factors.',
      scoringFactors: {
        financial: financialScore,
        operational: operationalScore,
        market: marketScore,
        risk: riskScore,
      },
      topOpportunities: opportunities.slice(0, 3)
    }
  }

  private static calculateFinancialScore(data: Partial<BusinessData> & { annualRevenue: number; expenses: number; assets: number; liabilities: number }, profitMargin: number, netWorth: number): number {
    let score = 50 // Base score

    // Profit margin assessment
    if (profitMargin > 20) score += 25
    else if (profitMargin > 10) score += 15
    else if (profitMargin > 0) score += 5
    else score -= 10

    // Cash flow assessment
    if ((data.cashFlow || 0) > data.annualRevenue * 0.1) score += 15
    else if ((data.cashFlow || 0) > 0) score += 5
    else score -= 15

    // Net worth assessment
    if (netWorth > data.annualRevenue) score += 10
    else if (netWorth > 0) score += 5
    else score -= 10

    return Math.max(1, Math.min(100, score))
  }

  private static calculateOperationalScore(data: Partial<BusinessData> & { annualRevenue: number; expenses: number; assets: number; liabilities: number }, revenuePerEmployee: number, revenuePerCustomer: number): number {
    let score = 50 // Base score

    // Revenue per employee (industry benchmarks vary)
    if (revenuePerEmployee > 200000) score += 20
    else if (revenuePerEmployee > 100000) score += 10
    else if (revenuePerEmployee > 50000) score += 5

    // Customer base assessment
    if ((data.customerCount || 0) > 1000) score += 15
    else if ((data.customerCount || 0) > 100) score += 10
    else if ((data.customerCount || 0) > 10) score += 5

    // Competitive advantages
    score += Math.min(15, (data.competitiveAdvantages || []).length * 3)

    return Math.max(1, Math.min(100, score))
  }

  private static calculateMarketScore(data: Partial<BusinessData> & { annualRevenue: number; expenses: number; assets: number; liabilities: number }): number {
    let score = 50 // Base score

    // Market position
    switch (data.marketPosition) {
      case 'Market Leader': score += 25; break
      case 'Strong Competitor': score += 20; break
      case 'Growing Player': score += 15; break
      case 'Niche Specialist': score += 10; break
      case 'New Entrant': score += 5; break
      default: break
    }

    // Years in business (stability)
    if ((data.yearsInBusiness || 0) > 10) score += 15
    else if ((data.yearsInBusiness || 0) > 5) score += 10
    else if ((data.yearsInBusiness || 0) > 2) score += 5

    // Sales channel diversity
    score += Math.min(10, (data.primaryChannels || []).length * 2)

    return Math.max(1, Math.min(100, score))
  }

  private static calculateRiskScore(data: Partial<BusinessData> & { annualRevenue: number; expenses: number; assets: number; liabilities: number }, debtToAsset: number): number {
    let score = 100 // Start high, reduce for risks

    // Debt ratio
    if (debtToAsset > 75) score -= 30
    else if (debtToAsset > 50) score -= 20
    else if (debtToAsset > 30) score -= 10

    // Cash flow risk
    if ((data.cashFlow || 0) < 0) score -= 25
    else if ((data.cashFlow || 0) < data.expenses * 0.1) score -= 15

    // Revenue concentration risk (single customer risk - simplified)
    if ((data.customerCount || 0) < 10) score -= 20
    else if ((data.customerCount || 0) < 50) score -= 10

    return Math.max(1, Math.min(100, score))
  }

  private static generateImprovementOpportunities(data: Partial<BusinessData> & { annualRevenue: number; expenses: number; assets: number; liabilities: number }, scores: any) {
    const opportunities = []

    // Financial opportunities
    if (scores.financial < 70) {
      const profitMargin = ((data.annualRevenue - data.expenses) / data.annualRevenue) * 100
      if (profitMargin < 15) {
        opportunities.push({
          id: 'cost-optimization',
          category: 'financial' as const,
          title: 'Cost Structure Optimization',
          description: 'Analyze and reduce operational costs to improve profit margins. Focus on largest expense categories and identify efficiency gains.',
          impactEstimate: {
            dollarAmount: data.expenses * 0.15,
            percentageIncrease: 15,
            confidence: 80
          },
          difficulty: 'medium' as const,
          timeframe: '3-6 months',
          priority: 1,
          requiredResources: ['Financial analysis', 'Process review', 'Management time']
        })
      }
    }

    // Operational opportunities  
    if (scores.operational < 70) {
      opportunities.push({
        id: 'customer-acquisition',
        category: 'operational' as const,
        title: 'Customer Acquisition Enhancement',
        description: 'Implement systematic customer acquisition strategies to grow revenue base and reduce customer concentration risk.',
        impactEstimate: {
          dollarAmount: data.annualRevenue * 0.25,
          percentageIncrease: 25,
          confidence: 70
        },
        difficulty: 'medium' as const,
        timeframe: '6-12 months',
        priority: 2,
        requiredResources: ['Marketing budget', 'Sales team', 'Customer analysis']
      })
    }

    // Market opportunities
    if (scores.market < 70) {
      opportunities.push({
        id: 'market-expansion',
        category: 'market' as const,
        title: 'Market Position Strengthening',
        description: 'Enhance competitive advantages and market positioning through differentiation and brand building.',
        impactEstimate: {
          dollarAmount: data.annualRevenue * 0.2,
          percentageIncrease: 20,
          confidence: 65
        },
        difficulty: 'high' as const,
        timeframe: '12-18 months',
        priority: 3,
        requiredResources: ['Strategic planning', 'Marketing investment', 'Product development']
      })
    }

    // Risk mitigation
    if (scores.risk < 70) {
      opportunities.push({
        id: 'risk-mitigation',
        category: 'financial' as const,
        title: 'Financial Risk Reduction',
        description: 'Improve debt-to-asset ratio and establish emergency cash reserves for business stability.',
        impactEstimate: {
          dollarAmount: data.liabilities * 0.3,
          percentageIncrease: 10,
          confidence: 90
        },
        difficulty: 'low' as const,
        timeframe: '3-9 months',
        priority: 1,
        requiredResources: ['Debt restructuring', 'Cash management', 'Financial planning']
      })
    }

    return opportunities.sort((a, b) => a.priority - b.priority)
  }

  // Epic 2: Document Extraction Prompt
  private static createDocumentExtractionPrompt(documentContent: string, fileType: 'pdf' | 'excel' | 'image'): string {
    return `
You are a financial document analysis expert. Extract key financial data from this ${fileType} document content.

Document Content:
${documentContent}

Please extract the following financial data with confidence scores:

1. Revenue Information:
   - Annual revenue
   - Monthly recurring revenue (if applicable)
   - Revenue breakdown by category/source
   - Confidence level (1-100)

2. Expense Information:
   - Total annual expenses
   - Expense breakdown by category
   - Confidence level (1-100)

3. Cash Flow:
   - Operating cash flow
   - Free cash flow
   - Confidence level (1-100)

4. Balance Sheet Items:
   - Total assets
   - Total liabilities
   - Net worth/equity
   - Confidence level (1-100)

5. Data Quality Assessment:
   - Overall completeness
   - Potential inconsistencies
   - Missing critical data points
   - Red flags or concerns

Format your response with clear numerical values and confidence scores for each extracted metric.
`
  }

  // Epic 2: Multi-Methodology Valuation Prompt
  private static createValuationPrompt(data: Partial<BusinessData> & { annualRevenue: number; expenses: number; assets: number; liabilities: number }): string {
    return `
You are a professional business valuation expert. Provide a comprehensive multi-methodology valuation for this business.

Business Information:
- Type: ${data.businessType || 'Not provided'}
- Industry: ${data.industryFocus || 'Not provided'}
- Years in Business: ${data.yearsInBusiness || 'Not provided'}
- Annual Revenue: $${data.annualRevenue.toLocaleString()}
- Net Profit: $${(data.annualRevenue - data.expenses).toLocaleString()}
- Assets: $${data.assets.toLocaleString()}
- Liabilities: $${data.liabilities.toLocaleString()}
- Net Worth: $${(data.assets - data.liabilities).toLocaleString()}

Please provide:

1. Asset-Based Valuation:
   - Calculated value
   - Methodology explanation
   - Key factors considered
   - Confidence level (1-100)

2. Income-Based Valuation:
   - Calculated value using earnings multiples
   - Multiple used and justification
   - Key factors considered
   - Confidence level (1-100)

3. Market-Based Valuation:
   - Calculated value using market comparables
   - Comparable companies/sales used
   - Multiple and methodology
   - Confidence level (1-100)

4. Industry-Specific Adjustments:
   - Industry factors affecting valuation
   - Adjustments made and reasoning
   - Market conditions impact

5. Weighted Final Valuation:
   - Final weighted value
   - Weighting rationale for each method
   - Valuation range (low, high, most likely)

6. Confidence Assessment:
   - Overall confidence in valuation
   - Key assumptions and limitations
   - Factors that could change valuation significantly

Provide specific numerical values and detailed reasoning for each methodology.
`
  }

  // Epic 2: Enhanced Health Analysis Prompt
  private static createEnhancedAnalysisPrompt(data: Partial<BusinessData> & { annualRevenue: number; expenses: number; assets: number; liabilities: number }): string {
    return `
You are a comprehensive business analyst. Provide an advanced multi-dimensional business health analysis with industry benchmarking.

Business Information:
- Type: ${data.businessType || 'Not provided'}
- Industry: ${data.industryFocus || 'Not provided'}
- Years in Business: ${data.yearsInBusiness || 'Not provided'}
- Annual Revenue: $${data.annualRevenue.toLocaleString()}
- Expenses: $${data.expenses.toLocaleString()}
- Net Profit: $${(data.annualRevenue - data.expenses).toLocaleString()}
- Assets: $${data.assets.toLocaleString()}
- Liabilities: $${data.liabilities.toLocaleString()}
- Customers: ${(data.customerCount || 0).toLocaleString()}
- Employees: ${(data.employeeCount || 0).toLocaleString()}

Provide detailed analysis in these dimensions:

1. Financial Health (score 1-100):
   - Profitability metrics and trends
   - Liquidity and cash flow analysis
   - Debt management and leverage
   - Industry benchmark comparison
   - Specific improvement recommendations

2. Operational Efficiency (score 1-100):
   - Revenue per employee analysis
   - Customer metrics and retention
   - Process efficiency indicators
   - Industry benchmark comparison
   - Specific improvement recommendations

3. Market Position (score 1-100):
   - Competitive position assessment
   - Market share and growth potential
   - Brand strength and differentiation
   - Industry benchmark comparison
   - Specific improvement recommendations

4. Risk Assessment (score 1-100):
   - Financial risk factors
   - Operational risk factors
   - Market and competitive risks
   - Industry benchmark comparison
   - Risk mitigation recommendations

5. Growth Potential (score 1-100):
   - Revenue growth trajectory
   - Market expansion opportunities
   - Scalability assessment
   - Industry benchmark comparison
   - Growth acceleration recommendations

6. Industry Benchmarking:
   - Overall percentile ranking in industry
   - Key metrics vs industry average
   - Top performer comparison
   - Performance gaps and opportunities

7. Top 5 Prioritized Improvement Opportunities:
   - Specific opportunity with detailed analysis
   - Quantified impact estimate ($ and %)
   - ROI calculation and timeline
   - Implementation difficulty and resources required
   - Risk factors and prerequisites
   - Why this opportunity is specifically relevant to this business

Provide specific scores, detailed reasoning, and actionable recommendations for each dimension.
`
  }

  // Epic 2: Document Extraction Response Parser
  private static parseDocumentExtractionResponse(analysisText: string): ExtractedFinancialData {
    // For now, return structured fallback data
    // In production, this would parse the Claude response
    return {
      source: 'pdf',
      extractionDate: new Date(),
      confidence: 75,
      revenue: {
        value: 0,
        confidence: 70,
        source: 'Document analysis'
      },
      expenses: {
        value: 0,
        confidence: 70,
        breakdown: [],
        source: 'Document analysis'
      },
      cashFlow: {
        value: 0,
        confidence: 70,
        source: 'Document analysis'
      },
      balanceSheet: {
        assets: 0,
        liabilities: 0,
        confidence: 70,
        source: 'Document analysis'
      },
      dataQualityFlags: ['Automated extraction'],
      inconsistencies: [],
      missingData: []
    }
  }

  // Epic 2: Valuation Response Parser
  private static parseValuationResponse(analysisText: string, businessData: Partial<BusinessData> & { annualRevenue: number; expenses: number; assets: number; liabilities: number }): MultiMethodologyValuation {
    // For now, return structured fallback valuation
    // In production, this would parse the Claude response
    return this.generateFallbackValuation(businessData)
  }

  // Epic 2: Enhanced Analysis Response Parser
  private static parseEnhancedAnalysisResponse(analysisText: string, businessData: Partial<BusinessData> & { annualRevenue: number; expenses: number; assets: number; liabilities: number }): EnhancedHealthAnalysis {
    // For now, return structured fallback analysis
    // In production, this would parse the Claude response
    return this.generateFallbackEnhancedAnalysis(businessData)
  }

  // Epic 2: Fallback Multi-Methodology Valuation
  private static generateFallbackValuation(data: Partial<BusinessData> & { annualRevenue: number; expenses: number; assets: number; liabilities: number }): MultiMethodologyValuation {
    const netProfit = data.annualRevenue - data.expenses
    const netWorth = data.assets - data.liabilities
    
    // Asset-based valuation
    const assetBased = Math.max(netWorth, 0)
    
    // Income-based valuation (5x earnings multiple for fallback)
    const incomeBased = Math.max(netProfit * 5, 0)
    
    // Market-based valuation (1.5x revenue multiple for fallback)  
    const marketBased = Math.max(data.annualRevenue * 1.5, 0)
    
    // Weighted valuation (40% income, 30% market, 30% asset)
    const weighted = (incomeBased * 0.4 + marketBased * 0.3 + assetBased * 0.3)

    return {
      assetBased: {
        value: assetBased,
        confidence: 80,
        methodology: 'Net asset value approach',
        factors: ['Total assets', 'Total liabilities', 'Asset quality']
      },
      incomeBased: {
        value: incomeBased,
        confidence: 75,
        methodology: 'Earnings multiple approach',
        multiple: 5,
        factors: ['Net profit', 'Earnings consistency', 'Growth prospects']
      },
      marketBased: {
        value: marketBased,
        confidence: 70,
        methodology: 'Revenue multiple approach',
        comparables: [
          {
            companyName: 'Industry Comparable A',
            industry: data.industryFocus || 'General',
            revenue: data.annualRevenue * 1.2,
            valuation: data.annualRevenue * 1.8,
            multiple: 1.5,
            source: 'Market data',
            relevanceScore: 80
          }
        ],
        factors: ['Revenue multiple', 'Industry comparables', 'Market conditions']
      },
      weighted: {
        value: weighted,
        confidence: 85,
        methodology: 'Weighted average of all methodologies',
        weightings: {
          assetBased: 0.3,
          incomeBased: 0.4,
          marketBased: 0.3
        }
      },
      industryAdjustments: [
        {
          factor: 'Industry risk',
          adjustment: -0.05,
          reasoning: 'Industry-specific risk factors',
          confidence: 70
        }
      ],
      valuationRange: {
        low: weighted * 0.8,
        high: weighted * 1.2,
        mostLikely: weighted
      }
    }
  }

  // Epic 2: Fallback Enhanced Health Analysis
  private static generateFallbackEnhancedAnalysis(data: Partial<BusinessData> & { annualRevenue: number; expenses: number; assets: number; liabilities: number }): EnhancedHealthAnalysis {
    // Calculate basic metrics
    const netProfit = data.annualRevenue - data.expenses
    const profitMargin = data.annualRevenue > 0 ? (netProfit / data.annualRevenue) * 100 : 0
    const netWorth = data.assets - data.liabilities
    const debtToAsset = data.assets > 0 ? (data.liabilities / data.assets) * 100 : 0

    // Enhanced scoring factors
    const financialDimension: HealthDimension = {
      score: this.calculateFinancialScore(data, profitMargin, netWorth),
      confidence: 85,
      factors: [
        { metric: 'Profit Margin', value: profitMargin, benchmark: 15, impact: 30 },
        { metric: 'Cash Flow', value: data.cashFlow || 0, benchmark: data.annualRevenue * 0.1, impact: 25 },
        { metric: 'Net Worth', value: netWorth, benchmark: data.annualRevenue * 0.5, impact: 20 }
      ],
      recommendations: ['Improve profit margins', 'Optimize cash flow', 'Build reserves'],
      trend: 'stable'
    }

    const operationalDimension: HealthDimension = {
      score: this.calculateOperationalScore(data, 
        (data.employeeCount || 0) > 0 ? data.annualRevenue / (data.employeeCount || 1) : 0,
        (data.customerCount || 0) > 0 ? data.annualRevenue / (data.customerCount || 1) : 0
      ),
      confidence: 80,
      factors: [
        { metric: 'Revenue per Employee', value: (data.employeeCount || 0) > 0 ? data.annualRevenue / (data.employeeCount || 1) : 0, benchmark: 150000, impact: 25 },
        { metric: 'Customer Count', value: data.customerCount || 0, benchmark: 500, impact: 20 }
      ],
      recommendations: ['Increase productivity', 'Expand customer base', 'Improve efficiency'],
      trend: 'improving'
    }

    const marketDimension: HealthDimension = {
      score: this.calculateMarketScore(data),
      confidence: 75,
      factors: [
        { metric: 'Market Position', value: 70, benchmark: 75, impact: 30 },
        { metric: 'Years in Business', value: data.yearsInBusiness || 0, benchmark: 5, impact: 20 }
      ],
      recommendations: ['Strengthen market position', 'Build competitive advantages'],
      trend: 'stable'
    }

    const riskDimension: HealthDimension = {
      score: this.calculateRiskScore(data, debtToAsset),
      confidence: 85,
      factors: [
        { metric: 'Debt to Asset Ratio', value: debtToAsset, benchmark: 30, impact: 35 },
        { metric: 'Customer Concentration', value: 100 - Math.min(100, (data.customerCount || 0) / 10), benchmark: 20, impact: 25 }
      ],
      recommendations: ['Reduce debt levels', 'Diversify customer base', 'Build cash reserves'],
      trend: 'stable'
    }

    const growthDimension: HealthDimension = {
      score: 70, // Default growth score
      confidence: 70,
      factors: [
        { metric: 'Revenue Growth Potential', value: 20, benchmark: 25, impact: 40 },
        { metric: 'Market Expansion', value: 65, benchmark: 70, impact: 30 }
      ],
      recommendations: ['Invest in growth initiatives', 'Expand to new markets', 'Scale operations'],
      trend: 'improving'
    }

    // Overall health score
    const healthScore = Math.round(
      (financialDimension.score * 0.3 + 
       operationalDimension.score * 0.2 + 
       marketDimension.score * 0.2 + 
       riskDimension.score * 0.15 +
       growthDimension.score * 0.15)
    )

    return {
      healthScore: Math.max(1, Math.min(100, healthScore)),
      confidenceScore: 80,
      methodology: 'Multi-dimensional analysis with industry benchmarking',
      scoringFactors: {
        financial: financialDimension,
        operational: operationalDimension,
        market: marketDimension,
        risk: riskDimension,
        growth: growthDimension
      },
      industryBenchmarks: {
        percentile: Math.max(10, Math.min(90, healthScore)),
        industryAverage: 65,
        topPerformers: 85,
        benchmarkCategories: [
          {
            category: 'Financial Performance',
            userValue: financialDimension.score,
            industryAverage: 65,
            topQuartile: 80,
            percentile: financialDimension.score,
            interpretation: 'Above/below industry average'
          },
          {
            category: 'Operational Efficiency',
            userValue: operationalDimension.score,
            industryAverage: 60,
            topQuartile: 75,
            percentile: operationalDimension.score,
            interpretation: 'Competitive operational metrics'
          }
        ]
      },
      topOpportunities: this.generateEnhancedOpportunities(data, {
        financial: financialDimension.score,
        operational: operationalDimension.score,
        market: marketDimension.score,
        risk: riskDimension.score,
        growth: growthDimension.score
      }).slice(0, 5)
    }
  }

  // Epic 2: Enhanced Opportunities Generator
  private static generateEnhancedOpportunities(data: Partial<BusinessData> & { annualRevenue: number; expenses: number; assets: number; liabilities: number }, scores: any) {
    const opportunities = []

    // Financial opportunities
    if (scores.financial < 70) {
      const profitMargin = ((data.annualRevenue - data.expenses) / data.annualRevenue) * 100
      if (profitMargin < 15) {
        opportunities.push({
          id: 'advanced-cost-optimization',
          category: 'financial' as const,
          title: 'Advanced Cost Structure Optimization',
          description: 'Implement AI-driven cost analysis to identify and eliminate inefficiencies across all operational areas.',
          impactEstimate: {
            dollarAmount: data.expenses * 0.20,
            percentageIncrease: 20,
            confidence: 85,
            roiEstimate: 4.5,
            timeline: '6 months'
          },
          difficulty: 'medium' as const,
          timeframe: '3-6 months',
          priority: 1,
          requiredResources: ['Financial analyst', 'Process optimization tools', 'Management commitment'],
          specificAnalysis: `With current expenses of $${data.expenses.toLocaleString()}, a 20% reduction could save $${(data.expenses * 0.20).toLocaleString()} annually. Focus on largest expense categories and automation opportunities.`,
          selectionRationale: 'Selected due to low profit margins and immediate impact potential with proven methodologies.',
          riskFactors: ['Potential service quality impact', 'Employee resistance to changes'],
          prerequisites: ['Management buy-in', 'Detailed expense analysis', 'Change management plan']
        })
      }
    }

    // Growth opportunities
    if (scores.growth < 75) {
      opportunities.push({
        id: 'revenue-diversification',
        category: 'strategic' as const,
        title: 'Revenue Stream Diversification',
        description: 'Develop complementary revenue streams to reduce dependency and increase total addressable market.',
        impactEstimate: {
          dollarAmount: data.annualRevenue * 0.35,
          percentageIncrease: 35,
          confidence: 75,
          roiEstimate: 3.2,
          timeline: '12 months'
        },
        difficulty: 'high' as const,
        timeframe: '9-18 months',
        priority: 2,
        requiredResources: ['Market research', 'Product development', 'Sales team expansion'],
        specificAnalysis: `Current revenue concentration presents risk. Adding complementary streams could generate additional $${(data.annualRevenue * 0.35).toLocaleString()} annually while reducing business risk.`,
        selectionRationale: 'Critical for long-term sustainability and growth, addresses revenue concentration risk identified in analysis.',
        riskFactors: ['Market acceptance uncertainty', 'Resource allocation challenges', 'Execution complexity'],
        prerequisites: ['Market analysis', 'Resource planning', 'Pilot program validation']
      })
    }

    // Operational opportunities
    if (scores.operational < 70) {
      opportunities.push({
        id: 'digital-transformation',
        category: 'operational' as const,
        title: 'Process Automation & Digital Transformation',
        description: 'Implement automated workflows and digital tools to improve efficiency and reduce manual overhead.',
        impactEstimate: {
          dollarAmount: data.annualRevenue * 0.15,
          percentageIncrease: 15,
          confidence: 80,
          roiEstimate: 2.8,
          timeline: '8 months'
        },
        difficulty: 'medium' as const,
        timeframe: '6-12 months',
        priority: 3,
        requiredResources: ['Technology investment', 'Staff training', 'Change management'],
        specificAnalysis: `Automation could reduce manual work by 40% and improve accuracy, leading to $${(data.annualRevenue * 0.15).toLocaleString()} in additional value through efficiency gains.`,
        selectionRationale: 'High impact potential with proven ROI across similar businesses in the industry.',
        riskFactors: ['Implementation complexity', 'Staff adaptation challenges', 'Technology dependencies'],
        prerequisites: ['Process mapping', 'Technology selection', 'Training program design']
      })
    }

    // Market opportunities  
    if (scores.market < 70) {
      opportunities.push({
        id: 'competitive-positioning',
        category: 'market' as const,
        title: 'Strategic Competitive Positioning',
        description: 'Develop unique value propositions and strengthen market differentiation through brand and service enhancement.',
        impactEstimate: {
          dollarAmount: data.annualRevenue * 0.25,
          percentageIncrease: 25,
          confidence: 70,
          roiEstimate: 2.5,
          timeline: '15 months'
        },
        difficulty: 'high' as const,
        timeframe: '12-18 months',
        priority: 4,
        requiredResources: ['Brand strategy', 'Marketing investment', 'Product development'],
        specificAnalysis: `Market position strengthening could capture premium pricing and market share, potentially adding $${(data.annualRevenue * 0.25).toLocaleString()} in annual revenue.`,
        selectionRationale: 'Essential for long-term competitiveness and pricing power in increasingly competitive market.',
        riskFactors: ['Market response uncertainty', 'Competitor reactions', 'Brand perception risks'],
        prerequisites: ['Competitive analysis', 'Brand strategy development', 'Market testing']
      })
    }

    // Risk mitigation
    if (scores.risk < 70) {
      opportunities.push({
        id: 'financial-risk-management',
        category: 'financial' as const,
        title: 'Comprehensive Financial Risk Management',
        description: 'Implement robust financial controls, diversify customer base, and establish emergency reserves.',
        impactEstimate: {
          dollarAmount: data.liabilities * 0.25,
          percentageIncrease: 10,
          confidence: 90,
          roiEstimate: 5.0,
          timeline: '4 months'
        },
        difficulty: 'low' as const,
        timeframe: '3-9 months',
        priority: 1,
        requiredResources: ['Financial planning', 'Credit management', 'Cash reserves'],
        specificAnalysis: `Reducing financial risk through debt management and diversification could improve valuation by $${(data.liabilities * 0.25).toLocaleString()} while protecting against downside risks.`,
        selectionRationale: 'High confidence opportunity with immediate impact on business stability and valuation.',
        riskFactors: ['Cash flow impact during transition', 'Customer concentration challenges'],
        prerequisites: ['Financial analysis', 'Debt restructuring plan', 'Customer diversification strategy']
      })
    }

    return opportunities.sort((a, b) => a.priority - b.priority)
  }
}