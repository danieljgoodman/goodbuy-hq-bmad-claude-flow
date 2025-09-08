'use client'

import ProtectedRoute from '@/components/auth/protected-route'
import InputMethodChoice from '@/components/onboarding/input-method-choice'

export default function OnboardingPage() {
  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-background to-secondary pt-20 pb-8">
        <div className="container mx-auto px-4 max-w-7xl">
          <InputMethodChoice />
        </div>
      </div>
    </ProtectedRoute>
  )
}