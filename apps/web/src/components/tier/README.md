# Subscription Tier Components

This directory contains React components for implementing subscription-based UI features with non-intrusive upgrade prompts and tier-based access control.

## Components Overview

### Core Components

1. **`useSubscriptionTier` Hook** - Central hook for tier management
2. **`TierBadge`** - Display user's current subscription tier
3. **`UpgradePrompt`** - Various upgrade prompt styles
4. **`TierFilteredNav`** - Navigation with tier-based filtering
5. **`TierGuard`** - Conditional rendering based on tier access

## Quick Start

```tsx
import {
  useSubscriptionTier,
  TierBadge,
  UpgradePrompt,
  TierGuard,
  AnalyticsGuard
} from '@/components/tier'

function MyComponent() {
  const { currentTier, hasAnalytics } = useSubscriptionTier()

  return (
    <div>
      {/* Show current tier */}
      <TierBadge />

      {/* Guard premium content */}
      <AnalyticsGuard blurContent>
        <AnalyticsDashboard />
      </AnalyticsGuard>

      {/* Manual upgrade prompt */}
      <UpgradePrompt feature="analytics" />
    </div>
  )
}
```

## Integration Patterns

### 1. Navigation Integration

The navigation automatically shows upgrade prompts when users click restricted features:

```tsx
// Automatically integrated in main navbar
<TierFilteredNav
  triggerLabel="Features"
  showUpgradePrompts={true}
/>
```

### 2. Feature Guards

Protect content based on subscription tier:

```tsx
// Blur content for non-premium users
<AnalyticsGuard blurContent>
  <AnalyticsDashboard />
</AnalyticsGuard>

// Completely hide content
<TierGuard feature="benchmarks" restrictContent>
  <BenchmarkingChart />
</TierGuard>

// Show with overlay
<ProgressTrackingGuard>
  <ProgressChart />
</ProgressTrackingGuard>
```

### 3. Upgrade Prompts

Multiple styles available:

```tsx
// Dialog prompt
<UpgradePrompt
  feature="analytics"
  trigger={<Button>View Analytics</Button>}
/>

// Inline card
<UpgradePrompt
  feature="pdf_reports"
  variant="card"
/>

// Simple inline
<UpgradePrompt
  feature="progress_tracking"
  variant="inline"
/>
```

## Feature Configuration

Features are mapped to required tiers:

- **Premium Features**: `analytics`, `progress_tracking`, `pdf_reports`, `ai_guides`, `priority_support`
- **Enterprise Features**: `benchmarks`, `custom_branding`, `api_access`

## Tier Detection

The system integrates with:
- Real tier validation API (`/api/premium/check-access`)
- Clerk user metadata
- Fallback to local tier hierarchy checks
- Caching for performance (5-minute cache)

## Styling

Components use ShadCN UI design system:
- Consistent with existing design
- Responsive layouts
- Accessible components
- Professional styling

## Non-Intrusive Philosophy

- Show content with upgrade overlays rather than hiding completely
- Clear tier requirements with badges
- Professional upgrade messaging
- Smooth user experience transitions

## Examples

See `src/components/examples/tier-component-examples.tsx` for comprehensive usage examples.