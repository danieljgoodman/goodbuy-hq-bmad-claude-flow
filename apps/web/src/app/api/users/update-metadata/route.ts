import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs'
import { clerkClient } from '@clerk/nextjs/server'

export async function POST(request: NextRequest) {
  try {
    const { userId } = auth()

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()

    // Update Clerk user public metadata
    await clerkClient.users.updateUserMetadata(userId, {
      publicMetadata: body
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Update metadata error:', error)
    return NextResponse.json(
      { error: 'Failed to update user metadata' },
      { status: 500 }
    )
  }
}