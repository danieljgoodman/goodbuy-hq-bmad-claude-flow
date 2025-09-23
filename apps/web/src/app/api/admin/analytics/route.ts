import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createClerkClient } from '@clerk/nextjs/server'

const clerkClient = createClerkClient({
  secretKey: process.env.CLERK_SECRET_KEY
})

// Admin middleware for role validation
async function validateAdminAccess() {
  const { userId } = await auth()

  if (!userId) {
    return { error: 'Unauthorized', status: 401 }
  }

  try {
    const clerkUser = await clerkClient.users.getUser(userId)
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

export async function GET() {
  try {
    // Validate admin access
    const validation = await validateAdminAccess()
    if ('error' in validation) {
      return NextResponse.json(
        { error: validation.error },
        { status: validation.status }
      )
    }

    // Get all users from Clerk
    const clerkUsers = await clerkClient.users.getUserList({
      limit: 500
    })

    // Calculate analytics based on real Clerk data
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const thisWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1)

    // Count users by creation date
    const totalUsers = clerkUsers.data.length
    const todayUsers = clerkUsers.data.filter(u =>
      new Date(u.createdAt) >= today
    ).length
    const thisWeekUsers = clerkUsers.data.filter(u =>
      new Date(u.createdAt) >= thisWeek
    ).length
    const thisMonthUsers = clerkUsers.data.filter(u =>
      new Date(u.createdAt) >= thisMonth
    ).length

    // Count by subscription tier
    const tierCounts = {
      FREE: 0,
      PREMIUM: 0,
      ENTERPRISE: 0
    }

    clerkUsers.data.forEach(user => {
      const tier = (user.publicMetadata?.tier || user.publicMetadata?.subscriptionTier || 'FREE') as string
      if (tier in tierCounts) {
        tierCounts[tier as keyof typeof tierCounts]++
      } else {
        tierCounts.FREE++
      }
    })

    // Calculate growth rate
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0)
    const lastMonthUsers = clerkUsers.data.filter(u => {
      const createdAt = new Date(u.createdAt)
      return createdAt >= lastMonth && createdAt <= lastMonthEnd
    }).length

    const growthRate = lastMonthUsers > 0
      ? ((thisMonthUsers - lastMonthUsers) / lastMonthUsers * 100).toFixed(1)
      : '0'

    // Calculate active users (logged in within last 30 days)
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    const activeUsers = clerkUsers.data.filter(u =>
      u.lastSignInAt && new Date(u.lastSignInAt) >= thirtyDaysAgo
    ).length

    // Calculate conversion rate (premium + enterprise / total)
    const conversionRate = totalUsers > 0
      ? ((tierCounts.PREMIUM + tierCounts.ENTERPRISE) / totalUsers * 100).toFixed(1)
      : '0'

    // Calculate monthly revenue (mock calculation based on tiers)
    const monthlyRevenue = (tierCounts.PREMIUM * 49) + (tierCounts.ENTERPRISE * 299)

    return NextResponse.json({
      overview: {
        totalUsers,
        activeToday: todayUsers,
        monthlyRevenue,
        systemHealth: 100 // Always healthy for now
      },
      userMetrics: {
        todayUsers,
        thisWeekUsers,
        thisMonthUsers,
        activeUsers,
        growthRate: parseFloat(growthRate)
      },
      subscriptions: {
        free: tierCounts.FREE,
        premium: tierCounts.PREMIUM,
        enterprise: tierCounts.ENTERPRISE,
        conversionRate: parseFloat(conversionRate)
      },
      evaluations: {
        today: 0, // Would need to pull from database
        thisWeek: 0,
        completionRate: 0
      },
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Failed to fetch analytics:', error)
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    )
  }
}