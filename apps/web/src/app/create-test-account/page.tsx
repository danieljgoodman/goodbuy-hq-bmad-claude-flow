'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/stores/auth-store'

export default function CreateTestAccountPage() {
  const router = useRouter()
  const { signUp } = useAuthStore()
  const [result, setResult] = useState<string>('')
  const [loading, setLoading] = useState(false)

  const createTestAccount = async () => {
    setLoading(true)
    setResult('Creating test account...')
    
    const testData = {
      email: 'test@goodbuyhq.com',
      password: 'testpassword123',
      businessName: 'Test Business',
      industry: 'Technology',
      role: 'owner' as const
    }
    
    console.log('Creating test account with data:', testData)
    
    try {
      console.log('Calling signUp...')
      await signUp(testData.email, testData.password, {
        businessName: testData.businessName,
        industry: testData.industry,
        role: testData.role,
      })
      
      console.log('Test account created successfully!')
      setResult('✅ Test account created successfully! Redirecting to dashboard...')
      
      setTimeout(() => {
        router.push('/dashboard')
      }, 2000)
      
    } catch (error: any) {
      console.error('Test account creation failed:', error)
      setResult(`❌ Test account creation failed: ${error.message || error}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
        <h1 className="text-2xl font-bold mb-6 text-center">Create Test Account</h1>
        
        <div className="mb-6 text-sm text-gray-600 space-y-2">
          <p><strong>Email:</strong> test@goodbuyhq.com</p>
          <p><strong>Password:</strong> testpassword123</p>
          <p><strong>Business:</strong> Test Business</p>
          <p><strong>Industry:</strong> Technology</p>
          <p><strong>Role:</strong> Business Owner</p>
        </div>
        
        <button
          onClick={createTestAccount}
          disabled={loading}
          className="w-full px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 mb-4"
        >
          {loading ? 'Creating Account...' : 'Create Test Account'}
        </button>
        
        {result && (
          <div className="p-4 bg-gray-100 rounded mb-4">
            <p className="text-sm">{result}</p>
          </div>
        )}
        
        <div className="text-center space-y-2">
          <a href="/auth/register" className="block text-blue-500 hover:underline">
            ← Back to Registration Form
          </a>
          <a href="/test-supabase" className="block text-green-500 hover:underline">
            Test Supabase Connection
          </a>
        </div>
      </div>
    </div>
  )
}