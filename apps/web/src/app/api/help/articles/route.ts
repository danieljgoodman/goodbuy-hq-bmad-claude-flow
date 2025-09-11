import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const HelpArticleQuerySchema = z.object({
  search: z.string().max(100).optional(),
  category: z.string().max(50).optional(),
  difficulty: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
  type: z.enum(['article', 'faq', 'tutorial', 'guide']).optional(),
  limit: z.coerce.number().min(1).max(100).default(20),
  offset: z.coerce.number().min(0).default(0),
  sortBy: z.enum(['recent', 'popular', 'helpful']).default('recent')
})

const CreateArticleSchema = z.object({
  title: z.string().min(1).max(200),
  content: z.string().min(10).max(50000),
  category: z.string().min(1).max(50),
  subcategory: z.string().max(50).optional(),
  type: z.enum(['article', 'faq', 'tutorial', 'guide']),
  difficulty: z.enum(['beginner', 'intermediate', 'advanced']),
  tags: z.array(z.string().max(30)).max(10).default([]),
  premium_only: z.boolean().default(false)
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
    const validationResult = HelpArticleQuerySchema.safeParse({
      search: searchParams.get('search'),
      category: searchParams.get('category'),
      difficulty: searchParams.get('difficulty'),
      type: searchParams.get('type'),
      limit: searchParams.get('limit'),
      offset: searchParams.get('offset'),
      sortBy: searchParams.get('sortBy')
    })

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: validationResult.error.issues },
        { status: 400 }
      )
    }

    const { search, category, difficulty, type, limit, offset, sortBy } = validationResult.data

    // Build where clause
    const where: any = {
      status: 'published'
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

    if (difficulty && difficulty !== 'all') {
      where.difficulty = difficulty
    }

    if (type && type !== 'all') {
      where.type = type
    }

    // Build orderBy clause
    let orderBy: any = { last_updated: 'desc' }
    switch (sortBy) {
      case 'popular':
        orderBy = { view_count: 'desc' }
        break
      case 'helpful':
        orderBy = { helpful_votes: 'desc' }
        break
      case 'recent':
      default:
        orderBy = { last_updated: 'desc' }
        break
    }

    const articles = await prisma.helpContent.findMany({
      where,
      orderBy,
      take: limit,
      skip: offset,
      select: {
        id: true,
        title: true,
        content: true,
        category: true,
        subcategory: true,
        type: true,
        difficulty: true,
        tags: true,
        related_articles: true,
        view_count: true,
        helpful_votes: true,
        premium_only: true,
        last_updated: true,
        author: true,
        created_at: true,
        updated_at: true
      }
    })

    const total = await prisma.helpContent.count({ where })

    return NextResponse.json({
      articles,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total
      }
    }, {
      headers: {
        'Cache-Control': 'private, max-age=300', // 5 minutes cache
      }
    })
  } catch (error) {
    console.error('Failed to fetch articles:', error)
    return NextResponse.json(
      { error: 'Failed to fetch articles' },
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
    const validationResult = CreateArticleSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: validationResult.error.issues },
        { status: 400 }
      )
    }

    const { title, content, category, subcategory, type, difficulty, tags, premium_only } = validationResult.data

    const article = await prisma.helpContent.create({
      data: {
        title,
        content,
        category,
        subcategory,
        type,
        difficulty,
        tags: tags || [],
        premium_only,
        author: session.user.email || 'User',
        status: 'draft', // Admin approval required
        view_count: 0,
        helpful_votes: 0
      }
    })

    return NextResponse.json({ article }, { status: 201 })
  } catch (error) {
    console.error('Failed to create article:', error)
    return NextResponse.json(
      { error: 'Failed to create article' },
      { status: 500 }
    )
  }
}