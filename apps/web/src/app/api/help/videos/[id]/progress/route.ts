import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const data = await req.json()
    const { progress_percentage, current_time, bookmarks, notes, completed } = data

    // Upsert tutorial progress
    const progress = await prisma.tutorialProgress.upsert({
      where: {
        userId_video_id: {
          userId,
          video_id: params.id
        }
      },
      update: {
        progress_percentage: progress_percentage || 0,
        completed: completed || false,
        last_watched_at: new Date(),
        bookmarks: bookmarks || [],
        notes: notes || ''
      },
      create: {
        userId,
        video_id: params.id,
        progress_percentage: progress_percentage || 0,
        completed: completed || false,
        last_watched_at: new Date(),
        bookmarks: bookmarks || [],
        notes: notes || ''
      }
    })

    return NextResponse.json({ progress })
  } catch (error) {
    console.error('Failed to update video progress:', error)
    return NextResponse.json(
      { error: 'Failed to update video progress' },
      { status: 500 }
    )
  }
}