'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { SignUp, useAuth } from '@clerk/nextjs'

/**
 * Register Form - Now uses Clerk for authentication
 * This component wraps Clerk's SignUp component with GoodBuy HQ branding
 *
 * Note: Business-specific fields (businessName, industry, role) should be
 * collected in an onboarding flow after initial signup.
 */
export default function RegisterForm() {
  const router = useRouter()
  const { isSignedIn, isLoaded } = useAuth()

  // Redirect to dashboard if already signed in
  useEffect(() => {
    if (isLoaded && isSignedIn) {
      router.push('/dashboard')
    }
  }, [isSignedIn, isLoaded, router])

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Create Account</CardTitle>
        <CardDescription>
          Join GoodBuy HQ to get AI-powered business insights
        </CardDescription>
      </CardHeader>
      <CardContent>
        <SignUp
          appearance={{
            elements: {
              rootBox: 'mx-auto',
              card: 'shadow-none border-0',
            },
          }}
          routing="path"
          path="/sign-up"
          signInUrl="/sign-in"
          afterSignUpUrl="/onboarding"
        />
      </CardContent>
    </Card>
  )
}