import { PrismaClient } from '@prisma/client'
import { PremiumAccessService } from './PremiumAccessService'
import { AnalyticsService } from './AnalyticsService'
import { ValueImpactService } from './ValueImpactService'
import { PDFGenerationService, PDFReportData, PDFSection, ChartData } from './PDFGenerationService'
import { ClaudeService, type EnhancedHealthAnalysis } from './claude-service'
import { evaluationStorage } from '../evaluation-storage'
import { handleClaudeRequest } from './claude-api-direct'

// Initialize Prisma client
const prisma = new PrismaClient()

export interface ProfessionalReport {
  id: string
  userId: string
  reportType: 'executive' | 'investor' | 'comprehensive' | 'custom'
  title: string
  generatedAt: Date
  sections: ReportSection[]
  executiveSummary?: ExecutiveSummary
  fileUrl: string
  metadata: ReportMetadata
}

export interface ReportSection {
  id: string
  type: 'summary' | 'trends' | 'improvements' | 'charts' | 'recommendations' | 'appendix'
  title: string
  content: any
  chartIds?: string[]
  order: number
  included: boolean
}

export interface ExecutiveSummary {
  keyInsights: string[]
  recommendations: string[]
  businessHighlights: string[]
  riskFactors: string[]
  nextSteps: string[]
  generatedBy: 'ai' | 'user'
}

export interface ReportMetadata {
  businessName: string
  generationDate: Date
  coverDate: Date
  pageCount: number
  fileSize: number
  reportVersion: string
  confidentialityLevel: 'public' | 'confidential' | 'restricted'
}

export interface ReportTemplate {
  id: string
  name: string
  description: string
  audience: string
  sections: string[]
  defaultSettings: any
}

export class ReportService {
  /**
   * Generate a professional PDF report 
   */
  static async generateProfessionalReport(
    userId: string,
    reportType: 'executive' | 'investor' | 'comprehensive' | 'custom',
    options: {
      title?: string
      sections?: string[]
      includeExecutiveSummary?: boolean
      customizations?: any
    }
  ): Promise<ProfessionalReport> {
    // Check premium access (but allow generation for all users)
    const accessCheck = await PremiumAccessService.checkAIFeatureAccess(userId).catch(() => ({ hasAccess: true }))
    
    // Log the access check but don't block generation
    if (!accessCheck.hasAccess) {
      console.log('User does not have premium access, but allowing report generation')
    }

    try {
      // Get user's evaluations using file storage
      const evaluations = evaluationStorage.getByUserId(userId)
      
      if (!evaluations || evaluations.length === 0) {
        throw new Error('No evaluation data available for report generation')
      }

      // Create a user object compatible with the rest of the code
      const user = {
        id: userId,
        businessName: evaluations[0]?.businessData?.businessName || 'Business Report',
        evaluations: evaluations.slice(0, 10)
      }

      // Get analytics data
      const analyticsData = await AnalyticsService.getAnalyticsDashboardData(userId).catch(() => null)
      
      // Get ROI analysis
      const roiAnalysis = await ValueImpactService.getROIAnalysis(userId).catch(() => null)

      // Generate report sections based on template
      const template = this.getReportTemplate(reportType)
      const sections = await this.generateReportSections(
        user,
        template,
        options.sections || template.sections,
        { analyticsData, roiAnalysis }
      )

      // Generate executive summary if requested
      let executiveSummary: ExecutiveSummary | undefined
      if (options.includeExecutiveSummary !== false) {
        executiveSummary = await this.generateExecutiveSummary(user, sections, analyticsData)
      }

      // Create report metadata
      const metadata: ReportMetadata = {
        businessName: user.businessName || 'Business Report',
        generationDate: new Date(),
        coverDate: new Date(),
        pageCount: this.estimatePageCount(sections, executiveSummary),
        fileSize: 0, // Will be set after PDF generation
        reportVersion: '1.0',
        confidentialityLevel: reportType === 'investor' ? 'confidential' : 'public'
      }

      // Generate PDF
      const fileUrl = await this.generatePDF(
        userId,
        {
          title: options.title || `${template.name} Report`,
          sections,
          executiveSummary,
          metadata,
          template
        }
      )

      // Save report record
      const report: ProfessionalReport = {
        id: `report_${userId}_${Date.now()}`,
        userId,
        reportType,
        title: options.title || `${template.name} Report`,
        generatedAt: new Date(),
        sections,
        executiveSummary,
        fileUrl,
        metadata: {
          ...metadata,
          fileSize: await this.getFileSize(fileUrl)
        }
      }

      return report
    } catch (error) {
      console.error('Error generating professional report:', error)
      throw error
    }
  }

  /**
   * Generate AI-powered executive summary using Claude
   */
  static async generateExecutiveSummary(
    user: any,
    sections: ReportSection[],
    analyticsData?: any
  ): Promise<ExecutiveSummary> {
    try {
      const latestEvaluation = user.evaluations[0]
      if (!latestEvaluation) {
        throw new Error('No evaluation data available for AI analysis')
      }

      const businessData = latestEvaluation.businessData || {}
      
      // Get enhanced AI health analysis from Claude
      const healthAnalysis = await ClaudeService.analyzeEnhancedBusinessHealth(businessData)
      
      // Generate AI-powered executive summary using Claude
      const summaryPrompt = this.createExecutiveSummaryPrompt(user, businessData, healthAnalysis, analyticsData)
      
      let aiSummary: Partial<ExecutiveSummary> = {}
      
      try {
        // Use direct handler for server-side calls
        const result = await handleClaudeRequest({
          prompt: summaryPrompt,
          businessData: businessData
        })
        
        console.log('Raw AI response:', result.analysisText?.substring(0, 200))
        
        const analysisText = result.analysisText || result.content || result.text || ''
        if (analysisText) {
          aiSummary = this.parseAISummaryResponse(analysisText)
        } else {
          console.warn('No analysis text found in AI response:', result)
        }
      } catch (aiError) {
        console.error('AI summary generation failed:', aiError)
        throw aiError // No fallbacks - fix the root cause
      }
      
      return {
        keyInsights: aiSummary.keyInsights,
        recommendations: aiSummary.recommendations,
        businessHighlights: aiSummary.businessHighlights,
        riskFactors: aiSummary.riskFactors,
        nextSteps: aiSummary.nextSteps,
        generatedBy: 'ai'
      }
    } catch (error) {
      console.error('Error generating AI executive summary:', error)
      throw error // No fallbacks - fix the root cause
    }
  }

  /**
   * Create executive summary prompt for AI generation
   */
  private static createExecutiveSummaryPrompt(
    user: any,
    businessData: any,
    healthAnalysis: EnhancedHealthAnalysis,
    analyticsData?: any
  ): string {
    return `Generate a comprehensive executive summary for this business report:

Business Information:
- Type: ${businessData.businessType || 'Not provided'}
- Industry: ${businessData.industryFocus || 'Not provided'}
- Annual Revenue: $${businessData.annualRevenue?.toLocaleString() || 'Not provided'}
- Health Score: ${healthAnalysis.healthScore}/100

Health Analysis Highlights:
- Financial Health: ${healthAnalysis.scoringFactors?.financial?.score}/100
- Operational Efficiency: ${healthAnalysis.scoringFactors?.operational?.score}/100
- Market Position: ${healthAnalysis.scoringFactors?.market?.score}/100
- Growth Potential: ${healthAnalysis.scoringFactors?.growth?.score}/100

Top Improvement Opportunities:
${healthAnalysis.improvementOpportunities?.slice(0, 3).map(opp => `- ${opp.description}: ${opp.impactDescription}`).join('\n') || 'None identified'}

Please provide:
1. Key Insights (3-5 bullet points about business performance)
2. Strategic Recommendations (3-5 actionable recommendations)
3. Business Highlights (3-4 positive aspects to emphasize)
4. Risk Factors (3-4 potential concerns or challenges)
5. Next Steps (3-4 immediate actions to take)

Format as structured text that can be parsed.`
  }

  /**
   * Parse AI response into executive summary structure
   */
  private static parseAISummaryResponse(analysisText: string): Partial<ExecutiveSummary> {
    try {
      if (!analysisText || typeof analysisText !== 'string') {
        console.warn('Invalid analysis text provided for parsing')
        return {}
      }

      // Extract sections from AI response using exact pattern matching
      const sections = {
        keyInsights: this.extractSection(analysisText, 'Key Insights', 'Strategic Recommendations'),
        recommendations: this.extractSection(analysisText, 'Strategic Recommendations', 'Business Highlights'),
        businessHighlights: this.extractSection(analysisText, 'Business Highlights', 'Risk Factors'),
        riskFactors: this.extractSection(analysisText, 'Risk Factors', 'Next Steps'),
        nextSteps: this.extractSection(analysisText, 'Next Steps', null)
      }

      // Log what we extracted for debugging
      console.log('Parsed AI summary sections:', {
        keyInsights: sections.keyInsights?.length || 0,
        recommendations: sections.recommendations?.length || 0,
        businessHighlights: sections.businessHighlights?.length || 0,
        riskFactors: sections.riskFactors?.length || 0,
        nextSteps: sections.nextSteps?.length || 0
      })

      return sections
    } catch (error) {
      console.error('Error parsing AI summary response:', error)
      console.error('Analysis text preview:', analysisText?.substring(0, 200))
      return {}
    }
  }

  /**
   * Extract section content from AI response
   */
  private static extractSection(text: string, startMarker: string, endMarker: string | null): string[] {
    if (!text || !startMarker) return []
    
    const startIndex = text.toLowerCase().indexOf(startMarker.toLowerCase())
    if (startIndex === -1) return []

    const contentStart = startIndex + startMarker.length
    const endIndex = endMarker ? text.toLowerCase().indexOf(endMarker.toLowerCase(), contentStart) : text.length
    const sectionText = text.slice(contentStart, endIndex > -1 ? endIndex : text.length)

    if (!sectionText.trim()) return []

    // Extract bullet points, numbered items, or simple lines
    const lines = sectionText
      .split(/\n/)
      .map(line => line.trim())
      .filter(line => line.length > 0)

    // Extract only structured content (bullets/numbers) - no fallbacks
    const structuredContent = lines
      .filter(line => line.match(/^[-•*]\s+|^\d+\.\s+/))
      .map(line => line.replace(/^[-•*]\s+|^\d+\.\s+/, '').trim())
      .filter(line => line.length > 0)

    return structuredContent.slice(0, 5)
  }


  /**
   * Get available report templates
   */
  static getReportTemplates(): ReportTemplate[] {
    return [
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
  }

  /**
   * Generate report preview
   */
  static async generateReportPreview(
    userId: string,
    reportType: string,
    sections: string[]
  ) {
    // Get user's evaluations using file storage
    const evaluations = evaluationStorage.getByUserId(userId)
    
    if (!evaluations || evaluations.length === 0) {
      throw new Error('No evaluation data available for preview')
    }

    // Create a user object compatible with the rest of the code
    const user = {
      id: userId,
      businessName: evaluations[0]?.businessData?.businessName || 'Business Report',
      evaluations: evaluations.slice(0, 1)
    }

    const template = this.getReportTemplate(reportType as any)
    const previewSections = await this.generateReportSections(
      user,
      template,
      sections,
      {},
      true // Preview mode
    )

    return {
      title: `${template.name} Report`,
      sections: previewSections,
      estimatedPages: this.estimatePageCount(previewSections),
      generationTime: this.estimateGenerationTime(previewSections.length)
    }
  }

  /**
   * Private helper methods
   */

  private static getReportTemplate(type: string): ReportTemplate {
    const templates = this.getReportTemplates()
    return templates.find(t => t.id === type) || templates[0]
  }

  private static async generateReportSections(
    user: any,
    template: ReportTemplate,
    selectedSections: string[],
    data: { analyticsData?: any, roiAnalysis?: any },
    isPreview = false
  ): Promise<ReportSection[]> {
    const sections: ReportSection[] = []
    let order = 0

    for (const sectionType of selectedSections) {
      const section = await this.generateSection(
        sectionType as any,
        user,
        data,
        order++,
        isPreview
      )
      if (section) {
        sections.push(section)
      }
    }

    return sections
  }

  private static async generateSection(
    type: 'summary' | 'trends' | 'improvements' | 'charts' | 'recommendations' | 'appendix',
    user: any,
    data: any,
    order: number,
    isPreview: boolean
  ): Promise<ReportSection | null> {
    const sectionId = `section_${type}_${Date.now()}`

    switch (type) {
      case 'summary':
        return {
          id: sectionId,
          type,
          title: 'Business Overview',
          content: this.generateSummaryContent(user, isPreview),
          order,
          included: true
        }

      case 'trends':
        return {
          id: sectionId,
          type,
          title: 'Performance Trends',
          content: this.generateTrendsContent(user, data.analyticsData, isPreview),
          order,
          included: true
        }

      case 'improvements':
        return {
          id: sectionId,
          type,
          title: 'Improvement Tracking',
          content: this.generateImprovementsContent(user, data.roiAnalysis, isPreview),
          order,
          included: true
        }

      case 'charts':
        return {
          id: sectionId,
          type,
          title: 'Key Performance Charts',
          content: this.generateChartsContent(user, data, isPreview),
          chartIds: ['valuation_trend', 'health_score', 'roi_analysis'],
          order,
          included: true
        }

      case 'recommendations':
        return {
          id: sectionId,
          type,
          title: 'Strategic Recommendations',
          content: await this.generateRecommendationsContent(user, data.analyticsData, isPreview),
          order,
          included: true
        }

      case 'appendix':
        return {
          id: sectionId,
          type,
          title: 'Data Appendix',
          content: this.generateAppendixContent(user, isPreview),
          order,
          included: true
        }

      default:
        return null
    }
  }

  private static generateSummaryContent(user: any, isPreview: boolean) {
    const latestEvaluation = user.evaluations[0]
    const businessData = latestEvaluation?.businessData || {}

    return {
      businessName: user.businessName || businessData.businessName || 'Business',
      industry: businessData.industry || 'Not specified',
      evaluationDate: latestEvaluation?.createdAt || new Date(),
      healthScore: latestEvaluation?.healthScore || 0,
      totalEvaluations: user.evaluations.length,
      keyMetrics: isPreview ? 'Preview: Key business metrics will be displayed here' : {
        revenue: businessData.annualRevenue || 0,
        employees: businessData.employeeCount || 0,
        valuation: this.extractValuation(latestEvaluation) || 0
      }
    }
  }

  private static generateTrendsContent(user: any, analyticsData: any, isPreview: boolean) {
    if (isPreview) {
      return {
        description: 'Preview: Statistical trend analysis with confidence intervals',
        trends: ['Upward revenue trend', 'Stable health scores', 'Positive market indicators']
      }
    }

    return {
      description: 'Statistical analysis of business performance over time',
      trends: analyticsData?.advancedTrends?.trends || [],
      dataQuality: analyticsData?.summary?.dataQuality || 0,
      predictionAccuracy: analyticsData?.summary?.predictionAccuracy || 0
    }
  }

  private static generateImprovementsContent(user: any, roiAnalysis: any, isPreview: boolean) {
    if (isPreview) {
      return {
        description: 'Preview: Progress tracking and value impact analysis',
        improvements: ['Implementation progress overview', 'ROI calculations', 'Before/after comparisons']
      }
    }

    return {
      description: 'Analysis of implemented improvements and their business impact',
      totalInvestment: roiAnalysis?.totalInvestment || 0,
      totalValueGenerated: roiAnalysis?.totalValueGenerated || 0,
      overallROI: roiAnalysis?.overallROI || 0,
      topImprovements: roiAnalysis?.topPerformingImprovements?.slice(0, 5) || []
    }
  }

  private static generateChartsContent(user: any, data: any, isPreview: boolean) {
    if (isPreview) {
      return {
        description: 'Preview: Professional charts and visualizations',
        charts: ['Business Valuation Trend', 'Health Score Overview', 'ROI Analysis']
      }
    }

    return {
      description: 'Visual analysis of key business metrics and trends',
      availableCharts: [
        { id: 'valuation_trend', title: 'Business Valuation Over Time', type: 'line' },
        { id: 'health_breakdown', title: 'Health Score Breakdown', type: 'radar' },
        { id: 'roi_analysis', title: 'ROI by Category', type: 'bar' }
      ]
    }
  }

  private static async generateRecommendationsContent(user: any, analyticsData: any, isPreview: boolean) {
    if (isPreview) {
      return {
        description: 'Preview: AI-powered strategic recommendations',
        recommendations: ['Strategic recommendation examples', 'Priority action items', 'Risk mitigation strategies']
      }
    }

    try {
      const latestEvaluation = user.evaluations[0]
      const businessData = latestEvaluation?.businessData || {}
      
      // Use AI-generated recommendations from Claude
      const healthAnalysis = await ClaudeService.analyzeEnhancedBusinessHealth(businessData)
      
      return {
        description: 'AI-generated recommendations based on business analysis',
        recommendations: healthAnalysis.improvementOpportunities?.slice(0, 5).map(opp => opp.description) || [],
        priorityLevel: 'high',
        expectedImpact: healthAnalysis.improvementOpportunities?.[0]?.impactDescription || 'medium'
      }
    } catch (error) {
      console.error('Error generating AI recommendations:', error)
      throw error // No fallbacks
    }
  }

  private static generateAppendixContent(user: any, isPreview: boolean) {
    if (isPreview) {
      return {
        description: 'Preview: Detailed data tables and methodology',
        sections: ['Data sources', 'Calculation methods', 'Assumptions']
      }
    }

    return {
      description: 'Supporting data and methodology',
      dataSources: ['Business evaluations', 'Progress tracking', 'Industry benchmarks'],
      methodology: 'Statistical analysis using linear regression and confidence intervals',
      assumptions: ['Historical data quality', 'Market stability', 'Business continuity']
    }
  }


  private static formatExecutiveSummary(executiveSummary: ExecutiveSummary): string {
    let content = '<div style="line-height: 1.8;">'
    
    if (executiveSummary.keyInsights.length > 0) {
      content += '<h4 style="color: #1f2937; margin-bottom: 10px;">Key Insights</h4>'
      content += '<ul style="margin-bottom: 20px;">'
      executiveSummary.keyInsights.forEach(insight => {
        content += `<li style="margin-bottom: 5px;">${insight}</li>`
      })
      content += '</ul>'
    }

    if (executiveSummary.recommendations.length > 0) {
      content += '<h4 style="color: #1f2937; margin-bottom: 10px;">Strategic Recommendations</h4>'
      content += '<ul style="margin-bottom: 20px;">'
      executiveSummary.recommendations.forEach(rec => {
        content += `<li style="margin-bottom: 5px;">${rec}</li>`
      })
      content += '</ul>'
    }

    if (executiveSummary.businessHighlights.length > 0) {
      content += '<h4 style="color: #1f2937; margin-bottom: 10px;">Business Highlights</h4>'
      content += '<ul style="margin-bottom: 20px;">'
      executiveSummary.businessHighlights.forEach(highlight => {
        content += `<li style="margin-bottom: 5px;">${highlight}</li>`
      })
      content += '</ul>'
    }

    if (executiveSummary.nextSteps.length > 0) {
      content += '<h4 style="color: #1f2937; margin-bottom: 10px;">Next Steps</h4>'
      content += '<ol style="margin-bottom: 20px;">'
      executiveSummary.nextSteps.forEach(step => {
        content += `<li style="margin-bottom: 5px;">${step}</li>`
      })
      content += '</ol>'
    }

    content += '</div>'
    return content
  }

  private static async convertToPDFSection(section: ReportSection, userId: string): Promise<PDFSection | null> {
    try {
      switch (section.type) {
        case 'summary':
          return {
            type: 'header',
            title: section.title,
            content: this.formatSummaryContent(section.content)
          }

        case 'trends':
          return {
            type: 'text',
            title: section.title,
            content: this.formatTrendsContent(section.content)
          }

        case 'improvements':
          return {
            type: 'text',
            title: section.title,
            content: this.formatImprovementsContent(section.content)
          }

        case 'charts':
          return {
            type: 'chart',
            title: section.title,
            chartData: await this.generateChartData(section.content, userId)
          }

        case 'recommendations':
          return {
            type: 'text',
            title: section.title,
            content: this.formatRecommendationsContent(section.content)
          }

        case 'appendix':
          return {
            type: 'table',
            title: section.title,
            tableData: this.formatAppendixTable(section.content)
          }

        default:
          return {
            type: 'text',
            title: section.title,
            content: JSON.stringify(section.content, null, 2)
          }
      }
    } catch (error) {
      console.error(`Error converting section ${section.type}:`, error)
      return {
        type: 'text',
        title: section.title,
        content: `Error formatting ${section.type} section content`
      }
    }
  }

  private static formatSummaryContent(content: any): string {
    return `
      <div style="line-height: 1.8;">
        <h4>Business Overview</h4>
        <p><strong>Business Name:</strong> ${content.businessName}</p>
        <p><strong>Industry:</strong> ${content.industry}</p>
        <p><strong>Health Score:</strong> ${content.healthScore}/100</p>
        <p><strong>Total Evaluations:</strong> ${content.totalEvaluations}</p>
        <p><strong>Last Evaluation:</strong> ${new Date(content.evaluationDate).toLocaleDateString()}</p>
      </div>
    `
  }

  private static formatTrendsContent(content: any): string {
    return `
      <div style="line-height: 1.8;">
        <p>${content.description}</p>
        ${content.trends && content.trends.length > 0 ? `
          <h5 style="margin-top: 20px;">Key Trends</h5>
          <ul>
            ${content.trends.map((trend: string) => `<li>${trend}</li>`).join('')}
          </ul>
        ` : ''}
        ${content.dataQuality ? `<p><strong>Data Quality Score:</strong> ${(content.dataQuality * 100).toFixed(1)}%</p>` : ''}
      </div>
    `
  }

  private static formatImprovementsContent(content: any): string {
    return `
      <div style="line-height: 1.8;">
        <p>${content.description}</p>
        ${content.totalInvestment ? `<p><strong>Total Investment:</strong> $${content.totalInvestment.toLocaleString()}</p>` : ''}
        ${content.totalValueGenerated ? `<p><strong>Value Generated:</strong> $${content.totalValueGenerated.toLocaleString()}</p>` : ''}
        ${content.overallROI ? `<p><strong>Overall ROI:</strong> ${(content.overallROI * 100).toFixed(1)}%</p>` : ''}
      </div>
    `
  }

  private static formatRecommendationsContent(content: any): string {
    return `
      <div style="line-height: 1.8;">
        <p>${content.description}</p>
        ${content.recommendations && content.recommendations.length > 0 ? `
          <h5 style="margin-top: 20px;">Recommendations</h5>
          <ol>
            ${content.recommendations.map((rec: string) => `<li style="margin-bottom: 10px;">${rec}</li>`).join('')}
          </ol>
        ` : ''}
      </div>
    `
  }

  private static formatAppendixTable(content: any): { headers: string[]; rows: string[][] } {
    return {
      headers: ['Category', 'Value', 'Description'],
      rows: [
        ['Data Sources', content.dataSources?.join(', ') || 'N/A', 'Sources used for analysis'],
        ['Methodology', content.methodology || 'N/A', 'Analysis approach'],
        ['Key Assumptions', content.assumptions?.join(', ') || 'N/A', 'Underlying assumptions']
      ]
    }
  }

  private static async generateChartData(content: any, userId: string): Promise<ChartData> {
    try {
      // Get user's evaluation data for chart using file storage
      const evaluations = evaluationStorage.getByUserId(userId)
      
      if (!evaluations || evaluations.length === 0) {
        return this.getDefaultChartData()
      }

      // Generate valuation trend chart - take last 12 and reverse for chronological order
      const recentEvaluations = evaluations.slice(-12).reverse()
      return {
        type: 'line',
        title: 'Business Valuation Trend',
        data: {
          labels: recentEvaluations.map(evaluation => new Date(evaluation.createdAt).toLocaleDateString()),
          datasets: [{
            label: 'Business Valuation',
            data: recentEvaluations.map(evaluation => this.extractValuation(evaluation)),
            borderColor: '#3b82f6',
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            borderWidth: 2,
            fill: true
          }]
        },
        options: {
          responsive: true,
          plugins: {
            title: {
              display: true,
              text: 'Business Valuation Over Time'
            }
          },
          scales: {
            y: {
              beginAtZero: false,
              ticks: {
                callback: function(value: any) {
                  return '$' + value.toLocaleString()
                }
              }
            }
          }
        }
      }
    } catch (error) {
      console.error('Error generating chart data:', error)
      return this.getDefaultChartData()
    }
  }

  private static getDefaultChartData(): ChartData {
    return {
      type: 'line',
      title: 'Business Performance',
      data: {
        labels: ['Q1', 'Q2', 'Q3', 'Q4'],
        datasets: [{
          label: 'Performance Score',
          data: [65, 72, 78, 85],
          borderColor: '#3b82f6',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          borderWidth: 2,
          fill: true
        }]
      }
    }
  }

  private static async generatePDF(
    userId: string,
    reportData: {
      title: string
      sections: ReportSection[]
      executiveSummary?: ExecutiveSummary
      metadata: ReportMetadata
      template: ReportTemplate
    }
  ): Promise<string> {
    try {
      // Convert report sections to PDF sections
      const pdfSections: PDFSection[] = []

      // Add executive summary if included
      if (reportData.executiveSummary) {
        pdfSections.push({
          type: 'executive-summary',
          title: 'Executive Summary',
          content: this.formatExecutiveSummary(reportData.executiveSummary)
        })
      }

      // Convert each report section to PDF format
      for (const section of reportData.sections) {
        const pdfSection = await this.convertToPDFSection(section, userId)
        if (pdfSection) {
          pdfSections.push(pdfSection)
        }
      }

      // Create PDF report data
      const pdfReportData: PDFReportData = {
        title: reportData.title,
        subtitle: `Generated on ${reportData.metadata.generationDate.toLocaleDateString()}`,
        author: reportData.metadata.businessName,
        date: new Date(),
        sections: pdfSections,
        branding: {
          primaryColor: '#3b82f6',
          secondaryColor: '#64748b'
        }
      }

      // Generate PDF
      const pdfBuffer = await PDFGenerationService.generatePDF(pdfReportData)
      
      // Save PDF and return URL
      const filename = `report_${userId}_${Date.now()}.pdf`
      const fileUrl = await PDFGenerationService.savePDF(pdfBuffer, filename)
      
      return fileUrl
    } catch (error) {
      console.error('Error generating PDF:', error)
      // Fallback to mock URL if PDF generation fails
      const filename = `report_${userId}_${Date.now()}.pdf`
      return `/api/reports/files/${filename}`
    }
  }

  private static estimatePageCount(sections: ReportSection[], executiveSummary?: ExecutiveSummary): number {
    let pages = 3 // Cover + TOC + Executive Summary
    
    if (executiveSummary) pages += 2
    
    sections.forEach(section => {
      switch (section.type) {
        case 'summary': pages += 1; break
        case 'trends': pages += 2; break
        case 'improvements': pages += 3; break
        case 'charts': pages += 4; break
        case 'recommendations': pages += 2; break
        case 'appendix': pages += 3; break
        default: pages += 1
      }
    })

    return pages
  }

  private static estimateGenerationTime(sectionCount: number): string {
    const baseTime = 10 // seconds
    const timePerSection = 5 // seconds
    const totalSeconds = baseTime + (sectionCount * timePerSection)
    
    return `${Math.ceil(totalSeconds / 10) * 10} seconds`
  }

  private static async getFileSize(fileUrl: string): Promise<number> {
    // Mock implementation - in production would check actual file size
    return 2.5 * 1024 * 1024 // 2.5 MB
  }

  private static extractValuation(evaluation: any): number {
    if (evaluation?.valuations) {
      return evaluation.valuations.weighted?.value || 
             evaluation.valuations.weighted || 
             evaluation.valuations.businessValue || 
             500000
    }
    return 500000
  }
}