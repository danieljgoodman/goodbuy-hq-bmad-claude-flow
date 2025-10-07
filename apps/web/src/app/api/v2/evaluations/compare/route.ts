import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const ids = searchParams.get('ids')?.split(',') || []
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    if (ids.length === 0) {
      return NextResponse.json(
        { error: 'At least one evaluation ID is required' },
        { status: 400 }
      )
    }

    if (ids.length > 10) {
      return NextResponse.json(
        { error: 'Cannot compare more than 10 evaluations at once' },
        { status: 400 }
      )
    }

    // Use existing supabase client

    const { data: evaluations, error } = await supabase
      .from('business_evaluations')
      .select('*')
      .eq('user_id', userId)
      .in('id', ids)
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch evaluations for comparison' },
        { status: 500 }
      )
    }

    if (!evaluations || evaluations.length === 0) {
      return NextResponse.json(
        { error: 'No evaluations found with the provided IDs' },
        { status: 404 }
      )
    }

    // Generate comparison analytics
    const comparison = generateComparisonAnalytics(evaluations)

    return NextResponse.json({
      evaluations,
      comparison,
      requestedIds: ids,
      foundCount: evaluations.length,
      generatedAt: new Date().toISOString()
    })

  } catch (error) {
    console.error('Comparison API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

function generateComparisonAnalytics(evaluations: any[]) {
  const completedEvaluations = evaluations.filter(e => e.status === 'completed')
  
  if (completedEvaluations.length === 0) {
    return {
      trends: {},
      improvements: [],
      regressions: [],
      summary: {
        totalEvaluations: evaluations.length,
        completedEvaluations: 0,
        averageHealthScore: 0,
        averageValuation: 0
      }
    }
  }

  // Sort by creation date for trend analysis
  const sortedEvaluations = [...completedEvaluations].sort((a, b) => 
    new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  )

  const trends = calculateTrends(sortedEvaluations)
  const improvements = identifyImprovements(sortedEvaluations)
  const regressions = identifyRegressions(sortedEvaluations)

  const totalHealthScore = completedEvaluations.reduce((sum, e) => sum + (e.health_score || 0), 0)
  const totalValuation = completedEvaluations.reduce((sum, e) => {
    const valuation = e.valuations?.weighted
    return sum + (typeof valuation === 'object' ? valuation.value || 0 : valuation || 0)
  }, 0)

  return {
    trends,
    improvements,
    regressions,
    summary: {
      totalEvaluations: evaluations.length,
      completedEvaluations: completedEvaluations.length,
      averageHealthScore: totalHealthScore / completedEvaluations.length,
      averageValuation: totalValuation / completedEvaluations.length,
      dateRange: {
        earliest: sortedEvaluations[0]?.created_at,
        latest: sortedEvaluations[sortedEvaluations.length - 1]?.created_at
      }
    }
  }
}

function calculateTrends(evaluations: any[]) {
  if (evaluations.length < 2) return {}

  const first = evaluations[0]
  const last = evaluations[evaluations.length - 1]

  const calculatePercentageChange = (oldVal: number, newVal: number) => {
    if (oldVal === 0) return newVal > 0 ? 100 : 0
    return ((newVal - oldVal) / oldVal) * 100
  }

  const getValuation = (evaluation: any) => {
    const valuation = evaluation.valuations?.weighted
    return typeof valuation === 'object' ? valuation.value || 0 : valuation || 0
  }

  return {
    healthScore: {
      change: calculatePercentageChange(
        first.health_score || 0,
        last.health_score || 0
      ),
      direction: (last.health_score || 0) >= (first.health_score || 0) ? 'up' : 'down',
      startValue: first.health_score || 0,
      endValue: last.health_score || 0
    },
    valuation: {
      change: calculatePercentageChange(
        getValuation(first),
        getValuation(last)
      ),
      direction: getValuation(last) >= getValuation(first) ? 'up' : 'down',
      startValue: getValuation(first),
      endValue: getValuation(last)
    },
    revenue: {
      change: calculatePercentageChange(
        first.business_data?.annual_revenue || 0,
        last.business_data?.annual_revenue || 0
      ),
      direction: (last.business_data?.annual_revenue || 0) >= (first.business_data?.annual_revenue || 0) ? 'up' : 'down',
      startValue: first.business_data?.annual_revenue || 0,
      endValue: last.business_data?.annual_revenue || 0
    }
  }
}

function identifyImprovements(evaluations: any[]) {
  const improvements = []

  for (let i = 1; i < evaluations.length; i++) {
    const prev = evaluations[i - 1]
    const curr = evaluations[i]

    // Health score improvement
    if ((curr.health_score || 0) > (prev.health_score || 0)) {
      improvements.push({
        type: 'health_score',
        evaluation: curr.id,
        improvement: (curr.health_score || 0) - (prev.health_score || 0),
        date: curr.created_at
      })
    }

    // Valuation improvement
    const prevVal = typeof prev.valuations?.weighted === 'object' 
      ? prev.valuations.weighted.value || 0 
      : prev.valuations?.weighted || 0
    const currVal = typeof curr.valuations?.weighted === 'object' 
      ? curr.valuations.weighted.value || 0 
      : curr.valuations?.weighted || 0

    if (currVal > prevVal) {
      improvements.push({
        type: 'valuation',
        evaluation: curr.id,
        improvement: currVal - prevVal,
        date: curr.created_at
      })
    }
  }

  return improvements.slice(0, 5) // Return top 5 improvements
}

function identifyRegressions(evaluations: any[]) {
  const regressions = []

  for (let i = 1; i < evaluations.length; i++) {
    const prev = evaluations[i - 1]
    const curr = evaluations[i]

    // Health score regression
    if ((curr.health_score || 0) < (prev.health_score || 0)) {
      regressions.push({
        type: 'health_score',
        evaluation: curr.id,
        decline: (prev.health_score || 0) - (curr.health_score || 0),
        date: curr.created_at
      })
    }

    // Valuation regression
    const prevVal = typeof prev.valuations?.weighted === 'object' 
      ? prev.valuations.weighted.value || 0 
      : prev.valuations?.weighted || 0
    const currVal = typeof curr.valuations?.weighted === 'object' 
      ? curr.valuations.weighted.value || 0 
      : curr.valuations?.weighted || 0

    if (currVal < prevVal) {
      regressions.push({
        type: 'valuation',
        evaluation: curr.id,
        decline: prevVal - currVal,
        date: curr.created_at
      })
    }
  }

  return regressions.slice(0, 5) // Return top 5 regressions
}