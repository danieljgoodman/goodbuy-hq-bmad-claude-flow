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
    
    // In development, provide mock data when database fails
    if (process.env.NODE_ENV === 'development') {
      console.log('🧪 Development mode: Providing mock analytics dashboard data due to database error')
      const mockData = {
        trends: {
          businessValuation: {
            current: 1250000,
            previous: 1100000,
            change: 150000,
            changePercent: 13.6,
            trend: 'increasing'
          },
          revenue: {
            current: 500000,
            previous: 450000,
            change: 50000,
            changePercent: 11.1,
            trend: 'increasing'
          }
        },
        predictions: Array.from({ length: 6 }, (_, i) => ({
          month: new Date(Date.now() + i * 30 * 24 * 60 * 60 * 1000),
          predictedValue: 1250000 + i * 45000,
          confidence: 0.8 - (i * 0.05)
        })),
        seasonality: {
          patterns: ['Q2 shows strongest growth', 'Q4 recovery trends'],
          strength: 0.7
        },
        modelPerformance: {
          accuracy: 0.87,
          meanAbsoluteError: 50000,
          lastUpdated: new Date()
        }
      }
      
      return NextResponse.json({
        success: true,
        ...mockData,
        isDemoData: true
      })
    }
    
    return NextResponse.json(
      { 
        error: 'Failed to get analytics dashboard data',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}