import { NextRequest, NextResponse } from 'next/server'
import { getServerAuth } from '@/lib/clerk'
import { prisma } from '@/lib/prisma'
import { UserRole } from '@prisma/client'

// Admin middleware for role validation
async function validateAdminAccess() {
  const user = await getServerAuth()

  if (!user) {
    return { error: 'Unauthorized', status: 401 }
  }

  if (user.role !== 'admin' && user.role !== 'super_admin') {
    return { error: 'Admin access required', status: 403 }
  }

  return { user, userRole: user.role }
}

// Get paginated user list with search and filters
export async function GET(request: NextRequest) {
  try {
    // Authentication check
    const validation = await validateAdminAccess()
    if ('error' in validation) {
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

    // Use Prisma's safe query builder instead of raw SQL
    console.log('🔍 Building safe query with parameters:', { search, tier, industry, startDate, endDate })
    
    try {
      const [users, total] = await Promise.all([
        prisma.user.findMany({
          where,
          select: {
            id: true,
            email: true,
            businessName: true,
            industry: true,
            role: true,
            subscriptionTier: true,
            createdAt: true,
            lastLoginAt: true
          },
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit
        }),
        prisma.user.count({ where })
      ])
      
      console.log('✅ Safe query results:', { usersCount: users.length, totalCount: total, appliedFilters: { search, tier, industry, startDate, endDate } })
      
      return NextResponse.json({
        users,
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