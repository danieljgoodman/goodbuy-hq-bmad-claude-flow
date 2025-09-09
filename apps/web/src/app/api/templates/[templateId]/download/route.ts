import { TemplateService } from '@/lib/services/TemplateService'
import { PremiumAccessService } from '@/lib/services/PremiumAccessService'
import { NextRequest, NextResponse } from 'next/server'

interface RouteParams {
  params: {
    templateId: string
  }
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    // Check premium access for template downloads
    const accessCheck = await PremiumAccessService.checkAIFeatureAccess(userId)
    if (!accessCheck.hasAccess) {
      return NextResponse.json(
        { 
          error: 'Premium subscription required',
          upgradeRequired: accessCheck.upgradeRequired
        },
        { status: 403 }
      )
    }

    const template = await TemplateService.downloadTemplate(params.templateId)

    // In production, this would return the actual file or a download URL
    return NextResponse.json({
      success: true,
      template: {
        id: template.id,
        name: template.name,
        content: template.content,
        variables: template.variables,
        instructions: template.instructions,
        downloadCount: template.downloadCount
      },
      downloadUrl: `/api/templates/${params.templateId}/content` // Mock URL
    })
  } catch (error) {
    console.error('Error downloading template:', error)
    
    return NextResponse.json(
      { 
        error: 'Failed to download template',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}