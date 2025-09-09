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

    const metrics = await SupportService.getUserSupportMetrics(session.user.id)

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