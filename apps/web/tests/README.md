# Test Suite for Subscription-Based Routing Middleware

This test suite provides comprehensive coverage for Story 11.2: Subscription-Based Routing Middleware implementation.

## Test Structure

### 1. Unit Tests

#### `/src/lib/subscription/__tests__/tier-utils.test.ts`
- **Purpose**: Tests tier detection logic and utilities
- **Coverage**:
  - Tier detection from Clerk, Stripe, and database
  - Caching mechanisms and performance optimization
  - Error handling and fallback scenarios
  - Subscription lifecycle management
  - Performance requirements (<100ms)
- **Key Features Tested**:
  - Multi-source tier detection (Clerk → Stripe → Database → Fallback)
  - Cache management with size limits and expiration
  - Stripe price ID to tier mapping
  - Subscription status validation
  - Bulk tier updates
  - Performance metrics collection

#### `/src/lib/routing/__tests__/tier-routes.test.ts`
- **Purpose**: Tests routing decision logic and access control
- **Coverage**:
  - Route pattern matching (exact vs prefix)
  - Tier-based access control across all subscription levels
  - Feature-based routing restrictions
  - Navigation generation for different tiers
  - Route configuration validation
- **Key Features Tested**:
  - Public vs authenticated vs tier-protected routes
  - Routing decisions for BASIC → PROFESSIONAL → ENTERPRISE tiers
  - Feature access validation and missing feature detection
  - Dashboard routing based on user tier
  - Fallback route configuration
  - Performance optimization for route matching

### 2. Integration Tests

#### `/tests/middleware/__tests__/tier-middleware.test.ts`
- **Purpose**: Tests middleware integration and request processing
- **Coverage**:
  - Request validation and user extraction
  - Tier validation workflow
  - Data filtering based on subscription tier
  - Response generation with tier information
  - Error handling and graceful degradation
- **Key Features Tested**:
  - User ID extraction from multiple sources (body, query, headers)
  - Premium access service integration
  - Data filtering for different subscription tiers
  - Middleware function creation and chaining
  - Access denied response generation
  - Concurrent request handling

#### `/tests/integration/stripe-webhooks.test.ts`
- **Purpose**: Tests Stripe webhook processing and subscription lifecycle
- **Coverage**:
  - Webhook event processing for all subscription events
  - Tier updates via Clerk integration
  - Payment processing and status changes
  - Security validation and idempotency
  - Error handling and retry scenarios
- **Key Features Tested**:
  - Subscription creation, updates, and cancellation
  - Trial period management
  - Payment success/failure handling
  - Customer management
  - Webhook signature validation
  - High-volume concurrent webhook processing

### 3. End-to-End Tests

#### `/tests/e2e/tier-routing.spec.ts`
- **Purpose**: Tests complete user flows and real browser interactions
- **Coverage**:
  - Authentication and authorization flows
  - Tier-based navigation and access control
  - Real-time subscription status changes
  - Performance validation
  - Security boundary testing
- **Key Features Tested**:
  - User login and tier assignment
  - Navigation between tier-specific features
  - API endpoint access control
  - Data filtering in UI
  - Upgrade prompts and redirects
  - Session management across tier changes

## Test Coverage Goals

### Functional Coverage
- ✅ **Tier Detection**: All source types (Clerk, Stripe, Database, Fallback)
- ✅ **Routing Logic**: All route types and tier combinations
- ✅ **Access Control**: Feature-based and tier-based restrictions
- ✅ **Data Filtering**: Content limitation by subscription tier
- ✅ **Subscription Lifecycle**: Creation, updates, cancellation, trials

### Performance Coverage
- ✅ **Speed Requirements**: <100ms tier detection requirement
- ✅ **Caching**: Cache hit/miss scenarios and cleanup
- ✅ **Concurrency**: Multiple simultaneous requests
- ✅ **Scalability**: High-volume webhook processing

### Security Coverage
- ✅ **Access Boundaries**: Unauthorized access prevention
- ✅ **Webhook Security**: Signature validation and replay protection
- ✅ **Session Security**: Authentication state management
- ✅ **API Security**: Endpoint access control

### Error Handling Coverage
- ✅ **Network Failures**: External service unavailability
- ✅ **Data Corruption**: Invalid or malformed data
- ✅ **Authentication Errors**: Invalid or expired sessions
- ✅ **Graceful Degradation**: Fallback behaviors

## Running Tests

### All Tests
```bash
npm test
```

### Specific Test Suites
```bash
# Unit tests
npm test -- --run src/lib/routing/__tests__/tier-routes.test.ts
npm test -- --run src/lib/subscription/__tests__/tier-utils.test.ts

# Integration tests
npm test -- --run tests/middleware/__tests__/tier-middleware.test.ts
npm test -- --run tests/integration/stripe-webhooks.test.ts

# E2E tests (requires Playwright)
npx playwright test tests/e2e/tier-routing.spec.ts
```

### Coverage Report
```bash
npm run test:coverage
```

## Test Data and Mocking

### Mock Users
- **Basic User**: `basic@test.com` - BASIC tier access
- **Professional User**: `professional@test.com` - PROFESSIONAL tier access
- **Enterprise User**: `enterprise@test.com` - ENTERPRISE tier access

### Mock Stripe Data
- **Price IDs**: Mapped to specific subscription tiers
- **Webhook Events**: Complete lifecycle event simulation
- **Customer Data**: Linked to Clerk user metadata

### Mock Clerk Data
- **User Metadata**: Subscription tier and feature information
- **API Responses**: Simulated for various scenarios

## Performance Benchmarks

- **Tier Detection**: <100ms (requirement met)
- **Route Decision**: <10ms per request
- **Data Filtering**: <50ms for typical datasets
- **Webhook Processing**: <200ms per event

## Security Validations

- **Authentication**: All protected routes require valid sessions
- **Authorization**: Tier-based access strictly enforced
- **Data Isolation**: Users only see data appropriate for their tier
- **Webhook Security**: All webhooks validated with Stripe signatures

## Maintenance

### Adding New Tiers
1. Update `TIER_FEATURES` and `TIER_HIERARCHY` in types
2. Add routing tests for new tier in `tier-routes.test.ts`
3. Update E2E tests with new user type
4. Add Stripe price mappings in webhook tests

### Adding New Features
1. Add feature to appropriate tier in `TIER_FEATURES`
2. Create route configuration in `TIER_PROTECTED_ROUTES`
3. Add tests for feature access control
4. Update data filtering logic if needed

### Performance Monitoring
- Monitor test execution times
- Update performance benchmarks as requirements change
- Add new performance tests for scaling scenarios