import { NextRequest, NextResponse } from 'next/server'
import { config } from '@/lib/config'

interface ClaudeRequest {
  type: 'multi-methodology-valuation' | 'enhanced-health-analysis' | 'basic-health-analysis' | 'document-extraction' | 'executive-summary'
  businessData?: any
  documentContent?: string
  fileType?: 'pdf' | 'excel' | 'image'
  summaryContext?: string
}

const CLAUDE_BASE_URL = 'https://api.anthropic.com/v1'
const CLAUDE_HEADERS = {
  'Content-Type': 'application/json',
  'x-api-key': config.claude.apiKey,
  'anthropic-version': '2023-06-01',
}

export async function POST(req: NextRequest) {
  try {
    const body: ClaudeRequest = await req.json()
    const { type, businessData, documentContent, fileType, summaryContext } = body

    let prompt = ''
    let maxTokens = 3000

    // Generate appropriate prompt based on request type
    switch (type) {
      case 'multi-methodology-valuation':
        prompt = createValuationPrompt(businessData)
        maxTokens = 3000
        break
      case 'enhanced-health-analysis':
        prompt = createEnhancedAnalysisPrompt(businessData)
        maxTokens = 4000
        break
      case 'basic-health-analysis':
        prompt = createAnalysisPrompt(businessData)
        maxTokens = 2000
        break
      case 'document-extraction':
        prompt = createDocumentExtractionPrompt(documentContent || '', fileType || 'pdf')
        maxTokens = 3000
        break
      case 'executive-summary':
        prompt = summaryContext || createExecutiveSummaryPrompt(businessData)
        maxTokens = 3500
        break
      default:
        return NextResponse.json({ error: 'Invalid request type' }, { status: 400 })
    }

    // Make request to Claude API
    const response = await fetch(`${CLAUDE_BASE_URL}/messages`, {
      method: 'POST',
      headers: CLAUDE_HEADERS,
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022', // Latest available model
        max_tokens: maxTokens,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ]
      }),
    })

    if (!response.ok) {
      console.error('Claude API error:', response.statusText)
      return NextResponse.json({ error: `Claude API error: ${response.statusText}` }, { status: response.status })
    }

    const result = await response.json()
    const analysisText = result.content[0].text

    return NextResponse.json({
      success: true,
      analysisText,
      type
    })

  } catch (error) {
    console.error('Claude API proxy error:', error)
    return NextResponse.json({ 
      error: 'Internal server error', 
      fallback: true 
    }, { status: 500 })
  }
}

// Prompt generation functions (copied from ClaudeService)
function createValuationPrompt(data: any): string {
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

function createEnhancedAnalysisPrompt(data: any): string {
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

function createAnalysisPrompt(data: any): string {
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

function createDocumentExtractionPrompt(documentContent: string, fileType: 'pdf' | 'excel' | 'image'): string {
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

function createExecutiveSummaryPrompt(data: any): string {
  return `
You are an executive business analyst. Generate a comprehensive executive summary for this business report:

Business Information:
- Type: ${data.businessType || 'Not provided'}
- Industry: ${data.industryFocus || 'Not provided'}
- Annual Revenue: $${data.annualRevenue?.toLocaleString() || 'Not provided'}
- Net Profit: $${((data.annualRevenue || 0) - (data.expenses || 0)).toLocaleString() || 'Not provided'}
- Assets: $${data.assets?.toLocaleString() || 'Not provided'}
- Liabilities: $${data.liabilities?.toLocaleString() || 'Not provided'}
- Customers: ${(data.customerCount || 0).toLocaleString()}
- Employees: ${(data.employeeCount || 0).toLocaleString()}

Please provide a structured executive summary with:

1. Key Insights (3-5 bullet points about business performance):
   - Financial performance highlights
   - Operational strengths
   - Market position insights
   - Notable achievements or concerns

2. Strategic Recommendations (3-5 actionable recommendations):
   - Priority improvement areas
   - Growth opportunities
   - Risk mitigation strategies
   - Operational optimizations

3. Business Highlights (3-4 positive aspects to emphasize):
   - Competitive advantages
   - Strong performance areas
   - Growth metrics
   - Success stories

4. Risk Factors (3-4 potential concerns or challenges):
   - Financial risks
   - Operational challenges
   - Market threats
   - Regulatory concerns

5. Next Steps (3-4 immediate actions to take):
   - Short-term priorities
   - Resource allocation needs
   - Implementation timelines
   - Success metrics to track

Format your response as structured text with clear section headers and bullet points.
`
}