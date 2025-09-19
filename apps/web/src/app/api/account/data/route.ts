import { NextRequest, NextResponse } from 'next/server'
import { currentUser } from '@clerk/nextjs/server'
import { AccountService } from '@/lib/services/AccountService'

const accountService = new AccountService()

export async function GET(request: NextRequest) {
  try {
    // Authentication check
    const clerkUser = await currentUser()
    if (!clerkUser?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const userId = clerkUser.id

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