import { BenchmarkingService } from '@/lib/services/BenchmarkingService'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const industryCode = searchParams.get('industry') || 'tech'

    const trends = await BenchmarkingService.getMarketTrends(industryCode)

    return NextResponse.json({
      success: true,
      trends
    })
  } catch (error) {
    console.error('Error getting market trends:', error)
    
    return NextResponse.json(
      { 
        error: 'Failed to get market trends',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}