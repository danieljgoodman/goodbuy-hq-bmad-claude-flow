'use client'

import { useAuthStore } from '@/stores/auth-store'

export const useAuth = () => {
  return useAuthStore()
}