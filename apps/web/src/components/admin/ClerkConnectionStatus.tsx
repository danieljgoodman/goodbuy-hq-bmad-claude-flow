'use client'

import { useEffect, useState } from 'react'
import { useUser } from '@clerk/nextjs'
import { CheckCircle, AlertCircle, XCircle, Loader2 } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'

export default function ClerkConnectionStatus() {
  const { user, isLoaded, isSignedIn } = useUser()
  const [connectionStatus, setConnectionStatus] = useState<'checking' | 'connected' | 'error'>('checking')
  const [userCount, setUserCount] = useState<number | null>(null)

  useEffect(() => {
    const checkConnection = async () => {
      if (!isLoaded) return

      if (!isSignedIn || !user) {
        setConnectionStatus('error')
        return
      }

      try {
        // Try to fetch user count to verify API connection
        const response = await fetch('/api/admin/users?page=1&limit=1')
        if (response.ok) {
          const data = await response.json()
          setUserCount(data.pagination?.total || 0)
          setConnectionStatus('connected')
        } else if (response.status === 403) {
          setConnectionStatus('error')
        } else {
          setConnectionStatus('connected') // Still connected even if not admin
        }
      } catch (error) {
        console.error('Failed to verify Clerk connection:', error)
        setConnectionStatus('error')
      }
    }

    checkConnection()
  }, [isLoaded, isSignedIn, user])

  if (!isLoaded || connectionStatus === 'checking') {
    return (
      <Alert className="mb-4 border-blue-200 bg-blue-50">
        <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
        <AlertDescription className="text-blue-800 ml-2">
          Checking Clerk connection...
        </AlertDescription>
      </Alert>
    )
  }

  if (connectionStatus === 'error') {
    return (
      <Alert className="mb-4 border-red-200 bg-red-50">
        <XCircle className="h-4 w-4 text-red-600" />
        <AlertDescription className="text-red-800 ml-2">
          Clerk connection failed. Please check your configuration.
        </AlertDescription>
      </Alert>
    )
  }

  const isAdmin = user?.publicMetadata?.role === 'admin' || user?.publicMetadata?.role === 'super_admin'
  const currentRole = user?.publicMetadata?.role as string

  const handleFixRole = async () => {
    try {
      const response = await fetch('/api/admin/fix-role', { method: 'POST' })
      if (response.ok) {
        window.location.reload() // Reload to reflect changes
      }
    } catch (error) {
      console.error('Failed to fix role:', error)
    }
  }

  return (
    <Alert className="mb-4 border-green-200 bg-green-50">
      <div className="flex items-center justify-between w-full">
        <div className="flex items-center">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800 ml-2">
            <span className="font-semibold">Clerk Connected</span>
            {isAdmin && (
              <>
                {' • '}
                <span className="text-green-700">
                  Role: {user?.publicMetadata?.role}
                </span>
                {userCount !== null && (
                  <>
                    {' • '}
                    <span className="text-green-700">
                      Managing {userCount} {userCount === 1 ? 'user' : 'users'}
                    </span>
                  </>
                )}
              </>
            )}
            {!isAdmin && currentRole === 'user' && (
              <>
                {' • '}
                <span className="text-orange-700">
                  Role: {currentRole} (Lost admin access)
                </span>
                {' • '}
                <button
                  onClick={handleFixRole}
                  className="text-blue-600 underline hover:text-blue-800"
                >
                  Restore Admin Access
                </button>
              </>
            )}
          </AlertDescription>
        </div>
        <div className="flex items-center gap-2 text-xs text-green-700">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          Live
        </div>
      </div>
    </Alert>
  )
}