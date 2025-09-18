import { NextRequest, NextResponse } from 'next/server'
import { PremiumAccessService, PremiumAccessCheck } from '@/lib/services/PremiumAccessService'
import { getServerAuth } from '@/lib/auth'

export interface TierValidationOptions {
  requiredTier?: 'PREMIUM' | 'ENTERPRISE'
  featureType?: 'ai_guides' | 'progress_tracking' | 'pdf_reports' | 'analytics' | 'benchmarks' | 'priority_support'
  fallbackToBasic?: boolean
  customErrorMessage?: string
}

export interface TierValidationResult {
  hasAccess: boolean
  userTier: string
  accessCheck: PremiumAccessCheck
  userId: string
  user: any
}

/**
 * Middleware to validate user subscription tier for API endpoints
 * Integrates with existing NextAuth and PremiumAccessService
 */
export class TierValidationMiddleware {

  /**
   * Validate user's subscription tier and return access information
   * @param request NextRequest object
   * @param options TierValidationOptions
   * @returns TierValidationResult with access information
   */
  static async validateTier(
    request: NextRequest,
    options: TierValidationOptions = {}
  ): Promise<TierValidationResult> {
    const {
      requiredTier = 'PREMIUM',
      featureType = 'analytics',
      fallbackToBasic = true
    } = options

    try {
      // Extract user information from various sources
      const userId = await this.extractUserId(request)

      if (!userId) {
        return {
          hasAccess: false,
          userTier: 'NONE',
          accessCheck: {
            hasAccess: false,
            reason: 'User not authenticated'
          },
          userId: '',
          user: null
        }
      }

      // Get user authentication details
      const user = await this.getUserDetails(request, userId)

      if (!user) {
        return {
          hasAccess: false,
          userTier: 'NONE',
          accessCheck: {
            hasAccess: false,
            reason: 'User not found'
          },
          userId,
          user: null
        }
      }

      // Check premium access using existing service
      const accessCheck = await PremiumAccessService.checkPremiumAccess(
        userId,
        featureType,
        requiredTier
      )

      return {
        hasAccess: accessCheck.hasAccess || fallbackToBasic,
        userTier: user.subscriptionTier || 'FREE',
        accessCheck,
        userId,
        user
      }

    } catch (error) {
      console.error('Error in tier validation middleware:', error)

      return {
        hasAccess: fallbackToBasic,
        userTier: 'FREE',
        accessCheck: {
          hasAccess: false,
          reason: 'Validation error'
        },
        userId: '',
        user: null
      }
    }
  }

  /**
   * Create a middleware function that validates tier and calls next function
   * @param options TierValidationOptions
   * @returns Middleware function
   */
  static createMiddleware(options: TierValidationOptions = {}) {
    return async (
      request: NextRequest,
      handler: (req: NextRequest, tierInfo: TierValidationResult) => Promise<NextResponse>
    ): Promise<NextResponse> => {
      const tierResult = await this.validateTier(request, options)

      if (!tierResult.hasAccess && !options.fallbackToBasic) {
        return this.createAccessDeniedResponse(tierResult.accessCheck, options.customErrorMessage)
      }

      return handler(request, tierResult)
    }
  }

  /**
   * Helper to create standardized access denied response
   */
  static createAccessDeniedResponse(
    accessCheck: PremiumAccessCheck,
    customMessage?: string
  ): NextResponse {
    const message = customMessage || 'Subscription upgrade required'

    return NextResponse.json({
      error: message,
      accessRequired: true,
      reason: accessCheck.reason,
      subscriptionStatus: accessCheck.subscriptionStatus,
      upgradeRequired: accessCheck.upgradeRequired,
      trialInfo: accessCheck.trialInfo
    }, { status: 403 })
  }

  /**
   * Filter data based on user's subscription tier
   * @param data Original data to filter
   * @param userTier User's subscription tier
   * @param dataType Type of data being filtered
   * @returns Filtered data appropriate for user's tier
   */
  static filterDataByTier<T>(
    data: T,
    userTier: string,
    dataType: 'evaluation' | 'report' | 'analytics' = 'evaluation'
  ): T {
    const tier = userTier || 'FREE'

    // For FREE/BASIC tier users, limit data access
    if (tier === 'FREE') {
      return this.applyBasicTierLimits(data, dataType)
    }

    // PREMIUM and ENTERPRISE users get full access
    if (tier === 'PREMIUM' || tier === 'ENTERPRISE') {
      return data
    }

    // Default to basic tier limits for unknown tiers
    return this.applyBasicTierLimits(data, dataType)
  }

  /**
   * Apply basic tier limitations to data
   */
  private static applyBasicTierLimits<T>(data: T, dataType: string): T {
    if (!data || typeof data !== 'object') {
      return data
    }

    const limitedData = { ...data } as any

    switch (dataType) {
      case 'evaluation':
        // Limit evaluation data for basic users
        if (limitedData.valuations) {
          // Keep only basic valuation methods
          const basicMethods = ['revenue_multiple', 'asset_based']
          limitedData.valuations = Object.keys(limitedData.valuations)
            .filter(key => basicMethods.includes(key))
            .reduce((obj: any, key) => {
              obj[key] = limitedData.valuations[key]
              return obj
            }, {})
        }

        // Limit opportunities to top 3
        if (limitedData.opportunities && Array.isArray(limitedData.opportunities)) {
          limitedData.opportunities = limitedData.opportunities.slice(0, 3)
        }

        // Remove premium insights
        if (limitedData.insights) {
          limitedData.insights = {
            ...limitedData.insights,
            market_analysis: null,
            competitive_positioning: null,
            growth_projections: null
          }
        }
        break

      case 'report':
        // Limit report sections for basic users
        limitedData.sections = limitedData.sections?.slice(0, 5) || []
        limitedData.charts = limitedData.charts?.slice(0, 3) || []
        break

      case 'analytics':
        // Limit analytics data
        limitedData.trends = limitedData.trends?.slice(0, 30) || [] // Last 30 days only
        limitedData.benchmarks = null // No benchmarks for basic users
        limitedData.predictions = null // No predictive analytics
        break
    }

    return limitedData
  }

  /**
   * Extract user ID from request (supports multiple auth methods)
   */
  private static async extractUserId(request: NextRequest): Promise<string | null> {
    try {
      // Method 1: From Authorization header
      const authHeader = request.headers.get('authorization')
      if (authHeader && authHeader.startsWith('Bearer ')) {
        // This would be for API tokens - implement if needed
        // For now, skip this method
      }

      // Method 2: From request body (for POST requests)
      if (request.method === 'POST') {
        try {
          const body = await request.clone().json()
          if (body.userId) {
            return body.userId
          }
        } catch {
          // Body might not be JSON, continue to next method
        }
      }

      // Method 3: From query parameters
      const { searchParams } = new URL(request.url)
      const userIdFromParams = searchParams.get('userId')
      if (userIdFromParams) {
        return userIdFromParams
      }

      // Method 4: From cookies/session (NextAuth)
      // This would require accessing the session - implement based on your auth setup

      return null
    } catch (error) {
      console.error('Error extracting user ID:', error)
      return null
    }
  }

  /**
   * Get user details from database or session
   */
  private static async getUserDetails(request: NextRequest, userId: string): Promise<any> {
    try {
      // Try to get user from auth service
      const userEmail = request.headers.get('x-user-email') // Custom header if available
      if (userEmail) {
        return await getServerAuth(userEmail)
      }

      // Fallback: Make a direct database query using the existing service
      // This uses the same logic as PremiumAccessService for consistency
      const accessCheck = await PremiumAccessService.checkPremiumAccess(userId, 'analytics', 'FREE')

      if (accessCheck.hasAccess !== false) {
        // User exists, return basic info
        return {
          id: userId,
          subscriptionTier: 'FREE' // Will be updated by the access check
        }
      }

      return null
    } catch (error) {
      console.error('Error getting user details:', error)
      return null
    }
  }

  /**
   * Check if user has access to specific feature
   */
  static async checkFeatureAccess(
    userId: string,
    feature: 'ai_guides' | 'progress_tracking' | 'pdf_reports' | 'analytics' | 'benchmarks' | 'priority_support'
  ): Promise<PremiumAccessCheck> {
    const requiredTierMap = {
      'ai_guides': 'PREMIUM' as const,
      'progress_tracking': 'PREMIUM' as const,
      'pdf_reports': 'PREMIUM' as const,
      'analytics': 'PREMIUM' as const,
      'benchmarks': 'ENTERPRISE' as const,
      'priority_support': 'PREMIUM' as const
    }

    return await PremiumAccessService.checkPremiumAccess(
      userId,
      feature,
      requiredTierMap[feature]
    )
  }

  /**
   * Create enhanced response with tier information
   */
  static createTierAwareResponse(
    data: any,
    tierInfo: TierValidationResult,
    options: { includeUpgradeInfo?: boolean } = {}
  ): NextResponse {
    const response = {
      data: this.filterDataByTier(data, tierInfo.userTier),
      meta: {
        userTier: tierInfo.userTier,
        hasFullAccess: tierInfo.hasAccess,
        accessLimited: !tierInfo.hasAccess
      }
    }

    // Include upgrade information if user has limited access
    if (!tierInfo.hasAccess && options.includeUpgradeInfo && tierInfo.accessCheck.upgradeRequired) {
      response.meta = {
        ...response.meta,
        upgradeRequired: tierInfo.accessCheck.upgradeRequired
      }
    }

    return NextResponse.json(response)
  }
}

export default TierValidationMiddleware