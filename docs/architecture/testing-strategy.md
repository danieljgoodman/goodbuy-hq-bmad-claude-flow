# Testing Strategy

## Testing Pyramid

```text
        E2E Tests (Playwright)
       /                    \
    Integration Tests (Vitest + Supertest)
   /                              \
Frontend Unit Tests          Backend Unit Tests
   (Vitest + RTL)              (Vitest + Node)
```

## Test Organization

Comprehensive test structure covering components, API routes, services, and end-to-end user journeys with 90%+ coverage for critical business logic.

## Data Testing Policy

### Real Data Requirements
- **No Mock Business Data:** Tests must use realistic data structures that match production
- **Test Fixtures:** Create proper test data that represents real business scenarios
- **API Testing:** Use real data payloads, not simplified mock objects
- **Component Testing:** Test with realistic data props, not minimal mock data
