import { auth, currentUser, clerkClient } from '@clerk/nextjs/server'
import { PrismaClient } from '@prisma/client'
import type { User } from '@/types'

const prisma = new PrismaClient()

export class AuthService {
  /**
   * Get the current authenticated user
   * This is a server-side method that should be used in API routes and server components
   */
  static async getCurrentUser(): Promise<User | null> {
    const { userId } = await auth()

    if (!userId) {
      return null
    }

    const clerkUser = await currentUser()

    if (!clerkUser) {
      return null
    }

    // Get or create user in database
    const user = await prisma.user.upsert({
      where: { clerkId: userId },
      update: {
        email: clerkUser.emailAddresses[0]?.emailAddress || '',
        firstName: clerkUser.firstName || '',
        lastName: clerkUser.lastName || '',
        imageUrl: clerkUser.imageUrl || '',
        lastLoginAt: new Date(),
      },
      create: {
        clerkId: userId,
        email: clerkUser.emailAddresses[0]?.emailAddress || '',
        firstName: clerkUser.firstName || '',
        lastName: clerkUser.lastName || '',
        imageUrl: clerkUser.imageUrl || '',
        subscriptionTier: 'free',
        role: 'OWNER',
        userRole: 'user',
        lastLoginAt: new Date(),
      },
    })

    return user as User
  }

  /**
   * Get user by Clerk ID
   */
  static async getUserByClerkId(clerkId: string): Promise<User | null> {
    try {
      const user = await prisma.user.findUnique({
        where: { clerkId },
      })

      return user as User | null
    } catch (error) {
      console.error('Error getting user by Clerk ID:', error)
      return null
    }
  }

  /**
   * Update user profile
   */
  static async updateProfile(userId: string, userData: Partial<User>) {
    const updatedData = {
      ...userData,
      updatedAt: new Date(),
    }

    try {
      const user = await prisma.user.update({
        where: { id: userId },
        data: updatedData,
      })

      return user as User
    } catch (error) {
      console.error('Error updating user profile:', error)
      throw error
    }
  }

  /**
   * Update user metadata in Clerk
   */
  static async updateClerkMetadata(clerkId: string, metadata: Record<string, any>) {
    try {
      await clerkClient.users.updateUser(clerkId, {
        publicMetadata: metadata,
      })
    } catch (error) {
      console.error('Error updating Clerk metadata:', error)
      throw error
    }
  }

  /**
   * Sync user data from Clerk to database
   */
  static async syncUserFromClerk(clerkId: string) {
    try {
      const clerkUser = await clerkClient.users.getUser(clerkId)

      const user = await prisma.user.upsert({
        where: { clerkId },
        update: {
          email: clerkUser.emailAddresses[0]?.emailAddress || '',
          firstName: clerkUser.firstName || '',
          lastName: clerkUser.lastName || '',
          imageUrl: clerkUser.imageUrl || '',
        },
        create: {
          clerkId,
          email: clerkUser.emailAddresses[0]?.emailAddress || '',
          firstName: clerkUser.firstName || '',
          lastName: clerkUser.lastName || '',
          imageUrl: clerkUser.imageUrl || '',
          subscriptionTier: 'free',
          role: 'OWNER',
          userRole: 'user',
        },
      })

      return user as User
    } catch (error) {
      console.error('Error syncing user from Clerk:', error)
      throw error
    }
  }

  /**
   * Delete user from database
   */
  static async deleteUser(clerkId: string) {
    try {
      await prisma.user.delete({
        where: { clerkId },
      })
    } catch (error) {
      console.error('Error deleting user:', error)
      throw error
    }
  }

  /**
   * Check if user has specific role
   */
  static async hasRole(role: string): Promise<boolean> {
    const user = await this.getCurrentUser()
    return user?.userRole === role
  }

  /**
   * Check if user has subscription tier or higher
   */
  static async hasSubscriptionTier(tier: 'free' | 'basic' | 'professional' | 'enterprise'): Promise<boolean> {
    const user = await this.getCurrentUser()

    if (!user) return false

    const tiers = ['free', 'basic', 'professional', 'enterprise']
    const userTierIndex = tiers.indexOf(user.subscriptionTier)
    const requiredTierIndex = tiers.indexOf(tier)

    return userTierIndex >= requiredTierIndex
  }
}
