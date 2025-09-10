# Story 9.1: User Evaluation Management - Brownfield Addition

## User Story

As a **business owner using the platform**,
I want **the ability to delete my own business evaluations**,
So that **I can manage my evaluation history and remove outdated or incorrect assessments from my dashboard**.

## Story Context

**Existing System Integration:**

- Integrates with: BusinessEvaluation model, user dashboard, evaluation history display
- Technology: Next.js API routes, PostgreSQL with Prisma ORM, Supabase RLS policies
- Follows pattern: Existing CRUD operations with user ownership validation
- Touch points: Dashboard evaluation list, evaluation detail pages, database soft-delete patterns

## Acceptance Criteria

**Functional Requirements:**

1. Users can delete their own evaluations through a delete button in the evaluation list and detail view
2. Evaluation deletion is implemented as soft delete (marked as deleted, not physically removed) to preserve data integrity
3. Deleted evaluations are immediately hidden from user's dashboard and evaluation history
4. Delete action requires confirmation dialog to prevent accidental deletion
5. Related data (improvement opportunities, progress tracking) is also soft deleted when evaluation is deleted

**Integration Requirements:**

6. Existing evaluation display and filtering continues to work unchanged, excluding soft-deleted records
7. New soft-delete functionality follows existing database patterns with `deleted_at` timestamp
8. Integration with dashboard maintains current performance while filtering deleted evaluations

**Quality Requirements:**

9. Soft delete functionality is covered by unit and integration tests
10. Database migration adds `deleted_at` column without breaking existing queries
11. No regression in existing evaluation functionality verified through testing

## Technical Notes

- **Integration Approach:** Add `deleted_at` timestamp to `business_evaluations` table, modify existing queries to filter out soft-deleted records
- **Existing Pattern Reference:** Follow soft-delete patterns used in user management (if exists) or implement new standard pattern
- **Key Constraints:** Must preserve referential integrity for analytics and auditing purposes

## Definition of Done

- [x] Functional requirements met with soft-delete implementation
- [x] Integration requirements verified with existing dashboard functionality
- [x] Existing evaluation functionality regression tested
- [x] Code follows existing API route and component patterns
- [x] Tests pass (existing evaluation tests updated, new delete tests added)
- [x] Database migration safely deployed with rollback capability

## Risk and Compatibility Check

**Minimal Risk Assessment:**

- **Primary Risk:** Accidentally hiding evaluations that should remain visible, breaking evaluation-dependent features
- **Mitigation:** Implement soft delete with immediate UI feedback and comprehensive testing of evaluation list components
- **Rollback:** Remove `deleted_at` column check from queries, all evaluations become visible again

**Compatibility Verification:**

- [x] No breaking changes to existing evaluation APIs (only adding DELETE endpoint)
- [x] Database changes are additive only (`deleted_at` column added)
- [x] UI changes follow existing ShadCN button and dialog patterns
- [x] Performance impact is negligible (indexed `deleted_at` column)

## Implementation Details

**API Changes:**
- Add `DELETE /api/evaluations/{id}` endpoint with user ownership validation
- Modify existing evaluation queries to include `WHERE deleted_at IS NULL`

**Database Migration:**
```sql
ALTER TABLE business_evaluations ADD COLUMN deleted_at TIMESTAMP WITH TIME ZONE;
CREATE INDEX idx_business_evaluations_deleted_at ON business_evaluations(deleted_at);
```

**UI Components:**
- Add delete button to evaluation cards in dashboard
- Add delete button to evaluation detail page
- Create confirmation dialog using existing ShadCN Dialog component
- Update evaluation list filtering logic

**Related Table Updates:**
- Add `deleted_at` to `improvement_opportunities` table
- Add `deleted_at` to `improvement_progress` table
- Update related queries and components accordingly

## Estimated Effort: 3-4 hours focused development