'use client'

import { useUser, useAuth as useClerkAuth, useClerk } from '@clerk/nextjs'
import { useEffect, useState } from 'react'
import { prisma } from '@/lib/prisma'

export function useClerkUserWithDatabase() {
  const { user: clerkUser, isLoaded: clerkLoaded, isSignedIn } = useUser()
  const { signOut } = useClerk()
  const [dbUser, setDbUser] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function syncUserWithDatabase() {
      if (!clerkLoaded) return

      if (isSignedIn && clerkUser) {
        try {
          // Fetch user from database using Clerk ID
          const response = await fetch(`/api/users/${clerkUser.id}`)
          if (response.ok) {
            const userData = await response.json()
            setDbUser(userData)
          } else if (response.status === 404) {
            // User doesn't exist in database, create via webhook or API
            const createResponse = await fetch('/api/users/sync', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                clerkId: clerkUser.id,
                email: clerkUser.primaryEmailAddress?.emailAddress,
                name: clerkUser.fullName,
                imageUrl: clerkUser.imageUrl,
              }),
            })

            if (createResponse.ok) {
              const newUser = await createResponse.json()
              setDbUser(newUser)
            }
          }
        } catch (error) {
          console.error('Error syncing user with database:', error)
        } finally {
          setIsLoading(false)
        }
      } else {
        setDbUser(null)
        setIsLoading(false)
      }
    }

    syncUserWithDatabase()
  }, [clerkUser, clerkLoaded, isSignedIn])

  return {
    clerkUser,
    dbUser,
    isLoading: !clerkLoaded || isLoading,
    isSignedIn,
    signOut,
  }
}

export function useAuth() {
  const clerkAuth = useClerkAuth()
  const { user } = useUser()

  return {
    ...clerkAuth,
    user,
    isAuthenticated: clerkAuth.isSignedIn,
  }
}