import { TrialService } from '@/lib/services/TrialService'
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

    const trialInfo = await TrialService.getTrialInfo(userId)

    return NextResponse.json({
      success: true,
      ...trialInfo,
    })
  } catch (error) {
    console.error('Error getting trial status:', error)
    
    return NextResponse.json(
      { 
        error: 'Failed to get trial status',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}