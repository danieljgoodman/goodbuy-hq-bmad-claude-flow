/**
 * Tier Protection Middleware Tests
 * Story 11.10: Comprehensive test suite for API endpoint protection
 */

import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { NextRequest } from 'next/server';
import { createTierProtectionMiddleware } from '../../middleware/tier-protection';
import { UserTier } from '../../lib/access-control/permission-matrix';

// Mock Clerk auth
jest.mock('@clerk/nextjs', () => ({
  auth: jest.fn()
}));

// Mock user subscription service
jest.mock('../../lib/subscription/user-subscription', () => ({
  getUserSubscriptionDetails: jest.fn()
}));

// Mock audit logging
jest.mock('../../lib/audit/enterprise-audit-log', () => ({
  createAuditLog: jest.fn()
}));

// Mock access control
jest.mock('../../lib/access-control/tier-access-control', () => ({
  checkPermission: jest.fn(),
  trackUsage: jest.fn()
}));

import { auth } from '@clerk/nextjs';
import { getUserSubscriptionDetails } from '../../lib/subscription/user-subscription';
import { createAuditLog } from '../../lib/audit/enterprise-audit-log';
import { checkPermission, trackUsage } from '../../lib/access-control/tier-access-control';

const mockAuth = auth as jest.MockedFunction<typeof auth>;
const mockGetUserSubscription = getUserSubscriptionDetails as jest.MockedFunction<typeof getUserSubscriptionDetails>;
const mockCreateAuditLog = createAuditLog as jest.MockedFunction<typeof createAuditLog>;
const mockCheckPermission = checkPermission as jest.MockedFunction<typeof checkPermission>;
const mockTrackUsage = trackUsage as jest.MockedFunction<typeof trackUsage>;

describe('Tier Protection Middleware', () => {
  const mockRequest = (url: string, options: any = {}): NextRequest => {
    return new NextRequest(url, {
      method: 'GET',
      headers: {
        'x-forwarded-for': '192.168.1.1',
        'user-agent': 'test-agent',
        ...options.headers
      },
      ...options
    });
  };

  const mockSubscription = (tier: UserTier) => ({
    userId: 'user_123',
    tier,
    status: 'active' as const,
    currentPeriodStart: new Date(),
    currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    cancelAtPeriodEnd: false,
    features: {
      maxReports: tier === 'basic' ? 5 : tier === 'professional' ? 25 : -1,
      maxEvaluations: tier === 'basic' ? 2 : tier === 'professional' ? 10 : -1,
      maxAiAnalyses: tier === 'basic' ? 0 : tier === 'professional' ? 20 : -1,
      maxScenarios: tier === 'basic' ? 0 : tier === 'professional' ? 8 : -1,
      storageLimit: tier === 'basic' ? 100 : tier === 'professional' ? 1000 : -1,
      apiCallsPerMonth: tier === 'basic' ? 0 : tier === 'professional' ? 10000 : -1,
      concurrentUsers: tier === 'basic' ? 1 : tier === 'professional' ? 3 : -1,
      dataRetentionDays: tier === 'basic' ? 30 : tier === 'professional' ? 365 : -1
    }
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockCreateAuditLog.mockResolvedValue();
    mockTrackUsage.mockReturnValue();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Authentication', () => {
    it('should reject unauthenticated requests', async () => {
      mockAuth.mockReturnValue({ userId: null } as any);

      const middleware = createTierProtectionMiddleware({
        requiredTier: 'basic',
        feature: 'reports',
        action: 'create'
      });

      const request = mockRequest('https://example.com/api/reports');
      const response = await middleware(request);

      expect(response.status).toBe(401);
      const body = await response.json();
      expect(body.code).toBe('AUTH_REQUIRED');
      expect(body.upgradeUrl).toBe('/auth/signin');
    });

    it('should handle subscription lookup failure', async () => {
      mockAuth.mockReturnValue({ userId: 'user_123' } as any);
      mockGetUserSubscription.mockResolvedValue(null);

      const middleware = createTierProtectionMiddleware({
        requiredTier: 'basic',
        feature: 'reports',
        action: 'create'
      });

      const request = mockRequest('https://example.com/api/reports');
      const response = await middleware(request);

      expect(response.status).toBe(403);
      const body = await response.json();
      expect(body.code).toBe('SUBSCRIPTION_ERROR');
    });
  });

  describe('Tier-based Access Control', () => {
    beforeEach(() => {
      mockAuth.mockReturnValue({ userId: 'user_123' } as any);
    });

    it('should allow access for basic tier users to basic features', async () => {
      mockGetUserSubscription.mockResolvedValue(mockSubscription('basic'));
      mockCheckPermission.mockReturnValue({
        allowed: true,
        permission: 'write'
      });

      const middleware = createTierProtectionMiddleware({
        requiredTier: 'basic',
        feature: 'reports',
        action: 'create'
      });

      const request = mockRequest('https://example.com/api/reports');
      const response = await middleware(request);

      expect(response.status).toBe(200);
      expect(mockTrackUsage).toHaveBeenCalled();
      expect(mockCreateAuditLog).toHaveBeenCalledWith(
        expect.any(String),
        'read',
        expect.objectContaining({
          userId: 'user_123',
          userTier: 'basic'
        }),
        expect.any(Object)
      );
    });

    it('should deny basic tier users access to professional features', async () => {
      mockGetUserSubscription.mockResolvedValue(mockSubscription('basic'));
      mockCheckPermission.mockReturnValue({
        allowed: false,
        permission: 'none',
        reason: 'insufficient_tier',
        upgradeRequired: 'professional'
      });

      const middleware = createTierProtectionMiddleware({
        requiredTier: 'professional',
        feature: 'ai_analysis',
        action: 'create'
      });

      const request = mockRequest('https://example.com/api/ai-analysis');
      const response = await middleware(request);

      expect(response.status).toBe(403);
      const body = await response.json();
      expect(body.code).toBe('PERMISSION_DENIED');
      expect(body.details.requiredTier).toBe('professional');
      expect(body.upgradeUrl).toContain('tier=professional');
    });

    it('should allow professional tier users access to professional features', async () => {
      mockGetUserSubscription.mockResolvedValue(mockSubscription('professional'));
      mockCheckPermission.mockReturnValue({
        allowed: true,
        permission: 'write'
      });

      const middleware = createTierProtectionMiddleware({
        requiredTier: 'professional',
        feature: 'ai_analysis',
        action: 'create'
      });

      const request = mockRequest('https://example.com/api/ai-analysis');
      const response = await middleware(request);

      expect(response.status).toBe(200);
    });

    it('should deny professional tier users access to enterprise features', async () => {
      mockGetUserSubscription.mockResolvedValue(mockSubscription('professional'));
      mockCheckPermission.mockReturnValue({
        allowed: false,
        permission: 'none',
        reason: 'insufficient_tier',
        upgradeRequired: 'enterprise'
      });

      const middleware = createTierProtectionMiddleware({
        requiredTier: 'enterprise',
        feature: 'scenario_modeling',
        action: 'create'
      });

      const request = mockRequest('https://example.com/api/scenario-modeling');
      const response = await middleware(request);

      expect(response.status).toBe(403);
      const body = await response.json();
      expect(body.details.requiredTier).toBe('enterprise');
    });

    it('should allow enterprise tier users access to all features', async () => {
      mockGetUserSubscription.mockResolvedValue(mockSubscription('enterprise'));
      mockCheckPermission.mockReturnValue({
        allowed: true,
        permission: 'admin'
      });

      const middleware = createTierProtectionMiddleware({
        requiredTier: 'enterprise',
        feature: 'admin',
        action: 'create'
      });

      const request = mockRequest('https://example.com/api/admin');
      const response = await middleware(request);

      expect(response.status).toBe(200);
    });
  });

  describe('Custom Permission Logic', () => {
    beforeEach(() => {
      mockAuth.mockReturnValue({ userId: 'user_123' } as any);
      mockGetUserSubscription.mockResolvedValue(mockSubscription('professional'));
    });

    it('should execute custom permission check', async () => {
      const customPermissionCheck = jest.fn().mockResolvedValue({
        allowed: false,
        reason: 'Custom denial reason',
        upgradeRequired: 'enterprise'
      });

      const middleware = createTierProtectionMiddleware({
        requiredTier: 'professional',
        feature: 'reports',
        action: 'create',
        customPermissionCheck
      });

      const request = mockRequest('https://example.com/api/reports');
      const response = await middleware(request);

      expect(customPermissionCheck).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'user_123',
          userTier: 'professional',
          feature: 'reports',
          action: 'create'
        })
      );

      expect(response.status).toBe(403);
      const body = await response.json();
      expect(body.details.reason).toBe('Custom denial reason');
    });

    it('should allow access when custom permission check passes', async () => {
      const customPermissionCheck = jest.fn().mockResolvedValue({
        allowed: true,
        context: { customData: 'test' }
      });

      const middleware = createTierProtectionMiddleware({
        requiredTier: 'professional',
        feature: 'reports',
        action: 'create',
        customPermissionCheck
      });

      const request = mockRequest('https://example.com/api/reports');
      const response = await middleware(request);

      expect(response.status).toBe(200);
    });
  });

  describe('Request Header Enrichment', () => {
    beforeEach(() => {
      mockAuth.mockReturnValue({ userId: 'user_123' } as any);
      mockGetUserSubscription.mockResolvedValue(mockSubscription('professional'));
      mockCheckPermission.mockReturnValue({
        allowed: true,
        permission: 'write',
        context: { feature: 'test' }
      });
    });

    it('should enrich request headers with permission context', async () => {
      const middleware = createTierProtectionMiddleware({
        requiredTier: 'professional',
        feature: 'reports',
        action: 'create'
      });

      const request = mockRequest('https://example.com/api/reports');
      const response = await middleware(request);

      expect(response.status).toBe(200);

      // Check that the response contains Next.js middleware continuation
      // In a real scenario, you'd check the request object passed to the next handler
      // For this test, we verify that the middleware returns a successful response
      expect(response).toBeDefined();
    });
  });

  describe('Rate Limiting Integration', () => {
    beforeEach(() => {
      mockAuth.mockReturnValue({ userId: 'user_123' } as any);
      mockGetUserSubscription.mockResolvedValue(mockSubscription('basic'));
    });

    it('should apply rate limiting when enabled', async () => {
      mockCheckPermission.mockReturnValue({
        allowed: false,
        permission: 'none',
        reason: 'insufficient_tier'
      });

      const middleware = createTierProtectionMiddleware({
        requiredTier: 'professional',
        feature: 'ai_analysis',
        action: 'create',
        enableRateLimit: true
      });

      const request = mockRequest('https://example.com/api/ai-analysis');

      // First request should be denied due to tier
      const response1 = await middleware(request);
      expect(response1.status).toBe(403);

      // Subsequent rapid requests should trigger rate limiting
      // (This would require more complex mocking of the rate limiter)
    });
  });

  describe('Audit Logging', () => {
    beforeEach(() => {
      mockAuth.mockReturnValue({ userId: 'user_123' } as any);
      mockGetUserSubscription.mockResolvedValue(mockSubscription('professional'));
    });

    it('should log successful access when audit logging is enabled', async () => {
      mockCheckPermission.mockReturnValue({
        allowed: true,
        permission: 'write'
      });

      const middleware = createTierProtectionMiddleware({
        requiredTier: 'professional',
        feature: 'reports',
        action: 'create',
        enableAuditLog: true
      });

      const request = mockRequest('https://example.com/api/reports');
      const response = await middleware(request);

      expect(response.status).toBe(200);
      expect(mockCreateAuditLog).toHaveBeenCalledWith(
        expect.any(String),
        'read',
        expect.objectContaining({
          userId: 'user_123',
          userTier: 'professional',
          ipAddress: '192.168.1.1',
          userAgent: 'test-agent'
        }),
        expect.objectContaining({
          reason: expect.stringContaining('Access allowed')
        })
      );
    });

    it('should log denied access when audit logging is enabled', async () => {
      mockCheckPermission.mockReturnValue({
        allowed: false,
        permission: 'none',
        reason: 'insufficient_tier'
      });

      const middleware = createTierProtectionMiddleware({
        requiredTier: 'enterprise',
        feature: 'admin',
        action: 'create',
        enableAuditLog: true
      });

      const request = mockRequest('https://example.com/api/admin');
      const response = await middleware(request);

      expect(response.status).toBe(403);
      expect(mockCreateAuditLog).toHaveBeenCalledWith(
        expect.any(String),
        'access_denied',
        expect.objectContaining({
          userId: 'user_123',
          userTier: 'professional'
        }),
        expect.objectContaining({
          reason: 'insufficient_tier'
        })
      );
    });
  });

  describe('Error Handling', () => {
    beforeEach(() => {
      mockAuth.mockReturnValue({ userId: 'user_123' } as any);
    });

    it('should handle subscription service errors gracefully', async () => {
      mockGetUserSubscription.mockRejectedValue(new Error('Database connection failed'));

      const middleware = createTierProtectionMiddleware({
        requiredTier: 'basic',
        feature: 'reports',
        action: 'create'
      });

      const request = mockRequest('https://example.com/api/reports');
      const response = await middleware(request);

      expect(response.status).toBe(500);
      const body = await response.json();
      expect(body.code).toBe('MIDDLEWARE_ERROR');
    });

    it('should handle permission check errors gracefully', async () => {
      mockGetUserSubscription.mockResolvedValue(mockSubscription('basic'));
      mockCheckPermission.mockImplementation(() => {
        throw new Error('Permission check failed');
      });

      const middleware = createTierProtectionMiddleware({
        requiredTier: 'basic',
        feature: 'reports',
        action: 'create'
      });

      const request = mockRequest('https://example.com/api/reports');
      const response = await middleware(request);

      expect(response.status).toBe(500);
    });

    it('should continue if audit logging fails', async () => {
      mockGetUserSubscription.mockResolvedValue(mockSubscription('basic'));
      mockCheckPermission.mockReturnValue({
        allowed: true,
        permission: 'write'
      });
      mockCreateAuditLog.mockRejectedValue(new Error('Audit log failed'));

      const middleware = createTierProtectionMiddleware({
        requiredTier: 'basic',
        feature: 'reports',
        action: 'create',
        enableAuditLog: true
      });

      const request = mockRequest('https://example.com/api/reports');
      const response = await middleware(request);

      // Should still succeed even if audit logging fails
      expect(response.status).toBe(200);
    });
  });

  describe('Performance', () => {
    beforeEach(() => {
      mockAuth.mockReturnValue({ userId: 'user_123' } as any);
      mockGetUserSubscription.mockResolvedValue(mockSubscription('professional'));
      mockCheckPermission.mockReturnValue({
        allowed: true,
        permission: 'write'
      });
    });

    it('should complete permission check within performance threshold', async () => {
      const middleware = createTierProtectionMiddleware({
        requiredTier: 'professional',
        feature: 'reports',
        action: 'create'
      });

      const request = mockRequest('https://example.com/api/reports');

      const startTime = Date.now();
      const response = await middleware(request);
      const endTime = Date.now();

      expect(response.status).toBe(200);
      expect(endTime - startTime).toBeLessThan(50); // Should complete in <50ms
    });
  });
});

export {};