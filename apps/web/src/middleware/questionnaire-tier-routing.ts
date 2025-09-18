import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { TierValidationMiddleware } from '@/lib/middleware/tier-validation'

export interface QuestionnaireRoutingOptions {
  requiredTier: 'basic' | 'professional' | 'enterprise'
  allowFallback?: boolean
  redirectOnUpgrade?: boolean
  featureGating?: boolean
}

export interface QuestionnaireAccessResult {
  hasAccess: boolean
  userTier: 'basic' | 'professional' | 'enterprise'
  requiredTier: 'basic' | 'professional' | 'enterprise'
  canAccess: {
    questionnaire: boolean
    autoSave: boolean
    advancedFeatures: boolean
    dataExport: boolean
  }
  restrictions: string[]
  upgradeUrl?: string
  redirectUrl?: string
}

export class QuestionnaireRoutingMiddleware {
  private static readonly QUESTIONNAIRE_ROUTES = {
    basic: '/questionnaire/basic',
    professional: '/questionnaire/professional',
    enterprise: '/questionnaire/enterprise'
  } as const

  private static readonly TIER_FEATURES = {
    basic: {
      questionnaire: true,
      autoSave: false,
      advancedFeatures: false,
      dataExport: false,
      fieldLimit: 15,
      sections: ['businessBasics', 'financialMetrics', 'operationalData']
    },
    professional: {
      questionnaire: true,
      autoSave: true,
      advancedFeatures: true,
      dataExport: true,
      fieldLimit: 45,
      sections: [
        'businessBasics',
        'financialMetrics',
        'customerAnalytics',
        'operationalEfficiency',
        'marketIntelligence',
        'financialPlanning',
        'compliance'
      ]
    },
    enterprise: {
      questionnaire: true,
      autoSave: true,
      advancedFeatures: true,
      dataExport: true,
      fieldLimit: -1, // unlimited
      sections: [
        'businessBasics',
        'financialMetrics',
        'customerAnalytics',
        'operationalEfficiency',
        'marketIntelligence',
        'financialPlanning',
        'compliance',
        'enterpriseAnalytics',
        'customFields'
      ]
    }
  } as const

  /**
   * Validates questionnaire access and routes appropriately
   */
  static async validateQuestionnaireAccess(
    request: NextRequest,
    options: QuestionnaireRoutingOptions
  ): Promise<QuestionnaireAccessResult> {
    try {
      const { userId } = await auth()

      if (!userId) {
        return {
          hasAccess: false,
          userTier: 'basic',
          requiredTier: options.requiredTier,
          canAccess: {
            questionnaire: false,
            autoSave: false,
            advancedFeatures: false,
            dataExport: false
          },
          restrictions: ['Authentication required'],
          redirectUrl: '/sign-in'
        }
      }

      // Validate tier access
      const tierResult = await TierValidationMiddleware.validateTier(request, {
        requiredTier: options.requiredTier,
        featureType: this.getFeatureType(options.requiredTier),
        allowDowngrade: options.allowFallback
      })

      const userFeatures = this.TIER_FEATURES[tierResult.userTier]
      const requiredFeatures = this.TIER_FEATURES[options.requiredTier]

      // Determine access capabilities
      const canAccess = {
        questionnaire: tierResult.hasAccess,
        autoSave: userFeatures.autoSave,
        advancedFeatures: userFeatures.advancedFeatures,
        dataExport: userFeatures.dataExport
      }

      // Generate restrictions based on tier limitations
      const restrictions = this.generateRestrictions(tierResult.userTier, options.requiredTier)

      // Determine redirect URL if needed
      let redirectUrl: string | undefined
      if (options.redirectOnUpgrade && !tierResult.hasAccess) {
        redirectUrl = this.getUpgradeRedirectUrl(tierResult.userTier, options.requiredTier, request)
      } else if (options.allowFallback && !tierResult.hasAccess) {
        redirectUrl = this.getFallbackRedirectUrl(tierResult.userTier, request)
      }

      return {
        hasAccess: tierResult.hasAccess,
        userTier: tierResult.userTier,
        requiredTier: options.requiredTier,
        canAccess,
        restrictions,
        upgradeUrl: tierResult.upgradeUrl,
        redirectUrl
      }

    } catch (error) {
      console.error('Questionnaire routing validation error:', error)
      return {
        hasAccess: false,
        userTier: 'basic',
        requiredTier: options.requiredTier,
        canAccess: {
          questionnaire: false,
          autoSave: false,
          advancedFeatures: false,
          dataExport: false
        },
        restrictions: ['System error - please try again'],
        redirectUrl: '/error'
      }
    }
  }

  /**
   * Middleware for protecting questionnaire routes
   */
  static async questionnaireRouteGuard(
    request: NextRequest,
    targetTier: 'basic' | 'professional' | 'enterprise'
  ): Promise<NextResponse | null> {
    const accessResult = await this.validateQuestionnaireAccess(request, {
      requiredTier: targetTier,
      allowFallback: true,
      redirectOnUpgrade: false,
      featureGating: true
    })

    // Allow access if user has sufficient tier
    if (accessResult.hasAccess) {
      return null // Continue to route
    }

    // If user has higher tier but accessing lower tier route, allow with warnings
    if (this.isHigherTier(accessResult.userTier, targetTier)) {
      // Add header to indicate tier mismatch but allow access
      const response = NextResponse.next()
      response.headers.set('X-Tier-Warning', `Using ${targetTier} questionnaire with ${accessResult.userTier} tier`)
      return response
    }

    // If fallback is possible, redirect to appropriate tier
    if (accessResult.redirectUrl) {
      return NextResponse.redirect(new URL(accessResult.redirectUrl, request.url))
    }

    // Otherwise, show upgrade page
    const upgradeUrl = accessResult.upgradeUrl || `/upgrade?from=${accessResult.userTier}&to=${targetTier}`
    return NextResponse.redirect(new URL(upgradeUrl, request.url))
  }

  /**
   * API route middleware for questionnaire endpoints
   */
  static async apiRouteGuard(
    request: NextRequest,
    requiredTier: 'basic' | 'professional' | 'enterprise'
  ): Promise<NextResponse | null> {
    const accessResult = await this.validateQuestionnaireAccess(request, {
      requiredTier,
      allowFallback: false,
      redirectOnUpgrade: false,
      featureGating: true
    })

    if (!accessResult.hasAccess) {
      return NextResponse.json(
        {
          error: 'Insufficient tier access',
          required: requiredTier,
          current: accessResult.userTier,
          upgradeUrl: accessResult.upgradeUrl,
          restrictions: accessResult.restrictions,
          canAccess: accessResult.canAccess
        },
        { status: 403 }
      )
    }

    // Add tier information to response headers for client use
    const response = NextResponse.next()
    response.headers.set('X-User-Tier', accessResult.userTier)
    response.headers.set('X-Required-Tier', requiredTier)
    response.headers.set('X-Can-Auto-Save', accessResult.canAccess.autoSave.toString())
    response.headers.set('X-Can-Export', accessResult.canAccess.dataExport.toString())

    return response
  }

  /**
   * Gets feature type for tier validation
   */
  private static getFeatureType(tier: 'basic' | 'professional' | 'enterprise'): string {
    const featureMap = {
      basic: 'basic_evaluation',
      professional: 'professional_evaluation',
      enterprise: 'enterprise_evaluation'
    }
    return featureMap[tier]
  }

  /**
   * Generates tier-specific restrictions
   */
  private static generateRestrictions(
    userTier: 'basic' | 'professional' | 'enterprise',
    requiredTier: 'basic' | 'professional' | 'enterprise'
  ): string[] {
    const restrictions: string[] = []
    const userFeatures = this.TIER_FEATURES[userTier]
    const requiredFeatures = this.TIER_FEATURES[requiredTier]

    if (userFeatures.fieldLimit !== -1 && requiredFeatures.fieldLimit > userFeatures.fieldLimit) {
      restrictions.push(`Limited to ${userFeatures.fieldLimit} fields (${requiredFeatures.fieldLimit} required)`)
    }

    if (!userFeatures.autoSave && requiredFeatures.autoSave) {
      restrictions.push('Auto-save not available')
    }

    if (!userFeatures.advancedFeatures && requiredFeatures.advancedFeatures) {
      restrictions.push('Advanced analytics not available')
    }

    if (!userFeatures.dataExport && requiredFeatures.dataExport) {
      restrictions.push('Data export not available')
    }

    const missingSections = requiredFeatures.sections.filter(
      section => !userFeatures.sections.includes(section)
    )

    if (missingSections.length > 0) {
      restrictions.push(`Sections not available: ${missingSections.join(', ')}`)
    }

    return restrictions
  }

  /**
   * Determines if user has higher tier than target
   */
  private static isHigherTier(
    userTier: 'basic' | 'professional' | 'enterprise',
    targetTier: 'basic' | 'professional' | 'enterprise'
  ): boolean {
    const tierHierarchy = { basic: 1, professional: 2, enterprise: 3 }
    return tierHierarchy[userTier] > tierHierarchy[targetTier]
  }

  /**
   * Gets upgrade redirect URL
   */
  private static getUpgradeRedirectUrl(
    userTier: 'basic' | 'professional' | 'enterprise',
    requiredTier: 'basic' | 'professional' | 'enterprise',
    request: NextRequest
  ): string {
    const currentPath = request.nextUrl.pathname
    const upgradeUrl = `/upgrade?from=${userTier}&to=${requiredTier}&return=${encodeURIComponent(currentPath)}`
    return upgradeUrl
  }

  /**
   * Gets fallback redirect URL for lower tier access
   */
  private static getFallbackRedirectUrl(
    userTier: 'basic' | 'professional' | 'enterprise',
    request: NextRequest
  ): string {
    const fallbackRoute = this.QUESTIONNAIRE_ROUTES[userTier]
    const currentQuery = request.nextUrl.search
    return `${fallbackRoute}${currentQuery}`
  }

  /**
   * Creates tier-aware response with feature information
   */
  static createTierAwareResponse(
    data: any,
    accessResult: QuestionnaireAccessResult,
    options?: { includeFeatures?: boolean; includeUpgradeInfo?: boolean }
  ): NextResponse {
    const response = {
      data,
      tierInfo: {
        userTier: accessResult.userTier,
        requiredTier: accessResult.requiredTier,
        hasAccess: accessResult.hasAccess,
        restrictions: accessResult.restrictions
      },
      ...(options?.includeFeatures && {
        features: accessResult.canAccess
      }),
      ...(options?.includeUpgradeInfo && !accessResult.hasAccess && {
        upgrade: {
          required: true,
          currentTier: accessResult.userTier,
          requiredTier: accessResult.requiredTier,
          upgradeUrl: accessResult.upgradeUrl
        }
      })
    }

    return NextResponse.json(response)
  }

  /**
   * Logs questionnaire access for analytics and audit
   */
  static async logQuestionnaireAccess(
    userId: string,
    questionnaireType: 'basic' | 'professional' | 'enterprise',
    accessResult: QuestionnaireAccessResult,
    request: NextRequest,
    action: 'view' | 'create' | 'update' | 'export' = 'view'
  ): Promise<void> {
    try {
      // This would integrate with your analytics/audit system
      const logData = {
        userId,
        questionnaireType,
        userTier: accessResult.userTier,
        hasAccess: accessResult.hasAccess,
        action,
        restrictions: accessResult.restrictions,
        timestamp: new Date().toISOString(),
        userAgent: request.headers.get('user-agent'),
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        path: request.nextUrl.pathname
      }

      console.log('Questionnaire access logged:', logData)
      // In production, send to analytics service
    } catch (error) {
      console.error('Failed to log questionnaire access:', error)
      // Don't throw - logging failures shouldn't break functionality
    }
  }

  /**
   * Gets tier-specific questionnaire configuration
   */
  static getQuestionnaireConfig(tier: 'basic' | 'professional' | 'enterprise') {
    return {
      ...this.TIER_FEATURES[tier],
      tierName: tier,
      route: this.QUESTIONNAIRE_ROUTES[tier]
    }
  }

  /**
   * Validates questionnaire data against tier limits
   */
  static validateQuestionnaireData(
    data: any,
    userTier: 'basic' | 'professional' | 'enterprise'
  ): { isValid: boolean; errors: string[]; warnings: string[] } {
    const errors: string[] = []
    const warnings: string[] = []
    const tierFeatures = this.TIER_FEATURES[userTier]

    // Field count validation
    if (tierFeatures.fieldLimit !== -1) {
      const fieldCount = this.countDataFields(data)
      if (fieldCount > tierFeatures.fieldLimit) {
        errors.push(`Too many fields: ${fieldCount}/${tierFeatures.fieldLimit}`)
      }
    }

    // Section validation
    if (data && typeof data === 'object') {
      Object.keys(data).forEach(section => {
        if (!tierFeatures.sections.includes(section)) {
          warnings.push(`Section '${section}' not available in ${userTier} tier`)
        }
      })
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    }
  }

  /**
   * Counts fields in questionnaire data
   */
  private static countDataFields(data: any): number {
    if (!data || typeof data !== 'object') return 0

    let count = 0
    Object.values(data).forEach(value => {
      if (value && typeof value === 'object') {
        count += Object.keys(value).length
      }
    })

    return count
  }
}