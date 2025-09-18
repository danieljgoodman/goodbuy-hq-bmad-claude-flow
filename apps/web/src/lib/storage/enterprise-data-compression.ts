/**
 * Enterprise Data Storage Optimization
 * Story 11.5: Efficient storage for multi-scenario projection data
 */

import zlib from 'zlib';
import { promisify } from 'util';
import { type MultiYearProjections, type YearlyProjection } from '@/types/enterprise-evaluation';

const gzip = promisify(zlib.gzip);
const gunzip = promisify(zlib.gunzip);

/**
 * Storage optimization strategies
 */
export enum CompressionStrategy {
  NONE = 'none',
  GZIP = 'gzip',
  DELTA = 'delta', // Delta encoding for time-series data
  DICTIONARY = 'dictionary', // Dictionary encoding for repeated values
}

/**
 * Compress large scenario projection data
 */
export async function compressScenarioData(data: any): Promise<{
  compressed: string;
  originalSize: number;
  compressedSize: number;
  compressionRatio: number;
  strategy: CompressionStrategy;
}> {
  const original = JSON.stringify(data);
  const originalSize = Buffer.byteLength(original, 'utf8');

  // Skip compression for small data
  if (originalSize < 1024) {
    return {
      compressed: original,
      originalSize,
      compressedSize: originalSize,
      compressionRatio: 1,
      strategy: CompressionStrategy.NONE,
    };
  }

  // Apply GZIP compression
  const compressed = await gzip(original, { level: 6 });
  const compressedSize = compressed.length;
  const compressedBase64 = compressed.toString('base64');

  return {
    compressed: compressedBase64,
    originalSize,
    compressedSize,
    compressionRatio: originalSize / compressedSize,
    strategy: CompressionStrategy.GZIP,
  };
}

/**
 * Decompress scenario data
 */
export async function decompressScenarioData(
  compressed: string,
  strategy: CompressionStrategy = CompressionStrategy.GZIP
): Promise<any> {
  if (strategy === CompressionStrategy.NONE) {
    return JSON.parse(compressed);
  }

  if (strategy === CompressionStrategy.GZIP) {
    const buffer = Buffer.from(compressed, 'base64');
    const decompressed = await gunzip(buffer);
    return JSON.parse(decompressed.toString('utf8'));
  }

  throw new Error(`Unsupported compression strategy: ${strategy}`);
}

/**
 * Delta encoding for time-series projections
 */
export function deltaEncodeProjections(projections: YearlyProjection[]): {
  base: YearlyProjection;
  deltas: Array<Partial<YearlyProjection>>;
} {
  if (projections.length === 0) {
    return { base: {} as YearlyProjection, deltas: [] };
  }

  const base = projections[0];
  const deltas: Array<Partial<YearlyProjection>> = [];

  for (let i = 1; i < projections.length; i++) {
    const delta: Partial<YearlyProjection> = {
      year: projections[i].year,
    };

    // Only store changed values
    if (projections[i].revenue !== base.revenue) {
      delta.revenue = projections[i].revenue - base.revenue;
    }
    if (projections[i].grossMargin !== base.grossMargin) {
      delta.grossMargin = projections[i].grossMargin - base.grossMargin;
    }
    if (projections[i].netMargin !== base.netMargin) {
      delta.netMargin = projections[i].netMargin - base.netMargin;
    }
    if (projections[i].cashFlow !== base.cashFlow) {
      delta.cashFlow = projections[i].cashFlow - base.cashFlow;
    }
    if (projections[i].capex !== base.capex) {
      delta.capex = projections[i].capex - base.capex;
    }

    deltas.push(delta);
  }

  return { base, deltas };
}

/**
 * Decode delta-encoded projections
 */
export function deltaDecodeProjections(encoded: {
  base: YearlyProjection;
  deltas: Array<Partial<YearlyProjection>>;
}): YearlyProjection[] {
  const { base, deltas } = encoded;
  const projections: YearlyProjection[] = [base];

  for (const delta of deltas) {
    const projection: YearlyProjection = {
      year: delta.year!,
      revenue: base.revenue + (delta.revenue || 0),
      grossMargin: base.grossMargin + (delta.grossMargin || 0),
      netMargin: base.netMargin + (delta.netMargin || 0),
      cashFlow: base.cashFlow + (delta.cashFlow || 0),
      capex: base.capex + (delta.capex || 0),
    };
    projections.push(projection);
  }

  return projections;
}

/**
 * Archive old Enterprise data
 */
export interface ArchiveStrategy {
  compressionLevel: number;
  retentionDays: number;
  archiveLocation: 'cold_storage' | 'compressed_db' | 's3';
}

export async function archiveEnterpriseData(
  data: any,
  strategy: ArchiveStrategy
): Promise<{
  archiveId: string;
  location: string;
  sizeReduction: number;
}> {
  // Compress data
  const compressed = await compressScenarioData(data);

  // Generate archive ID
  const archiveId = `archive_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  // Archive based on location strategy
  let location: string;

  switch (strategy.archiveLocation) {
    case 'compressed_db':
      // Store compressed data in database
      location = `db://archive/${archiveId}`;
      // In production, this would save to an archive table
      break;

    case 's3':
      // Store in S3 or similar object storage
      location = `s3://enterprise-archive/${archiveId}`;
      // In production, this would upload to S3
      break;

    case 'cold_storage':
    default:
      // Store in cold storage tier
      location = `cold://${archiveId}`;
      break;
  }

  return {
    archiveId,
    location,
    sizeReduction: compressed.compressionRatio,
  };
}

/**
 * Storage usage monitoring
 */
export class StorageMonitor {
  private static metrics = {
    totalStored: 0,
    totalCompressed: 0,
    compressionSavings: 0,
    largestDocument: 0,
  };

  static recordStorage(originalSize: number, compressedSize: number): void {
    this.metrics.totalStored += originalSize;
    this.metrics.totalCompressed += compressedSize;
    this.metrics.compressionSavings += originalSize - compressedSize;
    this.metrics.largestDocument = Math.max(this.metrics.largestDocument, originalSize);
  }

  static getMetrics(): {
    totalStoredMB: number;
    totalCompressedMB: number;
    savingsMB: number;
    avgCompressionRatio: number;
    largestDocumentKB: number;
  } {
    const bytesToMB = (bytes: number) => bytes / (1024 * 1024);
    const bytesToKB = (bytes: number) => bytes / 1024;

    return {
      totalStoredMB: bytesToMB(this.metrics.totalStored),
      totalCompressedMB: bytesToMB(this.metrics.totalCompressed),
      savingsMB: bytesToMB(this.metrics.compressionSavings),
      avgCompressionRatio:
        this.metrics.totalStored > 0
          ? this.metrics.totalStored / this.metrics.totalCompressed
          : 1,
      largestDocumentKB: bytesToKB(this.metrics.largestDocument),
    };
  }

  static reset(): void {
    this.metrics = {
      totalStored: 0,
      totalCompressed: 0,
      compressionSavings: 0,
      largestDocument: 0,
    };
  }
}

/**
 * Optimize multi-year projections storage
 */
export async function optimizeProjectionsStorage(
  projections: MultiYearProjections
): Promise<{
  optimized: any;
  originalSize: number;
  optimizedSize: number;
  strategy: string;
}> {
  const original = JSON.stringify(projections);
  const originalSize = Buffer.byteLength(original, 'utf8');

  // Delta encode the yearly projections
  const optimized = {
    baseCase: deltaEncodeProjections(projections.baseCase),
    optimisticCase: deltaEncodeProjections(projections.optimisticCase),
    conservativeCase: deltaEncodeProjections(projections.conservativeCase),
    currentGrossMargin: projections.currentGrossMargin,
    projectedGrossMarginYear5: projections.projectedGrossMarginYear5,
    currentNetMargin: projections.currentNetMargin,
    projectedNetMarginYear5: projections.projectedNetMarginYear5,
    maintenanceCapexPercentage: projections.maintenanceCapexPercentage,
    growthCapexFiveYear: projections.growthCapexFiveYear,
    projectedMarketPosition: projections.projectedMarketPosition,
    competitiveThreats: projections.competitiveThreats,
    strategicOptions: projections.strategicOptions,
  };

  // Compress the delta-encoded data
  const compressed = await compressScenarioData(optimized);

  StorageMonitor.recordStorage(originalSize, compressed.compressedSize);

  return {
    optimized: compressed.compressed,
    originalSize,
    optimizedSize: compressed.compressedSize,
    strategy: 'delta+gzip',
  };
}

/**
 * Restore optimized projections
 */
export async function restoreProjectionsFromOptimized(
  optimized: string,
  strategy = 'delta+gzip'
): Promise<MultiYearProjections> {
  if (strategy === 'delta+gzip') {
    // Decompress
    const decompressed = await decompressScenarioData(optimized);

    // Restore delta-encoded projections
    return {
      baseCase: deltaDecodeProjections(decompressed.baseCase),
      optimisticCase: deltaDecodeProjections(decompressed.optimisticCase),
      conservativeCase: deltaDecodeProjections(decompressed.conservativeCase),
      currentGrossMargin: decompressed.currentGrossMargin,
      projectedGrossMarginYear5: decompressed.projectedGrossMarginYear5,
      currentNetMargin: decompressed.currentNetMargin,
      projectedNetMarginYear5: decompressed.projectedNetMarginYear5,
      maintenanceCapexPercentage: decompressed.maintenanceCapexPercentage,
      growthCapexFiveYear: decompressed.growthCapexFiveYear,
      projectedMarketPosition: decompressed.projectedMarketPosition,
      competitiveThreats: decompressed.competitiveThreats,
      strategicOptions: decompressed.strategicOptions,
    };
  }

  throw new Error(`Unsupported restoration strategy: ${strategy}`);
}

/**
 * Estimate storage requirements for Enterprise tier
 */
export function estimateStorageRequirements(
  userCount: number,
  avgEvaluationsPerUser: number,
  avgScenariosPerEvaluation: number
): {
  uncompressedGB: number;
  compressedGB: number;
  estimatedMonthlyCostUSD: number;
} {
  // Average sizes (in KB)
  const AVG_EVALUATION_SIZE = 50; // Basic + Professional fields
  const AVG_ENTERPRISE_EXTENSION = 30; // Additional Enterprise fields
  const AVG_SCENARIO_SIZE = 20; // Per scenario
  const AVG_AUDIT_LOG_PER_EVAL = 5; // Audit trail

  // Calculate total size
  const totalEvaluations = userCount * avgEvaluationsPerUser;
  const totalScenarios = totalEvaluations * avgScenariosPerEvaluation;

  const evaluationSizeKB = totalEvaluations * (AVG_EVALUATION_SIZE + AVG_ENTERPRISE_EXTENSION);
  const scenarioSizeKB = totalScenarios * AVG_SCENARIO_SIZE;
  const auditSizeKB = totalEvaluations * AVG_AUDIT_LOG_PER_EVAL;

  const totalUncompressedKB = evaluationSizeKB + scenarioSizeKB + auditSizeKB;
  const totalUncompressedGB = totalUncompressedKB / (1024 * 1024);

  // Assume 60% compression ratio for JSONB + GZIP
  const totalCompressedGB = totalUncompressedGB * 0.4;

  // Storage cost estimation (PostgreSQL pricing)
  const STORAGE_COST_PER_GB_MONTH = 0.115; // AWS RDS pricing
  const estimatedMonthlyCostUSD = totalCompressedGB * STORAGE_COST_PER_GB_MONTH;

  return {
    uncompressedGB: Math.round(totalUncompressedGB * 100) / 100,
    compressedGB: Math.round(totalCompressedGB * 100) / 100,
    estimatedMonthlyCostUSD: Math.round(estimatedMonthlyCostUSD * 100) / 100,
  };
}

/**
 * Cleanup old archived data
 */
export async function cleanupArchivedData(
  retentionDays: number
): Promise<{ deletedCount: number; freedSpaceMB: number }> {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

  // In production, this would:
  // 1. Query archived data older than cutoff
  // 2. Delete from storage
  // 3. Update audit trail
  // 4. Return metrics

  console.log(`Cleaning up archived data older than ${cutoffDate.toISOString()}`);

  // Simulated cleanup
  return {
    deletedCount: 0,
    freedSpaceMB: 0,
  };
}