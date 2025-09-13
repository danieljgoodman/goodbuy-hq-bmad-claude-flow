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
  }

  const analysisText = await callClaudeAPI(fullPrompt, businessData)
  
  return {
    analysisText,
    fallback: false // This is real API data, not a fallback
  }
}