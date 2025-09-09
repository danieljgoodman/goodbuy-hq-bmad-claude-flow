import { ProgressService } from '@/lib/services/ProgressService'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    const timeline = await ProgressService.getProgressTimeline(userId)

    return NextResponse.json({
      success: true,
      timeline
    })
  } catch (error) {
    console.error('Error getting progress timeline:', error)
    
    return NextResponse.json(
      { 
        error: 'Failed to get progress timeline',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}