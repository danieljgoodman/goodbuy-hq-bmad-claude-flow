import { NextRequest, NextResponse } from 'next/server'
import { evaluationStorage } from '@/lib/evaluation-storage'
import { TierValidationMiddleware } from '@/middleware/tier-validation'

export async function GET(request: NextRequest) {
  try {
    // Validate user tier for data access
    const tierResult = await TierValidationMiddleware.validateTier(request, {
      requiredTier: 'PREMIUM',
      featureType: 'analytics',
      fallbackToBasic: true
    })

    console.log('🔍 GET ALL evaluations - userTier:', tierResult.userTier)
    
    // Get ALL evaluations (bypass userId filtering for debugging)
    const allEvaluations = Object.values(evaluationStorage.getAll())
    console.log('✅ Found', allEvaluations.length, 'total evaluations in storage')
    
    // Sort by creation date
    const sortedEvaluations = allEvaluations.sort((a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )

    // Filter evaluations based on user's tier
    const filteredEvaluations = sortedEvaluations.map(evaluation =>
      TierValidationMiddleware.filterDataByTier(
        evaluation,
        tierResult.userTier,
        'evaluation'
      )
    )

    // Limit number of evaluations for basic users
    const limitedEvaluations = tierResult.userTier === 'FREE'
      ? filteredEvaluations.slice(0, 5) // Show only 5 most recent for free users
      : filteredEvaluations

    return TierValidationMiddleware.createTierAwareResponse(
      limitedEvaluations,
      tierResult,
      { includeUpgradeInfo: true }
    )
  } catch (error) {
    console.error('Failed to get all evaluations:', error)
    return NextResponse.json(
      { error: 'Failed to get all evaluations' }, 
      { status: 500 }
    )
  }
}