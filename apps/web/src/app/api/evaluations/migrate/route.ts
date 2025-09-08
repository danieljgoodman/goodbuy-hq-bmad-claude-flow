import { NextRequest, NextResponse } from 'next/server'
import { evaluationStorage } from '@/lib/evaluation-storage'

export async function POST(request: NextRequest) {
  try {
    const { newUserId } = await request.json()
    
    if (!newUserId) {
      return NextResponse.json(
        { error: 'newUserId is required' }, 
        { status: 400 }
      )
    }

    console.log('🔄 Starting evaluation migration to userId:', newUserId)
    
    // Get all evaluations
    const allEvaluations = evaluationStorage.getAll()
    let migratedCount = 0
    
    // Update all evaluations to use the new user ID
    for (const [evaluationId, evaluation] of Object.entries(allEvaluations)) {
      const updated = evaluationStorage.update(evaluationId, {
        userId: newUserId,
        updatedAt: new Date().toISOString()
      })
      
      if (updated) {
        migratedCount++
        console.log(`✅ Migrated evaluation ${evaluationId} to user ${newUserId}`)
      }
    }
    
    console.log(`🎉 Migration completed: ${migratedCount} evaluations migrated`)
    
    return NextResponse.json({
      success: true,
      migratedCount,
      newUserId
    })
  } catch (error) {
    console.error('Failed to migrate evaluations:', error)
    return NextResponse.json(
      { error: 'Failed to migrate evaluations' }, 
      { status: 500 }
    )
  }
}