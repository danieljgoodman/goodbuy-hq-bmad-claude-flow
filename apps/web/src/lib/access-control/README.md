# Tier-Based Access Control System

**Story 11.10**: Complete tier-based access control system with permission checking, usage limits, and tier inheritance.

## Overview

This access control system provides comprehensive permission management across three tiers (Basic, Professional, Enterprise) with:

- **Feature-level permissions** with action-specific controls
- **Usage limits and quotas** with automatic tracking
- **Tier inheritance** with permission escalation
- **React integration** with hooks and components
- **Middleware protection** for routes and APIs
- **Real-time updates** and subscription management

## Architecture

```
src/lib/access-control/
├── permission-matrix.ts     # Permission definitions and matrices
├── tier-access-control.ts   # Core access control logic
├── middleware.ts            # Route and API protection
├── hooks.tsx               # React hooks for permissions
├── components.tsx          # UI components for tier gates
├── index.ts               # Main exports and utilities
└── __tests__/             # Comprehensive test suite
```

## Quick Start

### 1. Setup Provider

```tsx
import { TierProvider } from '@/lib/access-control';

function App() {
  return (
    <TierProvider fallbackTier="basic">
      <YourApp />
    </TierProvider>
  );
}
```

### 2. Protect Components

```tsx
import { TierGate, UpgradePrompt } from '@/lib/access-control';

function AIAnalysisPage() {
  return (
    <TierGate
      feature="ai_analysis"
      action="create"
      upgradePrompt={<UpgradePrompt feature="ai_analysis" action="create" />}
    >
      <AIAnalysisComponent />
    </TierGate>
  );
}
```

### 3. Check Permissions in Code

```tsx
import { useFeatureAccess } from '@/lib/access-control';

function ReportsComponent() {
  const { hasAccess, isLoading } = useFeatureAccess({
    feature: 'reports',
    action: 'create'
  });

  if (isLoading) return <Loading />;
  if (!hasAccess) return <UpgradePrompt />;

  return <CreateReportForm />;
}
```

### 4. Protect API Routes

```tsx
import { withAPITierProtection } from '@/lib/access-control/middleware';

export const GET = withAPITierProtection({
  feature: 'ai_analysis',
  action: 'create',
  trackUsage: true
})(async function handler(request) {
  // Your API logic here
});
```

## Tier Features (Stories 11.1-11.9)

### Basic Tier (Free)
- ✅ Basic questionnaire (view, create, edit)
- ✅ Simple dashboard (view, basic widgets)
- ✅ Basic reports (view, create, limited export)
- ✅ ROI calculator (basic calculations)
- ❌ AI analysis (blocked)
- ❌ Advanced features (blocked)

**Limits:**
- 2 evaluations per month
- 5 reports per month
- 100MB storage

### Professional Tier ($29/month)
- ✅ Everything in Basic
- ✅ AI analysis (create, insights, recommendations)
- ✅ Advanced ROI calculator (scenarios, forecasting)
- ✅ Financial trends analysis
- ✅ Enhanced dashboard (customization, alerts)
- ✅ Export and sharing capabilities
- ❌ Enterprise features (blocked)

**Limits:**
- 10 evaluations per month
- 25 reports per month
- 20 AI analyses per month
- 1GB storage

### Enterprise Tier ($99/month)
- ✅ Everything in Professional
- ✅ Scenario modeling (advanced simulations)
- ✅ Exit planning tools
- ✅ Strategic options analysis
- ✅ Admin controls (user management)
- ✅ Compliance tools (audit, reporting)
- ✅ Priority support

**Limits:**
- Unlimited everything
- Advanced admin features
- Custom integrations

## Core API

### Permission Checking

```typescript
import { checkPermission, UserTier } from '@/lib/access-control';

// Basic permission check
const result = checkPermission('professional', 'ai_analysis', 'create');
console.log(result.allowed); // true/false
console.log(result.permission); // 'read' | 'write' | 'admin' | 'none'
console.log(result.upgradeRequired); // 'enterprise' | undefined

// With usage context
const contextResult = checkPermission('basic', 'reports', 'create', {
  userId: 'user-123',
  feature: 'reports',
  action: 'create',
  timestamp: new Date()
});
```

### Tier Access

```typescript
import { hasTierAccess } from '@/lib/access-control';

// Check if user can access a tier
const canAccessPro = hasTierAccess('professional', 'professional'); // true
const canAccessEnt = hasTierAccess('basic', 'enterprise'); // false
```

### Usage Limits

```typescript
import { checkTierLimits } from '@/lib/access-control';

// Check if user is within limits
const limitResult = checkTierLimits('basic', 'maxReports', 3);
console.log(limitResult.allowed); // true (under limit of 5)

const exceedsResult = checkTierLimits('basic', 'maxReports', 6);
console.log(exceedsResult.allowed); // false
console.log(exceedsResult.upgradeRequired); // 'professional'
```

## React Hooks

### useTier()
Get current user's tier and loading state:

```tsx
const { userTier, isLoading, error, refreshTier } = useTier();
```

### useFeatureAccess()
Check feature permissions with automatic updates:

```tsx
const { hasAccess, permission, conditions, isLoading } = useFeatureAccess({
  feature: 'ai_analysis',
  action: 'create'
});
```

### useTierAccess()
Check tier-level access:

```tsx
const { hasAccess, upgradeRequired } = useTierAccess('professional');
```

### useTierLimits()
Monitor usage against limits:

```tsx
const { withinLimit, limit, upgradeRequired } = useTierLimits('maxReports', currentReportCount);
```

### useUpgradeRecommendations()
Get upgrade suggestions:

```tsx
const { recommendation } = useUpgradeRecommendations('ai_analysis', 'create');
// recommendation: { tier: 'professional', benefits: [...] }
```

## Components

### TierGate
Conditionally render content based on permissions:

```tsx
<TierGate
  feature="ai_analysis"
  action="create"
  fallback={<div>Feature not available</div>}
  upgradePrompt={<UpgradePrompt />}
>
  <AIComponent />
</TierGate>
```

### UpgradePrompt
Show upgrade prompts with benefits:

```tsx
<UpgradePrompt
  feature="ai_analysis"
  action="create"
  variant="card" // 'card' | 'banner' | 'modal' | 'inline'
  title="Unlock AI Analysis"
  benefits={['Advanced insights', 'Automated recommendations']}
/>
```

### TierBadge
Display tier information:

```tsx
<TierBadge
  tier="professional"
  size="md"
  showIcon={true}
/>
```

### UsageMeter
Show usage against limits:

```tsx
<UsageMeter
  limitType="maxReports"
  currentUsage={reportCount}
  label="Monthly Reports"
  showUpgrade={true}
/>
```

## Middleware Protection

### Route Protection

```typescript
// middleware.ts
import { withTierProtection } from '@/lib/access-control/middleware';

export const middleware = withTierProtection({
  requiredTier: 'professional',
  feature: 'ai_analysis',
  action: 'view'
});

export const config = {
  matcher: '/dashboard/ai-analysis/:path*'
};
```

### API Protection

```typescript
// app/api/reports/route.ts
import { withAPITierProtection } from '@/lib/access-control/middleware';

export const POST = withAPITierProtection({
  feature: 'reports',
  action: 'create',
  trackUsage: true,
  usageMetadata: { reportType: 'advanced' }
})(async function handler(request) {
  // Your protected API logic
  return NextResponse.json({ success: true });
});
```

## Story Feature Integration

The system includes pre-configured feature sets for each story:

```typescript
import { StoryFeatures, checkStoryFeature } from '@/lib/access-control';

// Check story-specific features
const canUseAI = checkStoryFeature('professional', 'aiAnalysis', 'create');
const canUseROI = checkStoryFeature('professional', 'roiCalculator', 'scenarios');

// Get all available features for a tier
const availableFeatures = getAvailableStoryFeatures('professional');
```

## Testing

Comprehensive test suite includes:

```bash
npm test src/lib/access-control/__tests__/tier-access-control.test.ts
```

Tests cover:
- Permission checking across all tiers
- Usage limit enforcement
- Tier inheritance
- Error handling and edge cases
- React hooks functionality
- Component rendering
- Integration scenarios

## Error Handling

The system includes robust error handling:

```typescript
// Graceful degradation
const result = checkPermission('invalid-tier', 'feature', 'action');
console.log(result.allowed); // false
console.log(result.reason); // 'Invalid tier: invalid-tier'

// Try-catch for async operations
try {
  await trackUsage(context);
} catch (error) {
  console.error('Usage tracking failed:', error.message);
  // Continue with reduced functionality
}
```

## Performance Considerations

- **Caching**: Permission checks are cached for performance
- **Batch operations**: Use `useBatchPermissions` for multiple checks
- **Async loading**: All hooks handle loading states
- **Memory management**: Usage tracking uses efficient data structures

## Migration and Upgrades

When users upgrade tiers:

```typescript
const { upgradeToTier, isUpgrading } = useSubscriptionIntegration();

// Trigger upgrade
await upgradeToTier('professional');

// System automatically:
// 1. Updates user tier in database
// 2. Refreshes permissions in UI
// 3. Unlocks new features
// 4. Resets usage limits if needed
```

## Best Practices

1. **Always use TierProvider** at the app root
2. **Prefer hooks over direct API calls** in React components
3. **Use middleware** for route/API protection
4. **Track usage** for features with limits
5. **Provide clear upgrade paths** with benefits
6. **Test permission boundaries** thoroughly
7. **Handle loading states** gracefully

## Troubleshooting

**Permission check returns false unexpectedly:**
- Verify user tier is loaded correctly
- Check permission matrix configuration
- Ensure feature/action names match exactly

**Usage limits not working:**
- Confirm `trackUsage` is called after successful actions
- Check time restriction settings (daily/weekly/monthly)
- Verify usage context includes required fields

**Components not updating after tier change:**
- Ensure `TierProvider` wraps your app
- Call `refreshTier()` after subscription changes
- Check for stale permission caches

## Integration Examples

See the test files for comprehensive integration examples covering all user flows and edge cases.

## Support

For questions or issues with the access control system, refer to:
- Test suite for usage examples
- Type definitions for API documentation
- Component stories for UI patterns