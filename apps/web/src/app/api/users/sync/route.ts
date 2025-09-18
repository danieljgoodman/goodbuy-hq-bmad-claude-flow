import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  try {
    // Verify the user is authenticated
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await req.json()
    const { clerkId, email, name, imageUrl } = body

    // Verify the authenticated user is syncing their own data
    if (userId !== clerkId) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      )
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { clerkId },
    })

    if (existingUser) {
      // Update existing user
      const updatedUser = await prisma.user.update({
        where: { clerkId },
        data: {
          email,
          name,
          imageUrl,
        },
      })

      return NextResponse.json(updatedUser)
    }

    // Create new user
    const newUser = await prisma.user.create({
      data: {
        clerkId,
        email,
        name,
        imageUrl,
        subscriptionTier: 'BASIC',
        subscriptionStatus: 'ACTIVE',
      },
    })

    return NextResponse.json(newUser)
  } catch (error) {
    console.error('Error syncing user:', error)
    return NextResponse.json(
      { error: 'Failed to sync user' },
      { status: 500 }
    )
  }
}