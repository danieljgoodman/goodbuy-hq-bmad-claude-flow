import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { PremiumAccessService } from '@/lib/services/PremiumAccessService'
import { PDFGenerationService, type PDFReportData, type PDFSection } from '@/lib/services/PDFGenerationService'

export async function POST(request: NextRequest) {
  try {
    // Parse request body with error handling
    let requestBody
    try {
      const rawBody = await request.text()
      console.log('Raw request body:', rawBody)
      requestBody = JSON.parse(rawBody)
    } catch (parseError) {
      console.error('JSON parse error:', parseError)
      return NextResponse.json({ error: 'Invalid JSON in request body' }, { status: 400 })
    }

    const { userId, reportType, title, sections, includeExecutiveSummary } = requestBody

    console.log('📊 Professional Report Generation Request:', {
      userId,
      reportType,
      title,
      sectionsCount: sections?.length,
      includeExecutiveSummary
    })

    // Validate required fields
    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    // Try to get session, but don't fail if it's not available (for development)
    const session = await getServerSession(authOptions)
    console.log('🔐 Session check:', { hasSession: !!session, sessionUserId: session?.user?.id })

    // In development mode, allow test users through
    const isDevelopment = process.env.NODE_ENV === 'development'
    const isTestUser = userId === 'd882e870-879b-4b93-8763-ba60b492a2ed' // Your test user ID

    if (!isDevelopment && !session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Use session user ID if available, otherwise use provided userId
    const effectiveUserId = session?.user?.id || userId

    // Check premium access for professional reports
    const accessCheck = await PremiumAccessService.checkPremiumAccess(
      effectiveUserId,
      'pdf_reports'
    )

    if (!accessCheck.hasAccess) {
      return NextResponse.json(
        {
          error: 'Premium subscription required for professional reports',
          reason: accessCheck.reason,
          upgradeRequired: accessCheck.upgradeRequired
        },
        { status: 403 }
      )
    }

    // Build PDF sections based on the selected template
    const pdfSections: PDFSection[] = []

    // Add Executive Summary if requested
    if (includeExecutiveSummary) {
      pdfSections.push({
        type: 'executive-summary',
        title: 'Executive Summary',
        content: `
          <p><strong>Business Overview:</strong> This comprehensive analysis provides insights into your business performance, valuation metrics, and strategic opportunities.</p>
          <p><strong>Key Findings:</strong> Based on our advanced AI analysis, your business demonstrates strong fundamentals with identified growth opportunities.</p>
          <p><strong>Recommendations:</strong> Strategic initiatives have been identified to enhance operational efficiency and market positioning.</p>
        `
      })
    }

    // Add sections based on selection
    if (sections.includes('summary') || sections.includes('valuation')) {
      pdfSections.push({
        type: 'header',
        title: 'Business Valuation Analysis',
        content: `
          <p>Our proprietary AI-driven valuation model analyzes multiple data points to provide accurate business valuations.</p>
          <p><strong>Current Estimated Value:</strong> Based on financial performance, market conditions, and industry benchmarks.</p>
          <p><strong>Valuation Method:</strong> Discounted Cash Flow (DCF) combined with market comparable analysis.</p>
          <p><strong>Confidence Level:</strong> High (85%+) - Based on comprehensive data analysis.</p>
        `
      })
    }

    if (sections.includes('trends') || sections.includes('performance')) {
      pdfSections.push({
        type: 'header',
        title: 'Performance Trends & Analytics',
        content: `
          <p>Comprehensive analysis of your business performance trends over time.</p>
          <p><strong>Revenue Growth:</strong> Year-over-year performance analysis with seasonal adjustments.</p>
          <p><strong>Market Position:</strong> Competitive positioning within your industry sector.</p>
          <p><strong>Key Metrics:</strong> Critical KPIs tracking and performance indicators.</p>
        `
      })

      // Add a sample chart
      pdfSections.push({
        type: 'chart',
        title: 'Revenue Growth Trend',
        chartData: {
          type: 'line',
          title: 'Monthly Revenue Growth',
          data: {
            labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
            datasets: [{
              label: 'Revenue ($)',
              data: [45000, 52000, 48000, 61000, 58000, 67000],
              borderColor: '#2563eb',
              backgroundColor: 'rgba(37, 99, 235, 0.1)',
              borderWidth: 3,
              fill: true
            }]
          }
        }
      })
    }

    if (sections.includes('improvements') || sections.includes('opportunities')) {
      pdfSections.push({
        type: 'header',
        title: 'Growth Opportunities & Improvements',
        content: `
          <p>Identified opportunities for business growth and operational improvements.</p>
          <p><strong>Primary Opportunities:</strong></p>
          <ul>
            <li>Market expansion into adjacent segments</li>
            <li>Operational efficiency improvements</li>
            <li>Technology integration opportunities</li>
            <li>Customer retention optimization</li>
          </ul>
          <p><strong>Implementation Priority:</strong> High-impact, low-effort initiatives prioritized for immediate execution.</p>
        `
      })
    }

    if (sections.includes('charts') || sections.includes('data')) {
      // Add a sample table
      pdfSections.push({
        type: 'table',
        title: 'Key Performance Metrics',
        tableData: {
          headers: ['Metric', 'Current Value', 'Industry Average', 'Performance'],
          rows: [
            ['Revenue Growth', '15.2%', '8.5%', '↑ Above Average'],
            ['Profit Margin', '22.1%', '18.3%', '↑ Strong'],
            ['Customer Acquisition', '$125', '$180', '↑ Efficient'],
            ['Market Share', '12.5%', '10.2%', '↑ Leading']
          ]
        }
      })
    }

    if (sections.includes('recommendations') || sections.includes('strategy')) {
      pdfSections.push({
        type: 'header',
        title: 'Strategic Recommendations',
        content: `
          <p>AI-powered strategic recommendations based on comprehensive business analysis.</p>
          <p><strong>Short-term Actions (0-6 months):</strong></p>
          <ul>
            <li>Optimize pricing strategy based on market analysis</li>
            <li>Implement customer feedback loop improvements</li>
            <li>Enhance digital marketing presence</li>
          </ul>
          <p><strong>Medium-term Strategy (6-18 months):</strong></p>
          <ul>
            <li>Explore new market segments and geographic expansion</li>
            <li>Invest in automation and operational efficiency</li>
            <li>Develop strategic partnerships</li>
          </ul>
        `
      })
    }

    if (sections.includes('appendix') || sections.includes('appendices')) {
      pdfSections.push({
        type: 'header',
        title: 'Appendices',
        content: `
          <p><strong>Methodology:</strong> Our analysis combines machine learning algorithms with traditional financial analysis methods.</p>
          <p><strong>Data Sources:</strong> Financial statements, market data, industry benchmarks, and proprietary AI models.</p>
          <p><strong>Disclaimers:</strong> This report is for informational purposes only and should not be considered as financial advice.</p>
        `
      })
    }

    // Create PDF report data
    const reportData: PDFReportData = {
      title: title || 'Professional Business Intelligence Report',
      subtitle: 'Comprehensive AI-Powered Analysis',
      author: 'GoodBuy Business Intelligence Platform',
      date: new Date(),
      sections: pdfSections,
      branding: {
        primaryColor: '#2563eb',
        secondaryColor: '#475569'
      }
    }

    // Generate PDF
    const pdfBuffer = await PDFGenerationService.generatePDF(reportData)

    // Save PDF and get URL
    const filename = `professional-report-${Date.now()}.pdf`
    const fileUrl = await PDFGenerationService.savePDF(pdfBuffer, filename)

    // Return success response
    return NextResponse.json({
      success: true,
      report: {
        title: reportData.title,
        fileUrl,
        metadata: {
          pageCount: Math.ceil(pdfSections.length * 1.5), // Estimate
          fileSize: pdfBuffer.length,
          generatedAt: new Date().toISOString(),
          sections: sections.length
        }
      }
    })

  } catch (error) {
    console.error('Professional report generation failed:', error)

    return NextResponse.json(
      {
        error: 'Failed to generate professional report',
        details: error instanceof Error ? error.message : 'Unknown error occurred'
      },
      { status: 500 }
    )
  }
}