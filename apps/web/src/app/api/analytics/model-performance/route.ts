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

    const modelPerformance = await AnalyticsService.getModelPerformance(userId)

    return NextResponse.json({
      success: true,
      modelPerformance
    })
  } catch (error) {
    console.error('Error getting model performance:', error)
    
    return NextResponse.json(
      { 
        error: 'Failed to get model performance',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}