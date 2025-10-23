'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { SignIn, useAuth } from '@clerk/nextjs'

/**
 * Login Form - Now uses Clerk for authentication
 * This component wraps Clerk's SignIn component with GoodBuy HQ branding
 */
export default function LoginForm() {
  const router = useRouter()
  const { isSignedIn, isLoaded } = useAuth()

  // Redirect to dashboard if already signed in
  useEffect(() => {
    if (isLoaded && isSignedIn) {
      router.push('/dashboard')
    }
  }, [isSignedIn, isLoaded, router])

  return (
    <Card className="w-full max-w-md mx-auto bg-card border-border shadow-lg">
      <CardHeader>
        <CardTitle>Welcome Back</CardTitle>
        <CardDescription>
          Sign in to your GoodBuy HQ account
        </CardDescription>
      </CardHeader>
      <CardContent>
        <SignIn
          appearance={{
            elements: {
              rootBox: 'mx-auto',
              card: 'shadow-none border-0',
            },
          }}
          routing="path"
          path="/sign-in"
          signUpUrl="/sign-up"
          afterSignInUrl="/dashboard"
        />
      </CardContent>
    </Card>
  )
}