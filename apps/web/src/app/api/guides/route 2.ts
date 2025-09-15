import { GuideService } from '@/lib/services/GuideService'
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

    let guides = []
    
    try {
      guides = await GuideService.getUserGuides(userId)
    } catch (dbError) {
      console.error('Database error, returning empty guides list:', dbError)
      // Return empty guides array when database is not available
      guides = []
    }

    return NextResponse.json({
      success: true,
      guides
    })
  } catch (error) {
    console.error('Error getting guides:', error)
    
    return NextResponse.json(
      { 
        error: 'Failed to get guides',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    // This would be used to create guides manually (if needed)
    // For now, guides are created via the generate endpoint
    return NextResponse.json(
      { error: 'Use /api/guides/generate to create new guides' },
      { status: 405 }
    )
  } catch (error) {
    console.error('Error creating guide:', error)
    
    return NextResponse.json(
      { 
        error: 'Failed to create guide',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}