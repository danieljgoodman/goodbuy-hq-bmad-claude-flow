import { useState, useEffect } from 'react'

export interface User {
  id: string
  email: string
  name: string
  subscription: 'free' | 'premium' | 'enterprise'
}

export function useUser() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    // Simulate user authentication
    // In a real app, this would fetch from your auth service
    const mockUser: User = {
      id: '1',
      email: 'demo@goodbuy.com',
      name: 'Demo User',
      subscription: 'free'
    }

    const timer = setTimeout(() => {
      setUser(mockUser)
      setLoading(false)
    }, 1000)

    return () => clearTimeout(timer)
  }, [])

  return {
    user,
    loading,
    error,
    isAuthenticated: !!user
  }
}