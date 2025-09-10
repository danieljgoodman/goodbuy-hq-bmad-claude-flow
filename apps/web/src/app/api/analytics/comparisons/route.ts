import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { VisualizationService, ComparisonRequest } from '@/lib/services/VisualizationService'

const prisma = new PrismaClient()

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      userId, 
      type, 
      baseline, 
      comparison, 
      metrics 
    }: ComparisonRequest = body

    if (!userId || !type || !baseline || !comparison || !metrics || metrics.length === 0) {
      return NextResponse.json(
        { error: 'Missing required fields: userId, type, baseline, comparison, metrics' },
        { status: 400 }
      )
    }

    // Validate comparison type
    const validTypes = ['before_after', 'period_over_period', 'benchmark', 'scenario']
    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { error: `Invalid comparison type. Must be one of: ${validTypes.join(', ')}` },
        { status: 400 }
      )
    }

    // Validate baseline and comparison structure
    if (!baseline.period || !baseline.label || !comparison.period || !comparison.label) {
      return NextResponse.json(
        { error: 'Baseline and comparison must include period and label' },
        { status: 400 }
      )
    }

    const visualizationService = new VisualizationService(prisma)
    const comparisonAnalysis = await visualizationService.generateComparison({
      userId,
      type,
      baseline: {
        period: new Date(baseline.period),
        label: baseline.label
      },
      comparison: {
        period: new Date(comparison.period),
        label: comparison.label
      },
      metrics
    })

    return NextResponse.json({
      analysis: comparisonAnalysis,
      metadata: {
        generatedAt: new Date().toISOString(),
        comparisonType: type,
        metricsAnalyzed: metrics.length,
        improvementCount: comparisonAnalysis.analysis.improvements.length,
        declineCount: comparisonAnalysis.analysis.declines.length,
        confidenceScore: comparisonAnalysis.analysis.confidence
      }
    })

  } catch (error) {
    console.error('Error generating comparison analysis:', error)
    return NextResponse.json(
      { error: 'Failed to generate comparison analysis' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const type = searchParams.get('type')

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    // Get historical comparison analyses
    const whereClause: any = { userId }
    if (type) {
      whereClause.comparisonType = type.toUpperCase()
    }

    const historicalComparisons = await prisma.comparisonAnalysis.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      take: 10
    })

    const processedComparisons = historicalComparisons.map(comp => ({
      id: comp.id,
      type: comp.comparisonType.toLowerCase(),
      baseline: comp.baseline,
      comparison: comp.comparison,
      analysis: comp.analysis,
      createdAt: comp.createdAt
    }))

    return NextResponse.json({
      comparisons: processedComparisons,
      metadata: {
        userId,
        filterType: type || 'all',
        totalFound: processedComparisons.length,
        typeBreakdown: {
          before_after: processedComparisons.filter(c => c.type === 'before_after').length,
          period_over_period: processedComparisons.filter(c => c.type === 'period_over_period').length,
          benchmark: processedComparisons.filter(c => c.type === 'benchmark').length,
          scenario: processedComparisons.filter(c => c.type === 'scenario').length
        }
      }
    })

  } catch (error) {
    console.error('Error fetching comparison analyses:', error)
    return NextResponse.json(
      { error: 'Failed to fetch comparison analyses' },
      { status: 500 }
    )
  }
}