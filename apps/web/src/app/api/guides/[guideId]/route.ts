import { GuideService } from '@/lib/services/GuideService'
import { NextRequest, NextResponse } from 'next/server'

interface RouteParams {
  params: {
    guideId: string
  }
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    const guide = await GuideService.getGuide(params.guideId, userId)

    if (!guide) {
      return NextResponse.json(
        { error: 'Guide not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      guide
    })
  } catch (error) {
    console.error('Error getting guide:', error)
    
    return NextResponse.json(
      { 
        error: 'Failed to get guide',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const guide = await GuideService.updateGuide(params.guideId, userId, body)

    return NextResponse.json({
      success: true,
      guide
    })
  } catch (error) {
    console.error('Error updating guide:', error)
    
    return NextResponse.json(
      { 
        error: 'Failed to update guide',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    await GuideService.deleteGuide(params.guideId, userId)

    return NextResponse.json({
      success: true,
      message: 'Guide deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting guide:', error)
    
    return NextResponse.json(
      { 
        error: 'Failed to delete guide',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}