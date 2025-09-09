import { NotificationService } from '@/lib/services/NotificationService'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

const markReadSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  notificationIds: z.array(z.string()).min(1, 'At least one notification ID is required')
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, notificationIds } = markReadSchema.parse(body)

    const result = await NotificationService.markNotificationsAsRead(userId, notificationIds)

    return NextResponse.json({
      success: true,
      ...result
    })
  } catch (error) {
    console.error('Error marking notifications as read:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { 
        error: 'Failed to mark notifications as read',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}