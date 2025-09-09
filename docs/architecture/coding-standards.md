# Coding Standards

## Critical Fullstack Rules

- **Type Sharing:** Always define types in packages/shared and import from there
- **API Calls:** Never make direct HTTP calls - use the service layer
- **Environment Variables:** Access only through config objects, never process.env directly
- **Error Handling:** All API routes must use the standard error handler
- **State Updates:** Never mutate state directly - use proper state management patterns
- **Auth Context:** Always check authentication through hooks, never access auth state directly
- **Premium Features:** Gate premium content through subscription checks, not UI hiding
- **Database Access:** Use repository pattern, never direct Supabase calls in API routes
- **AI Processing:** Always include confidence scores and methodology explanations
- **Input Validation:** Use Zod schemas for all API input validation
- **Data Sources:** NEVER use mock data in functionality - always implement proper data fetching, generation, or real API integration

## Naming Conventions

| Element | Frontend | Backend | Example |
|---------|----------|---------|---------|
| Components | PascalCase | - | `EvaluationForm.tsx` |
| Hooks | camelCase with 'use' | - | `useAuthStore.ts` |
| API Routes | - | kebab-case | `/api/business-evaluations` |
| Database Tables | - | snake_case | `business_evaluations` |
