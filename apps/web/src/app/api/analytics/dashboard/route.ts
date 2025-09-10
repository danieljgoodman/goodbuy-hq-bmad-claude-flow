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

    const dashboardData = await AnalyticsService.getAnalyticsDashboardData(userId)

    return NextResponse.json({
      success: true,
      ...dashboardData
    })
  } catch (error) {
    console.error('Error getting analytics dashboard data:', error)
    
    return NextResponse.json(
      { 
        error: 'Failed to get analytics dashboard data',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}