// Real Claude API integration - NO FALLBACKS
import Anthropic from '@anthropic-ai/sdk'

// Initialize Claude client with API key
const anthropic = new Anthropic({
  apiKey: process.env.CLAUDE_API_KEY || '',
})

export async function callClaudeAPI(prompt: string, businessData?: any): Promise<string> {
  if (!process.env.CLAUDE_API_KEY) {
    throw new Error('Claude API key not configured')
  }

  try {
    // Create a structured prompt with the business data
    const systemPrompt = `You are a professional business analyst and valuation expert. 
    Analyze the provided business data and generate insights based on actual metrics.
    Be specific, data-driven, and provide actionable recommendations.
    Use the actual numbers provided to calculate ratios, percentages, and trends.`

    const userPrompt = `${prompt}
    
    Business Data:
    ${JSON.stringify(businessData, null, 2)}`

    // Make the actual API call to Claude
    const response = await anthropic.messages.create({
      model: 'claude-3-haiku-20240307',
      max_tokens: 2000,
      temperature: 0.7,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: userPrompt
        }
      ]
    })

    // Extract the text from the response
    const content = response.content[0]
    if (content.type === 'text') {
      return content.text
    }

    throw new Error('Unexpected response format from Claude API')
  } catch (error: any) {
    console.error('Claude API call failed:', error)
    
    // Check for specific error types
    if (error?.status === 400 && error?.body?.includes('credit balance')) {
      throw new Error('Claude API credits exhausted. Please add credits to your Anthropic account.')
    }
    
    throw error // No fallbacks - propagate the error
  }
}

export async function handleClaudeRequest(body: any) {
  const { type, prompt, businessData } = body

  // Determine the appropriate prompt based on request type
  let fullPrompt = prompt || ''
  
  switch (type) {
    case 'enhanced-health-analysis':
      fullPrompt = `Provide a comprehensive health analysis of this business. Include:
      - Overall health assessment (strong/moderate/concerning)
      - Key financial metrics analysis
      - Profitability trends
      - Balance sheet strength
      - Cash flow assessment
      - Risk factors
      - Growth potential`
      break
    
    case 'multi-methodology-valuation':
      fullPrompt = `Calculate business valuation using multiple methodologies:
      - Asset-based valuation
      - Income/DCF valuation
      - Market comparables
      - Revenue multiples
      - EBITDA multiples
      Provide specific valuation ranges and explain the reasoning.`
      break
    
    case 'executive-summary':
      fullPrompt = `Generate an executive summary for this business including:
      - Financial snapshot with actual numbers
      - Performance analysis with specific metrics
      - Strategic recommendations based on the data
      - Value creation opportunities
      - Risk assessment
      Be specific and use the actual data provided.`
      break

    case 'trend-analysis':
      fullPrompt = `Analyze performance trends for this business:
      - Identify 3-5 key performance trends from the data
      - Statistical insights about business trajectory
      - Seasonal patterns or cyclical behavior
      - Predictive indicators for future performance
      - Data quality assessment with confidence scores
      Provide specific, quantitative analysis based on the metrics.`
      break

    case 'business-overview':
      fullPrompt = `Generate a comprehensive business overview:
      - Business profile and industry positioning
      - Financial performance summary with key ratios
      - Operational efficiency assessment
      - Market position and competitive advantages
      - Key strengths and value propositions
      Use specific numbers and metrics from the data.`
      break

    case 'improvement-analysis':
      fullPrompt = `Analyze business improvement opportunities:
      - Identify top 5-7 improvement areas based on data
      - Calculate potential ROI and value impact
      - Prioritize improvements by impact and feasibility
      - Implementation timeline and resource requirements
      - Progress metrics and success indicators
      Quantify improvement potential using business metrics.`
      break

    case 'chart-analysis':
      fullPrompt = `Analyze business data for key visualizations:
      - Identify most important metrics to visualize
      - Recommend chart types for different data patterns
      - Key insights visible in data trends
      - Comparative benchmarks and industry standards
      - Explanation of what each visualization reveals
      Focus on actionable insights from visual analysis.`
      break

    case 'strategic-recommendations':
      fullPrompt = `Generate strategic business recommendations:
      - Top 5-7 strategic recommendations based on data
      - Priority level and expected impact for each
      - Implementation difficulty and resource requirements
      - Expected timeline and measurable outcomes
      - Risk mitigation strategies
      Provide specific, actionable recommendations.`
      break
  }

  const analysisText = await callClaudeAPI(fullPrompt, businessData)

  return {
    analysisText,
    content: analysisText,
    text: analysisText,
    fallback: false
  }
}