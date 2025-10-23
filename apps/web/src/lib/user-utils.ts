/**
 * User utility functions for consistent user ID management
 * Updated for Clerk integration
 */

let _cachedUserId: string | null = null

/**
 * Get the current user ID
 * With Clerk, this should be set by the useAuth hook
 */
export function getCurrentUserId(): string {
  // Check cached value first
  if (_cachedUserId) {
    return _cachedUserId
  }

  // Check localStorage
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem('clerk-user-id')
    if (stored) {
      _cachedUserId = stored
      return stored
    }
  }

  // Generate a temporary ID if nothing exists
  // This should rarely happen with Clerk as the useAuth hook sets the ID
  const tempId = crypto.randomUUID()
  console.warn('No user ID found, generating temporary ID:', tempId)
  return tempId
}

/**
 * Set the user ID (called by useAuth hook when user signs in)
 */
export function setUserId(userId: string): void {
  _cachedUserId = userId
  if (typeof window !== 'undefined') {
    localStorage.setItem('clerk-user-id', userId)
  }
  console.log('User ID set:', userId)
}

/**
 * Clear the user ID (called when user signs out)
 */
export function clearUserId(): void {
  _cachedUserId = null
  if (typeof window !== 'undefined') {
    localStorage.removeItem('clerk-user-id')
    // Also clear old auth store data
    localStorage.removeItem('auth-store')
    localStorage.removeItem('goodbuy-user-id')
  }
  console.log('User ID cleared')
}

/**
 * Initialize user ID on app start
 */
export function initializeUserId(): string {
  return getCurrentUserId()
}

/**
 * Debug function to help identify user ID issues
 */
export function debugUserIdStatus(): void {
  console.log('🔍 USER ID DEBUG STATUS:')
  console.log('  - Cached User ID:', _cachedUserId)

  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem('clerk-user-id')
    console.log('  - localStorage User ID:', stored)
    console.log('  - getCurrentUserId():', getCurrentUserId())

    if (_cachedUserId && stored && _cachedUserId === stored) {
      console.log('  ✅ User ID consistency: GOOD')
    } else {
      console.log('  ⚠️ User ID consistency: MISMATCH')
    }
  } else {
    console.log('  - Running on server side')
  }
}

/**
 * Refresh user ID from auth (no longer needed with Clerk, kept for compatibility)
 */
export function refreshUserIdFromAuth(): void {
  console.log('🔄 refreshUserIdFromAuth called (no-op with Clerk)')
}
