import { AnalyticsService } from '@/lib/services/AnalyticsService'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const timeframe = searchParams.get('timeframe') // in months

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    const timeframeMonths = timeframe ? parseInt(timeframe) : 6
    if (timeframeMonths < 1 || timeframeMonths > 12) {
      return NextResponse.json(
        { error: 'Timeframe must be between 1 and 12 months' },
        { status: 400 }
      )
    }

    const predictions = await AnalyticsService.generatePredictions(userId, timeframeMonths)

    return NextResponse.json({
      success: true,
      predictions,
      timeframe: timeframeMonths
    })
  } catch (error) {
    console.error('Error generating predictions:', error)
    
    return NextResponse.json(
      { 
        error: 'Failed to generate predictions',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}