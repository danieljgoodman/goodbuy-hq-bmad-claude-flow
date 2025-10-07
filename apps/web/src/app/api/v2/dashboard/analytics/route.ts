import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import type { DashboardFilters } from '@/types/dashboard'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const filtersParam = searchParams.get('filters')
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    // Parse filters
    let filters: Partial<DashboardFilters> = {}
    if (filtersParam) {
      try {
        filters = JSON.parse(filtersParam)
      } catch (error) {
        return NextResponse.json(
          { error: 'Invalid filters format' },
          { status: 400 }
        )
      }
    }

    // Use existing supabase client

    // Build query based on filters
    let query = supabase
      .from('business_evaluations')
      .select('*')
      .eq('user_id', userId)

    // Apply date range filter
    if (filters.dateRange) {
      query = query
        .gte('created_at', filters.dateRange.start)
        .lte('created_at', filters.dateRange.end)
    }

    // Apply evaluation type filter
    if (filters.evaluationTypes && filters.evaluationTypes.length > 0) {
      query = query.in('status', filters.evaluationTypes)
    }

    // Apply business category filter (assuming we have a category field)
    if (filters.businessCategories && filters.businessCategories.length > 0) {
      query = query.in('business_category', filters.businessCategories)
    }

    const { data: evaluations, error } = await query
      .order('created_at', { ascending: false })
      .limit(1000) // Reasonable limit for dashboard analytics

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch evaluations' },
        { status: 500 }
      )
    }

    // Calculate analytics data
    const analytics = calculateAnalytics(evaluations || [])

    return NextResponse.json({
      evaluations,
      analytics,
      filters,
      count: evaluations?.length || 0,
      generatedAt: new Date().toISOString()
    })

  } catch (error) {
    console.error('Analytics API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

function calculateAnalytics(evaluations: any[]) {
  if (evaluations.length === 0) {
    return {
      averageHealthScore: 0,
      averageValuation: 0,
      totalRevenue: 0,
      completionRate: 0,
      trends: {
        healthScore: 0,
        valuation: 0,
        evaluationCount: 0
      }
    }
  }

  const completed = evaluations.filter(e => e.status === 'completed')
  const healthScores = completed.map(e => e.health_score || 0)
  const valuations = completed.map(e => {
    const valuation = e.valuations?.weighted
    return typeof valuation === 'object' ? valuation.value : valuation || 0
  })
  const revenues = completed.map(e => e.business_data?.annual_revenue || 0)

  const averageHealthScore = healthScores.length > 0 
    ? healthScores.reduce((sum, score) => sum + score, 0) / healthScores.length
    : 0

  const averageValuation = valuations.length > 0
    ? valuations.reduce((sum, val) => sum + val, 0) / valuations.length
    : 0

  const totalRevenue = revenues.reduce((sum, rev) => sum + rev, 0)
  const completionRate = evaluations.length > 0 
    ? (completed.length / evaluations.length) * 100
    : 0

  // Calculate trends (comparing recent vs older evaluations)
  const sortedEvaluations = [...evaluations].sort((a, b) => 
    new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  )

  const midpoint = Math.floor(sortedEvaluations.length / 2)
  const olderHalf = sortedEvaluations.slice(0, midpoint)
  const newerHalf = sortedEvaluations.slice(midpoint)

  const calculateTrend = (older: any[], newer: any[], getValue: (item: any) => number) => {
    if (older.length === 0 || newer.length === 0) return 0
    
    const olderAvg = older.reduce((sum, item) => sum + getValue(item), 0) / older.length
    const newerAvg = newer.reduce((sum, item) => sum + getValue(item), 0) / newer.length
    
    return olderAvg > 0 ? ((newerAvg - olderAvg) / olderAvg) * 100 : 0
  }

  const trends = {
    healthScore: calculateTrend(
      olderHalf.filter(e => e.status === 'completed'),
      newerHalf.filter(e => e.status === 'completed'),
      (e) => e.health_score || 0
    ),
    valuation: calculateTrend(
      olderHalf.filter(e => e.status === 'completed'),
      newerHalf.filter(e => e.status === 'completed'),
      (e) => {
        const valuation = e.valuations?.weighted
        return typeof valuation === 'object' ? valuation.value : valuation || 0
      }
    ),
    evaluationCount: newerHalf.length > olderHalf.length ? 
      ((newerHalf.length - olderHalf.length) / olderHalf.length) * 100 : 0
  }

  return {
    averageHealthScore,
    averageValuation,
    totalRevenue,
    completionRate,
    trends,
    statusBreakdown: {
      completed: completed.length,
      processing: evaluations.filter(e => e.status === 'processing').length,
      failed: evaluations.filter(e => e.status === 'failed').length
    }
  }
}