import Link from 'next/link'
import ResetPasswordForm from '@/components/auth/reset-password-form'

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-foreground">GoodBuy HQ</h1>
          <p className="text-muted-foreground mt-2">
            AI-Powered Business Intelligence
          </p>
        </div>
        <ResetPasswordForm />
        <div className="text-center mt-6">
          <Link href="/auth/login" className="text-sm text-primary hover:underline">
            Back to Sign In
          </Link>
        </div>
      </div>
    </div>
  )
}