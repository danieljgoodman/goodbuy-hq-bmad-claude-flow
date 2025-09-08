'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuthStore } from '@/stores/auth-store'

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
})

type LoginForm = z.infer<typeof loginSchema>

export default function LoginForm() {
  const router = useRouter()
  const { signIn } = useAuthStore()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState<LoginForm>({
    email: '',
    password: '',
  })
  const [errors, setErrors] = useState<Partial<Record<keyof LoginForm, string>>>({})
  const [generalError, setGeneralError] = useState<string>('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    
    try {
      const validated = loginSchema.parse(formData)
      setErrors({})
      setGeneralError('')
      
      // For development, create a mock user and set auth state
      if (process.env.NODE_ENV === 'development') {
        console.log('🔐 DEV MODE: Creating mock auth and setting user state...')
        
        // Create mock user and set it in auth store
        await signIn(validated.email, validated.password)
        
        // Small delay to show the loading state
        setTimeout(() => {
          router.push('/dashboard')
        }, 500)
        return
      }
      
      await signIn(validated.email, validated.password)
      router.push('/dashboard')
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors: Partial<Record<keyof LoginForm, string>> = {}
        error.errors.forEach((err) => {
          if (err.path[0]) {
            const fieldName = err.path[0] as keyof LoginForm
            fieldErrors[fieldName] = err.message
          }
        })
        setErrors(fieldErrors)
      } else {
        setGeneralError('Invalid email or password. Please try again.')
        console.error('Login error:', error)
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const updateField = (field: keyof LoginForm, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }))
    }
    if (generalError) {
      setGeneralError('')
    }
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Welcome Back</CardTitle>
        <CardDescription>
          Sign in to your GoodBuy HQ account
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {generalError && (
            <div className="p-3 text-sm bg-destructive/10 border border-destructive/20 text-destructive rounded-md">
              {generalError}
            </div>
          )}

          <div>
            <label htmlFor="email" className="block text-sm font-medium mb-1">
              Email Address
            </label>
            <input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => updateField('email', e.target.value)}
              className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="you@company.com"
            />
            {errors.email && (
              <p className="text-destructive text-sm mt-1">{errors.email}</p>
            )}
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium mb-1">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={formData.password}
              onChange={(e) => updateField('password', e.target.value)}
              className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="Enter your password"
            />
            {errors.password && (
              <p className="text-destructive text-sm mt-1">{errors.password}</p>
            )}
          </div>

          <div className="flex items-center justify-between">
            <Link
              href="/auth/reset-password"
              className="text-sm text-primary hover:underline"
            >
              Forgot password?
            </Link>
          </div>

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? 'Signing In...' : 'Sign In'}
          </Button>

          <div className="text-center text-sm">
            Don&apos;t have an account?{' '}
            <Link href="/auth/register" className="text-primary hover:underline">
              Sign up
            </Link>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}