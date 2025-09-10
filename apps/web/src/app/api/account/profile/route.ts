import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { AccountService } from '@/lib/services/AccountService'
import { z } from 'zod'

const accountService = new AccountService()

const ProfileUpdateSchema = z.object({
  firstName: z.string().min(1).max(50).optional(),
  lastName: z.string().min(1).max(50).optional(),
  phone: z.string().regex(/^\+?[1-9]\d{1,14}$/).optional(),
  avatar: z.string().url().optional(),
  businessSize: z.enum(['1-10', '11-50', '51-200', '201-1000', '1000+']).optional(),
  timezone: z.string().min(1).max(50).optional(),
  language: z.string().min(2).max(10).optional()
})

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
    // Authentication check
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

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