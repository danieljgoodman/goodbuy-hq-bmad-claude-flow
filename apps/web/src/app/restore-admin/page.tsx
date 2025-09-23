'use client'

import { useState } from 'react'
import { useUser } from '@clerk/nextjs'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { CheckCircle, AlertCircle, Loader2 } from 'lucide-react'

export default function RestoreAdminPage() {
  const { user, isLoaded } = useUser()
  const [isRestoring, setIsRestoring] = useState(false)
  const [restored, setRestored] = useState(false)
  const [error, setError] = useState('')

  const handleRestoreAdmin = async () => {
    setIsRestoring(true)
    setError('')

    try {
      const response = await fetch('/api/admin/fix-role', {
        method: 'POST',
      })

      if (!response.ok) {
        throw new Error('Failed to restore admin role')
      }

      const data = await response.json()
      setRestored(true)

      // Reload after 2 seconds to apply changes
      setTimeout(() => {
        window.location.href = '/admin'
      }, 2000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to restore admin role')
    } finally {
      setIsRestoring(false)
    }
  }

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  const currentRole = user?.publicMetadata?.role as string || 'user'
  const isAdmin = currentRole === 'admin' || currentRole === 'super_admin'

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <Card className="max-w-md w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {isAdmin ? (
              <>
                <CheckCircle className="h-5 w-5 text-green-500" />
                Admin Access Active
              </>
            ) : (
              <>
                <AlertCircle className="h-5 w-5 text-yellow-500" />
                Restore Admin Access
              </>
            )}
          </CardTitle>
          <CardDescription>
            {isAdmin
              ? 'You have admin privileges'
              : 'Your admin access needs to be restored'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Email:</span>
              <span className="font-medium">{user?.primaryEmailAddress?.emailAddress}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Current Role:</span>
              <span className={`font-medium ${isAdmin ? 'text-green-600' : 'text-orange-600'}`}>
                {currentRole}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Tier:</span>
              <span className="font-medium">
                {user?.publicMetadata?.tier || user?.publicMetadata?.subscriptionTier || 'FREE'}
              </span>
            </div>
          </div>

          {restored ? (
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                Admin role restored successfully! Redirecting to admin dashboard...
              </AlertDescription>
            </Alert>
          ) : isAdmin ? (
            <Alert className="border-blue-200 bg-blue-50">
              <AlertDescription className="text-blue-800">
                You already have admin access.
                <a href="/admin" className="ml-1 underline font-medium">
                  Go to Admin Dashboard
                </a>
              </AlertDescription>
            </Alert>
          ) : (
            <>
              {error && (
                <Alert className="border-red-200 bg-red-50">
                  <AlertCircle className="h-4 w-4 text-red-600" />
                  <AlertDescription className="text-red-800">{error}</AlertDescription>
                </Alert>
              )}

              <Button
                onClick={handleRestoreAdmin}
                disabled={isRestoring}
                className="w-full"
                size="lg"
              >
                {isRestoring ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Restoring Admin Access...
                  </>
                ) : (
                  'Restore Admin Access'
                )}
              </Button>

              <p className="text-xs text-muted-foreground text-center">
                This will restore your role to super_admin while keeping your current subscription tier
              </p>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}