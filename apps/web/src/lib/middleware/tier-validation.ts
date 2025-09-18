import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { ProfessionalTierDataSchema, validateTierData } from '@/lib/validations/professional-tier'

export interface TierValidationResult {
  isValid: boolean
  userTier: 'basic' | 'professional' | 'enterprise'
  hasAccess: boolean
  requiredTier: 'basic' | 'professional' | 'enterprise'
  upgradeRequired: boolean
  upgradeUrl?: string
  restrictions?: string[]
  reason?: string
}

export interface TierValidationOptions {
  requiredTier: 'basic' | 'professional' | 'enterprise'
  featureType?: 'analytics' | 'reporting' | 'data_export' | 'advanced_ai'
  allowDowngrade?: boolean
  strict?: boolean
}

export interface UserWithSubscription {
  id: string
  email: string
  subscriptionTier: string
  stripeCustomerId?: string
  subscription?: {
    status: string
    tier: string
    currentPeriodEnd: Date
  }
}

class TierValidationMiddleware {
  private static readonly TIER_HIERARCHY = {
    basic: 1,
    professional: 2,
    enterprise: 3
  } as const

  /**
   * Validates user's tier access for a specific feature
   */
  static async validateTier(
    request: NextRequest,
    options: TierValidationOptions
  ): Promise<TierValidationResult> {
    try {
      const { userId } = await auth()

      if (!userId) {
        return {
          isValid: false,
          userTier: 'basic',
          hasAccess: false,
          requiredTier: options.requiredTier,
          upgradeRequired: true,
          reason: 'User not authenticated'
        }
      }

      const user = await this.getUserWithSubscription(userId)
      const userTierLevel = this.TIER_HIERARCHY[user.subscriptionTier as keyof typeof this.TIER_HIERARCHY] || 1
      const requiredTierLevel = this.TIER_HIERARCHY[options.requiredTier]

      const hasAccess = userTierLevel >= requiredTierLevel
      const upgradeRequired = !hasAccess && !options.allowDowngrade

      // Check subscription status for paid tiers
      if (user.subscriptionTier !== 'basic' && user.subscription) {
        const isExpired = new Date() > user.subscription.currentPeriodEnd
        const isInactive = !['active', 'trialing'].includes(user.subscription.status)

        if (isExpired || isInactive) {
          return {
            isValid: false,
            userTier: 'basic', // Downgrade to basic if subscription is inactive
            hasAccess: options.requiredTier === 'basic',
            requiredTier: options.requiredTier,
            upgradeRequired: options.requiredTier !== 'basic',
            reason: 'Subscription expired or inactive'
          }
        }
      }

      return {
        isValid: true,
        userTier: user.subscriptionTier as 'basic' | 'professional' | 'enterprise',
        hasAccess,
        requiredTier: options.requiredTier,
        upgradeRequired,
        upgradeUrl: upgradeRequired ? this.getUpgradeUrl(user.subscriptionTier, options.requiredTier) : undefined,
        restrictions: this.getTierRestrictions(user.subscriptionTier, options.featureType)
      }
    } catch (error) {
      console.error('Tier validation error:', error)
      return {
        isValid: false,
        userTier: 'basic',
        hasAccess: false,
        requiredTier: options.requiredTier,
        upgradeRequired: true,
        reason: 'Validation error'
      }
    }
  }

  /**
   * Validates Professional tier data structure
   */
  static validateProfessionalData(data: any): { isValid: boolean; errors?: any; sanitizedData?: any } {
    try {
      const result = ProfessionalTierDataSchema.safeParse(data)

      if (!result.success) {
        return {
          isValid: false,
          errors: result.error.flatten()
        }
      }

      return {
        isValid: true,
        sanitizedData: result.data
      }
    } catch (error) {
      return {
        isValid: false,
        errors: { general: 'Invalid data format' }
      }
    }
  }

  /**
   * Filters evaluation data based on user's tier
   */
  static filterDataByTier(
    data: any,
    userTier: 'basic' | 'professional' | 'enterprise',
    dataType: 'evaluation' | 'list' | 'summary'
  ): any {
    if (!data) return data

    // For basic tier users, remove professional data
    if (userTier === 'basic') {
      if (Array.isArray(data)) {
        return data.map(item => this.filterSingleEvaluation(item, userTier))
      } else {
        return this.filterSingleEvaluation(data, userTier)
      }
    }

    // For professional and enterprise users, return full data
    return data
  }

  /**
   * Filters a single evaluation based on user tier
   */
  private static filterSingleEvaluation(evaluation: any, userTier: 'basic' | 'professional' | 'enterprise'): any {
    if (userTier === 'basic') {
      const { professionalData, analysisDepth, dataVersion, ...basicEvaluation } = evaluation
      return {
        ...basicEvaluation,
        subscriptionTier: 'basic'
      }
    }
    return evaluation
  }

  /**
   * Creates a tier-aware API response
   */
  static createTierAwareResponse(
    data: any,
    tierResult: TierValidationResult,
    options?: { includeUpgradeInfo?: boolean; includeMetadata?: boolean }
  ): NextResponse {
    const response = {
      data,
      tierInfo: {
        userTier: tierResult.userTier,
        hasAccess: tierResult.hasAccess,
        ...(options?.includeUpgradeInfo && tierResult.upgradeRequired && {
          upgrade: {
            required: true,
            currentTier: tierResult.userTier,
            requiredTier: tierResult.requiredTier,
            upgradeUrl: tierResult.upgradeUrl
          }
        }),
        ...(tierResult.restrictions && {
          restrictions: tierResult.restrictions
        })
      },
      ...(options?.includeMetadata && {
        metadata: {
          timestamp: new Date().toISOString(),
          dataFiltered: tierResult.userTier === 'basic',
          responseType: Array.isArray(data) ? 'list' : 'single'
        }
      })
    }

    return NextResponse.json(response)
  }

  /**
   * Middleware for protecting Professional tier endpoints
   */
  static async protectProfessionalEndpoint(request: NextRequest): Promise<NextResponse | null> {
    const tierResult = await this.validateTier(request, {
      requiredTier: 'professional',
      strict: true
    })

    if (!tierResult.hasAccess) {
      return NextResponse.json(
        {
          error: 'Insufficient tier access',
          required: 'professional',
          current: tierResult.userTier,
          upgradeUrl: tierResult.upgradeUrl
        },
        { status: 403 }
      )
    }

    return null // Continue processing
  }

  /**
   * Audit log for Professional tier data access
   */
  static async logProfessionalDataAccess(
    evaluationId: string,
    userId: string,
    action: 'view' | 'create' | 'update' | 'export',
    request: NextRequest,
    additionalData?: any
  ): Promise<void> {
    try {
      await prisma.professionalDataAudit.create({
        data: {
          businessEvaluationId: evaluationId,
          userId,
          changeType: action === 'view' ? 'admin_access' : action === 'export' ? 'data_export' : 'updated',
          previousData: null,
          newData: additionalData || null,
          changedFields: [action],
          userAgent: request.headers.get('user-agent'),
          ipAddress: this.getClientIpAddress(request),
          sessionId: this.getSessionId(request),
          requestId: request.headers.get('x-request-id') || crypto.randomUUID(),
        }
      })
    } catch (error) {
      console.error('Failed to log professional data access:', error)
      // Don't throw - logging failure shouldn't break the main flow
    }
  }

  /**
   * Gets user with subscription information
   */
  private static async getUserWithSubscription(userId: string): Promise<UserWithSubscription> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        subscriptions: {
          where: { status: { in: ['ACTIVE', 'TRIALING'] } },
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      }
    })

    if (!user) {
      throw new Error('User not found')
    }

    const subscription = user.subscriptions[0]

    return {
      id: user.id,
      email: user.email,
      subscriptionTier: user.subscriptionTier || 'basic',
      stripeCustomerId: user.stripeCustomerId || undefined,
      subscription: subscription ? {
        status: subscription.status,
        tier: subscription.tier,
        currentPeriodEnd: subscription.currentPeriodEnd
      } : undefined
    }
  }

  /**
   * Gets upgrade URL based on current and required tier
   */
  private static getUpgradeUrl(currentTier: string, requiredTier: string): string {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || ''
    return `${baseUrl}/upgrade?from=${currentTier}&to=${requiredTier}`
  }

  /**
   * Gets tier-specific restrictions
   */
  private static getTierRestrictions(tier: string, featureType?: string): string[] {
    const restrictions: string[] = []

    if (tier === 'basic') {
      restrictions.push('Limited to 15 data fields')
      restrictions.push('Basic valuation methods only')
      restrictions.push('Standard reporting format')

      if (featureType === 'analytics') {
        restrictions.push('Advanced analytics not available')
      }
      if (featureType === 'data_export') {
        restrictions.push('Limited export formats')
      }
    }

    return restrictions
  }

  /**
   * Extracts client IP address from request
   */
  private static getClientIpAddress(request: NextRequest): string {
    const forwarded = request.headers.get('x-forwarded-for')
    const realIp = request.headers.get('x-real-ip')

    if (forwarded) {
      return forwarded.split(',')[0].trim()
    }

    if (realIp) {
      return realIp
    }

    return 'unknown'
  }

  /**
   * Extracts session ID from request
   */
  private static getSessionId(request: NextRequest): string | null {
    // Try to get session ID from various sources
    const sessionCookie = request.cookies.get('session-id')?.value
    const authHeader = request.headers.get('authorization')

    if (sessionCookie) {
      return sessionCookie
    }

    if (authHeader && authHeader.startsWith('Bearer ')) {
      // Extract session info from JWT token if needed
      return authHeader.substring(7, 47) // First 40 chars as session identifier
    }

    return null
  }

  /**
   * Validates tier upgrade request
   */
  static async validateTierUpgrade(
    userId: string,
    evaluationId: string,
    targetTier: 'professional' | 'enterprise',
    professionalData: any
  ): Promise<{ isValid: boolean; errors?: any; canUpgrade?: boolean }> {
    try {
      // Validate user can upgrade
      const user = await this.getUserWithSubscription(userId)
      const currentTierLevel = this.TIER_HIERARCHY[user.subscriptionTier as keyof typeof this.TIER_HIERARCHY]
      const targetTierLevel = this.TIER_HIERARCHY[targetTier]

      if (currentTierLevel >= targetTierLevel) {
        return {
          isValid: false,
          errors: { tier: 'User already has equal or higher tier access' },
          canUpgrade: false
        }
      }

      // Validate evaluation exists and belongs to user
      const evaluation = await prisma.businessEvaluation.findFirst({
        where: {
          id: evaluationId,
          userId,
          deletedAt: null
        }
      })

      if (!evaluation) {
        return {
          isValid: false,
          errors: { evaluation: 'Evaluation not found or access denied' },
          canUpgrade: false
        }
      }

      // Validate professional data structure
      const dataValidation = this.validateProfessionalData(professionalData)
      if (!dataValidation.isValid) {
        return {
          isValid: false,
          errors: dataValidation.errors,
          canUpgrade: true
        }
      }

      return {
        isValid: true,
        canUpgrade: true
      }
    } catch (error) {
      console.error('Tier upgrade validation error:', error)
      return {
        isValid: false,
        errors: { general: 'Validation failed' },
        canUpgrade: false
      }
    }
  }
}

export { TierValidationMiddleware }