/**
 * Enterprise Query Performance Optimizer
 * Story 11.5: Optimize complex Enterprise tier queries to meet <1.5 second requirement
 */

import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { type EnterpriseScenarioModel } from '@/types/enterprise-evaluation';

import { getRedisClient, cache } from '@/lib/redis/client';

// Get Redis client (will be null if not available)
const redis = typeof window === 'undefined' ? getRedisClient() : null;

// Cache configuration
const CACHE_TTL = 300; // 5 minutes for complex calculations
const CACHE_PREFIX = 'enterprise:query:';

/**
 * Performance monitoring for queries
 */
export class QueryPerformanceMonitor {
  private static metrics: Map<string, number[]> = new Map();

  static recordQuery(queryName: string, duration: number): void {
    if (!this.metrics.has(queryName)) {
      this.metrics.set(queryName, []);
    }

    const times = this.metrics.get(queryName)!;
    times.push(duration);

    // Keep only last 100 measurements
    if (times.length > 100) {
      times.shift();
    }

    // Log slow queries
    if (duration > 1500) {
      console.warn(`Slow query detected: ${queryName} took ${duration}ms`);
    }
  }

  static getMetrics(queryName: string): {
    avg: number;
    min: number;
    max: number;
    p95: number;
  } | null {
    const times = this.metrics.get(queryName);
    if (!times || times.length === 0) return null;

    const sorted = [...times].sort((a, b) => a - b);
    const sum = sorted.reduce((a, b) => a + b, 0);

    return {
      avg: sum / sorted.length,
      min: sorted[0],
      max: sorted[sorted.length - 1],
      p95: sorted[Math.floor(sorted.length * 0.95)],
    };
  }
}

/**
 * Optimized query for Enterprise evaluation with scenarios
 */
export async function getEnterpriseEvaluationOptimized(
  evaluationId: string,
  includeScenarios = true
): Promise<any> {
  const startTime = Date.now();
  const cacheKey = `${CACHE_PREFIX}eval:${evaluationId}:${includeScenarios}`;

  // Check cache first
  if (redis) {
    const cached = await redis.get(cacheKey);
    if (cached) {
      QueryPerformanceMonitor.recordQuery('getEnterpriseEvaluation:cached', Date.now() - startTime);
      return JSON.parse(cached);
    }
  }

  // Optimized query with selective loading
  const evaluation = await prisma.businessEvaluation.findUnique({
    where: { id: evaluationId },
    select: {
      id: true,
      userId: true,
      subscriptionTier: true,
      businessName: true,
      industry: true,

      // Professional tier data
      professionalTierData: true,

      // Enterprise tier data
      enterpriseTierData: true,

      // Only include scenarios if requested
      ...(includeScenarios && {
        EnterpriseScenarioModel: {
          select: {
            id: true,
            baseScenario: true,
            optimisticScenario: true,
            conservativeScenario: true,
            projectionHorizon: true,
            lastUpdated: true,
          },
        },
      }),

      // Metadata
      createdAt: true,
      updatedAt: true,
    },
  });

  // Cache the result
  if (redis && evaluation) {
    await redis.setex(cacheKey, CACHE_TTL, JSON.stringify(evaluation));
  }

  QueryPerformanceMonitor.recordQuery('getEnterpriseEvaluation:db', Date.now() - startTime);
  return evaluation;
}

/**
 * Batch query for multiple Enterprise evaluations
 */
export async function getEnterpriseEvaluationsBatch(
  evaluationIds: string[]
): Promise<Map<string, any>> {
  const startTime = Date.now();
  const results = new Map<string, any>();

  // Check cache for each ID
  const uncachedIds: string[] = [];

  if (redis) {
    await Promise.all(
      evaluationIds.map(async (id) => {
        const cacheKey = `${CACHE_PREFIX}eval:${id}:false`;
        const cached = await redis.get(cacheKey);
        if (cached) {
          results.set(id, JSON.parse(cached));
        } else {
          uncachedIds.push(id);
        }
      })
    );
  } else {
    uncachedIds.push(...evaluationIds);
  }

  // Batch fetch uncached evaluations
  if (uncachedIds.length > 0) {
    const evaluations = await prisma.businessEvaluation.findMany({
      where: {
        id: { in: uncachedIds },
      },
      select: {
        id: true,
        userId: true,
        subscriptionTier: true,
        businessName: true,
        enterpriseTierData: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // Process and cache results
    await Promise.all(
      evaluations.map(async (evaluation) => {
        results.set(evaluation.id, evaluation);
        if (redis) {
          const cacheKey = `${CACHE_PREFIX}eval:${evaluation.id}:false`;
          await redis.setex(cacheKey, CACHE_TTL, JSON.stringify(evaluation));
        }
      })
    );
  }

  QueryPerformanceMonitor.recordQuery('getEnterpriseEvaluationsBatch', Date.now() - startTime);
  return results;
}

/**
 * Optimized scenario comparison query
 */
export async function compareScenarios(
  evaluationId: string,
  scenarioTypes: ('base' | 'optimistic' | 'conservative')[]
): Promise<any> {
  const startTime = Date.now();
  const cacheKey = `${CACHE_PREFIX}scenarios:${evaluationId}:${scenarioTypes.join(',')}`;

  // Check cache
  if (redis) {
    const cached = await redis.get(cacheKey);
    if (cached) {
      QueryPerformanceMonitor.recordQuery('compareScenarios:cached', Date.now() - startTime);
      return JSON.parse(cached);
    }
  }

  // Use raw SQL for better performance on complex JSON operations
  const scenarios = await prisma.$queryRaw`
    SELECT
      id,
      ${scenarioTypes.includes('base') ? Prisma.sql`baseScenario,` : Prisma.sql``}
      ${scenarioTypes.includes('optimistic') ? Prisma.sql`optimisticScenario,` : Prisma.sql``}
      ${scenarioTypes.includes('conservative') ? Prisma.sql`conservativeScenario,` : Prisma.sql``}
      projectionHorizon,
      lastUpdated
    FROM "EnterpriseScenarioModel"
    WHERE "businessEvaluationId" = ${evaluationId}
    LIMIT 1
  `;

  // Process and cache
  const result = scenarios[0] || null;
  if (redis && result) {
    await redis.setex(cacheKey, CACHE_TTL, JSON.stringify(result));
  }

  QueryPerformanceMonitor.recordQuery('compareScenarios:db', Date.now() - startTime);
  return result;
}

/**
 * Aggregated metrics for Enterprise dashboard
 */
export async function getEnterpriseMetricsOptimized(
  userId: string,
  dateRange?: { start: Date; end: Date }
): Promise<any> {
  const startTime = Date.now();
  const cacheKey = `${CACHE_PREFIX}metrics:${userId}:${dateRange?.start?.toISOString()}:${dateRange?.end?.toISOString()}`;

  // Check cache
  if (redis) {
    const cached = await redis.get(cacheKey);
    if (cached) {
      QueryPerformanceMonitor.recordQuery('getEnterpriseMetrics:cached', Date.now() - startTime);
      return JSON.parse(cached);
    }
  }

  // Parallel aggregation queries
  const [evaluationCount, scenarioCount, recentActivity] = await Promise.all([
    // Count evaluations
    prisma.businessEvaluation.count({
      where: {
        userId,
        subscriptionTier: 'ENTERPRISE',
        ...(dateRange && {
          createdAt: {
            gte: dateRange.start,
            lte: dateRange.end,
          },
        }),
      },
    }),

    // Count scenarios
    prisma.enterpriseScenarioModel.count({
      where: {
        businessEvaluation: {
          userId,
          subscriptionTier: 'ENTERPRISE',
        },
        ...(dateRange && {
          createdAt: {
            gte: dateRange.start,
            lte: dateRange.end,
          },
        }),
      },
    }),

    // Recent activity
    prisma.auditLogEntry.findMany({
      where: {
        userId,
        userTier: 'ENTERPRISE',
        ...(dateRange && {
          timestamp: {
            gte: dateRange.start,
            lte: dateRange.end,
          },
        }),
      },
      select: {
        action: true,
        timestamp: true,
      },
      orderBy: { timestamp: 'desc' },
      take: 10,
    }),
  ]);

  const metrics = {
    totalEvaluations: evaluationCount,
    totalScenarios: scenarioCount,
    recentActivity,
    lastUpdated: new Date(),
  };

  // Cache results
  if (redis) {
    await redis.setex(cacheKey, CACHE_TTL, JSON.stringify(metrics));
  }

  QueryPerformanceMonitor.recordQuery('getEnterpriseMetrics:db', Date.now() - startTime);
  return metrics;
}

/**
 * Create database indexes for performance
 */
export async function createEnterpriseIndexes(): Promise<void> {
  try {
    // Create indexes for common query patterns
    await prisma.$executeRaw`
      CREATE INDEX IF NOT EXISTS idx_business_evaluation_enterprise
      ON "BusinessEvaluation" ("userId", "subscriptionTier", "createdAt" DESC)
      WHERE "subscriptionTier" = 'ENTERPRISE';
    `;

    await prisma.$executeRaw`
      CREATE INDEX IF NOT EXISTS idx_enterprise_scenario_eval
      ON "EnterpriseScenarioModel" ("businessEvaluationId", "lastUpdated" DESC);
    `;

    await prisma.$executeRaw`
      CREATE INDEX IF NOT EXISTS idx_audit_log_enterprise
      ON "AuditLogEntry" ("userId", "timestamp" DESC)
      WHERE "userTier" = 'ENTERPRISE';
    `;

    // JSONB indexes for enterprise data queries
    await prisma.$executeRaw`
      CREATE INDEX IF NOT EXISTS idx_enterprise_data_gin
      ON "BusinessEvaluation"
      USING GIN ("enterpriseTierData");
    `;

    await prisma.$executeRaw`
      CREATE INDEX IF NOT EXISTS idx_scenario_projections_gin
      ON "EnterpriseScenarioModel"
      USING GIN ("baseScenario", "optimisticScenario", "conservativeScenario");
    `;

    console.log('Enterprise indexes created successfully');
  } catch (error) {
    console.error('Failed to create indexes:', error);
    throw error;
  }
}

/**
 * Query optimization hints
 */
export const QUERY_HINTS = {
  // Use these hints when building complex queries
  USE_PARALLEL: 'SET max_parallel_workers_per_gather = 4;',
  INCREASE_WORK_MEM: 'SET work_mem = "256MB";',
  OPTIMIZE_JSONB: 'SET enable_seqscan = off;', // Force index usage for JSONB

  // Connection pooling settings
  POOL_SIZE: 20,
  POOL_TIMEOUT: 30000,
  IDLE_TIMEOUT: 10000,
};

/**
 * Warm up cache with frequently accessed data
 */
export async function warmUpCache(userId: string): Promise<void> {
  if (!redis) return;

  try {
    // Pre-load user's recent evaluations
    const recentEvaluations = await prisma.businessEvaluation.findMany({
      where: {
        userId,
        subscriptionTier: 'ENTERPRISE',
      },
      select: {
        id: true,
        businessName: true,
        enterpriseTierData: true,
      },
      orderBy: { updatedAt: 'desc' },
      take: 5,
    });

    // Cache each evaluation
    await Promise.all(
      recentEvaluations.map(async (evaluation) => {
        const cacheKey = `${CACHE_PREFIX}eval:${evaluation.id}:false`;
        await redis.setex(cacheKey, CACHE_TTL, JSON.stringify(evaluation));
      })
    );

    // Pre-load metrics
    await getEnterpriseMetricsOptimized(userId);

    console.log(`Cache warmed up for user ${userId}`);
  } catch (error) {
    console.error('Cache warm-up failed:', error);
  }
}

/**
 * Clear cache for specific evaluation
 */
export async function invalidateCache(evaluationId: string): Promise<void> {
  if (!redis) return;

  const keys = [
    `${CACHE_PREFIX}eval:${evaluationId}:true`,
    `${CACHE_PREFIX}eval:${evaluationId}:false`,
    `${CACHE_PREFIX}scenarios:${evaluationId}:*`,
  ];

  await Promise.all(keys.map(key => redis.del(key)));
}

/**
 * Performance testing utility
 */
export async function runPerformanceTest(): Promise<void> {
  console.log('Running Enterprise query performance tests...');

  // Test evaluation fetch
  const testId = 'test-eval-id';
  const start = Date.now();

  try {
    await getEnterpriseEvaluationOptimized(testId, true);
    const duration = Date.now() - start;

    if (duration > 1500) {
      console.warn(`⚠️ Query exceeded 1.5s threshold: ${duration}ms`);
    } else {
      console.log(`✓ Query completed in ${duration}ms`);
    }

    // Get performance metrics
    const metrics = QueryPerformanceMonitor.getMetrics('getEnterpriseEvaluation:db');
    if (metrics) {
      console.log('Performance metrics:', {
        avg: `${metrics.avg.toFixed(2)}ms`,
        p95: `${metrics.p95.toFixed(2)}ms`,
        max: `${metrics.max.toFixed(2)}ms`,
      });
    }
  } catch (error) {
    console.error('Performance test failed:', error);
  }
}