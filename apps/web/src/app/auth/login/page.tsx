import LoginForm from '@/components/auth/login-form'

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-foreground">GoodBuy HQ</h1>
          <p className="text-muted-foreground mt-2">
            AI-Powered Business Intelligence
          </p>
        </div>
        <LoginForm />
      </div>
    </div>
  )
}