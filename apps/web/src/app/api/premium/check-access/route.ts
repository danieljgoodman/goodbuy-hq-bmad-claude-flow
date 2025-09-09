import { PremiumAccessService } from '@/lib/services/PremiumAccessService'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

const checkAccessSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  featureType: z.enum(['ai_guides', 'progress_tracking', 'pdf_reports', 'analytics', 'benchmarks', 'priority_support']),
  requiredTier: z.enum(['PREMIUM', 'ENTERPRISE']).optional().default('PREMIUM'),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, featureType, requiredTier } = checkAccessSchema.parse(body)

    const accessCheck = await PremiumAccessService.checkPremiumAccess(
      userId, 
      featureType, 
      requiredTier
    )

    return NextResponse.json({
      success: true,
      ...accessCheck,
    })
  } catch (error) {
    console.error('Error checking premium access:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { 
        error: 'Failed to check premium access',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const featureType = searchParams.get('featureType') as any
    const requiredTier = (searchParams.get('requiredTier') as any) || 'PREMIUM'

    if (!userId || !featureType) {
      return NextResponse.json(
        { error: 'User ID and feature type are required' },
        { status: 400 }
      )
    }

    const validatedData = checkAccessSchema.parse({
      userId,
      featureType,
      requiredTier,
    })

    const accessCheck = await PremiumAccessService.checkPremiumAccess(
      validatedData.userId,
      validatedData.featureType,
      validatedData.requiredTier
    )

    return NextResponse.json({
      success: true,
      ...accessCheck,
    })
  } catch (error) {
    console.error('Error checking premium access:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request parameters', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { 
        error: 'Failed to check premium access',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}