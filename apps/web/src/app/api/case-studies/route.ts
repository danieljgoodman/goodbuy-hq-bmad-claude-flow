import { NextRequest, NextResponse } from 'next/server'
import { getServerAuth } from '@/lib/clerk'
import { TestimonialService } from '@/lib/services/TestimonialService'

export async function GET(request: NextRequest) {
  try {
    const user = await getServerAuth()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const industry = searchParams.get('industry') || undefined
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 10
    const offset = searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : 0

    const result = await TestimonialService.getCaseStudies({
      industry,
      limit,
      offset
    })

    return NextResponse.json({
      success: true,
      data: result
    })
  } catch (error) {
    console.error('Error fetching case studies:', error)
    return NextResponse.json(
      { error: 'Failed to fetch case studies' },
      { status: 500 }
    )
  }
}