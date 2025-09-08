import { supabase } from '@/lib/supabase'
import type { User } from '@/types'

export class AuthService {
  static async signUp(email: string, password: string, userData: Partial<User>) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    })

    if (error) throw error
    if (!data.user) throw new Error('No user returned from signup')

    const userProfile: Omit<User, 'id'> & { id: string } = {
      id: data.user.id,
      email,
      businessName: userData.businessName || '',
      industry: userData.industry || '',
      role: userData.role || 'owner',
      subscriptionTier: 'free',
      createdAt: new Date(),
      updatedAt: new Date(),
      lastLoginAt: new Date(),
    }

    const { error: profileError } = await supabase
      .from('users')
      .insert(userProfile)

    if (profileError) throw profileError

    return userProfile
  }

  static async signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) throw error
    if (!data.user) throw new Error('No user returned from signin')

    const { data: userData } = await supabase
      .from('users')
      .select('*')
      .eq('id', data.user.id)
      .single()

    if (!userData) throw new Error('User profile not found')

    await supabase
      .from('users')
      .update({ lastLoginAt: new Date() })
      .eq('id', data.user.id)

    return { ...userData, lastLoginAt: new Date() }
  }

  static async signOut() {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  }

  static async resetPassword(email: string, redirectTo?: string) {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: redirectTo || `${window.location.origin}/auth/reset-password`,
    })
    if (error) throw error
  }

  static async updatePassword(newPassword: string) {
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    })
    if (error) throw error
  }

  static async getCurrentUser(): Promise<User | null> {
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session?.user) return null

    const { data: userData } = await supabase
      .from('users')
      .select('*')
      .eq('id', session.user.id)
      .single()

    return userData || null
  }

  static async updateProfile(userId: string, userData: Partial<User>) {
    const updatedData = {
      ...userData,
      updatedAt: new Date(),
    }

    const { error } = await supabase
      .from('users')
      .update(updatedData)
      .eq('id', userId)

    if (error) throw error

    return updatedData
  }

  static onAuthStateChange(callback: (user: User | null) => void) {
    return supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        const user = await this.getCurrentUser()
        callback(user)
      } else {
        callback(null)
      }
    })
  }
}