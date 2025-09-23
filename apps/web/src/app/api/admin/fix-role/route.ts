import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createClerkClient } from '@clerk/nextjs/server'

const clerkClient = createClerkClient({
  secretKey: process.env.CLERK_SECRET_KEY
})

// Temporary endpoint to fix role back to super_admin
export async function POST() {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    // Get current user metadata
    const user = await clerkClient.users.getUser(userId)
    const currentMetadata = user.publicMetadata || {}

    // Fix the role back to super_admin while preserving other metadata
    const updatedUser = await clerkClient.users.updateUserMetadata(userId, {
      publicMetadata: {
        ...currentMetadata,
        role: 'super_admin' // Restore super_admin role
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Role restored to super_admin',
      userId: updatedUser.id,
      metadata: updatedUser.publicMetadata
    })
  } catch (error) {
    console.error('Failed to fix role:', error)
    return NextResponse.json(
      { error: 'Failed to fix role' },
      { status: 500 }
    )
  }
}