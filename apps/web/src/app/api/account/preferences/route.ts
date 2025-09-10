import { NextRequest, NextResponse } from 'next/server'
import { AccountService } from '@/lib/services/AccountService'

const accountService = new AccountService()

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json(
        { error: 'Missing required parameter: userId' },
        { status: 400 }
      )
    }

    const accountData = await accountService.getAccountData(userId)
    return NextResponse.json(accountData.preferences)
  } catch (error) {
    console.error('Preferences fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch preferences' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, type, ...updates } = body

    if (!userId) {
      return NextResponse.json(
        { error: 'Missing required field: userId' },
        { status: 400 }
      )
    }

    let preferences
    
    switch (type) {
      case 'notifications':
        preferences = await accountService.updateNotificationPreferences(userId, updates.notifications)
        break
      case 'privacy':
        preferences = await accountService.updatePrivacyPreferences(userId, updates.privacy)
        break
      case 'dashboard':
        preferences = await accountService.updateDashboardPreferences(userId, updates.dashboard)
        break
      default:
        preferences = await accountService.updatePreferences(userId, updates)
    }

    return NextResponse.json(preferences)
  } catch (error) {
    console.error('Preferences update error:', error)
    return NextResponse.json(
      { error: 'Failed to update preferences' },
      { status: 500 }
    )
  }
}