'use client'

import { useRouter } from 'next/navigation'

export default function SimpleLogin() {
  const router = useRouter()

  const handleLogin = () => {
    console.log('Simple login clicked!')
    alert('Login clicked! Check console.')
    router.push('/dashboard')
  }

  return (
    <div className="w-full max-w-md mx-auto p-6 bg-white border rounded-lg shadow">
      <h2 className="text-2xl font-bold mb-4">Simple Login</h2>
      <p className="text-gray-600 mb-6">Click the button to login (dev mode)</p>
      
      <button 
        onClick={handleLogin}
        className="w-full bg-blue-600 text-white py-3 px-4 rounded hover:bg-blue-700"
      >
        Login to Dashboard
      </button>
    </div>
  )
}