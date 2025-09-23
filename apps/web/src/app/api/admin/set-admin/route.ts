import { NextResponse } from 'next/server'
import { auth, clerkClient } from '@clerk/nextjs/server'

// Temporary endpoint to set current user as admin
export async function POST() {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    // Update current user to be admin
    const updatedUser = await clerkClient.users.updateUserMetadata(userId, {
      privateMetadata: {
        role: 'admin',
        subscriptionTier: 'ENTERPRISE'
      },
      publicMetadata: {
        isAdmin: true
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Admin role set successfully',
      userId: updatedUser.id,
      metadata: {
        role: updatedUser.privateMetadata?.role,
        subscriptionTier: updatedUser.privateMetadata?.subscriptionTier
      }
    })
  } catch (error) {
    console.error('Failed to set admin role:', error)
    return NextResponse.json(
      { error: 'Failed to set admin role' },
      { status: 500 }
    )
  }
}