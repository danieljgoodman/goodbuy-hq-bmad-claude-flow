import { NextRequest, NextResponse } from 'next/server'
import { getServerAuth } from '@/lib/clerk'
import { SupportService } from '@/lib/services/SupportService'

export async function GET(request: NextRequest) {
  try {
    const user = await getServerAuth()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const processingType = searchParams.get('type') as 'evaluation' | 'report' | 'analysis' || 'evaluation'

    const queueStatus = await SupportService.getQueueStatus(user.userId, processingType)

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