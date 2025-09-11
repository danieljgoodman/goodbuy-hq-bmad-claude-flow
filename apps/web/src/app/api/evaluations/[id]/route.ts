import { NextRequest, NextResponse } from 'next/server'
import { evaluationStorage } from '@/lib/evaluation-storage'
import { BusinessEvaluationRepository } from '@/lib/repositories/BusinessEvaluationRepository'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log('🔍 GET single evaluation:', params.id)
    
    // Try database first, fallback to file storage
    try {
      const evaluation = await BusinessEvaluationRepository.findById(params.id)
      
      if (evaluation) {
        console.log('✅ Found evaluation:', params.id, '(from database)')
        return NextResponse.json(evaluation)
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
    return NextResponse.json(evaluation)
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
    const updates = await request.json()
    console.log('🔄 PATCH evaluation:', params.id, 'with updates:', Object.keys(updates))
    
    const updatedEvaluation = evaluationStorage.update(params.id, updates)
    
    if (!updatedEvaluation) {
      console.log('❌ Evaluation not found for update:', params.id)
      return NextResponse.json(
        { error: 'Evaluation not found' }, 
        { status: 404 }
      )
    }
    
    console.log('✅ Updated evaluation:', params.id)
    return NextResponse.json(updatedEvaluation)
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