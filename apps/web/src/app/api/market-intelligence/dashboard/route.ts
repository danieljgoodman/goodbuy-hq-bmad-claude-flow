import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { MarketIntelligenceService } from '@/lib/services/MarketIntelligenceService'
import { MarketAlertRepository } from '@/lib/repositories/MarketAlertRepository'

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

    const searchParams = request.nextUrl.searchParams
    const userId = searchParams.get('userId') || session.user.id

    // Authorization check - users can only access their own data
    if (userId !== session.user.id) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      )
    }

    const marketIntelligenceService = new MarketIntelligenceService()
    const alertRepo = new MarketAlertRepository()

    // Fetch all market intelligence data for the user
    const [intelligence, alerts, alertsCount] = await Promise.all([
      marketIntelligenceService.getMarketIntelligenceForUser(userId),
      alertRepo.findByUserId(userId),
      alertRepo.getActiveAlertsCount(userId)
    ])

    // Generate dashboard summary
    const dashboardData = {
      intelligence,
      alerts: alerts.slice(0, 5), // Latest 5 alerts
      totalAlerts: alertsCount,
      summary: {
        totalIntelligenceReports: intelligence.length,
        averageGrowthRate: intelligence.length > 0 
          ? intelligence.reduce((sum, intel) => sum + intel.trendAnalysis.growth_rate, 0) / intelligence.length
          : 0,
        averagePositioningScore: intelligence.length > 0
          ? intelligence.reduce((sum, intel) => sum + intel.competitivePositioning.positioning_score, 0) / intelligence.length
          : 0,
        totalOpportunities: intelligence.reduce((sum, intel) => sum + intel.opportunities.length, 0),
        lastUpdated: intelligence.length > 0 
          ? Math.max(...intelligence.map(intel => intel.lastUpdated.getTime()))
          : null
      }
    }

    return NextResponse.json(dashboardData, {
      headers: {
        'Cache-Control': 'private, max-age=300', // 5 minutes cache
      }
    })
  } catch (error) {
    console.error('Market intelligence dashboard error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch dashboard data' },
      { status: 500 }
    )
  }
}