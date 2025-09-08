'use client'

import { useState } from 'react'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuthStore } from '@/stores/auth-store'

const resetSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
})

type ResetForm = z.infer<typeof resetSchema>

export default function ResetPasswordForm() {
  const { resetPassword } = useAuthStore()
  const [formData, setFormData] = useState<ResetForm>({
    email: '',
  })
  const [errors, setErrors] = useState<Partial<Record<keyof ResetForm, string>>>({})
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const validated = resetSchema.parse(formData)
      setErrors({})
      setIsLoading(true)
      
      await resetPassword(validated.email)
      setIsSuccess(true)
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors: Partial<Record<keyof ResetForm, string>> = {}
        error.errors.forEach((err) => {
          if (err.path[0]) {
            const fieldName = err.path[0] as keyof ResetForm
            fieldErrors[fieldName] = err.message
          }
        })
        setErrors(fieldErrors)
      } else {
        console.error('Reset password error:', error)
      }
    } finally {
      setIsLoading(false)
    }
  }

  const updateField = (field: keyof ResetForm, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }))
    }
  }

  if (isSuccess) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle>Check Your Email</CardTitle>
          <CardDescription>
            We&apos;ve sent a password reset link to {formData.email}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Click the link in your email to reset your password. The link will expire in 24 hours.
          </p>
          <Button
            variant="outline"
            className="w-full"
            onClick={() => {
              setIsSuccess(false)
              setFormData({ email: '' })
            }}
          >
            Send Another Email
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Reset Password</CardTitle>
        <CardDescription>
          Enter your email address and we&apos;ll send you a link to reset your password
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
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

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? 'Sending Reset Link...' : 'Send Reset Link'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}