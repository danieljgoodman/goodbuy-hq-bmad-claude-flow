/**
 * API Route to set user tier for testing purposes
 * This should be removed or secured in production
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth, clerkClient } from '@clerk/nextjs/server'

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { tier } = await req.json()

    if (!tier || !['free', 'professional', 'enterprise'].includes(tier)) {
      return NextResponse.json({ error: 'Invalid tier' }, { status: 400 })
    }

    const client = await clerkClient()

    // Update the user's public metadata with the new tier
    await client.users.updateUserMetadata(userId, {
      publicMetadata: {
        subscriptionTier: tier,
        subscriptionUpdatedAt: new Date().toISOString()
      }
    })

    return NextResponse.json({
      success: true,
      message: `Tier updated to ${tier}`,
      tier
    })
  } catch (error) {
    console.error('Error updating user tier:', error)
    return NextResponse.json(
      { error: 'Failed to update tier' },
      { status: 500 }
    )
  }
}

export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const client = await clerkClient()
    const user = await client.users.getUser(userId)

    return NextResponse.json({
      userId,
      publicMetadata: user.publicMetadata,
      unsafeMetadata: user.unsafeMetadata,
      currentTier: user.publicMetadata?.subscriptionTier || 'free'
    })
  } catch (error) {
    console.error('Error fetching user tier:', error)
    return NextResponse.json(
      { error: 'Failed to fetch tier' },
      { status: 500 }
    )
  }
}