import { NextRequest, NextResponse } from 'next/server'
import { evaluationStorage } from '@/lib/evaluation-storage'

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 GET ALL evaluations')
    
    // Get ALL evaluations (bypass userId filtering for debugging)
    const allEvaluations = Object.values(evaluationStorage.getAll())
    console.log('✅ Found', allEvaluations.length, 'total evaluations in storage')
    
    // Sort by creation date
    const sortedEvaluations = allEvaluations.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
    
    return NextResponse.json(sortedEvaluations)
  } catch (error) {
    console.error('Failed to get all evaluations:', error)
    return NextResponse.json(
      { error: 'Failed to get all evaluations' }, 
      { status: 500 }
    )
  }
}