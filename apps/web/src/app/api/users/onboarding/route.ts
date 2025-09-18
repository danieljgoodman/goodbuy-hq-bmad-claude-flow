import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs'
import { prisma } from '@/lib/prisma'
import { clerkClient } from '@clerk/nextjs/server'

export async function POST(request: NextRequest) {
  try {
    const { userId } = auth()

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      businessName,
      industry,
      employeeCountRange,
      revenueRange,
      businessModel,
      yearsInOperation,
      websiteUrl,
      businessAddress,
      businessPhone,
      referralSource,
      linkedinUrl
    } = body

    // Update user in database
    const user = await prisma.user.update({
      where: { clerkId: userId },
      data: {
        businessName,
        industry,
        employeeCountRange,
        revenueRange,
        businessModel,
        yearsInOperation: yearsInOperation ? parseInt(yearsInOperation) : null,
        websiteUrl,
        businessAddress: businessAddress || null,
        businessPhone,
        referralSource,
        linkedinUrl,
        registrationCompleted: true,
        registrationStep: 4 // All steps completed
      }
    })

    // Update Clerk metadata
    await clerkClient.users.updateUserMetadata(userId, {
      publicMetadata: {
        onboardingCompleted: true,
        businessName,
        industry,
        subscriptionTier: user.subscriptionTier || 'free'
      }
    })

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        clerkId: user.clerkId,
        businessName: user.businessName,
        industry: user.industry,
        subscriptionTier: user.subscriptionTier
      }
    })
  } catch (error) {
    console.error('Onboarding error:', error)
    return NextResponse.json(
      { error: 'Failed to save onboarding data' },
      { status: 500 }
    )
  }
}