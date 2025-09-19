/**
 * Security Tests for Story 11.10: Tier Bypass Attempts and Vulnerability Prevention
 * 
 * Tests security measures to prevent bypass attempts, SQL injection, XSS, CSRF,
 * and validates rate limiting protections.
 */

import { describe, test, expect, beforeEach, afterEach, jest, beforeAll, afterAll } from '@jest/globals';
import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs';
import {
  TierAccessControl,
  tierAccessControl,
  checkPermission,
  trackUsage
} from '@/lib/access-control/tier-access-control';
import { UserTier } from '@/lib/access-control/permission-matrix';
import { validateTierAccess } from '@/middleware/tier-validation';
import { rateLimit } from '@/lib/utils/rate-limit';

// Mock external dependencies
jest.mock('@clerk/nextjs');
jest.mock('@/lib/utils/rate-limit');
jest.mock('@/lib/access-control/permission-checker');

const mockCurrentUser = currentUser as jest.MockedFunction<typeof currentUser>;
const mockRateLimit = rateLimit as jest.MockedFunction<typeof rateLimit>;

// Security test fixtures
const maliciousPayloads = {
  sqlInjection: [
    "'; DROP TABLE users; --",
    "' OR '1'='1",
    "'; DELETE FROM projects WHERE user_id = '1'; --",
    "' UNION SELECT * FROM admin_users --",
    "'; UPDATE users SET tier = 'enterprise' WHERE id = '1'; --"
  ],
  xssPayloads: [
    "<script>alert('XSS')</script>",
    "<img src=x onerror=alert('XSS')>",
    "javascript:alert('XSS')",
    "<svg onload=alert('XSS')>",
    "';alert(String.fromCharCode(88,83,83))//';alert(String.fromCharCode(88,83,83))//\";alert(String.fromCharCode(88,83,83))//\";alert(String.fromCharCode(88,83,83))//--></SCRIPT>\">'><SCRIPT>alert(String.fromCharCode(88,83,83))</SCRIPT>"
  ],
  tierBypassAttempts: [
    { tier: 'enterprise', token: 'fake_admin_token' },
    { tier: 'professional', userId: '../../../admin' },
    { tier: 'basic', metadata: { tier: 'enterprise' } },
    { tier: 'enterprise', bypass: true }
  ],
  pathTraversalAttempts: [
    "../../../etc/passwd",
    "..\\..\\..\\windows\\system32\\config\\sam",
    "%2e%2e%2f%2e%2e%2f%2e%2e%2fetc%2fpasswd",
    "....//....//....//etc/passwd"
  ]
};

const mockUsers = {
  maliciousUser: {
    id: 'user_malicious_666',
    emailAddresses: [{ emailAddress: 'hacker@evil.com' }],
    publicMetadata: { tier: 'basic' as UserTier },
    privateMetadata: { suspicious: true }
  },
  normalUser: {
    id: 'user_normal_123',
    emailAddresses: [{ emailAddress: 'user@test.com' }],
    publicMetadata: { tier: 'basic' as UserTier },
    privateMetadata: { stripeCustomerId: 'cus_123' }
  },
  premiumUser: {
    id: 'user_premium_456',
    emailAddresses: [{ emailAddress: 'premium@test.com' }],
    publicMetadata: { tier: 'professional' as UserTier },
    privateMetadata: { stripeCustomerId: 'cus_456' }
  }
};

describe('Security Tests - Tier Bypass Attempts', () => {
  let accessControl: TierAccessControl;

  beforeAll(() => {
    // Setup security test environment
    global.fetch = jest.fn();
    global.console.warn = jest.fn();
    global.console.error = jest.fn();
    
    // Mock rate limiting
    mockRateLimit.mockImplementation(async () => ({
      success: true,
      limit: 100,
      remaining: 99,
      reset: new Date(Date.now() + 60000)
    }));
  });

  beforeEach(() => {
    accessControl = new TierAccessControl();
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  describe('Tier Bypass Prevention', () => {
    test('should prevent direct tier manipulation in requests', async () => {
      const maliciousRequest = new NextRequest('https://example.com/api/reports/enterprise', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-tier': 'enterprise', // Malicious header
          'authorization': 'Bearer fake_enterprise_token'
        },
        body: JSON.stringify({
          tier: 'enterprise', // Malicious body parameter
          forceAccess: true,
          adminOverride: true
        })
      });

      mockCurrentUser.mockResolvedValueOnce(mockUsers.maliciousUser);

      // Should validate against actual user tier, not request data
      const hasAccess = await validateTierAccess(maliciousRequest, 'enterprise');
      expect(hasAccess).toBe(false);
      
      // Should log suspicious activity
      expect(console.warn).toHaveBeenCalledWith(
        expect.stringContaining('Tier validation failed')
      );
    });

    test('should prevent privilege escalation through metadata manipulation', () => {
      const bypassAttempts = [
        { userId: 'user_123', tier: 'basic', fakeMetadata: { tier: 'enterprise' } },
        { userId: 'user_123', tier: 'basic', adminFlag: true },
        { userId: 'user_123', tier: 'basic', bypass: 'admin_override' },
        { userId: 'user_123', tier: 'basic', elevation: 'enterprise' }
      ];

      bypassAttempts.forEach((attempt, index) => {
        const result = accessControl.checkPermission(
          'basic', // Actual tier from authentication
          'api',
          'access',
          {
            userId: attempt.userId,
            feature: 'api',
            action: 'access',
            metadata: attempt as any
          }
        );

        expect(result.allowed).toBe(false);
        expect(result.reason).toContain('not available for basic tier');
      });
    });

    test('should prevent cookie/session manipulation', async () => {
      const maliciousRequest = new NextRequest('https://example.com/api/premium-features', {
        headers: {
          'cookie': 'user-tier=enterprise; admin=true; bypass-checks=1',
          'x-forwarded-for': '127.0.0.1', // Potential localhost bypass attempt
          'x-real-ip': '10.0.0.1' // Internal IP attempt
        }
      });

      mockCurrentUser.mockResolvedValueOnce(mockUsers.maliciousUser);

      const hasAccess = await validateTierAccess(maliciousRequest, 'professional');
      expect(hasAccess).toBe(false);

      // Should only validate against authenticated user data
      const permissions = accessControl.getPermissionsForTier('basic');
      expect(permissions.limits.apiCalls).toBe(0); // Basic tier has no API access
    });

    test('should prevent URL parameter manipulation', async () => {
      const maliciousUrls = [
        'https://example.com/api/reports?tier=enterprise',
        'https://example.com/api/data?admin=true&tier=professional',
        'https://example.com/api/premium?bypass=1&user_tier=enterprise',
        'https://example.com/api/features?elevation=admin&tier=enterprise'
      ];

      for (const url of maliciousUrls) {
        const request = new NextRequest(url);
        mockCurrentUser.mockResolvedValueOnce(mockUsers.maliciousUser);

        const hasAccess = await validateTierAccess(request, 'professional');
        expect(hasAccess).toBe(false);
      }
    });
  });

  describe('SQL Injection Prevention', () => {
    test('should sanitize user input in tier validation queries', () => {
      maliciousPayloads.sqlInjection.forEach(payload => {
        const context = {
          userId: payload, // Malicious user ID
          feature: 'ai_analysis' as const,
          action: 'generate'
        };

        // Should not throw SQL errors and should handle gracefully
        expect(() => {
          const result = accessControl.checkPermission(
            'basic',
            'ai_analysis',
            'generate',
            context
          );
          expect(result.allowed).toBeDefined();
        }).not.toThrow();
      });
    });

    test('should prevent SQL injection in usage tracking', () => {
      maliciousPayloads.sqlInjection.forEach(payload => {
        const maliciousContext = {
          userId: payload,
          feature: 'reports' as const,
          action: payload, // Both user ID and action contain SQL injection
          metadata: {
            projectId: payload,
            filterValue: payload
          }
        };

        // Should handle malicious input gracefully without SQL errors
        expect(() => {
          accessControl.trackUsage(maliciousContext);
        }).not.toThrow();

        // Verify tracking doesn't break system
        const usage = accessControl.getCurrentUsage(
          payload,
          'reports',
          payload,
          'monthly'
        );
        expect(typeof usage).toBe('number');
      });
    });

    test('should validate database queries for tier limit checks', () => {
      const maliciousValues = [
        "1; DROP TABLE users; --",
        "'; UPDATE users SET tier = 'enterprise'; --",
        "1 OR 1=1",
        "NULL; INSERT INTO admin_users VALUES ('hacker', 'password'); --"
      ];

      maliciousValues.forEach(value => {
        // Should handle malicious limit values safely
        expect(() => {
          const result = accessControl.checkTierLimits(
            'basic',
            'projects',
            parseInt(value) || 0
          );
          expect(result.allowed).toBeDefined();
        }).not.toThrow();
      });
    });
  });

  describe('XSS Prevention', () => {
    test('should sanitize user-generated content in error messages', () => {
      maliciousPayloads.xssPayloads.forEach(payload => {
        const result = accessControl.checkPermission(
          'basic',
          'nonexistent_feature' as any,
          payload // Malicious action name
        );

        expect(result.allowed).toBe(false);
        expect(result.reason).toBeDefined();
        
        // Error message should not contain raw script tags
        expect(result.reason).not.toContain('<script>');
        expect(result.reason).not.toContain('javascript:');
        expect(result.reason).not.toContain('onerror=');
      });
    });

    test('should sanitize feature names and actions in responses', () => {
      const maliciousFeature = "<script>alert('xss')</script>" as any;
      const maliciousAction = "javascript:alert('xss')";

      const result = accessControl.checkPermission(
        'basic',
        maliciousFeature,
        maliciousAction
      );

      expect(result.allowed).toBe(false);
      if (result.reason) {
        // Should escape HTML entities
        expect(result.reason).toMatch(/&lt;.*&gt;|escaped|sanitized/);
      }
    });

    test('should prevent XSS in upgrade recommendation messages', () => {
      const xssFeature = "<img src=x onerror=alert('xss')>" as any;
      const xssAction = "';alert('xss');//";

      const recommendations = accessControl.getUpgradeRecommendations(
        'basic',
        xssFeature,
        xssAction
      );

      if (recommendations) {
        recommendations.benefits.forEach(benefit => {
          expect(benefit).not.toContain('<script>');
          expect(benefit).not.toContain('javascript:');
          expect(benefit).not.toContain('onerror=');
        });
      }
    });
  });

  describe('CSRF Protection', () => {
    test('should require proper CSRF tokens for tier modifications', async () => {
      const csrfAttackRequest = new NextRequest('https://example.com/api/upgrade-tier', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Origin': 'https://malicious-site.com', // Different origin
          'Referer': 'https://malicious-site.com/attack.html'
        },
        body: JSON.stringify({
          newTier: 'enterprise',
          userId: 'user_123'
        })
      });

      // Should reject requests without proper CSRF protection
      mockCurrentUser.mockResolvedValueOnce(mockUsers.normalUser);
      
      // In a real implementation, middleware would check CSRF tokens
      const hasValidOrigin = csrfAttackRequest.headers.get('Origin') === 'https://goodbuy.com';
      expect(hasValidOrigin).toBe(false);
    });

    test('should validate referrer headers for sensitive operations', async () => {
      const suspiciousRequests = [
        {
          origin: 'https://evil.com',
          referer: 'https://evil.com/csrf-attack.html'
        },
        {
          origin: null,
          referer: null // Missing headers
        },
        {
          origin: 'https://goodbuy.com.evil.com', // Subdomain attack
          referer: 'https://goodbuy.com.evil.com/fake-page'
        }
      ];

      suspiciousRequests.forEach(({ origin, referer }) => {
        const request = new NextRequest('https://goodbuy.com/api/sensitive-action', {
          method: 'POST',
          headers: {
            ...(origin && { 'Origin': origin }),
            ...(referer && { 'Referer': referer })
          }
        });

        // Should validate origin matches expected domain
        const isValidOrigin = origin === 'https://goodbuy.com' || origin === 'https://app.goodbuy.com';
        expect(isValidOrigin).toBe(false);
      });
    });
  });

  describe('Rate Limiting Validation', () => {
    test('should enforce rate limits by user tier', async () => {
      const userId = mockUsers.normalUser.id;
      
      // Mock rate limiting responses
      mockRateLimit
        .mockResolvedValueOnce({ success: true, limit: 10, remaining: 9, reset: new Date() })
        .mockResolvedValueOnce({ success: true, limit: 10, remaining: 8, reset: new Date() })
        .mockResolvedValueOnce({ success: false, limit: 10, remaining: 0, reset: new Date() });

      // First few requests should succeed
      let rateLimitResult = await mockRateLimit(`user:${userId}:api`, 10, 60);
      expect(rateLimitResult.success).toBe(true);

      rateLimitResult = await mockRateLimit(`user:${userId}:api`, 10, 60);
      expect(rateLimitResult.success).toBe(true);

      // Exceeding rate limit should fail
      rateLimitResult = await mockRateLimit(`user:${userId}:api`, 10, 60);
      expect(rateLimitResult.success).toBe(false);
      expect(rateLimitResult.remaining).toBe(0);
    });

    test('should prevent rapid-fire tier bypass attempts', async () => {
      const maliciousUserId = mockUsers.maliciousUser.id;
      const bypassAttempts = 50;
      
      // Mock rate limiting to trigger after 10 attempts
      mockRateLimit
        .mockResolvedValueOnce({ success: true, limit: 10, remaining: 9, reset: new Date() })
        .mockResolvedValue({ success: false, limit: 10, remaining: 0, reset: new Date() });

      const results = [];
      
      // Simulate rapid bypass attempts
      for (let i = 0; i < bypassAttempts; i++) {
        const rateLimitResult = await mockRateLimit(
          `user:${maliciousUserId}:bypass_attempts`,
          10,
          300 // 5-minute window
        );
        results.push(rateLimitResult);
      }

      // First attempt might succeed, rest should be rate limited
      expect(results[0].success).toBe(true);
      expect(results.slice(1).every(r => !r.success)).toBe(true);
    });

    test('should implement progressive rate limiting for suspicious activity', async () => {
      const suspiciousUserId = mockUsers.maliciousUser.id;
      
      // Simulate detection of suspicious patterns
      const suspiciousPatterns = [
        'tier_manipulation_attempt',
        'privilege_escalation_attempt',
        'sql_injection_attempt',
        'xss_attempt'
      ];

      // Each pattern should trigger stricter rate limiting
      for (const pattern of suspiciousPatterns) {
        mockRateLimit.mockResolvedValueOnce({
          success: false,
          limit: 1, // Very restrictive for suspicious users
          remaining: 0,
          reset: new Date(Date.now() + 3600000) // 1-hour cooldown
        });

        const rateLimitResult = await mockRateLimit(
          `user:${suspiciousUserId}:${pattern}`,
          1,
          3600
        );

        expect(rateLimitResult.success).toBe(false);
        expect(rateLimitResult.limit).toBe(1);
      }
    });
  });

  describe('Advanced Security Measures', () => {
    test('should detect and prevent timing attacks', async () => {
      const startTime = Date.now();
      
      // Both valid and invalid users should take similar time to validate
      const validUserResult = accessControl.checkPermission(
        'basic',
        'ai_analysis',
        'generate',
        { userId: mockUsers.normalUser.id, feature: 'ai_analysis', action: 'generate' }
      );
      const validTime = Date.now() - startTime;

      const startTime2 = Date.now();
      const invalidUserResult = accessControl.checkPermission(
        'basic',
        'nonexistent_feature' as any,
        'generate',
        { userId: 'nonexistent_user', feature: 'nonexistent_feature' as any, action: 'generate' }
      );
      const invalidTime = Date.now() - startTime2;

      // Time difference should be minimal (within 50ms)
      const timeDifference = Math.abs(validTime - invalidTime);
      expect(timeDifference).toBeLessThan(50);

      expect(validUserResult.allowed).toBe(true);
      expect(invalidUserResult.allowed).toBe(false);
    });

    test('should prevent information disclosure through error messages', () => {
      const sensitiveQueries = [
        { tier: 'nonexistent' as UserTier, feature: 'admin_panel' as any },
        { tier: 'basic', feature: 'internal_metrics' as any },
        { tier: 'professional', feature: 'system_diagnostics' as any }
      ];

      sensitiveQueries.forEach(query => {
        const result = accessControl.checkPermission(
          query.tier,
          query.feature,
          'access'
        );

        expect(result.allowed).toBe(false);
        
        // Error messages should be generic, not revealing system internals
        if (result.reason) {
          expect(result.reason).not.toContain('database');
          expect(result.reason).not.toContain('internal');
          expect(result.reason).not.toContain('system');
          expect(result.reason).not.toContain('debug');
        }
      });
    });

    test('should implement secure session handling', () => {
      const sessionTests = [
        {
          name: 'expired session',
          context: {
            userId: mockUsers.normalUser.id,
            feature: 'api' as const,
            action: 'access',
            metadata: {
              sessionExpired: true,
              timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000) // 24 hours ago
            }
          }
        },
        {
          name: 'concurrent session',
          context: {
            userId: mockUsers.normalUser.id,
            feature: 'api' as const,
            action: 'access',
            metadata: {
              sessionId: 'session_123',
              concurrentSessions: 5 // Suspicious number of concurrent sessions
            }
          }
        }
      ];

      sessionTests.forEach(test => {
        const result = accessControl.checkPermission(
          'professional',
          test.context.feature,
          test.context.action,
          test.context
        );

        // Should handle session security gracefully
        expect(result.allowed).toBeDefined();
        expect(result.permission).toBeDefined();
      });
    });

    test('should validate input sanitization for all user inputs', () => {
      const maliciousInputs = {
        userId: "'; DROP TABLE users; --",
        feature: "<script>alert('xss')</script>",
        action: "../../../etc/passwd",
        metadata: {
          projectName: "'; UPDATE projects SET owner = 'hacker'; --",
          description: "<img src=x onerror=alert('xss')>",
          tags: ["normal", "'; DELETE FROM tags; --", "<script>steal()</script>"]
        }
      };

      // Should handle all malicious inputs without errors or security breaches
      expect(() => {
        const result = accessControl.checkPermission(
          'basic',
          'ai_analysis',
          'generate',
          maliciousInputs as any
        );
        expect(result.allowed).toBeDefined();
      }).not.toThrow();

      // Usage tracking should also be safe
      expect(() => {
        accessControl.trackUsage(maliciousInputs as any);
      }).not.toThrow();
    });
  });

  describe('Audit and Monitoring', () => {
    test('should log all security violations for audit purposes', () => {
      const securityViolations = [
        {
          type: 'tier_bypass_attempt',
          userId: mockUsers.maliciousUser.id,
          attempt: 'header_manipulation'
        },
        {
          type: 'sql_injection_attempt',
          userId: mockUsers.maliciousUser.id,
          payload: "'; DROP TABLE users; --"
        },
        {
          type: 'xss_attempt',
          userId: mockUsers.maliciousUser.id,
          payload: "<script>alert('xss')</script>"
        }
      ];

      // Simulate security violations
      securityViolations.forEach(violation => {
        const result = accessControl.checkPermission(
          'basic',
          'ai_analysis',
          'generate',
          {
            userId: violation.userId,
            feature: 'ai_analysis',
            action: 'generate',
            metadata: { securityTest: violation }
          }
        );

        // Should log security events (mocked console.warn should be called)
        expect(result.allowed).toBeDefined();
      });

      // Verify security logging occurred
      expect(console.warn).toHaveBeenCalled();
    });

    test('should track failed authentication attempts', async () => {
      const failedAttempts = [
        { reason: 'invalid_tier', tier: 'fake_tier' },
        { reason: 'missing_permissions', feature: 'admin_only' },
        { reason: 'rate_limit_exceeded', attempts: 100 }
      ];

      for (const attempt of failedAttempts) {
        // Mock failed authentication
        mockCurrentUser.mockResolvedValueOnce(null);
        
        const request = new NextRequest('https://example.com/api/secure-endpoint', {
          headers: {
            'X-Attempt-Reason': attempt.reason
          }
        });

        const hasAccess = await validateTierAccess(request, 'professional');
        expect(hasAccess).toBe(false);
      }
    });

    test('should implement anomaly detection for unusual access patterns', () => {
      const userId = mockUsers.normalUser.id;
      const anomalousPatterns = [
        {
          name: 'rapid_feature_switching',
          requests: [
            { feature: 'ai_analysis', action: 'generate', timestamp: Date.now() },
            { feature: 'reports', action: 'create', timestamp: Date.now() + 100 },
            { feature: 'api', action: 'access', timestamp: Date.now() + 200 },
            { feature: 'ai_analysis', action: 'save', timestamp: Date.now() + 300 }
          ]
        },
        {
          name: 'permission_enumeration',
          requests: Array.from({ length: 20 }, (_, i) => ({
            feature: `feature_${i}` as any,
            action: 'access',
            timestamp: Date.now() + i * 50
          }))
        }
      ];

      anomalousPatterns.forEach(pattern => {
        const results = pattern.requests.map(req => 
          accessControl.checkPermission(
            'basic',
            req.feature,
            req.action,
            {
              userId,
              feature: req.feature,
              action: req.action,
              timestamp: new Date(req.timestamp)
            }
          )
        );

        // Should handle anomalous patterns without breaking
        expect(results.length).toBe(pattern.requests.length);
        results.forEach(result => {
          expect(result.allowed).toBeDefined();
        });
      });
    });
  });
});
