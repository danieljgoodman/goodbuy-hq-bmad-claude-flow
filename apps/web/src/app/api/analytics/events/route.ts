import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const EventSchema = z.object({
  userId: z.string().optional(),
  sessionId: z.string().min(1).max(100),
  event_type: z.string().min(1).max(50),
  event_name: z.string().min(1).max(100),
  properties: z.record(z.any()).default({}),
  page_url: z.string().url().optional(),
  referrer: z.string().url().optional(),
  user_agent: z.string().max(500).optional(),
  timestamp: z.string().datetime(),
  funnel_step: z.string().max(50).optional(),
  experiment_variant: z.string().max(50).optional()
})

const EventBatchSchema = z.object({
  events: z.array(EventSchema).min(1).max(50) // Limit batch size to prevent DoS
})

const EventQuerySchema = z.object({
  start_date: z.string().datetime().optional(),
  end_date: z.string().datetime().optional(),
  event_type: z.string().max(50).optional(),
  limit: z.coerce.number().min(1).max(1000).default(100)
})

const rateLimitMap = new Map<string, { count: number; lastReset: number }>()

function checkRateLimit(userId: string): boolean {
  const now = Date.now()
  const windowMs = 60000 // 1 minute
  const maxRequests = 100 // Max 100 events per minute per user

  const userLimit = rateLimitMap.get(userId) || { count: 0, lastReset: now }
  
  if (now - userLimit.lastReset > windowMs) {
    userLimit.count = 0
    userLimit.lastReset = now
  }
  
  if (userLimit.count >= maxRequests) {
    return false
  }
  
  userLimit.count++
  rateLimitMap.set(userId, userLimit)
  return true
}

export async function POST(request: NextRequest) {
  try {
    // Authentication check
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = session.user.id

    // Rate limiting
    if (!checkRateLimit(userId)) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Maximum 100 events per minute.' },
        { status: 429 }
      )
    }

    const body = await request.json()
    
    // Input validation
    const validationResult = EventBatchSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: validationResult.error.issues },
        { status: 400 }
      )
    }

    const { events } = validationResult.data

    // Sanitize and prepare events for database
    const sanitizedEvents = events.map(event => ({
      userId,
      sessionId: event.sessionId,
      eventType: event.event_type,
      eventName: event.event_name,
      properties: event.properties,
      pageUrl: event.page_url,
      referrer: event.referrer,
      userAgent: event.user_agent || request.headers.get('user-agent')?.substring(0, 500) || 'unknown',
      ipAddress: 'anonymized', // Hash/anonymize IP for privacy
      timestamp: new Date(event.timestamp),
      funnelStep: event.funnel_step,
      experimentVariant: event.experiment_variant
    }))

    // Batch insert events with database transaction
    await prisma.userEvent.createMany({
      data: sanitizedEvents,
      skipDuplicates: true
    })

    return NextResponse.json({ 
      success: true, 
      processed: sanitizedEvents.length 
    })

  } catch (error) {
    console.error('Failed to store events:', error)
    return NextResponse.json(
      { error: 'Failed to store events' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    // Authentication check
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    
    // Input validation
    const validationResult = EventQuerySchema.safeParse({
      start_date: searchParams.get('start_date'),
      end_date: searchParams.get('end_date'),
      event_type: searchParams.get('event_type'),
      limit: searchParams.get('limit')
    })

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: validationResult.error.issues },
        { status: 400 }
      )
    }

    const { start_date, end_date, event_type, limit } = validationResult.data
    const userId = session.user.id

    // Build where clause - only show user's own events
    const whereClause: any = {
      userId
    }

    if (start_date && end_date) {
      whereClause.timestamp = {
        gte: new Date(start_date),
        lte: new Date(end_date)
      }
    }

    if (event_type) {
      whereClause.eventType = event_type
    }

    const events = await prisma.userEvent.findMany({
      where: whereClause,
      orderBy: { timestamp: 'desc' },
      take: limit
    })

    return NextResponse.json({ 
      events,
      total: events.length
    }, {
      headers: {
        'Cache-Control': 'private, max-age=300', // 5 minutes cache
      }
    })

  } catch (error) {
    console.error('Failed to fetch events:', error)
    return NextResponse.json(
      { error: 'Failed to fetch events' },
      { status: 500 }
    )
  }
}