import { NextRequest, NextResponse } from 'next/server'
import { evaluationStorage } from '@/lib/evaluation-storage'
import { BusinessEvaluationRepository } from '@/lib/repositories/BusinessEvaluationRepository'
import { TierValidationMiddleware } from '@/middleware/tier-validation'
import type { BusinessData } from '@/types/evaluation'

export async function POST(request: NextRequest) {
  try {
    // Validate user tier for evaluation creation
    const tierResult = await TierValidationMiddleware.validateTier(request, {
      requiredTier: 'PREMIUM',
      featureType: 'analytics',
      fallbackToBasic: true
    })

    const { businessData, userId } = await request.json()
    
    if (!businessData) {
      return NextResponse.json(
        { error: 'Business data is required' }, 
        { status: 400 }
      )
    }

    // Create evaluation with proper structure
    const evaluation = {
      id: crypto.randomUUID(),
      userId: userId || 'current-user-id',
      businessData: businessData as any,
      valuations: {},
      healthScore: null,
      confidenceScore: null,
      opportunities: [],
      status: 'processing',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    // Store in file-based storage
    evaluationStorage.store(evaluation)

    // Return tier-aware response with filtered data based on user's subscription
    const filteredEvaluation = TierValidationMiddleware.filterDataByTier(
      evaluation,
      tierResult.userTier,
      'evaluation'
    )

    return TierValidationMiddleware.createTierAwareResponse(
      filteredEvaluation,
      tierResult,
      { includeUpgradeInfo: true }
    )
  } catch (error) {
    console.error('Failed to create evaluation:', error)
    return NextResponse.json(
      { error: 'Failed to create evaluation' }, 
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    // Validate user tier for data access
    const tierResult = await TierValidationMiddleware.validateTier(request, {
      requiredTier: 'PREMIUM',
      featureType: 'analytics',
      fallbackToBasic: true
    })

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const evaluationId = searchParams.get('id')

    console.log('🔍 GET evaluations - userId:', userId, 'evaluationId:', evaluationId, 'userTier:', tierResult.userTier)

    if (evaluationId) {
      // Get single evaluation
      const evaluation = evaluationStorage.get(evaluationId)
      
      if (!evaluation) {
        console.log('❌ Evaluation not found:', evaluationId)
        return NextResponse.json(
          { error: 'Evaluation not found' }, 
          { status: 404 }
        )
      }
      
      console.log('✅ Found evaluation:', evaluationId)

      // Filter evaluation data based on user's tier
      const filteredEvaluation = TierValidationMiddleware.filterDataByTier(
        evaluation,
        tierResult.userTier,
        'evaluation'
      )

      return TierValidationMiddleware.createTierAwareResponse(
        filteredEvaluation,
        tierResult,
        { includeUpgradeInfo: true }
      )
    } else if (userId) {
      // Get user evaluations - try database first, fallback to file storage
      try {
        const userEvaluations = await BusinessEvaluationRepository.findByUserId(userId)
        console.log('✅ Found', userEvaluations.length, 'evaluations for user:', userId, '(from database)')

        // Filter each evaluation based on user's tier
        const filteredEvaluations = userEvaluations.map(evaluation =>
          TierValidationMiddleware.filterDataByTier(
            evaluation,
            tierResult.userTier,
            'evaluation'
          )
        )

        return TierValidationMiddleware.createTierAwareResponse(
          filteredEvaluations,
          tierResult,
          { includeUpgradeInfo: true }
        )
      } catch (error) {
        console.log('📁 Falling back to file storage for user evaluations')
        const userEvaluations = evaluationStorage.getByUserId(userId)
        console.log('✅ Found', userEvaluations.length, 'evaluations for user:', userId, '(from file storage)')

        // Filter each evaluation based on user's tier
        const filteredEvaluations = userEvaluations.map(evaluation =>
          TierValidationMiddleware.filterDataByTier(
            evaluation,
            tierResult.userTier,
            'evaluation'
          )
        )

        return TierValidationMiddleware.createTierAwareResponse(
          filteredEvaluations,
          tierResult,
          { includeUpgradeInfo: true }
        )
      }
    } else {
      return NextResponse.json(
        { error: 'userId or id parameter required' }, 
        { status: 400 }
      )
    }
  } catch (error) {
    console.error('Failed to get evaluations:', error)
    return NextResponse.json(
      { error: 'Failed to get evaluations' }, 
      { status: 500 }
    )
  }
}