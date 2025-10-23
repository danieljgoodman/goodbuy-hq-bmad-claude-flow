import { NextRequest, NextResponse } from 'next/server'
import { getServerAuth } from '@/lib/clerk'
import { SupportService } from '@/lib/services/SupportService'

export async function GET(request: NextRequest) {
  try {
    const user = await getServerAuth()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const metrics = await SupportService.getUserSupportMetrics(user.userId)

    return NextResponse.json({
      success: true,
      data: {
        metrics
      }
    })
  } catch (error) {
    console.error('Error fetching support metrics:', error)
    return NextResponse.json(
      { error: 'Failed to fetch support metrics' },
      { status: 500 }
    )
  }
}