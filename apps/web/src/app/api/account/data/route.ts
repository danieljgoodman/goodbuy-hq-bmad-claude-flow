import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { AccountService } from '@/lib/services/AccountService'

const accountService = new AccountService()

export async function GET(request: NextRequest) {
  try {
    // Authentication check
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const userId = session.user.id

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