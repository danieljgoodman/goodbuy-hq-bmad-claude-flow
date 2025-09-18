'use client'

import { useUser as useClerkUser, useAuth as useClerkAuth } from '@clerk/nextjs'

/**
 * Safe wrapper for Clerk's useUser hook that handles missing configuration
 */
export function useSafeUser() {
  try {
    // Try to use Clerk's useUser if available
    if (typeof useClerkUser === 'function') {
      return useClerkUser()
    }
  } catch (error) {
    // Clerk not configured, return mock user for development
    console.warn('Clerk not configured, using mock user')
  }

  // Return mock user for development when Clerk is not configured
  return {
    isLoaded: true,
    isSignedIn: true,
    user: {
      id: 'mock-user-id',
      firstName: 'Test',
      lastName: 'User',
      fullName: 'Test User',
      emailAddresses: [{ emailAddress: 'test@example.com' }],
      primaryEmailAddress: { emailAddress: 'test@example.com' },
      publicMetadata: {
        tier: 'professional' // Default to professional for testing
      }
    }
  }
}

/**
 * Safe wrapper for Clerk's useAuth hook that handles missing configuration
 */
export function useSafeAuth() {
  try {
    // Try to use Clerk's useAuth if available
    if (typeof useClerkAuth === 'function') {
      return useClerkAuth()
    }
  } catch (error) {
    // Clerk not configured, return mock auth for development
    console.warn('Clerk not configured, using mock auth')
  }

  // Return mock auth for development when Clerk is not configured
  return {
    isLoaded: true,
    isSignedIn: true,
    userId: 'mock-user-id',
    sessionId: 'mock-session-id',
    signOut: async () => {
      console.log('Mock sign out')
    },
    getToken: async () => 'mock-token'
  }
}