import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const TicketQuerySchema = z.object({
  search: z.string().max(100).optional(),
  status: z.enum(['open', 'in_progress', 'waiting_response', 'resolved', 'closed']).optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
  limit: z.coerce.number().min(1).max(50).default(20),
  offset: z.coerce.number().min(0).default(0)
})

const CreateTicketSchema = z.object({
  subject: z.string().min(1).max(200),
  description: z.string().min(10).max(5000),
  category: z.string().max(50).default('General'),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
  attachments: z.array(z.string()).max(5).default([])
})

export async function GET(req: NextRequest) {
  try {
    // Authentication check
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    
    // Input validation
    const validationResult = TicketQuerySchema.safeParse({
      search: searchParams.get('search'),
      status: searchParams.get('status'),
      priority: searchParams.get('priority'),
      limit: searchParams.get('limit'),
      offset: searchParams.get('offset')
    })

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: validationResult.error.issues },
        { status: 400 }
      )
    }

    const { search, status, priority, limit, offset } = validationResult.data
    const userId = session.user.id

    // Build where clause
    const where: any = {
      userId // Only show user's own tickets
    }

    if (search) {
      where.OR = [
        { subject: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { category: { contains: search, mode: 'insensitive' } }
      ]
    }

    if (status && status !== 'all') {
      where.status = status
    }

    if (priority && priority !== 'all') {
      where.priority = priority
    }

    const tickets = await prisma.supportTicket.findMany({
      where,
      orderBy: { updated_at: 'desc' },
      take: limit,
      skip: offset,
      include: {
        messages: {
          orderBy: { timestamp: 'asc' },
          take: 1 // Just get the first message for preview
        }
      }
    })

    const total = await prisma.supportTicket.count({ where })

    return NextResponse.json({
      tickets,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total
      }
    })
  } catch (error) {
    console.error('Failed to fetch tickets:', error)
    return NextResponse.json(
      { error: 'Failed to fetch tickets' },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    // Authentication check
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    
    // Input validation
    const validationResult = CreateTicketSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: validationResult.error.issues },
        { status: 400 }
      )
    }

    const { subject, description, category, priority, attachments } = validationResult.data
    const userId = session.user.id

    // Get user's subscription tier from database
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { subscriptionTier: true }
    })
    const subscriptionTier = user?.subscriptionTier || 'free'

    const ticket = await prisma.supportTicket.create({
      data: {
        userId,
        subject,
        description,
        category: category || 'General',
        priority,
        status: 'open',
        subscription_tier: subscriptionTier,
        messages: {
          create: {
            sender_id: userId,
            sender_type: 'user',
            message: description,
            timestamp: new Date(),
            attachments: attachments
          }
        }
      },
      include: {
        messages: true
      }
    })

    return NextResponse.json({ ticket }, { status: 201 })
  } catch (error) {
    console.error('Failed to create ticket:', error)
    return NextResponse.json(
      { error: 'Failed to create ticket' },
      { status: 500 }
    )
  }
}