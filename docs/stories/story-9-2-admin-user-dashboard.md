# Story 9.2: Admin User Dashboard Enhancement - Brownfield Addition

## User Story

As an **administrator of the platform**,
I want **a comprehensive dashboard to view all users and manage their membership tiers**,
So that **I can efficiently control user access, resolve support issues, and monitor platform usage**.

## Story Context

**Existing System Integration:**

- Integrates with: User model, Subscription model, existing admin authentication
- Technology: Next.js API routes, PostgreSQL with RLS policies, ShadCN/ui data tables
- Follows pattern: Existing dashboard layout and protected admin routes
- Touch points: User table, subscription management, admin authentication middleware

## Acceptance Criteria

**Functional Requirements:**

1. Admin dashboard displays paginated list of all platform users with search and filter capabilities
2. User list shows key information: name, email, business name, industry, subscription tier, join date, last login
3. Admin can change user subscription tiers through dropdown selection with immediate save
4. User search functionality by email, business name, or industry with real-time results
5. Filter options by subscription tier, industry, and date ranges (joined, last active)
6. Bulk actions for common administrative tasks (export user list, bulk tier changes)

**Integration Requirements:**

7. Existing user authentication and session management continues to work unchanged
8. New admin functionality follows existing role-based access control patterns
9. Integration with Stripe subscription data maintains current billing accuracy

**Quality Requirements:**

10. Admin dashboard functionality is covered by integration tests with role-based access
11. Database queries are optimized for large user lists with proper indexing
12. No regression in existing user management functionality verified

## Technical Notes

- **Integration Approach:** Create new admin API routes under `/api/admin/users` with role validation, extend existing admin layout
- **Existing Pattern Reference:** Follow existing admin route protection and data table components from current admin pages
- **Key Constraints:** Must respect existing RLS policies while allowing admin access, audit all tier changes

## Definition of Done

- [x] Functional requirements met with comprehensive user management interface
- [x] Integration requirements verified with existing authentication and subscription systems
- [x] Existing user functionality regression tested
- [x] Code follows existing admin dashboard and API route patterns
- [x] Tests pass (new admin tests added, existing user tests unaffected)
- [x] Admin access controls properly implemented with audit logging

## Risk and Compatibility Check

**Minimal Risk Assessment:**

- **Primary Risk:** Admin accidentally modifying user data or subscription states causing billing issues
- **Mitigation:** Implement confirmation dialogs for subscription changes, comprehensive audit logging, and rollback capabilities
- **Rollback:** Feature flag to disable admin user management, revert to previous admin dashboard

**Compatibility Verification:**

- [x] No breaking changes to existing user APIs (admin APIs are separate)
- [x] Database changes are additive only (audit log table, admin role checks)
- [x] UI follows existing admin dashboard patterns and ShadCN components
- [x] Performance optimized with pagination and efficient queries

## Implementation Details

**New API Endpoints:**
- `GET /api/admin/users` - Paginated user list with search/filter
- `PUT /api/admin/users/{id}/subscription` - Update user subscription tier
- `GET /api/admin/users/export` - Export user data for analysis

**Database Enhancements:**
```sql
-- Add admin role tracking
ALTER TABLE users ADD COLUMN role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('user', 'admin', 'super_admin'));

-- Create audit log table
CREATE TABLE user_admin_actions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    admin_user_id UUID NOT NULL REFERENCES users(id),
    target_user_id UUID NOT NULL REFERENCES users(id),
    action VARCHAR(100) NOT NULL,
    old_values JSONB,
    new_values JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_users_subscription_tier ON users(subscription_tier);
CREATE INDEX idx_users_industry ON users(industry);
CREATE INDEX idx_users_created_at ON users(created_at);
```

**UI Components:**
- Admin user data table with ShadCN Table component
- User search and filter controls
- Subscription tier dropdown with confirmation dialog
- Export functionality with download button
- Pagination controls for large user lists

**Admin Middleware Enhancement:**
- Extend existing admin auth middleware to check user role
- Add audit logging to all admin actions
- Rate limiting for admin API endpoints

## Security Considerations

- Admin role verification on all endpoints
- Audit trail for all user data modifications
- Rate limiting to prevent admin API abuse
- Secure session handling for admin actions

## Estimated Effort: 8-10 hours focused development