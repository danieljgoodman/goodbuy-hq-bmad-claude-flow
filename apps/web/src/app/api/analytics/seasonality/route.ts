import { AnalyticsService } from '@/lib/services/AnalyticsService'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    const seasonality = await AnalyticsService.getSeasonalityAnalysis(userId)

    return NextResponse.json({
      success: true,
      seasonality,
      hasSufficientData: seasonality.length > 0
    })
  } catch (error) {
    console.error('Error analyzing seasonality:', error)
    
    // If it's insufficient data, return empty result instead of error
    if (error instanceof Error && error.message.includes('Minimum')) {
      return NextResponse.json({
        success: true,
        seasonality: [],
        hasSufficientData: false,
        message: error.message
      })
    }
    
    return NextResponse.json(
      { 
        error: 'Failed to analyze seasonality',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}