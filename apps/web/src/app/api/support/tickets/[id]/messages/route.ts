import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify user owns this ticket
    const ticket = await prisma.supportTicket.findFirst({
      where: {
        id: params.id,
        userId
      }
    })

    if (!ticket) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 })
    }

    const messages = await prisma.supportMessage.findMany({
      where: { ticket_id: params.id },
      orderBy: { timestamp: 'asc' }
    })

    return NextResponse.json({ messages })
  } catch (error) {
    console.error('Failed to fetch messages:', error)
    return NextResponse.json(
      { error: 'Failed to fetch messages' },
      { status: 500 }
    )
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify user owns this ticket
    const ticket = await prisma.supportTicket.findFirst({
      where: {
        id: params.id,
        userId
      }
    })

    if (!ticket) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 })
    }

    const data = await req.json()
    const { message, attachments = [] } = data

    if (!message) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      )
    }

    // Create message
    const newMessage = await prisma.supportMessage.create({
      data: {
        ticket_id: params.id,
        sender_id: userId,
        sender_type: 'user',
        message,
        timestamp: new Date(),
        attachments
      }
    })

    // Update ticket status and timestamp
    await prisma.supportTicket.update({
      where: { id: params.id },
      data: {
        status: 'waiting_response',
        updated_at: new Date()
      }
    })

    return NextResponse.json({ message: newMessage })
  } catch (error) {
    console.error('Failed to send message:', error)
    return NextResponse.json(
      { error: 'Failed to send message' },
      { status: 500 }
    )
  }
}