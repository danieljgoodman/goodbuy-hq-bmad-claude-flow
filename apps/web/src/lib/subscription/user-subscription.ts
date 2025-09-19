/**
 * User Subscription Details Service
 * Story 11.10: Helper service for fetching user subscription information
 */

import { UserTier } from '@/lib/access-control/permission-matrix';
import { auth } from '@clerk/nextjs';

export interface UserSubscriptionDetails {
  userId: string;
  tier: UserTier;
  status: 'active' | 'canceled' | 'past_due' | 'unpaid' | 'incomplete' | 'trialing';
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
  trialEnd?: Date;
  metadata?: Record<string, any>;
  features: {
    maxReports: number;
    maxEvaluations: number;
    maxAiAnalyses: number;
    maxScenarios: number;
    storageLimit: number;
    apiCallsPerMonth: number;
    concurrentUsers: number;
    dataRetentionDays: number;
  };
  usage?: {
    reportsUsed: number;
    evaluationsUsed: number;
    aiAnalysesUsed: number;
    scenariosUsed: number;
    storageUsed: number;
    apiCallsUsed: number;
    lastResetDate: Date;
  };
}

// Cache for subscription details to reduce database hits
const subscriptionCache = new Map<string, { data: UserSubscriptionDetails; expiry: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Get user subscription details with comprehensive tier information
 */
export async function getUserSubscriptionDetails(userId: string): Promise<UserSubscriptionDetails | null> {
  try {
    // Check cache first
    const now = Date.now();
    const cached = subscriptionCache.get(userId);
    if (cached && cached.expiry > now) {
      return cached.data;
    }

    // In a real implementation, this would query your database
    // For now, we'll simulate the database query
    const subscriptionData = await fetchSubscriptionFromDatabase(userId);

    if (!subscriptionData) {
      return null;
    }

    // Get tier-specific feature limits
    const features = getTierFeatureLimits(subscriptionData.tier);

    // Get current usage
    const usage = await getCurrentUsage(userId);

    const userSubscription: UserSubscriptionDetails = {
      userId,
      tier: subscriptionData.tier,
      status: subscriptionData.status,
      stripeCustomerId: subscriptionData.stripeCustomerId,
      stripeSubscriptionId: subscriptionData.stripeSubscriptionId,
      currentPeriodStart: subscriptionData.currentPeriodStart,
      currentPeriodEnd: subscriptionData.currentPeriodEnd,
      cancelAtPeriodEnd: subscriptionData.cancelAtPeriodEnd,
      trialEnd: subscriptionData.trialEnd,
      metadata: subscriptionData.metadata,
      features,
      usage
    };

    // Cache the result
    subscriptionCache.set(userId, {
      data: userSubscription,
      expiry: now + CACHE_TTL
    });

    return userSubscription;

  } catch (error) {
    console.error('Error fetching subscription details:', error);
    return null;
  }
}

/**
 * Get tier-specific feature limits
 */
function getTierFeatureLimits(tier: UserTier): UserSubscriptionDetails['features'] {
  switch (tier) {
    case 'basic':
      return {
        maxReports: 5,
        maxEvaluations: 2,
        maxAiAnalyses: 0,
        maxScenarios: 0,
        storageLimit: 100, // MB
        apiCallsPerMonth: 0,
        concurrentUsers: 1,
        dataRetentionDays: 30
      };

    case 'professional':
      return {
        maxReports: 25,
        maxEvaluations: 10,
        maxAiAnalyses: 20,
        maxScenarios: 8,
        storageLimit: 1000, // MB (1GB)
        apiCallsPerMonth: 10000,
        concurrentUsers: 3,
        dataRetentionDays: 365
      };

    case 'enterprise':
      return {
        maxReports: -1, // Unlimited
        maxEvaluations: -1, // Unlimited
        maxAiAnalyses: -1, // Unlimited
        maxScenarios: -1, // Unlimited
        storageLimit: -1, // Unlimited
        apiCallsPerMonth: -1, // Unlimited
        concurrentUsers: -1, // Unlimited
        dataRetentionDays: -1 // Unlimited
      };

    default:
      // Default to basic tier limits
      return getTierFeatureLimits('basic');
  }
}

/**
 * Simulate database query for subscription data
 * In production, this would use Prisma or your ORM of choice
 */
async function fetchSubscriptionFromDatabase(userId: string): Promise<{
  tier: UserTier;
  status: UserSubscriptionDetails['status'];
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
  trialEnd?: Date;
  metadata?: Record<string, any>;
} | null> {
  // TODO: Replace with actual database query
  // const subscription = await prisma.subscription.findUnique({
  //   where: { userId },
  //   include: { user: true }
  // });

  // For development/demo purposes, return a mock subscription
  // In production, remove this and implement actual database query
  const mockSubscriptions: Record<string, any> = {
    // This would be replaced with actual database data
  };

  // Simulate database delay
  await new Promise(resolve => setTimeout(resolve, 10));

  // For now, return basic tier as default
  // This should be replaced with actual database logic
  const now = new Date();
  const monthFromNow = new Date();
  monthFromNow.setMonth(monthFromNow.getMonth() + 1);

  return {
    tier: 'basic', // This should come from the database
    status: 'active',
    currentPeriodStart: now,
    currentPeriodEnd: monthFromNow,
    cancelAtPeriodEnd: false,
    metadata: {}
  };
}

/**
 * Get current usage statistics for a user
 */
async function getCurrentUsage(userId: string): Promise<UserSubscriptionDetails['usage']> {
  try {
    // TODO: Replace with actual database queries
    // const [reports, evaluations, aiAnalyses, scenarios, storage, apiCalls] = await Promise.all([
    //   prisma.report.count({ where: { userId, createdAt: { gte: startOfMonth } } }),
    //   prisma.evaluation.count({ where: { userId, createdAt: { gte: startOfMonth } } }),
    //   prisma.aiAnalysis.count({ where: { userId, createdAt: { gte: startOfMonth } } }),
    //   prisma.scenario.count({ where: { userId, createdAt: { gte: startOfMonth } } }),
    //   prisma.file.aggregate({ where: { userId }, _sum: { size: true } }),
    //   prisma.apiCall.count({ where: { userId, createdAt: { gte: startOfMonth } } })
    // ]);

    // Mock usage data for development
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    return {
      reportsUsed: 0, // reports.count
      evaluationsUsed: 0, // evaluations.count
      aiAnalysesUsed: 0, // aiAnalyses.count
      scenariosUsed: 0, // scenarios.count
      storageUsed: 0, // storage._sum.size || 0
      apiCallsUsed: 0, // apiCalls.count
      lastResetDate: startOfMonth
    };

  } catch (error) {
    console.error('Error fetching usage data:', error);
    return {
      reportsUsed: 0,
      evaluationsUsed: 0,
      aiAnalysesUsed: 0,
      scenariosUsed: 0,
      storageUsed: 0,
      apiCallsUsed: 0,
      lastResetDate: new Date()
    };
  }
}

/**
 * Check if user is within tier limits for a specific feature
 */
export function isWithinTierLimit(
  subscription: UserSubscriptionDetails,
  limitType: keyof UserSubscriptionDetails['features']
): boolean {
  const limit = subscription.features[limitType];
  const usage = subscription.usage;

  if (limit === -1) return true; // Unlimited

  if (!usage) return true; // No usage data, assume within limits

  switch (limitType) {
    case 'maxReports':
      return usage.reportsUsed < limit;
    case 'maxEvaluations':
      return usage.evaluationsUsed < limit;
    case 'maxAiAnalyses':
      return usage.aiAnalysesUsed < limit;
    case 'maxScenarios':
      return usage.scenariosUsed < limit;
    case 'storageLimit':
      return usage.storageUsed < limit;
    case 'apiCallsPerMonth':
      return usage.apiCallsUsed < limit;
    default:
      return true;
  }
}

/**
 * Get remaining usage for a specific limit
 */
export function getRemainingUsage(
  subscription: UserSubscriptionDetails,
  limitType: keyof UserSubscriptionDetails['features']
): number {
  const limit = subscription.features[limitType];
  const usage = subscription.usage;

  if (limit === -1) return -1; // Unlimited

  if (!usage) return limit;

  switch (limitType) {
    case 'maxReports':
      return Math.max(0, limit - usage.reportsUsed);
    case 'maxEvaluations':
      return Math.max(0, limit - usage.evaluationsUsed);
    case 'maxAiAnalyses':
      return Math.max(0, limit - usage.aiAnalysesUsed);
    case 'maxScenarios':
      return Math.max(0, limit - usage.scenariosUsed);
    case 'storageLimit':
      return Math.max(0, limit - usage.storageUsed);
    case 'apiCallsPerMonth':
      return Math.max(0, limit - usage.apiCallsUsed);
    default:
      return 0;
  }
}

/**
 * Update usage for a specific feature
 */
export async function incrementUsage(
  userId: string,
  usageType: keyof Omit<UserSubscriptionDetails['usage'], 'lastResetDate'>,
  amount: number = 1
): Promise<void> {
  try {
    // Clear cache to force refresh
    subscriptionCache.delete(userId);

    // TODO: Implement actual database update
    // await prisma.userUsage.upsert({
    //   where: { userId },
    //   update: {
    //     [usageType]: { increment: amount }
    //   },
    //   create: {
    //     userId,
    //     [usageType]: amount
    //   }
    // });

    console.log(`Incremented ${usageType} by ${amount} for user ${userId}`);

  } catch (error) {
    console.error('Error updating usage:', error);
    throw error;
  }
}

/**
 * Reset monthly usage counters
 */
export async function resetMonthlyUsage(userId: string): Promise<void> {
  try {
    // Clear cache
    subscriptionCache.delete(userId);

    // TODO: Implement actual database reset
    // await prisma.userUsage.update({
    //   where: { userId },
    //   data: {
    //     reportsUsed: 0,
    //     evaluationsUsed: 0,
    //     aiAnalysesUsed: 0,
    //     scenariosUsed: 0,
    //     apiCallsUsed: 0,
    //     lastResetDate: new Date()
    //   }
    // });

    console.log(`Reset monthly usage for user ${userId}`);

  } catch (error) {
    console.error('Error resetting usage:', error);
    throw error;
  }
}

/**
 * Get user's current tier from authentication context
 */
export async function getCurrentUserTier(): Promise<UserTier> {
  try {
    const { userId } = auth();
    if (!userId) return 'basic';

    const subscription = await getUserSubscriptionDetails(userId);
    return subscription?.tier || 'basic';

  } catch (error) {
    console.error('Error getting current user tier:', error);
    return 'basic';
  }
}

/**
 * Clear subscription cache for a user
 */
export function clearUserSubscriptionCache(userId: string): void {
  subscriptionCache.delete(userId);
}

/**
 * Clear all subscription cache
 */
export function clearAllSubscriptionCache(): void {
  subscriptionCache.clear();
}

/**
 * Get cache statistics
 */
export function getSubscriptionCacheStats(): { size: number; entries: string[] } {
  return {
    size: subscriptionCache.size,
    entries: Array.from(subscriptionCache.keys())
  };
}

export default {
  getUserSubscriptionDetails,
  isWithinTierLimit,
  getRemainingUsage,
  incrementUsage,
  resetMonthlyUsage,
  getCurrentUserTier,
  clearUserSubscriptionCache,
  clearAllSubscriptionCache,
  getSubscriptionCacheStats
};