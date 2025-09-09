/**
 * User utility functions for consistent user ID management
 */

// For now, generate a consistent user ID that persists across sessions
// In a real app, this would come from authentication
let _cachedUserId: string | null = null

// Function to get current user from auth store (avoid circular dependency)
function getAuthStoreUser() {
  if (typeof window === 'undefined') return null
  
  try {
    // Try multiple possible keys that Zustand might use
    const possibleKeys = ['auth-store', 'zustand-auth-store', 'authStore']
    let authState = null
    let foundKey = null
    
    console.log('🆔 DEBUG: Checking localStorage keys:', Object.keys(localStorage))
    
    for (const key of possibleKeys) {
      const data = localStorage.getItem(key)
      if (data) {
        authState = data
        foundKey = key
        break
      }
    }
    
    console.log('🆔 DEBUG: Found auth data with key:', foundKey)
    
    if (authState) {
      const parsed = JSON.parse(authState)
      console.log('🆔 DEBUG: Auth store structure:', {
        keys: Object.keys(parsed),
        hasState: !!parsed.state,
        hasUser: !!parsed.state?.user,
        userId: parsed.state?.user?.id,
        userEmail: parsed.state?.user?.email
      })
      console.log('🆔 Using auth store user:', parsed.state?.user?.id || 'no user')
      return parsed.state?.user || null
    }
  } catch (error) {
    console.log('🆔 ERROR parsing auth store:', error)
  }
  return null
}

export function getCurrentUserId(): string {
  // FORCE CLEAR: Always clear cached data on each call to ensure fresh auth check
  _cachedUserId = null
  
  // PRIORITY 1: ALWAYS use auth store if available
  const authUser = getAuthStoreUser()
  
  if (authUser?.id) {
    console.log('🆔 FORCE USING auth store user ID:', authUser.id)
    _cachedUserId = authUser.id
    
    // FORCE CLEAR stale localStorage
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('goodbuy-user-id')
      if (stored && stored !== authUser.id) {
        console.log('🆔 FORCE CLEARING stale localStorage:', stored, '→', authUser.id)
      }
      localStorage.removeItem('goodbuy-user-id') // Always clear
      localStorage.setItem('goodbuy-user-id', authUser.id)
    }
    return authUser.id
  }

  // PRIORITY 2: Only fallback to localStorage if NO auth user
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem('goodbuy-user-id')
    if (stored) {
      _cachedUserId = stored
      console.log('🆔 FALLBACK: Using stored user ID from localStorage:', stored)
      return stored
    }
  }

  // PRIORITY 3: Generate new if nothing exists
  const newUserId = crypto.randomUUID()
  
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

// Clear all cached user data to force refresh
export function refreshUserIdFromAuth(): void {
  _cachedUserId = null
  console.log('🔄 Cleared cached user ID - will refresh from auth store on next call')
}