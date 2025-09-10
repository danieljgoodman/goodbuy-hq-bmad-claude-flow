import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { FunnelAnalyzer } from '@/lib/services/FunnelAnalyzer'

const funnelAnalyzer = new FunnelAnalyzer()

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const funnel = searchParams.get('funnel')
    const startDate = searchParams.get('start_date')
    const endDate = searchParams.get('end_date')
    const action = searchParams.get('action')
    const segmentBy = searchParams.get('segment_by')

    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    const end = endDate ? new Date(endDate) : new Date()

    switch (action) {
      case 'analyze':
        if (!funnel) {
          return NextResponse.json(
            { error: 'Funnel parameter required' },
            { status: 400 }
          )
        }
        const analysis = await funnelAnalyzer.analyzeFunnel(funnel, start, end, segmentBy || undefined)
        return NextResponse.json({ analysis })

      case 'abandonment':
        if (!funnel) {
          return NextResponse.json(
            { error: 'Funnel parameter required' },
            { status: 400 }
          )
        }
        const abandonment = await funnelAnalyzer.getAbandonmentAnalysis(funnel, start, end)
        return NextResponse.json({ abandonment })

      case 'cohort':
        const cohortBy = searchParams.get('cohort_by') as 'registration' | 'subscription' || 'registration'
        const cohorts = await funnelAnalyzer.getCohortAnalysis(start, end, cohortBy)
        return NextResponse.json({ cohorts })

      case 'list':
        const funnelNames = funnelAnalyzer.getAllFunnelNames()
        return NextResponse.json({ funnels: funnelNames })

      default:
        const allFunnels = funnelAnalyzer.getAllFunnelNames()
        const analyses = await Promise.all(
          allFunnels.map(async (funnelName) => ({
            funnel_name: funnelName,
            ...(await funnelAnalyzer.analyzeFunnel(funnelName, start, end))
          }))
        )
        return NextResponse.json({ analyses })
    }

  } catch (error) {
    console.error('Failed to fetch funnel analytics:', error)
    return NextResponse.json(
      { error: 'Failed to fetch funnel analytics' },
      { status: 500 }
    )
  }
}