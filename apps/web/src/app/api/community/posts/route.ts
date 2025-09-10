import { NextRequest, NextResponse } from 'next/server'
import { getServerAuth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  try {
    const { userId } = getServerAuth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const search = searchParams.get('search')
    const category = searchParams.get('category')
    const type = searchParams.get('type')
    const sortBy = searchParams.get('sortBy') || 'recent'
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Build where clause
    const where: any = {
      moderation_status: 'approved'
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { content: { contains: search, mode: 'insensitive' } },
        { tags: { hasSome: [search] } }
      ]
    }

    if (category && category !== 'all') {
      where.category = category
    }

    if (type && type !== 'all') {
      where.type = type
    }

    // Build orderBy clause
    let orderBy: any = { updated_at: 'desc' }
    switch (sortBy) {
      case 'popular':
        orderBy = { upvotes: 'desc' }
        break
      case 'trending':
        // Simple trending based on recent activity and votes
        orderBy = [
          { upvotes: 'desc' },
          { reply_count: 'desc' },
          { updated_at: 'desc' }
        ]
        break
      case 'recent':
      default:
        orderBy = { updated_at: 'desc' }
        break
    }

    const posts = await prisma.communityPost.findMany({
      where,
      orderBy,
      take: limit,
      skip: offset,
      include: {
        replies: {
          take: 3,
          orderBy: { created_at: 'desc' },
          include: {
            // Include reply details if needed
          }
        }
      }
    })

    const total = await prisma.communityPost.count({ where })

    return NextResponse.json({
      posts,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total
      }
    })
  } catch (error) {
    console.error('Failed to fetch posts:', error)
    return NextResponse.json(
      { error: 'Failed to fetch posts' },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const { userId } = getServerAuth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const data = await req.json()
    const {
      title,
      content,
      category,
      type = 'discussion',
      tags = []
    } = data

    // Validate required fields
    if (!title || !content) {
      return NextResponse.json(
        { error: 'Title and content are required' },
        { status: 400 }
      )
    }

    const post = await prisma.communityPost.create({
      data: {
        userId,
        title,
        content,
        category: category || 'General',
        type,
        tags,
        upvotes: 0,
        downvotes: 0,
        view_count: 0,
        reply_count: 0,
        is_featured: false,
        is_moderated: false,
        moderation_status: 'pending' // Requires moderation approval
      }
    })

    return NextResponse.json({ post }, { status: 201 })
  } catch (error) {
    console.error('Failed to create post:', error)
    return NextResponse.json(
      { error: 'Failed to create post' },
      { status: 500 }
    )
  }
}