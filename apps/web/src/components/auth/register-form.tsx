'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuthStore } from '@/stores/auth-store'

const registerSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  businessName: z.string().min(1, 'Business name is required'),
  industry: z.string().min(1, 'Please select an industry'),
  role: z.enum(['owner', 'manager', 'advisor']),
})

type RegisterForm = z.infer<typeof registerSchema>

const industries = [
  'Technology',
  'Healthcare', 
  'Finance',
  'Manufacturing',
  'Retail',
  'Real Estate',
  'Food & Beverage',
  'Education',
  'Transportation',
  'Construction',
  'Other'
]

export default function RegisterForm() {
  const router = useRouter()
  const { signUp } = useAuthStore()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState<RegisterForm>({
    email: '',
    password: '',
    businessName: '',
    industry: '',
    role: 'owner',
  })
  const [errors, setErrors] = useState<Partial<Record<keyof RegisterForm, string>>>({})

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    console.log('Form submitted with data:', formData)
    
    try {
      console.log('Validating form data...')
      const validated = registerSchema.parse(formData)
      console.log('Validation successful:', validated)
      setErrors({})
      
      console.log('Calling signUp function...')
      await signUp(validated.email, validated.password, {
        businessName: validated.businessName,
        industry: validated.industry,
        role: validated.role,
      })
      
      console.log('SignUp successful, redirecting...')
      router.push('/dashboard')
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors: Partial<Record<keyof RegisterForm, string>> = {}
        error.errors.forEach((err) => {
          if (err.path[0]) {
            const fieldName = err.path[0] as keyof RegisterForm
            fieldErrors[fieldName] = err.message
          }
        })
        setErrors(fieldErrors)
      } else {
        console.error('Registration error:', error)
        // Show a generic error message to the user
        setErrors({ email: 'Registration failed. Please try again.' })
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const updateField = (field: keyof RegisterForm, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }))
    }
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Create Account</CardTitle>
        <CardDescription>
          Join GoodBuy HQ to get AI-powered business insights
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
              placeholder="At least 8 characters"
            />
            {errors.password && (
              <p className="text-destructive text-sm mt-1">{errors.password}</p>
            )}
          </div>

          <div>
            <label htmlFor="businessName" className="block text-sm font-medium mb-1">
              Business Name
            </label>
            <input
              id="businessName"
              type="text"
              value={formData.businessName}
              onChange={(e) => updateField('businessName', e.target.value)}
              className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="Your Business Name"
            />
            {errors.businessName && (
              <p className="text-destructive text-sm mt-1">{errors.businessName}</p>
            )}
          </div>

          <div>
            <label htmlFor="industry" className="block text-sm font-medium mb-1">
              Industry
            </label>
            <select
              id="industry"
              value={formData.industry}
              onChange={(e) => updateField('industry', e.target.value)}
              className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="">Select an industry</option>
              {industries.map((industry) => (
                <option key={industry} value={industry}>
                  {industry}
                </option>
              ))}
            </select>
            {errors.industry && (
              <p className="text-destructive text-sm mt-1">{errors.industry}</p>
            )}
          </div>

          <div>
            <label htmlFor="role" className="block text-sm font-medium mb-1">
              Your Role
            </label>
            <select
              id="role"
              value={formData.role}
              onChange={(e) => updateField('role', e.target.value as RegisterForm['role'])}
              className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="owner">Business Owner</option>
              <option value="manager">Manager</option>
              <option value="advisor">Advisor</option>
            </select>
            {errors.role && (
              <p className="text-destructive text-sm mt-1">{errors.role}</p>
            )}
          </div>

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? 'Creating Account...' : 'Create Account'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}