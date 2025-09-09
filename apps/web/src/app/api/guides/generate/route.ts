import { GuideService } from '@/lib/services/GuideService'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

const generateGuideSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  evaluationId: z.string().min(1, 'Evaluation ID is required'),
  improvementCategory: z.string().min(1, 'Improvement category is required'),
  businessContext: z.object({
    businessName: z.string().min(1, 'Business name is required'),
    industry: z.string().min(1, 'Industry is required'),
    size: z.string().min(1, 'Business size is required'),
    currentRevenue: z.number().optional(),
    goals: z.array(z.string()).optional()
  }),
  improvementOpportunity: z.object({
    title: z.string().min(1, 'Title is required'),
    description: z.string().min(1, 'Description is required'),
    potentialImpact: z.number().min(0, 'Potential impact must be positive'),
    difficulty: z.enum(['low', 'medium', 'high']),
    timelineEstimate: z.string().min(1, 'Timeline estimate is required')
  })
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = generateGuideSchema.parse(body)

    let guide
    
    try {
      guide = await GuideService.generateImplementationGuide(validatedData)
    } catch (serviceError) {
      console.error('GuideService error:', serviceError)
      
      // Return a more user-friendly error for development
      return NextResponse.json(
        { 
          error: 'Failed to generate implementation guide',
          details: 'Guide generation service is currently unavailable. Please try again later.',
          devError: serviceError instanceof Error ? serviceError.message : 'Unknown service error'
        },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      guide
    })
  } catch (error) {
    console.error('Error generating implementation guide:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { 
        error: 'Failed to generate implementation guide',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}