import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { SupportService } from '@/lib/services/SupportService'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const processingType = searchParams.get('type') as 'evaluation' | 'report' | 'analysis' || 'evaluation'

    const queueStatus = await SupportService.getQueueStatus(session.user.id, processingType)

    return NextResponse.json({
      success: true,
      data: {
        queueStatus
      }
    })
  } catch (error) {
    console.error('Error fetching queue status:', error)
    return NextResponse.json(
      { error: 'Failed to fetch queue status' },
      { status: 500 }
    )
  }
}