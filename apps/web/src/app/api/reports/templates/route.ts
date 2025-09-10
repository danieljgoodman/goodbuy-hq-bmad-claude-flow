import { NextRequest, NextResponse } from 'next/server'

// Simplified report templates without complex dependencies
const reportTemplates = [
  {
    id: 'executive',
    name: 'Executive Summary',
    description: 'High-level overview for senior leadership',
    audience: 'C-Suite, Board Members',
    sections: ['summary', 'trends', 'recommendations'],
    defaultSettings: {
      includeCharts: true,
      confidentialityLevel: 'confidential',
      pageLimit: 10
    }
  },
  {
    id: 'investor',
    name: 'Investor Report',
    description: 'Comprehensive analysis for investors and stakeholders',
    audience: 'Investors, Stakeholders',
    sections: ['summary', 'trends', 'improvements', 'charts', 'appendix'],
    defaultSettings: {
      includeCharts: true,
      confidentialityLevel: 'restricted',
      pageLimit: 25
    }
  },
  {
    id: 'comprehensive',
    name: 'Comprehensive Analysis',
    description: 'Detailed report with all available data and insights',
    audience: 'Internal Team, Consultants',
    sections: ['summary', 'trends', 'improvements', 'charts', 'recommendations', 'appendix'],
    defaultSettings: {
      includeCharts: true,
      confidentialityLevel: 'public',
      pageLimit: 50
    }
  },
  {
    id: 'custom',
    name: 'Custom Report',
    description: 'Tailored report with selected sections',
    audience: 'Various',
    sections: [], // User-defined
    defaultSettings: {
      includeCharts: true,
      confidentialityLevel: 'public',
      pageLimit: 30
    }
  }
]

export async function GET(request: NextRequest) {
  try {
    return NextResponse.json({
      success: true,
      templates: reportTemplates
    })
  } catch (error) {
    console.error('Error getting report templates:', error)
    
    return NextResponse.json(
      { 
        error: 'Failed to get report templates',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}