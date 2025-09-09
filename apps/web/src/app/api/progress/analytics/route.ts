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

    const analytics = await ProgressService.getProgressAnalytics(userId)

    return NextResponse.json({
      success: true,
      analytics
    })
  } catch (error) {
    console.error('Error getting progress analytics:', error)
    
    return NextResponse.json(
      { 
        error: 'Failed to get progress analytics',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}