import { GuideService } from '@/lib/services/GuideService'
import { NextRequest, NextResponse } from 'next/server'

interface RouteParams {
  params: {
    evaluationId: string
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const evaluationId = searchParams.get('evaluationId')

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    const guides = await GuideService.getUserGuides(userId, evaluationId || undefined)

    return NextResponse.json({
      success: true,
      guides
    })
  } catch (error) {
    console.error('Error getting guides:', error)
    
    return NextResponse.json(
      { 
        error: 'Failed to get implementation guides',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}