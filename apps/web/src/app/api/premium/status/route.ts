import { PremiumAccessService } from '@/lib/services/PremiumAccessService'
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

    const premiumStatus = await PremiumAccessService.getUserPremiumStatus(userId)

    return NextResponse.json({
      success: true,
      ...premiumStatus,
    })
  } catch (error) {
    console.error('Error getting premium status:', error)
    
    return NextResponse.json(
      { 
        error: 'Failed to get premium status',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}