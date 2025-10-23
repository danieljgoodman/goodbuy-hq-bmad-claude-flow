import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getServerAuth } from '@/lib/clerk'
import { CustomerSuccessService } from '@/lib/services/CustomerSuccessService'

const completeStepSchema = z.object({
  stepName: z.string()
})

export async function GET(request: NextRequest) {
  try {
    const user = await getServerAuth()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const progress = await CustomerSuccessService.getOnboardingProgress(user.userId)

    return NextResponse.json({
      success: true,
      data: {
        progress
      }
    })
  } catch (error) {
    console.error('Error fetching onboarding progress:', error)
    return NextResponse.json(
      { error: 'Failed to fetch onboarding progress' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getServerAuth()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')

    if (action === 'initialize') {
      const progress = await CustomerSuccessService.initializePremiumOnboarding(user.userId)
      
      return NextResponse.json({
        success: true,
        data: {
          progress
        }
      })
    }

    if (action === 'complete-step') {
      const body = await request.json()
      const { stepName } = completeStepSchema.parse(body)

      const result = await CustomerSuccessService.completeOnboardingStep(
        user.userId,
        stepName
      )

      return NextResponse.json({
        success: true,
        data: result
      })
    }

    return NextResponse.json(
      { error: 'Invalid action parameter' },
      { status: 400 }
    )
  } catch (error: any) {
    console.error('Error managing onboarding:', error)
    
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Invalid input data', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to manage onboarding' },
      { status: 500 }
    )
  }
}