import { TemplateService } from '@/lib/services/TemplateService'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    const filters = {
      category: searchParams.get('category') || undefined,
      templateType: (searchParams.get('templateType') as any) || undefined,
      difficulty: (searchParams.get('difficulty') as any) || undefined,
      industry: searchParams.get('industry') ? searchParams.get('industry')!.split(',') : undefined,
      tags: searchParams.get('tags') ? searchParams.get('tags')!.split(',') : undefined
    }

    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 50
    const search = searchParams.get('search')

    let templates
    if (search) {
      templates = await TemplateService.searchTemplates(search, filters)
    } else {
      templates = await TemplateService.getTemplates(filters, limit)
    }

    return NextResponse.json({
      success: true,
      templates
    })
  } catch (error) {
    console.error('Error getting templates:', error)
    
    return NextResponse.json(
      { 
        error: 'Failed to get templates',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    // Initialize seed templates for development
    const templates = await TemplateService.createSeedTemplates()

    return NextResponse.json({
      success: true,
      message: 'Seed templates created',
      templates
    })
  } catch (error) {
    console.error('Error creating seed templates:', error)
    
    return NextResponse.json(
      { 
        error: 'Failed to create seed templates',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}