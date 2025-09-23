// Real Claude API integration - NO FALLBACKS
// Uses server-side API endpoint to protect API key

// Server-side function that directly calls Anthropic API
async function callClaudeAPIServer(
  prompt: string,
  businessData: any,
  requestType: 'multi-methodology-valuation' | 'enhanced-health-analysis' | 'basic-health-analysis' | 'executive-summary'
): Promise<string> {
  const apiKey = process.env.CLAUDE_API_KEY
  if (!apiKey) {
    throw new Error('Claude API key not configured')
  }

  // Build the system message and user message based on request type
  let systemMessage = "You are an AI business analyst assistant providing professional analysis."
  let userMessage = prompt

  if (businessData) {
    userMessage = `${prompt}\n\nBusiness Data: ${JSON.stringify(businessData, null, 2)}`
  }

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-3-haiku-20240307',
      max_tokens: 4000,
      temperature: 0.2,
      system: systemMessage,
      messages: [
        {
          role: 'user',
          content: userMessage
        }
      ]
    })
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Anthropic API request failed: ${response.statusText} - ${errorText}`)
  }

  const result = await response.json()

  if (result.content && result.content[0] && result.content[0].text) {
    return result.content[0].text
  }

  throw new Error('Unexpected response format from Anthropic API')
}

export async function callClaudeAPI(prompt: string, businessData?: any): Promise<string> {
  try {
    // Determine the request type based on the prompt content
    let requestType: 'multi-methodology-valuation' | 'enhanced-health-analysis' | 'basic-health-analysis' | 'executive-summary' = 'basic-health-analysis'

    if (prompt.includes('valuation')) {
      requestType = 'multi-methodology-valuation'
    } else if (prompt.includes('enhanced') || prompt.includes('comprehensive')) {
      requestType = 'enhanced-health-analysis'
    } else if (prompt.includes('executive') || prompt.includes('summary')) {
      requestType = 'executive-summary'
    }

    // Check if we're running on the server side
    const isServer = typeof window === 'undefined'

    // For server-side calls, use direct Anthropic API
    if (isServer) {
      return await callClaudeAPIServer(prompt, businessData, requestType)
    }

    // For client-side calls, use the API endpoint
    const response = await fetch('/api/claude', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: requestType,
        businessData,
        summaryContext: prompt
      })
    })

    if (!response.ok) {
      throw new Error(`API request failed: ${response.statusText}`)
    }

    const result = await response.json()

    if (result.success && result.analysisText) {
      return result.analysisText
    }

    throw new Error(result.error || 'Unexpected response format from API')
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