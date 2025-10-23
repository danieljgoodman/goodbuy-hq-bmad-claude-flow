# Clerk Migration Status

## ✅ Completed

### 1. Auth Store Rewrite (`/stores/auth-store.ts`)
- **Removed**: All Supabase-specific code
- **Removed**: `signIn`, `signUp`, `signOut`, `resetPassword`, `initialize` methods
- **Kept**: `updateProfile` method (adapted for Clerk)
- **Added**: `syncUser` method to sync Clerk user with database
- **Added**: `setDbUser`, `clearUser` methods
- **Simplified**: Store now only manages database user profile data
- **Changed**: `user` renamed to `dbUser` to clarify it's database data, not Clerk auth state

### 2. Custom Auth Hook (`/hooks/useAuth.ts`)
- **Created**: New `useAuth` hook that combines Clerk + database user
- **Exports**:
  - `user`: Clerk user object (auth state)
  - `dbUser`: Database user profile (business data)
  - `isLoaded`: Clerk loading status
  - `isSignedIn`: Clerk authentication status
  - `isAuthenticated`: Combined auth status
  - `signOut`: Unified sign out (clears both Clerk + database)
  - `updateProfile`: Update database user profile
- **Auto-sync**: Automatically syncs Clerk user with database on sign in

### 3. User Utils Update (`/lib/user-utils.ts`)
- **Updated**: To use `clerk-user-id` localStorage key
- **Simplified**: Removed Supabase auth store reading logic
- **Added**: Cleanup of old auth data on `clearUserId()`
- **Kept**: Compatible API for existing code

### 4. Documentation
- **Created**: `/docs/AUTH_MIGRATION.md` - Complete migration guide
- **Created**: `/docs/CLERK_MIGRATION_STATUS.md` - This status file

## ⏳ Pending Tasks

### Priority 1: Update Components
The following files need to be updated to use the new `useAuth` hook instead of the old auth store:

#### Auth Components (High Priority)
- `/components/auth/login-form.tsx`
- `/components/auth/register-form.tsx`
- `/components/auth/progressive-register-form.tsx`
- `/components/auth/reset-password-form.tsx`

**Action**: Replace with Clerk's pre-built components or update to use `useAuth` hook.

#### Navigation Components
- `/components/layout/mobile-navigation-drawer.tsx`

**Action**: Update to use `useAuth` hook for sign out and user data.

#### Context Providers
- `/contexts/onboarding-context.tsx`
- `/contexts/dashboard-customization-context.tsx`
- `/contexts/help-context.tsx`
- `/contexts/navigation-context.tsx`

**Action**: Update to use `useAuth` hook instead of auth store.

#### Pages
- `/app/create-test-account/page.tsx`
- `/app/dashboard/page.tsx`
- `/app/account/profile/page.tsx`
- `/app/evaluations/page.tsx`
- `/app/evaluation/[id]/page.tsx`
- `/app/page.tsx`

**Action**: Update to use `useAuth` hook.

#### Evaluation Components
- `/components/evaluation/evaluation-form.tsx`
- `/components/evaluation/opportunities-list.tsx`
- `/components/evaluation/steps/business-basics-step.tsx`
- `/components/evaluation/steps/enhanced-business-basics-step.tsx`
- `/components/evaluation/steps/document-upload-step.tsx`
- `/components/evaluation/steps/review-submit-step.tsx`

**Action**: Update to use `useAuth` hook for user data.

#### Dashboard Components
- `/components/dashboard/quick-action-bar.tsx`
- `/components/dashboard/customizable-dashboard.tsx`

**Action**: Update to use `useAuth` hook.

#### Onboarding Components
- `/components/onboarding/input-method-choice.tsx`
- `/components/onboarding/steps/next-steps-step.tsx`
- `/components/onboarding/steps/dashboard-tour-step.tsx`

**Action**: Update to use `useAuth` hook.

### Priority 2: API Routes
Update API routes to use Clerk authentication instead of Supabase:

- `/app/api/account/data/route.ts`
- `/app/api/account/profile/route.ts`
- `/app/api/admin/success-metrics/route.ts`
- `/app/api/admin/users/[id]/route.ts`
- `/app/api/admin/users/export/route.ts`
- `/app/api/admin/users/route.ts`

**Action**: Replace Supabase auth checks with `auth()` from `@clerk/nextjs`.

### Priority 3: Infrastructure
- Update `/app/layout.tsx` to use `ClerkProvider`
- Update `/components/auth/protected-route.tsx` to use Clerk
- Update `/components/providers/auth-initializer.tsx` to use Clerk
- Update `/lib/services/auth-service.ts` to use Clerk

### Priority 4: Database Integration
- Create API endpoints for user CRUD operations
- Update `syncUser` in auth-store.ts to fetch from real database
- Update `updateProfile` in auth-store.ts to update real database
- Set up Clerk webhooks for user creation/updates

### Priority 5: Cleanup
- Remove Supabase dependencies from `package.json`
- Remove `/lib/supabase.ts` (if exists)
- Remove old auth-related environment variables
- Add Clerk environment variables to `.env.local.example`

## Migration Pattern

### Before (Supabase)
```typescript
import { useAuthStore } from '@/stores/auth-store'

function Component() {
  const { user, signIn, signOut } = useAuthStore()

  return <button onClick={signOut}>Sign Out</button>
}
```

### After (Clerk)
```typescript
import { useAuth } from '@/hooks'

function Component() {
  const { user, dbUser, signOut, isLoaded } = useAuth()

  if (!isLoaded) return <Loading />

  return (
    <div>
      <p>Clerk Email: {user?.emailAddresses[0].emailAddress}</p>
      <p>Business: {dbUser?.businessName}</p>
      <button onClick={signOut}>Sign Out</button>
    </div>
  )
}
```

## Key Differences

| Feature | Supabase (Old) | Clerk (New) |
|---------|---------------|-------------|
| **Auth State** | Managed in Zustand store | Managed by Clerk |
| **User Data** | Single `user` object | `user` (Clerk) + `dbUser` (Database) |
| **Sign In** | `useAuthStore().signIn()` | `<SignIn />` component |
| **Sign Up** | `useAuthStore().signUp()` | `<SignUp />` component |
| **Sign Out** | `useAuthStore().signOut()` | `useAuth().signOut()` |
| **User Profile** | `user` from store | `dbUser` from useAuth hook |
| **Loading State** | `isLoading` from store | `isLoaded` from Clerk |
| **Auth Check** | `isAuthenticated` from store | `isSignedIn` from Clerk |

## Testing Checklist

- [ ] Sign in with Clerk works
- [ ] Sign out clears both Clerk + database state
- [ ] User data syncs from Clerk to database
- [ ] Profile updates save to database
- [ ] Protected routes redirect unauthenticated users
- [ ] User ID is consistent across app
- [ ] Old localStorage data is cleared on migration

## Database Schema Changes Needed

Update your database schema to use Clerk user IDs:

```sql
-- Update users table to use Clerk IDs
ALTER TABLE users
  ADD COLUMN clerk_user_id VARCHAR(255) UNIQUE;

-- For existing users, you may need a migration script
-- to map Supabase IDs to Clerk IDs
```

## Environment Variables

Add to `.env.local`:

```bash
# Clerk Configuration
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

# Clerk URLs
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/onboarding
```

## Rollout Strategy

1. **Phase 1** (Current): Core auth infrastructure updated
2. **Phase 2**: Update auth components and forms
3. **Phase 3**: Update all pages to use new hook
4. **Phase 4**: Update API routes
5. **Phase 5**: Database integration
6. **Phase 6**: Remove Supabase dependencies
7. **Phase 7**: Production deployment

## Notes

- The new `useAuth` hook provides a drop-in replacement for most auth store usage
- Clerk handles session management automatically
- Database user sync happens automatically when user signs in
- Old Supabase data is cleared on first sign out with new system
