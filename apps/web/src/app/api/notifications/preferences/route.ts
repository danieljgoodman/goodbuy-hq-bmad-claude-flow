import { NotificationService } from '@/lib/services/NotificationService'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

const updatePreferencesSchema = z.object({
  emailNotifications: z.object({
    opportunities: z.boolean(),
    reminders: z.boolean(),
    reports: z.boolean(),
    milestones: z.boolean()
  }).optional(),
  frequency: z.enum(['immediate', 'daily', 'weekly', 'monthly']).optional(),
  reminderCadence: z.enum(['daily', 'weekly', 'bi-weekly']).optional(),
  quietHours: z.object({
    start: z.string(),
    end: z.string()
  }).optional()
})

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    const preferences = await NotificationService.getNotificationPreferences(userId)

    return NextResponse.json({
      success: true,
      preferences
    })
  } catch (error) {
    console.error('Error getting notification preferences:', error)
    
    return NextResponse.json(
      { 
        error: 'Failed to get notification preferences',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    const updates = updatePreferencesSchema.parse(body)

    const preferences = await NotificationService.updateNotificationPreferences(
      userId,
      updates
    )

    return NextResponse.json({
      success: true,
      preferences
    })
  } catch (error) {
    console.error('Error updating notification preferences:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { 
        error: 'Failed to update notification preferences',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}