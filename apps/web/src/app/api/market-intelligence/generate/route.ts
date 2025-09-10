import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { MarketIntelligenceService } from '@/lib/services/MarketIntelligenceService'
import { z } from 'zod'

const GenerateRequestSchema = z.object({
  industry: z.string().min(1).max(100),
  sector: z.string().min(1).max(100),
  businessData: z.object({
    annualRevenue: z.number().min(0).max(1000000000),
    yearsInBusiness: z.number().min(0).max(200),
    employeeCount: z.number().min(1).max(1000000),
    marketPosition: z.string().min(1).max(100)
  }).optional()
})

export async function POST(request: NextRequest) {
  try {
    // Authentication check
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    
    // Input validation
    const validationResult = GenerateRequestSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: validationResult.error.issues },
        { status: 400 }
      )
    }

    const { industry, sector, businessData } = validationResult.data
    const userId = session.user.id

    const marketIntelligenceService = new MarketIntelligenceService()
    
    const request_data = {
      industry,
      sector,
      businessData: {
        annualRevenue: businessData.annualRevenue || 500000,
        yearsInBusiness: businessData.yearsInBusiness || 5,
        employeeCount: businessData.employeeCount || 10,
        marketPosition: businessData.marketPosition || 'Growing Player'
      }
    }

    const intelligence = await marketIntelligenceService.generateMarketIntelligence(
      userId,
      request_data
    )

    return NextResponse.json(intelligence)
  } catch (error) {
    console.error('Market intelligence generation error:', error)
    return NextResponse.json(
      { error: 'Failed to generate market intelligence' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    // Authentication check
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const userId = session.user.id

    const marketIntelligenceService = new MarketIntelligenceService()
    const intelligence = await marketIntelligenceService.getMarketIntelligenceForUser(userId)

    return NextResponse.json(intelligence)
  } catch (error) {
    console.error('Market intelligence fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch market intelligence' },
      { status: 500 }
    )
  }
}