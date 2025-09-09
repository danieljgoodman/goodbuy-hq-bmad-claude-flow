import { PrismaClient } from '@prisma/client'
import { PremiumAccessService } from './PremiumAccessService'

const prisma = new PrismaClient()

// Simple in-memory cache for guide generation
const guideCache = new Map<string, { guide: GeneratedGuide; timestamp: number }>()
const CACHE_TTL = 60 * 60 * 1000 // 1 hour

export interface GuideGenerationRequest {
  userId: string
  evaluationId: string
  improvementCategory: string
  businessContext: {
    businessName: string
    industry: string
    size: string
    currentRevenue?: number
    goals?: string[]
  }
  improvementOpportunity: {
    title: string
    description: string
    potentialImpact: number
    difficulty: 'low' | 'medium' | 'high'
    timelineEstimate: string
  }
}

export interface GeneratedGuide {
  id: string
  title: string
  description: string
  industry: string
  steps: GuideStepData[]
  estimatedDuration: number
  difficultyLevel: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED'
  resourceRequirements: any
  templates: any[]
}

export interface GuideStepData {
  stepNumber: number
  title: string
  description: string
  estimatedTime: number
  difficulty: string
  resources: any[]
  tips: any[]
  commonPitfalls: any[]
  successMetrics: any[]
}

export class GuideService {
  /**
   * Generate comprehensive implementation guide using AI
   */
  static async generateImplementationGuide(request: GuideGenerationRequest): Promise<GeneratedGuide> {
    // Check premium access first
    const accessCheck = await PremiumAccessService.checkAIFeatureAccess(request.userId)
    if (!accessCheck.hasAccess) {
      throw new Error('Premium subscription required for AI implementation guides')
    }

    // Create cache key based on improvement category and industry for reusable guides
    const cacheKey = `${request.improvementCategory}-${request.businessContext.industry}-${request.improvementOpportunity.difficulty}`
    
    // Check cache first
    const cached = guideCache.get(cacheKey)
    if (cached && (Date.now() - cached.timestamp < CACHE_TTL)) {
      console.log('Returning cached guide for', cacheKey)
      // Still save to database for the user
      const savedGuide = await this.saveGuideToDatabase(request, cached.guide)
      return savedGuide
    }

    try {
      // Generate guide using AI prompts
      const generatedGuide = await this.callAIForGuideGeneration(request)
      
      // Cache the generated guide
      guideCache.set(cacheKey, { guide: generatedGuide, timestamp: Date.now() })
      
      // Save to database
      const savedGuide = await this.saveGuideToDatabase(request, generatedGuide)
      
      return savedGuide
    } catch (error) {
      console.error('Error generating implementation guide:', error)
      throw error
    }
  }

  /**
   * Get implementation guides for user
   */
  static async getUserGuides(userId: string, evaluationId?: string) {
    try {
      const where: any = { userId }
      if (evaluationId) {
        where.evaluationId = evaluationId
      }

      const guides = await prisma.implementationGuide.findMany({
        where,
        include: {
          steps: {
            orderBy: { stepNumber: 'asc' }
          }
        },
        orderBy: { createdAt: 'desc' }
      })

      return guides
    } catch (error) {
      console.error('Error getting user guides:', error)
      throw error
    }
  }

  /**
   * Get specific guide with steps
   */
  static async getGuide(guideId: string, userId: string) {
    try {
      const guide = await prisma.implementationGuide.findFirst({
        where: {
          id: guideId,
          userId: userId
        },
        include: {
          steps: {
            orderBy: { stepNumber: 'asc' }
          },
          user: {
            select: {
              businessName: true,
              industry: true
            }
          },
          evaluation: {
            select: {
              id: true,
              businessData: true
            }
          }
        }
      })

      if (!guide) {
        throw new Error('Implementation guide not found')
      }

      return guide
    } catch (error) {
      console.error('Error getting guide:', error)
      throw error
    }
  }

  /**
   * Update guide step completion
   */
  static async updateStepCompletion(stepId: string, userId: string, completed: boolean) {
    try {
      // Verify user owns the guide
      const step = await prisma.guideStep.findFirst({
        where: { 
          id: stepId,
          guide: { userId: userId }
        },
        include: { guide: true }
      })

      if (!step) {
        throw new Error('Guide step not found')
      }

      const updatedStep = await prisma.guideStep.update({
        where: { id: stepId },
        data: {
          completed,
          completedAt: completed ? new Date() : null
        }
      })

      return updatedStep
    } catch (error) {
      console.error('Error updating step completion:', error)
      throw error
    }
  }

  /**
   * Get guide progress statistics
   */
  static async getGuideProgress(guideId: string, userId: string) {
    try {
      const guide = await prisma.implementationGuide.findFirst({
        where: {
          id: guideId,
          userId: userId
        },
        include: {
          steps: true
        }
      })

      if (!guide) {
        throw new Error('Guide not found')
      }

      const totalSteps = guide.steps.length
      const completedSteps = guide.steps.filter(step => step.completed).length
      const progressPercentage = totalSteps > 0 ? (completedSteps / totalSteps) * 100 : 0

      const totalEstimatedTime = guide.steps.reduce((sum, step) => sum + step.estimatedTime, 0)
      const completedTime = guide.steps
        .filter(step => step.completed)
        .reduce((sum, step) => sum + step.estimatedTime, 0)

      return {
        totalSteps,
        completedSteps,
        progressPercentage: Math.round(progressPercentage),
        totalEstimatedTime,
        completedTime,
        remainingTime: totalEstimatedTime - completedTime
      }
    } catch (error) {
      console.error('Error getting guide progress:', error)
      throw error
    }
  }

  /**
   * AI-powered guide generation (simplified implementation)
   */
  private static async callAIForGuideGeneration(request: GuideGenerationRequest): Promise<GeneratedGuide> {
    const { businessContext, improvementOpportunity } = request

    // This is a simplified version. In production, this would call Claude API
    // with structured prompts to generate comprehensive implementation guides
    
    const guideTitle = `${improvementOpportunity.title} Implementation Guide`
    const difficultyMap = { low: 'BEGINNER', medium: 'INTERMEDIATE', high: 'ADVANCED' } as const
    
    // Generate steps based on the improvement type and industry
    const steps = this.generateGuideSteps(improvementOpportunity, businessContext)
    
    const totalTime = steps.reduce((sum, step) => sum + step.estimatedTime, 0)
    
    return {
      id: crypto.randomUUID(),
      title: guideTitle,
      description: `Comprehensive implementation guide for ${improvementOpportunity.title} tailored for ${businessContext.industry} businesses.`,
      industry: businessContext.industry,
      steps,
      estimatedDuration: Math.ceil(totalTime / 60), // Convert minutes to hours
      difficultyLevel: difficultyMap[improvementOpportunity.difficulty],
      resourceRequirements: {
        budget: improvementOpportunity.potentialImpact * 0.1, // 10% of potential impact
        team: this.getRequiredTeamSize(improvementOpportunity.difficulty),
        timeline: improvementOpportunity.timelineEstimate,
        skills: this.getRequiredSkills(improvementOpportunity, businessContext)
      },
      templates: this.getRelevantTemplates(improvementOpportunity.title, businessContext.industry)
    }
  }

  private static generateGuideSteps(opportunity: any, businessContext: any): GuideStepData[] {
    const baseSteps = [
      {
        stepNumber: 1,
        title: "Planning & Assessment",
        description: `Conduct detailed assessment of current state and plan for ${opportunity.title} implementation.`,
        estimatedTime: 120, // 2 hours
        difficulty: "Medium",
        resources: ["Assessment templates", "Project planning tools"],
        tips: ["Involve key stakeholders early", "Document current processes thoroughly"],
        commonPitfalls: ["Underestimating scope", "Insufficient stakeholder buy-in"],
        successMetrics: ["Comprehensive project plan created", "Stakeholder alignment achieved"]
      },
      {
        stepNumber: 2,
        title: "Resource Preparation",
        description: "Secure necessary resources, budget approval, and team assignments.",
        estimatedTime: 90,
        difficulty: "Medium",
        resources: ["Budget templates", "Resource allocation sheets"],
        tips: ["Build buffer time into estimates", "Identify critical path dependencies"],
        commonPitfalls: ["Insufficient resource allocation", "Unclear role definitions"],
        successMetrics: ["Resources secured", "Team roles defined", "Budget approved"]
      },
      {
        stepNumber: 3,
        title: "Implementation Phase",
        description: `Execute the core implementation activities for ${opportunity.title}.`,
        estimatedTime: 240, // 4 hours
        difficulty: opportunity.difficulty === 'high' ? "Hard" : "Medium",
        resources: ["Implementation checklists", "Monitoring tools"],
        tips: ["Monitor progress regularly", "Communicate updates frequently"],
        commonPitfalls: ["Scope creep", "Poor communication", "Inadequate testing"],
        successMetrics: ["Implementation milestones met", "Quality standards maintained"]
      },
      {
        stepNumber: 4,
        title: "Testing & Validation",
        description: "Validate implementation results and measure initial impact.",
        estimatedTime: 90,
        difficulty: "Medium",
        resources: ["Testing frameworks", "Validation checklists"],
        tips: ["Test with real scenarios", "Gather feedback from end users"],
        commonPitfalls: ["Insufficient testing", "Ignoring edge cases"],
        successMetrics: ["All tests passed", "User acceptance achieved"]
      },
      {
        stepNumber: 5,
        title: "Optimization & Rollout",
        description: "Optimize based on test results and complete full rollout.",
        estimatedTime: 150,
        difficulty: "Medium",
        resources: ["Rollout plans", "Training materials"],
        tips: ["Plan for change management", "Provide ongoing support"],
        commonPitfalls: ["Inadequate training", "Poor change management"],
        successMetrics: ["Full rollout completed", "Target metrics achieved"]
      }
    ]

    // Add industry-specific steps
    if (businessContext.industry === 'technology') {
      baseSteps.splice(3, 0, {
        stepNumber: 3.5,
        title: "Technical Integration",
        description: "Integrate with existing technology stack and systems.",
        estimatedTime: 180,
        difficulty: "Hard",
        resources: ["API documentation", "Integration guides"],
        tips: ["Test integrations thoroughly", "Have rollback plan ready"],
        commonPitfalls: ["Integration conflicts", "Performance issues"],
        successMetrics: ["Systems integrated successfully", "Performance benchmarks met"]
      })
    }

    // Re-number steps
    return baseSteps.map((step, index) => ({
      ...step,
      stepNumber: index + 1
    }))
  }

  private static getRequiredTeamSize(difficulty: string): number {
    switch (difficulty) {
      case 'low': return 2
      case 'medium': return 4
      case 'high': return 6
      default: return 3
    }
  }

  private static getRequiredSkills(opportunity: any, businessContext: any): string[] {
    const baseSkills = ['Project Management', 'Business Analysis']
    
    if (businessContext.industry === 'technology') {
      baseSkills.push('Technical Architecture', 'Software Development')
    }
    
    if (opportunity.title.toLowerCase().includes('marketing')) {
      baseSkills.push('Digital Marketing', 'Analytics')
    }
    
    if (opportunity.title.toLowerCase().includes('financial')) {
      baseSkills.push('Financial Analysis', 'Accounting')
    }

    return baseSkills
  }

  private static getRelevantTemplates(opportunityTitle: string, industry: string): any[] {
    return [
      {
        id: `template-${opportunityTitle.toLowerCase().replace(/\s+/g, '-')}`,
        name: `${opportunityTitle} Implementation Template`,
        type: 'document',
        industry: industry
      },
      {
        id: 'project-plan-template',
        name: 'Project Plan Template',
        type: 'spreadsheet',
        industry: 'general'
      }
    ]
  }

  static async updateGuide(guideId: string, userId: string, updates: any) {
    const guide = await prisma.implementationGuide.update({
      where: { 
        id: guideId,
        userId 
      },
      data: updates,
      include: {
        steps: {
          orderBy: { stepNumber: 'asc' }
        }
      }
    })

    return guide
  }

  static async deleteGuide(guideId: string, userId: string) {
    await prisma.implementationGuide.delete({
      where: { 
        id: guideId,
        userId 
      }
    })
  }

  private static async saveGuideToDatabase(request: GuideGenerationRequest, guide: GeneratedGuide) {
    try {
      const savedGuide = await prisma.implementationGuide.create({
        data: {
          userId: request.userId,
          evaluationId: request.evaluationId,
          improvementCategory: request.improvementCategory,
          title: guide.title,
          description: guide.description,
          industry: guide.industry,
          businessContext: request.businessContext,
          estimatedDuration: guide.estimatedDuration,
          difficultyLevel: guide.difficultyLevel,
          resourceRequirements: guide.resourceRequirements,
          templates: guide.templates,
          steps: {
            create: guide.steps.map(step => ({
              stepNumber: step.stepNumber,
              title: step.title,
              description: step.description,
              estimatedTime: step.estimatedTime,
              difficulty: step.difficulty,
              resources: step.resources,
              tips: step.tips,
              commonPitfalls: step.commonPitfalls,
              successMetrics: step.successMetrics
            }))
          }
        },
        include: {
          steps: {
            orderBy: { stepNumber: 'asc' }
          }
        }
      })

      return savedGuide as any
    } catch (error) {
      console.error('Error saving guide to database:', error)
      throw error
    }
  }
}