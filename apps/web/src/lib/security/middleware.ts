import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';
import { securityMonitor } from './monitoring';
import { SecurityEventType, SecuritySeverity } from '@/types/security';

interface SecurityMiddlewareConfig {
  enableRateLimiting: boolean;
  enableTierValidation: boolean;
  enableGeolocationTracking: boolean;
  enableSuspiciousActivityDetection: boolean;
  rateLimitRules: {
    [endpoint: string]: {
      requests: number;
      windowMs: number;
    };
  };
}

const defaultConfig: SecurityMiddlewareConfig = {
  enableRateLimiting: true,
  enableTierValidation: true,
  enableGeolocationTracking: true,
  enableSuspiciousActivityDetection: true,
  rateLimitRules: {
    '/api/': { requests: 100, windowMs: 60000 }, // 100 requests per minute
    '/api/analysis/': { requests: 10, windowMs: 60000 }, // 10 analysis requests per minute
    '/api/reports/': { requests: 20, windowMs: 60000 }, // 20 report requests per minute
    '/api/auth/': { requests: 5, windowMs: 300000 }, // 5 auth requests per 5 minutes
  }
};

class SecurityMiddleware {
  private config: SecurityMiddlewareConfig;
  private rateLimitStore: Map<string, { count: number; resetTime: number }> = new Map();
  private suspiciousIPs: Set<string> = new Set();
  private userSessions: Map<string, { ipAddresses: Set<string>; lastActivity: Date }> = new Map();

  constructor(config: SecurityMiddlewareConfig = defaultConfig) {
    this.config = config;
    this.startCleanupTasks();
  }

  /**
   * Main middleware function
   */
  public async process(request: NextRequest): Promise<NextResponse | null> {
    const startTime = Date.now();
    const ipAddress = this.getClientIP(request);
    const userAgent = request.headers.get('user-agent') || '';
    const pathname = request.nextUrl.pathname;

    try {
      // Check if IP is blocked
      if (securityMonitor.isIPBlocked(ipAddress)) {
        await securityMonitor.recordEvent({
          type: SecurityEventType.API_ABUSE,
          severity: SecuritySeverity.HIGH,
          ipAddress,
          userAgent,
          details: {
            reason: 'blocked_ip_access_attempt',
            endpoint: pathname,
            method: request.method
          }
        });

        return new NextResponse('Forbidden', { status: 403 });
      }

      // Get user info
      const { userId } = auth();

      // Check if user is suspended
      if (userId && securityMonitor.isUserSuspended(userId)) {
        await securityMonitor.recordEvent({
          type: SecurityEventType.API_ABUSE,
          severity: SecuritySeverity.HIGH,
          userId,
          ipAddress,
          userAgent,
          details: {
            reason: 'suspended_user_access_attempt',
            endpoint: pathname,
            method: request.method
          }
        });

        return new NextResponse('Account Suspended', { status: 403 });
      }

      // Rate limiting
      if (this.config.enableRateLimiting) {
        const rateLimitResult = await this.checkRateLimit(request, userId, ipAddress);
        if (rateLimitResult) {
          return rateLimitResult;
        }
      }

      // Tier validation for protected endpoints
      if (this.config.enableTierValidation && userId) {
        const tierValidationResult = await this.validateTierAccess(request, userId, ipAddress, userAgent);
        if (tierValidationResult) {
          return tierValidationResult;
        }
      }

      // Geolocation tracking
      if (this.config.enableGeolocationTracking && userId) {
        await this.trackGeolocation(request, userId, ipAddress, userAgent);
      }

      // Suspicious activity detection
      if (this.config.enableSuspiciousActivityDetection) {
        await this.detectSuspiciousActivity(request, userId, ipAddress, userAgent);
      }

      // Log successful access
      const processingTime = Date.now() - startTime;
      if (processingTime > 1000) { // Log slow requests
        await securityMonitor.recordEvent({
          type: SecurityEventType.UNUSUAL_ACCESS_PATTERN,
          severity: SecuritySeverity.LOW,
          userId,
          ipAddress,
          userAgent,
          details: {
            reason: 'slow_request_processing',
            endpoint: pathname,
            method: request.method,
            processingTime
          }
        });
      }

      return null; // Continue to next middleware/handler
    } catch (error) {
      console.error('Security middleware error:', error);

      // Log the error
      await securityMonitor.recordEvent({
        type: SecurityEventType.API_ABUSE,
        severity: SecuritySeverity.MEDIUM,
        userId,
        ipAddress,
        userAgent,
        details: {
          reason: 'middleware_error',
          error: error instanceof Error ? error.message : 'Unknown error',
          endpoint: pathname,
          method: request.method
        }
      });

      return null; // Continue despite error
    }
  }

  /**
   * Check rate limits
   */
  private async checkRateLimit(
    request: NextRequest,
    userId: string | null,
    ipAddress: string
  ): Promise<NextResponse | null> {
    const pathname = request.nextUrl.pathname;
    const method = request.method;

    // Find matching rate limit rule
    const rule = this.findRateLimitRule(pathname);
    if (!rule) return null;

    // Create rate limit key (prefer user ID, fallback to IP)
    const identifier = userId || ipAddress;
    const key = `${identifier}_${pathname}_${method}`;

    const now = Date.now();
    const existing = this.rateLimitStore.get(key);

    if (existing && now < existing.resetTime) {
      if (existing.count >= rule.requests) {
        // Rate limit exceeded
        await securityMonitor.detectRateLimitViolation(
          identifier,
          pathname,
          existing.count + 1,
          rule.requests,
          rule.windowMs,
          userId || undefined,
          ipAddress
        );

        return new NextResponse('Rate limit exceeded', {
          status: 429,
          headers: {
            'X-RateLimit-Limit': rule.requests.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': existing.resetTime.toString(),
            'Retry-After': Math.ceil((existing.resetTime - now) / 1000).toString()
          }
        });
      }

      // Increment counter
      existing.count++;
    } else {
      // Reset or create new counter
      this.rateLimitStore.set(key, {
        count: 1,
        resetTime: now + rule.windowMs
      });
    }

    return null;
  }

  /**
   * Validate tier access
   */
  private async validateTierAccess(
    request: NextRequest,
    userId: string,
    ipAddress: string,
    userAgent: string
  ): Promise<NextResponse | null> {
    const pathname = request.nextUrl.pathname;

    // Get user tier (this would come from your user service)
    const userTier = await this.getUserTier(userId);
    const requiredTier = this.getRequiredTier(pathname);

    if (!this.hasAccess(userTier, requiredTier)) {
      // Check for bypass attempts
      const searchParams = request.nextUrl.searchParams;
      const suspiciousParams = ['admin', 'tier', 'upgrade', 'bypass'];
      const hasSuspiciousParams = suspiciousParams.some(param => searchParams.has(param));

      if (hasSuspiciousParams) {
        await securityMonitor.detectTierBypassAttempt(
          userId,
          userTier,
          requiredTier,
          pathname,
          'parameter_manipulation',
          ipAddress,
          userAgent
        );
      } else {
        await securityMonitor.detectTierBypassAttempt(
          userId,
          userTier,
          requiredTier,
          pathname,
          'direct_access',
          ipAddress,
          userAgent
        );
      }

      return new NextResponse('Insufficient tier access', { status: 403 });
    }

    return null;
  }

  /**
   * Track geolocation and detect anomalies
   */
  private async trackGeolocation(
    request: NextRequest,
    userId: string,
    ipAddress: string,
    userAgent: string
  ): Promise<void> {
    try {
      // Get geolocation from IP (this would use a geolocation service)
      const location = await this.getGeolocation(ipAddress);

      if (location) {
        await securityMonitor.detectGeographicAnomaly(
          userId,
          location,
          ipAddress,
          userAgent
        );
      }
    } catch (error) {
      console.error('Geolocation tracking error:', error);
    }
  }

  /**
   * Detect suspicious activity patterns
   */
  private async detectSuspiciousActivity(
    request: NextRequest,
    userId: string | null,
    ipAddress: string,
    userAgent: string
  ): Promise<void> {
    const pathname = request.nextUrl.pathname;

    // Track user sessions for multiple IP detection
    if (userId) {
      const session = this.userSessions.get(userId);
      if (session) {
        session.ipAddresses.add(ipAddress);
        session.lastActivity = new Date();

        // Check for multiple IPs in short time
        if (session.ipAddresses.size > 3) {
          const accessedFeatures = [pathname];
          await securityMonitor.detectUnusualAccessPattern(
            userId,
            ipAddress,
            userAgent,
            accessedFeatures
          );
        }
      } else {
        this.userSessions.set(userId, {
          ipAddresses: new Set([ipAddress]),
          lastActivity: new Date()
        });
      }
    }

    // Detect rapid requests from same IP
    const ipKey = `rapid_${ipAddress}`;
    const rapidRequests = this.rateLimitStore.get(ipKey);
    const now = Date.now();

    if (rapidRequests && now < rapidRequests.resetTime) {
      rapidRequests.count++;

      if (rapidRequests.count > 50) { // More than 50 requests in 1 minute
        this.suspiciousIPs.add(ipAddress);

        await securityMonitor.recordEvent({
          type: SecurityEventType.UNUSUAL_ACCESS_PATTERN,
          severity: SecuritySeverity.MEDIUM,
          userId,
          ipAddress,
          userAgent,
          details: {
            pattern: 'rapid_requests',
            requestCount: rapidRequests.count,
            timeWindow: '1m',
            endpoint: pathname
          }
        });
      }
    } else {
      this.rateLimitStore.set(ipKey, {
        count: 1,
        resetTime: now + 60000 // 1 minute window
      });
    }

    // Check for injection attempts
    const queryString = request.nextUrl.search;
    const body = request.method === 'POST' ? await this.getRequestBody(request) : '';

    if (this.detectInjectionAttempt(queryString) || this.detectInjectionAttempt(body)) {
      await securityMonitor.recordEvent({
        type: SecurityEventType.INJECTION_ATTEMPT,
        severity: SecuritySeverity.HIGH,
        userId,
        ipAddress,
        userAgent,
        details: {
          endpoint: pathname,
          method: request.method,
          queryString,
          suspicious_content: true
        }
      });

      // Block IP for injection attempts
      securityMonitor.blockIP(ipAddress, 'Injection attempt detected');
    }
  }

  /**
   * Helper methods
   */
  private getClientIP(request: NextRequest): string {
    const forwarded = request.headers.get('x-forwarded-for');
    const realIP = request.headers.get('x-real-ip');
    const clientIP = request.headers.get('x-client-ip');

    if (forwarded) {
      return forwarded.split(',')[0].trim();
    }

    return realIP || clientIP || 'unknown';
  }

  private findRateLimitRule(pathname: string): { requests: number; windowMs: number } | null {
    // Find the most specific matching rule
    const sortedRules = Object.entries(this.config.rateLimitRules)
      .sort(([a], [b]) => b.length - a.length); // Sort by specificity

    for (const [pattern, rule] of sortedRules) {
      if (pathname.startsWith(pattern)) {
        return rule;
      }
    }

    return null;
  }

  private async getUserTier(userId: string): Promise<string> {
    // TODO: Implement actual user tier lookup
    // This would query your user service/database
    return 'basic'; // Placeholder
  }

  private getRequiredTier(pathname: string): string {
    // Define tier requirements for different endpoints
    if (pathname.startsWith('/api/reports/enterprise')) return 'enterprise';
    if (pathname.startsWith('/api/analysis/advanced')) return 'professional';
    if (pathname.startsWith('/api/admin')) return 'admin';

    return 'basic';
  }

  private hasAccess(userTier: string, requiredTier: string): boolean {
    const tierLevels = {
      'basic': 1,
      'professional': 2,
      'enterprise': 3,
      'admin': 4
    };

    return (tierLevels[userTier] || 0) >= (tierLevels[requiredTier] || 0);
  }

  private async getGeolocation(ipAddress: string): Promise<{
    country: string;
    region: string;
    city: string;
    latitude?: number;
    longitude?: number;
  } | null> {
    // TODO: Implement actual geolocation service
    // This would use a service like MaxMind, IPGeolocation, etc.
    return null; // Placeholder
  }

  private async getRequestBody(request: NextRequest): Promise<string> {
    try {
      // Clone the request to avoid consuming the body
      const cloned = request.clone();
      const text = await cloned.text();
      return text;
    } catch {
      return '';
    }
  }

  private detectInjectionAttempt(content: string): boolean {
    const injectionPatterns = [
      /['"]\s*(or|and)\s*['"]\s*=\s*['"]/i, // SQL injection
      /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, // XSS
      /javascript:/i, // JavaScript injection
      /on\w+\s*=/i, // Event handler injection
      /union\s+select/i, // SQL UNION injection
      /drop\s+table/i, // SQL DROP injection
    ];

    return injectionPatterns.some(pattern => pattern.test(content));
  }

  private startCleanupTasks(): void {
    // Clean up rate limit store every 10 minutes
    setInterval(() => {
      const now = Date.now();
      for (const [key, data] of this.rateLimitStore.entries()) {
        if (now >= data.resetTime) {
          this.rateLimitStore.delete(key);
        }
      }
    }, 10 * 60 * 1000);

    // Clean up user sessions every hour
    setInterval(() => {
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      for (const [userId, session] of this.userSessions.entries()) {
        if (session.lastActivity < oneHourAgo) {
          this.userSessions.delete(userId);
        }
      }
    }, 60 * 60 * 1000);

    // Clean up suspicious IPs every 24 hours
    setInterval(() => {
      this.suspiciousIPs.clear();
    }, 24 * 60 * 60 * 1000);
  }
}

// Export singleton instance
export const securityMiddleware = new SecurityMiddleware();

// Export middleware function for Next.js
export async function withSecurity(request: NextRequest): Promise<NextResponse | null> {
  return securityMiddleware.process(request);
}