import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// Admin middleware for role validation
async function validateAdminAccess(session: any) {
  if (!session?.user?.id) {
    return { error: 'Unauthorized', status: 401 }
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { userRole: true }
  })

  if (!user || (user.userRole !== 'admin' && user.userRole !== 'super_admin')) {
    return { error: 'Admin access required', status: 403 }
  }

  return { adminUser: session.user, userRole: user.userRole }
}

// Log admin action for audit trail
async function logAdminAction(adminUserId: string, action: string) {
  try {
    await prisma.userAdminAction.create({
      data: {
        adminUserId,
        targetUserId: adminUserId, // Self-reference for export actions
        action,
        oldValues: null,
        newValues: null
      }
    })
  } catch (error) {
    console.error('Failed to log admin action:', error)
  }
}

// Export user data as CSV
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const validation = await validateAdminAccess(session)
    
    if ('error' in validation) {
      return NextResponse.json(
        { error: validation.error }, 
        { status: validation.status }
      )
    }

    const { searchParams } = new URL(request.url)
    const format = searchParams.get('format') || 'csv'

    if (format !== 'csv' && format !== 'json') {
      return NextResponse.json(
        { error: 'Invalid format. Supported formats: csv, json' },
        { status: 400 }
      )
    }

    // Get all users with evaluation counts
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        businessName: true,
        industry: true,
        subscriptionTier: true,
        userRole: true,
        createdAt: true,
        lastLoginAt: true,
        _count: {
          select: {
            evaluations: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    // Log export action
    await logAdminAction(validation.adminUser.id, `User data export (${format}, ${users.length} users)`)

    if (format === 'json') {
      return NextResponse.json({ 
        users,
        exportedAt: new Date().toISOString(),
        exportedBy: validation.adminUser.id,
        totalUsers: users.length
      })
    }

    // Generate CSV
    const headers = [
      'ID',
      'Email',
      'Business Name',
      'Industry',
      'Subscription Tier',
      'User Role',
      'Join Date',
      'Last Login',
      'Evaluations Count'
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
        user.createdAt.toISOString().split('T')[0],
        user.lastLoginAt ? user.lastLoginAt.toISOString().split('T')[0] : 'Never',
        user._count.evaluations
      ].join(','))
    ]

    const csvContent = csvRows.join('\n')

    console.log(`✅ Admin ${validation.adminUser.id} exported ${users.length} users as ${format}`)

    return new Response(csvContent, {
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