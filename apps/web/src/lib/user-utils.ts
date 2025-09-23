/**
 * User utility functions for consistent user ID management
 * IMPORTANT: This file should NOT be used when Clerk user is available
 * Always prefer passing the Clerk user ID directly from useUser() hook
 */

// Cache the Clerk user ID for the session
let _cachedUserId: string | null = null

// Function to get current user ID - DEPRECATED for Clerk usage
function getClerkUserId(): string | null {
  // This function is DEPRECATED
  // Always use the Clerk user ID from useUser() hook instead
  console.warn('⚠️ getClerkUserId is deprecated. Use Clerk useUser() hook instead.')

  // Return cached ID if available
  if (_cachedUserId && _cachedUserId.startsWith('user_')) {
    return _cachedUserId
  }

  // Check localStorage for a Clerk user ID
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem('clerk-user-id')
    if (stored && stored.startsWith('user_')) {
      return stored
    }
  }

  return null
}

export function getCurrentUserId(): string {
  // WARNING: This function should only be used as a last resort
  // Always prefer passing the Clerk user ID directly from components
  console.warn('⚠️ getCurrentUserId called - should use Clerk user ID from useUser() hook instead')

  // PRIORITY 1: Use cached Clerk ID if available
  if (_cachedUserId && _cachedUserId.startsWith('user_')) {
    console.log('🆔 Using cached Clerk user ID:', _cachedUserId)
    return _cachedUserId
  }

  // PRIORITY 2: Check localStorage for Clerk user ID
  if (typeof window !== 'undefined') {
    const clerkId = localStorage.getItem('clerk-user-id')
    if (clerkId && clerkId.startsWith('user_')) {
      _cachedUserId = clerkId
      console.log('🆔 Using stored Clerk user ID:', clerkId)
      return clerkId
    }

    // Check legacy goodbuy-user-id for migration
    const legacyId = localStorage.getItem('goodbuy-user-id')
    if (legacyId && legacyId.startsWith('user_')) {
      // Migrate to new key
      localStorage.setItem('clerk-user-id', legacyId)
      localStorage.removeItem('goodbuy-user-id')
      _cachedUserId = legacyId
      console.log('🆔 Migrated legacy Clerk user ID:', legacyId)
      return legacyId
    }
  }

  // PRIORITY 3: Return a placeholder that will be replaced by Clerk
  // This should never be used for actual storage
  const placeholder = 'pending-clerk-auth'
  console.error('❌ No Clerk user ID available - using placeholder:', placeholder)
  return placeholder
}

export function clearUserId(): void {
  _cachedUserId = null
  if (typeof window !== 'undefined') {
    localStorage.removeItem('clerk-user-id')
    localStorage.removeItem('goodbuy-user-id') // Clean up legacy
  }
}

// Store Clerk user ID for consistency
export function setClerkUserId(clerkUserId: string): void {
  if (!clerkUserId || !clerkUserId.startsWith('user_')) {
    console.error('❌ Invalid Clerk user ID:', clerkUserId)
    return
  }

  _cachedUserId = clerkUserId
  if (typeof window !== 'undefined') {
    localStorage.setItem('clerk-user-id', clerkUserId)
    // Remove any legacy IDs
    const legacyId = localStorage.getItem('goodbuy-user-id')
    if (legacyId && !legacyId.startsWith('user_')) {
      localStorage.removeItem('goodbuy-user-id')
    }
  }
  console.log('✅ Stored Clerk user ID:', clerkUserId)
}

// Initialize user ID on app start (for server-side consistency)
export function initializeUserId(clerkUserId?: string): string {
  if (clerkUserId && clerkUserId.startsWith('user_')) {
    setClerkUserId(clerkUserId)
    return clerkUserId
  }
  return getCurrentUserId()
}

// Debug function to help identify user ID issues
export function debugUserIdStatus(): void {
  console.log('🔍 USER ID DEBUG STATUS:')
  console.log('  - Cached User ID:', _cachedUserId)

  if (typeof window !== 'undefined') {
    const clerkStored = localStorage.getItem('clerk-user-id')
    const legacyStored = localStorage.getItem('goodbuy-user-id')
    console.log('  - Clerk User ID in localStorage:', clerkStored)
    console.log('  - Legacy User ID in localStorage:', legacyStored)
    console.log('  - getCurrentUserId():', getCurrentUserId())

    // Check for issues
    if (legacyStored && !legacyStored.startsWith('user_')) {
      console.log('  ⚠️ Legacy non-Clerk ID found:', legacyStored)
      console.log('  📝 Action needed: Clear browser storage or log in again')
    }

    if (_cachedUserId && clerkStored && _cachedUserId === clerkStored) {
      console.log('  ✅ User ID consistency: GOOD')
    } else {
      console.log('  ⚠️ User ID consistency: MISMATCH')
    }
  } else {
    console.log('  - Running on server side')
  }
}

// Force set a specific user ID (for debugging/testing)
export function setUserId(userId: string): void {
  console.warn('⚠️ setUserId is deprecated. Use setClerkUserId instead.')
  if (userId.startsWith('user_')) {
    setClerkUserId(userId)
  } else {
    console.error('❌ Cannot set non-Clerk user ID:', userId)
  }
}

// Clear all cached user data to force refresh
export function refreshUserIdFromAuth(): void {
  _cachedUserId = null
  console.log('🔄 Cleared cached user ID - will refresh from Clerk on next call')
}