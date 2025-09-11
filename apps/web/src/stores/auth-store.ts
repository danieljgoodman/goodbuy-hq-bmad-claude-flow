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

      signUp: async (email: string, password: string, userData: any) => {
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
            // Create enhanced user profile with all the new fields
            const userProfile = {
              id: data.user.id,
              email,
              business_name: userData.businessName || '',
              industry: userData.industry || '',
              role: userData.role || 'owner',
              subscription_tier: 'FREE' as const,
              // Enhanced signup fields
              business_address: userData.businessAddress || null,
              business_phone: userData.businessPhone || null,
              years_in_operation: userData.yearsInOperation || null,
              employee_count_range: userData.employeeCountRange || null,
              revenue_range: userData.revenueRange || null,
              business_model: userData.businessModel || null,
              website_url: userData.websiteUrl || null,
              linkedin_url: userData.linkedinUrl || null,
              referral_source: userData.referralSource || null,
              registration_completed: userData.registrationCompleted || false,
              registration_step: userData.registrationStep || 4,
              created_at: new Date(),
              updated_at: new Date(),
              last_login_at: new Date(),
            }

            console.log('Creating enhanced user profile:', userProfile)
            
            const { error: profileError } = await supabase
              .from('users')
              .insert(userProfile)

            console.log('User profile creation result:', { profileError })
            if (profileError) throw profileError

            // Transform to User type for the store
            const transformedUser: User = {
              id: userProfile.id,
              email: userProfile.email,
              businessName: userProfile.business_name,
              industry: userProfile.industry,
              role: userProfile.role as any,
              subscriptionTier: userProfile.subscription_tier.toLowerCase() as any,
              createdAt: userProfile.created_at,
              updatedAt: userProfile.updated_at,
              lastLoginAt: userProfile.last_login_at,
            }

            set({ 
              user: transformedUser, 
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
          console.log('🔐 AUTH STORE SIGN IN CALLED:', { email, password })
          
          // Check if we're in development mode with placeholder config
          const supabaseUrl = typeof window !== 'undefined' 
            ? process.env.NEXT_PUBLIC_SUPABASE_URL 
            : process.env.NEXT_PUBLIC_SUPABASE_URL
          
          console.log('🔓 Supabase URL check:', supabaseUrl)
          
          const isDevMode = supabaseUrl === 'https://placeholder.supabase.co' || 
                           !supabaseUrl ||
                           supabaseUrl.includes('placeholder')
          
          console.log('🔓 Dev mode detected:', isDevMode, 'for email:', email)
          
          if (isDevMode) {
            console.log('🔓 Using development auth bypass')
            
            // Handle special test users with enterprise access
            let devUserId: string
            let subscriptionTier: 'free' | 'premium' | 'enterprise' = 'free'
            let businessName = `Demo Business (${email})`
            
            if (email === 'testbroker@goodbuyhq.com' || email === 'test@goodbuy.com') {
              devUserId = 'd882e870-879b-4b93-8763-ba60b492a2ed'
              subscriptionTier = 'enterprise'
              businessName = 'Test Business Corp'
              console.log('🔓 Test user detected, setting enterprise access')
            } else if (email === 'admin@goodbuyhq.com' || email.includes('admin')) {
              devUserId = 'admin-user-full-access'
              subscriptionTier = 'enterprise'
              businessName = 'GoodBuy HQ'
              console.log('🔓 Admin user detected, setting enterprise access')
            } else {
              // Generate a consistent user ID based on email for proper user separation
              const emailHash = btoa(email).replace(/[^A-Za-z0-9]/g, '').slice(0, 8)
              devUserId = `dev-${emailHash}-user`
            }
            
            // Always set the user ID based on email to ensure proper user separation
            setUserId(devUserId)
            
            console.log('🔓 Generated user-specific ID for:', email, '=> ID:', devUserId, 'Tier:', subscriptionTier)
            
            // Create a mock user for development
            const mockUser: User = {
              id: devUserId,
              email,
              businessName,
              industry: 'Technology',
              role: 'owner',
              subscriptionTier,
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
          console.log('🔓 STARTING COMPLETE SIGN OUT PROCESS')
          
          await supabase.auth.signOut()
          
          // Clear the user ID from localStorage so next login gets a fresh ID
          clearUserId()
          console.log('🔓 Cleared user ID on sign out')
          
          // Clear all localStorage items related to auth
          if (typeof window !== 'undefined') {
            localStorage.removeItem('auth-store')
            localStorage.removeItem('user-id')
            sessionStorage.clear()
            console.log('🔓 Cleared all local storage and session storage')
          }
          
          set({ 
            user: null, 
            isAuthenticated: false, 
            isLoading: false 
          })
          
          console.log('🔓 SIGN OUT COMPLETE - all session data cleared')
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