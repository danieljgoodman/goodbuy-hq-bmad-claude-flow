import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/auth/registration-progress - Get user's registration progress
export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userProfile = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        registrationCompleted: true,
        registrationStep: true,
        businessAddress: true,
        businessPhone: true,
        yearsInOperation: true,
        employeeCountRange: true,
        revenueRange: true,
        businessModel: true,
        websiteUrl: true,
        linkedinUrl: true,
        referralSource: true,
      },
    })

    if (!userProfile) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 })
    }

    return NextResponse.json({
      registrationCompleted: userProfile.registrationCompleted,
      currentStep: userProfile.registrationStep,
      data: {
        businessAddress: userProfile.businessAddress,
        businessPhone: userProfile.businessPhone,
        yearsInOperation: userProfile.yearsInOperation,
        employeeCountRange: userProfile.employeeCountRange,
        revenueRange: userProfile.revenueRange,
        businessModel: userProfile.businessModel,
        websiteUrl: userProfile.websiteUrl,
        linkedinUrl: userProfile.linkedinUrl,
        referralSource: userProfile.referralSource,
      },
    })
  } catch (error) {
    console.error('Error fetching registration progress:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT /api/auth/registration-progress - Update user's registration progress
export async function PUT(req: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const {
      registrationStep,
      businessAddress,
      businessPhone,
      yearsInOperation,
      employeeCountRange,
      revenueRange,
      businessModel,
      websiteUrl,
      linkedinUrl,
      referralSource,
      registrationCompleted,
    } = body

    const updateData: any = {
      updatedAt: new Date(),
    }

    // Only update provided fields
    if (typeof registrationStep === 'number') {
      updateData.registrationStep = registrationStep
    }
    
    if (businessAddress !== undefined) {
      updateData.businessAddress = businessAddress
    }
    
    if (businessPhone !== undefined) {
      updateData.businessPhone = businessPhone
    }
    
    if (typeof yearsInOperation === 'number') {
      updateData.yearsInOperation = yearsInOperation
    }
    
    if (employeeCountRange !== undefined) {
      updateData.employeeCountRange = employeeCountRange
    }
    
    if (revenueRange !== undefined) {
      updateData.revenueRange = revenueRange
    }
    
    if (businessModel !== undefined) {
      updateData.businessModel = businessModel
    }
    
    if (websiteUrl !== undefined) {
      updateData.websiteUrl = websiteUrl
    }
    
    if (linkedinUrl !== undefined) {
      updateData.linkedinUrl = linkedinUrl
    }
    
    if (referralSource !== undefined) {
      updateData.referralSource = referralSource
    }
    
    if (typeof registrationCompleted === 'boolean') {
      updateData.registrationCompleted = registrationCompleted
    }

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: updateData,
      select: {
        registrationCompleted: true,
        registrationStep: true,
      },
    })

    return NextResponse.json({
      success: true,
      registrationCompleted: updatedUser.registrationCompleted,
      currentStep: updatedUser.registrationStep,
    })
  } catch (error) {
    console.error('Error updating registration progress:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}