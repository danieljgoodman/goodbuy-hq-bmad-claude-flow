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
    
    return NextResponse.json(accountData, {
      headers: {
        'Cache-Control': 'private, no-cache',
      }
    })
  } catch (error) {
    console.error('Account data fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch account data' },
      { status: 500 }
    )
  }
}