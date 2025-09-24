'use client'

import { useState, useEffect } from 'react'
import { useUser } from '@clerk/nextjs'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function TestTierPage() {
  const { user } = useUser()
  const [currentTier, setCurrentTier] = useState<string>('loading...')
  const [updating, setUpdating] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    fetchCurrentTier()
  }, [])

  const fetchCurrentTier = async () => {
    try {
      const response = await fetch('/api/set-tier')
      const data = await response.json()
      setCurrentTier(data.currentTier || 'free')
    } catch (error) {
      console.error('Error fetching tier:', error)
      setCurrentTier('error')
    }
  }

  const setTier = async (tier: string) => {
    setUpdating(true)
    setMessage('')

    try {
      const response = await fetch('/api/set-tier', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tier })
      })

      const data = await response.json()

      if (data.success) {
        setMessage(`✅ Tier updated to ${tier}! Please refresh the page and navigate to /dashboard`)
        setCurrentTier(tier)

        // Force a hard refresh after a short delay
        setTimeout(() => {
          window.location.href = '/dashboard'
        }, 2000)
      } else {
        setMessage(`❌ Error: ${data.error}`)
      }
    } catch (error) {
      setMessage(`❌ Error updating tier: ${error}`)
    } finally {
      setUpdating(false)
    }
  }

  return (
    <div className="container mx-auto p-8 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>Test Tier Settings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="p-4 bg-gray-100 rounded">
              <p className="text-sm font-medium">Current User:</p>
              <p className="text-lg">{user?.emailAddresses[0]?.emailAddress || 'Not logged in'}</p>
            </div>

            <div className="p-4 bg-blue-50 rounded">
              <p className="text-sm font-medium">Current Tier:</p>
              <p className="text-2xl font-bold text-blue-600">{currentTier}</p>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium">Set Tier:</p>
              <div className="grid grid-cols-3 gap-2">
                <Button
                  onClick={() => setTier('free')}
                  disabled={updating}
                  variant={currentTier === 'free' ? 'default' : 'outline'}
                >
                  Free
                </Button>
                <Button
                  onClick={() => setTier('professional')}
                  disabled={updating}
                  variant={currentTier === 'professional' ? 'default' : 'outline'}
                >
                  Professional
                </Button>
                <Button
                  onClick={() => setTier('enterprise')}
                  disabled={updating}
                  variant={currentTier === 'enterprise' ? 'default' : 'outline'}
                >
                  Enterprise
                </Button>
              </div>
            </div>

            {message && (
              <div className={`p-4 rounded ${message.includes('✅') ? 'bg-green-50' : 'bg-red-50'}`}>
                <p className="text-sm">{message}</p>
              </div>
            )}

            <div className="mt-4 p-4 bg-yellow-50 rounded">
              <p className="text-sm text-yellow-800">
                <strong>Note:</strong> This is a test page for development. After setting your tier,
                you'll be redirected to /dashboard which should then redirect you to the appropriate
                tier-specific dashboard based on your selection.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}