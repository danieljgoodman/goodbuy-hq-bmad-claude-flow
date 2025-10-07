'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function TestSupabasePage() {
  const [result, setResult] = useState<string>('')
  const [loading, setLoading] = useState(false)

  const testConnection = async () => {
    setLoading(true)
    try {
      console.log('Testing Supabase connection...')
      
      // Test basic connection
      const { data, error } = await supabase.from('users').select('count').limit(1)
      
      if (error) {
        console.error('Supabase connection error:', error)
        setResult(`❌ Connection failed: ${error.message}`)
      } else {
        console.log('Supabase connection successful:', data)
        setResult('✅ Supabase connection successful!')
      }
    } catch (error) {
      console.error('Test failed:', error)
      setResult(`❌ Test failed: ${error}`)
    } finally {
      setLoading(false)
    }
  }

  const testAuth = async () => {
    setLoading(true)
    try {
      console.log('Testing Supabase auth...')
      
      // Test auth connection
      const { data: { session }, error } = await supabase.auth.getSession()
      
      if (error) {
        console.error('Auth error:', error)
        setResult(`❌ Auth test failed: ${error.message}`)
      } else {
        console.log('Auth test successful, current session:', session)
        setResult(`✅ Auth connection works! Current user: ${session?.user?.email || 'No user logged in'}`)
      }
    } catch (error) {
      console.error('Auth test failed:', error)
      setResult(`❌ Auth test failed: ${error}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
        <h1 className="text-2xl font-bold mb-6 text-center">Supabase Connection Test</h1>
        
        <div className="space-y-4">
          <button
            onClick={testConnection}
            disabled={loading}
            className="w-full px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
          >
            {loading ? 'Testing...' : 'Test Database Connection'}
          </button>
          
          <button
            onClick={testAuth}
            disabled={loading}
            className="w-full px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
          >
            {loading ? 'Testing...' : 'Test Auth Connection'}
          </button>
        </div>
        
        {result && (
          <div className="mt-6 p-4 bg-gray-100 rounded">
            <p className="text-sm">{result}</p>
          </div>
        )}
        
        <div className="mt-6 text-center">
          <a href="/auth/register" className="text-blue-500 hover:underline">
            ← Back to Registration
          </a>
        </div>
      </div>
    </div>
  )
}