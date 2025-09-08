import { z } from 'zod'

export const LoginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
})

export const RegisterSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  businessName: z.string().min(1, 'Business name is required'),
  industry: z.string().min(1, 'Please select an industry'),
  role: z.enum(['owner', 'manager', 'advisor']),
})

export const ResetPasswordSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
})

export const UpdatePasswordSchema = z.object({
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string().min(8, 'Please confirm your password'),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
})

export const UpdateProfileSchema = z.object({
  businessName: z.string().min(1, 'Business name is required'),
  industry: z.string().min(1, 'Please select an industry'),
  role: z.enum(['owner', 'manager', 'advisor']),
})

export type LoginForm = z.infer<typeof LoginSchema>
export type RegisterForm = z.infer<typeof RegisterSchema>
export type ResetPasswordForm = z.infer<typeof ResetPasswordSchema>
export type UpdatePasswordForm = z.infer<typeof UpdatePasswordSchema>
export type UpdateProfileForm = z.infer<typeof UpdateProfileSchema>

export interface AuthError {
  message: string
  field?: string
}