import { NextRequest, NextResponse } from 'next/server'
import { MarketAlertRepository } from '@/lib/repositories/MarketAlertRepository'

const alertRepo = new MarketAlertRepository()

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const userId = searchParams.get('userId')
    const includeExpired = searchParams.get('includeExpired') === 'true'

    if (!userId) {
      return NextResponse.json(
        { error: 'Missing required parameter: userId' },
        { status: 400 }
      )
    }

    const alerts = await alertRepo.findByUserId(userId, includeExpired)
    return NextResponse.json(alerts)
  } catch (error) {
    console.error('Market alerts fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch market alerts' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, title, description, severity, category, triggerData, expiresAt } = body

    if (!userId || !title || !description || !severity || !category) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const alert = await alertRepo.create({
      userId,
      title,
      description,
      severity,
      category,
      triggerData: triggerData || {},
      actionable: true,
      dismissed: false,
      createdAt: new Date(),
      expiresAt: expiresAt ? new Date(expiresAt) : undefined
    })

    return NextResponse.json(alert, { status: 201 })
  } catch (error) {
    console.error('Market alert creation error:', error)
    return NextResponse.json(
      { error: 'Failed to create market alert' },
      { status: 500 }
    )
  }
}