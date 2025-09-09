import { BenchmarkingService } from '@/lib/services/BenchmarkingService'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

const peerSharingSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  consent: z.boolean()
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, consent } = peerSharingSchema.parse(body)

    const result = await BenchmarkingService.optIntoPeerSharing(userId, consent)

    return NextResponse.json({
      success: true,
      ...result
    })
  } catch (error) {
    console.error('Error updating peer sharing consent:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { 
        error: 'Failed to update peer sharing consent',
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

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    const peerData = await BenchmarkingService.getPeerGroupComparison(userId)

    return NextResponse.json({
      success: true,
      ...peerData
    })
  } catch (error) {
    console.error('Error getting peer comparison:', error)
    
    return NextResponse.json(
      { 
        error: 'Failed to get peer comparison',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}