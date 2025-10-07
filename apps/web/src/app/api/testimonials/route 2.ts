import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { TestimonialService } from '@/lib/services/TestimonialService'

const submitTestimonialSchema = z.object({
  content: z.string().min(50).max(1000),
  authorName: z.string().min(1).max(100),
  authorTitle: z.string().min(1).max(100),
  companyName: z.string().min(1).max(100),
  permissions: z.object({
    useCompanyName: z.boolean(),
    useRealName: z.boolean(),
    useQuantifiedData: z.boolean()
  })
})

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') as any
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 10
    const offset = searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : 0

    const result = await TestimonialService.getTestimonials({
      status,
      limit,
      offset
    })

    return NextResponse.json({
      success: true,
      data: result
    })
  } catch (error) {
    console.error('Error fetching testimonials:', error)
    return NextResponse.json(
      { error: 'Failed to fetch testimonials' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const testimonialData = submitTestimonialSchema.parse(body)

    const testimonial = await TestimonialService.submitTestimonial(
      session.user.id,
      testimonialData
    )

    return NextResponse.json({
      success: true,
      data: {
        testimonial
      }
    })
  } catch (error: any) {
    console.error('Error submitting testimonial:', error)
    
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Invalid input data', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to submit testimonial' },
      { status: 500 }
    )
  }
}