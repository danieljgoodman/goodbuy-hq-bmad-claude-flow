/**
 * User utility functions for consistent user ID management
 */

// For now, generate a consistent user ID that persists across sessions
// In a real app, this would come from authentication
let _cachedUserId: string | null = null

export function getCurrentUserId(): string {
  // Check if we already have a cached user ID
  if (_cachedUserId) {
    console.log('🆔 Using cached user ID:', _cachedUserId)
    return _cachedUserId
  }

  // Try to get from localStorage first (persistence across page reloads)
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem('goodbuy-user-id')
    if (stored) {
      _cachedUserId = stored
      console.log('🆔 Using stored user ID from localStorage:', stored)
      return stored
    }
  }

  // Generate a new user ID if none exists
  const newUserId = crypto.randomUUID()
  
  // Store it for persistence
  if (typeof window !== 'undefined') {
    localStorage.setItem('goodbuy-user-id', newUserId)
  }
  
  _cachedUserId = newUserId
  console.log('🆔 Generated NEW user ID:', newUserId)
  return newUserId
}

export function clearUserId(): void {
  _cachedUserId = null
  if (typeof window !== 'undefined') {
    localStorage.removeItem('goodbuy-user-id')
  }
}

// Initialize user ID on app start (for server-side consistency)
export function initializeUserId(): string {
  return getCurrentUserId()
}

// Debug function to help identify user ID issues
export function debugUserIdStatus(): void {
  console.log('🔍 USER ID DEBUG STATUS:')
  console.log('  - Cached User ID:', _cachedUserId)
  
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem('goodbuy-user-id')
    console.log('  - localStorage User ID:', stored)
    console.log('  - getCurrentUserId():', getCurrentUserId())
    
    // Check if they match
    if (_cachedUserId && stored && _cachedUserId === stored) {
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
  _cachedUserId = userId
  if (typeof window !== 'undefined') {
    localStorage.setItem('goodbuy-user-id', userId)
  }
  console.log('🔧 Force set user ID to:', userId)
}