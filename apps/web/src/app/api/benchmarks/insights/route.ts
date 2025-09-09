import { BenchmarkingService } from '@/lib/services/BenchmarkingService'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const industryCode = searchParams.get('industry') || 'tech'

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    const insights = await BenchmarkingService.generateBenchmarkInsights(userId, industryCode)

    return NextResponse.json({
      success: true,
      ...insights
    })
  } catch (error) {
    console.error('Error generating benchmark insights:', error)
    
    return NextResponse.json(
      { 
        error: 'Failed to generate benchmark insights',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}