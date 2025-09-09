import { ValueImpactService } from '@/lib/services/ValueImpactService'
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

    const roiAnalysis = await ValueImpactService.getROIAnalysis(userId)

    return NextResponse.json({
      success: true,
      roiAnalysis
    })
  } catch (error) {
    console.error('Error getting ROI analysis:', error)
    
    return NextResponse.json(
      { 
        error: 'Failed to get ROI analysis',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}