import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'

// Lazy load AccountService to avoid build-time imports
let AccountService: any = null
let accountService: any = null

async function getAccountService() {
  if (!AccountService) {
    const { AccountService: AS } = await import('@/lib/services/AccountService')
    AccountService = AS
    accountService = new AccountService()
  }
  return accountService
}

export async function GET(request: NextRequest) {
  try {
    // Skip during build/static generation
    if (process.env.NODE_ENV === 'production' && !process.env.DATABASE_URL) {
      return NextResponse.json(
        { error: 'Service temporarily unavailable' },
        { status: 503 }
      )
    }

    // Authentication check
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const userId = session.user.id

    // Lazy load service to prevent build-time initialization
    const service = await getAccountService()
    const accountData = await service.getAccountData(userId)
    
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