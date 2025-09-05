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
