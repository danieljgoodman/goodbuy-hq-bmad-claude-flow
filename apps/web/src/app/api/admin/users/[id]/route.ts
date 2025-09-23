import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createClerkClient } from '@clerk/nextjs/server'
import { UserRole } from '@prisma/client'

const clerkClient = createClerkClient({
  secretKey: process.env.CLERK_SECRET_KEY
})

// Admin middleware for role validation with Clerk
async function validateAdminAccess() {
  const { userId } = await auth()

  if (!userId) {
    return { error: 'Unauthorized', status: 401 }
  }

  // Get user from Clerk
  const clerkUser = await clerkClient.users.getUser(userId)
  // Check publicMetadata for role (as shown in your Clerk dashboard)
  const role = clerkUser.publicMetadata?.role as string || 'user'

  if (role !== 'admin' && role !== 'super_admin') {
    return { error: 'Admin access required', status: 403 }
  }

  return { userId, userRole: role as UserRole }
}

// Update user tier and role
export async function PATCH(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  const params = await props.params;
  try {
    // Validate admin access
    const validation = await validateAdminAccess()
    if ('error' in validation) {
      return NextResponse.json(
        { error: validation.error },
        { status: validation.status }
      )
    }

    const body = await request.json()
    const { subscriptionTier, userRole } = body

    // Get current user to preserve existing metadata
    const currentUser = await clerkClient.users.getUser(params.id)
    const currentMetadata = currentUser.publicMetadata || {}

    // Only update the fields that were actually sent in the request
    const updates: any = { ...currentMetadata }

    if (subscriptionTier !== undefined) {
      updates.tier = subscriptionTier
    }

    if (userRole !== undefined) {
      updates.role = userRole
    }

    // Update user in Clerk (only updating changed fields)
    const updatedUser = await clerkClient.users.updateUserMetadata(params.id, {
      publicMetadata: updates
    })

    // Transform Clerk user to match frontend format
    const transformedUser = {
      id: updatedUser.id,
      email: updatedUser.emailAddresses[0]?.emailAddress || '',
      businessName: updatedUser.publicMetadata?.businessName as string || '',
      industry: updatedUser.publicMetadata?.industry as string || '',
      subscriptionTier: subscriptionTier || 'FREE',
      userRole: userRole || 'user',
      createdAt: new Date(updatedUser.createdAt).toISOString(),
      lastLoginAt: updatedUser.lastSignInAt ? new Date(updatedUser.lastSignInAt).toISOString() : null
    }

    return NextResponse.json({ user: transformedUser })
  } catch (error) {
    console.error('Failed to update user:', error)
    return NextResponse.json(
      { error: 'Failed to update user' },
      { status: 500 }
    )
  }
}

// Get user details
export async function GET(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  const params = await props.params;
  try {
    // Validate admin access
    const validation = await validateAdminAccess()
    if ('error' in validation) {
      return NextResponse.json(
        { error: validation.error },
        { status: validation.status }
      )
    }

    // Get user from Clerk
    const user = await clerkClient.users.getUser(params.id)

    // Transform Clerk user to match frontend format
    const transformedUser = {
      id: user.id,
      email: user.emailAddresses[0]?.emailAddress || '',
      businessName: user.publicMetadata?.businessName as string || '',
      industry: user.publicMetadata?.industry as string || '',
      subscriptionTier: (user.publicMetadata?.tier as string || user.publicMetadata?.subscriptionTier as string) || 'FREE',
      userRole: user.publicMetadata?.role as string || 'user',
      createdAt: new Date(user.createdAt).toISOString(),
      lastLoginAt: user.lastSignInAt ? new Date(user.lastSignInAt).toISOString() : null,
      firstName: user.firstName,
      lastName: user.lastName,
      imageUrl: user.imageUrl
    }

    return NextResponse.json(transformedUser)
  } catch (error) {
    console.error('Failed to get user:', error)
    return NextResponse.json(
      { error: 'Failed to get user' },
      { status: 500 }
    )
  }
}
