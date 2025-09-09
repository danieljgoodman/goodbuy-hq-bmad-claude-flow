import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { TestimonialService } from '@/lib/services/TestimonialService'

const publishSchema = z.object({
  platforms: z.array(z.string()).default(['website'])
})

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // TODO: Add admin role check
    // if (!session.user.isAdmin) {
    //   return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    // }

    const body = await request.json()
    const { platforms } = publishSchema.parse(body)

    const testimonial = await TestimonialService.publishTestimonial(
      params.id,
      platforms
    )

    return NextResponse.json({
      success: true,
      data: {
        testimonial
      }
    })
  } catch (error: any) {
    console.error('Error publishing testimonial:', error)
    
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Invalid input data', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to publish testimonial' },
      { status: 500 }
    )
  }
}