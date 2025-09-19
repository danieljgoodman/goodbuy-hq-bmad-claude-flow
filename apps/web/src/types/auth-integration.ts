/**
 * TypeScript Types for Auth Integration - Story 11.10
 * Comprehensive type definitions for Clerk tier integration,
 * authentication flows, and error handling
 */

import type {
  SubscriptionTier,
  SubscriptionStatus,
  ClerkUserMetadata
} from './subscription'
import type {
  UserTier,
  TierPermissions,
  Permission,
  ConditionalPermission
} from '@/lib/access-control/permission-matrix'

/**
 * Authentication Integration Configuration
 */
export interface AuthIntegrationConfig {
  /** Enable enhanced session enrichment */
  enableSessionEnrichment: boolean
  /** Enable real-time subscription updates */
  enableRealtimeUpdates: boolean
  /** Cache duration for session data (milliseconds) */
  sessionCacheDuration: number
  /** Cache duration for permission context (milliseconds) */
  permissionCacheDuration: number
  /** Maximum execution time for auth operations (milliseconds) */
  maxExecutionTime: number
  /** Enable debug logging */
  debugMode: boolean
  /** Enable performance monitoring */
  performanceMonitoring: boolean
  /** Fallback tier when detection fails */
  fallbackTier: SubscriptionTier
  /** Retry configuration for failed operations */
  retryConfig: RetryConfig
}

export interface RetryConfig {
  maxRetries: number
  retryDelay: number
  exponentialBackoff: boolean
  retryableErrors: string[]
}

/**
 * Session Enrichment Types
 */
export interface EnrichedSessionData {
  /** User identifier */
  userId: string
  /** Current subscription tier */
  tier: SubscriptionTier
  /** Subscription status */
  status: SubscriptionStatus
  /** Available permissions for the tier */
  permissions: TierPermissions
  /** List of available features */
  features: string[]
  /** Usage limits by category */
  limits: Record<string, number>
  /** Whether user is in trial period */
  isTrialing: boolean
  /** Trial expiration date */
  trialEndsAt?: Date
  /** Subscription expiration date */
  subscriptionEndsAt?: Date
  /** Last synchronization timestamp */
  lastSyncAt: Date
  /** Session metadata */
  metadata: SessionMetadata
}

export interface SessionMetadata {
  /** Clerk session ID */
  sessionId?: string
  /** IP address for security tracking */
  ipAddress?: string
  /** User agent for device tracking */
  userAgent?: string
  /** Geographic location */
  location?: {
    country?: string
    region?: string
    city?: string
  }
  /** Session creation timestamp */
  createdAt: Date
  /** Last activity timestamp */
  lastActivityAt: Date
  /** Session flags */
  flags: SessionFlags
}

export interface SessionFlags {
  /** Session was created via SSO */
  isSSOSession: boolean
  /** Session requires additional verification */
  requiresVerification: boolean
  /** Session is from a new device */
  isNewDevice: boolean
  /** Session has elevated permissions */
  hasElevatedPermissions: boolean
  /** Session is using multi-factor authentication */
  isMFAProtected: boolean
}

/**
 * Permission Context Types
 */
export interface PermissionContext {
  /** User identifier */
  userId: string
  /** Current tier */
  tier: SubscriptionTier
  /** Complete permission set */
  permissions: TierPermissions
  /** Clerk session identifier */
  sessionId: string
  /** Authentication status */
  isAuthenticated: boolean
  /** Available features list */
  features: string[]
  /** Tier-based limits */
  limits: Record<string, number>
  /** Additional context metadata */
  metadata: PermissionContextMetadata
  /** Context creation timestamp */
  createdAt: Date
  /** Context expiration timestamp */
  expiresAt: Date
}

export interface PermissionContextMetadata {
  /** User is in trial period */
  isTrialing: boolean
  /** Trial end date */
  trialEndsAt?: string
  /** Subscription end date */
  subscriptionEndsAt?: string
  /** Last sync timestamp */
  lastSyncAt: string
  /** Source of context data */
  source: 'clerk' | 'cache' | 'database'
  /** Context generation performance */
  generationTime: number
  /** Validation status */
  isValid: boolean
  /** Any context warnings */
  warnings: string[]
}

/**
 * Webhook Integration Types
 */
export interface WebhookEventData {
  /** Event type from Stripe */
  type: WebhookEventType
  /** Target user ID */
  userId?: string
  /** Stripe customer ID */
  stripeCustomerId?: string
  /** Stripe subscription ID */
  subscriptionId: string
  /** New tier assignment */
  tier: SubscriptionTier
  /** New status */
  status: SubscriptionStatus
  /** Subscription period end */
  currentPeriodEnd?: Date
  /** Trial end date */
  trialEnd?: Date
  /** Event metadata */
  metadata?: Record<string, any>
  /** Webhook processing timestamp */
  processedAt: Date
  /** Event processing status */
  processingStatus: WebhookProcessingStatus
}

export type WebhookEventType =
  | 'subscription.created'
  | 'subscription.updated'
  | 'subscription.deleted'
  | 'customer.subscription.trial_will_end'
  | 'invoice.payment_succeeded'
  | 'invoice.payment_failed'
  | 'customer.created'

export type WebhookProcessingStatus =
  | 'pending'
  | 'processing'
  | 'completed'
  | 'failed'
  | 'retrying'

/**
 * Error Types for Auth Integration
 */
export class AuthIntegrationError extends Error {
  constructor(
    message: string,
    public code: AuthErrorCode,
    public details?: Record<string, any>,
    public retryable: boolean = false
  ) {
    super(message)
    this.name = 'AuthIntegrationError'
  }
}

export class SessionEnrichmentError extends AuthIntegrationError {
  constructor(message: string, userId: string, cause?: Error) {
    super(
      `Session enrichment failed for user ${userId}: ${message}`,
      'SESSION_ENRICHMENT_FAILED',
      { userId, cause: cause?.message },
      true
    )
  }
}

export class PermissionContextError extends AuthIntegrationError {
  constructor(message: string, userId: string, feature?: string) {
    super(
      `Permission context error for user ${userId}: ${message}`,
      'PERMISSION_CONTEXT_ERROR',
      { userId, feature },
      true
    )
  }
}

export class WebhookProcessingError extends AuthIntegrationError {
  constructor(
    message: string,
    eventType: WebhookEventType,
    subscriptionId: string,
    cause?: Error
  ) {
    super(
      `Webhook processing failed for ${eventType}: ${message}`,
      'WEBHOOK_PROCESSING_FAILED',
      { eventType, subscriptionId, cause: cause?.message },
      true
    )
  }
}

export class TierSynchronizationError extends AuthIntegrationError {
  constructor(message: string, userId: string, targetTier: SubscriptionTier) {
    super(
      `Tier synchronization failed for user ${userId}: ${message}`,
      'TIER_SYNC_FAILED',
      { userId, targetTier },
      true
    )
  }
}

export type AuthErrorCode =
  | 'SESSION_ENRICHMENT_FAILED'
  | 'PERMISSION_CONTEXT_ERROR'
  | 'WEBHOOK_PROCESSING_FAILED'
  | 'TIER_SYNC_FAILED'
  | 'CLERK_API_ERROR'
  | 'CACHE_ERROR'
  | 'VALIDATION_ERROR'
  | 'RATE_LIMIT_EXCEEDED'
  | 'CONFIGURATION_ERROR'
  | 'EXTERNAL_SERVICE_ERROR'

/**
 * Authentication Edge Case Types
 */
export interface EdgeCaseScenario {
  /** Edge case type */
  type: EdgeCaseType
  /** User affected */
  userId: string
  /** Scenario context */
  context: EdgeCaseContext
  /** Resolution strategy */
  resolutionStrategy: ResolutionStrategy
  /** Automated handling result */
  handled: boolean
  /** Manual intervention required */
  requiresManualIntervention: boolean
  /** Resolution timestamp */
  resolvedAt?: Date
}

export type EdgeCaseType =
  | 'session_expired'
  | 'tier_downgrade'
  | 'subscription_cancelled'
  | 'trial_expired'
  | 'payment_failed'
  | 'account_suspended'
  | 'data_inconsistency'
  | 'permission_mismatch'

export interface EdgeCaseContext {
  /** Previous state */
  previousState?: {
    tier: SubscriptionTier
    status: SubscriptionStatus
    features: string[]
  }
  /** Current state */
  currentState: {
    tier: SubscriptionTier
    status: SubscriptionStatus
    features: string[]
  }
  /** Trigger event */
  triggerEvent: string
  /** Additional context data */
  metadata: Record<string, any>
}

export interface ResolutionStrategy {
  /** Strategy type */
  type: 'automatic' | 'manual' | 'hybrid'
  /** Actions to take */
  actions: ResolutionAction[]
  /** Rollback strategy if resolution fails */
  rollbackActions: ResolutionAction[]
  /** Success criteria */
  successCriteria: string[]
}

export interface ResolutionAction {
  /** Action type */
  type: 'update_clerk_metadata' | 'clear_cache' | 'send_notification' | 'redirect_user' | 'log_event'
  /** Action parameters */
  parameters: Record<string, any>
  /** Expected outcome */
  expectedOutcome: string
  /** Rollback action if this fails */
  rollbackAction?: ResolutionAction
}

/**
 * Performance Monitoring Types
 */
export interface AuthPerformanceMetrics {
  /** Operation identifier */
  operationId: string
  /** Operation type */
  operationType: AuthOperationType
  /** Start timestamp */
  startTime: number
  /** End timestamp */
  endTime: number
  /** Total execution time */
  executionTime: number
  /** Success status */
  success: boolean
  /** Error details if failed */
  error?: {
    code: AuthErrorCode
    message: string
    stack?: string
  }
  /** Performance breakdown */
  breakdown: PerformanceBreakdown
  /** Resource usage */
  resourceUsage: ResourceUsage
}

export type AuthOperationType =
  | 'session_enrichment'
  | 'permission_context_creation'
  | 'tier_detection'
  | 'webhook_processing'
  | 'cache_operation'
  | 'clerk_api_call'
  | 'permission_check'

export interface PerformanceBreakdown {
  /** Time spent on Clerk API calls */
  clerkApiTime: number
  /** Time spent on cache operations */
  cacheTime: number
  /** Time spent on database operations */
  databaseTime: number
  /** Time spent on permission calculations */
  permissionCalculationTime: number
  /** Time spent on validation */
  validationTime: number
}

export interface ResourceUsage {
  /** Memory usage in bytes */
  memoryUsage: number
  /** CPU usage percentage */
  cpuUsage: number
  /** Number of API calls made */
  apiCalls: number
  /** Number of database queries */
  databaseQueries: number
  /** Cache hit ratio */
  cacheHitRatio: number
}

/**
 * Cache Types
 */
export interface CacheEntry<T> {
  /** Cached data */
  data: T
  /** Cache expiration timestamp */
  expiresAt: number
  /** Cache creation timestamp */
  createdAt: number
  /** Cache hit count */
  hitCount: number
  /** Cache metadata */
  metadata: CacheMetadata
}

export interface CacheMetadata {
  /** Cache entry version */
  version: string
  /** Data source */
  source: string
  /** Cache tags for invalidation */
  tags: string[]
  /** Compression used */
  compressed: boolean
  /** Original data size */
  originalSize: number
  /** Compressed data size */
  compressedSize?: number
}

/**
 * Configuration Validation Types
 */
export interface ConfigurationValidation {
  /** Validation status */
  isValid: boolean
  /** Configuration errors */
  errors: ConfigurationError[]
  /** Configuration warnings */
  warnings: ConfigurationWarning[]
  /** Validation timestamp */
  validatedAt: Date
  /** Configuration version */
  configVersion: string
}

export interface ConfigurationError {
  /** Error field path */
  field: string
  /** Error code */
  code: string
  /** Error message */
  message: string
  /** Suggested fix */
  suggestedFix?: string
  /** Error severity */
  severity: 'high' | 'medium' | 'low'
}

export interface ConfigurationWarning {
  /** Warning field path */
  field: string
  /** Warning message */
  message: string
  /** Recommendation */
  recommendation?: string
}

/**
 * Utility Types
 */
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P]
}

export type RequireAtLeastOne<T, Keys extends keyof T = keyof T> =
  Pick<T, Exclude<keyof T, Keys>> &
  { [K in Keys]-?: Required<Pick<T, K>> & Partial<Pick<T, Exclude<Keys, K>>> }[Keys]

export type AuthOperation<T = any> = {
  execute(): Promise<T>
  rollback?(): Promise<void>
  validate?(): Promise<boolean>
}

/**
 * Type Guards
 */
export function isAuthIntegrationError(error: any): error is AuthIntegrationError {
  return error instanceof Error && 'code' in error && 'retryable' in error
}

export function isWebhookEventData(data: any): data is WebhookEventData {
  return (
    typeof data === 'object' &&
    data !== null &&
    'type' in data &&
    'subscriptionId' in data &&
    'tier' in data &&
    'status' in data
  )
}

export function isPermissionContext(context: any): context is PermissionContext {
  return (
    typeof context === 'object' &&
    context !== null &&
    'userId' in context &&
    'tier' in context &&
    'permissions' in context &&
    'isAuthenticated' in context
  )
}

export function isEnrichedSessionData(session: any): session is EnrichedSessionData {
  return (
    typeof session === 'object' &&
    session !== null &&
    'userId' in session &&
    'tier' in session &&
    'status' in session &&
    'permissions' in session &&
    'features' in session
  )
}

/**
 * Default Configurations
 */
export const DEFAULT_AUTH_INTEGRATION_CONFIG: AuthIntegrationConfig = {
  enableSessionEnrichment: true,
  enableRealtimeUpdates: true,
  sessionCacheDuration: 5 * 60 * 1000, // 5 minutes
  permissionCacheDuration: 5 * 60 * 1000, // 5 minutes
  maxExecutionTime: 2000, // 2 seconds
  debugMode: process.env.NODE_ENV === 'development',
  performanceMonitoring: true,
  fallbackTier: 'BASIC',
  retryConfig: {
    maxRetries: 3,
    retryDelay: 1000,
    exponentialBackoff: true,
    retryableErrors: [
      'SESSION_ENRICHMENT_FAILED',
      'PERMISSION_CONTEXT_ERROR',
      'CLERK_API_ERROR',
      'EXTERNAL_SERVICE_ERROR'
    ]
  }
}

export const DEFAULT_SESSION_FLAGS: SessionFlags = {
  isSSOSession: false,
  requiresVerification: false,
  isNewDevice: false,
  hasElevatedPermissions: false,
  isMFAProtected: false
}

/**
 * Constants
 */
export const AUTH_INTEGRATION_VERSION = '2.0.0'
export const SUPPORTED_WEBHOOK_EVENTS: WebhookEventType[] = [
  'subscription.created',
  'subscription.updated',
  'subscription.deleted',
  'customer.subscription.trial_will_end',
  'invoice.payment_succeeded',
  'invoice.payment_failed',
  'customer.created'
]

export const CACHE_KEYS = {
  SESSION: 'auth:session',
  PERMISSION_CONTEXT: 'auth:permission_context',
  TIER_DETECTION: 'auth:tier_detection',
  USER_METADATA: 'auth:user_metadata'
} as const

export const PERFORMANCE_THRESHOLDS = {
  SESSION_ENRICHMENT_MAX_TIME: 1000, // 1 second
  PERMISSION_CHECK_MAX_TIME: 500, // 500ms
  WEBHOOK_PROCESSING_MAX_TIME: 5000, // 5 seconds
  CACHE_OPERATION_MAX_TIME: 100 // 100ms
} as const