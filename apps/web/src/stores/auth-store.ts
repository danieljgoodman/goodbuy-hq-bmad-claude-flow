/**
 * Auth store using Clerk
 * This is a compatibility layer for components that previously used Zustand auth store
 */

import { create } from 'zustand'

interface AuthState {
  user: any | null
  isLoading: boolean
  error: string | null

  // Legacy methods for compatibility
  setUser: (user: any | null) => void
  setLoading: (isLoading: boolean) => void
  setError: (error: string | null) => void
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string, metadata?: any) => Promise<void>
  signOut: () => Promise<void>
  resetPassword: (email: string) => Promise<void>
  checkAuth: () => Promise<void>
}

// Create a minimal auth store for compatibility
// Most auth logic should use Clerk hooks directly
export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: false,
  error: null,

  setUser: (user) => set({ user }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),

  // These methods are stubs - actual auth should use Clerk
  signIn: async (email: string, password: string) => {
    console.warn('signIn called on auth-store - use Clerk signIn instead')
    // Redirect to Clerk sign-in page
    window.location.href = '/sign-in'
  },

  signUp: async (email: string, password: string, metadata?: any) => {
    console.warn('signUp called on auth-store - use Clerk signUp instead')
    // Redirect to Clerk sign-up page
    window.location.href = '/sign-up'
  },

  signOut: async () => {
    console.warn('signOut called on auth-store - use Clerk signOut instead')
    // This will be handled by Clerk
    set({ user: null })
  },

  resetPassword: async (email: string) => {
    console.warn('resetPassword called on auth-store - use Clerk password reset instead')
    // Clerk handles password reset
  },

  checkAuth: async () => {
    console.warn('checkAuth called on auth-store - use Clerk useAuth instead')
    // Clerk handles auth checking automatically
  },
}))

export default useAuthStore