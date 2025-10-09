import { NextRequest, NextResponse } from 'next/server'
import { evaluationStorage } from '@/lib/evaluation-storage'

/**
 * Special endpoint for danielgoodman14@gmail.com mock data
 * Bypasses tier validation to always return full enterprise data
 */
export async function GET(request: NextRequest) {
  try {
    const evaluationId = 'eval_1760017317126_danielgoodman'

    console.log('🔍 Fetching danielgoodman evaluation:', evaluationId)

    // Get evaluation directly from file storage
    const evaluation = evaluationStorage.get(evaluationId)

    if (!evaluation) {
      console.log('❌ Evaluation not found:', evaluationId)
      return NextResponse.json(
        { error: 'Evaluation not found' },
        { status: 404 }
      )
    }

    console.log('✅ Found danielgoodman evaluation with full data')

    // Return full evaluation without tier filtering
    return NextResponse.json(evaluation)
  } catch (error) {
    console.error('Failed to get danielgoodman evaluation:', error)
    return NextResponse.json(
      { error: 'Failed to get evaluation' },
      { status: 500 }
    )
  }
}
