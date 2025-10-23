import { auth, currentUser } from '@clerk/nextjs/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

/**
 * Get current authenticated user from Clerk
 */
export async function getCurrentUser() {
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
    },
    create: {
      clerkId: userId,
      email: clerkUser.emailAddresses[0]?.emailAddress || '',
      firstName: clerkUser.firstName || '',
      lastName: clerkUser.lastName || '',
      imageUrl: clerkUser.imageUrl || '',
      subscriptionTier: 'free',
      role: 'user',
    },
    select: {
      id: true,
      clerkId: true,
      email: true,
      firstName: true,
      lastName: true,
      businessName: true,
      industry: true,
      role: true,
      subscriptionTier: true,
      imageUrl: true,
    },
  })

  return user
}

/**
 * Get authenticated user for API routes
 */
export async function getServerAuth() {
  const { userId } = await auth()

  if (!userId) {
    return null
  }

  try {
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      select: {
        id: true,
        clerkId: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        subscriptionTier: true,
        businessName: true,
        industry: true,
        imageUrl: true,
      },
    })

    if (!user) {
      return null
    }

    return {
      userId: user.id,
      clerkId: user.clerkId,
      email: user.email,
      role: user.role,
      subscriptionTier: user.subscriptionTier,
      businessName: user.businessName,
      industry: user.industry,
      firstName: user.firstName,
      lastName: user.lastName,
      imageUrl: user.imageUrl,
    }
  } catch (error) {
    console.error('Database error in getServerAuth:', error)
    return null
  }
}

/**
 * Require authentication - throws error if not authenticated
 */
export async function requireAuth() {
  const user = await getServerAuth()

  if (!user) {
    throw new Error('Unauthorized')
  }

  return user
}

/**
 * Check if user has specific role
 */
export async function hasRole(role: string) {
  const user = await getServerAuth()
  return user?.role === role
}

/**
 * Check if user has subscription tier or higher
 */
export async function hasSubscriptionTier(tier: 'free' | 'basic' | 'professional' | 'enterprise') {
  const user = await getServerAuth()

  if (!user) return false

  const tiers = ['free', 'basic', 'professional', 'enterprise']
  const userTierIndex = tiers.indexOf(user.subscriptionTier)
  const requiredTierIndex = tiers.indexOf(tier)

  return userTierIndex >= requiredTierIndex
}
