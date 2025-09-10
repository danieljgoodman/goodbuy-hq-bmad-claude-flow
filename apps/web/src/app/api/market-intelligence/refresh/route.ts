import { NextRequest, NextResponse } from 'next/server'
import { MarketIntelligenceService } from '@/lib/services/MarketIntelligenceService'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { intelligenceId } = body

    if (!intelligenceId) {
      return NextResponse.json(
        { error: 'Missing required field: intelligenceId' },
        { status: 400 }
      )
    }

    // For demo purposes, we'll simulate a refresh
    // In production, this would trigger a background job to refresh the specific intelligence record
    
    const marketIntelligenceService = new MarketIntelligenceService()
    const refreshedCount = await marketIntelligenceService.refreshStaleIntelligence()

    return NextResponse.json({ 
      success: true, 
      message: `Refreshed ${refreshedCount} intelligence records`,
      refreshedAt: new Date().toISOString()
    })
  } catch (error) {
    console.error('Market intelligence refresh error:', error)
    return NextResponse.json(
      { error: 'Failed to refresh market intelligence' },
      { status: 500 }
    )
  }
}