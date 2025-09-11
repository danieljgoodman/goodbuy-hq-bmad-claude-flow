import { NextResponse } from 'next/server'

// User account preferences API route
export async function GET() {
  try {
    // Return default preferences for now
    return NextResponse.json({
      notifications: true,
      marketingEmails: false,
      theme: 'light',
      timezone: 'UTC'
    })
  } catch (error) {
    console.error('Error fetching user preferences:', error)
    return NextResponse.json(
      { error: 'Failed to fetch preferences' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    
    // Here you would normally save to database
    console.log('Updating user preferences:', body)
    
    return NextResponse.json({ 
      success: true,
      message: 'Preferences updated successfully' 
    })
  } catch (error) {
    console.error('Error updating user preferences:', error)
    return NextResponse.json(
      { error: 'Failed to update preferences' },
      { status: 500 }
    )
  }
}
