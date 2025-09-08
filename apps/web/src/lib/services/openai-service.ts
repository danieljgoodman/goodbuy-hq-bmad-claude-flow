import { config } from '@/lib/config'
import type { ExtractedFinancialData } from '@/types'

export class OpenAIService {
  private static readonly baseUrl = 'https://api.openai.com/v1'
  private static readonly timeout = 30000 // 30 second timeout

  static async extractFinancialData(
    documentContent: string, 
    fileType: 'pdf' | 'excel' | 'image',
    fileBuffer?: ArrayBuffer
  ): Promise<ExtractedFinancialData> {
    // Check if API key is configured
    if (!config.openai.apiKey || config.openai.apiKey === 'placeholder-openai-api-key') {
      throw new Error('OpenAI API key not configured. Please set OPENAI_API_KEY environment variable.')
    }

    // Note: We now always use text extraction first, not Vision API for PDFs

    const prompt = this.createDocumentExtractionPrompt(documentContent, fileType)
    
    try {
      // Create timeout promise
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('API timeout')), this.timeout)
      )

      // Create API call promise
      const apiPromise = fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${config.openai.apiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: 'You are a financial document analysis expert. Extract financial data accurately and provide confidence scores.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          max_tokens: 800,
          temperature: 0.3
        })
      })

      // Race between API call and timeout
      const response = await Promise.race([apiPromise, timeoutPromise]) as Response

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`OpenAI API error (${response.status}): ${response.statusText}. ${errorText}`)
      }

      const result = await response.json()
      
      console.log('🤖 OpenAI API Response Received:')
      console.log('  - Status:', response.status)
      console.log('  - Has choices:', !!result.choices)
      console.log('  - Choices length:', result.choices?.length || 0)
      console.log('  - Usage tokens:', result.usage)
      
      if (!result.choices || !result.choices[0] || !result.choices[0].message) {
        console.error('❌ Invalid OpenAI response structure:', result)
        throw new Error('Invalid response format from OpenAI API')
      }
      
      const analysisText = result.choices[0].message.content
      console.log('📝 OpenAI Raw Response:')
      console.log('  - Response length:', analysisText?.length || 0)
      console.log('  - Response preview:', analysisText?.substring(0, 500) || 'No content')
      
      const parsedResult = this.parseDocumentExtractionResponse(analysisText, documentContent, fileType)
      console.log('⚙️ Parsed Result:')
      console.log('  - Revenue extracted:', parsedResult.revenue.value)
      console.log('  - Expenses extracted:', parsedResult.expenses.value)
      console.log('  - Assets extracted:', parsedResult.balanceSheet.assets)
      console.log('  - Overall confidence:', parsedResult.confidence)
      
      return parsedResult
    } catch (error) {
      console.error('OpenAI document extraction error:', error)
      
      // Handle specific quota exceeded error
      if (error instanceof Error && error.message.includes('insufficient_quota')) {
        throw new Error(`OpenAI API quota exceeded. Please add funds to your OpenAI account at https://platform.openai.com/account/billing to continue processing documents.`)
      }
      
      // Handle rate limiting
      if (error instanceof Error && error.message.includes('Too Many Requests')) {
        throw new Error(`OpenAI API rate limit exceeded. Please wait a few minutes and try again, or add funds to increase your rate limits.`)
      }
      
      // Handle timeout
      if (error instanceof Error && error.message.includes('API timeout')) {
        throw new Error(`Document processing timed out. This may be due to a large document or API delays. Please try again.`)
      }
      
      // Re-throw the error - no mock fallback for production
      throw new Error(`Document processing failed: ${error instanceof Error ? error.message : 'OpenAI API error'}`)
    }
  }

  private static createDocumentExtractionPrompt(documentContent: string, fileType: 'pdf' | 'excel' | 'image'): string {
    console.log('🔍 OpenAI Processing:', fileType, 'document')
    console.log('📄 Content length:', documentContent.length)
    if (documentContent.length > 100) {
      console.log('📄 Content preview:', documentContent.substring(0, 200) + '...')
    }
    
    return `
You are a financial document analysis expert. Analyze this ${fileType} document and extract key financial data with high precision.

IMPORTANT EXTRACTION RULES:
1. Look for standard financial statement terms: "Total Revenue", "Net Income", "Total Assets", "Total Liabilities", "Cash Flow", "Operating Expenses"
2. Extract actual dollar amounts - look for numbers with $ signs or numbers in financial contexts
3. For Income Statements: focus on Revenue, Expenses, Net Income
4. For Balance Sheets: focus on Total Assets, Total Liabilities  
5. For Cash Flow Statements: focus on Net Cash from Operations, Ending Cash Balance
6. If you find clear financial numbers, use high confidence scores (80-95)

Document Content:
${documentContent.substring(0, 2500)}

Extract and return ONLY valid JSON (no markdown formatting):
{
  "revenue": {
    "value": <annual revenue number - look for "Total Revenue", "Revenue", "Net Revenue">,
    "confidence": <1-100 confidence score>,
    "breakdown": [],
    "timeFrame": "annual"
  },
  "expenses": {
    "value": <total operating expenses - look for "Total Operating Expenses", "Total Expenses", "Operating Expenses">,
    "confidence": <1-100 confidence score>,
    "breakdown": []
  },
  "cashFlow": {
    "value": <net cash flow - look for "Net Cash from Operations", "Cash Flow", "Net Change in Cash">,
    "confidence": <1-100 confidence score>,
    "breakdown": []
  },
  "balanceSheet": {
    "assets": <total assets - look for "Total Assets">,
    "liabilities": <total liabilities - look for "Total Liabilities">,
    "confidence": <1-100 confidence score>
  },
  "confidence": <overall confidence 1-100>,
  "inconsistencies": [],
  "missingData": [],
  "dataQualityFlags": ["Extracted from ${fileType} document", "OpenAI-powered extraction"]
}

CRITICAL: Return raw JSON only, no markdown code blocks or explanations.
`
  }

  private static parseDocumentExtractionResponse(
    analysisText: string, 
    documentContent: string, 
    fileType: 'pdf' | 'excel' | 'image'
  ): ExtractedFinancialData {
    try {
      // Try to parse JSON from the response
      const jsonMatch = analysisText.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        const parsedData = JSON.parse(jsonMatch[0])
        
        // Check if OpenAI found meaningful data
        const hasRealData = parsedData.revenue?.value > 0 || 
                           parsedData.expenses?.value > 0 || 
                           parsedData.balanceSheet?.assets > 0 ||
                           parsedData.cashFlow?.value !== 0
        
        console.log('🔍 OpenAI Data Analysis:')
        console.log('  - Revenue found:', parsedData.revenue?.value)
        console.log('  - Expenses found:', parsedData.expenses?.value)  
        console.log('  - Assets found:', parsedData.balanceSheet?.assets)
        console.log('  - Has real financial data:', hasRealData)
        
        // If OpenAI returns null/0 values, it means no financial data was found
        if (!hasRealData) {
          console.log('⚠️ OpenAI found no meaningful financial data in this document')
          console.log('   - This could mean: empty document, non-financial content, or processing error')
          
          // Return the actual extracted data (including nulls) for transparency
          return {
            source: fileType as 'pdf' | 'excel' | 'image' | 'manual',
            extractionDate: new Date(),
            confidence: parsedData.confidence || 0,
            revenue: { 
              value: parsedData.revenue?.value || 0, 
              confidence: parsedData.revenue?.confidence || 0, 
              source: parsedData.revenue?.value > 0 ? `${fileType}_openai_extraction` : 'not_found'
            },
            expenses: { 
              value: parsedData.expenses?.value || 0, 
              confidence: parsedData.expenses?.confidence || 0, 
              breakdown: parsedData.expenses?.breakdown || [],
              source: parsedData.expenses?.value > 0 ? `${fileType}_openai_extraction` : 'not_found'
            },
            cashFlow: { 
              value: parsedData.cashFlow?.value || 0, 
              confidence: parsedData.cashFlow?.confidence || 0, 
              source: parsedData.cashFlow?.value !== 0 ? `${fileType}_openai_extraction` : 'not_found'
            },
            balanceSheet: { 
              assets: parsedData.balanceSheet?.assets || 0, 
              liabilities: parsedData.balanceSheet?.liabilities || 0, 
              confidence: parsedData.balanceSheet?.confidence || 0,
              source: (parsedData.balanceSheet?.assets > 0 || parsedData.balanceSheet?.liabilities > 0) ? `${fileType}_openai_extraction` : 'not_found'
            },
            inconsistencies: parsedData.inconsistencies || [],
            missingData: parsedData.missingData || ['Financial data not detected'],
            dataQualityFlags: [`Processed ${fileType} document`, 'OpenAI extraction - no data found']
          }
        }
        
        // Convert to our expected format (only when real data found)
        const overallConfidence = Math.round((
          (parsedData.revenue?.confidence || 60) +
          (parsedData.expenses?.confidence || 60) +
          (parsedData.cashFlow?.confidence || 60) +
          (parsedData.balanceSheet?.confidence || 60)
        ) / 4);
        
        return {
          source: fileType as 'pdf' | 'excel' | 'image' | 'manual',
          extractionDate: new Date(),
          confidence: overallConfidence,
          revenue: {
            value: parsedData.revenue?.value || 0,
            confidence: parsedData.revenue?.confidence || 60,
            source: parsedData.revenue?.value > 0 ? `${fileType}_openai_extraction` : 'not_found'
          },
          expenses: {
            value: parsedData.expenses?.value || 0,
            confidence: parsedData.expenses?.confidence || 60,
            breakdown: parsedData.expenses?.breakdown || [],
            source: parsedData.expenses?.value > 0 ? `${fileType}_openai_extraction` : 'not_found'
          },
          cashFlow: {
            value: parsedData.cashFlow?.value || 0,
            confidence: parsedData.cashFlow?.confidence || 60,
            source: parsedData.cashFlow?.value !== 0 ? `${fileType}_openai_extraction` : 'not_found'
          },
          balanceSheet: {
            assets: parsedData.balanceSheet?.assets || 0,
            liabilities: parsedData.balanceSheet?.liabilities || 0,
            confidence: parsedData.balanceSheet?.confidence || 60,
            source: (parsedData.balanceSheet?.assets > 0 || parsedData.balanceSheet?.liabilities > 0) ? `${fileType}_openai_extraction` : 'not_found'
          },
          inconsistencies: parsedData.inconsistencies || [],
          missingData: parsedData.missingData || [],
          dataQualityFlags: [
            `Extracted from ${fileType} document`,
            'OpenAI-powered extraction',
            ...(parsedData.dataQualityFlags || [])
          ]
        }
      }
    } catch (error) {
      console.error('Failed to parse OpenAI response:', error)
      throw new Error(`Failed to parse AI response: ${error instanceof Error ? error.message : 'Invalid response format'}`)
    }

    // If we reach here, parsing failed completely
    throw new Error('OpenAI returned invalid response format')
  }

  // New method: Extract financial data using GPT-4o Vision for PDFs
  static async extractFinancialDataWithVision(
    fileBuffer: ArrayBuffer,
    fileType: 'pdf' | 'image'
  ): Promise<ExtractedFinancialData> {
    try {
      // Convert PDF/image to base64
      const base64Data = Buffer.from(fileBuffer).toString('base64')
      const mimeType = fileType === 'pdf' ? 'application/pdf' : 'image/png'
      
      console.log('🔍 GPT-4o Vision request:')
      console.log('  - File type:', fileType)
      console.log('  - Buffer size:', fileBuffer.byteLength, 'bytes')
      console.log('  - Base64 length:', base64Data.length)
      
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${config.openai.apiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-4o',
          messages: [
            {
              role: 'system',
              content: 'You are a financial document analysis expert. Extract financial data accurately from the document and provide confidence scores. Always return valid JSON.'
            },
            {
              role: 'user',
              content: [
                {
                  type: 'text',
                  text: this.createVisionExtractionPrompt(fileType)
                },
                {
                  type: 'image_url',
                  image_url: {
                    url: `data:${mimeType};base64,${base64Data}`,
                    detail: 'high'
                  }
                }
              ]
            }
          ],
          max_tokens: 1000,
          temperature: 0.1
        })
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`OpenAI Vision API error (${response.status}): ${response.statusText}. ${errorText}`)
      }

      const result = await response.json()
      
      console.log('🤖 GPT-4o Vision Response:')
      console.log('  - Status:', response.status)
      console.log('  - Usage tokens:', result.usage)
      
      if (!result.choices || !result.choices[0] || !result.choices[0].message) {
        throw new Error('Invalid response format from OpenAI Vision API')
      }
      
      const analysisText = result.choices[0].message.content
      console.log('📝 Vision Raw Response:')
      console.log('  - Response length:', analysisText?.length || 0)
      console.log('  - Response preview:', analysisText?.substring(0, 500) || 'No content')
      
      return this.parseDocumentExtractionResponse(analysisText, '', fileType)
      
    } catch (error) {
      console.error('OpenAI Vision extraction error:', error)
      throw new Error(`Vision-based document processing failed: ${error instanceof Error ? error.message : 'Vision API error'}`)
    }
  }

  private static createVisionExtractionPrompt(fileType: 'pdf' | 'image'): string {
    return `
Analyze this ${fileType} financial document and extract key financial data with high precision.

IMPORTANT EXTRACTION RULES:
1. Look for standard financial statement terms: "Revenue", "Total Revenue", "Net Income", "Total Assets", "Total Liabilities", "Cash Flow", "Operating Expenses"
2. Extract actual dollar amounts - look for numbers with $ signs or numbers in financial contexts
3. For Income Statements: focus on Revenue, Expenses, Net Income
4. For Balance Sheets: focus on Total Assets, Total Liabilities  
5. For Cash Flow Statements: focus on Net Cash from Operations, Ending Cash Balance
6. If you find clear financial numbers, use high confidence scores (80-95)
7. Read all visible text carefully - don't just scan headers

Return ONLY valid JSON (no markdown formatting):
{
  "revenue": {
    "value": <annual revenue number>,
    "confidence": <1-100 confidence score>,
    "breakdown": [],
    "timeFrame": "annual"
  },
  "expenses": {
    "value": <total operating expenses>,
    "confidence": <1-100 confidence score>,
    "breakdown": []
  },
  "cashFlow": {
    "value": <net cash flow>,
    "confidence": <1-100 confidence score>,
    "breakdown": []
  },
  "balanceSheet": {
    "assets": <total assets>,
    "liabilities": <total liabilities>,
    "confidence": <1-100 confidence score>
  },
  "confidence": <overall confidence 1-100>,
  "inconsistencies": [],
  "missingData": [],
  "dataQualityFlags": ["Extracted from ${fileType} document", "GPT-4o Vision extraction"]
}

CRITICAL: Return raw JSON only, no markdown code blocks or explanations.
`
  }

  private static createMockExtractedData(documentContent: string, fileType: 'pdf' | 'excel' | 'image'): ExtractedFinancialData {
    // Extract any numbers from the document content for more realistic data
    const numbers = documentContent.match(/\$?[\d,]+/g)?.map(n => parseInt(n.replace(/[$,]/g, ''))) || []
    
    // Look for specific financial keywords and their associated numbers
    const revenueMatch = documentContent.match(/revenue:?\s*\$?([\d,]+)/i)
    const expenseMatch = documentContent.match(/expenses:?\s*\$?([\d,]+)/i)
    const profitMatch = documentContent.match(/profit:?\s*\$?([\d,]+)/i)
    const assetsMatch = documentContent.match(/assets:?\s*\$?([\d,]+)/i)
    const liabilitiesMatch = documentContent.match(/liabilities:?\s*\$?([\d,]+)/i)
    
    const revenue = revenueMatch ? parseInt(revenueMatch[1].replace(/,/g, '')) : (numbers.find(n => n > 50000) || 250000)
    const expenses = expenseMatch ? parseInt(expenseMatch[1].replace(/,/g, '')) : (revenue * 0.75)
    const assets = assetsMatch ? parseInt(assetsMatch[1].replace(/,/g, '')) : (revenue * 1.5)
    const liabilities = liabilitiesMatch ? parseInt(liabilitiesMatch[1].replace(/,/g, '')) : (assets * 0.4)
    const profit = profitMatch ? parseInt(profitMatch[1].replace(/,/g, '')) : (revenue - expenses)
    
    return {
      source: "pdf",
      extractionDate: new Date(),
      revenue: {
        value: revenue,
        confidence: 75,
        source: "AI Extraction",
        breakdown: [
          { category: 'Product Sales', amount: Math.round(revenue * 0.65), percentage: 65 },
          { category: 'Service Revenue', amount: Math.round(revenue * 0.35), percentage: 35 }
        ],
        timeFrame: 'annual'
      },
      expenses: {
        value: expenses,
        confidence: 78,
        source: "AI Extraction",
        breakdown: [
          { category: 'Salaries & Benefits', amount: Math.round(expenses * 0.45), percentage: 45 },
          { category: 'Operating Costs', amount: Math.round(expenses * 0.35), percentage: 35 },
          { category: 'Marketing & Sales', amount: Math.round(expenses * 0.20), percentage: 20 }
        ]
      },
      cashFlow: {
        value: profit,
        confidence: 72,
        source: "AI Extraction",
        breakdown: [
          { category: 'Operating', amount: Math.round(profit * 1.1), percentage: 110 },
          { category: 'Investing', amount: Math.round(-profit * 0.15), percentage: -15 },
          { category: 'Financing', amount: Math.round(profit * 0.05), percentage: 5 }
        ]
      },
      balanceSheet: {
        assets: assets,
        liabilities: liabilities,
        confidence: 70,
        source: "AI Extraction"
      },
      confidence: 74,
      inconsistencies: [],
      missingData: ['Quarterly breakdown', 'Cash flow details'],
      dataQualityFlags: [
        `Mock extraction from ${fileType} document`,
        'Fallback data - OpenAI API unavailable',
        'Enhanced with document content analysis'
      ]
    }
  }
}