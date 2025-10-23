# Clerk Authentication Migration

## Overview

This project has been migrated from Supabase Auth to Clerk for authentication. This document explains the new architecture and how to use it.

## Architecture

### Before (Supabase)
```
┌─────────────────┐
│  Auth Store     │ ← Manages both auth & user data
│  (Zustand)      │ ← signIn, signUp, signOut methods
│                 │ ← Direct Supabase integration
└─────────────────┘
```

### After (Clerk)
```
┌─────────────────┐
│  Clerk          │ ← Handles all authentication
│  (@clerk/nextjs)│ ← Sessions, tokens, sign in/out
└────────┬────────┘
         │
         ├── useAuth Hook ──┐
         │                  │
         ▼                  ▼
┌─────────────────┐  ┌─────────────────┐
│  Auth Store     │  │  User Utils     │
│  (Zustand)      │  │  (lib/user-utils)│
│                 │  │                 │
│  - dbUser       │  │  - setUserId    │
│  - syncUser     │  │  - getUserId    │
│  - updateProfile│  │  - clearUserId  │
└─────────────────┘  └─────────────────┘
```

## Key Components

### 1. useAuth Hook (`/hooks/useAuth.ts`)

**Primary interface for authentication** throughout the app.

```typescript
import { useAuth } from '@/hooks'

function MyComponent() {
  const {
    user,           // Clerk user object
    dbUser,         // Database user profile
    isLoaded,       // Clerk loaded status
    isSignedIn,     // Clerk signed in status
    isAuthenticated,// Combined auth status
    signOut,        // Sign out function
    updateProfile   // Update database profile
  } = useAuth()

  if (!isLoaded) return <Loading />
  if (!isSignedIn) return <SignIn />

  return <div>Hello {dbUser?.businessName}!</div>
}
```

### 2. Auth Store (`/stores/auth-store.ts`)

**Simplified store** that only manages database user profile data.

```typescript
interface AuthState {
  dbUser: User | null          // Database user profile
  isLoading: boolean           // Loading state

  setDbUser: (user) => void    // Set database user
  syncUser: (id, email) => Promise<void>  // Sync with DB
  updateProfile: (id, data) => Promise<void>  // Update profile
  clearUser: () => void        // Clear on sign out
}
```

**What it does NOT do anymore:**
- ❌ No signIn method (use Clerk's UI components)
- ❌ No signUp method (use Clerk's UI components)
- ❌ No signOut method (use useAuth hook)
- ❌ No session management (Clerk handles this)

### 3. User Utils (`/lib/user-utils.ts`)

**Utility functions** for user ID management across the app.

```typescript
import { setUserId, getCurrentUserId, clearUserId } from '@/lib/user-utils'

// Set user ID (called automatically by useAuth)
setUserId(clerkUserId)

// Get current user ID (for evaluations, etc.)
const userId = getCurrentUserId()

// Clear user ID (called automatically on sign out)
clearUserId()
```

## Migration Guide

### Old Pattern (Supabase)
```typescript
import { useAuthStore } from '@/stores/auth-store'

function LoginPage() {
  const { signIn } = useAuthStore()

  const handleSubmit = async (email, password) => {
    await signIn(email, password)
  }
}
```

### New Pattern (Clerk)
```typescript
import { SignIn } from '@clerk/nextjs'

function LoginPage() {
  // Clerk provides pre-built UI components
  return <SignIn />
}

// OR use the useAuth hook for programmatic access
import { useAuth } from '@/hooks'

function ProfilePage() {
  const { dbUser, updateProfile, signOut } = useAuth()

  const handleUpdate = async (data) => {
    await updateProfile(data)
  }
}
```

## Common Use Cases

### 1. Protecting Routes

```typescript
import { useAuth } from '@/hooks'

function ProtectedPage() {
  const { isLoaded, isSignedIn } = useAuth()

  if (!isLoaded) return <Loading />
  if (!isSignedIn) return <Navigate to="/sign-in" />

  return <div>Protected Content</div>
}
```

### 2. Accessing User Data

```typescript
import { useAuth } from '@/hooks'

function Dashboard() {
  const { user, dbUser } = useAuth()

  return (
    <div>
      {/* Clerk user data */}
      <p>Email: {user?.emailAddresses[0].emailAddress}</p>

      {/* Database user data */}
      <p>Business: {dbUser?.businessName}</p>
      <p>Tier: {dbUser?.subscriptionTier}</p>
    </div>
  )
}
```

### 3. Updating Profile

```typescript
import { useAuth } from '@/hooks'

function SettingsPage() {
  const { dbUser, updateProfile } = useAuth()

  const handleSave = async (data) => {
    await updateProfile({
      businessName: data.businessName,
      industry: data.industry,
      role: data.role
    })
  }

  return <form onSubmit={handleSave}>...</form>
}
```

### 4. Sign Out

```typescript
import { useAuth } from '@/hooks'

function Header() {
  const { signOut } = useAuth()

  return (
    <button onClick={signOut}>
      Sign Out
    </button>
  )
}
```

## Database Integration

The current implementation uses mock data. To connect to a real database:

### 1. Update `syncUser` in auth-store.ts

```typescript
syncUser: async (clerkUserId: string, email: string) => {
  set({ isLoading: true })
  try {
    // Fetch user from your database
    const response = await fetch(`/api/users/${clerkUserId}`)
    const data = await response.json()

    if (response.ok) {
      set({ dbUser: transformDatabaseUser(data), isLoading: false })
    } else {
      // User doesn't exist, create new profile
      const newUser = await fetch('/api/users', {
        method: 'POST',
        body: JSON.stringify({
          id: clerkUserId,
          email,
          business_name: '',
          industry: '',
          role: 'owner',
          subscription_tier: 'free'
        })
      })
      const newUserData = await newUser.json()
      set({ dbUser: transformDatabaseUser(newUserData), isLoading: false })
    }
  } catch (error) {
    console.error('Error syncing user:', error)
    set({ isLoading: false })
  }
}
```

### 2. Update `updateProfile` in auth-store.ts

```typescript
updateProfile: async (userId: string, userData: Partial<User>) => {
  set({ isLoading: true })
  try {
    const response = await fetch(`/api/users/${userId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(transformToDatabase(userData))
    })

    if (response.ok) {
      const updatedData = await response.json()
      set({
        dbUser: transformDatabaseUser(updatedData),
        isLoading: false
      })
    }
  } catch (error) {
    set({ isLoading: false })
    throw error
  }
}
```

## Clerk Configuration

### Environment Variables

Add these to your `.env.local`:

```bash
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

# Clerk URLs
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/onboarding
```

### Middleware Setup

Create `middleware.ts` in your app root:

```typescript
import { authMiddleware } from '@clerk/nextjs'

export default authMiddleware({
  publicRoutes: ['/', '/sign-in', '/sign-up', '/api/public(.*)']
})

export const config = {
  matcher: ['/((?!.+\\.[\\w]+$|_next).*)', '/', '/(api|trpc)(.*)']
}
```

## Benefits of Clerk

1. **Pre-built UI Components**: Sign in, sign up, user profile, organization management
2. **Security**: Built-in session management, token handling, CSRF protection
3. **Multi-factor Authentication**: Easy to enable 2FA, SMS, authenticator apps
4. **Social Login**: Google, GitHub, Microsoft, etc.
5. **Organizations**: Built-in support for team/organization management
6. **Webhooks**: Real-time sync with your database
7. **Admin Dashboard**: Manage users without code

## Troubleshooting

### User ID Mismatch
If you see user ID inconsistencies:

```typescript
import { debugUserIdStatus } from '@/lib/user-utils'

// Call this to see what's going on
debugUserIdStatus()
```

### Database Not Syncing
Check that:
1. useAuth hook is being called in your app
2. Clerk user is loaded (`isLoaded === true`)
3. User is signed in (`isSignedIn === true`)
4. syncUser is being called in the useEffect

### Old Auth Store Data
Clear localStorage to remove old Supabase data:

```typescript
import { clearUserId } from '@/lib/user-utils'

clearUserId() // This clears all old auth data
```

## Next Steps

1. ✅ Auth store rewritten to use Clerk
2. ✅ useAuth hook created
3. ✅ User utils updated
4. ⏳ Update all components to use new useAuth hook
5. ⏳ Remove Supabase dependencies
6. ⏳ Connect to real database API
7. ⏳ Add Clerk middleware
8. ⏳ Set up Clerk webhooks for user sync
