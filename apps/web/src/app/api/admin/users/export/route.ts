import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createClerkClient } from '@clerk/nextjs/server'

const clerkClient = createClerkClient({
  secretKey: process.env.CLERK_SECRET_KEY
})

// Admin middleware for role validation with Clerk
async function validateAdminAccess() {
  const { userId } = await auth()

  if (!userId) {
    return { error: 'Unauthorized', status: 401 }
  }

  try {
    // Get user from Clerk
    const clerkUser = await clerkClient.users.getUser(userId)
    // Check publicMetadata for role (as shown in your Clerk dashboard)
    const role = clerkUser.publicMetadata?.role as string || 'user'

    if (role !== 'admin' && role !== 'super_admin') {
      return { error: 'Admin access required', status: 403 }
    }

    return { userId, userRole: role }
  } catch (error) {
    console.error('Error validating admin access:', error)
    return { error: 'Failed to validate admin access', status: 500 }
  }
}


// Export users as CSV or JSON
export async function GET(request: NextRequest) {
  try {
    // Validate admin access
    const validation = await validateAdminAccess()
    if ('error' in validation) {
      return NextResponse.json(
        { error: validation.error },
        { status: validation.status }
      )
    }

    const { searchParams } = new URL(request.url)
    const format = searchParams.get('format') || 'csv'

    // Get all Clerk users
    const clerkUsers = await clerkClient.users.getUserList({
      limit: 500
    })

    // Transform Clerk users
    const users = clerkUsers.data.map(user => ({
      id: user.id,
      email: user.emailAddresses[0]?.emailAddress || '',
      businessName: user.publicMetadata?.businessName || '',
      industry: user.publicMetadata?.industry || '',
      subscriptionTier: user.publicMetadata?.tier || user.publicMetadata?.subscriptionTier || 'FREE',
      userRole: user.publicMetadata?.role || 'user',
      createdAt: new Date(user.createdAt).toISOString(),
      lastLoginAt: user.lastSignInAt ? new Date(user.lastSignInAt).toISOString() : '',
      firstName: user.firstName || '',
      lastName: user.lastName || ''
    }))

    if (format === 'json') {
      return NextResponse.json({ users, total: users.length })
    }

    // Generate CSV
    const headers = [
      'ID',
      'Email',
      'Business Name',
      'Industry',
      'Subscription Tier',
      'User Role',
      'Created At',
      'Last Login',
      'First Name',
      'Last Name'
    ]

    const csvRows = [
      headers.join(','),
      ...users.map(user => [
        user.id,
        `"${user.email}"`,
        `"${user.businessName}"`,
        `"${user.industry}"`,
        user.subscriptionTier,
        user.userRole,
        user.createdAt,
        user.lastLoginAt,
        `"${user.firstName}"`,
        `"${user.lastName}"`
      ].join(','))
    ]

    const csv = csvRows.join('\n')

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="users-export-${new Date().toISOString().split('T')[0]}.csv"`
      }
    })
  } catch (error) {
    console.error('Failed to export users:', error)
    return NextResponse.json(
      { error: 'Failed to export users' },
      { status: 500 }
    )
  }
}