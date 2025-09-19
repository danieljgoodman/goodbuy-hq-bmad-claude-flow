/**
 * Tier-Based Access Control System
 * Story 11.10: Complete access control architecture with permission checking,
 * usage limits, and tier-based feature gates
 */

import {
  UserTier,
  Permission,
  ConditionalPermission,
  FeaturePermissions,
  TierPermissions,
  PERMISSION_MATRIX,
  PermissionChecker
} from './permission-matrix';

/**
 * Enhanced permission interfaces for the access control system
 */
export interface TierPermissionMatrix {
  basic: TierPermissions;
  professional: TierPermissions;
  enterprise: TierPermissions;
}

export interface FeaturePermission {
  feature: keyof TierPermissions['features'];
  action: string;
  permission: Permission | ConditionalPermission;
  usageLimit?: number;
  timeRestriction?: 'daily' | 'weekly' | 'monthly';
  requiresApproval?: boolean;
}

export interface AccessCondition {
  type: 'usage_limit' | 'time_restriction' | 'approval_required' | 'custom';
  value: any;
  message?: string;
}

export interface AccessResult {
  allowed: boolean;
  permission: Permission;
  conditions?: AccessCondition[];
  reason?: string;
  upgradeRequired?: UserTier;
}

export interface UsageContext {
  userId: string;
  feature: keyof TierPermissions['features'];
  action: string;
  currentUsage?: number;
  timestamp?: Date;
  metadata?: Record<string, any>;
}

/**
 * Main Tier Access Control class
 */
export class TierAccessControl {
  private permissionMatrix: TierPermissionMatrix;
  private usageTracker: Map<string, number> = new Map();

  constructor() {
    this.permissionMatrix = PERMISSION_MATRIX;
  }

  /**
   * Check if user has access to a specific tier
   */
  hasTierAccess(userTier: UserTier, requiredTier: UserTier): boolean {
    const tierHierarchy: Record<UserTier, number> = {
      basic: 1,
      professional: 2,
      enterprise: 3
    };

    return tierHierarchy[userTier] >= tierHierarchy[requiredTier];
  }

  /**
   * Comprehensive permission checking with conditions
   */
  checkPermission(
    userTier: UserTier,
    feature: keyof TierPermissions['features'],
    action: string,
    context?: UsageContext
  ): AccessResult {
    try {
      // Get the permission for this feature/action
      const permission = PermissionChecker.getFeaturePermission(userTier, feature, action);

      if (!permission) {
        return {
          allowed: false,
          permission: 'none',
          reason: `Permission not defined for ${feature}.${action}`,
          upgradeRequired: this.getMinimumTierForPermission(feature, action)
        };
      }

      // Handle simple string permissions
      if (typeof permission === 'string') {
        if (permission === 'none') {
          return {
            allowed: false,
            permission: 'none',
            reason: `Access denied: ${feature}.${action} not available for ${userTier} tier`,
            upgradeRequired: this.getMinimumTierForPermission(feature, action)
          };
        }

        return {
          allowed: true,
          permission: permission as Permission
        };
      }

      // Handle conditional permissions
      const conditionalPermission = permission as ConditionalPermission;
      const conditions: AccessCondition[] = [];

      // Check base permission level
      if (conditionalPermission.permission === 'none') {
        return {
          allowed: false,
          permission: 'none',
          reason: `Access denied: ${feature}.${action} not available for ${userTier} tier`,
          upgradeRequired: this.getMinimumTierForPermission(feature, action)
        };
      }

      // Check usage limits
      if (conditionalPermission.usageLimit && context) {
        const usageKey = this.getUsageKey(context.userId, feature, action, conditionalPermission.timeRestriction);
        const currentUsage = this.getUsage(usageKey);

        if (currentUsage >= conditionalPermission.usageLimit) {
          conditions.push({
            type: 'usage_limit',
            value: conditionalPermission.usageLimit,
            message: `Usage limit exceeded: ${currentUsage}/${conditionalPermission.usageLimit} per ${conditionalPermission.timeRestriction}`
          });
        }
      }

      // Check approval requirements
      if (conditionalPermission.requiresApproval) {
        conditions.push({
          type: 'approval_required',
          value: true,
          message: 'This action requires approval'
        });
      }

      // Check time restrictions
      if (conditionalPermission.timeRestriction && context?.timestamp) {
        const isWithinTimeWindow = this.checkTimeRestriction(
          context.timestamp,
          conditionalPermission.timeRestriction
        );

        if (!isWithinTimeWindow) {
          conditions.push({
            type: 'time_restriction',
            value: conditionalPermission.timeRestriction,
            message: `Action not allowed outside of ${conditionalPermission.timeRestriction} window`
          });
        }
      }

      // Check custom conditions
      if (conditionalPermission.conditions) {
        const customConditionResult = this.checkCustomConditions(
          conditionalPermission.conditions,
          context
        );

        if (!customConditionResult.allowed) {
          conditions.push({
            type: 'custom',
            value: conditionalPermission.conditions,
            message: customConditionResult.message
          });
        }
      }

      // If any blocking conditions exist, deny access
      const blockingConditions = conditions.filter(c =>
        c.type === 'usage_limit' || c.type === 'time_restriction' ||
        (c.type === 'custom' && c.value.blocking)
      );

      if (blockingConditions.length > 0) {
        return {
          allowed: false,
          permission: conditionalPermission.permission,
          conditions: blockingConditions,
          reason: blockingConditions.map(c => c.message).join('; '),
          upgradeRequired: this.getMinimumTierForPermission(feature, action)
        };
      }

      return {
        allowed: true,
        permission: conditionalPermission.permission,
        conditions: conditions.length > 0 ? conditions : undefined
      };

    } catch (error) {
      return {
        allowed: false,
        permission: 'none',
        reason: `Error checking permission: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Get all permissions for a specific tier
   */
  getPermissionsForTier(userTier: UserTier): TierPermissions {
    try {
      return PermissionChecker.getAllPermissions(userTier);
    } catch (error) {
      throw new Error(`Failed to get permissions for tier ${userTier}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Check resource-level permissions
   */
  checkResourcePermission(
    userTier: UserTier,
    resourceType: string,
    action: string,
    context?: UsageContext
  ): AccessResult {
    try {
      const permission = PermissionChecker.getResourcePermission(userTier, resourceType, action);

      if (!permission) {
        return {
          allowed: false,
          permission: 'none',
          reason: `Resource permission not defined for ${resourceType}.${action}`,
          upgradeRequired: this.getMinimumTierForResourcePermission(resourceType, action)
        };
      }

      if (typeof permission === 'string') {
        return {
          allowed: permission !== 'none',
          permission: permission as Permission
        };
      }

      // Handle conditional resource permissions (similar to feature permissions)
      const conditionalPermission = permission as ConditionalPermission;
      return this.evaluateConditionalPermission(conditionalPermission, context, userTier);

    } catch (error) {
      return {
        allowed: false,
        permission: 'none',
        reason: `Error checking resource permission: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Check if user is within tier limits
   */
  checkTierLimits(
    userTier: UserTier,
    limitType: keyof TierPermissions['limits'],
    currentValue: number
  ): AccessResult {
    try {
      const limits = PermissionChecker.getTierLimits(userTier);

      if (!limits) {
        return {
          allowed: false,
          permission: 'none',
          reason: `No limits defined for tier: ${userTier}`
        };
      }

      const limit = limits[limitType];

      // -1 means unlimited
      if (limit === -1) {
        return {
          allowed: true,
          permission: 'admin'
        };
      }

      const withinLimit = currentValue < limit;

      return {
        allowed: withinLimit,
        permission: withinLimit ? 'write' : 'none',
        reason: withinLimit ? undefined : `Limit exceeded: ${currentValue}/${limit} for ${limitType}`,
        upgradeRequired: withinLimit ? undefined : this.getNextTierWithHigherLimit(userTier, limitType)
      };

    } catch (error) {
      return {
        allowed: false,
        permission: 'none',
        reason: `Error checking tier limits: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Track usage for a specific action
   */
  trackUsage(context: UsageContext): void {
    if (!context.userId || !context.feature || !context.action) {
      throw new Error('Invalid usage context: userId, feature, and action are required');
    }

    const permission = PermissionChecker.getFeaturePermission(
      'basic', // Use basic as fallback for getting permission structure
      context.feature,
      context.action
    );

    if (permission && typeof permission !== 'string') {
      const conditionalPermission = permission as ConditionalPermission;
      if (conditionalPermission.usageLimit && conditionalPermission.timeRestriction) {
        const usageKey = this.getUsageKey(
          context.userId,
          context.feature,
          context.action,
          conditionalPermission.timeRestriction
        );

        const currentUsage = this.getUsage(usageKey);
        this.setUsage(usageKey, currentUsage + 1);
      }
    }
  }

  /**
   * Get current usage for a user/feature/action
   */
  getCurrentUsage(
    userId: string,
    feature: keyof TierPermissions['features'],
    action: string,
    timeRestriction?: 'daily' | 'weekly' | 'monthly'
  ): number {
    const usageKey = this.getUsageKey(userId, feature, action, timeRestriction);
    return this.getUsage(usageKey);
  }

  /**
   * Reset usage for a specific context
   */
  resetUsage(
    userId: string,
    feature: keyof TierPermissions['features'],
    action: string,
    timeRestriction?: 'daily' | 'weekly' | 'monthly'
  ): void {
    const usageKey = this.getUsageKey(userId, feature, action, timeRestriction);
    this.usageTracker.delete(usageKey);
  }

  /**
   * Get available features for a tier
   */
  getAvailableFeatures(userTier: UserTier): string[] {
    const permissions = this.getPermissionsForTier(userTier);
    return Object.keys(permissions.features).filter(feature => {
      const featurePermissions = permissions.features[feature as keyof TierPermissions['features']];
      return Object.values(featurePermissions).some(permission => {
        if (typeof permission === 'string') {
          return permission !== 'none';
        }
        return (permission as ConditionalPermission).permission !== 'none';
      });
    });
  }

  /**
   * Get upgrade recommendations
   */
  getUpgradeRecommendations(
    currentTier: UserTier,
    requestedFeature: keyof TierPermissions['features'],
    requestedAction: string
  ): { tier: UserTier; benefits: string[] } | null {
    const requiredTier = this.getMinimumTierForPermission(requestedFeature, requestedAction);

    if (!requiredTier || this.hasTierAccess(currentTier, requiredTier)) {
      return null;
    }

    const benefits = this.getTierUpgradeBenefits(currentTier, requiredTier);

    return {
      tier: requiredTier,
      benefits
    };
  }

  // Private helper methods

  private evaluateConditionalPermission(
    permission: ConditionalPermission,
    context?: UsageContext,
    userTier?: UserTier
  ): AccessResult {
    if (permission.permission === 'none') {
      return {
        allowed: false,
        permission: 'none',
        reason: 'Access denied by conditional permission'
      };
    }

    const conditions: AccessCondition[] = [];

    // Check usage limits if context is provided
    if (permission.usageLimit && context) {
      const usageKey = this.getUsageKey(
        context.userId,
        context.feature,
        context.action,
        permission.timeRestriction
      );
      const currentUsage = this.getUsage(usageKey);

      if (currentUsage >= permission.usageLimit) {
        return {
          allowed: false,
          permission: permission.permission,
          reason: `Usage limit exceeded: ${currentUsage}/${permission.usageLimit}`
        };
      }
    }

    return {
      allowed: true,
      permission: permission.permission,
      conditions: conditions.length > 0 ? conditions : undefined
    };
  }

  private getMinimumTierForPermission(
    feature: keyof TierPermissions['features'],
    action: string
  ): UserTier | undefined {
    const tiers: UserTier[] = ['basic', 'professional', 'enterprise'];

    for (const tier of tiers) {
      const permission = PermissionChecker.getFeaturePermission(tier, feature, action);
      if (permission && permission !== 'none') {
        if (typeof permission === 'string') {
          return tier;
        }
        if ((permission as ConditionalPermission).permission !== 'none') {
          return tier;
        }
      }
    }

    return undefined;
  }

  private getMinimumTierForResourcePermission(
    resourceType: string,
    action: string
  ): UserTier | undefined {
    const tiers: UserTier[] = ['basic', 'professional', 'enterprise'];

    for (const tier of tiers) {
      const permission = PermissionChecker.getResourcePermission(tier, resourceType, action);
      if (permission && permission !== 'none') {
        if (typeof permission === 'string') {
          return tier;
        }
        if ((permission as ConditionalPermission).permission !== 'none') {
          return tier;
        }
      }
    }

    return undefined;
  }

  private getNextTierWithHigherLimit(
    currentTier: UserTier,
    limitType: keyof TierPermissions['limits']
  ): UserTier | undefined {
    const tiers: UserTier[] = ['basic', 'professional', 'enterprise'];
    const currentTierIndex = tiers.indexOf(currentTier);
    const currentLimits = PermissionChecker.getTierLimits(currentTier);

    if (!currentLimits) return undefined;

    const currentLimit = currentLimits[limitType];

    for (let i = currentTierIndex + 1; i < tiers.length; i++) {
      const nextTier = tiers[i];
      const nextLimits = PermissionChecker.getTierLimits(nextTier);

      if (nextLimits) {
        const nextLimit = nextLimits[limitType];
        if (nextLimit === -1 || nextLimit > currentLimit) {
          return nextTier;
        }
      }
    }

    return undefined;
  }

  private getTierUpgradeBenefits(fromTier: UserTier, toTier: UserTier): string[] {
    const fromPermissions = this.getPermissionsForTier(fromTier);
    const toPermissions = this.getPermissionsForTier(toTier);
    const benefits: string[] = [];

    // Compare limits
    Object.entries(toPermissions.limits).forEach(([key, value]) => {
      const fromValue = fromPermissions.limits[key as keyof TierPermissions['limits']];
      if (value === -1 && fromValue !== -1) {
        benefits.push(`Unlimited ${key.replace(/([A-Z])/g, ' $1').toLowerCase()}`);
      } else if (typeof value === 'number' && typeof fromValue === 'number' && value > fromValue) {
        benefits.push(`Increased ${key.replace(/([A-Z])/g, ' $1').toLowerCase()}: ${value} (from ${fromValue})`);
      }
    });

    // Compare features (simplified - could be more detailed)
    Object.keys(toPermissions.features).forEach(feature => {
      const fromFeature = fromPermissions.features[feature as keyof TierPermissions['features']];
      const toFeature = toPermissions.features[feature as keyof TierPermissions['features']];

      const hasNewAccess = Object.entries(toFeature).some(([action, permission]) => {
        const fromPermission = fromFeature[action];
        if (!fromPermission || fromPermission === 'none') {
          return permission !== 'none';
        }
        return false;
      });

      if (hasNewAccess) {
        benefits.push(`Access to ${feature.replace(/_/g, ' ')} features`);
      }
    });

    return benefits;
  }

  private getUsageKey(
    userId: string,
    feature: keyof TierPermissions['features'],
    action: string,
    timeRestriction?: 'daily' | 'weekly' | 'monthly'
  ): string {
    const now = new Date();
    let timeKey = '';

    switch (timeRestriction) {
      case 'daily':
        timeKey = now.toISOString().split('T')[0]; // YYYY-MM-DD
        break;
      case 'weekly':
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - now.getDay());
        timeKey = weekStart.toISOString().split('T')[0];
        break;
      case 'monthly':
        timeKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
        break;
      default:
        timeKey = 'lifetime';
    }

    return `${userId}:${feature}:${action}:${timeKey}`;
  }

  private getUsage(usageKey: string): number {
    return this.usageTracker.get(usageKey) || 0;
  }

  private setUsage(usageKey: string, value: number): void {
    this.usageTracker.set(usageKey, value);
  }

  private checkTimeRestriction(
    timestamp: Date,
    restriction: 'daily' | 'weekly' | 'monthly'
  ): boolean {
    const now = new Date();

    switch (restriction) {
      case 'daily':
        return timestamp.toDateString() === now.toDateString();
      case 'weekly':
        const weekAgo = new Date();
        weekAgo.setDate(now.getDate() - 7);
        return timestamp >= weekAgo;
      case 'monthly':
        const monthAgo = new Date();
        monthAgo.setMonth(now.getMonth() - 1);
        return timestamp >= monthAgo;
      default:
        return true;
    }
  }

  private checkCustomConditions(
    conditions: Record<string, any>,
    context?: UsageContext
  ): { allowed: boolean; message?: string } {
    // Implement custom condition logic based on the conditions object
    // This is a simplified implementation - expand based on specific needs

    if (conditions.maxFilters && context?.metadata?.filterCount) {
      if (context.metadata.filterCount > conditions.maxFilters) {
        return {
          allowed: false,
          message: `Too many filters: ${context.metadata.filterCount}/${conditions.maxFilters}`
        };
      }
    }

    if (conditions.requiresSetup && !context?.metadata?.isSetupComplete) {
      return {
        allowed: false,
        message: 'Setup must be completed before using this feature'
      };
    }

    return { allowed: true };
  }
}

/**
 * Singleton instance for global use
 */
export const tierAccessControl = new TierAccessControl();

/**
 * Convenience functions for common permission checks
 */

/**
 * Check if user has access to a specific tier
 */
export function hasTierAccess(userTier: UserTier, requiredTier: UserTier): boolean {
  return tierAccessControl.hasTierAccess(userTier, requiredTier);
}

/**
 * Check permission for a feature action
 */
export function checkPermission(
  userTier: UserTier,
  feature: keyof TierPermissions['features'],
  action: string,
  context?: UsageContext
): AccessResult {
  return tierAccessControl.checkPermission(userTier, feature, action, context);
}

/**
 * Get all permissions for a tier
 */
export function getPermissionsForTier(userTier: UserTier): TierPermissions {
  return tierAccessControl.getPermissionsForTier(userTier);
}

/**
 * Check if user is within tier limits
 */
export function checkTierLimits(
  userTier: UserTier,
  limitType: keyof TierPermissions['limits'],
  currentValue: number
): AccessResult {
  return tierAccessControl.checkTierLimits(userTier, limitType, currentValue);
}

/**
 * Track usage for rate limiting
 */
export function trackUsage(context: UsageContext): void {
  return tierAccessControl.trackUsage(context);
}

/**
 * Get available features for a tier
 */
export function getAvailableFeatures(userTier: UserTier): string[] {
  return tierAccessControl.getAvailableFeatures(userTier);
}

/**
 * Get upgrade recommendations
 */
export function getUpgradeRecommendations(
  currentTier: UserTier,
  requestedFeature: keyof TierPermissions['features'],
  requestedAction: string
): { tier: UserTier; benefits: string[] } | null {
  return tierAccessControl.getUpgradeRecommendations(currentTier, requestedFeature, requestedAction);
}

// Export all types and utilities
export * from './permission-matrix';
export default tierAccessControl;