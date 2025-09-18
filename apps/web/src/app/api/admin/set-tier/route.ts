import { NextRequest, NextResponse } from 'next/server'
import { clerkClient } from '@clerk/nextjs/server'
import { auth } from '@clerk/nextjs'
import { prisma } from '@/lib/prisma'

// Admin endpoint to set user subscription tier for testing
export async function POST(request: NextRequest) {
  try {
    // Check if current user is admin (you can add your own admin check logic)
    const { userId: adminId } = auth()
    if (!adminId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { userId, tier = 'professional', status = 'active' } = body

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 })
    }

    // Update Clerk metadata
    await clerkClient.users.updateUserMetadata(userId, {
      publicMetadata: {
        subscriptionTier: tier,
        subscriptionStatus: status,
        // Add test flag so we know this was set manually
        testMode: true,
        testSetAt: new Date().toISOString()
      }
    })

    // Also update in database if user exists
    const dbUser = await prisma.user.findUnique({
      where: { clerkId: userId }
    })

    if (dbUser) {
      await prisma.user.update({
        where: { clerkId: userId },
        data: {
          subscriptionTier: tier,
          subscriptionStatus: status
        }
      })
    }

    return NextResponse.json({
      success: true,
      message: `User ${userId} set to ${tier} tier`,
      tier,
      status
    })
  } catch (error) {
    console.error('Error setting tier:', error)
    return NextResponse.json(
      { error: 'Failed to set tier' },
      { status: 500 }
    )
  }
}

// GET endpoint to check current tier
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 })
    }

    // Get user from Clerk
    const user = await clerkClient.users.getUser(userId)
    const metadata = user.publicMetadata as any

    return NextResponse.json({
      userId,
      tier: metadata?.subscriptionTier || 'free',
      status: metadata?.subscriptionStatus || 'inactive',
      testMode: metadata?.testMode || false,
      testSetAt: metadata?.testSetAt
    })
  } catch (error) {
    console.error('Error getting tier:', error)
    return NextResponse.json(
      { error: 'Failed to get tier' },
      { status: 500 }
    )
  }
}