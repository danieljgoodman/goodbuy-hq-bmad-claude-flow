import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { VisualizationService } from '@/lib/services/VisualizationService'

const prisma = new PrismaClient()

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const dashboardId = searchParams.get('dashboardId')

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    const visualizationService = new VisualizationService(prisma)
    const configuration = await visualizationService.getDashboardConfiguration(userId, dashboardId || undefined)

    if (!configuration) {
      return NextResponse.json(
        { error: 'Dashboard configuration not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      configuration,
      metadata: {
        userId,
        dashboardId: configuration.dashboard_id,
        widgetCount: configuration.widgets.length,
        isDefault: configuration.is_default,
        lastUpdated: configuration.updatedAt
      }
    })

  } catch (error) {
    console.error('Error fetching dashboard configuration:', error)
    return NextResponse.json(
      { error: 'Failed to fetch dashboard configuration' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, dashboardId, widgets, layout, is_default, shared_with } = body

    if (!userId || !dashboardId) {
      return NextResponse.json(
        { error: 'Missing required fields: userId, dashboardId' },
        { status: 400 }
      )
    }

    const visualizationService = new VisualizationService(prisma)
    
    const updates: any = {}
    if (widgets !== undefined) updates.widgets = widgets
    if (layout !== undefined) updates.layout = layout
    if (is_default !== undefined) updates.is_default = is_default
    if (shared_with !== undefined) updates.shared_with = shared_with

    const updatedConfiguration = await visualizationService.updateDashboardConfiguration(
      userId,
      dashboardId,
      updates
    )

    return NextResponse.json({
      configuration: updatedConfiguration,
      message: 'Dashboard configuration updated successfully'
    })

  } catch (error) {
    console.error('Error updating dashboard configuration:', error)
    return NextResponse.json(
      { error: 'Failed to update dashboard configuration' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, dashboardId, widgets, layout, is_default, shared_with } = body

    if (!userId || !dashboardId) {
      return NextResponse.json(
        { error: 'Missing required fields: userId, dashboardId' },
        { status: 400 }
      )
    }

    // Create new dashboard configuration
    const configuration = await prisma.widgetConfiguration.create({
      data: {
        userId,
        dashboardId,
        widgets: widgets || [],
        layout: layout || 'grid',
        isDefault: is_default || false,
        sharedWith: shared_with || []
      }
    })

    return NextResponse.json({
      configuration: {
        id: configuration.id,
        userId: configuration.userId,
        dashboard_id: configuration.dashboardId,
        widgets: configuration.widgets,
        layout: configuration.layout,
        is_default: configuration.isDefault,
        shared_with: configuration.sharedWith,
        updatedAt: configuration.updatedAt
      },
      message: 'Dashboard configuration created successfully'
    })

  } catch (error) {
    console.error('Error creating dashboard configuration:', error)
    return NextResponse.json(
      { error: 'Failed to create dashboard configuration' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const dashboardId = searchParams.get('dashboardId')

    if (!userId || !dashboardId) {
      return NextResponse.json(
        { error: 'User ID and Dashboard ID are required' },
        { status: 400 }
      )
    }

    await prisma.widgetConfiguration.delete({
      where: {
        userId_dashboardId: {
          userId,
          dashboardId
        }
      }
    })

    return NextResponse.json({
      message: 'Dashboard configuration deleted successfully'
    })

  } catch (error) {
    console.error('Error deleting dashboard configuration:', error)
    return NextResponse.json(
      { error: 'Failed to delete dashboard configuration' },
      { status: 500 }
    )
  }
}