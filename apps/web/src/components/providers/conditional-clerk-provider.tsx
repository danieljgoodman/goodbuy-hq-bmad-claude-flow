'use client'

import { ClerkProvider } from '@clerk/nextjs'
import { ReactNode } from 'react'

interface ConditionalClerkProviderProps {
  children: ReactNode
}

export function ConditionalClerkProvider({ children }: ConditionalClerkProviderProps) {
  const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY

  // If no Clerk key is configured, render children without ClerkProvider
  // This allows the app to work without Clerk for development/testing
  if (!publishableKey || publishableKey === 'your_clerk_publishable_key') {
    console.warn('Clerk authentication is not configured. User management features will be disabled.')
    return <>{children}</>
  }

  return (
    <ClerkProvider publishableKey={publishableKey}>
      {children}
    </ClerkProvider>
  )
}