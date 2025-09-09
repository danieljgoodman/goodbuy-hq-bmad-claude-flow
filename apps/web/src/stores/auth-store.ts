import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import { supabase } from '@/lib/supabase'
import { setUserId, clearUserId, getCurrentUserId, refreshUserIdFromAuth } from '@/lib/user-utils'
import type { User } from '@/types'

// Database user type (snake_case)
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
const transformToDatabase = (user: Partial<User> & { id: string, email: string }): Partial<DatabaseUser> => ({
  id: user.id,
  email: user.email,
  business_name: user.businessName,
  industry: user.industry,
  role: user.role,
  subscription_tier: user.subscriptionTier,
  input_method: user.inputMethod,
  created_at: user.createdAt,
  updated_at: user.updatedAt,
  last_login_at: user.lastLoginAt,
} as any)

interface AuthState {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  
  signUp: (email: string, password: string, userData: Partial<User>) => Promise<void>
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  resetPassword: (email: string) => Promise<void>
  updateProfile: (userData: Partial<User>) => Promise<void>
  initialize: () => Promise<void>
}

import { persist } from 'zustand/middleware'

export const useAuthStore = create<AuthState>()(
  devtools(
    persist(
      (set, get) => ({
      user: null,
      isLoading: true,
      isAuthenticated: false,

      initialize: async () => {
        try {
          // Check if we're in development mode with placeholder config
          const isDevMode = process.env.NEXT_PUBLIC_SUPABASE_URL === 'https://placeholder.supabase.co' || 
                           !process.env.NEXT_PUBLIC_SUPABASE_URL ||
                           process.env.NEXT_PUBLIC_SUPABASE_URL.includes('placeholder')
          
          if (isDevMode) {
            console.log('🔓 Using development auth initialization')
            set({ isLoading: false })
            return
          }

          const { data: { session } } = await supabase.auth.getSession()
          
          if (session?.user) {
            const { data: userData } = await supabase
              .from('users')
              .select('*')
              .eq('id', session.user.id)
              .single()

            if (userData) {
              const transformedUser = transformDatabaseUser(userData)
              set({ 
                user: transformedUser, 
                isAuthenticated: true, 
                isLoading: false 
              })
              
              // Force refresh user ID cache so evaluation system uses the correct ID
              refreshUserIdFromAuth()
            }
          } else {
            set({ isLoading: false })
          }
        } catch (error) {
          console.error('Auth initialization error:', error)
          set({ isLoading: false })
        }
      },

      signUp: async (email: string, password: string, userData: Partial<User>) => {
        set({ isLoading: true })
        try {
          console.log('Starting signup process...', { email, userData })
          
          const { data, error } = await supabase.auth.signUp({
            email,
            password,
          })

          console.log('Supabase auth.signUp result:', { data, error })
          if (error) throw error

          if (data.user) {
            const userProfile: User = {
              id: data.user.id,
              email,
              businessName: userData.businessName || '',
              industry: userData.industry || '',
              role: userData.role || 'owner',
              subscriptionTier: 'free' as const,
              createdAt: new Date(),
              updatedAt: new Date(),
              lastLoginAt: new Date(),
            }

            console.log('Creating user profile:', userProfile)
            
            const { error: profileError } = await supabase
              .from('users')
              .insert(transformToDatabase(userProfile))

            console.log('User profile creation result:', { profileError })
            if (profileError) throw profileError

            set({ 
              user: userProfile, 
              isAuthenticated: true, 
              isLoading: false 
            })
            
            // Force refresh user ID cache so evaluation system uses the correct ID
            refreshUserIdFromAuth()
          }
        } catch (error) {
          set({ isLoading: false })
          throw error
        }
      },

      signIn: async (email: string, password: string) => {
        set({ isLoading: true })
        try {
          // Check if we're in development mode with placeholder config
          const supabaseUrl = typeof window !== 'undefined' 
            ? process.env.NEXT_PUBLIC_SUPABASE_URL 
            : process.env.NEXT_PUBLIC_SUPABASE_URL
          
          console.log('🔓 Supabase URL check:', supabaseUrl)
          
          const isDevMode = supabaseUrl === 'https://placeholder.supabase.co' || 
                           !supabaseUrl ||
                           supabaseUrl.includes('placeholder')
          
          console.log('🔓 Dev mode detected:', isDevMode)
          
          if (isDevMode) {
            console.log('🔓 Using development auth bypass')
            
            // Generate a consistent user ID based on email for proper user separation
            const emailHash = btoa(email).replace(/[^A-Za-z0-9]/g, '').slice(0, 8)
            const devUserId = `dev-${emailHash}-user`
            
            // Always set the user ID based on email to ensure proper user separation
            setUserId(devUserId)
            
            console.log('🔓 Generated user-specific ID for:', email, '=> ID:', devUserId)
            
            // Create a mock user for development
            const mockUser: User = {
              id: devUserId,
              email,
              businessName: `Demo Business (${email})`,
              industry: 'Technology',
              role: 'owner',
              subscriptionTier: 'free',
              createdAt: new Date(),
              updatedAt: new Date(),
              lastLoginAt: new Date(),
            }
            
            console.log('🔓 Created mock user with consistent ID:', mockUser)
            console.log('🔓 User ID systems now aligned:', {
              authStoreId: mockUser.id,
              userUtilsId: getCurrentUserId(),
              match: mockUser.id === getCurrentUserId()
            })
            
            set({ 
              user: mockUser, 
              isAuthenticated: true, 
              isLoading: false 
            })
            
            // Force refresh user ID cache so evaluation system uses the correct ID
            refreshUserIdFromAuth()
            
            console.log('🔓 Auth state updated successfully')
            console.log('🔓 User ID consistency check after sign-in:', {
              authStoreId: mockUser.id,
              userUtilsId: getCurrentUserId(),
              match: mockUser.id === getCurrentUserId()
            })
            return
          }

          const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
          })

          if (error) throw error

          if (data.user) {
            const { data: userData } = await supabase
              .from('users')
              .select('*')
              .eq('id', data.user.id)
              .single()

            if (userData) {
              await supabase
                .from('users')
                .update({ last_login_at: new Date() })
                .eq('id', data.user.id)

              const transformedUser = transformDatabaseUser({ ...userData, last_login_at: new Date() })
              set({ 
                user: transformedUser, 
                isAuthenticated: true, 
                isLoading: false 
              })
              
              // Force refresh user ID cache so evaluation system uses the correct ID
              refreshUserIdFromAuth()
            }
          }
        } catch (error) {
          set({ isLoading: false })
          throw error
        }
      },

      signOut: async () => {
        try {
          await supabase.auth.signOut()
          
          // Clear the user ID from localStorage so next login gets a fresh ID
          clearUserId()
          console.log('🔓 Cleared user ID on sign out')
          
          set({ 
            user: null, 
            isAuthenticated: false, 
            isLoading: false 
          })
        } catch (error) {
          console.error('Sign out error:', error)
        }
      },

      resetPassword: async (email: string) => {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/auth/reset-password`,
        })
        if (error) throw error
      },

      updateProfile: async (userData: Partial<User>) => {
        const { user } = get()
        if (!user) throw new Error('No user logged in')

        try {
          const updatedData = {
            ...userData,
            updated_at: new Date(),
          }

          const { error } = await supabase
            .from('users')
            .update(updatedData)
            .eq('id', user.id)

          if (error) throw error

          set({ 
            user: { ...user, ...updatedData } 
          })
        } catch (error) {
          throw error
        }
      }
    }),
      {
        name: 'auth-store', // localStorage key
        partialize: (state) => ({
          user: state.user,
          isAuthenticated: state.isAuthenticated,
        }),
      }
    ),
    { name: 'auth-store-devtools' }
  )
)