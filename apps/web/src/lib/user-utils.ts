/**
 * User utility functions for consistent user ID management
 * Updated to use Clerk authentication
 */

// Cache the Clerk user ID for the session
let _cachedUserId: string | null = null

// Function to get current user ID from Clerk
function getClerkUserId(): string | null {
  if (typeof window === 'undefined') return null

  try {
    // Check for Clerk user data in sessionStorage or localStorage
    // Clerk stores user data in __clerk_db_jwt key
    const clerkKeys = [
      '__clerk_db_jwt',
      '__clerk_client_jwt',
      'clerk-db-jwt',
      '__session'
    ]

    for (const key of clerkKeys) {
      const data = sessionStorage.getItem(key) || localStorage.getItem(key)
      if (data) {
        try {
          // Try to decode JWT to get user ID
          const parts = data.split('.')
          if (parts.length === 3) {
            const payload = JSON.parse(atob(parts[1]))
            if (payload.sub) {
              console.log('🆔 Found Clerk user ID from JWT:', payload.sub)
              return payload.sub
            }
          }
        } catch (e) {
          // Not a JWT, continue
        }
      }
    }

    // Also check for Clerk user object in localStorage
    const userDataKeys = Object.keys(localStorage).filter(key =>
      key.includes('clerk') || key.includes('user')
    )

    for (const key of userDataKeys) {
      try {
        const data = localStorage.getItem(key)
        if (data) {
          const parsed = JSON.parse(data)
          // Look for Clerk user ID patterns
          if (parsed.userId && parsed.userId.startsWith('user_')) {
            console.log('🆔 Found Clerk user ID from storage:', parsed.userId)
            return parsed.userId
          }
          if (parsed.id && parsed.id.startsWith('user_')) {
            console.log('🆔 Found Clerk user ID from storage:', parsed.id)
            return parsed.id
          }
        }
      } catch (e) {
        // Continue to next key
      }
    }
  } catch (error) {
    console.log('🆔 ERROR getting Clerk user ID:', error)
  }
  return null
}

export function getCurrentUserId(): string {
  // PRIORITY 1: Try to get Clerk user ID
  const clerkUserId = getClerkUserId()

  if (clerkUserId) {
    console.log('🆔 Using Clerk user ID:', clerkUserId)
    _cachedUserId = clerkUserId

    // Store for consistency
    if (typeof window !== 'undefined') {
      localStorage.setItem('goodbuy-user-id', clerkUserId)
    }
    return clerkUserId
  }

  // PRIORITY 2: Use cached ID if available
  if (_cachedUserId) {
    console.log('🆔 Using cached user ID:', _cachedUserId)
    return _cachedUserId
  }

  // PRIORITY 3: Check localStorage for stored ID
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem('goodbuy-user-id')
    if (stored) {
      _cachedUserId = stored
      console.log('🆔 Using stored user ID from localStorage:', stored)
      return stored
    }
  }

  // PRIORITY 4: Generate new ID as last resort
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