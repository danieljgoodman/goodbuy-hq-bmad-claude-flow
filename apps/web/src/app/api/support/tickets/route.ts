import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { SupportService } from '@/lib/services/SupportService'

const createTicketSchema = z.object({
  category: z.enum(['technical', 'billing', 'feature', 'onboarding']),
  subject: z.string().min(1).max(200),
  description: z.string().min(10).max(2000),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional()
})

const addResponseSchema = z.object({
  ticketId: z.string(),
  message: z.string().min(1).max(1000)
})

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { category, subject, description, priority } = createTicketSchema.parse(body)

    const ticket = await SupportService.createSupportTicket(session.user.id, {
      category,
      subject,
      description,
      priority
    })

    return NextResponse.json({
      success: true,
      data: {
        ticket
      }
    })
  } catch (error: any) {
    console.error('Error creating support ticket:', error)
    
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Invalid input data', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to create support ticket' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') as 'open' | 'in_progress' | 'resolved' | 'closed' | null
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 10
    const offset = searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : 0

    const result = await SupportService.getUserTickets(session.user.id, {
      status: status || undefined,
      limit,
      offset
    })

    return NextResponse.json({
      success: true,
      data: result
    })
  } catch (error) {
    console.error('Error fetching support tickets:', error)
    return NextResponse.json(
      { error: 'Failed to fetch support tickets' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { ticketId, message } = addResponseSchema.parse(body)

    const response = await SupportService.addTicketResponse(
      session.user.id,
      ticketId,
      message
    )

    return NextResponse.json({
      success: true,
      data: {
        response
      }
    })
  } catch (error: any) {
    console.error('Error adding ticket response:', error)
    
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Invalid input data', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to add ticket response' },
      { status: 500 }
    )
  }
}