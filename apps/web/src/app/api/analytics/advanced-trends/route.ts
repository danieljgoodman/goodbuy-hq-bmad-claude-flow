import { AnalyticsService } from '@/lib/services/AnalyticsService'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    const timeRange = startDate && endDate ? {
      start: new Date(startDate),
      end: new Date(endDate)
    } : undefined

    const advancedTrends = await AnalyticsService.getAdvancedTrends(userId, timeRange)

    return NextResponse.json({
      success: true,
      advancedTrends
    })
  } catch (error) {
    console.error('Error getting advanced trends:', error)
    
    return NextResponse.json(
      { 
        error: 'Failed to get advanced trends',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}