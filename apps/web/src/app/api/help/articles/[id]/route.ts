import { NextRequest, NextResponse } from 'next/server'
import { getServerAuth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = getServerAuth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const article = await prisma.helpContent.findUnique({
      where: { id: params.id },
      include: {
        // Include related articles if needed
      }
    })

    if (!article) {
      return NextResponse.json({ error: 'Article not found' }, { status: 404 })
    }

    // Increment view count
    await prisma.helpContent.update({
      where: { id: params.id },
      data: { view_count: { increment: 1 } }
    })

    return NextResponse.json({ article })
  } catch (error) {
    console.error('Failed to fetch article:', error)
    return NextResponse.json(
      { error: 'Failed to fetch article' },
      { status: 500 }
    )
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = getServerAuth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const data = await req.json()
    const { title, content, category, subcategory, type, difficulty, tags } = data

    const article = await prisma.helpContent.update({
      where: { id: params.id },
      data: {
        title,
        content,
        category,
        subcategory,
        type,
        difficulty,
        tags,
        updated_at: new Date()
      }
    })

    return NextResponse.json({ article })
  } catch (error) {
    console.error('Failed to update article:', error)
    return NextResponse.json(
      { error: 'Failed to update article' },
      { status: 500 }
    )
  }
}