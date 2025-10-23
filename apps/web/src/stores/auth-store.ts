import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'
import type { User } from '@/types'

/**
 * Simplified Auth Store for Clerk Integration
 *
 * Clerk handles all authentication state (user sessions, tokens, etc.)
 * This store only manages our database user profile data.
 */

// Database user type (snake_case from Supabase)
interface DatabaseUser {
  id: string
  email: string
  business_name: string
  industry: string
  role: 'owner' | 'manager' | 'advisor'
  subscription_tier: 'free' | 'premium' | 'enterprise'
  created_at: Date
  updated_at: Date
  last_login_at: Date | null
}

// Transform database user to User type
const transformDatabaseUser = (dbUser: DatabaseUser): User => ({
  id: dbUser.id,
  email: dbUser.email,
  businessName: dbUser.business_name,
  industry: dbUser.industry,
  role: dbUser.role,
  subscriptionTier: dbUser.subscription_tier,
  inputMethod: (dbUser as any).input_method,
  createdAt: dbUser.created_at,
  updatedAt: dbUser.updated_at,
  lastLoginAt: dbUser.last_login_at,
})

// Transform User type to database format
const transformToDatabase = (user: Partial<User>): Partial<DatabaseUser> => ({
  business_name: user.businessName,
  industry: user.industry,
  role: user.role,
  subscription_tier: user.subscriptionTier,
  updated_at: new Date(),
})

interface AuthState {
  // Database user profile data
  dbUser: User | null
  isLoading: boolean

  // Actions
  setDbUser: (user: User | null) => void
  updateProfile: (userId: string, userData: Partial<User>) => Promise<void>
  syncUser: (clerkUserId: string, email: string) => Promise<void>
  clearUser: () => void
}

export const useAuthStore = create<AuthState>()(
  devtools(
    persist(
      (set, get) => ({
        dbUser: null,
        isLoading: false,

        setDbUser: (user: User | null) => {
          set({ dbUser: user })
        },

        updateProfile: async (userId: string, userData: Partial<User>) => {
          set({ isLoading: true })
          try {
            const { dbUser } = get()
            if (!dbUser) throw new Error('No user profile loaded')

            // In production, this would update the database
            // For now, we'll update the local state
            const updatedUser = {
              ...dbUser,
              ...userData,
              updatedAt: new Date(),
            }

            set({
              dbUser: updatedUser,
              isLoading: false
            })

            // TODO: When database is connected, update via API
            // await fetch('/api/users/profile', {
            //   method: 'PATCH',
            //   body: JSON.stringify(transformToDatabase(userData))
            // })
          } catch (error) {
            set({ isLoading: false })
            throw error
          }
        },

        syncUser: async (clerkUserId: string, email: string) => {
          set({ isLoading: true })
          try {
            // TODO: Fetch user from database by Clerk user ID
            // For now, create a mock user
            const mockUser: User = {
              id: clerkUserId,
              email,
              businessName: email.split('@')[0] + ' Business',
              industry: 'Technology',
              role: 'owner',
              subscriptionTier: 'free',
              createdAt: new Date(),
              updatedAt: new Date(),
              lastLoginAt: new Date(),
            }

            set({
              dbUser: mockUser,
              isLoading: false
            })

            // TODO: When database is connected, fetch real user
            // const response = await fetch(`/api/users/${clerkUserId}`)
            // const data = await response.json()
            // set({ dbUser: transformDatabaseUser(data), isLoading: false })
          } catch (error) {
            console.error('Error syncing user:', error)
            set({ isLoading: false })
            throw error
          }
        },

        clearUser: () => {
          set({
            dbUser: null,
            isLoading: false
          })
        },
      }),
      {
        name: 'auth-store',
        partialize: (state) => ({
          dbUser: state.dbUser,
        }),
      }
    ),
    { name: 'auth-store-devtools' }
  )
)
