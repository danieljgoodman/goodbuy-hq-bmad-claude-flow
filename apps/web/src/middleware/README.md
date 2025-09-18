# Tier Validation Middleware

This middleware provides subscription tier validation for API endpoints, integrating with the existing PremiumAccessService and auth system.

## Features

- ✅ **Backward Compatible**: Basic tier users still get limited access
- ✅ **Flexible Tier Requirements**: Support for PREMIUM and ENTERPRISE tiers
- ✅ **Data Filtering**: Automatically filters response data based on user tier
- ✅ **Multiple Auth Methods**: Works with NextAuth, query params, and request body
- ✅ **Comprehensive Error Handling**: Provides detailed upgrade information
- ✅ **Type Safe**: Full TypeScript support

## Basic Usage

### Import the Middleware

```typescript
import { TierValidationMiddleware } from '@/middleware/tier-validation'
// Or use convenience functions
import { validateEvaluationAccess } from '@/middleware'
```

### Simple Tier Validation

```typescript
export async function GET(request: NextRequest) {
  // Validate user tier
  const tierResult = await TierValidationMiddleware.validateTier(request, {
    requiredTier: 'PREMIUM',
    featureType: 'analytics',
    fallbackToBasic: true // Allow basic access even without subscription
  })

  // Get your data
  const data = await getSomeData()

  // Return filtered response based on user tier
  return TierValidationMiddleware.createTierAwareResponse(
    data,
    tierResult,
    { includeUpgradeInfo: true }
  )
}
```

### Strict Access Control

```typescript
export async function POST(request: NextRequest) {
  const tierResult = await TierValidationMiddleware.validateTier(request, {
    requiredTier: 'PREMIUM',
    featureType: 'ai_guides',
    fallbackToBasic: false // Require subscription
  })

  // Block access if user doesn't have subscription
  if (!tierResult.hasAccess) {
    return TierValidationMiddleware.createAccessDeniedResponse(
      tierResult.accessCheck,
      'Premium subscription required for AI features'
    )
  }

  // Continue with premium functionality
  const result = await generateAIGuide()
  return NextResponse.json(result)
}
```

### Using Convenience Functions

```typescript
import { validateEvaluationAccess, validateReportAccess } from '@/middleware'

export async function GET(request: NextRequest) {
  const tierResult = await validateEvaluationAccess(request)

  // Your logic here...
}
```

## Configuration Options

### TierValidationOptions

```typescript
interface TierValidationOptions {
  requiredTier?: 'PREMIUM' | 'ENTERPRISE'  // Default: 'PREMIUM'
  featureType?: 'ai_guides' | 'progress_tracking' | 'pdf_reports' | 'analytics' | 'benchmarks' | 'priority_support'  // Default: 'analytics'
  fallbackToBasic?: boolean                 // Default: true
  customErrorMessage?: string               // Custom error message for access denied
}
```

### Feature Type Tier Requirements

| Feature | Required Tier | Description |
|---------|---------------|-------------|
| `ai_guides` | PREMIUM | AI-powered implementation guides |
| `progress_tracking` | PREMIUM | Progress tracking and analytics |
| `pdf_reports` | PREMIUM | PDF report generation |
| `analytics` | PREMIUM | Advanced analytics and insights |
| `benchmarks` | ENTERPRISE | Industry benchmarking |
| `priority_support` | PREMIUM | Priority customer support |

## Data Filtering

The middleware automatically filters data based on user subscription tier:

### Free Tier Limitations

- **Evaluations**: Only basic valuation methods (revenue_multiple, asset_based)
- **Opportunities**: Limited to top 3 opportunities
- **Insights**: No market analysis, competitive positioning, or growth projections
- **Reports**: Limited to 5 sections and 3 charts
- **Analytics**: Last 30 days only, no benchmarks or predictions

### Premium/Enterprise Tiers

- Full access to all features and data
- No limitations on data depth or historical access

## Response Format

### Successful Response with Tier Info

```json
{
  "data": {
    // Filtered data based on user tier
  },
  "meta": {
    "userTier": "PREMIUM",
    "hasFullAccess": true,
    "accessLimited": false
  }
}
```

### Access Denied Response

```json
{
  "error": "Subscription upgrade required",
  "accessRequired": true,
  "reason": "Subscription required",
  "subscriptionStatus": "NONE",
  "upgradeRequired": {
    "currentTier": "FREE",
    "requiredTier": "PREMIUM",
    "benefits": [
      "AI-powered implementation guides",
      "Step-by-step instructions with templates",
      "Industry-specific recommendations"
    ],
    "ctaText": "Upgrade to Premium"
  }
}
```

## Integration Examples

### Evaluation Endpoints

The middleware is already integrated into:

- `GET /api/evaluations` - List evaluations with tier-based filtering
- `GET /api/evaluations/[id]` - Single evaluation with data filtering
- `POST /api/evaluations` - Create evaluation (allows basic tier)
- `PATCH /api/evaluations/[id]` - Update evaluation (requires premium)
- `GET /api/evaluations/all` - All evaluations with limits for free users

### Adding to New Endpoints

```typescript
// Example: New analytics endpoint
export async function GET(request: NextRequest) {
  const tierResult = await TierValidationMiddleware.validateTier(request, {
    requiredTier: 'PREMIUM',
    featureType: 'analytics',
    fallbackToBasic: true
  })

  const analytics = await getAnalyticsData()

  return TierValidationMiddleware.createTierAwareResponse(
    analytics,
    tierResult,
    { includeUpgradeInfo: true }
  )
}
```

## Authentication Integration

The middleware works with multiple authentication methods:

1. **Query Parameters**: `?userId=xxx`
2. **Request Body**: `{ "userId": "xxx" }`
3. **NextAuth Session**: Automatic session detection
4. **Custom Headers**: `x-user-email` header support

## Error Handling

The middleware provides comprehensive error handling:

- **Invalid User**: Returns user not found error
- **Database Errors**: Graceful fallback to basic access
- **Validation Errors**: Clear error messages with upgrade paths
- **Network Issues**: Maintains functionality with fallbacks

## Development Mode

In development mode (`NODE_ENV=development`), the middleware provides:

- Test user access for specific user IDs
- Database fallback when Prisma is unavailable
- Enhanced logging and debugging information
- Mock enterprise access for testing

## Best Practices

1. **Always use `fallbackToBasic: true`** for read operations
2. **Use `fallbackToBasic: false`** for write operations requiring premium
3. **Include upgrade information** in responses for better UX
4. **Filter data consistently** across all endpoints
5. **Test with different user tiers** to ensure proper access control

## Testing

Test the middleware with different user scenarios:

```typescript
// Free tier user
const freeUserRequest = new NextRequest('http://localhost/api/evaluations?userId=free-user')

// Premium user
const premiumUserRequest = new NextRequest('http://localhost/api/evaluations?userId=premium-user')

// Enterprise user
const enterpriseUserRequest = new NextRequest('http://localhost/api/evaluations?userId=enterprise-user')
```