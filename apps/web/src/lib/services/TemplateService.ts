import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export interface TemplateSearchFilters {
  category?: string
  templateType?: 'DOCUMENT' | 'SPREADSHEET' | 'CHECKLIST' | 'PROCESS' | 'PRESENTATION'
  difficulty?: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED'
  industry?: string[]
  tags?: string[]
}

export class TemplateService {
  /**
   * Get all available templates with filters
   */
  static async getTemplates(filters: TemplateSearchFilters = {}, limit: number = 50) {
    try {
      const where: any = {}

      if (filters.category) {
        where.category = { contains: filters.category, mode: 'insensitive' }
      }

      if (filters.templateType) {
        where.templateType = filters.templateType
      }

      if (filters.difficulty) {
        where.difficulty = filters.difficulty
      }

      if (filters.industry && filters.industry.length > 0) {
        where.industry = {
          hasSome: filters.industry
        }
      }

      if (filters.tags && filters.tags.length > 0) {
        where.tags = {
          hasSome: filters.tags
        }
      }

      const templates = await prisma.template.findMany({
        where,
        take: limit,
        orderBy: [
          { rating: 'desc' },
          { downloadCount: 'desc' },
          { createdAt: 'desc' }
        ]
      })

      return templates
    } catch (error) {
      console.error('Error getting templates:', error)
      throw error
    }
  }

  /**
   * Get specific template by ID
   */
  static async getTemplate(templateId: string) {
    try {
      const template = await prisma.template.findUnique({
        where: { id: templateId }
      })

      if (!template) {
        throw new Error('Template not found')
      }

      return template
    } catch (error) {
      console.error('Error getting template:', error)
      throw error
    }
  }

  /**
   * Download template (increment download count)
   */
  static async downloadTemplate(templateId: string) {
    try {
      const template = await prisma.template.update({
        where: { id: templateId },
        data: {
          downloadCount: {
            increment: 1
          }
        }
      })

      return template
    } catch (error) {
      console.error('Error downloading template:', error)
      throw error
    }
  }

  /**
   * Search templates by name or description
   */
  static async searchTemplates(searchTerm: string, filters: TemplateSearchFilters = {}) {
    try {
      const where: any = {
        OR: [
          { name: { contains: searchTerm, mode: 'insensitive' } },
          { description: { contains: searchTerm, mode: 'insensitive' } },
          { category: { contains: searchTerm, mode: 'insensitive' } },
          { tags: { hasSome: [searchTerm] } }
        ]
      }

      // Apply additional filters
      if (filters.category) {
        where.category = { contains: filters.category, mode: 'insensitive' }
      }

      if (filters.templateType) {
        where.templateType = filters.templateType
      }

      if (filters.difficulty) {
        where.difficulty = filters.difficulty
      }

      if (filters.industry && filters.industry.length > 0) {
        where.industry = {
          hasSome: filters.industry
        }
      }

      const templates = await prisma.template.findMany({
        where,
        orderBy: [
          { rating: 'desc' },
          { downloadCount: 'desc' }
        ]
      })

      return templates
    } catch (error) {
      console.error('Error searching templates:', error)
      throw error
    }
  }

  /**
   * Get templates by category
   */
  static async getTemplatesByCategory(category: string) {
    try {
      const templates = await prisma.template.findMany({
        where: {
          category: { contains: category, mode: 'insensitive' }
        },
        orderBy: [
          { rating: 'desc' },
          { downloadCount: 'desc' }
        ]
      })

      return templates
    } catch (error) {
      console.error('Error getting templates by category:', error)
      throw error
    }
  }

  /**
   * Get popular templates
   */
  static async getPopularTemplates(limit: number = 10) {
    try {
      const templates = await prisma.template.findMany({
        take: limit,
        orderBy: [
          { downloadCount: 'desc' },
          { rating: 'desc' }
        ]
      })

      return templates
    } catch (error) {
      console.error('Error getting popular templates:', error)
      throw error
    }
  }

  /**
   * Get templates for specific industry
   */
  static async getTemplatesForIndustry(industry: string, limit: number = 20) {
    try {
      const templates = await prisma.template.findMany({
        where: {
          industry: {
            has: industry
          }
        },
        take: limit,
        orderBy: [
          { rating: 'desc' },
          { downloadCount: 'desc' }
        ]
      })

      return templates
    } catch (error) {
      console.error('Error getting templates for industry:', error)
      throw error
    }
  }

  /**
   * Create seed templates for testing
   */
  static async createSeedTemplates() {
    try {
      const seedTemplates = [
        {
          name: "Business Plan Template",
          category: "strategic",
          description: "Comprehensive business plan template with financial projections and market analysis",
          templateType: "DOCUMENT" as const,
          content: "# Business Plan Template\n\n## Executive Summary\n[Your executive summary here]\n\n## Market Analysis\n[Market analysis content]\n\n## Financial Projections\n[Financial data]",
          variables: [
            { name: "company_name", description: "Company Name", type: "text", required: true },
            { name: "industry", description: "Industry", type: "text", required: true },
            { name: "target_market", description: "Target Market", type: "text", required: true }
          ],
          instructions: "1. Replace all bracketed placeholders with your specific information\n2. Customize sections based on your business type\n3. Include realistic financial projections\n4. Review and validate all market data",
          examples: [
            {
              industry: "Technology",
              scenario: "SaaS startup seeking seed funding",
              notes: "Focus on scalability and recurring revenue model"
            }
          ],
          tags: ["business-plan", "startup", "strategy", "funding"],
          industry: ["Technology", "Consulting", "Retail"],
          difficulty: "INTERMEDIATE" as const,
          estimatedTime: "4-6 hours",
          rating: 4.7
        },
        {
          name: "Marketing Campaign ROI Calculator",
          category: "marketing",
          description: "Excel template to calculate and track marketing campaign return on investment",
          templateType: "SPREADSHEET" as const,
          content: "Excel spreadsheet with formulas for ROI calculations, campaign tracking, and performance metrics",
          variables: [
            { name: "campaign_name", description: "Campaign Name", type: "text", required: true },
            { name: "budget", description: "Total Budget", type: "number", required: true },
            { name: "duration", description: "Campaign Duration (days)", type: "number", required: true }
          ],
          instructions: "1. Enter campaign details in the input section\n2. Add actual costs and results as they occur\n3. Monitor ROI calculations automatically\n4. Use charts to visualize performance trends",
          examples: [
            {
              industry: "E-commerce",
              scenario: "Social media advertising campaign for product launch",
              notes: "Includes conversion tracking and customer acquisition cost analysis"
            }
          ],
          tags: ["marketing", "roi", "analytics", "campaign-tracking"],
          industry: ["Marketing", "E-commerce", "Retail"],
          difficulty: "BEGINNER" as const,
          estimatedTime: "1-2 hours",
          rating: 4.5
        },
        {
          name: "Process Improvement Checklist",
          category: "operational",
          description: "Systematic checklist for identifying and implementing operational improvements",
          templateType: "CHECKLIST" as const,
          content: "Comprehensive checklist covering process analysis, improvement identification, implementation planning, and success measurement",
          variables: [
            { name: "process_name", description: "Process Name", type: "text", required: true },
            { name: "department", description: "Department", type: "text", required: true },
            { name: "improvement_goal", description: "Improvement Goal", type: "text", required: true }
          ],
          instructions: "1. Work through each checklist item systematically\n2. Document findings and decisions\n3. Involve relevant stakeholders in the review\n4. Set measurable improvement targets",
          examples: [
            {
              industry: "Manufacturing",
              scenario: "Reducing production cycle time and waste",
              notes: "Includes lean manufacturing principles and quality control measures"
            }
          ],
          tags: ["process-improvement", "operations", "efficiency", "lean"],
          industry: ["Manufacturing", "Operations", "General"],
          difficulty: "INTERMEDIATE" as const,
          estimatedTime: "2-3 hours",
          rating: 4.3
        }
      ]

      const createdTemplates = []
      for (const templateData of seedTemplates) {
        const existing = await prisma.template.findFirst({
          where: { name: templateData.name }
        })

        if (!existing) {
          const template = await prisma.template.create({
            data: templateData
          })
          createdTemplates.push(template)
        }
      }

      return createdTemplates
    } catch (error) {
      console.error('Error creating seed templates:', error)
      throw error
    }
  }
}