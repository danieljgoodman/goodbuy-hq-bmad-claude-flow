# Access Control System - Story 11.10

A comprehensive client-side access control system with tier-based permissions, usage tracking, and beautiful upgrade prompts.

## Overview

This system provides:
- **Tier-based access control** with Basic, Professional, and Enterprise tiers
- **Real-time permission checking** with context-aware restrictions
- **Usage tracking and limits** with automatic enforcement
- **Beautiful upgrade prompts** with feature comparisons
- **Performance optimized** with memoization and caching
- **TypeScript support** with comprehensive type definitions

## Quick Start

### 1. Protect a Component

```tsx
import { TierProtectedComponent } from '@/components/access-control';

function AdvancedFeature() {
  return (
    <TierProtectedComponent
      feature="ai_analysis"
      action="create"
      showUpgradePrompt
    >
      <button>Start AI Analysis</button>
    </TierProtectedComponent>
  );
}
```

### 2. Check Permissions in Code

```tsx
import { useTierAccess } from '@/components/access-control';

function MyComponent() {
  const { hasAccess, userTier } = useTierAccess();
  
  const canCreateReports = hasAccess('reports', 'create');
  
  return (
    <div>
      <p>Current tier: {userTier}</p>
      {canCreateReports && <button>Create Report</button>}
    </div>
  );
}
```

### 3. Show Usage Limits

```tsx
import { UsageMeter } from '@/components/access-control';

function FeatureUsage() {
  return (
    <UsageMeter
      feature="ai_analysis"
      action="create"
      variant="default"
    />
  );
}
```

### 4. Display Upgrade Prompts

```tsx
import { UpgradePrompt } from '@/components/access-control';

function UpgradeFlow() {
  const handleUpgrade = (tier) => {
    // Implement upgrade logic
    console.log('Upgrading to:', tier);
  };

  return (
    <UpgradePrompt
      variant="dialog"
      feature="reports"
      action="advanced_analytics"
      onUpgrade={handleUpgrade}
      showComparison
    />
  );
}
```

## Components

### TierProtectedComponent

Wraps content with tier-based access control.

**Props:**
- `feature`: Feature name from permission matrix
- `action`: Specific action within the feature
- `variant`: Display style ('default', 'compact', 'minimal')
- `showUpgradePrompt`: Show upgrade options when access denied
- `fallbackComponent`: Custom component for access denied state
- `hideOnNoAccess`: Hide completely if no access

**Example:**
```tsx
<TierProtectedComponent
  feature="dashboard"
  action="customize"
  variant="compact"
  showUpgradePrompt
  customAccessDeniedMessage="Upgrade to customize your dashboard"
>
  <DashboardCustomizer />
</TierProtectedComponent>
```

### UpgradePrompt

Beautiful upgrade prompts with feature comparisons.

**Variants:**
- `dialog`: Modal dialog with full comparison
- `inline`: Full-width inline component
- `banner`: Page-wide notification banner
- `compact`: Small inline prompt

**Props:**
- `variant`: Display style
- `feature`/`action`: Context for upgrade
- `showComparison`: Show tier comparison table
- `onUpgrade`: Callback when user chooses to upgrade
- `targetTier`: Specific tier to promote

### TierBadge

Displays current user tier with optional upgrade button.

**Variants:**
- `default`: Badge with optional upgrade button
- `compact`: Minimal badge display
- `detailed`: Full card with tier info

### UsageMeter

Shows usage progress against tier limits.

**Variants:**
- `default`: Full card with progress bar
- `compact`: Inline progress indicator
- `circular`: Circular progress ring

## Hooks

### useTierAccess

Main hook for access control functionality.

```tsx
const {
  userTier,           // Current user tier
  hasAccess,          // Quick permission check
  checkFeatureAccess, // Detailed permission check
  getPermissions,     // All tier permissions
  isLoading,          // Loading state
  error              // Error state
} = useTierAccess();
```

### usePermissions

Bulk permission checking for multiple features.

```tsx
const checks = [
  { feature: 'reports', action: 'create' },
  { feature: 'ai_analysis', action: 'advanced' }
];

const {
  results,      // Permission results object
  hasAnyAccess, // True if any check passes
  hasAllAccess, // True if all checks pass
  isLoading,
  error
} = usePermissions(checks);
```

### useUpgradeRecommendation

Get smart upgrade suggestions.

```tsx
const {
  recommendation, // Upgrade recommendation data
  needsUpgrade,   // Boolean if upgrade needed
  isLoading,
  error
} = useUpgradeRecommendation('ai_analysis', 'advanced');
```

### useUsageTracking

Track and monitor feature usage.

```tsx
const {
  currentUsage,     // Current usage count
  usageLimit,       // Usage limit (null if unlimited)
  usagePercentage,  // Usage as percentage
  canUse,          // Can perform action
  isAtLimit,       // At usage limit
  trackAction,     // Function to track usage
  resetUsage,      // Function to reset usage
  timeRestriction  // Time period for limits
} = useUsageTracking('reports', 'create');
```

### useSubscriptionStatus

Monitor real-time subscription changes.

```tsx
const {
  userTier,       // Current tier
  previousTier,   // Previous tier (if changed)
  hasUpgraded,    // Recently upgraded
  hasDowngraded,  // Recently downgraded
  lastUpdated,    // When tier last changed
  isLoading,
  error
} = useSubscriptionStatus();
```

### useTierLimits

Check against tier limits (storage, users, etc.).

```tsx
const {
  limits,              // All tier limits
  checkLimit,          // Check specific limit
  isWithinLimit,       // Boolean limit check
  getUsagePercentage,  // Usage as percentage
  isLoading,
  error
} = useTierLimits();
```

## Permission Matrix

The system uses a comprehensive permission matrix defining access for each tier:

```typescript
type UserTier = 'basic' | 'professional' | 'enterprise';
type Permission = 'none' | 'read' | 'write' | 'admin';

interface ConditionalPermission {
  permission: Permission;
  usageLimit?: number;
  timeRestriction?: 'daily' | 'weekly' | 'monthly';
  requiresApproval?: boolean;
  conditions?: Record<string, any>;
}
```

**Features covered:**
- `questionnaire`: Business questionnaires
- `dashboard`: Dashboard customization
- `reports`: Report generation
- `evaluations`: Business evaluations
- `ai_analysis`: AI-powered analysis
- `roi_calculator`: ROI calculations
- `financial_trends`: Financial analysis
- `scenario_modeling`: Business scenarios
- `exit_planning`: Exit strategies
- `strategic_options`: Strategic planning
- `admin`: Administrative functions
- `support`: Support features
- `api`: API access
- `integrations`: Third-party integrations
- `compliance`: Compliance tools

## Usage Patterns

### 1. Feature Gating

```tsx
// Hide feature completely for unauthorized users
<TierProtectedComponent
  feature="ai_analysis"
  action="create"
  hideOnNoAccess
>
  <AIAnalysisButton />
</TierProtectedComponent>

// Show upgrade prompt instead
<TierProtectedComponent
  feature="ai_analysis"
  action="create"
  showUpgradePrompt
>
  <AIAnalysisButton />
</TierProtectedComponent>
```

### 2. Usage Tracking

```tsx
function CreateReport() {
  const { trackAction, canUse } = useUsageTracking('reports', 'create');
  
  const handleCreate = () => {
    if (!canUse) {
      alert('Usage limit reached!');
      return;
    }
    
    // Track the action
    trackAction();
    
    // Perform the action
    createReport();
  };
  
  return <button onClick={handleCreate}>Create Report</button>;
}
```

### 3. Conditional UI

```tsx
function Dashboard() {
  const { hasAccess, userTier } = useTierAccess();
  
  const canCustomize = hasAccess('dashboard', 'customize');
  const canUseWidgets = hasAccess('dashboard', 'widgets');
  
  return (
    <div>
      <h1>Dashboard</h1>
      {canUseWidgets && <WidgetPanel />}
      {canCustomize && <CustomizationPanel />}
      {userTier === 'basic' && <UpgradePrompt variant="banner" />}
    </div>
  );
}
```

### 4. Higher-Order Component

```tsx
const ProtectedReportGenerator = withTierProtection(ReportGenerator, {
  feature: 'reports',
  action: 'advanced_analytics',
  requiredTier: 'professional'
});
```

## Best Practices

1. **Performance**: Use `hideOnNoAccess` for features that should be completely hidden
2. **User Experience**: Always provide clear upgrade paths with value propositions
3. **Usage Tracking**: Implement usage tracking for limited features
4. **Error Handling**: Handle loading and error states appropriately
5. **Caching**: The system automatically caches permissions for performance
6. **Real-time Updates**: Subscription changes are detected automatically

## Integration with Clerk

The system integrates with Clerk authentication:

```typescript
// User tier is stored in Clerk metadata
user.publicMetadata.tier // 'basic' | 'professional' | 'enterprise'
```

## Customization

You can customize the system by:

1. **Extending the permission matrix** in `permission-matrix.ts`
2. **Adding new features** to the `TierPermissions` interface
3. **Customizing tier information** in `UpgradePrompt.tsx`
4. **Styling components** with Tailwind CSS classes

## Migration Guide

To migrate existing components:

1. Wrap protected features with `TierProtectedComponent`
2. Replace manual permission checks with `useTierAccess`
3. Add usage tracking for limited features
4. Implement upgrade flows with `UpgradePrompt`

## Testing

The system includes comprehensive TypeScript types and error handling. Test different scenarios:

- Different user tiers
- Usage limit enforcement
- Real-time tier changes
- Error states
- Loading states

## Support

For questions about the access control system:
1. Check the examples in `/examples/IntegrationExamples.tsx`
2. Review the TypeScript types in `/types/access-control.ts`
3. Examine the permission matrix in `/lib/access-control/permission-matrix.ts`