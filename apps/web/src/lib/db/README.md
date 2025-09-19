# Enterprise Database Integration Layer

## Overview

This directory contains the comprehensive database integration layer for the Enterprise dashboard, providing robust data access, API routes, custom hooks, and error handling for Enterprise-tier business evaluations.

## Architecture

```
├── enterprise-queries.ts          # Core database query functions
├── ../api/enterprise-dashboard.ts # API layer with endpoint handlers
├── ../hooks/useEnterpriseData.ts  # React hooks with caching & real-time sync
├── ../types/enterprise-dashboard.ts # TypeScript interfaces
└── ../utils/enterprise-error-handling.ts # Error handling utilities
```

## Core Components

### 1. Database Queries (`enterprise-queries.ts`)

**Functions:**
- `getEnterpriseMetrics()` - Comprehensive business metrics
- `getStrategicScenarios()` - Strategic scenario modeling
- `getExitStrategyOptions()` - Exit strategy analysis
- `getCapitalStructureData()` - Capital structure optimization
- `getFinancialProjections()` - Multi-year financial projections
- `getStrategicOptions()` - Strategic growth options
- `saveScenarioConfiguration()` - Scenario persistence
- `loadScenarioConfiguration()` - Scenario retrieval

**Features:**
- ✅ Prisma ORM integration
- ✅ Data encryption/decryption
- ✅ Compression for large datasets
- ✅ Mock data fallbacks for development
- ✅ Comprehensive error handling
- ✅ Performance optimization

### 2. API Routes (`../api/enterprise-dashboard.ts`)

**Endpoints:**
- `GET /api/enterprise/dashboard` - Main dashboard data
- `GET /api/enterprise/scenarios` - Strategic scenarios
- `POST /api/enterprise/scenarios` - Save scenario
- `GET /api/enterprise/exit-strategies` - Exit strategy options
- `GET /api/enterprise/capital-structure` - Capital structure data
- `GET /api/enterprise/projections` - Financial projections
- `GET /api/enterprise/options` - Strategic options

**Security Features:**
- ✅ Authentication & authorization
- ✅ Enterprise tier validation
- ✅ Data access permissions
- ✅ Audit logging
- ✅ Security event monitoring
- ✅ Input validation with Zod

### 3. React Hooks (`../hooks/useEnterpriseData.ts`)

**Main Hook: `useEnterpriseData()`**
- Comprehensive data fetching
- React Query integration for caching
- Real-time synchronization
- Optimistic updates
- Error state management
- Loading state handling

**Specialized Hooks:**
- `useEnterpriseMetrics()` - Metrics only
- `useStrategicScenarios()` - Scenarios with save functionality
- `useFinancialProjections()` - Projections only
- `useRealTimeEnterpriseData()` - Real-time updates
- `useOptimisticEnterpriseData()` - Optimistic UI updates

**Features:**
- ✅ React Query caching (5-15 min stale time)
- ✅ Automatic retries with exponential backoff
- ✅ Real-time connection monitoring
- ✅ Optimistic mutations
- ✅ Background refetching
- ✅ Error boundary integration

### 4. TypeScript Interfaces (`../types/enterprise-dashboard.ts`)

**Core Types:**
- `EnterpriseMetrics` - Business performance metrics
- `StrategicScenario` - Scenario modeling data
- `FinancialProjections` - Multi-year forecasts
- `CapitalStructureData` - Capital optimization
- `ExitStrategyOption` - Exit strategy analysis
- `StrategicOptions` - Growth opportunities

**API Types:**
- `DashboardData` - Aggregated dashboard data
- `ApiResponse<T>` - Standardized API responses
- `ScenarioSaveData` - Scenario persistence format

**Advanced Types:**
- Chart and visualization data types
- Risk assessment interfaces
- Performance benchmarking types
- Valuation method definitions
- Tax optimization structures
- Audit and compliance types

### 5. Error Handling (`../utils/enterprise-error-handling.ts`)

**Error Types:**
- Authentication & Authorization errors
- Validation & Input errors
- Database & Transaction errors
- Business Rule violations
- External Service failures
- Performance & Rate limiting

**Features:**
- ✅ Structured error codes
- ✅ Comprehensive error context
- ✅ Automatic error categorization
- ✅ Retry mechanisms with backoff
- ✅ Circuit breaker pattern
- ✅ Performance monitoring
- ✅ Security event logging

## Usage Examples

### 1. Basic Data Fetching

```typescript
import { useEnterpriseData } from '@/hooks/useEnterpriseData';

function EnterpriseDashboard({ evaluationId }: { evaluationId: string }) {
  const {
    dashboardData,
    scenarios,
    isLoading,
    error,
    refetch
  } = useEnterpriseData({
    evaluationId,
    enableRealTime: true,
    refreshInterval: 30000
  });

  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorBoundary error={error} />;

  return (
    <div>
      <MetricsPanel metrics={dashboardData?.metrics} />
      <ScenariosChart scenarios={scenarios} />
    </div>
  );
}
```

### 2. Saving Scenarios with Optimistic Updates

```typescript
import { useOptimisticEnterpriseData } from '@/hooks/useEnterpriseData';

function ScenarioBuilder({ evaluationId }: { evaluationId: string }) {
  const { saveScenario, scenarios } = useOptimisticEnterpriseData(evaluationId);

  const handleSave = async (scenarioData: ScenarioSaveData) => {
    // UI updates optimistically before API call completes
    const success = await saveScenario(scenarioData);

    if (success) {
      toast.success('Scenario saved successfully');
    } else {
      toast.error('Failed to save scenario');
    }
  };

  return <ScenarioForm onSave={handleSave} />;
}
```

### 3. API Route Implementation

```typescript
// app/api/enterprise/dashboard/route.ts
import { NextRequest } from 'next/server';
import { getDashboardData } from '@/lib/api/enterprise-dashboard';

export async function GET(req: NextRequest) {
  return getDashboardData(req);
}
```

### 4. Direct Database Queries

```typescript
import { getEnterpriseMetrics } from '@/lib/db/enterprise-queries';

async function fetchMetrics(evaluationId: string, userId: string) {
  try {
    const metrics = await getEnterpriseMetrics(evaluationId, userId);
    return metrics;
  } catch (error) {
    console.error('Failed to fetch metrics:', error);
    return null;
  }
}
```

## Security & Compliance

### Data Protection
- **Encryption**: Sensitive Enterprise data encrypted at rest
- **Access Control**: Enterprise tier validation required
- **Audit Logging**: All data access logged for compliance
- **Data Isolation**: User data strictly isolated

### Performance Optimization
- **Query Optimization**: Efficient Prisma queries with selected fields
- **Caching**: Multi-level caching with React Query
- **Compression**: Large scenario data compressed
- **Background Sync**: Non-blocking data updates

### Error Handling
- **Structured Errors**: Consistent error format across API
- **Circuit Breakers**: Protection against external service failures
- **Retry Logic**: Automatic retry with exponential backoff
- **Monitoring**: Performance and error monitoring

## Development Guidelines

### Adding New Queries
1. Add function to `enterprise-queries.ts`
2. Create API handler in `enterprise-dashboard.ts`
3. Add route file in `app/api/enterprise/`
4. Update TypeScript interfaces
5. Add error handling
6. Update hooks if needed

### Testing Strategy
- Unit tests for all query functions
- Integration tests for API endpoints
- Hook testing with React Testing Library
- Error scenario testing
- Performance testing for large datasets

### Mock Data
- Comprehensive mock data for development
- Realistic business scenarios
- Edge case testing data
- Performance testing datasets

## File Structure Summary

```
apps/web/src/
├── app/api/enterprise/
│   ├── dashboard/route.ts
│   ├── scenarios/route.ts
│   ├── exit-strategies/route.ts
│   ├── capital-structure/route.ts
│   ├── projections/route.ts
│   └── options/route.ts
├── lib/
│   ├── db/
│   │   ├── enterprise-queries.ts
│   │   └── README.md (this file)
│   ├── api/
│   │   └── enterprise-dashboard.ts
│   ├── types/
│   │   └── enterprise-dashboard.ts
│   ├── utils/
│   │   └── enterprise-error-handling.ts
│   └── hooks/
│       └── useEnterpriseData.ts
```

## Dependencies

- **Prisma**: Database ORM and query builder
- **Zod**: Runtime type validation
- **React Query**: Data fetching and caching
- **NextAuth**: Authentication and session management
- **Crypto**: Data encryption utilities

## Next Steps

1. **Testing**: Implement comprehensive test suite
2. **Monitoring**: Add performance monitoring dashboard
3. **Caching**: Implement Redis caching layer
4. **Real-time**: Add WebSocket support for live updates
5. **Analytics**: Add usage analytics and monitoring
6. **Documentation**: Generate API documentation
7. **Performance**: Add query optimization and indexing
8. **Compliance**: Add additional SOC2 compliance features