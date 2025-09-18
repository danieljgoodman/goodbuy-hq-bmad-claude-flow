'use client'

import { SignUp } from '@clerk/nextjs'

export default function SignUpPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-secondary p-4">
      <SignUp
        appearance={{
          elements: {
            formButtonPrimary: 'bg-primary hover:bg-primary/90',
            footerActionLink: 'text-primary hover:text-primary/90',
            card: 'shadow-lg',
          }
        }}
        afterSignUpUrl="/onboarding"
        afterSignInUrl="/dashboard"
      />
    </div>
  )
}