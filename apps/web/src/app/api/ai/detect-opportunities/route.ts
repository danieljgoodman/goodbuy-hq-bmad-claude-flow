import { OpportunityDetectionService } from '@/lib/services/OpportunityDetectionService'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

const detectOpportunitiesSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  forceRefresh: z.boolean().optional().default(false)
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, forceRefresh } = detectOpportunitiesSchema.parse(body)

    const result = await OpportunityDetectionService.detectOpportunities(userId)

    return NextResponse.json({
      success: true,
      ...result
    })
  } catch (error) {
    console.error('Error detecting opportunities:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { 
        error: 'Failed to detect opportunities',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const status = searchParams.get('status') as any
    const type = searchParams.get('type') as any
    const priority = searchParams.get('priority') as any
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    const opportunities = await OpportunityDetectionService.getUserOpportunities(userId, {
      status,
      type,
      priority,
      limit
    })

    return NextResponse.json({
      success: true,
      opportunities
    })
  } catch (error) {
    console.error('Error getting user opportunities:', error)
    
    return NextResponse.json(
      { 
        error: 'Failed to get opportunities',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}