import ProgressiveRegisterForm from '@/components/auth/progressive-register-form'

export default function RegisterPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-foreground">GoodBuy HQ</h1>
          <p className="text-muted-foreground mt-2">
            AI-Powered Business Intelligence
          </p>
        </div>
        <ProgressiveRegisterForm />
      </div>
    </div>
  )
}