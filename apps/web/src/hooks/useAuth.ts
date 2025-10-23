'use client'

import { useEffect } from 'react'
import { useUser, useAuth as useClerkAuth } from '@clerk/nextjs'
import { useAuthStore } from '@/stores/auth-store'
import { setUserId, clearUserId } from '@/lib/user-utils'
import type { User } from '@/types'

/**
 * Custom auth hook that combines Clerk authentication with our database user profile
 *
 * Usage:
 * const { user, dbUser, isLoaded, isSignedIn, signOut } = useAuth()
 *
 * - user: Clerk user object (from Clerk)
 * - dbUser: Our database user profile (from Zustand store)
 * - isLoaded: Whether Clerk has loaded
 * - isSignedIn: Whether user is signed in (from Clerk)
 * - signOut: Clerk sign out function
 */
export function useAuth() {
  const { user, isLoaded, isSignedIn } = useUser()
  const { signOut } = useClerkAuth()
  const { dbUser, isLoading, syncUser, clearUser, setDbUser, updateProfile } = useAuthStore()

  // Sync database user when Clerk user changes
  useEffect(() => {
    const syncUserData = async () => {
      if (isLoaded && isSignedIn && user) {
        // Set user ID in user-utils for consistency
        setUserId(user.id)

        // If we don't have a database user or it's a different user, sync it
        if (!dbUser || dbUser.id !== user.id) {
          const primaryEmail = user.emailAddresses.find(
            (email) => email.id === user.primaryEmailAddressId
          )

          if (primaryEmail) {
            await syncUser(user.id, primaryEmail.emailAddress)
          }
        }
      } else if (isLoaded && !isSignedIn) {
        // User signed out, clear everything
        clearUser()
        clearUserId()
      }
    }

    syncUserData()
  }, [isLoaded, isSignedIn, user, dbUser, syncUser, clearUser])

  /**
   * Sign out user from both Clerk and our database store
   */
  const handleSignOut = async () => {
    await signOut()
    clearUser()
    clearUserId()
  }

  return {
    // Clerk state
    user,
    isLoaded,
    isSignedIn,

    // Database user state
    dbUser,
    isLoading,

    // Combined state
    isAuthenticated: isLoaded && isSignedIn,

    // Actions
    signOut: handleSignOut,
    updateProfile: (userData: Partial<User>) => {
      if (user) {
        return updateProfile(user.id, userData)
      }
      return Promise.reject(new Error('No user signed in'))
    },
  }
}
