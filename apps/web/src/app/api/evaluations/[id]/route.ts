import { NextRequest, NextResponse } from 'next/server'
import { evaluationStorage } from '@/lib/evaluation-storage'
import { BusinessEvaluationRepository } from '@/lib/repositories/BusinessEvaluationRepository'
import { TierValidationMiddleware } from '@/lib/middleware/tier-validation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Validate user tier for data access
    const tierResult = await TierValidationMiddleware.validateTier(request, {
      requiredTier: 'PREMIUM',
      featureType: 'analytics',
      fallbackToBasic: true
    })

    console.log('🔍 GET single evaluation:', params.id, 'userTier:', tierResult.userTier)
    
    // Try database first, fallback to file storage
    try {
      const evaluation = await BusinessEvaluationRepository.findById(params.id)
      
      if (evaluation) {
        console.log('✅ Found evaluation:', params.id, '(from database)')

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
      }
    } catch (error) {
      console.log('📁 Database query failed, falling back to file storage')
    }

    // Fallback to file storage
    const evaluation = evaluationStorage.get(params.id)
    
    if (!evaluation) {
      console.log('❌ Evaluation not found:', params.id)
      return NextResponse.json(
        { error: 'Evaluation not found' }, 
        { status: 404 }
      )
    }
    
    console.log('✅ Found evaluation:', params.id, '(from file storage)')

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
  } catch (error) {
    console.error('Failed to get evaluation:', error)
    return NextResponse.json(
      { error: 'Failed to get evaluation' }, 
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Allow basic tier users to update evaluations
    const tierResult = await TierValidationMiddleware.validateTier(request, {
      requiredTier: 'BASIC',
      featureType: 'analytics',
      fallbackToBasic: true // Allow basic tier to update
    })

    const updates = await request.json()
    console.log('🔄 PATCH evaluation:', params.id, 'with updates:', Object.keys(updates), 'userTier:', tierResult.userTier)

    // First check if the evaluation exists
    let existingEvaluation = evaluationStorage.get(params.id)

    if (!existingEvaluation) {
      console.log('⚠️ Evaluation not found in storage, checking if it needs to be created')

      // If the update contains full evaluation data, treat it as a create-or-update operation
      if (updates.businessData && updates.userId) {
        console.log('🆕 Creating new evaluation from PATCH request')
        const newEvaluation = {
          id: params.id,
          userId: updates.userId,
          businessData: updates.businessData,
          valuations: updates.valuations || {},
          healthScore: updates.healthScore || null,
          confidenceScore: updates.confidenceScore || null,
          opportunities: updates.opportunities || [],
          status: updates.status || 'processing',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }
        evaluationStorage.store(newEvaluation)
        existingEvaluation = newEvaluation
        console.log('✅ Created new evaluation:', params.id)
      } else {
        console.log('❌ Evaluation not found and insufficient data to create:', params.id)
        return NextResponse.json(
          { error: 'Evaluation not found' },
          { status: 404 }
        )
      }
    }

    // Now update the evaluation
    const updatedEvaluation = evaluationStorage.update(params.id, updates)

    if (!updatedEvaluation) {
      console.log('❌ Failed to update evaluation:', params.id)
      return NextResponse.json(
        { error: 'Failed to update evaluation' },
        { status: 500 }
      )
    }
    
    console.log('✅ Updated evaluation:', params.id)

    // Filter updated evaluation data based on user's tier
    const filteredEvaluation = TierValidationMiddleware.filterDataByTier(
      updatedEvaluation,
      tierResult.userTier,
      'evaluation'
    )

    return TierValidationMiddleware.createTierAwareResponse(
      filteredEvaluation,
      tierResult,
      { includeUpgradeInfo: true }
    )
  } catch (error) {
    console.error('Failed to update evaluation:', error)
    return NextResponse.json(
      { error: 'Failed to update evaluation' }, 
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' }, 
        { status: 401 }
      )
    }

    console.log('🗑️ DELETE evaluation:', params.id, 'for user:', session.user.id)
    
    // Attempt soft delete with user ownership validation
    const deleted = await BusinessEvaluationRepository.softDelete(params.id, session.user.id)
    
    if (!deleted) {
      return NextResponse.json(
        { error: 'Evaluation not found or access denied' }, 
        { status: 404 }
      )
    }
    
    console.log('✅ Soft deleted evaluation:', params.id)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete evaluation:', error)
    return NextResponse.json(
      { error: 'Failed to delete evaluation' }, 
      { status: 500 }
    )
  }
}