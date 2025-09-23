import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createClerkClient } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { UserRole } from '@prisma/client'

const clerkClient = createClerkClient({
  secretKey: process.env.CLERK_SECRET_KEY
})

// Admin middleware for role validation with Clerk
async function validateAdminAccess() {
  const { userId } = await auth()

  console.log('🔐 Admin validation - userId:', userId)

  if (!userId) {
    return { error: 'Unauthorized', status: 401 }
  }

  try {
    // Get user from Clerk
    const clerkUser = await clerkClient.users.getUser(userId)

    // Debug: Log the metadata
    console.log('👤 User metadata:', {
      publicMetadata: clerkUser.publicMetadata,
      privateMetadata: clerkUser.privateMetadata,
      email: clerkUser.emailAddresses[0]?.emailAddress
    })

    // Check publicMetadata for role (as shown in your Clerk dashboard)
    const role = clerkUser.publicMetadata?.role as string || 'user'

    console.log('🎭 User role:', role)

    if (role !== 'admin' && role !== 'super_admin') {
      console.log('❌ Access denied - role is not admin or super_admin')
      return { error: 'Admin access required', status: 403 }
    }

    console.log('✅ Admin access granted')
    return { userId, userRole: role as UserRole }
  } catch (error) {
    console.error('Error validating admin access:', error)
    return { error: 'Failed to validate admin access', status: 500 }
  }
}

// Get paginated user list with search and filters
export async function GET(request: NextRequest) {
  try {
    console.log('📋 Admin users API called')

    // Validate admin access with Clerk
    const validation = await validateAdminAccess()
    if ('error' in validation) {
      console.log('🚫 Validation failed:', validation)
      return NextResponse.json(
        { error: validation.error },
        { status: validation.status }
      )
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100)
    const search = searchParams.get('search') || ''
    const tier = searchParams.get('tier')
    const industry = searchParams.get('industry')

    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    
    console.log('🔧 DEBUG MODE: Admin users API called')
    console.log('🔍 Query params:', { page, limit, search, tier, industry, startDate, endDate })

    // Build where clause for filters
    const where: any = {}
    
    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { businessName: { contains: search, mode: 'insensitive' } },
        { industry: { contains: search, mode: 'insensitive' } }
      ]
    }

    if (tier) {
      // Convert PREMIUM -> premium for database lookup
      where.subscriptionTier = tier.toLowerCase()
    }

    if (industry) {
      where.industry = { contains: industry, mode: 'insensitive' }
    }

    if (startDate || endDate) {
      where.createdAt = {}
      if (startDate) where.createdAt.gte = new Date(startDate)
      if (endDate) where.createdAt.lte = new Date(endDate)
    }

    const skip = (page - 1) * limit

    // Get Clerk users with pagination and filters
    console.log('🔍 Fetching users from Clerk with filters:', { search, tier, industry, startDate, endDate })

    try {
      // Get all Clerk users (we'll filter in memory for now)
      const clerkUsers = await clerkClient.users.getUserList({
        limit: 500, // Get more users to filter
        offset: 0
      })

      // Transform and filter Clerk users
      let transformedUsers = clerkUsers.data.map(user => ({
        id: user.id,
        email: user.emailAddresses[0]?.emailAddress || '',
        businessName: user.publicMetadata?.businessName as string || user.organizationMemberships?.[0]?.organization?.name || '',
        industry: user.publicMetadata?.industry as string || '',
        userRole: (user.publicMetadata?.role as string) || 'user',
        subscriptionTier: (user.publicMetadata?.tier as string || user.publicMetadata?.subscriptionTier as string) || 'FREE',
        createdAt: user.createdAt,
        lastLoginAt: user.lastSignInAt,
        firstName: user.firstName,
        lastName: user.lastName,
        imageUrl: user.imageUrl
      }))

      // Apply filters
      if (search) {
        const searchLower = search.toLowerCase()
        transformedUsers = transformedUsers.filter(user =>
          user.email.toLowerCase().includes(searchLower) ||
          user.businessName.toLowerCase().includes(searchLower) ||
          user.industry.toLowerCase().includes(searchLower) ||
          (user.firstName + ' ' + user.lastName).toLowerCase().includes(searchLower)
        )
      }

      if (tier && tier !== 'all') {
        transformedUsers = transformedUsers.filter(user =>
          user.subscriptionTier.toUpperCase() === tier.toUpperCase()
        )
      }

      if (industry) {
        transformedUsers = transformedUsers.filter(user =>
          user.industry.toLowerCase().includes(industry.toLowerCase())
        )
      }

      if (startDate || endDate) {
        const start = startDate ? new Date(startDate).getTime() : 0
        const end = endDate ? new Date(endDate).getTime() : Date.now()
        transformedUsers = transformedUsers.filter(user => {
          const userDate = user.createdAt
          return userDate >= start && userDate <= end
        })
      }

      const total = transformedUsers.length

      // Apply pagination
      const paginatedUsers = transformedUsers.slice(skip, skip + limit)

      console.log('✅ Clerk users fetched:', { usersCount: paginatedUsers.length, totalCount: total, appliedFilters: { search, tier, industry, startDate, endDate } })

      return NextResponse.json({
        users: paginatedUsers,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      })
    } catch (queryError) {
      console.error('❌ Database Query Error:', queryError)
      throw queryError
    }
  } catch (error) {
    console.error('Failed to fetch users:', error)
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    )
  }
}