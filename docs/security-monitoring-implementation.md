# Security Monitoring and Alerting Implementation - Story 11.10

## Overview

This implementation provides comprehensive security monitoring and alerting capabilities for the GoodBuy platform, featuring real-time threat detection, automated incident response, and detailed security analytics.

## Architecture

### Core Components

1. **SecurityMonitor** (`/lib/security/monitoring.ts`)
   - Singleton class for centralized security event management
   - Real-time pattern analysis and threat detection
   - Automated incident escalation and response
   - Integration with audit logging system

2. **SecurityAlertManager** (`/lib/security/alerts.ts`)
   - Multi-channel alert delivery (email, Slack, webhooks, SMS, PagerDuty)
   - Alert throttling and aggregation to prevent spam
   - Alert acknowledgment and resolution tracking
   - Configurable alert routing and severity thresholds

3. **SecurityMiddleware** (`/lib/security/middleware.ts`)
   - Request-level security monitoring
   - Rate limiting with configurable rules
   - Tier validation and bypass attempt detection
   - Injection attack detection and blocking

4. **SecurityDashboard** (`/components/admin/SecurityDashboard.tsx`)
   - Real-time security monitoring interface
   - Interactive charts and metrics visualization
   - Alert management and incident response tools
   - Threat intelligence display

## Features

### Threat Detection

#### Rate Limit Violations
- Configurable rate limits per endpoint
- Per-user and per-IP tracking
- Automatic IP blocking for excessive violations
- Graduated response based on violation severity

#### Tier Bypass Attempts
- Detection of unauthorized access to premium features
- Parameter manipulation detection
- Token injection monitoring
- Automatic user suspension for repeated attempts

#### Geographic Anomalies
- User location pattern learning
- Impossible travel detection
- Minimum travel time validation
- Distance-based anomaly scoring

#### Suspicious Access Patterns
- Multiple IP address monitoring
- Unusual time-based access detection
- Rapid request pattern analysis
- Cross-session correlation

#### Injection Attacks
- SQL injection pattern detection
- XSS attempt monitoring
- JavaScript injection blocking
- Real-time content analysis

### Alert System

#### Multi-Channel Delivery
```typescript
// Email alerts with HTML templates
{
  type: 'email',
  config: {
    to: ['security@company.com'],
    template: 'security_alert'
  }
}

// Slack integration
{
  type: 'slack',
  config: {
    webhookUrl: 'https://hooks.slack.com/...',
    channel: '#security-alerts'
  }
}

// Custom webhooks
{
  type: 'webhook',
  config: {
    url: 'https://api.company.com/security',
    retries: 3,
    timeout: 5000
  }
}
```

#### Alert Aggregation
- Time-based alert grouping
- Duplicate alert suppression
- Severity-based prioritization
- Configurable throttling rules

### Real-Time Monitoring

#### Dashboard Features
- Live security metrics
- Interactive threat visualization
- Alert management interface
- Incident timeline tracking
- Threat intelligence integration

#### Performance Metrics
- Events by type and severity
- Geographic threat distribution
- Time-based trend analysis
- System health monitoring

## API Endpoints

### Security Dashboard
```
GET /api/admin/security/dashboard?timeRange=24h
```
Returns comprehensive security data including metrics, events, alerts, and threats.

### Alert Management
```
POST /api/admin/security/alerts/{alertId}/acknowledge
POST /api/admin/security/alerts/{alertId}/resolve
```
Alert acknowledgment and resolution endpoints.

## Configuration

### Rate Limiting Rules
```typescript
const rateLimitRules = {
  '/api/': { requests: 100, windowMs: 60000 },
  '/api/analysis/': { requests: 10, windowMs: 60000 },
  '/api/reports/': { requests: 20, windowMs: 60000 },
  '/api/auth/': { requests: 5, windowMs: 300000 }
};
```

### Security Patterns
```typescript
{
  id: 'tier_bypass_pattern',
  name: 'Tier Bypass Attempts',
  type: SecurityEventType.TIER_BYPASS_ATTEMPT,
  threshold: 3,
  timeWindow: 60, // minutes
  severity: SecuritySeverity.HIGH,
  actions: [
    { type: 'alert', config: { message: 'Multiple tier bypass attempts' } },
    { type: 'suspend_user', config: { reason: 'Security violation' } }
  ]
}
```

## Integration Points

### Middleware Integration
Security middleware is integrated into the Next.js middleware stack via the `beforeAuth` hook:

```typescript
// middleware.ts
async beforeAuth(request: NextRequest) {
  const securityResponse = await withSecurity(request);
  if (securityResponse) {
    return securityResponse; // Blocked by security
  }
  return undefined; // Continue
}
```

### Audit Logging Integration
All security events are automatically logged to the existing audit system:

```typescript
await createAuditLog({
  userId: event.userId || 'system',
  action: 'SECURITY_EVENT',
  entityType: 'SECURITY',
  entityId: event.id,
  metadata: {
    eventType: event.type,
    severity: event.severity
  }
});
```

## Usage Examples

### Recording Security Events
```typescript
import { securityMonitor } from '@/lib/security/monitoring';

// Record a rate limit violation
await securityMonitor.detectRateLimitViolation(
  'user_123',
  '/api/analysis',
  25, // current rate
  10, // allowed rate
  60000, // window size
  'user_123',
  '192.168.1.100'
);

// Record a tier bypass attempt
await securityMonitor.detectTierBypassAttempt(
  'user_456',
  'basic',
  'professional',
  '/api/reports/advanced',
  'direct_access',
  '10.0.0.1',
  'Mozilla/5.0...'
);
```

### Configuring Alerts
```typescript
import { SecurityAlertManager } from '@/lib/security/alerts';

const alertManager = SecurityAlertManager.getInstance();

alertManager.createAlertConfig({
  id: 'critical_alerts',
  name: 'Critical Security Alerts',
  eventTypes: [SecurityEventType.TIER_BYPASS_ATTEMPT],
  severityThreshold: SecuritySeverity.HIGH,
  channels: [
    {
      type: 'email',
      enabled: true,
      config: { to: ['security@company.com'] }
    }
  ],
  enabled: true,
  throttle: { enabled: false, maxAlerts: 0, timeWindow: 0 },
  aggregation: { enabled: false, groupBy: [], timeWindow: 0 }
});
```

### Dashboard Integration
```typescript
import { useSecurityDashboard } from '@/lib/security/hooks';

function SecurityPage() {
  const { data, loading, error, refresh } = useSecurityDashboard(30000);

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage error={error} />;

  return <SecurityDashboard data={data} onRefresh={refresh} />;
}
```

## Security Considerations

### Data Protection
- All security events contain minimal sensitive data
- IP addresses are logged but can be anonymized
- User IDs are referenced but not exposed in alerts
- Audit trails maintain data integrity

### Performance Optimization
- In-memory caching for hot path operations
- Background cleanup tasks for data retention
- Configurable rate limiting to prevent DoS
- Efficient pattern matching algorithms

### Monitoring Coverage
- All API endpoints protected by rate limiting
- Tier validation on protected routes
- Geographic anomaly detection for all users
- Injection attack prevention on all inputs

## Future Enhancements

### Planned Features
1. Machine learning-based anomaly detection
2. Advanced behavioral analytics
3. Integration with external threat intelligence feeds
4. Automated incident response playbooks
5. Advanced forensic analysis tools

### Scalability Improvements
1. Distributed event processing
2. Time-series database integration
3. Advanced caching strategies
4. Microservice architecture support

## Testing

### Security Event Testing
```typescript
// Test rate limit detection
await securityMonitor.detectRateLimitViolation(
  'test_user',
  '/api/test',
  15,
  10,
  60000
);

// Verify event was recorded
const events = securityMonitor.getRecentEvents(1);
expect(events[0].type).toBe(SecurityEventType.RATE_LIMIT_VIOLATION);
```

### Alert Testing
```typescript
// Test alert delivery
const alert = await alertManager.sendAlert({
  eventId: 'test_event',
  type: SecurityEventType.TIER_BYPASS_ATTEMPT,
  severity: SecuritySeverity.HIGH,
  title: 'Test Alert',
  message: 'This is a test alert'
});

expect(alert.id).toBeDefined();
```

## Maintenance

### Regular Tasks
1. Review and update security patterns monthly
2. Analyze false positive rates and adjust thresholds
3. Update threat intelligence data weekly
4. Review alert configurations quarterly
5. Conduct security event analysis monthly

### Performance Monitoring
1. Monitor memory usage of security components
2. Track alert delivery latency
3. Measure security middleware overhead
4. Analyze event processing performance

This implementation provides a robust foundation for security monitoring while maintaining flexibility for future enhancements and scaling requirements.