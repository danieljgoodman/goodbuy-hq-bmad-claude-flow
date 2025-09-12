import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        try {
          // Check if user exists in database
          const user = await prisma.user.findUnique({
            where: { email: credentials.email },
            select: {
              id: true,
              email: true,
              businessName: true,
              industry: true,
              role: true,
              subscriptionTier: true
            }
          })

          if (user) {
            return {
              id: user.id,
              email: user.email,
              name: user.businessName,
              role: user.role,
              subscriptionTier: user.subscriptionTier,
              businessName: user.businessName,
              industry: user.industry
            }
          }

          // If user doesn't exist, return null (failed authentication)
          return null
        } catch (error) {
          console.error('Database error during authentication:', error)
          return null
        }
      }
    })
  ],
  pages: {
    signIn: '/auth/login',
  },
  session: {
    strategy: 'jwt',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = (user as any).role
        token.subscriptionTier = (user as any).subscriptionTier
        token.businessName = (user as any).businessName
        token.industry = (user as any).industry
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string
        ;(session.user as any).role = token.role
        ;(session.user as any).subscriptionTier = token.subscriptionTier
        ;(session.user as any).businessName = token.businessName
        ;(session.user as any).industry = token.industry
      }
      return session
    },
  },
}

// Helper function to get current user from server session
export async function getCurrentUser() {
  // This would typically get the current session from NextAuth
  // For now, returning null - needs to be implemented with getServerSession
  return null
}

// Helper function for API routes that need auth check
export async function getServerAuth(email?: string) {
  if (!email) {
    return null
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        role: true,
        subscriptionTier: true,
        businessName: true,
        industry: true
      }
    })

    if (!user) {
      return null
    }

    return {
      userId: user.id,
      email: user.email,
      role: user.role,
      subscriptionTier: user.subscriptionTier,
      businessName: user.businessName,
      industry: user.industry
    }
  } catch (error) {
    console.error('Database error in getServerAuth:', error)
    return null
  }
}