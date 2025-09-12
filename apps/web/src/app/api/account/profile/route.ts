import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    // Skip during build completely - this prevents any imports during static generation
    if (process.env.VERCEL_ENV || (!process.env.DATABASE_URL && process.env.NODE_ENV !== 'development')) {
      return NextResponse.json(
        { error: 'Service temporarily unavailable during build' },
        { status: 503 }
      )
    }

    // Only import and use services when actually serving requests
    const { getServerSession } = await import('next-auth/next')
    const { authOptions } = await import('@/lib/auth')
    
    // Authentication check
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const userId = session.user.id

    // Dynamic import to prevent build-time issues
    const { AccountService } = await import('@/lib/services/AccountService')
    const accountService = new AccountService()
    const accountData = await accountService.getAccountData(userId)
    
    return NextResponse.json(accountData.profile)
  } catch (error) {
    console.error('Profile fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch profile' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    // Skip during build completely - this prevents any imports during static generation
    if (process.env.VERCEL_ENV || (!process.env.DATABASE_URL && process.env.NODE_ENV !== 'development')) {
      return NextResponse.json(
        { error: 'Service temporarily unavailable during build' },
        { status: 503 }
      )
    }

    // Only import and use services when actually serving requests
    const { getServerSession } = await import('next-auth/next')
    const { authOptions } = await import('@/lib/auth')
    const { z } = await import('zod')
    
    // Authentication check
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Dynamic schema definition
    const ProfileUpdateSchema = z.object({
      firstName: z.string().min(1).max(50).optional(),
      lastName: z.string().min(1).max(50).optional(),
      phone: z.string().regex(/^\+?[1-9]\d{1,14}$/).optional(),
      avatar: z.string().url().optional(),
      businessSize: z.enum(['1-10', '11-50', '51-200', '201-1000', '1000+']).optional(),
      timezone: z.string().min(1).max(50).optional(),
      language: z.string().min(2).max(10).optional()
    })

    const body = await request.json()
    
    // Input validation
    const validationResult = ProfileUpdateSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: validationResult.error.issues },
        { status: 400 }
      )
    }

    const userId = session.user.id
    const updates = validationResult.data

    // Dynamic import to prevent build-time issues
    const { AccountService } = await import('@/lib/services/AccountService')
    const accountService = new AccountService()
    const profile = await accountService.updateProfile(userId, updates)
    
    return NextResponse.json(profile, {
      headers: {
        'Cache-Control': 'private, no-cache',
      }
    })
  } catch (error) {
    console.error('Profile update error:', error)
    return NextResponse.json(
      { error: 'Failed to update profile' },
      { status: 500 }
    )
  }
}