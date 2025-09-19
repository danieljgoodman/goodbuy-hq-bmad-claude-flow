/**
 * Enterprise Error Handling Utilities
 * Comprehensive error handling and validation for Enterprise database operations
 */

import { z } from 'zod';
import { Prisma } from '@prisma/client';
import { NextResponse } from 'next/server';

// Error types
export enum ErrorCode {
  // Authentication & Authorization
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  INSUFFICIENT_TIER = 'INSUFFICIENT_TIER',

  // Validation
  INVALID_INPUT = 'INVALID_INPUT',
  VALIDATION_FAILED = 'VALIDATION_FAILED',
  MISSING_REQUIRED_FIELD = 'MISSING_REQUIRED_FIELD',

  // Database
  RECORD_NOT_FOUND = 'RECORD_NOT_FOUND',
  DUPLICATE_RECORD = 'DUPLICATE_RECORD',
  DATABASE_ERROR = 'DATABASE_ERROR',
  TRANSACTION_FAILED = 'TRANSACTION_FAILED',

  // Business Logic
  BUSINESS_RULE_VIOLATION = 'BUSINESS_RULE_VIOLATION',
  INCONSISTENT_DATA = 'INCONSISTENT_DATA',
  CALCULATION_ERROR = 'CALCULATION_ERROR',

  // External Services
  ENCRYPTION_FAILED = 'ENCRYPTION_FAILED',
  COMPRESSION_FAILED = 'COMPRESSION_FAILED',
  AUDIT_LOG_FAILED = 'AUDIT_LOG_FAILED',

  // Rate Limiting & Performance
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  TIMEOUT = 'TIMEOUT',
  RESOURCE_EXHAUSTED = 'RESOURCE_EXHAUSTED',

  // General
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR'
}

export interface ValidationError {
  field: string;
  message: string;
  code: string;
  value?: any;
}

export interface ApiError {
  status: number;
  code: ErrorCode;
  message: string;
  details?: ValidationError[];
  timestamp: Date;
  requestId?: string;
  userId?: string;
  resource?: string;
}

export class EnterpriseError extends Error {
  public readonly code: ErrorCode;
  public readonly status: number;
  public readonly details?: ValidationError[];
  public readonly timestamp: Date;
  public readonly requestId?: string;
  public readonly userId?: string;
  public readonly resource?: string;

  constructor(
    code: ErrorCode,
    message: string,
    status: number = 500,
    details?: ValidationError[],
    requestId?: string,
    userId?: string,
    resource?: string
  ) {
    super(message);
    this.name = 'EnterpriseError';
    this.code = code;
    this.status = status;
    this.details = details;
    this.timestamp = new Date();
    this.requestId = requestId;
    this.userId = userId;
    this.resource = resource;

    // Maintain proper stack trace
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, EnterpriseError);
    }
  }

  toJSON(): ApiError {
    return {
      status: this.status,
      code: this.code,
      message: this.message,
      details: this.details,
      timestamp: this.timestamp,
      requestId: this.requestId,
      userId: this.userId,
      resource: this.resource
    };
  }

  toResponse(): NextResponse {
    return NextResponse.json(
      {
        error: this.message,
        code: this.code,
        details: this.details,
        timestamp: this.timestamp,
        requestId: this.requestId
      },
      { status: this.status }
    );
  }
}

/**
 * Create validation error from Zod error
 */
export function createValidationError(
  zodError: z.ZodError,
  requestId?: string,
  userId?: string,
  resource?: string
): EnterpriseError {
  const details: ValidationError[] = zodError.issues.map(issue => ({
    field: issue.path.join('.'),
    message: issue.message,
    code: issue.code,
    value: issue.received
  }));

  return new EnterpriseError(
    ErrorCode.VALIDATION_FAILED,
    'Input validation failed',
    400,
    details,
    requestId,
    userId,
    resource
  );
}

/**
 * Create database error from Prisma error
 */
export function createDatabaseError(
  prismaError: Error,
  requestId?: string,
  userId?: string,
  resource?: string
): EnterpriseError {
  if (prismaError instanceof Prisma.PrismaClientKnownRequestError) {
    switch (prismaError.code) {
      case 'P2002':
        return new EnterpriseError(
          ErrorCode.DUPLICATE_RECORD,
          'A record with this data already exists',
          409,
          undefined,
          requestId,
          userId,
          resource
        );

      case 'P2025':
        return new EnterpriseError(
          ErrorCode.RECORD_NOT_FOUND,
          'The requested record was not found',
          404,
          undefined,
          requestId,
          userId,
          resource
        );

      case 'P2003':
        return new EnterpriseError(
          ErrorCode.BUSINESS_RULE_VIOLATION,
          'Foreign key constraint violation',
          400,
          undefined,
          requestId,
          userId,
          resource
        );

      default:
        return new EnterpriseError(
          ErrorCode.DATABASE_ERROR,
          `Database error: ${prismaError.message}`,
          500,
          undefined,
          requestId,
          userId,
          resource
        );
    }
  }

  if (prismaError instanceof Prisma.PrismaClientValidationError) {
    return new EnterpriseError(
      ErrorCode.INVALID_INPUT,
      'Invalid data provided to database',
      400,
      undefined,
      requestId,
      userId,
      resource
    );
  }

  return new EnterpriseError(
    ErrorCode.DATABASE_ERROR,
    `Database operation failed: ${prismaError.message}`,
    500,
    undefined,
    requestId,
    userId,
    resource
  );
}

/**
 * Create authentication error
 */
export function createAuthError(
  type: 'unauthorized' | 'forbidden' | 'insufficient_tier',
  message?: string,
  requestId?: string,
  userId?: string,
  resource?: string
): EnterpriseError {
  switch (type) {
    case 'unauthorized':
      return new EnterpriseError(
        ErrorCode.UNAUTHORIZED,
        message || 'Authentication required',
        401,
        undefined,
        requestId,
        userId,
        resource
      );

    case 'forbidden':
      return new EnterpriseError(
        ErrorCode.FORBIDDEN,
        message || 'Access denied',
        403,
        undefined,
        requestId,
        userId,
        resource
      );

    case 'insufficient_tier':
      return new EnterpriseError(
        ErrorCode.INSUFFICIENT_TIER,
        message || 'Enterprise tier required for this operation',
        403,
        undefined,
        requestId,
        userId,
        resource
      );
  }
}

/**
 * Create business rule violation error
 */
export function createBusinessRuleError(
  rule: string,
  message: string,
  requestId?: string,
  userId?: string,
  resource?: string
): EnterpriseError {
  return new EnterpriseError(
    ErrorCode.BUSINESS_RULE_VIOLATION,
    `Business rule violation: ${rule} - ${message}`,
    400,
    [{ field: 'business_rule', message, code: rule }],
    requestId,
    userId,
    resource
  );
}

/**
 * Error handler for API routes
 */
export function handleApiError(
  error: unknown,
  requestId?: string,
  userId?: string,
  resource?: string
): NextResponse {
  console.error('API Error:', error);

  // Already an EnterpriseError
  if (error instanceof EnterpriseError) {
    return error.toResponse();
  }

  // Zod validation error
  if (error instanceof z.ZodError) {
    const enterpriseError = createValidationError(error, requestId, userId, resource);
    return enterpriseError.toResponse();
  }

  // Prisma error
  if (error instanceof Prisma.PrismaClientKnownRequestError ||
      error instanceof Prisma.PrismaClientValidationError ||
      error instanceof Prisma.PrismaClientUnknownRequestError) {
    const enterpriseError = createDatabaseError(error as Error, requestId, userId, resource);
    return enterpriseError.toResponse();
  }

  // Generic Error
  if (error instanceof Error) {
    const enterpriseError = new EnterpriseError(
      ErrorCode.INTERNAL_ERROR,
      'An internal error occurred',
      500,
      undefined,
      requestId,
      userId,
      resource
    );
    return enterpriseError.toResponse();
  }

  // Unknown error
  const unknownError = new EnterpriseError(
    ErrorCode.UNKNOWN_ERROR,
    'An unknown error occurred',
    500,
    undefined,
    requestId,
    userId,
    resource
  );
  return unknownError.toResponse();
}

/**
 * Validation schemas for common operations
 */
export const CommonValidationSchemas = {
  evaluationId: z.string().uuid('Invalid evaluation ID format'),
  userId: z.string().min(1, 'User ID is required'),
  timeRange: z.enum(['1m', '3m', '6m', '1y', '3y', '5y']).default('1y'),
  pagination: z.object({
    page: z.number().int().min(1).default(1),
    limit: z.number().int().min(1).max(100).default(20)
  }),
  currency: z.number().min(0, 'Currency values must be non-negative'),
  percentage: z.number().min(0).max(100, 'Percentage must be between 0 and 100'),
  year: z.number().int().min(2020).max(2050, 'Invalid year')
};

/**
 * Business rule validators
 */
export const BusinessRuleValidators = {
  debtToEquityRatio: (ratio: number) => {
    if (ratio < 0) {
      throw createBusinessRuleError(
        'debt_to_equity_negative',
        'Debt to equity ratio cannot be negative'
      );
    }
    if (ratio > 10) {
      throw createBusinessRuleError(
        'debt_to_equity_excessive',
        'Debt to equity ratio exceeds safe limits (>10:1)'
      );
    }
  },

  workingCapitalPercentage: (percentage: number) => {
    if (percentage < -50) {
      throw createBusinessRuleError(
        'working_capital_negative',
        'Working capital percentage is extremely negative'
      );
    }
    if (percentage > 100) {
      throw createBusinessRuleError(
        'working_capital_excessive',
        'Working capital percentage exceeds reasonable limits'
      );
    }
  },

  growthRate: (rate: number) => {
    if (rate < -90) {
      throw createBusinessRuleError(
        'growth_rate_decline',
        'Growth rate indicates business failure'
      );
    }
    if (rate > 500) {
      throw createBusinessRuleError(
        'growth_rate_unrealistic',
        'Growth rate is unrealistically high'
      );
    }
  },

  marginEvolution: (current: number, projected: number) => {
    const change = projected - current;
    if (Math.abs(change) > 30) {
      throw createBusinessRuleError(
        'margin_evolution_extreme',
        'Margin evolution exceeds realistic improvement/decline ranges'
      );
    }
  },

  scenarioConsistency: (conservative: number, aggressive: number) => {
    if (conservative >= aggressive) {
      throw createBusinessRuleError(
        'scenario_inconsistency',
        'Conservative scenario returns cannot exceed aggressive scenario returns'
      );
    }
  }
};

/**
 * Safe async wrapper for database operations
 */
export async function safeDbOperation<T>(
  operation: () => Promise<T>,
  requestId?: string,
  userId?: string,
  resource?: string
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    throw createDatabaseError(error as Error, requestId, userId, resource);
  }
}

/**
 * Retry mechanism for transient failures
 */
export async function retryOperation<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: Error;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;

      // Don't retry on validation or authorization errors
      if (error instanceof EnterpriseError) {
        if (error.status < 500) {
          throw error;
        }
      }

      if (attempt === maxRetries) {
        break;
      }

      // Exponential backoff
      const delay = baseDelay * Math.pow(2, attempt - 1);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError!;
}

/**
 * Performance monitoring wrapper
 */
export async function monitorPerformance<T>(
  operation: () => Promise<T>,
  operationName: string,
  threshold: number = 5000
): Promise<T> {
  const start = Date.now();

  try {
    const result = await operation();
    const duration = Date.now() - start;

    if (duration > threshold) {
      console.warn(`Slow operation detected: ${operationName} took ${duration}ms`);
    }

    return result;
  } catch (error) {
    const duration = Date.now() - start;
    console.error(`Operation failed: ${operationName} took ${duration}ms`, error);
    throw error;
  }
}

/**
 * Input sanitization utilities
 */
export const sanitizeInput = {
  string: (input: string, maxLength: number = 1000): string => {
    return input.trim().slice(0, maxLength);
  },

  number: (input: number, min?: number, max?: number): number => {
    if (isNaN(input)) {
      throw new EnterpriseError(ErrorCode.INVALID_INPUT, 'Invalid number format', 400);
    }
    if (min !== undefined && input < min) {
      throw new EnterpriseError(ErrorCode.INVALID_INPUT, `Number must be at least ${min}`, 400);
    }
    if (max !== undefined && input > max) {
      throw new EnterpriseError(ErrorCode.INVALID_INPUT, `Number must be at most ${max}`, 400);
    }
    return input;
  },

  array: <T>(input: T[], maxLength: number = 100): T[] => {
    if (!Array.isArray(input)) {
      throw new EnterpriseError(ErrorCode.INVALID_INPUT, 'Expected array input', 400);
    }
    return input.slice(0, maxLength);
  }
};

/**
 * Request context for error tracking
 */
export interface RequestContext {
  requestId: string;
  userId?: string;
  userAgent?: string;
  ipAddress?: string;
  endpoint: string;
  timestamp: Date;
}

/**
 * Error logger with structured data
 */
export function logError(
  error: EnterpriseError | Error,
  context?: RequestContext
): void {
  const logData = {
    timestamp: new Date().toISOString(),
    error: {
      name: error.name,
      message: error.message,
      stack: error.stack
    },
    context
  };

  if (error instanceof EnterpriseError) {
    logData.error = {
      ...logData.error,
      code: error.code,
      status: error.status,
      details: error.details
    };
  }

  // In production, send to monitoring service
  if (process.env.NODE_ENV === 'production') {
    // Send to error tracking service (e.g., Sentry, DataDog)
    console.error(JSON.stringify(logData));
  } else {
    console.error('Enterprise Error:', logData);
  }
}

/**
 * Circuit breaker for external service calls
 */
export class CircuitBreaker {
  private failures = 0;
  private lastFailureTime = 0;
  private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';

  constructor(
    private readonly threshold: number = 5,
    private readonly timeout: number = 60000
  ) {}

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (this.state === 'OPEN') {
      if (Date.now() - this.lastFailureTime < this.timeout) {
        throw new EnterpriseError(
          ErrorCode.RESOURCE_EXHAUSTED,
          'Service temporarily unavailable',
          503
        );
      }
      this.state = 'HALF_OPEN';
    }

    try {
      const result = await operation();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess(): void {
    this.failures = 0;
    this.state = 'CLOSED';
  }

  private onFailure(): void {
    this.failures++;
    this.lastFailureTime = Date.now();

    if (this.failures >= this.threshold) {
      this.state = 'OPEN';
    }
  }
}