import { NextRequest, NextResponse } from 'next/server'
import { evaluationStorage } from '@/lib/evaluation-storage'

export async function POST(request: NextRequest) {
  try {
    const { newUserId, fromEmail } = await request.json()
    
    if (!newUserId) {
      return NextResponse.json(
        { error: 'newUserId is required' }, 
        { status: 400 }
      )
    }

    console.log('🔄 Starting evaluation migration to userId:', newUserId)
    
    // Check if this user already has evaluations (avoid re-migration)
    const existingEvaluations = evaluationStorage.getByUserId(newUserId)
    if (existingEvaluations.length > 0) {
      console.log('🔄 User already has evaluations, skipping migration')
      return NextResponse.json({
        success: true,
        migratedCount: 0,
        newUserId,
        message: 'User already has evaluations'
      })
    }
    
    // Get all evaluations
    const allEvaluations = evaluationStorage.getAll()
    let migratedCount = 0
    
    // For development: Only migrate if there are orphaned evaluations and this is the first user
    const allEvaluationsList = Object.values(allEvaluations)
    const orphanedEvaluations = allEvaluationsList.filter(e => 
      !e.userId || 
      e.userId.startsWith('e3d94292-') || // Old user IDs we want to migrate
      e.userId.startsWith('f6476fe6-') ||
      e.userId === 'c946330a-dc74-4201-bc32-73f1456b3988' // The migrated ID
    )
    
    // Only migrate if there are orphaned evaluations and we're the first proper user
    if (orphanedEvaluations.length > 0 && fromEmail) {
      console.log(`🔄 Found ${orphanedEvaluations.length} orphaned evaluations to migrate`)
      
      // For the first user (likely the original creator), migrate the orphaned evaluations
      for (const evaluation of orphanedEvaluations.slice(0, 3)) { // Limit to first 3 to avoid overwhelming
        const updated = evaluationStorage.update(evaluation.id, {
          userId: newUserId,
          updatedAt: new Date().toISOString()
        })
        
        if (updated) {
          migratedCount++
          console.log(`✅ Migrated evaluation ${evaluation.id} to user ${newUserId}`)
        }
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