import { NextRequest, NextResponse } from 'next/server'
import { evaluationStorage } from '@/lib/evaluation-storage'
import type { BusinessData } from '@/types/evaluation'

export async function POST(request: NextRequest) {
  try {
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

    return NextResponse.json(evaluation)
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
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const evaluationId = searchParams.get('id')

    console.log('🔍 GET evaluations - userId:', userId, 'evaluationId:', evaluationId)

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
      return NextResponse.json(evaluation)
    } else if (userId) {
      // Get user evaluations
      const userEvaluations = evaluationStorage.getByUserId(userId)
      
      console.log('✅ Found', userEvaluations.length, 'evaluations for user:', userId)
      return NextResponse.json(userEvaluations)
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