'use client'

import { useEffect } from 'react'
import { useAuthStore } from '@/stores/auth-store'

export function AuthInitializer() {
  const { initialize } = useAuthStore()

  useEffect(() => {
    initialize().catch(error => {
      console.error('Failed to initialize auth:', error)
    })
  }, [initialize])

  return null // This component doesn't render anything
}