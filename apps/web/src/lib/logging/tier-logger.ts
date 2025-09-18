/**
 * Structured logging for tier operations
 * Story 11.2: Subscription-Based Routing Middleware
 *
 * Features:
 * - Winston-based structured logging
 * - PII sanitization for production safety
 * - Performance tracking
 * - Debug mode support
 * - Multiple transport support
 */

import winston from 'winston'
import { SubscriptionTier, SubscriptionStatus, TierDetectionResult, RoutingDecision } from '@/types/subscription'

/**
 * Log levels for tier operations
 */
export enum TierLogLevel {
  ERROR = 'error',
  WARN = 'warn',
  INFO = 'info',
  HTTP = 'http',
  VERBOSE = 'verbose',
  DEBUG = 'debug',
  SILLY = 'silly'
}

/**
 * Log categories for structured logging
 */
export enum TierLogCategory {
  MIDDLEWARE = 'middleware',
  TIER_DETECTION = 'tier_detection',
  ROUTING = 'routing',
  ACCESS_CONTROL = 'access_control',
  PERFORMANCE = 'performance',
  SECURITY = 'security',
  API = 'api',
  ERROR = 'error'
}

/**
 * Structured log entry for tier operations
 */
export interface TierLogEntry {
  timestamp: string
  level: TierLogLevel
  category: TierLogCategory
  message: string
  requestId?: string
  userId?: string
  sessionId?: string
  userTier?: SubscriptionTier
  tierStatus?: SubscriptionStatus
  route?: string
  method?: string
  userAgent?: string
  ip?: string
  executionTime?: number
  cacheHit?: boolean
  error?: {
    name: string
    message: string
    stack?: string
    code?: string
    statusCode?: number
  }
  metadata?: Record<string, any>
  performance?: {
    memoryUsage: number
    cpuUsage?: number
    dbQueries?: number
    apiCalls?: number
    cacheOperations?: number
  }
  routing?: {
    originalPath: string
    targetPath?: string
    reason: string
    requiredTier?: SubscriptionTier
    hasAccess: boolean
    missingFeatures?: string[]
  }
  security?: {
    threat?: string
    action: string
    riskLevel?: 'low' | 'medium' | 'high' | 'critical'
  }
}

/**
 * Logger configuration
 */
interface TierLoggerConfig {
  level: TierLogLevel
  enableConsole: boolean
  enableFile: boolean
  enableJson: boolean
  filePath?: string
  maxFiles?: number
  maxSize?: string
  enableDebugMode: boolean
  sanitizePII: boolean
  enablePerformanceTracking: boolean
}

/**
 * Default logger configuration
 */
const DEFAULT_CONFIG: TierLoggerConfig = {
  level: process.env.NODE_ENV === 'production' ? TierLogLevel.INFO : TierLogLevel.DEBUG,
  enableConsole: true,
  enableFile: process.env.NODE_ENV === 'production',
  enableJson: process.env.NODE_ENV === 'production',
  filePath: './logs/tier-operations.log',
  maxFiles: 5,
  maxSize: '20m',
  enableDebugMode: process.env.NODE_ENV === 'development',
  sanitizePII: process.env.NODE_ENV === 'production',
  enablePerformanceTracking: true
}

/**
 * PII patterns for sanitization
 */
const PII_PATTERNS = [
  /\b[\w\.-]+@[\w\.-]+\.\w+\b/g, // Email addresses
  /\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/g, // Credit card numbers
  /\b\d{3}-\d{2}-\d{4}\b/g, // SSN
  /\bsk_test_[a-zA-Z0-9]+\b/g, // Stripe test keys
  /\bsk_live_[a-zA-Z0-9]+\b/g, // Stripe live keys
  /\bpk_test_[a-zA-Z0-9]+\b/g, // Stripe publishable test keys
  /\bpk_live_[a-zA-Z0-9]+\b/g, // Stripe publishable live keys
]

/**
 * Tier operations logger
 */
class TierLogger {
  private logger: winston.Logger
  private config: TierLoggerConfig

  constructor(config?: Partial<TierLoggerConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config }
    this.logger = this.createLogger()
  }

  /**
   * Create Winston logger instance
   */
  private createLogger(): winston.Logger {
    const transports: winston.transport[] = []

    // Console transport
    if (this.config.enableConsole) {
      transports.push(
        new winston.transports.Console({
          format: this.config.enableJson
            ? winston.format.json()
            : winston.format.combine(
                winston.format.colorize(),
                winston.format.timestamp(),
                winston.format.printf(({ timestamp, level, message, category, ...meta }) => {
                  const metaStr = Object.keys(meta).length ? JSON.stringify(meta, null, 2) : ''
                  return `${timestamp} [${level}] [${category || 'general'}] ${message} ${metaStr}`
                })
              )
        })
      )
    }

    // File transport
    if (this.config.enableFile && this.config.filePath) {
      transports.push(
        new winston.transports.File({
          filename: this.config.filePath,
          maxFiles: this.config.maxFiles,
          maxsize: this.parseMaxSize(this.config.maxSize || '20m'),
          format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.json()
          )
        })
      )
    }

    return winston.createLogger({
      level: this.config.level,
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json()
      ),
      transports,
      exitOnError: false
    })
  }

  /**
   * Parse max size string to bytes
   */
  private parseMaxSize(size: string): number {
    const units: { [key: string]: number } = {
      b: 1,
      k: 1024,
      m: 1024 * 1024,
      g: 1024 * 1024 * 1024
    }

    const match = size.toLowerCase().match(/^(\d+)([kmg]?)$/)
    if (!match) return 20 * 1024 * 1024 // Default 20MB

    const [, num, unit] = match
    return parseInt(num) * (units[unit] || 1)
  }

  /**
   * Sanitize PII from log data
   */
  private sanitizePII(data: any): any {
    if (!this.config.sanitizePII) return data

    if (typeof data === 'string') {
      let sanitized = data
      PII_PATTERNS.forEach(pattern => {
        sanitized = sanitized.replace(pattern, '[REDACTED]')
      })
      return sanitized
    }

    if (typeof data === 'object' && data !== null) {
      const sanitized: any = Array.isArray(data) ? [] : {}
      for (const [key, value] of Object.entries(data)) {
        // Skip sensitive keys
        if (['password', 'token', 'secret', 'key', 'credential'].some(sensitive =>
          key.toLowerCase().includes(sensitive)
        )) {
          sanitized[key] = '[REDACTED]'
        } else {
          sanitized[key] = this.sanitizePII(value)
        }
      }
      return sanitized
    }

    return data
  }

  /**
   * Create base log entry
   */
  private createLogEntry(
    level: TierLogLevel,
    category: TierLogCategory,
    message: string,
    metadata?: Partial<TierLogEntry>
  ): TierLogEntry {
    const entry: TierLogEntry = {
      timestamp: new Date().toISOString(),
      level,
      category,
      message,
      ...metadata
    }

    return this.sanitizePII(entry)
  }

  /**
   * Log tier detection events
   */
  logTierDetection(
    message: string,
    result: TierDetectionResult,
    metadata?: {
      requestId?: string
      userId?: string
      route?: string
      method?: string
    }
  ): void {
    const entry = this.createLogEntry(
      TierLogLevel.INFO,
      TierLogCategory.TIER_DETECTION,
      message,
      {
        ...metadata,
        userTier: result.tier,
        tierStatus: result.status,
        executionTime: result.executionTime,
        cacheHit: result.source === 'clerk',
        metadata: {
          features: result.features,
          hasAccess: result.hasAccess,
          isTrialing: result.isTrialing,
          source: result.source,
          trialEndsAt: result.trialEndsAt?.toISOString(),
          subscriptionEndsAt: result.subscriptionEndsAt?.toISOString()
        }
      }
    )

    this.logger.info(entry)
  }

  /**
   * Log routing decisions
   */
  logRoutingDecision(
    message: string,
    decision: RoutingDecision,
    metadata?: {
      requestId?: string
      userId?: string
      originalPath?: string
      method?: string
    }
  ): void {
    const entry = this.createLogEntry(
      decision.allowAccess ? TierLogLevel.INFO : TierLogLevel.WARN,
      TierLogCategory.ROUTING,
      message,
      {
        ...metadata,
        userTier: decision.currentTier,
        routing: {
          originalPath: metadata?.originalPath || '',
          targetPath: decision.targetRoute,
          reason: decision.reason,
          requiredTier: decision.requiredTier,
          hasAccess: decision.allowAccess,
          missingFeatures: decision.missingFeatures
        }
      }
    )

    this.logger.log(entry.level, entry)
  }

  /**
   * Log access control violations
   */
  logAccessDenied(
    message: string,
    metadata: {
      requestId?: string
      userId?: string
      route: string
      method?: string
      requiredTier: SubscriptionTier
      currentTier: SubscriptionTier
      missingFeatures?: string[]
      ip?: string
      userAgent?: string
    }
  ): void {
    const entry = this.createLogEntry(
      TierLogLevel.WARN,
      TierLogCategory.ACCESS_CONTROL,
      message,
      {
        ...metadata,
        userTier: metadata.currentTier,
        security: {
          action: 'access_denied',
          riskLevel: 'medium' as const
        },
        routing: {
          originalPath: metadata.route,
          reason: 'insufficient_tier',
          requiredTier: metadata.requiredTier,
          hasAccess: false,
          missingFeatures: metadata.missingFeatures || []
        }
      }
    )

    this.logger.warn(entry)
  }

  /**
   * Log performance metrics
   */
  logPerformance(
    message: string,
    metrics: {
      executionTime: number
      memoryUsage: number
      cacheHit?: boolean
      dbQueries?: number
      apiCalls?: number
    },
    metadata?: {
      requestId?: string
      route?: string
      method?: string
    }
  ): void {
    if (!this.config.enablePerformanceTracking) return

    const entry = this.createLogEntry(
      metrics.executionTime > 100 ? TierLogLevel.WARN : TierLogLevel.DEBUG,
      TierLogCategory.PERFORMANCE,
      message,
      {
        ...metadata,
        executionTime: metrics.executionTime,
        cacheHit: metrics.cacheHit,
        performance: {
          memoryUsage: metrics.memoryUsage,
          dbQueries: metrics.dbQueries,
          apiCalls: metrics.apiCalls
        }
      }
    )

    this.logger.log(entry.level, entry)
  }

  /**
   * Log errors with context
   */
  logError(
    message: string,
    error: Error,
    metadata?: {
      requestId?: string
      userId?: string
      route?: string
      method?: string
      userTier?: SubscriptionTier
    }
  ): void {
    const entry = this.createLogEntry(
      TierLogLevel.ERROR,
      TierLogCategory.ERROR,
      message,
      {
        ...metadata,
        error: {
          name: error.name,
          message: error.message,
          stack: this.config.enableDebugMode ? error.stack : undefined,
          code: (error as any).code,
          statusCode: (error as any).statusCode
        }
      }
    )

    this.logger.error(entry)
  }

  /**
   * Log API requests
   */
  logApiRequest(
    message: string,
    metadata: {
      requestId?: string
      userId?: string
      route: string
      method: string
      statusCode?: number
      executionTime?: number
      userTier?: SubscriptionTier
      ip?: string
      userAgent?: string
    }
  ): void {
    const level = metadata.statusCode && metadata.statusCode >= 400
      ? TierLogLevel.WARN
      : TierLogLevel.HTTP

    const entry = this.createLogEntry(
      level,
      TierLogCategory.API,
      message,
      metadata
    )

    this.logger.log(level, entry)
  }

  /**
   * Log security events
   */
  logSecurityEvent(
    message: string,
    metadata: {
      requestId?: string
      userId?: string
      route?: string
      threat: string
      action: string
      riskLevel: 'low' | 'medium' | 'high' | 'critical'
      ip?: string
      userAgent?: string
    }
  ): void {
    const level = metadata.riskLevel === 'critical' ? TierLogLevel.ERROR : TierLogLevel.WARN

    const entry = this.createLogEntry(
      level,
      TierLogCategory.SECURITY,
      message,
      {
        ...metadata,
        security: {
          threat: metadata.threat,
          action: metadata.action,
          riskLevel: metadata.riskLevel
        }
      }
    )

    this.logger.log(level, entry)
  }

  /**
   * Log debug information
   */
  logDebug(
    message: string,
    metadata?: Record<string, any>
  ): void {
    if (!this.config.enableDebugMode) return

    const entry = this.createLogEntry(
      TierLogLevel.DEBUG,
      TierLogCategory.MIDDLEWARE,
      message,
      { metadata }
    )

    this.logger.debug(entry)
  }

  /**
   * Create child logger with additional context
   */
  createChildLogger(context: {
    requestId?: string
    userId?: string
    sessionId?: string
  }): TierLogger {
    const child = new TierLogger(this.config)

    // Override log methods to include context
    const originalMethods = [
      'logTierDetection',
      'logRoutingDecision',
      'logAccessDenied',
      'logPerformance',
      'logError',
      'logApiRequest',
      'logSecurityEvent'
    ] as const

    originalMethods.forEach(method => {
      const original = child[method].bind(child)
      ;(child as any)[method] = (message: string, ...args: any[]) => {
        // Merge context into metadata
        if (args.length > 0 && typeof args[args.length - 1] === 'object') {
          args[args.length - 1] = { ...context, ...args[args.length - 1] }
        } else {
          args.push(context)
        }
        return original(message, ...args)
      }
    })

    return child
  }

  /**
   * Flush all pending logs
   */
  async flush(): Promise<void> {
    return new Promise((resolve) => {
      this.logger.on('finish', resolve)
      this.logger.end()
    })
  }
}

/**
 * Global tier logger instance
 */
export const tierLogger = new TierLogger()

/**
 * Utility functions for common logging patterns
 */
export const TierLoggerUtils = {
  /**
   * Create request ID for tracing
   */
  generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  },

  /**
   * Extract IP address from request headers
   */
  extractIP(headers: Headers): string {
    return headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
           headers.get('x-real-ip') ||
           headers.get('cf-connecting-ip') ||
           'unknown'
  },

  /**
   * Get memory usage in MB
   */
  getMemoryUsage(): number {
    if (typeof process !== 'undefined' && process.memoryUsage) {
      return Math.round(process.memoryUsage().heapUsed / 1024 / 1024 * 100) / 100
    }
    return 0
  },

  /**
   * Create performance tracker
   */
  createPerformanceTracker() {
    const startTime = performance.now()
    const startMemory = this.getMemoryUsage()

    return {
      finish() {
        return {
          executionTime: Math.round((performance.now() - startTime) * 100) / 100,
          memoryUsage: TierLoggerUtils.getMemoryUsage(),
          memoryDelta: TierLoggerUtils.getMemoryUsage() - startMemory
        }
      }
    }
  }
}

export default TierLogger