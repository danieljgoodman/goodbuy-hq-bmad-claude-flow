import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  try {
    const { userId } = auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const search = searchParams.get('search')
    const category = searchParams.get('category')
    const difficulty = searchParams.get('difficulty')
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')
    const sortBy = searchParams.get('sortBy') || 'recent'

    // Build where clause
    const where: any = {}

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { tags: { hasSome: [search] } }
      ]
    }

    if (category && category !== 'all') {
      where.category = category
    }

    if (difficulty && difficulty !== 'all') {
      where.difficulty = difficulty
    }

    // Build orderBy clause
    let orderBy: any = { created_at: 'desc' }
    switch (sortBy) {
      case 'popular':
        orderBy = { view_count: 'desc' }
        break
      case 'duration':
        orderBy = { duration: 'asc' }
        break
      case 'recent':
      default:
        orderBy = { created_at: 'desc' }
        break
    }

    const videos = await prisma.videoContent.findMany({
      where,
      orderBy,
      take: limit,
      skip: offset,
      include: {
        chapters: {
          orderBy: { start_time: 'asc' }
        }
      }
    })

    const total = await prisma.videoContent.count({ where })

    // Get user's tutorial progress
    const progressData = await prisma.tutorialProgress.findMany({
      where: {
        userId,
        video_id: { in: videos.map(v => v.id) }
      }
    })

    const progressMap = progressData.reduce((acc, progress) => {
      acc[progress.video_id] = progress
      return acc
    }, {} as Record<string, any>)

    return NextResponse.json({
      videos,
      progress: progressMap,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total
      }
    })
  } catch (error) {
    console.error('Failed to fetch videos:', error)
    return NextResponse.json(
      { error: 'Failed to fetch videos' },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const { userId } = auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const data = await req.json()
    const {
      title,
      description,
      video_url,
      thumbnail_url,
      duration,
      category,
      tags,
      difficulty,
      transcript,
      chapters,
      premium_only = false
    } = data

    // Validate required fields
    if (!title || !description || !video_url || !duration || !category || !difficulty) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const video = await prisma.videoContent.create({
      data: {
        title,
        description,
        video_url,
        thumbnail_url,
        duration,
        category,
        tags: tags || [],
        difficulty,
        transcript,
        premium_only,
        view_count: 0,
        chapters: {
          create: chapters || []
        }
      },
      include: {
        chapters: true
      }
    })

    return NextResponse.json({ video }, { status: 201 })
  } catch (error) {
    console.error('Failed to create video:', error)
    return NextResponse.json(
      { error: 'Failed to create video' },
      { status: 500 }
    )
  }
}