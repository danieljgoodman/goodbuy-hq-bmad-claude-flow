'use client'

import { useState } from 'react'
import { useAuth, useUser } from '@clerk/nextjs'

export default function TestTiersPage() {
  const { userId } = useAuth()
  const { user, isLoaded } = useUser()
  const [tier, setTier] = useState('professional')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  const currentTier = (user?.publicMetadata as any)?.subscriptionTier || 'free'
  const currentStatus = (user?.publicMetadata as any)?.subscriptionStatus || 'inactive'

  const handleSetTier = async () => {
    if (!userId) {
      setMessage('❌ You must be logged in')
      return
    }

    setLoading(true)
    setMessage('')

    try {
      const response = await fetch('/api/admin/set-tier', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          tier,
          status: 'active'
        })
      })

      const data = await response.json()

      if (response.ok) {
        setMessage(`✅ ${data.message}`)
        // Reload user data
        window.location.reload()
      } else {
        setMessage(`❌ ${data.error}`)
      }
    } catch (error) {
      setMessage(`❌ Error: ${error}`)
    } finally {
      setLoading(false)
    }
  }

  if (!isLoaded) {
    return <div className="p-8">Loading...</div>
  }

  return (
    <div className="max-w-4xl mx-auto p-8">
      <h1 className="text-3xl font-bold mb-8">Test Subscription Tiers</h1>

      {/* Current Status */}
      <div className="bg-gray-100 p-6 rounded-lg mb-8">
        <h2 className="text-xl font-semibold mb-4">Current User Status</h2>
        <div className="space-y-2">
          <p><strong>User ID:</strong> {userId || 'Not logged in'}</p>
          <p><strong>Email:</strong> {user?.primaryEmailAddress?.emailAddress}</p>
          <p><strong>Current Tier:</strong>
            <span className={`ml-2 px-3 py-1 rounded-full text-sm ${
              currentTier === 'enterprise' ? 'bg-purple-500 text-white' :
              currentTier === 'professional' ? 'bg-blue-500 text-white' :
              'bg-gray-400 text-white'
            }`}>
              {currentTier.toUpperCase()}
            </span>
          </p>
          <p><strong>Status:</strong>
            <span className={`ml-2 px-3 py-1 rounded-full text-sm ${
              currentStatus === 'active' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
            }`}>
              {currentStatus.toUpperCase()}
            </span>
          </p>
        </div>
      </div>

      {/* Set Tier */}
      <div className="bg-white border rounded-lg p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">Set Test Tier</h2>

        <div className="flex gap-4 mb-4">
          <button
            onClick={() => setTier('free')}
            className={`px-4 py-2 rounded ${
              tier === 'free'
                ? 'bg-gray-600 text-white'
                : 'bg-gray-200 hover:bg-gray-300'
            }`}
          >
            Free
          </button>
          <button
            onClick={() => setTier('professional')}
            className={`px-4 py-2 rounded ${
              tier === 'professional'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 hover:bg-gray-300'
            }`}
          >
            Professional
          </button>
          <button
            onClick={() => setTier('enterprise')}
            className={`px-4 py-2 rounded ${
              tier === 'enterprise'
                ? 'bg-purple-600 text-white'
                : 'bg-gray-200 hover:bg-gray-300'
            }`}
          >
            Enterprise
          </button>
        </div>

        <button
          onClick={handleSetTier}
          disabled={loading || !userId}
          className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {loading ? 'Setting...' : `Set Tier to ${tier.toUpperCase()}`}
        </button>

        {message && (
          <div className={`mt-4 p-3 rounded ${
            message.startsWith('✅') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}>
            {message}
          </div>
        )}
      </div>

      {/* Quick Links */}
      <div className="bg-white border rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Test Different Tiers</h2>
        <div className="space-y-2">
          <a href="/dashboard" className="block text-blue-600 hover:underline">
            → Go to Dashboard (redirects based on tier)
          </a>
          <a href="/dashboard/professional" className="block text-blue-600 hover:underline">
            → Professional Dashboard (requires professional tier)
          </a>
          <a href="/dashboard/enterprise" className="block text-blue-600 hover:underline">
            → Enterprise Dashboard (requires enterprise tier)
          </a>
          <a href="/pricing" className="block text-blue-600 hover:underline">
            → Pricing Page (upgrade prompts)
          </a>
        </div>
      </div>

      {/* Instructions */}
      <div className="mt-8 p-6 bg-yellow-50 border border-yellow-200 rounded-lg">
        <h3 className="font-semibold text-yellow-900 mb-2">📝 Testing Instructions</h3>
        <ol className="list-decimal list-inside space-y-1 text-sm text-yellow-800">
          <li>Click a tier button to select it</li>
          <li>Click "Set Tier" to apply it to your account</li>
          <li>The page will reload with your new tier</li>
          <li>Test accessing different dashboard pages</li>
          <li>Try accessing restricted features to see upgrade prompts</li>
        </ol>
      </div>
    </div>
  )
}