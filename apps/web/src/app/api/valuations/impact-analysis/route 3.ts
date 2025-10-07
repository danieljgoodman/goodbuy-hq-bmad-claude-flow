import { ValueImpactService } from '@/lib/services/ValueImpactService'
import { RevaluationService } from '@/lib/services/RevaluationService'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const guideId = searchParams.get('guideId')

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    // Get comprehensive impact analysis
    const [
      valueImpactTimeline,
      beforeAfterComparison,
      currentValuation,
      projectedValuation,
      revaluationHistory
    ] = await Promise.all([
      ValueImpactService.getValueImpactTimeline(userId),
      ValueImpactService.getBeforeAfterComparison(userId, guideId || undefined),
      RevaluationService.getCurrentValuation(userId),
      RevaluationService.getProjectedValuation(userId, guideId || undefined),
      RevaluationService.getRevaluationHistory(userId)
    ])

    return NextResponse.json({
      success: true,
      impactAnalysis: {
        valueImpactTimeline,
        beforeAfterComparison,
        currentValuation,
        projectedValuation,
        revaluationHistory
      }
    })
  } catch (error) {
    console.error('Error getting impact analysis:', error)
    
    return NextResponse.json(
      { 
        error: 'Failed to get impact analysis',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}