import { NotificationService } from '@/lib/services/NotificationService'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const unreadOnly = searchParams.get('unreadOnly') === 'true'
    const type = searchParams.get('type') || undefined

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    const result = await NotificationService.getInAppNotifications(userId, {
      page,
      limit,
      unreadOnly,
      type
    })

    return NextResponse.json({
      success: true,
      ...result
    })
  } catch (error) {
    console.error('Error getting in-app notifications:', error)
    
    return NextResponse.json(
      { 
        error: 'Failed to get notifications',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}